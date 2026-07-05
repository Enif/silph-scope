import React, { useMemo } from 'react'

interface AppraisalPreviewProps {
  atk: number
  def: number
  sta: number
}

export const AppraisalPreview: React.FC<AppraisalPreviewProps> = ({
  atk,
  def,
  sta,
}) => {
  const totalIvs = atk + def + sta
  const ivPercentage = ((totalIvs / 45) * 100).toFixed(1)

  const appraisalStars = useMemo(() => {
    if (totalIvs >= 45) return 3
    if (totalIvs >= 37) return 3
    if (totalIvs >= 30) return 2
    if (totalIvs >= 23) return 1
    return 0
  }, [totalIvs])

  return (
    <div
      className={`flex items-center justify-between p-4 border border-dashed border-border-light rounded-xl bg-radial from-white/3 to-black/15 transition-all duration-300 ${
        totalIvs === 45
          ? 'border-accent-orange bg-gradient-to-br from-accent-orange/15 to-bg-panel/40 shadow-[0_0_15px_rgba(255,127,80,0.1)]'
          : ''
      }`}
    >
      <div className="flex gap-1">
        {[1, 2, 3].map((starNum) => {
          const isFilled = appraisalStars >= starNum
          return (
            <span
              key={starNum}
              className={`text-2xl transition-all duration-300 ${
                isFilled
                  ? totalIvs === 45
                    ? 'text-accent-orange drop-shadow-[0_0_10px_rgba(255,127,80,0.6)]'
                    : 'text-bar-yellow drop-shadow-[0_0_8px_rgba(244,196,48,0.5)]'
                  : 'text-white/15'
              }`}
            >
              ★
            </span>
          )
        })}
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-base font-extrabold text-white">
          {ivPercentage}% IVs
        </span>
        <span className="text-xs text-text-muted font-semibold uppercase font-sans">
          {totalIvs === 45 ? '✨ Perfect Hundo! ✨' : `${atk}/${def}/${sta}`}
        </span>
      </div>
    </div>
  )
}
