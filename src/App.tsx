import { useState, useMemo } from 'react'
import {
  pokemonList,
  pokemonMap,
  getLeagueRankings,
  getIvSpreadRank,
  getEvolutionChain,
} from './utils/pvp'
import { PokemonSearch } from './components/PokemonSearch'
import { IvSliders } from './components/IvSliders'
import { AppraisalPreview } from './components/AppraisalPreview'
import { ScreenshotScanner } from './components/ScreenshotScanner'
import { EvolutionChain } from './components/EvolutionChain'
import { LeagueCard } from './components/LeagueCard'
import { OptimalIvsTable } from './components/OptimalIvsTable'
import './App.css'

function App() {
  // Input states
  const [selectedSpeciesId, setSelectedSpeciesId] = useState('pikachu')
  const [selectedEvolutionId, setSelectedEvolutionId] = useState('pikachu')
  const [ivAtk, setIvAtk] = useState(15)
  const [ivDef, setIvDef] = useState(15)
  const [ivSta, setIvSta] = useState(15)
  const [includeLevel51, setIncludeLevel51] = useState(false)

  // Get active Pokémon
  const selectedPokemon = useMemo(() => {
    return pokemonMap[selectedSpeciesId] || pokemonList[0]
  }, [selectedSpeciesId])


  // Get all evolution stages
  const evolutionIds = useMemo(() => {
    return getEvolutionChain(selectedSpeciesId)
  }, [selectedSpeciesId])

  const selectedEvolutionPokemon = useMemo(() => {
    return pokemonMap[selectedEvolutionId] || selectedPokemon
  }, [selectedEvolutionId, selectedPokemon])

  // Calculate PvP Stats for the selected evolution stage
  const maxLevel = includeLevel51 ? 51 : 50

  const superLeagueStats = useMemo(() => {
    return getIvSpreadRank(selectedEvolutionPokemon, ivAtk, ivDef, ivSta, 1500, maxLevel)
  }, [selectedEvolutionPokemon, ivAtk, ivDef, ivSta, maxLevel])

  const hyperLeagueStats = useMemo(() => {
    return getIvSpreadRank(selectedEvolutionPokemon, ivAtk, ivDef, ivSta, 2500, maxLevel)
  }, [selectedEvolutionPokemon, ivAtk, ivDef, ivSta, maxLevel])

  const superLeagueTop10 = useMemo(() => {
    return getLeagueRankings(selectedEvolutionPokemon, 1500, maxLevel).slice(0, 10)
  }, [selectedEvolutionPokemon, maxLevel])

  const hyperLeagueTop10 = useMemo(() => {
    return getLeagueRankings(selectedEvolutionPokemon, 2500, maxLevel).slice(0, 10)
  }, [selectedEvolutionPokemon, maxLevel])

  // Handler for image scanning results
  const handleScanSuccess = (atk: number, def: number, hp: number) => {
    setIvAtk(atk)
    setIvDef(def)
    setIvSta(hp)
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
          
          <PokemonSearch 
            selectedPokemon={selectedPokemon}
            onSelect={(p) => {
              setSelectedSpeciesId(p.speciesId)
              setSelectedEvolutionId(p.speciesId)
            }}
          />

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

          <IvSliders 
            atk={ivAtk}
            def={ivDef}
            sta={ivSta}
            onChangeAtk={setIvAtk}
            onChangeDef={setIvDef}
            onChangeSta={setIvSta}
          />

          <AppraisalPreview 
            atk={ivAtk}
            def={ivDef}
            sta={ivSta}
          />

          <div className="divider-line" />

          <ScreenshotScanner 
            onScanSuccess={handleScanSuccess}
          />
        </section>

        {/* Right column: Results & Listings */}
        <section className="dashboard-results">
          
          <EvolutionChain 
            evolutionIds={evolutionIds}
            pokemonMap={pokemonMap}
            ivAtk={ivAtk}
            ivDef={ivDef}
            ivSta={ivSta}
            maxLevel={maxLevel}
            selectedEvolutionId={selectedEvolutionId}
            onSelectEvolution={setSelectedEvolutionId}
          />

          {/* League summaries side-by-side */}
          <div className="leagues-grid">
            <LeagueCard 
              title={`${selectedEvolutionPokemon.speciesNameKo} Super`}
              subtitle="Great League (Max 1500 CP)"
              leagueType="super"
              stats={superLeagueStats}
              pokemon={selectedEvolutionPokemon}
              ivAtk={ivAtk}
              ivDef={ivDef}
              ivSta={ivSta}
            />

            <LeagueCard 
              title={`${selectedEvolutionPokemon.speciesNameKo} Hyper`}
              subtitle="Ultra League (Max 2500 CP)"
              leagueType="hyper"
              stats={hyperLeagueStats}
              pokemon={selectedEvolutionPokemon}
              ivAtk={ivAtk}
              ivDef={ivDef}
              ivSta={ivSta}
            />
          </div>

          <OptimalIvsTable 
            superLeagueTop10={superLeagueTop10}
            hyperLeagueTop10={hyperLeagueTop10}
            ivAtk={ivAtk}
            ivDef={ivDef}
            ivSta={ivSta}
          />
        </section>
      </main>
    </div>
  )
}

export default App
