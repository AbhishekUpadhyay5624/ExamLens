// Loading placeholders. A subtle pulsing block that mirrors the shape of the
// content it stands in for — calmer than a "Loading…" line and it keeps layout
// from jumping when data arrives. `animate-pulse` is quieted by the global
// prefers-reduced-motion rule in index.css.

export default function Skeleton({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />
  );
}

// A run of text lines; the last line is shortened so it reads as a paragraph.
export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// A card-shaped placeholder matching the app's standard card chrome.
export function SkeletonCard({ className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <Skeleton className="mb-4 h-9 w-9 rounded-lg" />
      <Skeleton className="mb-2 h-7 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

// Placeholder rows for a table body. `cols` controls cells per row.
export function SkeletonRows({ rows = 6, cols = 5 }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? "w-24" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
