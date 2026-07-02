import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  pokemonList,
  pokemonMap,
  getLeagueRankings,
  getIvSpreadRank,
  getCpm,
} from './utils/pvp'
import { scanAppraisalScreenshot } from './utils/scanner'
import './App.css'

function App() {
  // Input states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('pikachu')
  const [ivAtk, setIvAtk] = useState(15)
  const [ivDef, setIvDef] = useState(15)
  const [ivSta, setIvSta] = useState(15)
  const [includeLevel51, setIncludeLevel51] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Screenshot upload state
  const [scanMessage, setScanMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Get active Pokémon
  const selectedPokemon = useMemo(() => {
    return pokemonMap[selectedSpeciesId] || pokemonList[0]
  }, [selectedSpeciesId])

  // Filter pokemon list based on query
  const filteredPokemon = useMemo(() => {
    if (!searchQuery) return pokemonList.slice(0, 15)
    const query = searchQuery.toLowerCase()
    return pokemonList
      .filter(
        (p) =>
          p.speciesName.toLowerCase().includes(query) ||
          p.speciesId.toLowerCase().includes(query)
      )
      .slice(0, 15)
  }, [searchQuery])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate PvP Stats
  const maxLevel = includeLevel51 ? 51 : 50

  const superLeagueStats = useMemo(() => {
    return getIvSpreadRank(selectedPokemon, ivAtk, ivDef, ivSta, 1500, maxLevel)
  }, [selectedPokemon, ivAtk, ivDef, ivSta, maxLevel])

  const hyperLeagueStats = useMemo(() => {
    return getIvSpreadRank(selectedPokemon, ivAtk, ivDef, ivSta, 2500, maxLevel)
  }, [selectedPokemon, ivAtk, ivDef, ivSta, maxLevel])

  const superLeagueTop10 = useMemo(() => {
    return getLeagueRankings(selectedPokemon, 1500, maxLevel).slice(0, 10)
  }, [selectedPokemon, maxLevel])

  const hyperLeagueTop10 = useMemo(() => {
    return getLeagueRankings(selectedPokemon, 2500, maxLevel).slice(0, 10)
  }, [selectedPokemon, maxLevel])

  // Appraisal Stars and style calculations
  const totalIvs = ivAtk + ivDef + ivSta
  const ivPercentage = ((totalIvs / 45) * 100).toFixed(1)

  const appraisalStars = useMemo(() => {
    if (totalIvs >= 45) return 3 // Perfect Hundo
    if (totalIvs >= 37) return 3
    if (totalIvs >= 30) return 2
    if (totalIvs >= 23) return 1
    return 0
  }, [totalIvs])

  // Handle Image Upload & Canvas Scanning
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanMessage({ text: 'Processing image...', isError: false })

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setUploadedImageSrc(event.target?.result as string)
        const canvas = canvasRef.current
        if (!canvas) {
          setScanMessage({ text: 'Error: Canvas elements are not loaded yet.', isError: true })
          return
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas dimensions to match the loaded image aspect ratio
        canvas.width = img.width
        canvas.height = img.height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0)

        // Run scanner algorithm
        const result = scanAppraisalScreenshot(canvas)

        if (result.success) {
          setIvAtk(result.atk)
          setIvDef(result.def)
          setIvSta(result.hp)
          setScanMessage({
            text: `Successfully scanned! IVs detected: Atk: ${result.atk}, Def: ${result.def}, HP: ${result.hp}`,
            isError: false,
          })

          // Draw Debug bounding boxes overlay for premium interactive feel
          if (result.debugInfo) {
            const { barXStart, barXEnd, barYCoords } = result.debugInfo
            ctx.strokeStyle = 'rgba(0, 255, 128, 0.8)'
            ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005))
            
            barYCoords.forEach((y) => {
              ctx.beginPath()
              ctx.moveTo(barXStart, y)
              ctx.lineTo(barXEnd, y)
              ctx.stroke()
            })

            // Draw a green border around the detected zone
            ctx.strokeStyle = 'rgba(0, 255, 128, 0.4)'
            ctx.strokeRect(
              barXStart - 20, 
              barYCoords[0] - 20, 
              (barXEnd - barXStart) + 40, 
              (barYCoords[2] - barYCoords[0]) + 40
            )
          }
        } else {
          setScanMessage({
            text: `Scanning failed: ${result.message}`,
            isError: true,
          })
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  // Segmented Bar fill helper
  const getBarColor = (val: number) => {
    if (val === 15) return '#ff3a3a' // Perfect 15 is deep red/rose
    if (val >= 10) return '#f88536'  // 10-14 orange
    return '#f4c430' // 0-9 yellow
  }

  const renderSegmentedBar = (val: number) => {
    const percentage = (val / 15) * 100
    const color = getBarColor(val)

    return (
      <div className="iv-bar-container">
        <div className="iv-bar-background">
          <div 
            className="iv-bar-fill" 
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
          {/* Vertical Grid lines for 1/3 splits (5 and 10 marks) */}
          <div className="iv-bar-divider divider-5" />
          <div className="iv-bar-divider divider-10" />
        </div>
        <span className="iv-bar-value">{val}</span>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-wrapper">
          <div className="scope-lens">
            <div className="scope-iris"></div>
          </div>
          <h1>Silph Scope</h1>
        </div>
        <p className="app-subtitle">Pokémon GO PvP & IV Analytics Dashboard</p>
      </header>

      {/* Main Grid */}
      <main className="dashboard-grid">
        
        {/* Left column: Input & Controls */}
        <section className="dashboard-card controls-card">
          <h2 className="card-title">🔬 Pokémon Appraisal</h2>
          
          {/* Search Dropdown */}
          <div className="form-group" ref={dropdownRef}>
            <label htmlFor="pokemon-search">Select Pokémon</label>
            <div className="search-input-wrapper">
              <input
                id="pokemon-search"
                type="text"
                placeholder="Search Pokémon species (e.g. Swampert)..."
                value={searchQuery || selectedPokemon.speciesName}
                onFocus={() => {
                  setDropdownOpen(true)
                  setSearchQuery('')
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>
            {dropdownOpen && (
              <div className="pokemon-dropdown">
                {filteredPokemon.map((p) => (
                  <div
                    key={p.speciesId}
                    className={`dropdown-item ${p.speciesId === selectedSpeciesId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSpeciesId(p.speciesId)
                      setSearchQuery(p.speciesName)
                      setDropdownOpen(false)
                    }}
                  >
                    <span className="pokemon-name">{p.speciesName}</span>
                    <div className="types-badges">
                      {p.types.map((t) => (
                        <span key={t} className={`type-badge badge-${t}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredPokemon.length === 0 && (
                  <div className="dropdown-no-results">No Pokémon found</div>
                )}
              </div>
            )}
          </div>

          {/* Level settings */}
          <div className="toggle-group">
            <span className="toggle-label">Include Level 51 (Best Buddy Boost)</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={includeLevel51}
                onChange={(e) => setIncludeLevel51(e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
          </div>

          <div className="divider-line" />

          {/* IV Controls */}
          <div className="iv-sliders-section">
            <h3 className="section-subtitle">Set Individual Values (IVs)</h3>
            
            {/* Attack IV */}
            <div className="iv-slider-row">
              <div className="slider-label-row">
                <span>Attack</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={ivAtk}
                onChange={(e) => setIvAtk(parseInt(e.target.value))}
              />
              {renderSegmentedBar(ivAtk)}
            </div>

            {/* Defense IV */}
            <div className="iv-slider-row">
              <div className="slider-label-row">
                <span>Defense</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={ivDef}
                onChange={(e) => setIvDef(parseInt(e.target.value))}
              />
              {renderSegmentedBar(ivDef)}
            </div>

            {/* HP/Stamina IV */}
            <div className="iv-slider-row">
              <div className="slider-label-row">
                <span>HP</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                value={ivSta}
                onChange={(e) => setIvSta(parseInt(e.target.value))}
              />
              {renderSegmentedBar(ivSta)}
            </div>
          </div>

          {/* In-Game Appraisal Lookalike Preview */}
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
                {totalIvs === 45 ? '✨ Perfect Hundo! ✨' : `${ivAtk}/${ivDef}/${ivSta}`}
              </span>
            </div>
          </div>

          <div className="divider-line" />

          {/* Screenshot Upload Scanner */}
          <div className="screenshot-upload-zone">
            <h3 className="section-subtitle">📸 Quick Scan Screenshot</h3>
            <p className="scan-instructions">
              Upload an appraisal screen to automatically extract IVs
            </p>
            <div className="file-drop-area">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                id="screenshot-input"
              />
              <label htmlFor="screenshot-input" className="file-label">
                <span className="upload-icon">📤</span>
                <span>Select Screenshot Image</span>
              </label>
            </div>

            {scanMessage && (
              <div className={`scan-message ${scanMessage.isError ? 'error' : 'success'}`}>
                {scanMessage.text}
              </div>
            )}

            {/* Debug canvas overlay */}
            <div className="scan-preview-wrapper" style={{ display: uploadedImageSrc ? 'block' : 'none' }}>
              <span className="preview-label">Visual Scanner Scan Preview:</span>
              <canvas ref={canvasRef} className="scan-canvas" />
            </div>
          </div>
        </section>

        {/* Right column: Results & Listings */}
        <section className="dashboard-results">
          
          {/* League summaries side-by-side */}
          <div className="leagues-grid">
            
            {/* Super League (Great League) */}
            <div className="dashboard-card league-card super-league">
              <div className="league-header">
                <div className="league-badge super-badge">1500</div>
                <div>
                  <h3 className="league-title">Super League</h3>
                  <p className="league-subtitle">Great League (Max 1500 CP)</p>
                </div>
              </div>

              {superLeagueStats ? (
                <div className="league-content">
                  <div className="percentage-circle-wrapper">
                    <div className="percentage-label">PvP Stat Product</div>
                    <div className="percentage-val">{superLeagueStats.percentage.toFixed(2)}%</div>
                    <div className="rank-badge">Rank #{superLeagueStats.rank}</div>
                  </div>

                  <div className="league-details">
                    <div className="detail-row">
                      <span className="detail-name">Optimal CP</span>
                      <span className="detail-value">{superLeagueStats.cp} CP</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-name">Optimal Level</span>
                      <span className="detail-value">Lvl {superLeagueStats.level}</span>
                    </div>
                    {superLeagueStats.level > 40 && (
                      <div className="xl-badge">Requires XL Candy</div>
                    )}
                    <div className="detail-row spacing">
                      <span className="detail-name">Scaled Stats</span>
                    </div>
                    <div className="scaled-stats-grid">
                      <div className="scaled-stat-item">
                        <span className="lbl">Atk</span>
                        <span className="val">
                          {((selectedPokemon.atk + ivAtk) * getCpm(superLeagueStats.level)).toFixed(1)}
                        </span>
                      </div>
                      <div className="scaled-stat-item">
                        <span className="lbl">Def</span>
                        <span className="val">
                          {((selectedPokemon.def + ivDef) * getCpm(superLeagueStats.level)).toFixed(1)}
                        </span>
                      </div>
                      <div className="scaled-stat-item">
                        <span className="lbl">HP</span>
                        <span className="val">
                          {Math.floor((selectedPokemon.hp + ivSta) * getCpm(superLeagueStats.level))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="league-ineligible">
                  <span className="warning-icon">⚠️</span>
                  <span>Ineligible: Minimum CP exceeds 1500</span>
                </div>
              )}
            </div>

            {/* Hyper League (Ultra League) */}
            <div className="dashboard-card league-card hyper-league">
              <div className="league-header">
                <div className="league-badge hyper-badge">2500</div>
                <div>
                  <h3 className="league-title">Hyper League</h3>
                  <p className="league-subtitle">Ultra League (Max 2500 CP)</p>
                </div>
              </div>

              {hyperLeagueStats ? (
                <div className="league-content">
                  <div className="percentage-circle-wrapper">
                    <div className="percentage-label">PvP Stat Product</div>
                    <div className="percentage-val">{hyperLeagueStats.percentage.toFixed(2)}%</div>
                    <div className="rank-badge">Rank #{hyperLeagueStats.rank}</div>
                  </div>

                  <div className="league-details">
                    <div className="detail-row">
                      <span className="detail-name">Optimal CP</span>
                      <span className="detail-value">{hyperLeagueStats.cp} CP</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-name">Optimal Level</span>
                      <span className="detail-value">Lvl {hyperLeagueStats.level}</span>
                    </div>
                    {hyperLeagueStats.level > 40 && (
                      <div className="xl-badge">Requires XL Candy</div>
                    )}
                    <div className="detail-row spacing">
                      <span className="detail-name">Scaled Stats</span>
                    </div>
                    <div className="scaled-stats-grid">
                      <div className="scaled-stat-item">
                        <span className="lbl">Atk</span>
                        <span className="val">
                          {((selectedPokemon.atk + ivAtk) * getCpm(hyperLeagueStats.level)).toFixed(1)}
                        </span>
                      </div>
                      <div className="scaled-stat-item">
                        <span className="lbl">Def</span>
                        <span className="val">
                          {((selectedPokemon.def + ivDef) * getCpm(hyperLeagueStats.level)).toFixed(1)}
                        </span>
                      </div>
                      <div className="scaled-stat-item">
                        <span className="lbl">HP</span>
                        <span className="val">
                          {Math.floor((selectedPokemon.hp + ivSta) * getCpm(hyperLeagueStats.level))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="league-ineligible">
                  <span className="warning-icon">⚠️</span>
                  <span>Ineligible: Minimum CP exceeds 2500</span>
                </div>
              )}
            </div>
          </div>

          {/* Compare Table: Top 10 combinations */}
          <div className="dashboard-card table-card">
            <h2 className="card-title">🏆 Top 10 Optimal IV Spreads (Rankings)</h2>
            <div className="table-split-grid">
              
              {/* Super League Table */}
              <div className="table-column">
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
                    <tbody>
                      {superLeagueTop10.map((spread) => {
                        const isCurrent = 
                          spread.ivAtk === ivAtk && 
                          spread.ivDef === ivDef && 
                          spread.ivSta === ivSta
                        return (
                          <tr key={`${spread.ivAtk}-${spread.ivDef}-${spread.ivSta}`} className={isCurrent ? 'current-row' : ''}>
                            <td>#{spread.rank}</td>
                            <td>{spread.ivAtk}/{spread.ivDef}/{spread.ivSta}</td>
                            <td>{spread.level}</td>
                            <td>{spread.cp}</td>
                            <td>{Math.round(spread.statProduct).toLocaleString()}</td>
                            <td>{spread.percentage.toFixed(2)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hyper League Table */}
              <div className="table-column">
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
                    <tbody>
                      {hyperLeagueTop10.map((spread) => {
                        const isCurrent = 
                          spread.ivAtk === ivAtk && 
                          spread.ivDef === ivDef && 
                          spread.ivSta === ivSta
                        return (
                          <tr key={`${spread.ivAtk}-${spread.ivDef}-${spread.ivSta}`} className={isCurrent ? 'current-row' : ''}>
                            <td>#{spread.rank}</td>
                            <td>{spread.ivAtk}/{spread.ivDef}/{spread.ivSta}</td>
                            <td>{spread.level}</td>
                            <td>{spread.cp}</td>
                            <td>{Math.round(spread.statProduct).toLocaleString()}</td>
                            <td>{spread.percentage.toFixed(2)}%</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

