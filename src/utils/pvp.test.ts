import { describe, it, expect } from 'vitest'
import {
  getCpm,
  calculateCp,
  getEvolutionChain,
  getLeagueRankings,
  getIvSpreadRank,
  pokemonMap,
} from './pvp'

describe('PvP Math Utility Tests', () => {
  it('should fetch correct CPM for key levels', () => {
    // Level 1 CPM
    expect(getCpm(1)).toBeCloseTo(0.094, 3)
    // Level 15 CPM
    expect(getCpm(15)).toBeCloseTo(0.51739, 4)
    // Level 40 CPM
    expect(getCpm(40)).toBeCloseTo(0.7903, 3)
    // Level 50 CPM
    expect(getCpm(50)).toBeCloseTo(0.8402, 3)
  })

  it('should calculate correct CP for Mudkip at Level 15 (15/15/15)', () => {
    // Mudkip Base Stats: Atk: 126, Def: 93, HP: 137
    // Expected CP at Lvl 15 (15/15/15) is 483 CP
    const cp = calculateCp(126, 93, 137, 15, 15, 15, 15)
    expect(cp).toBe(483)
  })

  it('should resolve the correct future evolution chain for Mudkip', () => {
    const chain = getEvolutionChain('mudkip')
    expect(chain).toEqual(['mudkip', 'marshtomp', 'swampert'])
  })

  it('should resolve a single item chain for final evolutions like Swampert', () => {
    const chain = getEvolutionChain('swampert')
    expect(chain).toEqual(['swampert'])
  })

  it('should generate all 4096 IV combinations and sort them properly', () => {
    const swampert = pokemonMap['swampert']
    expect(swampert).toBeDefined()

    const rankings = getLeagueRankings(swampert, 1500)
    expect(rankings).toHaveLength(4096)

    // First rank (Rank 1) should have the highest stat product under 1500 CP
    const rank1 = rankings[0]
    expect(rank1.rank).toBe(1)
    expect(rank1.cp).toBeLessThanOrEqual(1500)
    expect(rank1.percentage).toBe(100)

    // Ranks should be sorted desc by statProduct
    expect(rankings[0].statProduct).toBeGreaterThanOrEqual(
      rankings[1].statProduct,
    )
  })

  it('should fetch specific rank info correctly', () => {
    const swampert = pokemonMap['swampert']
    const spreadRank = getIvSpreadRank(swampert, 0, 14, 14, 1500)

    expect(spreadRank).not.toBeNull()
    expect(spreadRank!.rank).toBe(1) // 0/14/14 is the rank 1 Swampert spread in Super League
    expect(spreadRank!.level).toBe(19)
    expect(spreadRank!.cp).toBe(1498)
  })
})
