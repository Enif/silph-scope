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
      <div className="flex flex-col gap-1.5 font-sans">
        <div className="flex justify-between text-xs font-semibold text-text-main">
          <span>{label}</span>
        </div>
        
        <div className="flex items-center">
          {/* Interactive Unified Bar Area */}
          <div className="relative flex-1 h-6 flex items-center group">
            {/* Native Invisible Range Input (overlayed for touch & click) */}
            <input
              type="range"
              min="0"
              max="15"
              value={val}
              onChange={(e) => onChange(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 appraisal-slider"
            />
            
            {/* Visual Segments (Appraisal Style) */}
            <div className="w-full h-3.5 bg-white/8 rounded-sm relative overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)] z-0">
              <div
                className={`h-full rounded-sm transition-all duration-300 ${colorClass}`}
                style={{ width: `${percentage}%` }}
              />
              <div className="absolute top-0 bottom-0 w-[2px] bg-[#12101c] opacity-85 left-[33.33%]" />
              <div className="absolute top-0 bottom-0 w-[2px] bg-[#12101c] opacity-85 left-[66.66%]" />
            </div>

            {/* Custom Glowing Slider Handle */}
            <div
              className="absolute w-1 h-5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none transition-opacity duration-150 z-10 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
              style={{ left: `calc(${percentage}% - 2px)` }}
            />
          </div>
          
          {/* Numerical Value Display */}
          <span className="text-xs font-bold min-w-[20px] text-right ml-3">{val}</span>
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
