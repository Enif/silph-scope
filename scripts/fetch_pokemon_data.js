import fs from 'fs'
import path from 'path'

const url = 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json'
const outputPath = path.resolve('src/data/pokemon.json')

async function run() {
  try {
    console.log('Fetching GameMaster from PvPoke...')
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const data = await res.json()

    if (!data.pokemon || !Array.isArray(data.pokemon)) {
      throw new Error('Invalid gamemaster format: no pokemon array found')
    }

    console.log(`Found ${data.pokemon.length} Pokémon entries. Processing...`)

    const cleanedPokemon = data.pokemon.map((p) => {
      // Map baseStats structure
      const atk = p.baseStats?.atk || 0
      const def = p.baseStats?.def || 0
      const hp = p.baseStats?.hp || 0

      return {
        speciesId: p.speciesId,
        speciesName: p.speciesName,
        atk,
        def,
        hp,
        types: p.types || [],
        family: p.family || null,
      }
    })

    // Ensure output directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(cleanedPokemon, null, 2))
    console.log(`Saved ${cleanedPokemon.length} Pokémon entries to ${outputPath}`)
  } catch (error) {
    console.error('Error fetching or processing Pokémon data:', error)
    process.exit(1)
  }
}

run()
