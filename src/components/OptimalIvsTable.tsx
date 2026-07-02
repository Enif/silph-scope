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
        spread.ivAtk === ivAtk && spread.ivDef === ivDef && spread.ivSta === ivSta
      return (
        <tr
          key={`${spread.ivAtk}-${spread.ivDef}-${spread.ivSta}`}
          className={isCurrent ? 'current-row' : ''}
        >
          <td>#{spread.rank}</td>
          <td>
            {spread.ivAtk}/{spread.ivDef}/{spread.ivSta}
          </td>
          <td>{spread.level}</td>
          <td>{spread.cp}</td>
          <td>{Math.round(spread.statProduct).toLocaleString()}</td>
          <td>{spread.percentage.toFixed(2)}%</td>
        </tr>
      )
    })
  }

  return (
    <div className="dashboard-card table-card">
      <h2 className="card-title">🏆 Top 10 Optimal IV Spreads (Rankings)</h2>
      <div className="table-split-grid">
        <div className="table-column animate-fade-in">
          <h3 className="table-column-title">Super League (1500 Cap)</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>IV spread</th>
                  <th>Lvl</th>
                  <th>CP</th>
                  <th>Stat Prod</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>{renderTableRows(superLeagueTop10)}</tbody>
            </table>
          </div>
        </div>

        <div className="table-column animate-fade-in">
          <h3 className="table-column-title">Hyper League (2500 Cap)</h3>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>IV spread</th>
                  <th>Lvl</th>
                  <th>CP</th>
                  <th>Stat Prod</th>
                  <th>%</th>
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
