import { ChevronLeft, ChevronRight } from "lucide-react";

// Simple prev/next pager with animated buttons.
export default function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="anim-fade-in flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
      <span className="text-slate-500">
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="btn-press inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
        >
          <ChevronLeft size={16} />
          Prev
        </button>
        <span className="px-2 text-slate-500 tabular-nums">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="btn-press inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
