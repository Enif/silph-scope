import React, { useMemo } from 'react'
import {
  getCpm,
  calculateCp,
  calculateStatProduct,
  getLeagueRankings,
  getEvolutionChain,
  pokemonMap,
} from '../utils/pvp'
import type { Pokemon } from '../utils/pvp'

interface LevelValidatorProps {
  selectedPokemon: Pokemon
  ivAtk: number
  ivDef: number
  ivSta: number
  maxLevel: number
  inputCp: string
  inputHp: string
  onCpChange: (val: string) => void
  onHpChange: (val: string) => void
}

const keyLevels = [15, 20, 25, 30, 35, 40, 50]

export const LevelValidator: React.FC<LevelValidatorProps> = ({
  selectedPokemon,
  ivAtk,
  ivDef,
  ivSta,
  maxLevel,
  inputCp,
  inputHp,
  onCpChange,
  onHpChange,
}) => {
  // Calculate expected stats at key levels for reference
  const keyLevelStats = useMemo(() => {
    return keyLevels.map((lvl) => {
      const expectedCp = calculateCp(
        selectedPokemon.atk,
        selectedPokemon.def,
        selectedPokemon.hp,
        ivAtk,
        ivDef,
        ivSta,
        lvl,
      )
      const expectedHp = Math.max(
        10,
        Math.floor((selectedPokemon.hp + ivSta) * getCpm(lvl)),
      )
      return {
        level: lvl,
        cp: expectedCp,
        hp: expectedHp,
      }
    })
  }, [selectedPokemon, ivAtk, ivDef, ivSta])

  // Search all levels 1 to 50 for a match
  const matches = useMemo(() => {
    const cpNum = parseInt(inputCp)
    const hpNum = parseInt(inputHp)

    if (isNaN(cpNum) || isNaN(hpNum) || cpNum <= 0 || hpNum <= 0) {
      return null
    }

    const results = []
    for (let lvl = 1; lvl <= 50; lvl += 0.5) {
      const expectedCp = calculateCp(
        selectedPokemon.atk,
        selectedPokemon.def,
        selectedPokemon.hp,
        ivAtk,
        ivDef,
        ivSta,
        lvl,
      )
      const expectedHp = Math.max(
        10,
        Math.floor((selectedPokemon.hp + ivSta) * getCpm(lvl)),
      )

      if (expectedCp === cpNum && expectedHp === hpNum) {
        results.push(lvl)
      }
    }
    return results
  }, [selectedPokemon, ivAtk, ivDef, ivSta, inputCp, inputHp])

  // Generate top 2 best reachable recommendations
  const recommendations = useMemo(() => {
    if (!matches || matches.length === 0) return null

    const currentLvl = Math.min(...matches)
    const evolutionIds = getEvolutionChain(selectedPokemon.speciesId)
    const list: Array<{
      speciesName: string
      speciesNameKo: string
      league: string
      level: number
      cp: number
      rank: number
      percentile: number
    }> = []

    const leagues = [
      { name: 'Super League', cap: 1500 },
      { name: 'Hyper League', cap: 2500 },
    ]

    for (const evoId of evolutionIds) {
      const evoPokemon = pokemonMap[evoId]
      if (!evoPokemon) continue

      for (const league of leagues) {
        let bestLevel = null
        let bestCp = 0
        let bestStatProduct = 0

        // Search starting from current estimated level up to maxLevel
        for (let lvl = currentLvl; lvl <= maxLevel; lvl += 0.5) {
          const cp = calculateCp(
            evoPokemon.atk,
            evoPokemon.def,
            evoPokemon.hp,
            ivAtk,
            ivDef,
            ivSta,
            lvl,
          )
          if (cp <= league.cap) {
            const sp = calculateStatProduct(
              evoPokemon.atk,
              evoPokemon.def,
              evoPokemon.hp,
              ivAtk,
              ivDef,
              ivSta,
              lvl,
            )
            if (sp > bestStatProduct) {
              bestStatProduct = sp
              bestLevel = lvl
              bestCp = cp
            }
          }
        }

        if (bestLevel !== null) {
          // Exclude combinations where the maximum CP reachable is more than 100 CP below the cap
          if (bestCp < league.cap - 100) {
            continue
          }
          const rankings = getLeagueRankings(evoPokemon, league.cap, maxLevel)
          let rank = 4096
          const idx = rankings.findIndex(
            (r) => r.statProduct <= bestStatProduct,
          )
          if (idx !== -1) {
            rank = rankings[idx].rank
          }
          const percentile = ((4096 - rank) / 4095) * 100

          list.push({
            speciesName: evoPokemon.speciesName,
            speciesNameKo: evoPokemon.speciesNameKo,
            league: league.name,
            level: bestLevel,
            cp: bestCp,
            rank,
            percentile,
          })
        }
      }
    }

    // Sort by percentile descending (best ranks first)
    list.sort((a, b) => b.percentile - a.percentile)
    return list.slice(0, 2)
  }, [selectedPokemon, ivAtk, ivDef, ivSta, maxLevel, matches])

  return (
    <div className="flex flex-col gap-4 font-sans text-text-main">
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px]">
        📏 Level & CP Validator
      </h3>
      <p className="text-[0.8rem] text-text-muted leading-relaxed">
        Verify if this Pokémon can reach the given CP/HP at the current IVs and
        estimate its exact level.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.65rem] text-text-muted uppercase font-bold">
            CP
          </label>
          <input
            type="number"
            placeholder="e.g. 1500"
            value={inputCp}
            onChange={(e) => onCpChange(e.target.value)}
            className="w-full bg-black/35 border border-white/6 rounded-lg text-text-main py-2 px-3 text-sm outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.65rem] text-text-muted uppercase font-bold">
            HP
          </label>
          <input
            type="number"
            placeholder="e.g. 120"
            value={inputHp}
            onChange={(e) => onHpChange(e.target.value)}
            className="w-full bg-black/35 border border-white/6 rounded-lg text-text-main py-2 px-3 text-sm outline-none focus:border-accent-blue transition-all"
          />
        </div>
      </div>

      {/* Validation Banner */}
      {matches !== null && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold transition-all ${
            matches.length > 0
              ? 'bg-accent-green/10 border border-accent-green/20 text-accent-green'
              : 'bg-bar-red/10 border border-bar-red/20 text-bar-red'
          }`}
        >
          {matches.length > 0
            ? `✓ Valid! Your Pokémon is exactly Level ${matches.join(' / ')}.`
            : `❌ Impossible combination! These stats do not match the current IVs.`}
        </div>
      )}

      {/* Best Reachable Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-accent-purple/10 to-bg-panel/40 border border-accent-purple/20 rounded-xl p-3.5 flex flex-col gap-3">
          <span className="text-[0.7rem] text-accent-blue uppercase font-bold tracking-wider">
            💡 Recommended PvP Evolution Paths:
          </span>
          <div className="flex flex-col gap-2.5">
            {recommendations.map((rec, i) => (
              <div
                key={`${rec.speciesName}-${rec.league}`}
                className={`p-3 bg-white/2 border border-white/6 border-l-4 rounded-lg text-xs flex flex-col gap-1.5 hover:border-accent-blue/30 transition-all ${
                  rec.league === 'Super League'
                    ? 'border-l-accent-blue/70'
                    : 'border-l-accent-orange/70'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-[0.85rem]">
                    {i + 1}. {rec.speciesNameKo}{' '}
                    <span className="text-text-muted text-[0.7rem] font-normal">
                      ({rec.speciesName})
                    </span>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[0.65rem] uppercase ${
                      rec.league === 'Super League'
                        ? 'bg-accent-blue/15 border border-accent-blue/30 text-accent-blue'
                        : 'bg-accent-orange/15 border border-accent-orange/30 text-accent-orange'
                    }`}
                  >
                    {rec.league === 'Super League'
                      ? 'Super (1500)'
                      : 'Hyper (2500)'}
                  </span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>
                    Target Level:{' '}
                    <strong className="text-white">Lvl {rec.level}</strong> (
                    {rec.cp} CP)
                  </span>
                  <span>
                    Rank{' '}
                    <strong
                      className={
                        rec.league === 'Super League'
                          ? 'text-accent-blue'
                          : 'text-accent-orange'
                      }
                    >
                      #{rec.rank}
                    </strong>
                    <span className="text-[0.65rem] text-text-muted">
                      {' '}
                      ({rec.percentile.toFixed(2)}%)
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Stats list */}
      <div className="bg-white/2 border border-white/6 rounded-xl p-3 flex flex-col gap-2">
        <span className="text-[0.7rem] text-text-muted uppercase font-bold tracking-wider font-sans">
          Expected Stats at Key Levels (for current IVs):
        </span>
        <div className="grid grid-cols-2 gap-2">
          {keyLevelStats.map((cand) => {
            const isMatch = matches !== null && matches.includes(cand.level)
            return (
              <div
                key={cand.level}
                className={`p-2 rounded-lg border text-xs flex justify-between items-center transition-all ${
                  isMatch
                    ? 'bg-accent-green/10 border-accent-green text-white font-bold'
                    : 'bg-black/10 border-white/4 text-text-muted'
                }`}
              >
                <span>Lvl {cand.level}</span>
                <span className={isMatch ? 'text-white' : 'text-[#eee]'}>
                  {cand.cp} CP / {cand.hp} HP
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
