// src/lib/format.ts
/** "mr-mime" -> "Mr Mime" */
export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** 25 -> "#0025" */
function formatId(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

export default formatId