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
    <div className="max-w-[1300px] mx-auto pb-[60px] px-4 font-sans">
      {/* Header */}
      <header className="text-center mb-10 p-5 relative flex flex-col items-center">
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-accent-purple to-accent-blue rounded-full flex items-center justify-center p-0.5 shadow-[0_0_20px_rgba(0,210,255,0.3)] hover:scale-105 transition-all duration-300 relative overflow-hidden group">
            <div className="w-full h-full bg-[#0a0910] rounded-full border-[3px] border-[#0a0910] relative flex items-center justify-center before:content-[''] before:absolute before:w-3 before:h-3 before:bg-accent-green before:rounded-full before:shadow-[0_0_8px_rgba(0,255,136,0.2)] animate-rotate-lens"></div>
          </div>
          <h1 className="text-[2.5rem] font-black uppercase tracking-[4px] m-0 bg-gradient-to-r from-white via-[#f3f2fa] to-text-muted bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Silph Scope
          </h1>
        </div>
        <p className="text-xs text-accent-blue font-bold uppercase tracking-[3px] m-0 drop-shadow-[0_0_8px_rgba(0,210,255,0.2)]">
          Pokémon GO PvP & IV Analytics Dashboard
        </p>
      </header>

      {/* Main Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-7 items-start">
        
        {/* Left column: Input & Controls */}
        <section className="bg-bg-panel border border-white/6 rounded-[20px] backdrop-blur-[16px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-border-glow hover:shadow-[0_16px_48px_rgba(142,68,173,0.1)] transition-all duration-300 flex flex-col gap-6">
          <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-white to-text-muted bg-clip-text text-transparent">🔬 Pokémon Appraisal</h2>
          
          <PokemonSearch 
            selectedPokemon={selectedPokemon}
            onSelect={(p) => {
              setSelectedSpeciesId(p.speciesId)
              setSelectedEvolutionId(p.speciesId)
            }}
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-text-muted font-bold uppercase tracking-wider">Include Level 51 (Best Buddy Boost)</span>
            <label className="relative inline-block w-[46px] h-[24px]">
              <input
                type="checkbox"
                checked={includeLevel51}
                onChange={(e) => setIncludeLevel51(e.target.checked)}
                className="opacity-0 w-0 h-0 peer"
              />
              <span className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-white/10 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-[18px] before:w-[18px] before:left-[3px] before:bottom-[3px] before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-accent-purple peer-checked:before:translate-x-[22px]"></span>
            </label>
          </div>

          <div className="h-[1px] bg-white/6 w-full" />

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

          <div className="h-[1px] bg-white/6 w-full" />

          <ScreenshotScanner 
            onScanSuccess={handleScanSuccess}
          />
        </section>

        {/* Right column: Results & Listings */}
        <section className="flex flex-col gap-7">
          
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
