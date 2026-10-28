interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

/**
 * A *controlled* input: React state is the single source of truth for `value`,
 * and every keystroke flows back up through `onChange`.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex-1">
      <label htmlFor="search" className="sr-only">
        Search Pokémon by name or number
      </label>
      <input
        id="search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search by name or number…"
        autoComplete="off"
        className="w-full rounded-xl border-0 bg-white px-4 py-2.5 shadow-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-red-500 focus:outline-none"
      />
    </div>
  )
}
