import React, { useState, useMemo } from 'react'
import { getCpm, calculateCp } from '../utils/pvp'
import type { Pokemon } from '../utils/pvp'

interface LevelValidatorProps {
  selectedPokemon: Pokemon
  ivAtk: number
  ivDef: number
  ivSta: number
}

const keyLevels = [15, 20, 25, 30, 35, 40, 50]

export const LevelValidator: React.FC<LevelValidatorProps> = ({
  selectedPokemon,
  ivAtk,
  ivDef,
  ivSta,
}) => {
  const [inputCp, setInputCp] = useState<string>('')
  const [inputHp, setInputHp] = useState<string>('')

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
        lvl
      )
      const expectedHp = Math.max(10, Math.floor((selectedPokemon.hp + ivSta) * getCpm(lvl)))
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
        lvl
      )
      const expectedHp = Math.max(10, Math.floor((selectedPokemon.hp + ivSta) * getCpm(lvl)))

      if (expectedCp === cpNum && expectedHp === hpNum) {
        results.push(lvl)
      }
    }
    return results
  }, [selectedPokemon, ivAtk, ivDef, ivSta, inputCp, inputHp])

  return (
    <div className="flex flex-col gap-4 font-sans text-text-main">
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px]">📏 Level & CP Validator</h3>
      <p className="text-[0.8rem] text-text-muted leading-relaxed">
        Verify if this Pokémon can reach the given CP/HP at the current IVs and estimate its exact level.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.65rem] text-text-muted uppercase font-bold">CP</label>
          <input
            type="number"
            placeholder="e.g. 1500"
            value={inputCp}
            onChange={(e) => setInputCp(e.target.value)}
            className="w-full bg-black/35 border border-white/6 rounded-lg text-text-main py-2 px-3 text-sm outline-none focus:border-accent-blue transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.65rem] text-text-muted uppercase font-bold">HP</label>
          <input
            type="number"
            placeholder="e.g. 120"
            value={inputHp}
            onChange={(e) => setInputHp(e.target.value)}
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

      {/* Expected Stats list */}
      <div className="bg-white/2 border border-white/6 rounded-xl p-3 flex flex-col gap-2">
        <span className="text-[0.7rem] text-text-muted uppercase font-bold tracking-wider">
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
