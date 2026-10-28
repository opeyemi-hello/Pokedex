                                                                                                                                                                                                                                                                                                                                                                                                                                   
// import { Header } from './components/Header'
// import { PokemonGrid } from './components/PokemonGrid'
// import { samplePokemon } from './data/samplePokemon'

// function App() {
//   return (
//     <div className="min-h-screen bg-slate-100 text-slate-900">
//       <Header />
//       <main className="mx-auto max-w-6xl px-4 py-6">
//         <PokemonGrid pokemon={samplePokemon} />
//       </main>
//     </div>
//   )
// }

// export default App

import { useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { Header } from './components/Header'
import { PokemonGrid } from './components/PokemonGrid'
import { SearchBar } from './components/SearchBar'
import { SortToggle } from './components/SortToggle'
import { samplePokemon } from './data/samplePokemon'
import { filterAndSort, type SortKey } from './lib/filterPokemon'

function App() {
  // State lives in the closest common parent of everything that needs it.
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('number')

  const visible = filterAndSort(samplePokemon, query, sort)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={setQuery} />
          <SortToggle value={sort} onChange={setSort} />
        </div>

        <p className="text-sm text-slate-500" aria-live="polite">
          {visible.length} Pokémon
        </p>

        {visible.length > 0 ? (
          <PokemonGrid pokemon={visible} />
        ) : (
          <EmptyState message={`No Pokémon match “${query.trim()}”.`} />
        )}
      </main>
    </div>
  )
}

export default App
