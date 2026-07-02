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
    <div className="dashboard-card evolution-card">
      <h2 className="card-title">🌱 Evolution Family Tree Analysis</h2>
      <p className="section-description">
        Compare PvP percentages for the base Pokémon and all subsequent evolution stages. Click a card to view detailed stats and IV spread tables below.
      </p>
      <div className="evolution-list">
        {evolutionIds.map((evoId) => {
          const evoPokemon = pokemonMap[evoId]
          if (!evoPokemon) return null

          const evoSuper = getIvSpreadRank(evoPokemon, ivAtk, ivDef, ivSta, 1500, maxLevel)
          const evoHyper = getIvSpreadRank(evoPokemon, ivAtk, ivDef, ivSta, 2500, maxLevel)
          const isSelected = evoId === selectedEvolutionId

          return (
            <div
              key={evoId}
              className={`evolution-item-card ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectEvolution(evoId)}
            >
              <div className="evo-info-sec">
                <h4 className="evo-name">
                  {evoPokemon.speciesNameKo}
                  <span className="evo-eng">({evoPokemon.speciesName})</span>
                </h4>
                <div className="types-badges">
                  {evoPokemon.types.map((t) => (
                    <span key={t} className={`type-badge badge-${t}`}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="evo-leagues">
                <div className="evo-league-result">
                  <span className="league-lbl">Super League</span>
                  {evoSuper ? (
                    <span className="league-val">
                      Rank <strong className="rank-num">#{evoSuper.rank}</strong>
                      <span className="pct-num"> ({evoSuper.percentage.toFixed(1)}%)</span>
                    </span>
                  ) : (
                    <span className="league-val ineligible">Ineligible</span>
                  )}
                </div>
                <div className="evo-league-result">
                  <span className="league-lbl">Hyper League</span>
                  {evoHyper ? (
                    <span className="league-val">
                      Rank <strong className="rank-num">#{evoHyper.rank}</strong>
                      <span className="pct-num"> ({evoHyper.percentage.toFixed(1)}%)</span>
                    </span>
                  ) : (
                    <span className="league-val ineligible">Ineligible</span>
                  )}
                </div>
              </div>

              <div className="click-indicator">
                {isSelected ? '📊 Selected' : '🔍 View Details'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
