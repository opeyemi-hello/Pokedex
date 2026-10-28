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
