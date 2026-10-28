// src/components/PokemonGrid.tsx
import type { PokemonSummary } from '../types'
import { PokemonCard } from './PokemonCard'

interface PokemonGridProps {
  pokemon: PokemonSummary[]
}

export function PokemonGrid({ pokemon }: PokemonGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {pokemon.map((p) => (
        // `key` lets React match each list item to the same DOM node between renders.
        <li key={p.id}>
          <PokemonCard pokemon={p} />
        </li>
      ))}
    </ul>
  )
}
