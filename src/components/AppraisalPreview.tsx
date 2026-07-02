import React, { useMemo } from 'react'

interface AppraisalPreviewProps {
  atk: number
  def: number
  sta: number
}

export const AppraisalPreview: React.FC<AppraisalPreviewProps> = ({ atk, def, sta }) => {
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
    <div className={`appraisal-preview ${totalIvs === 45 ? 'hundo' : ''}`}>
      <div className="appraisal-stars">
        {[1, 2, 3].map((starNum) => (
          <span
            key={starNum}
            className={`star ${appraisalStars >= starNum ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
      <div className="appraisal-info">
        <span className="appraisal-percent">{ivPercentage}% IVs</span>
        <span className="appraisal-text">
          {totalIvs === 45 ? '✨ Perfect Hundo! ✨' : `${atk}/${def}/${sta}`}
        </span>
      </div>
    </div>
  )
}
