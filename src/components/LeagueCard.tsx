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
    <div
      className={`bg-bg-panel border border-white/6 rounded-[20px] backdrop-blur-[16px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-border-glow hover:shadow-[0_16px_48px_rgba(142,68,173,0.1)] transition-all duration-300 flex flex-col gap-5 overflow-hidden font-sans ${
        isSuper ? 'super-league-card' : 'hyper-league-card'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-[0.85rem] font-extrabold text-white ${
            isSuper
              ? 'bg-gradient-to-br from-[#1e90ff] to-[#00d2ff] shadow-[0_0_12px_rgba(0,210,255,0.2)]'
              : 'bg-gradient-to-br from-[#ffd700] to-[#ff8c00] shadow-[0_0_12px_rgba(255,140,0,0.2)]'
          }`}
        >
          {isSuper ? '1500' : '2500'}
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-white">{title}</h3>
          <p className="text-[0.75rem] text-text-muted font-semibold uppercase tracking-wider">
            {subtitle}
          </p>
        </div>
      </div>

      {stats ? (
        <div className="flex flex-col gap-5 items-center">
          <div
            className={`border rounded-full w-[140px] h-[140px] flex flex-col items-center justify-center relative shadow-[0_4px_15px_rgba(0,0,0,0.2)] bg-radial from-white/2 to-transparent ${
              isSuper
                ? 'border-accent-blue/30 shadow-[inset_0_0_15px_rgba(0,210,255,0.05)]'
                : 'border-accent-orange/30 shadow-[inset_0_0_15px_rgba(255,140,0,0.05)]'
            }`}
          >
            <div className="text-[0.65rem] text-text-muted uppercase font-bold tracking-wider mb-0.5">
              PvP Stat Product
            </div>
            <div className="text-2xl font-extrabold text-white">
              {stats.percentage.toFixed(2)}%
            </div>
            <div
              className={`absolute -bottom-2.5 text-black text-[0.75rem] font-extrabold px-2.5 py-1 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${
                isSuper ? 'bg-accent-blue' : 'bg-accent-orange'
              }`}
            >
              Rank #{stats.rank}
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted font-medium">Optimal CP</span>
              <span className="font-bold text-white">{stats.cp} CP</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted font-medium">Optimal Level</span>
              <span className="font-bold text-white">Lvl {stats.level}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted font-medium">
                Rank Percentile
              </span>
              <span className="font-bold text-white">
                {(((4096 - stats.rank) / 4095) * 100).toFixed(2)}%
              </span>
            </div>
            {stats.level > 40 && (
              <div className="bg-red-500/15 border border-red-500/30 text-[#ff5555] text-[0.7rem] font-extrabold py-1 px-2.5 rounded-md text-center uppercase tracking-widest">
                Requires XL Candy
              </div>
            )}
            <div className="flex justify-between items-center text-sm mt-2 border-b border-white/6 pb-1">
              <span className="text-text-muted font-medium">Scaled Stats</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-1 w-full">
              <div className="bg-white/2 border border-white/6 rounded-lg p-2 flex flex-col items-center gap-0.5">
                <span className="text-[0.65rem] text-text-muted uppercase font-bold">
                  Atk
                </span>
                <span className="text-sm font-bold text-white">
                  {((pokemon.atk + ivAtk) * getCpm(stats.level)).toFixed(1)}
                </span>
              </div>
              <div className="bg-white/2 border border-white/6 rounded-lg p-2 flex flex-col items-center gap-0.5">
                <span className="text-[0.65rem] text-text-muted uppercase font-bold">
                  Def
                </span>
                <span className="text-sm font-bold text-white">
                  {((pokemon.def + ivDef) * getCpm(stats.level)).toFixed(1)}
                </span>
              </div>
              <div className="bg-white/2 border border-white/6 rounded-lg p-2 flex flex-col items-center gap-0.5">
                <span className="text-[0.65rem] text-text-muted uppercase font-bold">
                  HP
                </span>
                <span className="text-sm font-bold text-white">
                  {Math.floor((pokemon.hp + ivSta) * getCpm(stats.level))}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/2 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 p-10 text-text-muted text-sm font-semibold text-center h-full">
          <span className="text-3xl">⚠️</span>
          <span>
            Ineligible: Minimum CP exceeds {isSuper ? '1500' : '2500'}
          </span>
        </div>
      )}
    </div>
  )
}
