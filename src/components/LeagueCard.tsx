import React from 'react'
import { getCpm } from '../utils/pvp'
import type { Pokemon, IvSpread } from '../utils/pvp'

interface LeagueCardProps {
  title: string
  subtitle: string
  leagueType: 'super' | 'hyper'
  stats: IvSpread | null
  pokemon: Pokemon
  ivAtk: number
  ivDef: number
  ivSta: number
}

export const LeagueCard: React.FC<LeagueCardProps> = ({
  title,
  subtitle,
  leagueType,
  stats,
  pokemon,
  ivAtk,
  ivDef,
  ivSta,
}) => {
  const isSuper = leagueType === 'super'

  return (
    <div className={`dashboard-card league-card ${isSuper ? 'super-league' : 'hyper-league'}`}>
      <div className="league-header">
        <div className={`league-badge ${isSuper ? 'super-badge' : 'hyper-badge'}`}>
          {isSuper ? '1500' : '2500'}
        </div>
        <div>
          <h3 className="league-title">{title}</h3>
          <p className="league-subtitle">{subtitle}</p>
        </div>
      </div>

      {stats ? (
        <div className="league-content">
          <div className="percentage-circle-wrapper">
            <div className="percentage-label">PvP Stat Product</div>
            <div className="percentage-val">{stats.percentage.toFixed(2)}%</div>
            <div className="rank-badge">Rank #{stats.rank}</div>
          </div>

          <div className="league-details">
            <div className="detail-row">
              <span className="detail-name">Optimal CP</span>
              <span className="detail-value">{stats.cp} CP</span>
            </div>
            <div className="detail-row">
              <span className="detail-name">Optimal Level</span>
              <span className="detail-value">Lvl {stats.level}</span>
            </div>
            <div className="detail-row">
              <span className="detail-name">Rank Percentile</span>
              <span className="detail-value">{(((4096 - stats.rank) / 4095) * 100).toFixed(2)}%</span>
            </div>
            {stats.level > 40 && <div className="xl-badge">Requires XL Candy</div>}
            <div className="detail-row spacing">
              <span className="detail-name">Scaled Stats</span>
            </div>
            <div className="scaled-stats-grid">
              <div className="scaled-stat-item">
                <span className="lbl">Atk</span>
                <span className="val">
                  {((pokemon.atk + ivAtk) * getCpm(stats.level)).toFixed(1)}
                </span>
              </div>
              <div className="scaled-stat-item">
                <span className="lbl">Def</span>
                <span className="val">
                  {((pokemon.def + ivDef) * getCpm(stats.level)).toFixed(1)}
                </span>
              </div>
              <div className="scaled-stat-item">
                <span className="lbl">HP</span>
                <span className="val">{Math.floor((pokemon.hp + ivSta) * getCpm(stats.level))}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="league-ineligible">
          <span className="warning-icon">⚠️</span>
          <span>Ineligible: Minimum CP exceeds {isSuper ? '1500' : '2500'}</span>
        </div>
      )}
    </div>
  )
}
