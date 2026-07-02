import React, { useState, useEffect, useMemo, useRef } from 'react'
import { pokemonList } from '../utils/pvp'
import type { Pokemon } from '../utils/pvp'

interface PokemonSearchProps {
  selectedPokemon: Pokemon
  onSelect: (pokemon: Pokemon) => void
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
    <div className="form-group" ref={dropdownRef}>
      <label htmlFor="pokemon-search">Select Pokémon</label>
      <div className="search-input-wrapper">
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
        />
        <span className="search-icon">🔍</span>
      </div>
      {dropdownOpen && (
        <div className="pokemon-dropdown">
          {filteredPokemon.map((p) => (
            <div
              key={p.speciesId}
              className={`dropdown-item ${p.speciesId === selectedPokemon.speciesId ? 'active' : ''}`}
              onClick={() => {
                onSelect(p)
                setDropdownOpen(false)
              }}
            >
              <span className="pokemon-name">
                {p.speciesNameKo} <span className="eng-name">({p.speciesName})</span>
              </span>
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
  )
}
