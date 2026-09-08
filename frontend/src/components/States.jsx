export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-ink-soft text-sm py-10 justify-center">
      <span className="w-3 h-3 rounded-full border-2 border-ink-soft/30 border-t-amber animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-14 px-6 border border-dashed border-line rounded bg-white/50">
      <p className="text-ink font-medium">{title}</p>
      {description && (
        <p className="text-ink-soft text-sm mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="border border-clay/30 bg-clay-light text-clay text-sm rounded px-4 py-3">
      {message}
    </div>
  );
}
