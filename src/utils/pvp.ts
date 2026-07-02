import pokemonData from '../data/pokemon.json'
import cpmData from '../data/cpm.json'
import pokemonKoData from '../data/pokemon_ko.json'

export interface Pokemon {
  speciesId: string
  speciesName: string
  atk: number
  def: number
  hp: number
  types: string[]
  speciesNameKo: string
}

export interface IvSpread {
  ivAtk: number
  ivDef: number
  ivSta: number
  level: number
  cp: number
  statProduct: number
  percentage: number
  rank: number
}

// Helper to translate English name to Korean
export function getKoreanName(englishName: string): string {
  const match = englishName.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/)
  if (!match) return englishName

  const basePart = match[1].trim()
  const suffixPart = match[2] ? match[2].trim() : ''

  // Look up base name translation
  const baseKo = (pokemonKoData.base as Record<string, string>)[basePart.toLowerCase()] || basePart

  if (!suffixPart) {
    return baseKo
  }

  // Look up suffix words translation
  const suffixKo = suffixPart
    .split(/\s+/)
    .map((word) => (pokemonKoData.suffixes as Record<string, string>)[word.toLowerCase()] || word)
    .join(' ')

  return `${baseKo} (${suffixKo})`
}

// Map of speciesId to Pokemon for fast lookup
const translatedPokemonList: Pokemon[] = pokemonData.map((p) => {
  return {
    ...p,
    speciesNameKo: getKoreanName(p.speciesName),
  }
})

export const pokemonList: Pokemon[] = translatedPokemonList

export const pokemonMap: Record<string, Pokemon> = translatedPokemonList.reduce((acc, p) => {
  acc[p.speciesId] = p
  return acc
}, {} as Record<string, Pokemon>)


// Retrieve CPM for a given level
export function getCpm(level: number): number {
  const index = Math.round((level - 1) * 2)
  if (index < 0 || index >= cpmData.length) {
    return cpmData[cpmData.length - 1] // Fallback to max CPM
  }
  return cpmData[index]
}

// Calculate CP
export function calculateCp(
  baseAtk: number,
  baseDef: number,
  baseHp: number,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  level: number
): number {
  const cpm = getCpm(level)
  const atk = baseAtk + ivAtk
  const def = baseDef + ivDef
  const sta = baseHp + ivSta

  const cp = Math.floor((atk * Math.sqrt(def) * Math.sqrt(sta) * (cpm * cpm)) / 10)
  return Math.max(10, cp)
}

// Calculate individual stats
export function calculateStats(
  baseAtk: number,
  baseDef: number,
  baseHp: number,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  level: number
) {
  const cpm = getCpm(level)
  return {
    atk: (baseAtk + ivAtk) * cpm,
    def: (baseDef + ivDef) * cpm,
    hp: Math.floor((baseHp + ivSta) * cpm),
  }
}

// Calculate Stat Product
export function calculateStatProduct(
  baseAtk: number,
  baseDef: number,
  baseHp: number,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  level: number
): number {
  const stats = calculateStats(baseAtk, baseDef, baseHp, ivAtk, ivDef, ivSta, level)
  return stats.atk * stats.def * stats.hp
}

// Find the best level and stats for a league cap
export function getBestStatsForLeague(
  pokemon: Pokemon,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  cpCap: number,
  maxLevel: number = 50
): { level: number; cp: number; statProduct: number } | null {
  let bestLevel = 1
  let bestCp = 10
  let bestStatProduct = 0
  let foundValid = false

  // Loop through levels 1 to maxLevel (increment by 0.5)
  for (let lvl = 1; lvl <= maxLevel; lvl += 0.5) {
    const cp = calculateCp(pokemon.atk, pokemon.def, pokemon.hp, ivAtk, ivDef, ivSta, lvl)
    if (cp <= cpCap) {
      const sp = calculateStatProduct(pokemon.atk, pokemon.def, pokemon.hp, ivAtk, ivDef, ivSta, lvl)
      if (sp > bestStatProduct) {
        bestStatProduct = sp
        bestLevel = lvl
        bestCp = cp
        foundValid = true
      }
    }
  }

  if (!foundValid) return null

  return {
    level: bestLevel,
    cp: bestCp,
    statProduct: bestStatProduct,
  }
}

// Cache for calculated rankings
const rankingsCache: Record<string, IvSpread[]> = {}

// Calculate rankings for all 4096 IV combinations
export function getLeagueRankings(
  pokemon: Pokemon,
  cpCap: number,
  maxLevel: number = 50
): IvSpread[] {
  const cacheKey = `${pokemon.speciesId}_${cpCap}_${maxLevel}`
  if (rankingsCache[cacheKey]) {
    return rankingsCache[cacheKey]
  }

  const spreads: Omit<IvSpread, 'rank' | 'percentage'>[] = []

  // Loop through all 4096 combinations
  for (let a = 0; a <= 15; a++) {
    for (let d = 0; d <= 15; d++) {
      for (let s = 0; s <= 15; s++) {
        const result = getBestStatsForLeague(pokemon, a, d, s, cpCap, maxLevel)
        if (result) {
          spreads.push({
            ivAtk: a,
            ivDef: d,
            ivSta: s,
            level: result.level,
            cp: result.cp,
            statProduct: result.statProduct,
          })
        }
      }
    }
  }

  // If no combinations are valid under the cap, return empty
  if (spreads.length === 0) {
    return []
  }

  // Sort: Stat Product desc, then CP desc, then level desc
  spreads.sort((x, y) => {
    if (Math.abs(x.statProduct - y.statProduct) > 0.001) {
      return y.statProduct - x.statProduct
    }
    if (x.cp !== y.cp) {
      return y.cp - x.cp
    }
    return y.level - x.level
  })

  const maxStatProduct = spreads[0].statProduct
  const finalRankings: IvSpread[] = spreads.map((spread, index) => {
    return {
      ...spread,
      rank: index + 1,
      percentage: (spread.statProduct / maxStatProduct) * 100,
    }
  })

  rankingsCache[cacheKey] = finalRankings
  return finalRankings
}

// Find rank info for a specific IV spread
export function getIvSpreadRank(
  pokemon: Pokemon,
  ivAtk: number,
  ivDef: number,
  ivSta: number,
  cpCap: number,
  maxLevel: number = 50
): IvSpread | null {
  const rankings = getLeagueRankings(pokemon, cpCap, maxLevel)
  const match = rankings.find(
    (r) => r.ivAtk === ivAtk && r.ivDef === ivDef && r.ivSta === ivSta
  )
  return match || null
}
