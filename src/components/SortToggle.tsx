import type { SortKey } from '../lib/filterPokemon'

interface SortToggleProps {
  value: SortKey
  onChange: (value: SortKey) => void
}

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'number', label: 'Number' },
  { value: 'name', label: 'A–Z' },
]

export function SortToggle({ value, onChange }: SortToggleProps) {
  return (
    <div
      role="group"
      aria-label="Sort Pokémon"
      className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-300"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            value === option.value
              ? 'bg-red-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
