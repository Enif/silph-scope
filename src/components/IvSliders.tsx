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
    if (val === 15) return 'bg-bar-red'
    if (val >= 10) return 'bg-bar-orange'
    return 'bg-bar-yellow'
  }

  const renderSegmentedBar = (label: string, val: number, onChange: (v: number) => void) => {
    const percentage = (val / 15) * 100
    const colorClass = getBarColor(val)

    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-semibold text-text-main font-sans">
          <span>{label}</span>
        </div>
        <input
          type="range"
          min="0"
          max="15"
          value={val}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="cursor-pointer"
        />
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 bg-white/8 rounded-sm relative overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]">
            <div
              className={`h-full rounded-sm transition-all duration-300 ${colorClass}`}
              style={{ width: `${percentage}%` }}
            />
            <div className="absolute top-0 bottom-0 w-[2px] bg-[#12101c] opacity-85 left-[33.33%]" />
            <div className="absolute top-0 bottom-0 w-[2px] bg-[#12101c] opacity-85 left-[66.66%]" />
          </div>
          <span className="text-xs font-bold min-w-[18px] text-right font-sans">{val}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px] font-sans">Set Individual Values (IVs)</h3>
      {renderSegmentedBar('Attack', atk, onChangeAtk)}
      {renderSegmentedBar('Defense', def, onChangeDef)}
      {renderSegmentedBar('HP', sta, onChangeSta)}
    </div>
  )
}
