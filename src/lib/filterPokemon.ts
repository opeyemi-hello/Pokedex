import type { PokemonSummary } from '../types'

export type SortKey = 'number' | 'name'

/**
 * Pure function: same input, same output, no side effects. Components call it
 * during render, so the visible list is always *derived* from state rather than
 * stored in state (one source of truth, nothing to keep in sync).
 */
export function filterAndSort(
  pokemon: readonly PokemonSummary[],
  query: string,
  sort: SortKey,
): PokemonSummary[] {
  const q = query.trim().toLowerCase()

  // `filter` returns a new array, so sorting it in place does not touch the input.
  const matches = pokemon.filter((p) => {
    if (q === '') return true
    // "mr mime" should find "mr-mime"; "25" should find #25.
    return p.name.replaceAll('-', ' ').includes(q) || String(p.id) === q
  })

  return matches.sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) : a.id - b.id,
  )
}
