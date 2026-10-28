# Pokédex: a step-by-step React walkthrough

Build a Pokédex with **React 19**, **TypeScript**, **Vite** and **Tailwind CSS v4**, from an empty folder to an accessible, polished app that fetches live data.

You will learn, in this order:

| Stage | You build | You learn |
|---|---|---|
| [0](#stage-0--setup) | Project scaffold | Tooling: Vite, TypeScript, Tailwind, dev server |
| [1](#stage-1--static-ui) | A grid of cards (hardcoded data) | Components, props, JSX, lists and keys, Tailwind layout |
| [2](#stage-2--state) | Search and sort | `useState`, controlled inputs, derived state, lifting state |
| [3](#stage-3--data-fetching) | Live data from PokéAPI | `useEffect`, `fetch`, loading/error states, cleanup, validation |
| [4](#stage-4--detail-view-and-type-filter) | Detail modal and type filter | Dependent effects, `useRef`, the `key` prop, focus management |
| [5](#stage-5--custom-hooks) | Reusable data hooks | Custom hooks, race conditions, derived async state |
| [6](#stage-6--global-state) | Favorites that persist | `useContext`, `useReducer`, `useMemo`, `localStorage` |
| [7](#stage-7--polish) | Error boundary, dark mode, reduced motion | Error boundaries, Tailwind variants, accessibility |

## How to use this guide

**Two ways to follow along:**

1. **Build it yourself.** Create an empty project and type each stage's files. Do this: typing the code is how it sticks.
2. **Read and compare.** Every stage is a git tag. Jump to any point, or see exactly what a stage changed:

```bash
git checkout stage-3              # the project as it is at the end of stage 3
git diff stage-2 stage-3          # everything stage 3 changed
git diff --stat stage-2 stage-3   # just which files
git checkout main                 # back to the finished app
```

Every code block below is pulled from the matching git tag, so what you read is exactly what ran.

**Companion documents:**

- [`PACKAGES.md`](./PACKAGES.md): every package, why it is installed, and where it is used.
- [`REFERENCE.md`](./REFERENCE.md): every component, hook and function with its signature and purpose.

## Prerequisites

- **Node.js 20.19 or newer, or 22.12 or newer** (Vite 8 requires it; this project was built on Node 24).
- **pnpm** (`npm i -g pnpm`). `npm` and `yarn` work too; swap the commands.
- A code editor with TypeScript support (VS Code is fine).
- Basic JavaScript: functions, arrays (`map`, `filter`), `async`/`await`, destructuring.
[text](<../pokemon project/WALKTHROUGH.md>)
No API key or account is needed. PokéAPI is free and public.

## The data source

[PokéAPI](https://pokeapi.co) exposes three endpoints we use:

| Endpoint | Returns | Used for |
|---|---|---|
| `GET /api/v2/pokemon?limit=1025` | `{ results: [{ name, url }] }` | The whole list (names and ids only) |
| `GET /api/v2/pokemon/{id}` | Types, stats, abilities, height, weight | The detail modal |
| `GET /api/v2/type/{name}` | Every Pokémon of that type | The type filter |

Two facts shape the design:

- The list endpoint returns only **names and URLs**, not types or stats. So a card can show a name, an id (parsed from the URL) and artwork, but anything richer needs a **second request**. This "list, then detail" shape is extremely common in real APIs.
- Ids 1–1025 are the base Pokédex. Ids from 10001 up are alternate forms (Mega, regional...) that we deliberately ignore.

---

## Stage 0 · Setup

**Goal:** a running dev server with TypeScript and Tailwind wired up.

### Steps

**1. Create the project.**

```bash
pnpm create vite@latest pokedex-react --template react-ts
cd pokedex-react
pnpm install
```

This scaffolds a Vite project with React and TypeScript. Vite is the dev server and bundler: it serves your files instantly during development and produces an optimized bundle for production.

**2. Add Tailwind CSS.**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

Tailwind v4 needs no `tailwind.config.js` and no PostCSS setup. You register a Vite plugin and import Tailwind in your CSS.

**3. Register the plugin.**

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**4. Import Tailwind.** Replace the contents of `src/index.css`:

```css
// src/index.css
@import 'tailwindcss';
```

**5. Remove the template boilerplate.** Delete `src/App.css`, `src/assets/` and `public/icons.svg`. We do not use them.

**6. Replace `src/App.tsx`** with a minimal page to prove Tailwind works:

```tsx
// src/App.tsx
function App() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <h1 className="p-8 text-4xl font-black tracking-tight text-red-600">
        Pokédex
      </h1>
      <p className="px-8 text-slate-600">
        Vite, React, TypeScript and Tailwind are wired up.
      </p>
    </main>
  )
}

export default App
```

**7. Turn on strict type-checking.** In `tsconfig.app.json`, add `"strict": true` under the `/* Linting */` comment. Strict mode catches whole categories of bugs (`null` where you expected a value, implicit `any`) at compile time.

```json
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
```

**8. Run it.**

```bash
pnpm dev
```

Open the printed URL (usually `http://localhost:5173`).

### How it works

- `index.html` contains `<div id="root">` and a script tag pointing at `src/main.tsx`.
- `main.tsx` calls `createRoot(...).render(<App />)`: React takes over that `div`.
- Class names such as `text-4xl font-black text-red-600` are Tailwind **utility classes**. Each one maps to a single CSS declaration, and Tailwind only generates CSS for the classes it finds in your source files.
- `pnpm build` runs `tsc -b` (type-check) then `vite build` (bundle). A type error fails the build.

### Checkpoint

You see a red **Pokédex** heading on a light grey page. Edit the text and save: the browser updates without a reload (hot module replacement).

### Pitfalls

- **Tailwind classes do nothing:** check that `src/index.css` is imported in `main.tsx` and that `tailwindcss()` is in the plugins array.
- **Port already in use:** `pnpm dev --port 5174`.

Stage 0 is the starting point, so there is nothing to diff against. Every later stage ends with a `git diff --stat` command you can run.

---

## Stage 1 · Static UI

**Goal:** render a responsive grid of Pokémon cards from a hardcoded array.

**You will learn:** components, props, JSX, rendering lists, the `key` prop, TypeScript interfaces, responsive Tailwind classes.

### Concepts

- A **component** is a function that returns JSX. Names start with a capital letter.
- **Props** are the function's single argument: how a parent passes data down. They are read-only.
- JSX is JavaScript. Curly braces `{}` embed any expression, so `pokemon.map(...)` turns an array into elements.
- Each item in a rendered list needs a stable **`key`** so React can match old and new items between renders.

### Steps

**1. Define the data shape.**

```ts
// src/types.ts
/** The minimum we need to draw a card: an id, a name, and (derived) artwork. */
export interface PokemonSummary {
  id: number
  name: string
}
```

**2. Add a helper for artwork URLs.** Official artwork lives in a public GitHub repo, addressed by id, so no extra request is needed.

```ts
// src/api/pokeapi.ts
/**
 * Official artwork lives in a public GitHub repo keyed by Pokémon id, so a card
 * can show an image without a second network request.
 */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}
```

**3. Add formatting helpers.** These are plain functions with no React in them, which keeps them easy to read and reason about.

```ts
// src/lib/format.ts
/** "mr-mime" -> "Mr Mime" */
export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** 25 -> "#0025" */
export function formatId(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}
```

**4. Add sample data.**

```ts
// src/data/samplePokemon.ts
import type { PokemonSummary } from '../types'

/** Hardcoded data for stages 1-2. Stage 3 replaces this with PokéAPI. */
export const samplePokemon: PokemonSummary[] = [
  { id: 1, name: 'bulbasaur' },
  { id: 4, name: 'charmander' },
  { id: 7, name: 'squirtle' },
  { id: 25, name: 'pikachu' },
  { id: 39, name: 'jigglypuff' },
  { id: 52, name: 'meowth' },
  { id: 94, name: 'gengar' },
  { id: 122, name: 'mr-mime' },
  { id: 133, name: 'eevee' },
  { id: 143, name: 'snorlax' },
  { id: 150, name: 'mewtwo' },
  { id: 249, name: 'lugia' },
]
```

**5. Create the components.**

```tsx
// src/components/Header.tsx
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
```

```tsx
// src/components/PokemonCard.tsx
import { artworkUrl } from '../api/pokeapi'
import { formatId, formatName } from '../lib/format'
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
```

```tsx
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
```

**6. Compose them in `App`.**

```tsx
// src/App.tsx
import { Header } from './components/Header'
import { PokemonGrid } from './components/PokemonGrid'
import { samplePokemon } from './data/samplePokemon'

function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <PokemonGrid pokemon={samplePokemon} />
      </main>
    </div>
  )
}

export default App
```

### How it works

- `PokemonGrid` receives an array and renders one `PokemonCard` per item. `key={p.id}` uses the id because it is unique and stable, never the array index (the index changes when the list is reordered).
- `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6` is **mobile-first**: two columns by default, three from the `sm` breakpoint up, and so on.
- `width`/`height` on `<img>` reserve space so the layout does not jump as images load, and `loading="lazy"` defers off-screen images.
- `interface PokemonCardProps` documents and enforces what a component accepts. Passing a wrong prop is a compile error, not a runtime surprise.

### Checkpoint

Twelve cards with artwork, an `#0025`-style number and a capitalized name. Resize the window: the column count changes.

### Pitfalls

- **Forgot `key`:** React warns in the console. Never use the array index as a key for lists that can reorder or filter.
- **Component names in lowercase:** `<pokemonCard />` is treated as an HTML tag. Components must be capitalized.

```bash
git diff --stat stage-0 stage-1
```

---

## Stage 2 · State

**Goal:** a search box and a sort toggle that update the grid instantly.

**You will learn:** `useState`, controlled inputs, derived state, lifting state up, conditional rendering.

### Concepts

- **State** is data that changes over time and should cause a re-render when it does. `useState(initial)` returns `[value, setValue]`.
- Calling `setValue` does not change the variable immediately. It schedules a re-render, and the next render sees the new value.
- **Controlled input:** the input's `value` comes from state and every keystroke calls `setState`. React state is the single source of truth.
- **Derived state:** if you can compute something from existing state, compute it during render. Do not store it in a second `useState`. Here the visible list is *derived* from `query`, `sort` and the data.
- **Lifting state up:** when two siblings need the same data, move the state to their closest common parent.

### Steps

**1. Write the filtering logic as a pure function.** Pure functions (same input, same output, no side effects) are the easiest code to reason about.

```ts
// src/lib/filterPokemon.ts
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
```

**2. Build the controls.**

```tsx
// src/components/SearchBar.tsx
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
```

```tsx
// src/components/SortToggle.tsx
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
```

```tsx
// src/components/EmptyState.tsx
interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center text-slate-500">
      <p className="text-lg font-semibold">{message}</p>
    </div>
  )
}
```

**3. Own the state in `App`.**

```tsx
// src/App.tsx
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
```

### How it works

- `SearchBar` and `SortToggle` are "dumb": they receive `value` and `onChange` and hold no state. `App` owns it.
- Every keystroke: `onChange` → `setQuery` → `App` re-renders → `filterAndSort` runs → the grid updates. There is no manual DOM work.
- The `<label className="sr-only">` keeps the input accessible to screen readers without showing visible text.
- `aria-pressed` tells assistive technology which sort button is active.
- `aria-live="polite"` on the count makes a screen reader announce changes ("5 Pokémon") without interrupting.

### Checkpoint

Type `char` and the grid shrinks to Charmander. Type `25` and you get Pikachu. Type `mr mime` and it matches `mr-mime`. Click **A–Z** to re-sort. A nonsense query shows the empty state.

### Pitfalls

- **Mutating state:** `state.push(x)` does not trigger a re-render. Always create a new array or object. (Note that `filterAndSort` sorts a *new* array returned by `filter`, so it never mutates its input.)
- **Storing derived data in state:** a second `useState` for "filtered list" must be kept in sync by hand and will eventually drift.

```bash
git diff --stat stage-1 stage-2
```

---

## Stage 3 · Data fetching

**Goal:** replace the hardcoded array with all 1025 Pokémon from PokéAPI, with proper loading and error states.

**You will learn:** `useEffect`, the dependency array, effect cleanup, `AbortController`, why `fetch` needs an `ok` check, modelling async state, validating untrusted data.

### Concepts

- **Effects** synchronise your component with something *outside* React: the network, timers, the DOM, `localStorage`. Rendering itself must stay pure.
- `useEffect(fn, deps)` runs `fn` after render, and again whenever a value in `deps` changes. `[]` means "once, on mount".
- The function you return is the **cleanup**. React runs it before the next effect and on unmount. For a request, cleanup means *cancel it*.
- In development, `<StrictMode>` deliberately mounts, unmounts and re-mounts every component once, to expose effects that lack cleanup. If your effect survives that, it is correct.
- `fetch` only rejects on **network failure**. A 404 or 500 resolves normally, so you must check `response.ok`.
- A **discriminated union** (`status: 'loading' | 'error' | 'success'`) makes impossible states (loading *and* error) unrepresentable, and TypeScript narrows `data` only when `status === 'success'`.
- **TypeScript types vanish at runtime.** `response.json()` returns *whatever the server sent*. A schema validates it at the boundary.

### Steps

**1. Install zod** for runtime validation.

```bash
pnpm add zod
```

**2. Add the async-state type.**

```ts
// src/types.ts
/** The minimum we need to draw a card: an id, a name, and (derived) artwork. */
export interface PokemonSummary {
  id: number
  name: string
}

/**
 * Every async operation is in exactly one of these states. A discriminated
 * union makes impossible combinations (e.g. "loading" *and* has an error)
 * unrepresentable, and TypeScript narrows `data` only when status is 'success'.
 */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T }
```

**3. Write the API layer.** One function fetches, checks `ok`, validates and reshapes.

```ts
// src/api/pokeapi.ts
import { z } from 'zod'
import type { PokemonSummary } from '../types'

const BASE_URL = 'https://pokeapi.co/api/v2'

/**
 * Ids 1-1025 are the base Pokédex. PokéAPI also lists alternate forms (Mega,
 * regional, ...) starting at id 10001; we ignore those to keep the list tidy.
 */
export const NATIONAL_DEX_SIZE = 1025

/**
 * Official artwork lives in a public GitHub repo keyed by Pokémon id, so a card
 * can show an image without a second network request.
 */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

/** "https://pokeapi.co/api/v2/pokemon/25/" -> 25 */
export function idFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url)
  if (!match?.[1]) throw new Error(`Cannot read a Pokémon id from "${url}"`)
  return Number(match[1])
}

/** Thrown when the server answers with a non-2xx status. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

// The response is untrusted input. A schema both validates it at runtime and
// gives us the static type, so the two can never drift apart.
const IndexSchema = z.object({
  results: z.array(z.object({ name: z.string(), url: z.string() })),
})

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  // `fetch` only rejects on network failure. A 404 or 500 still "succeeds",
  // so we must check `ok` ourselves.
  if (!response.ok) {
    throw new HttpError(response.status, `Request failed with ${response.status}`)
  }
  return response.json()
}

/** Every Pokémon's name and id (no types or stats yet) in a single request. */
export async function fetchPokemonIndex(
  signal?: AbortSignal,
): Promise<PokemonSummary[]> {
  const json = await getJson(
    `${BASE_URL}/pokemon?limit=${NATIONAL_DEX_SIZE}`,
    signal,
  )
  const { results } = IndexSchema.parse(json)
  return results.map((r) => ({ id: idFromUrl(r.url), name: r.name }))
}
```

**4. Turn unknown errors into friendly messages.**

```ts
// src/lib/errors.ts
import { ZodError } from 'zod'
import { HttpError } from '../api/pokeapi'

/** Aborting a request (on unmount or re-run) rejects with an AbortError. It is not a failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Turn any thrown value into a sentence a user can act on. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    return `PokéAPI answered with an error (${error.status}). Please try again.`
  }
  if (error instanceof ZodError) {
    return 'PokéAPI sent data in a shape we did not expect.'
  }
  if (error instanceof TypeError) {
    // This is what `fetch` throws when the network is unreachable.
    return 'Could not reach PokéAPI. Check your connection and try again.'
  }
  return 'Something went wrong. Please try again.'
}
```

**5. Add loading and error UI.**

```tsx
// src/components/LoadingGrid.tsx
/** Skeleton placeholders keep the layout stable while data loads. */
export function LoadingGrid({ count = 12 }: { count?: number }) {
  return (
    <ul
      aria-busy="true"
      aria-label="Loading Pokémon"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="h-44 animate-pulse rounded-2xl bg-slate-200"
        />
      ))}
    </ul>
  )
}
```

```tsx
// src/components/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string
  onRetry: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl bg-red-50 p-6 text-center text-red-800 ring-1 ring-red-200"
    >
      <p className="font-semibold">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  )
}
```

**6. Fetch inside `App`.** The new parts are the `index` state, the effect, `retry`, and a "Show more" button, because rendering 1025 cards at once would be slow.

```tsx
// src/App.tsx
import { useEffect, useState } from 'react'
import { fetchPokemonIndex } from './api/pokeapi'
import { EmptyState } from './components/EmptyState'
import { ErrorMessage } from './components/ErrorMessage'
import { Header } from './components/Header'
import { LoadingGrid } from './components/LoadingGrid'
import { PokemonGrid } from './components/PokemonGrid'
import { SearchBar } from './components/SearchBar'
import { SortToggle } from './components/SortToggle'
import { isAbortError, toErrorMessage } from './lib/errors'
import { filterAndSort, type SortKey } from './lib/filterPokemon'
import type { AsyncState, PokemonSummary } from './types'

const PAGE_SIZE = 24

function App() {
  const [index, setIndex] = useState<AsyncState<PokemonSummary[]>>({
    status: 'loading',
  })
  // Bumping this number re-runs the effect below: that is how "Try again" works.
  const [attempt, setAttempt] = useState(0)

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('number')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // An effect synchronises React with something *outside* React (the network).
  useEffect(() => {
    const controller = new AbortController()

    fetchPokemonIndex(controller.signal).then(
      (data) => setIndex({ status: 'success', data }),
      (error: unknown) => {
        if (isAbortError(error)) return
        setIndex({ status: 'error', message: toErrorMessage(error) })
      },
    )

    // Cleanup runs before the next effect and on unmount: cancel the stale request.
    return () => controller.abort()
  }, [attempt])

  function retry() {
    setIndex({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  // Resetting related state in the event handler (not in an effect) keeps
  // updates in one place and avoids an extra render pass.
  function handleQueryChange(value: string) {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleSortChange(value: SortKey) {
    setSort(value)
    setVisibleCount(PAGE_SIZE)
  }

  const matches =
    index.status === 'success' ? filterAndSort(index.data, query, sort) : []
  const shown = matches.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={handleQueryChange} />
          <SortToggle value={sort} onChange={handleSortChange} />
        </div>

        {index.status === 'loading' && <LoadingGrid />}

        {index.status === 'error' && (
          <ErrorMessage message={index.message} onRetry={retry} />
        )}

        {index.status === 'success' && (
          <>
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {shown.length} of {matches.length} Pokémon
            </p>

            {matches.length > 0 ? (
              <PokemonGrid pokemon={shown} />
            ) : (
              <EmptyState message={`No Pokémon match “${query.trim()}”.`} />
            )}

            {shown.length < matches.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
```

**7. (Recommended) enforce the dependency array.** In `.oxlintrc.json` add `"react/exhaustive-deps": "error"` to `rules`. The linter then tells you when an effect reads a value that is missing from its dependency array.

**8. Delete `src/data/samplePokemon.ts`.** It is no longer used.

### How it works

1. First render: `index` is `{ status: 'loading' }`, so `LoadingGrid` shows.
2. After mount the effect runs and starts the request, passing `controller.signal`.
3. On success `setIndex({ status: 'success', data })` re-renders with real data. On failure the state becomes `{ status: 'error', ... }`.
4. If the component unmounts (or `attempt` changes) first, the cleanup calls `controller.abort()`. The aborted `fetch` rejects with an `AbortError`, which we recognise and ignore: it is not a failure.
5. "Try again" sets the state back to loading and bumps `attempt`. Because `attempt` is in the dependency array, the effect re-runs.

`handleQueryChange` resets `visibleCount` in the **event handler**, not in an effect. Resetting related state where the change originates is simpler and avoids an extra render.

### Checkpoint

A grey skeleton flashes, then "Showing 24 of 1025 Pokémon". Search finds any Pokémon in the whole dex. **Show more** reveals 24 more. To try the error path, open dev tools → Network → set **Offline**, reload, then go back **Online** and press **Try again**.

### Pitfalls

- **Infinite request loop:** an effect that sets state it also depends on, or an object/array created inline in the dependency array (a new reference every render).
- **Missing cleanup:** a slow response for a stale request can land after a newer one and overwrite it.
- **`async` effect callback:** `useEffect(async () => ...)` is wrong because the callback must return a cleanup function or nothing, not a promise. Call an async function *inside* the effect instead.
- **Trusting `as T` on `response.json()`:** it compiles, and lies. Validate instead.

```bash
git diff --stat stage-2 stage-3
```

---

## Stage 4 · Detail view and type filter

**Goal:** click a card for a detail modal (types, stats, abilities), and filter the list by type.

**You will learn:** effects that depend on state, `useRef` for DOM access, the `key` prop as a state-reset mechanism, native `<dialog>`, focus management, Tailwind class-name rules.

### Concepts

- **Dependent effects:** the type filter effect lists `[typeFilter, typeAttempt]`. When the user picks another type, React runs the old effect's cleanup (aborting the old request) and then starts the new one.
- **`useRef`** gives you a mutable box that survives renders without causing re-renders. Its most common use is holding a DOM node so you can call imperative APIs such as `dialog.showModal()`.
- **`key` resets state.** Giving a component a different `key` makes React unmount the old one and mount a fresh one, with fresh state. Here `key={selection.pokemon.id}` guarantees the modal never flashes the previous Pokémon's data.
- A native **`<dialog>`** opened with `showModal()` gives you focus trapping, the Escape key and a backdrop for free, all accessible by default.
- **Tailwind scans for complete class names.** `bg-${color}-500` is invisible to it. That is why `TYPE_BADGE_CLASSES` spells every class out.

### Steps

**1. Define the type names and their colors.**

```ts
// src/lib/pokemonTypes.ts
export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type PokemonTypeName = (typeof POKEMON_TYPES)[number]

/**
 * Tailwind scans source files for *complete* class names. Writing
 * `bg-${color}-500` would be invisible to it, so every class is spelled out.
 */
export const TYPE_BADGE_CLASSES: Record<PokemonTypeName, string> = {
  normal: 'bg-stone-400 text-white',
  fire: 'bg-orange-500 text-white',
  water: 'bg-blue-500 text-white',
  electric: 'bg-yellow-400 text-slate-900',
  grass: 'bg-green-500 text-white',
  ice: 'bg-cyan-300 text-slate-900',
  fighting: 'bg-red-700 text-white',
  poison: 'bg-purple-500 text-white',
  ground: 'bg-amber-600 text-white',
  flying: 'bg-indigo-300 text-slate-900',
  psychic: 'bg-pink-500 text-white',
  bug: 'bg-lime-500 text-slate-900',
  rock: 'bg-yellow-700 text-white',
  ghost: 'bg-violet-700 text-white',
  dragon: 'bg-indigo-600 text-white',
  dark: 'bg-neutral-700 text-white',
  steel: 'bg-slate-400 text-white',
  fairy: 'bg-rose-300 text-slate-900',
}

/** Type guard: narrows an arbitrary string to a known type name. */
export function isPokemonType(value: string): value is PokemonTypeName {
  return (POKEMON_TYPES as readonly string[]).includes(value)
}
```

**2. Extend the API layer** with a detail fetch and a by-type fetch.

```ts
// src/api/pokeapi.ts
import { z } from 'zod'
import type { PokemonSummary } from '../types'

const BASE_URL = 'https://pokeapi.co/api/v2'

/**
 * Ids 1-1025 are the base Pokédex. PokéAPI also lists alternate forms (Mega,
 * regional, ...) starting at id 10001; we ignore those to keep the list tidy.
 */
export const NATIONAL_DEX_SIZE = 1025

/**
 * Official artwork lives in a public GitHub repo keyed by Pokémon id, so a card
 * can show an image without a second network request.
 */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

/** "https://pokeapi.co/api/v2/pokemon/25/" -> 25 */
export function idFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url)
  if (!match?.[1]) throw new Error(`Cannot read a Pokémon id from "${url}"`)
  return Number(match[1])
}

/** Thrown when the server answers with a non-2xx status. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

// The response is untrusted input. A schema both validates it at runtime and
// gives us the static type, so the two can never drift apart.
const IndexSchema = z.object({
  results: z.array(z.object({ name: z.string(), url: z.string() })),
})

const DetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(), // decimetres
  weight: z.number(), // hectograms
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(
    z.object({ base_stat: z.number(), stat: z.object({ name: z.string() }) }),
  ),
  abilities: z.array(
    z.object({ is_hidden: z.boolean(), ability: z.object({ name: z.string() }) }),
  ),
})

export type PokemonDetail = z.infer<typeof DetailSchema>

const TypeSchema = z.object({
  pokemon: z.array(
    z.object({ pokemon: z.object({ name: z.string(), url: z.string() }) }),
  ),
})

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal })
  // `fetch` only rejects on network failure. A 404 or 500 still "succeeds",
  // so we must check `ok` ourselves.
  if (!response.ok) {
    throw new HttpError(response.status, `Request failed with ${response.status}`)
  }
  return response.json()
}

/** Every Pokémon's name and id (no types or stats yet) in a single request. */
export async function fetchPokemonIndex(
  signal?: AbortSignal,
): Promise<PokemonSummary[]> {
  const json = await getJson(
    `${BASE_URL}/pokemon?limit=${NATIONAL_DEX_SIZE}`,
    signal,
  )
  const { results } = IndexSchema.parse(json)
  return results.map((r) => ({ id: idFromUrl(r.url), name: r.name }))
}

/** Full details (types, stats, abilities) for one Pokémon. */
export async function fetchPokemonDetail(
  id: number,
  signal?: AbortSignal,
): Promise<PokemonDetail> {
  return DetailSchema.parse(await getJson(`${BASE_URL}/pokemon/${id}`, signal))
}

/** Ids of every base-Pokédex Pokémon that has the given type. */
export async function fetchPokemonIdsByType(
  type: string,
  signal?: AbortSignal,
): Promise<Set<number>> {
  const json = await getJson(`${BASE_URL}/type/${type}`, signal)
  const { pokemon } = TypeSchema.parse(json)
  const ids = pokemon
    .map((entry) => idFromUrl(entry.pokemon.url))
    .filter((id) => id <= NATIONAL_DEX_SIZE)
  return new Set(ids)
}
```

**3. Small helpers.**

```ts
// src/lib/format.ts
/** "mr-mime" -> "Mr Mime" */
export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

/** "special-attack" -> "Sp. Atk" (falls back to a readable name). */
export function formatStatName(name: string): string {
  return STAT_LABELS[name] ?? formatName(name)
}

/** 25 -> "#0025" */
export function formatId(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}
```

`filterAndSort` now takes an options object, because it has three inputs and one is optional:

```ts
// src/lib/filterPokemon.ts
import type { PokemonSummary } from '../types'

export type SortKey = 'number' | 'name'

export interface FilterOptions {
  query: string
  sort: SortKey
  /** When set, only Pokémon whose id is in this set are kept (e.g. one type). */
  allowedIds?: ReadonlySet<number> | undefined
}

/**
 * Pure function: same input, same output, no side effects. Components call it
 * during render, so the visible list is always *derived* from state rather than
 * stored in state (one source of truth, nothing to keep in sync).
 */
export function filterAndSort(
  pokemon: readonly PokemonSummary[],
  { query, sort, allowedIds }: FilterOptions,
): PokemonSummary[] {
  const q = query.trim().toLowerCase()

  // `filter` returns a new array, so sorting it in place does not touch the input.
  const matches = pokemon.filter((p) => {
    if (allowedIds && !allowedIds.has(p.id)) return false
    if (q === '') return true
    // "mr mime" should find "mr-mime"; "25" should find #25.
    return p.name.replaceAll('-', ' ').includes(q) || String(p.id) === q
  })

  return matches.sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) : a.id - b.id,
  )
}
```

**4. New components.**

```tsx
// src/components/TypeBadge.tsx
import { formatName } from '../lib/format'
import { isPokemonType, TYPE_BADGE_CLASSES } from '../lib/pokemonTypes'

export function TypeBadge({ type }: { type: string }) {
  // The API is a boundary: fall back gracefully if it ever returns a new type.
  const colors = isPokemonType(type)
    ? TYPE_BADGE_CLASSES[type]
    : 'bg-slate-300 text-slate-900'

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${colors}`}
    >
      {formatName(type)}
    </span>
  )
}
```

```tsx
// src/components/StatBar.tsx
import { formatStatName } from '../lib/format'

/** Base stats top out at 255, so that is the 100% mark. */
const MAX_BASE_STAT = 255

interface StatBarProps {
  name: string
  value: number
}

export function StatBar({ name, value }: StatBarProps) {
  const percent = Math.min(100, Math.round((value / MAX_BASE_STAT) * 100))

  return (
    <li className="grid grid-cols-[5rem_2.5rem_1fr] items-center gap-2 text-sm">
      <span className="text-slate-500">{formatStatName(name)}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <span
        className="h-2 overflow-hidden rounded-full bg-slate-200"
        aria-hidden="true"
      >
        {/* Inline style is the right tool for a value computed at runtime. */}
        <span
          className="block h-full rounded-full bg-red-500"
          style={{ width: `${percent}%` }}
        />
      </span>
    </li>
  )
}
```

```tsx
// src/components/TypeFilter.tsx
import { formatName } from '../lib/format'
import {
  isPokemonType,
  POKEMON_TYPES,
  type PokemonTypeName,
} from '../lib/pokemonTypes'

export type TypeFilterValue = PokemonTypeName | 'all'

interface TypeFilterProps {
  value: TypeFilterValue
  onChange: (value: TypeFilterValue) => void
}

export function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <div>
      <label htmlFor="type-filter" className="sr-only">
        Filter by type
      </label>
      <select
        id="type-filter"
        value={value}
        onChange={(event) => {
          const next = event.target.value
          // <option> values are plain strings; narrow before trusting them.
          onChange(isPokemonType(next) ? next : 'all')
        }}
        className="w-full rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
      >
        <option value="all">All types</option>
        {POKEMON_TYPES.map((type) => (
          <option key={type} value={type}>
            {formatName(type)}
          </option>
        ))}
      </select>
    </div>
  )
}
```

```tsx
// src/components/PokemonModal.tsx
import { useEffect, useRef, useState } from 'react'
import { artworkUrl, fetchPokemonDetail, type PokemonDetail } from '../api/pokeapi'
import { isAbortError, toErrorMessage } from '../lib/errors'
import { formatId, formatName } from '../lib/format'
import type { AsyncState, PokemonSummary } from '../types'
import { ErrorMessage } from './ErrorMessage'
import { StatBar } from './StatBar'
import { TypeBadge } from './TypeBadge'

interface PokemonModalProps {
  pokemon: PokemonSummary
  /** The element that opened the modal, so focus can go back to it. */
  returnFocusTo: HTMLElement | null
  onClose: () => void
}

export function PokemonModal({
  pokemon,
  returnFocusTo,
  onClose,
}: PokemonModalProps) {
  // A ref is an escape hatch to the real DOM node: we need it to call
  // <dialog>.showModal(), which has no declarative equivalent.
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [detail, setDetail] = useState<AsyncState<PokemonDetail>>({
    status: 'loading',
  })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // When the modal unmounts, hand focus back to the card that opened it.
  useEffect(() => {
    return () => returnFocusTo?.focus()
  }, [returnFocusTo])

  useEffect(() => {
    const controller = new AbortController()

    fetchPokemonDetail(pokemon.id, controller.signal).then(
      (data) => setDetail({ status: 'success', data }),
      (error: unknown) => {
        if (isAbortError(error)) return
        setDetail({ status: 'error', message: toErrorMessage(error) })
      },
    )

    return () => controller.abort()
  }, [pokemon.id, attempt])

  function retry() {
    setDetail({ status: 'loading' })
    setAttempt((n) => n + 1)
  }

  return (
    <dialog
      ref={dialogRef}
      // Fires for Escape as well as dialog.close().
      onClose={onClose}
      // The dialog fills its backdrop area, so a click whose target *is* the
      // dialog itself (not a child) landed outside the visible panel.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="pokemon-modal-title"
      className="m-auto max-h-[90vh] w-[min(92vw,26rem)] overflow-y-auto rounded-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-400">
              {formatId(pokemon.id)}
            </p>
            <h2 id="pokemon-modal-title" className="text-2xl font-black">
              {formatName(pokemon.name)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-full bg-slate-100 px-3 py-1 text-lg leading-none font-bold text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <img
          src={artworkUrl(pokemon.id)}
          alt={formatName(pokemon.name)}
          width={224}
          height={224}
          className="mx-auto my-2 size-56 object-contain"
        />

        {detail.status === 'loading' && (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Loading details"
          >
            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        )}

        {detail.status === 'error' && (
          <ErrorMessage message={detail.message} onRetry={retry} />
        )}

        {detail.status === 'success' && <DetailBody detail={detail.data} />}
      </div>
    </dialog>
  )
}

function DetailBody({ detail }: { detail: PokemonDetail }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {detail.types.map(({ type }) => (
          <TypeBadge key={type.name} type={type.name} />
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-slate-500">Height</dt>
          <dd className="font-bold">{(detail.height / 10).toFixed(1)} m</dd>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-slate-500">Weight</dt>
          <dd className="font-bold">{(detail.weight / 10).toFixed(1)} kg</dd>
        </div>
      </dl>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
          Abilities
        </h3>
        <ul className="flex flex-wrap gap-2 text-sm">
          {detail.abilities.map(({ ability, is_hidden }) => (
            <li
              key={ability.name}
              className="rounded-lg bg-slate-100 px-3 py-1 font-medium"
            >
              {formatName(ability.name)}
              {is_hidden && <span className="text-slate-400"> (hidden)</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
          Base stats
        </h3>
        <ul className="space-y-2">
          {detail.stats.map(({ stat, base_stat }) => (
            <StatBar key={stat.name} name={stat.name} value={base_stat} />
          ))}
        </ul>
      </section>
    </div>
  )
}
```

**5. Make cards clickable.** The card becomes a `<button>` (keyboard accessible for free) and reports which element was clicked so focus can return to it later.

```tsx
// src/components/PokemonCard.tsx
import { artworkUrl } from '../api/pokeapi'
import { formatId, formatName } from '../lib/format'
import type { PokemonSummary } from '../types'

interface PokemonCardProps {
  pokemon: PokemonSummary
  /** `trigger` is the clicked element, used later to restore focus. */
  onSelect: (pokemon: PokemonSummary, trigger: HTMLElement) => void
}

export function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  return (
    <button
      type="button"
      onClick={(event) => onSelect(pokemon, event.currentTarget)}
      className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
    >
      <img
        src={artworkUrl(pokemon.id)}
        alt=""
        width={112}
        height={112}
        loading="lazy"
        className="size-28 object-contain"
      />
      <span className="text-xs font-semibold text-slate-400">
        {formatId(pokemon.id)}
      </span>
      <span className="text-base font-bold">{formatName(pokemon.name)}</span>
    </button>
  )
}
```

```tsx
// src/components/PokemonGrid.tsx
import type { PokemonSummary } from '../types'
import { PokemonCard } from './PokemonCard'

interface PokemonGridProps {
  pokemon: PokemonSummary[]
  onSelect: (pokemon: PokemonSummary, trigger: HTMLElement) => void
}

export function PokemonGrid({ pokemon, onSelect }: PokemonGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {pokemon.map((p) => (
        // `key` lets React match each list item to the same DOM node between renders.
        <li key={p.id}>
          <PokemonCard pokemon={p} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  )
}
```

**6. Wire it together in `App`.**

```tsx
// src/App.tsx
import { useEffect, useState } from 'react'
import { fetchPokemonIdsByType, fetchPokemonIndex } from './api/pokeapi'
import { EmptyState } from './components/EmptyState'
import { ErrorMessage } from './components/ErrorMessage'
import { Header } from './components/Header'
import { LoadingGrid } from './components/LoadingGrid'
import { PokemonGrid } from './components/PokemonGrid'
import { PokemonModal } from './components/PokemonModal'
import { SearchBar } from './components/SearchBar'
import { SortToggle } from './components/SortToggle'
import { TypeFilter, type TypeFilterValue } from './components/TypeFilter'
import { isAbortError, toErrorMessage } from './lib/errors'
import { filterAndSort, type SortKey } from './lib/filterPokemon'
import type { AsyncState, PokemonSummary } from './types'

const PAGE_SIZE = 24

interface Selection {
  pokemon: PokemonSummary
  trigger: HTMLElement
}

function App() {
  const [index, setIndex] = useState<AsyncState<PokemonSummary[]>>({
    status: 'loading',
  })
  const [indexAttempt, setIndexAttempt] = useState(0)

  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [typeMembers, setTypeMembers] = useState<
    AsyncState<ReadonlySet<number>>
  >({ status: 'loading' })
  const [typeAttempt, setTypeAttempt] = useState(0)

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('number')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selection, setSelection] = useState<Selection | null>(null)

  // Effect 1: load the whole index once (re-runs only when "Try again" bumps it).
  useEffect(() => {
    const controller = new AbortController()

    fetchPokemonIndex(controller.signal).then(
      (data) => setIndex({ status: 'success', data }),
      (error: unknown) => {
        if (isAbortError(error)) return
        setIndex({ status: 'error', message: toErrorMessage(error) })
      },
    )

    return () => controller.abort()
  }, [indexAttempt])

  // Effect 2: whenever the chosen type changes, fetch that type's members.
  // Changing `typeFilter` runs the cleanup (aborting the old request) first.
  useEffect(() => {
    if (typeFilter === 'all') return
    const controller = new AbortController()

    fetchPokemonIdsByType(typeFilter, controller.signal).then(
      (data) => setTypeMembers({ status: 'success', data }),
      (error: unknown) => {
        if (isAbortError(error)) return
        setTypeMembers({ status: 'error', message: toErrorMessage(error) })
      },
    )

    return () => controller.abort()
  }, [typeFilter, typeAttempt])

  function retryIndex() {
    setIndex({ status: 'loading' })
    setIndexAttempt((n) => n + 1)
  }

  function retryType() {
    setTypeMembers({ status: 'loading' })
    setTypeAttempt((n) => n + 1)
  }

  // Related state is reset in event handlers, not in effects.
  function handleQueryChange(value: string) {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleSortChange(value: SortKey) {
    setSort(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleTypeChange(value: TypeFilterValue) {
    setTypeFilter(value)
    setTypeMembers({ status: 'loading' })
    setVisibleCount(PAGE_SIZE)
  }

  const typeActive = typeFilter !== 'all'

  let failure: { message: string; retry: () => void } | null = null
  if (index.status === 'error') {
    failure = { message: index.message, retry: retryIndex }
  } else if (typeActive && typeMembers.status === 'error') {
    failure = { message: typeMembers.message, retry: retryType }
  }

  const isLoading =
    index.status === 'loading' ||
    (typeActive && typeMembers.status === 'loading')

  let matches: PokemonSummary[] = []
  if (index.status === 'success') {
    matches = filterAndSort(index.data, {
      query,
      sort,
      allowedIds:
        typeActive && typeMembers.status === 'success'
          ? typeMembers.data
          : undefined,
    })
  }
  const shown = matches.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={handleQueryChange} />
          <TypeFilter value={typeFilter} onChange={handleTypeChange} />
          <SortToggle value={sort} onChange={handleSortChange} />
        </div>

        {failure ? (
          <ErrorMessage message={failure.message} onRetry={failure.retry} />
        ) : isLoading ? (
          <LoadingGrid />
        ) : (
          <>
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {shown.length} of {matches.length} Pokémon
            </p>

            {matches.length > 0 ? (
              <PokemonGrid
                pokemon={shown}
                onSelect={(pokemon, trigger) =>
                  setSelection({ pokemon, trigger })
                }
              />
            ) : (
              <EmptyState message="No Pokémon match your search." />
            )}

            {shown.length < matches.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selection && (
        // `key` makes React treat each Pokémon as a brand-new modal, so its
        // fetch state resets automatically instead of flashing stale data.
        <PokemonModal
          key={selection.pokemon.id}
          pokemon={selection.pokemon}
          returnFocusTo={selection.trigger}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}

export default App
```

### How it works

- **Two requests per Pokémon visit:** the index (already loaded) gives the card; clicking fetches `/pokemon/{id}` for the modal. The modal starts with the name and artwork it already has and fills in the rest, so it feels instant.
- **The type filter** calls `/type/{name}`, converts the response to a `Set` of ids and passes it to `filterAndSort`. Search and type compose because both are just conditions inside one `filter`.
- **Returning focus:** the cleanup of an effect inside `PokemonModal` calls `returnFocusTo?.focus()`. A keyboard user lands back on the card they opened.
- **Why the click target check:** the `<dialog>` fills its own backdrop, so a click whose `target` is the dialog element itself happened *outside* the visible panel.
- **Why the heart is not nested in the card** (stage 6): a `<button>` cannot contain another interactive element, so the two are siblings.

### Checkpoint

Click a card: a modal with artwork, type badges, height, weight, abilities (hidden ones marked) and six stat bars. **Escape** closes it and focus returns to the card. Choose **Fire**: "Showing 24 of 81 Pokémon". Search `char` while Fire is selected: Charmander, Charmeleon, Charizard, Chimchar, Charcadet.

### Pitfalls

- **Margins on `<dialog>`:** Tailwind's reset removes the browser's default centering margin, so the dialog needs `m-auto`.
- **Calling `dialog.close()` in effect cleanup:** under StrictMode the simulated unmount fires a queued `close` event that would immediately close the modal again in development. The code avoids this by only ever calling `showModal()` and letting unmount remove the element.
- **Forgetting that `<select>` values are strings:** `isPokemonType` narrows the string back into the union type before it reaches your state.

```bash
git diff --stat stage-3 stage-4
```

---

## Stage 5 · Custom hooks

**Goal:** remove the copy-pasted fetch logic from `App` and the modal into reusable hooks.

**You will learn:** what a custom hook is, the rules of hooks, deriving async state during render, race conditions, debouncing.

### Why refactor now

After stage 4, three places repeat the same pattern: a state for `loading | error | success`, an effect with an `AbortController`, and a retry counter. Three copies of tricky code is the right moment to extract.

### Concepts

- A **custom hook** is a function whose name starts with `use` and which calls other hooks. It shares *logic*, not state: every component that calls it gets its own independent state.
- **Rules of hooks:** call hooks only at the top level of a component or another hook, never inside conditions, loops or nested functions. React identifies each hook by call order.
- **Debouncing** delays reacting to a fast-changing value until it settles. The input stays instant; the expensive part waits.

### Steps

**1. Rework the API layer** into URL builders, schemas and one generic `fetchJson`:

```ts
// src/api/pokeapi.ts
import { z } from 'zod'
import type { PokemonSummary } from '../types'

const BASE_URL = 'https://pokeapi.co/api/v2'

/**
 * Ids 1-1025 are the base Pokédex. PokéAPI also lists alternate forms (Mega,
 * regional, ...) starting at id 10001; we ignore those to keep the list tidy.
 */
export const NATIONAL_DEX_SIZE = 1025

/**
 * Official artwork lives in a public GitHub repo keyed by Pokémon id, so a card
 * can show an image without a second network request.
 */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

/** "https://pokeapi.co/api/v2/pokemon/25/" -> 25 */
export function idFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url)
  if (!match?.[1]) throw new Error(`Cannot read a Pokémon id from "${url}"`)
  return Number(match[1])
}

/** Thrown when the server answers with a non-2xx status. */
export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * Fetch a URL and validate the body against `schema`.
 *
 * The response is untrusted input. A schema both validates it at runtime and
 * gives us the static type, so the two can never drift apart. `.transform()`
 * lets a schema also reshape the data into what the UI actually wants.
 */
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal })
  // `fetch` only rejects on network failure. A 404 or 500 still "succeeds",
  // so we must check `ok` ourselves.
  if (!response.ok) {
    throw new HttpError(response.status, `Request failed with ${response.status}`)
  }
  return schema.parse(await response.json())
}

// ---- Endpoints: each is a URL builder plus the schema for its response. ----

export const pokemonIndexUrl = (): string =>
  `${BASE_URL}/pokemon?limit=${NATIONAL_DEX_SIZE}`

/** Every Pokémon's name and id (no types or stats yet) in a single request. */
export const PokemonIndexSchema = z
  .object({
    results: z.array(z.object({ name: z.string(), url: z.string() })),
  })
  .transform(({ results }): PokemonSummary[] =>
    results.map((r) => ({ id: idFromUrl(r.url), name: r.name })),
  )

export const pokemonDetailUrl = (id: number): string =>
  `${BASE_URL}/pokemon/${id}`

/** Full details (types, stats, abilities) for one Pokémon. */
export const PokemonDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(), // decimetres
  weight: z.number(), // hectograms
  types: z.array(z.object({ type: z.object({ name: z.string() }) })),
  stats: z.array(
    z.object({ base_stat: z.number(), stat: z.object({ name: z.string() }) }),
  ),
  abilities: z.array(
    z.object({ is_hidden: z.boolean(), ability: z.object({ name: z.string() }) }),
  ),
})

export type PokemonDetail = z.infer<typeof PokemonDetailSchema>

export const pokemonTypeUrl = (type: string): string =>
  `${BASE_URL}/type/${type}`

/** Ids of every base-Pokédex Pokémon that has a given type. */
export const PokemonTypeSchema = z
  .object({
    pokemon: z.array(
      z.object({ pokemon: z.object({ name: z.string(), url: z.string() }) }),
    ),
  })
  .transform(({ pokemon }): ReadonlySet<number> => {
    const ids = pokemon
      .map((entry) => idFromUrl(entry.pokemon.url))
      .filter((id) => id <= NATIONAL_DEX_SIZE)
    return new Set(ids)
  })
```

**2. The generic data hook.** Read the comment block: the design avoids two classic bugs.

```ts
// src/hooks/useFetchJson.ts
import { useEffect, useState } from 'react'
import type { z } from 'zod'
import { fetchJson } from '../api/pokeapi'
import { isAbortError, toErrorMessage } from '../lib/errors'
import type { AsyncState } from '../types'

/** `idle` means "no URL yet" (e.g. no type chosen), so nothing is fetched. */
export type FetchState<T> = AsyncState<T> | { status: 'idle' }

export interface FetchResult<T> {
  state: FetchState<T>
  /** Re-run the request (used by "Try again" buttons). */
  reload: () => void
}

interface Settled<T> {
  /** Which request this outcome belongs to. */
  key: string
  outcome: Extract<AsyncState<T>, { status: 'success' | 'error' }>
}

/**
 * Fetch `url`, validate with `schema`, and report loading/error/success.
 *
 * Design notes for learners:
 * - The URL string is the dependency, so a new URL means a new request.
 * - The effect never calls setState synchronously. We store the outcome
 *   together with the key of the request that produced it, and *derive* the
 *   state during render. If the key no longer matches, we are "loading".
 *   That makes stale data from a previous URL impossible.
 * - The cleanup aborts the in-flight request, and results from an aborted
 *   request are discarded, so a slow response for an old URL can never
 *   overwrite a newer one (a classic race condition).
 * - `schema` must be a stable reference (declare it at module level).
 */
export function useFetchJson<T>(
  url: string | null,
  schema: z.ZodType<T>,
): FetchResult<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)
  const [attempt, setAttempt] = useState(0)

  const key = `${attempt}:${url}`

  useEffect(() => {
    if (url === null) return
    const controller = new AbortController()

    fetchJson(url, schema, controller.signal).then(
      (data) => {
        // The cleanup below aborts this controller when the request is no
        // longer wanted. A response can still arrive after that (it may already
        // be in flight), so never store a result for an abandoned request.
        if (controller.signal.aborted) return
        setSettled({ key, outcome: { status: 'success', data } })
      },
      (error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        setSettled({
          key,
          outcome: { status: 'error', message: toErrorMessage(error) },
        })
      },
    )

    return () => controller.abort()
  }, [url, schema, key])

  let state: FetchState<T>
  if (url === null) state = { status: 'idle' }
  else if (settled?.key === key) state = settled.outcome
  else state = { status: 'loading' }

  return { state, reload: () => setAttempt((n) => n + 1) }
}
```

**3. A debounce hook.**

```ts
// src/hooks/useDebounce.ts
import { useEffect, useState } from 'react'

/**
 * Returns `value`, but only after it has stopped changing for `delayMs`.
 * Typing "pikachu" updates the input on every key, yet the (more expensive)
 * filtering only reacts once the user pauses.
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    // Each new keystroke cancels the previous timer.
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
```

**4. Domain-specific wrappers.** One line each; components never see URLs or schemas.

```ts
// src/hooks/usePokemonData.ts
import {
  PokemonDetailSchema,
  PokemonIndexSchema,
  PokemonTypeSchema,
  pokemonDetailUrl,
  pokemonIndexUrl,
  pokemonTypeUrl,
  type PokemonDetail,
} from '../api/pokeapi'
import type { PokemonTypeName } from '../lib/pokemonTypes'
import type { PokemonSummary } from '../types'
import { useFetchJson, type FetchResult } from './useFetchJson'

/** All base-Pokédex Pokémon (id + name). */
export function usePokemonIndex(): FetchResult<PokemonSummary[]> {
  return useFetchJson(pokemonIndexUrl(), PokemonIndexSchema)
}

/** One Pokémon's full details. Pass `null` to skip the request. */
export function usePokemonDetail(id: number | null): FetchResult<PokemonDetail> {
  return useFetchJson(
    id === null ? null : pokemonDetailUrl(id),
    PokemonDetailSchema,
  )
}

/** Ids of the Pokémon with the given type. Pass `null` to skip the request. */
export function usePokemonTypeMembers(
  type: PokemonTypeName | null,
): FetchResult<ReadonlySet<number>> {
  return useFetchJson(
    type === null ? null : pokemonTypeUrl(type),
    PokemonTypeSchema,
  )
}
```

**5. Slim down the modal** (it now just calls `usePokemonDetail`):

```tsx
// src/components/PokemonModal.tsx
import { useEffect, useRef } from 'react'
import { artworkUrl, type PokemonDetail } from '../api/pokeapi'
import { usePokemonDetail } from '../hooks/usePokemonData'
import { formatId, formatName } from '../lib/format'
import type { PokemonSummary } from '../types'
import { ErrorMessage } from './ErrorMessage'
import { StatBar } from './StatBar'
import { TypeBadge } from './TypeBadge'

interface PokemonModalProps {
  pokemon: PokemonSummary
  /** The element that opened the modal, so focus can go back to it. */
  returnFocusTo: HTMLElement | null
  onClose: () => void
}

export function PokemonModal({
  pokemon,
  returnFocusTo,
  onClose,
}: PokemonModalProps) {
  // A ref is an escape hatch to the real DOM node: we need it to call
  // <dialog>.showModal(), which has no declarative equivalent.
  const dialogRef = useRef<HTMLDialogElement>(null)

  const { state: detail, reload } = usePokemonDetail(pokemon.id)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  // When the modal unmounts, hand focus back to the card that opened it.
  useEffect(() => {
    return () => returnFocusTo?.focus()
  }, [returnFocusTo])

  return (
    <dialog
      ref={dialogRef}
      // Fires for Escape as well as dialog.close().
      onClose={onClose}
      // The dialog fills its backdrop area, so a click whose target *is* the
      // dialog itself (not a child) landed outside the visible panel.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="pokemon-modal-title"
      className="m-auto max-h-[90vh] w-[min(92vw,26rem)] overflow-y-auto rounded-3xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-900/60"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-400">
              {formatId(pokemon.id)}
            </p>
            <h2 id="pokemon-modal-title" className="text-2xl font-black">
              {formatName(pokemon.name)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="rounded-full bg-slate-100 px-3 py-1 text-lg leading-none font-bold text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <img
          src={artworkUrl(pokemon.id)}
          alt={formatName(pokemon.name)}
          width={224}
          height={224}
          className="mx-auto my-2 size-56 object-contain"
        />

        {(detail.status === 'loading' || detail.status === 'idle') && (
          <div
            className="space-y-3"
            aria-busy="true"
            aria-label="Loading details"
          >
            <div className="h-6 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-24 animate-pulse rounded bg-slate-200" />
          </div>
        )}

        {detail.status === 'error' && (
          <ErrorMessage message={detail.message} onRetry={reload} />
        )}

        {detail.status === 'success' && <DetailBody detail={detail.data} />}
      </div>
    </dialog>
  )
}

function DetailBody({ detail }: { detail: PokemonDetail }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {detail.types.map(({ type }) => (
          <TypeBadge key={type.name} type={type.name} />
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-slate-500">Height</dt>
          <dd className="font-bold">{(detail.height / 10).toFixed(1)} m</dd>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <dt className="text-slate-500">Weight</dt>
          <dd className="font-bold">{(detail.weight / 10).toFixed(1)} kg</dd>
        </div>
      </dl>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
          Abilities
        </h3>
        <ul className="flex flex-wrap gap-2 text-sm">
          {detail.abilities.map(({ ability, is_hidden }) => (
            <li
              key={ability.name}
              className="rounded-lg bg-slate-100 px-3 py-1 font-medium"
            >
              {formatName(ability.name)}
              {is_hidden && <span className="text-slate-400"> (hidden)</span>}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold tracking-wide text-slate-500 uppercase">
          Base stats
        </h3>
        <ul className="space-y-2">
          {detail.stats.map(({ stat, base_stat }) => (
            <StatBar key={stat.name} name={stat.name} value={base_stat} />
          ))}
        </ul>
      </section>
    </div>
  )
}
```

**6. Slim down `App`.**

```tsx
// src/App.tsx
import { useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { ErrorMessage } from './components/ErrorMessage'
import { Header } from './components/Header'
import { LoadingGrid } from './components/LoadingGrid'
import { PokemonGrid } from './components/PokemonGrid'
import { PokemonModal } from './components/PokemonModal'
import { SearchBar } from './components/SearchBar'
import { SortToggle } from './components/SortToggle'
import { TypeFilter, type TypeFilterValue } from './components/TypeFilter'
import { useDebounce } from './hooks/useDebounce'
import { usePokemonIndex, usePokemonTypeMembers } from './hooks/usePokemonData'
import { filterAndSort, type SortKey } from './lib/filterPokemon'
import type { PokemonSummary } from './types'

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 200

interface Selection {
  pokemon: PokemonSummary
  trigger: HTMLElement
}

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [sort, setSort] = useState<SortKey>('number')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selection, setSelection] = useState<Selection | null>(null)

  // The input updates instantly; the filtering reacts to the settled value.
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)

  const index = usePokemonIndex()
  const typeMembers = usePokemonTypeMembers(
    typeFilter === 'all' ? null : typeFilter,
  )

  // Related state is reset in event handlers, not in effects.
  function handleQueryChange(value: string) {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleSortChange(value: SortKey) {
    setSort(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleTypeChange(value: TypeFilterValue) {
    setTypeFilter(value)
    setVisibleCount(PAGE_SIZE)
  }

  let failure: { message: string; retry: () => void } | null = null
  if (index.state.status === 'error') {
    failure = { message: index.state.message, retry: index.reload }
  } else if (typeMembers.state.status === 'error') {
    failure = { message: typeMembers.state.message, retry: typeMembers.reload }
  }

  const isLoading =
    index.state.status === 'loading' || typeMembers.state.status === 'loading'

  let matches: PokemonSummary[] = []
  if (index.state.status === 'success') {
    matches = filterAndSort(index.state.data, {
      query: debouncedQuery,
      sort,
      allowedIds:
        typeMembers.state.status === 'success'
          ? typeMembers.state.data
          : undefined,
    })
  }
  const shown = matches.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={handleQueryChange} />
          <TypeFilter value={typeFilter} onChange={handleTypeChange} />
          <SortToggle value={sort} onChange={handleSortChange} />
        </div>

        {failure ? (
          <ErrorMessage message={failure.message} onRetry={failure.retry} />
        ) : isLoading ? (
          <LoadingGrid />
        ) : (
          <>
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {shown.length} of {matches.length} Pokémon
            </p>

            {matches.length > 0 ? (
              <PokemonGrid
                pokemon={shown}
                onSelect={(pokemon, trigger) =>
                  setSelection({ pokemon, trigger })
                }
              />
            ) : (
              <EmptyState message="No Pokémon match your search." />
            )}

            {shown.length < matches.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selection && (
        // `key` makes React treat each Pokémon as a brand-new modal, so its
        // fetch state resets automatically instead of flashing stale data.
        <PokemonModal
          key={selection.pokemon.id}
          pokemon={selection.pokemon}
          returnFocusTo={selection.trigger}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}

export default App
```

### How it works

`useFetchJson` stores the outcome **together with the key of the request that produced it** (`attempt:url`). On every render it compares that key with the current one:

- same key → show the stored outcome;
- different key → `loading`.

**The abort guard.** Look at the two `if (controller.signal.aborted) return` checks. When the URL changes, the cleanup aborts the old request, but a response can still arrive *after* that (it may already be in flight). Without the guard, a slow response for the old URL would be stored last and overwrite the newer result, and because its key no longer matches the current one, the hook would be stuck on `loading`. Checking the request's own signal before storing anything makes that impossible. This is a classic **race condition**: two requests finishing in the "wrong" order.

So changing the URL can never show data belonging to the previous URL, the effect never calls `setState` synchronously, and "retry" is just `setAttempt(n => n + 1)`, which changes the key and flows through the same path.

Passing `null` as the URL means "do not fetch": the hook reports `idle`. That is how "no type selected" skips the type request without breaking the rules of hooks (the hook is still *called*; it just does nothing).

### Checkpoint

The app behaves exactly as in stage 4, but `App.tsx` and `PokemonModal.tsx` are much shorter, and typing in the search box now filters 200 ms after you pause.

### Pitfalls

- **Conditionally calling a hook** (`if (id) usePokemonDetail(id)`) breaks the rules. Pass `null` instead.
- **Unstable `schema` argument:** it is a dependency of the effect, so declare schemas at module level. A schema created inline would restart the request on every render.
- **Relying on `abort()` alone:** aborting does not guarantee the old promise's callbacks never run. Always check `signal.aborted` before using a result.

```bash
git diff --stat stage-4 stage-5
```

---

## Stage 6 · Global state

**Goal:** favorite Pokémon from a card or the modal, see them in a "Favorites" view, and keep them across reloads.

**You will learn:** `useContext`, `useReducer`, lazy state initialisation, deliberate `useMemo`, persisting to `localStorage`.

### Concepts

- **Context** lets a component read a value from an ancestor without passing props through every level. Use it for genuinely app-wide state (here: favorites), not as a replacement for props.
- **`useReducer`** is `useState` for state with named transitions. All changes go through one pure `reducer(state, action)` function, which is easy to read and reason about.
- **Lazy initialiser:** `useReducer(reducer, undefined, loadFavorites)` runs `loadFavorites` once, on first render, instead of reading storage on every render.
- **`useMemo`** caches a computed value between renders. Use it where identity matters: every context consumer re-renders when the provided object changes identity, so we rebuild it only when `favoriteIds` changes. We do **not** memoize the list filtering, because it is cheap.

### Steps

**1. The reducer.**

```ts
// src/context/favoritesReducer.ts
export type FavoritesAction = { type: 'toggle'; id: number } | { type: 'clear' }

/**
 * A reducer is a pure function `(state, action) => nextState`. It never mutates
 * `state`; it returns a new array. Keeping every state transition in one place
 * makes the behaviour easy to read and reason about.
 */
export function favoritesReducer(
  state: readonly number[],
  action: FavoritesAction,
): number[] {
  switch (action.type) {
    case 'toggle':
      return state.includes(action.id)
        ? state.filter((id) => id !== action.id)
        : [...state, action.id]
    case 'clear':
      return []
  }
}
```

**2. Persistence.** Storage is an untrusted boundary too, so it is validated and never throws.

```ts
// src/lib/favoritesStorage.ts
import { z } from 'zod'

const STORAGE_KEY = 'pokedex:favorites'

// localStorage is a boundary too: another tab, an old app version or the user
// could have written anything there.
const FavoritesSchema = z.array(z.number().int().positive())

/** Never throws: private mode, blocked storage or bad data all yield `[]`. */
export function loadFavorites(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []
    const parsed = FavoritesSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    return []
  }
}

export function saveFavorites(ids: readonly number[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Storage can be full or disabled. Favorites still work for this session.
  }
}
```

**3. The context, provider and consumer hook** (three small files, so React Fast Refresh and the linter stay happy: a file that exports components should export *only* components).

```ts
// src/context/favoritesContext.ts
import { createContext } from 'react'

export interface FavoritesContextValue {
  favoriteIds: readonly number[]
  isFavorite: (id: number) => boolean
  toggleFavorite: (id: number) => void
  clearFavorites: () => void
}

/** `null` means "no provider above this component", which is a bug we want to catch. */
export const FavoritesContext = createContext<FavoritesContextValue | null>(null)
```

```tsx
// src/context/FavoritesProvider.tsx
import { useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { loadFavorites, saveFavorites } from '../lib/favoritesStorage'
import { FavoritesContext, type FavoritesContextValue } from './favoritesContext'
import { favoritesReducer } from './favoritesReducer'

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // The third argument is a *lazy initialiser*: it runs once, not every render,
  // so we read localStorage a single time.
  const [favoriteIds, dispatch] = useReducer(
    favoritesReducer,
    undefined,
    loadFavorites,
  )

  // Synchronise React state out to localStorage whenever it changes.
  useEffect(() => {
    saveFavorites(favoriteIds)
  }, [favoriteIds])

  // Deliberate memoisation: every consumer re-renders whenever this object's
  // identity changes, so we only build a new one when `favoriteIds` changes.
  // (`dispatch` is guaranteed stable by React.)
  const value = useMemo<FavoritesContextValue>(() => {
    const set = new Set(favoriteIds)
    return {
      favoriteIds,
      isFavorite: (id) => set.has(id),
      toggleFavorite: (id) => dispatch({ type: 'toggle', id }),
      clearFavorites: () => dispatch({ type: 'clear' }),
    }
  }, [favoriteIds])

  return <FavoritesContext value={value}>{children}</FavoritesContext>
}
```

```ts
// src/hooks/useFavorites.ts
import { useContext } from 'react'
import {
  FavoritesContext,
  type FavoritesContextValue,
} from '../context/favoritesContext'

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext)
  if (value === null) {
    // Fail loudly during development instead of misbehaving silently.
    throw new Error('useFavorites must be used inside <FavoritesProvider>')
  }
  return value
}
```

**4. UI.**

```tsx
// src/components/FavoriteButton.tsx
import { useFavorites } from '../hooks/useFavorites'
import { formatName } from '../lib/format'
import type { PokemonSummary } from '../types'

export function FavoriteButton({ pokemon }: { pokemon: PokemonSummary }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const active = isFavorite(pokemon.id)

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(pokemon.id)}
      // The label stays constant; `aria-pressed` conveys the on/off state.
      aria-label={`Favorite ${formatName(pokemon.name)}`}
      aria-pressed={active}
      className="rounded-full p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none aria-pressed:text-red-500"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  )
}
```

```tsx
// src/components/FavoritesToggle.tsx
interface FavoritesToggleProps {
  active: boolean
  count: number
  onToggle: () => void
}

export function FavoritesToggle({ active, count, onToggle }: FavoritesToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm ring-1 transition focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none ${
        active
          ? 'bg-red-600 text-white ring-red-600'
          : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50'
      }`}
    >
      ♥ Favorites ({count})
    </button>
  )
}
```

**5. Put the heart on cards.** The heart is a *sibling* of the card button, positioned over its corner.

```tsx
// src/components/PokemonCard.tsx
import { artworkUrl } from '../api/pokeapi'
import { formatId, formatName } from '../lib/format'
import type { PokemonSummary } from '../types'
import { FavoriteButton } from './FavoriteButton'

interface PokemonCardProps {
  pokemon: PokemonSummary
  /** `trigger` is the clicked element, used later to restore focus. */
  onSelect: (pokemon: PokemonSummary, trigger: HTMLElement) => void
}

export function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
  return (
    // A button may not contain another button, so the heart is a *sibling*
    // of the card button, positioned over its corner.
    <div className="relative">
      <button
        type="button"
        onClick={(event) => onSelect(pokemon, event.currentTarget)}
        className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
      >
        <img
          src={artworkUrl(pokemon.id)}
          alt=""
          width={112}
          height={112}
          loading="lazy"
          className="size-28 object-contain"
        />
        <span className="text-xs font-semibold text-slate-400">
          {formatId(pokemon.id)}
        </span>
        <span className="text-base font-bold">{formatName(pokemon.name)}</span>
      </button>
      <div className="absolute top-2 right-2">
        <FavoriteButton pokemon={pokemon} />
      </div>
    </div>
  )
}
```

**6. Put the heart in the modal.** This is the whole change to `PokemonModal`:

```diff
--- a/src/components/PokemonModal.tsx
+++ b/src/components/PokemonModal.tsx
@@ -4,6 +4,7 @@ import { usePokemonDetail } from '../hooks/usePokemonData'
 import { formatId, formatName } from '../lib/format'
 import type { PokemonSummary } from '../types'
 import { ErrorMessage } from './ErrorMessage'
+import { FavoriteButton } from './FavoriteButton'
 import { StatBar } from './StatBar'
 import { TypeBadge } from './TypeBadge'
 
@@ -58,14 +59,17 @@ export function PokemonModal({
               {formatName(pokemon.name)}
             </h2>
           </div>
-          <button
-            type="button"
-            onClick={onClose}
-            aria-label="Close details"
-            className="rounded-full bg-slate-100 px-3 py-1 text-lg leading-none font-bold text-slate-600 hover:bg-slate-200"
-          >
-            ×
-          </button>
+          <div className="flex items-center gap-1">
+            <FavoriteButton pokemon={pokemon} />
+            <button
+              type="button"
+              onClick={onClose}
+              aria-label="Close details"
+              className="rounded-full bg-slate-100 px-3 py-1 text-lg leading-none font-bold text-slate-600 hover:bg-slate-200"
+            >
+              ×
+            </button>
+          </div>
         </div>
 
         <img
```

**7. Let the filter combine several sets.**

```ts
// src/lib/filterPokemon.ts
import type { PokemonSummary } from '../types'

export type SortKey = 'number' | 'name'

export interface FilterOptions {
  query: string
  sort: SortKey
  /**
   * Restrict results to Pokémon whose id is in *every* one of these sets
   * (e.g. "is Fire type" and "is a favorite"). Omit for no restriction.
   */
  mustBeIn?: readonly ReadonlySet<number>[]
}

/**
 * Pure function: same input, same output, no side effects. Components call it
 * during render, so the visible list is always *derived* from state rather than
 * stored in state (one source of truth, nothing to keep in sync).
 */
export function filterAndSort(
  pokemon: readonly PokemonSummary[],
  { query, sort, mustBeIn = [] }: FilterOptions,
): PokemonSummary[] {
  const q = query.trim().toLowerCase()

  // `filter` returns a new array, so sorting it in place does not touch the input.
  const matches = pokemon.filter((p) => {
    if (!mustBeIn.every((ids) => ids.has(p.id))) return false
    if (q === '') return true
    // "mr mime" should find "mr-mime"; "25" should find #25.
    return p.name.replaceAll('-', ' ').includes(q) || String(p.id) === q
  })

  return matches.sort((a, b) =>
    sort === 'name' ? a.name.localeCompare(b.name) : a.id - b.id,
  )
}
```

**8. Provide the context** at the root, then use it in `App`.

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FavoritesProvider } from './context/FavoritesProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Everything inside the provider can read and change favorites. */}
    <FavoritesProvider>
      <App />
    </FavoritesProvider>
  </StrictMode>,
)
```

```tsx
// src/App.tsx
import { useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { ErrorMessage } from './components/ErrorMessage'
import { FavoritesToggle } from './components/FavoritesToggle'
import { Header } from './components/Header'
import { LoadingGrid } from './components/LoadingGrid'
import { PokemonGrid } from './components/PokemonGrid'
import { PokemonModal } from './components/PokemonModal'
import { SearchBar } from './components/SearchBar'
import { SortToggle } from './components/SortToggle'
import { TypeFilter, type TypeFilterValue } from './components/TypeFilter'
import { useDebounce } from './hooks/useDebounce'
import { useFavorites } from './hooks/useFavorites'
import { usePokemonIndex, usePokemonTypeMembers } from './hooks/usePokemonData'
import { filterAndSort, type SortKey } from './lib/filterPokemon'
import type { PokemonSummary } from './types'

const PAGE_SIZE = 24
const SEARCH_DEBOUNCE_MS = 200

interface Selection {
  pokemon: PokemonSummary
  trigger: HTMLElement
}

function App() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilterValue>('all')
  const [sort, setSort] = useState<SortKey>('number')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selection, setSelection] = useState<Selection | null>(null)

  const { favoriteIds } = useFavorites()

  // The input updates instantly; the filtering reacts to the settled value.
  const debouncedQuery = useDebounce(query, SEARCH_DEBOUNCE_MS)

  const index = usePokemonIndex()
  const typeMembers = usePokemonTypeMembers(
    typeFilter === 'all' ? null : typeFilter,
  )

  // Related state is reset in event handlers, not in effects.
  function handleQueryChange(value: string) {
    setQuery(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleSortChange(value: SortKey) {
    setSort(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleTypeChange(value: TypeFilterValue) {
    setTypeFilter(value)
    setVisibleCount(PAGE_SIZE)
  }

  function handleFavoritesOnlyChange() {
    setFavoritesOnly((on) => !on)
    setVisibleCount(PAGE_SIZE)
  }

  let failure: { message: string; retry: () => void } | null = null
  if (index.state.status === 'error') {
    failure = { message: index.state.message, retry: index.reload }
  } else if (typeMembers.state.status === 'error') {
    failure = { message: typeMembers.state.message, retry: typeMembers.reload }
  }

  const isLoading =
    index.state.status === 'loading' || typeMembers.state.status === 'loading'

  let matches: PokemonSummary[] = []
  if (index.state.status === 'success') {
    const mustBeIn: ReadonlySet<number>[] = []
    if (typeMembers.state.status === 'success') {
      mustBeIn.push(typeMembers.state.data)
    }
    if (favoritesOnly) mustBeIn.push(new Set(favoriteIds))

    matches = filterAndSort(index.state.data, {
      query: debouncedQuery,
      sort,
      mustBeIn,
    })
  }
  const shown = matches.slice(0, visibleCount)

  const emptyMessage =
    favoritesOnly && favoriteIds.length === 0
      ? 'No favorites yet. Tap the heart on any Pokémon to save it here.'
      : 'No Pokémon match your search.'

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Header />
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={query} onChange={handleQueryChange} />
          <TypeFilter value={typeFilter} onChange={handleTypeChange} />
          <SortToggle value={sort} onChange={handleSortChange} />
          <FavoritesToggle
            active={favoritesOnly}
            count={favoriteIds.length}
            onToggle={handleFavoritesOnlyChange}
          />
        </div>

        {failure ? (
          <ErrorMessage message={failure.message} onRetry={failure.retry} />
        ) : isLoading ? (
          <LoadingGrid />
        ) : (
          <>
            <p className="text-sm text-slate-500" aria-live="polite">
              Showing {shown.length} of {matches.length} Pokémon
            </p>

            {matches.length > 0 ? (
              <PokemonGrid
                pokemon={shown}
                onSelect={(pokemon, trigger) =>
                  setSelection({ pokemon, trigger })
                }
              />
            ) : (
              <EmptyState message={emptyMessage} />
            )}

            {shown.length < matches.length && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="rounded-xl bg-red-600 px-5 py-2.5 font-semibold text-white shadow-sm hover:bg-red-700"
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selection && (
        // `key` makes React treat each Pokémon as a brand-new modal, so its
        // fetch state resets automatically instead of flashing stale data.
        <PokemonModal
          key={selection.pokemon.id}
          pokemon={selection.pokemon}
          returnFocusTo={selection.trigger}
          onClose={() => setSelection(null)}
        />
      )}
    </div>
  )
}

export default App
```

### How it works

- Click a heart → `toggleFavorite(id)` → `dispatch({ type: 'toggle', id })` → the reducer returns a new array → `FavoritesProvider` re-renders → consumers re-render.
- The `useEffect` in the provider writes to `localStorage` whenever `favoriteIds` changes. On the next visit the lazy initialiser reads it back.
- `useFavorites` throws if there is no provider above it. Failing loudly in development beats a mysterious `undefined` later.
- "Favorites only" is just one more entry in `mustBeIn`; the type filter and the favorites filter intersect naturally.

### Checkpoint

Favorite two Pokémon and reload: the hearts are still filled and the toolbar says **Favorites (2)**. Click it: only those two remain. In dev tools → Application → Local Storage you will see `pokedex:favorites` = `[4,7]`.

### Pitfalls

- **Context for everything:** it is for values many distant components need. Local state belongs in the component that uses it.
- **A new object in `value={{ ... }}` every render** re-renders every consumer. Memoize it (as we do) or keep it stable.
- **Nested buttons** are invalid HTML and break keyboard behaviour. Use sibling elements.

```bash
git diff --stat stage-5 stage-6
```

---

## Stage 7 · Polish

**Goal:** make the app resilient and accessible.

**You will learn:** error boundaries, Tailwind variants (`dark:`, `motion-reduce:`), and the small details that separate a demo from a finished app.

### Steps

**1. Add an error boundary.** It is the one place React still needs a class component.

```tsx
// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Error boundaries are the one place React still needs a class: only classes
 * can implement `getDerivedStateFromError`. It catches errors thrown while
 * *rendering* its children (not in event handlers or async code) and shows a
 * fallback instead of a blank screen.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real app this is where you would report to an error tracker.
    console.error('Unhandled render error', error, info.componentStack)
  }

  render() {
    if (this.state.error === null) return this.props.children

    return (
      <div
        role="alert"
        className="mx-auto mt-16 max-w-md rounded-2xl bg-red-50 p-6 text-center text-red-900 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
      >
        <h1 className="text-xl font-black">Something broke</h1>
        <p className="mt-2 text-sm">
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    )
  }
}
```

Wrap the app with it:

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { FavoritesProvider } from './context/FavoritesProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* Everything inside the provider can read and change favorites. */}
      <FavoritesProvider>
        <App />
      </FavoritesProvider>
    </ErrorBoundary>
  </StrictMode>,
)
```

**2. Dark mode.** Tailwind's `dark:` variant follows the system setting by default. Most of the change is adding paired classes, for example:

```diff
--- a/src/components/PokemonCard.tsx
+++ b/src/components/PokemonCard.tsx
@@ -17,7 +17,7 @@ export function PokemonCard({ pokemon, onSelect }: PokemonCardProps) {
       <button
         type="button"
         onClick={(event) => onSelect(pokemon, event.currentTarget)}
-        className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
+        className="flex w-full flex-col items-center gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0 dark:bg-slate-800 dark:ring-slate-700 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
       >
         <img
           src={artworkUrl(pokemon.id)}
```

`:root { color-scheme: light dark; }` in `src/index.css` also themes native controls (the `<select>` popup, scrollbars):

```css
// src/index.css
@import 'tailwindcss';

/* Lets the browser theme native controls (select popup, scrollbars) to match. */
:root {
  color-scheme: light dark;
}
```

**3. Respect reduced motion.** `motion-reduce:` variants disable hover movement and skeleton pulses for users who asked their OS for less animation (see `motion-reduce:transition-none` in the card diff above, and `motion-reduce:animate-none` on the skeletons).

**4. Check everything once more.**

```bash
pnpm lint
pnpm build
pnpm preview
```

### How it works

- **Error boundary:** React calls `getDerivedStateFromError` when a descendant throws *while rendering*. The boundary swaps its children for a fallback instead of leaving a blank page. It does not catch errors in event handlers or async code; those are handled where they happen (as `useFetchJson` does).
- **`dark:` and `motion-reduce:`** are *variants*: a prefix that applies a class only under a condition (here the `prefers-color-scheme: dark` and `prefers-reduced-motion: reduce` media queries). You write the condition once per class and Tailwind generates the media query.
- **Accessibility you already have:** labelled inputs, `aria-pressed` toggles, `aria-live` result counts, `role="alert"` errors, a native `<dialog>` with focus return, and `alt=""` on decorative images. Turn on a screen reader (VoiceOver: `Cmd+F5`) and try the app with only the keyboard.

### Checkpoint

The app works in both light and dark system themes and on a phone-width viewport. To see the error boundary, temporarily add `throw new Error('boom')` at the top of `App` and reload: you get the fallback, not a white screen. Remove it again.

### Pitfalls

- **Forgetting that error boundaries do not catch async errors.** A rejected `fetch` never reaches the boundary; it must be handled in the code that made the request.
- **Hardcoding colors without a dark variant:** a white card on a dark page is unreadable. Pair every background and text color.

```bash
git diff --stat stage-6 stage-7
```

---

## Where to go next

Each of these is a self-contained exercise on top of the finished app:

1. **React Router.** Make the modal a route (`/pokemon/:id`) so a detail view is linkable and the back button closes it.
2. **TanStack Query.** Replace `useFetchJson` with `useQuery`. Compare what you wrote by hand (caching, retries, deduping, refetch on focus) with what the library gives you. That comparison is the lesson.
3. **Server-side search.** Instead of filtering 1025 names locally, call `/pokemon/{name}` on submit and handle the 404 as "no match".
4. **Sync favorites across tabs** by listening to the `storage` event in `FavoritesProvider`.
5. **Virtualize the grid** with a windowing library so all 1025 cards can render at once.
6. **Add a "compare" mode:** pick two Pokémon and show their stats side by side (new state, new reducer).
7. **Add tests.** Install Vitest and Testing Library and cover the pure helpers first (`filterAndSort`, `favoritesReducer`), then the hooks, then the UI. A complete suite already exists on the `with-tests` git branch if you want to compare against it.
8. **Deploy** the `dist/` folder to any static host (`pnpm build` produces it).

## Glossary

| Term | Meaning here |
|---|---|
| **Component** | A function returning JSX |
| **Props** | Read-only inputs passed from a parent |
| **State** | Data that triggers a re-render when it changes |
| **Derived state** | A value computed from other state during render |
| **Effect** | Code that syncs the component with the outside world |
| **Cleanup** | The function an effect returns; cancels or undoes the effect |
| **Ref** | A mutable box that survives renders without causing them |
| **Custom hook** | A `use*` function that reuses stateful logic |
| **Context** | App-wide values readable without prop drilling |
| **Reducer** | A pure `(state, action) => newState` function |
| **Boundary (data)** | Where untrusted data enters: network, storage, user input |
