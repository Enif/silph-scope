import React from 'react'
import type { IvSpread } from '../utils/pvp'

interface OptimalIvsTableProps {
  superLeagueTop10: IvSpread[]
  hyperLeagueTop10: IvSpread[]
  ivAtk: number
  ivDef: number
  ivSta: number
}

export const OptimalIvsTable: React.FC<OptimalIvsTableProps> = ({
  superLeagueTop10,
  hyperLeagueTop10,
  ivAtk,
  ivDef,
  ivSta,
}) => {
  const renderTableRows = (top10: IvSpread[]) => {
    return top10.map((spread) => {
      const isCurrent =
        spread.ivAtk === ivAtk &&
        spread.ivDef === ivDef &&
        spread.ivSta === ivSta
      return (
        <tr
          key={`${spread.ivAtk}-${spread.ivDef}-${spread.ivSta}`}
          className={`transition-colors duration-150 ${isCurrent ? 'bg-accent-purple/20 font-bold border-y border-y-accent-purple/40' : 'hover:bg-white/2'}`}
        >
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            #{spread.rank}
          </td>
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            {spread.ivAtk}/{spread.ivDef}/{spread.ivSta}
          </td>
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            {spread.level}
          </td>
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            {spread.cp}
          </td>
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            {Math.round(spread.statProduct).toLocaleString()}
          </td>
          <td className="py-2.5 px-3 text-sm text-[#eee] border-b border-white/4">
            {spread.percentage.toFixed(2)}%
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="bg-bg-panel border border-white/6 rounded-[20px] backdrop-blur-[16px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-border-glow hover:shadow-[0_16px_48px_rgba(142,68,173,0.1)] transition-all duration-300 font-sans">
      <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent">
        🏆 Top 10 Optimal IV Spreads (Rankings)
      </h2>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px] mb-4">
            Super League (1500 Cap)
          </h3>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    IV spread
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Lvl
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    CP
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Stat Prod
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableRows(superLeagueTop10)}</tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col">
          <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px] mb-4">
            Hyper League (2500 Cap)
          </h3>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    IV spread
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Lvl
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    CP
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    Stat Prod
                  </th>
                  <th className="text-left py-2.5 px-3 text-[0.7rem] text-text-muted font-bold uppercase tracking-wider">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>{renderTableRows(hyperLeagueTop10)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
