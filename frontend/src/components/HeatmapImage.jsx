import { useState } from "react";
import { Flame, Maximize2, X } from "lucide-react";
import { useAuthedBlob } from "../lib/useAuthedBlob";

// Renders the motion heatmap PNG (auth-protected, so fetched as a blob).
// Click to open a full-size lightbox.
export default function HeatmapImage({ examId }) {
  const { objectUrl, loading, error } = useAuthedBlob(
    `/exams/${examId}/heatmap`
  );
  const [zoom, setZoom] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Flame size={18} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-slate-800">Motion heatmap</h3>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          Loading heatmap…
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          Heatmap unavailable.
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="group relative block w-full overflow-hidden rounded-xl border border-slate-200"
          >
            <img
              src={objectUrl}
              alt="Motion heatmap"
              className="w-full bg-slate-900"
            />
            <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
              <Maximize2 size={16} />
            </span>
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Warmer regions indicate more accumulated movement across the exam.
          </p>
        </>
      )}

      {zoom && objectUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoom(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
            onClick={() => setZoom(false)}
          >
            <X size={20} />
          </button>
          <img
            src={objectUrl}
            alt="Motion heatmap (enlarged)"
            className="max-h-full max-w-full rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
