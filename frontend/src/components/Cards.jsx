export function StatCard({ label, value }) {
  return (
    <div className="border border-line rounded bg-white px-5 py-4">
      <p className="text-ink-soft text-xs font-mono">{label}</p>
      <p className="text-2xl font-semibold text-ink mt-1">{value}</p>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-ink-soft text-sm mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "" }) {
  return (
    <div className={`border border-line rounded bg-white ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-line">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
