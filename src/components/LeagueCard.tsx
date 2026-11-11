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
            <div
              className="text-[0.65rem] text-text-muted uppercase font-bold tracking-wider mb-0.5"
              title="1위 IV 조합의 스탯 곱(공격×방어×HP) 대비 현재 IV의 스탯 곱 비율"
            >
              스탯 곱 비율 ⓘ
            </div>
            <div className="text-2xl font-extrabold text-white">
              {stats.percentage.toFixed(2)}%
            </div>
            <div
              className={`absolute -bottom-2.5 text-black text-[0.75rem] font-extrabold px-2.5 py-1 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.3)] ${
                isSuper ? 'bg-accent-blue' : 'bg-accent-orange'
              }`}
            >
              #{stats.rank} / 4096
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted font-medium">최적 CP</span>
              <span className="font-bold text-white">{stats.cp} CP</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted font-medium">최적 레벨</span>
              <span className="font-bold text-white">Lv {stats.level}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span
                className="text-text-muted font-medium"
                title="4096가지 IV 조합 중 이 IV보다 순위가 낮은 조합의 비율"
              >
                순위 백분위 ⓘ
              </span>
              <span className="font-bold text-white">
                {(((4096 - stats.rank) / 4095) * 100).toFixed(2)}%
              </span>
            </div>
            {stats.level > 40 && (
              <div className="bg-red-500/15 border border-red-500/30 text-[#ff5555] text-[0.7rem] font-extrabold py-1 px-2.5 rounded-md text-center uppercase tracking-widest">
                XL 사탕 필요
              </div>
            )}
            <div className="flex justify-between items-center text-sm mt-2 border-b border-white/6 pb-1">
              <span className="text-text-muted font-medium">
                최적 레벨 실능치
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mt-1 w-full">
              <div className="bg-white/2 border border-white/6 rounded-lg p-2 flex flex-col items-center gap-0.5">
                <span className="text-[0.65rem] text-text-muted uppercase font-bold">
                  공격
                </span>
                <span className="text-sm font-bold text-white">
                  {((pokemon.atk + ivAtk) * getCpm(stats.level)).toFixed(1)}
                </span>
              </div>
              <div className="bg-white/2 border border-white/6 rounded-lg p-2 flex flex-col items-center gap-0.5">
                <span className="text-[0.65rem] text-text-muted uppercase font-bold">
                  방어
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
            참가 불가: 최저 CP가 {isSuper ? '1500' : '2500'}을 넘습니다
          </span>
        </div>
      )}
    </div>
  )
}
