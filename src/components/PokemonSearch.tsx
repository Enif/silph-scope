import React, { useState, useEffect, useMemo, useRef } from 'react'
import { pokemonList } from '../utils/pvp'
import type { Pokemon } from '../utils/pvp'

interface PokemonSearchProps {
  selectedPokemon: Pokemon
  onSelect: (pokemon: Pokemon) => void
}

const badgeColors: Record<string, string> = {
  normal: 'bg-[#a8a77a]',
  fire: 'bg-[#ee8130]',
  water: 'bg-[#6390f0]',
  electric: 'bg-[#f7d02c] text-[#111]',
  grass: 'bg-[#7ac74c]',
  ice: 'bg-[#96d9d6] text-[#111]',
  fighting: 'bg-[#c22e28]',
  poison: 'bg-[#a33ea1]',
  ground: 'bg-[#e2bf65]',
  flying: 'bg-[#a98ff3]',
  psychic: 'bg-[#f95587]',
  bug: 'bg-[#a6b91a]',
  rock: 'bg-[#b6a136]',
  ghost: 'bg-[#735797]',
  dragon: 'bg-[#6f35fc]',
  steel: 'bg-[#b7b7d0]',
  fairy: 'bg-[#d685ad]',
  dark: 'bg-[#705746]',
}

export const PokemonSearch: React.FC<PokemonSearchProps> = ({ selectedPokemon, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const filteredPokemon = useMemo(() => {
    if (!searchQuery) return pokemonList.slice(0, 15)
    const query = searchQuery.toLowerCase()
    return pokemonList
      .filter(
        (p) =>
          p.speciesName.toLowerCase().includes(query) ||
          p.speciesId.toLowerCase().includes(query) ||
          p.speciesNameKo.toLowerCase().includes(query)
      )
      .slice(0, 15)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate displayed input value on the fly, avoiding useEffect synchronization
  const inputValue = dropdownOpen
    ? searchQuery
    : `${selectedPokemon.speciesNameKo} (${selectedPokemon.speciesName})`

  return (
    <div className="flex flex-col gap-2 relative font-sans" ref={dropdownRef}>
      <label htmlFor="pokemon-search" className="text-xs uppercase tracking-wider text-text-muted font-bold">
        Select Pokémon
      </label>
      <div className="relative w-full">
        <input
          id="pokemon-search"
          type="text"
          placeholder="Search Pokémon species (e.g. Swampert, 대짱이)..."
          value={inputValue}
          onFocus={() => {
            setDropdownOpen(true)
            setSearchQuery('')
          }}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-black/30 border border-white/6 rounded-xl text-text-main py-3.5 px-4 pr-11 text-base outline-none focus:border-accent-blue focus:shadow-[0_0_12px_rgba(0,210,255,0.2)] transition-all duration-300"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none opacity-60">🔍</span>
      </div>
      {dropdownOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#151322] border border-white/12 rounded-xl mt-1.5 max-h-[280px] overflow-y-auto z-50 shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
          {filteredPokemon.map((p) => {
            const isActive = p.speciesId === selectedPokemon.speciesId
            return (
              <div
                key={p.speciesId}
                className={`flex items-center justify-between p-3 px-4 cursor-pointer hover:bg-accent-purple/25 border-l-4 hover:border-l-accent-blue transition-all duration-300 ${
                  isActive ? 'bg-accent-purple/25 border-l-accent-blue' : 'border-l-transparent'
                }`}
                onClick={() => {
                  onSelect(p)
                  setDropdownOpen(false)
                }}
              >
                <span className="font-semibold text-[0.95rem]">
                  {p.speciesNameKo} <span className="text-xs text-text-muted font-medium ml-1.5">({p.speciesName})</span>
                </span>
                <div className="flex gap-1.5">
                  {p.types.map((t) => (
                    <span
                      key={t}
                      className={`text-[0.7rem] font-bold uppercase px-2 py-0.5 rounded-md tracking-wider text-white ${
                        badgeColors[t] || 'bg-gray-500'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
          {filteredPokemon.length === 0 && (
            <div className="p-4 text-center text-text-muted text-sm">No Pokémon found</div>
          )}
        </div>
      )}
    </div>
  )
}
