import React from 'react'
import { getIvSpreadRank } from '../utils/pvp'
import type { Pokemon } from '../utils/pvp'

interface EvolutionChainProps {
  evolutionIds: string[]
  pokemonMap: Record<string, Pokemon>
  ivAtk: number
  ivDef: number
  ivSta: number
  maxLevel: number
  selectedEvolutionId: string
  onSelectEvolution: (id: string) => void
}

const badgeColors: Record<string, string> = {
  normal: 'bg-gray-500',
  fire: 'bg-[#ee8130]',
  water: 'bg-[#6390f0]',
  electric: 'bg-[#f7d02c] text-[#111]',
  grass: 'bg-[#7ac74c]',
  ice: 'bg-[#96d9d6] text-[#111]',
  fighting: 'bg-[#c22e28]',
  poison: 'bg-[#a33ea1]',
  ground: 'bg-[#e2bf65]',
  flying: 'bg-[#a98ff3]',
  psychic: 'bg-[#f95587]',
  bug: 'bg-[#a6b91a]',
  rock: 'bg-[#b6a136]',
  ghost: 'bg-[#735797]',
  dragon: 'bg-[#6f35fc]',
  steel: 'bg-[#b7b7d0]',
  fairy: 'bg-[#d685ad]',
  dark: 'bg-[#705746]',
}

export const EvolutionChain: React.FC<EvolutionChainProps> = ({
  evolutionIds,
  pokemonMap,
  ivAtk,
  ivDef,
  ivSta,
  maxLevel,
  selectedEvolutionId,
  onSelectEvolution,
}) => {
  return (
    <div className="bg-bg-panel border border-white/6 rounded-[20px] backdrop-blur-[16px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-border-glow hover:shadow-[0_16px_48px_rgba(142,68,173,0.1)] transition-all duration-300 font-sans">
      <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent">🌱 Evolution Family Tree Analysis</h2>
      <p className="text-[0.85rem] text-text-muted mb-5 leading-relaxed">
        Compare PvP percentages for the base Pokémon and all subsequent evolution stages. Click a card to view detailed stats and IV spread tables below.
      </p>
      <div className="flex flex-col gap-3">
        {evolutionIds.map((evoId) => {
          const evoPokemon = pokemonMap[evoId]
          if (!evoPokemon) return null

          const evoSuper = getIvSpreadRank(evoPokemon, ivAtk, ivDef, ivSta, 1500, maxLevel)
          const evoHyper = getIvSpreadRank(evoPokemon, ivAtk, ivDef, ivSta, 2500, maxLevel)
          const isSelected = evoId === selectedEvolutionId

          return (
            <div
              key={evoId}
              className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer transition-all duration-300 hover:bg-white/4 hover:border-white/15 hover:translate-x-1 ${
                isSelected
                  ? 'bg-accent-purple/12 border-accent-purple shadow-[0_0_15px_rgba(142,68,173,0.08)]'
                  : 'bg-white/2 border-border-light'
              }`}
              onClick={() => onSelectEvolution(evoId)}
            >
              <div className="flex flex-col gap-1.5 flex-1">
                <h4 className="text-base font-bold text-white flex items-baseline gap-1.5">
                  {evoPokemon.speciesNameKo}
                  <span className="text-xs text-text-muted font-medium">({evoPokemon.speciesName})</span>
                </h4>
                <div className="flex gap-1.5">
                  {evoPokemon.types.filter((t) => t.toLowerCase() !== 'none').map((t) => (
                    <span
                      key={t}
                      className={`text-[0.7rem] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider text-white ${
                        badgeColors[t] || 'bg-gray-500'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-5 my-3 md:my-0 md:mx-6 justify-between md:justify-start w-full md:w-auto">
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                  <span className="text-[0.65rem] text-text-muted uppercase font-bold">Super League</span>
                  {evoSuper ? (
                    <span className="text-[0.85rem] font-medium text-[#ddd]">
                      Rank <strong className="text-white font-bold">#{evoSuper.rank}</strong>
                      <span className="text-[0.8rem] text-text-muted"> ({evoSuper.percentage.toFixed(1)}%)</span>
                    </span>
                  ) : (
                    <span className="text-[0.85rem] font-medium text-bar-red/60">Ineligible</span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 min-w-[140px]">
                  <span className="text-[0.65rem] text-text-muted uppercase font-bold">Hyper League</span>
                  {evoHyper ? (
                    <span className="text-[0.85rem] font-medium text-[#ddd]">
                      Rank <strong className="text-white font-bold">#{evoHyper.rank}</strong>
                      <span className="text-[0.8rem] text-text-muted"> ({evoHyper.percentage.toFixed(1)}%)</span>
                    </span>
                  ) : (
                    <span className="text-[0.85rem] font-medium text-bar-red/60">Ineligible</span>
                  )}
                </div>
              </div>

              <div
                className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full transition-all duration-300 self-end md:self-auto ${
                  isSelected
                    ? 'bg-accent-purple text-white'
                    : 'bg-white/5 text-text-muted hover:bg-white/10 hover:text-white'
                }`}
              >
                {isSelected ? '📊 Selected' : '🔍 View Details'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
