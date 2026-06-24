export function SkeletonCard() {
  return (
    <div className="bg-slate-800/60 rounded-xl p-5 animate-pulse">
      <div className="h-3 bg-slate-700 rounded w-1/2 mb-3" />
      <div className="h-7 bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-700 rounded w-1/3" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-700 rounded w-1/3" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-slate-700 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
