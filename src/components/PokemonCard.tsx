import { artworkUrl } from '../api/pokeapi'
import formatId, { formatName } from '../lib/format'
import type { PokemonSummary } from '../types'

interface PokemonCardProps {
  pokemon: PokemonSummary
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <article className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md">
      <img
        src={artworkUrl(pokemon.id)}
        alt={formatName(pokemon.name)}
        width={112}
        height={112}
        loading="lazy"
        className="size-28 object-contain"
      />
      <span className="text-xs font-semibold text-slate-400">
        {formatId(pokemon.id)}
      </span>
      <h2 className="text-base font-bold">{formatName(pokemon.name)}</h2>
    </article>
  )
}

