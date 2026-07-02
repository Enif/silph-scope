import React from 'react'

interface IvSlidersProps {
  atk: number
  def: number
  sta: number
  onChangeAtk: (v: number) => void
  onChangeDef: (v: number) => void
  onChangeSta: (v: number) => void
}

export const IvSliders: React.FC<IvSlidersProps> = ({
  atk,
  def,
  sta,
  onChangeAtk,
  onChangeDef,
  onChangeSta,
}) => {
  const getBarColor = (val: number) => {
    if (val === 15) return '#ff3a3a'
    if (val >= 10) return '#f88536'
    return '#f4c430'
  }

  const renderSegmentedBar = (label: string, val: number, onChange: (v: number) => void) => {
    const percentage = (val / 15) * 100
    const color = getBarColor(val)

    return (
      <div className="iv-slider-row">
        <div className="slider-label-row">
          <span>{label}</span>
        </div>
        <input
          type="range"
          min="0"
          max="15"
          value={val}
          onChange={(e) => onChange(parseInt(e.target.value))}
        />
        <div className="iv-bar-container">
          <div className="iv-bar-background">
            <div
              className="iv-bar-fill"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
            <div className="iv-bar-divider divider-5" />
            <div className="iv-bar-divider divider-10" />
          </div>
          <span className="iv-bar-value">{val}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="iv-sliders-section">
      <h3 className="section-subtitle">Set Individual Values (IVs)</h3>
      {renderSegmentedBar('Attack', atk, onChangeAtk)}
      {renderSegmentedBar('Defense', def, onChangeDef)}
      {renderSegmentedBar('HP', sta, onChangeSta)}
    </div>
  )
}
