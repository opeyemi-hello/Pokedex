export function Header() {
  return (
    <header className="bg-red-600 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
        <img src="/favicon.svg" alt="" className="size-9" />
        <div>
          <h1 className="text-2xl font-black tracking-tight">Pokédex</h1>
          <p className="text-sm text-red-100">Browse, search and favorite Pokémon</p>
        </div>
      </div>
    </header>
  )
}
