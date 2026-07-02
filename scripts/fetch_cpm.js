import fs from 'fs'
import path from 'path'

const url = 'https://raw.githubusercontent.com/Sigafoos/pokemongo/master/pokemon.go'
const outputPath = path.resolve('src/data/cpm.json')

async function run() {
  try {
    console.log('Fetching CPM data from Sigafoos/pokemongo...')
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const text = await res.ok ? await res.text() : ''

    // Let's locate `var CPM = []float64{` and its closing `}`
    const startIdx = text.indexOf('var CPM = []float64{')
    if (startIdx === -1) {
      throw new Error('Could not find var CPM in pokemon.go')
    }

    const endIdx = text.indexOf('}', startIdx)
    if (endIdx === -1) {
      throw new Error('Could not find closing brace for CPM')
    }

    const cpmBlock = text.substring(startIdx, endIdx)
    // Extract all floating-point numbers in the block
    const matches = cpmBlock.match(/[0-9]+\.[0-9]+/g)
    if (!matches) {
      throw new Error('No float values found in CPM block')
    }

    const cpmList = matches.map(Number)
    console.log(`Found ${cpmList.length} CPM values.`)

    // Ensure output directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(cpmList, null, 2))
    console.log(`Saved CPM list to ${outputPath}`)
  } catch (error) {
    console.error('Error processing CPM data:', error)
    process.exit(1)
  }
}

run()
