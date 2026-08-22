import { Check, Loader2, AlertTriangle } from "lucide-react";
import { STATUS_STAGES } from "../lib/constants";

// Vertical stepper with animated stages and pulse effects.
export default function ProcessingStatus({ status, error }) {
  const failed = status === "failed";
  // Index of the current stage within the ordered stage list.
  const currentIndex = STATUS_STAGES.findIndex((s) => s.value === status);

  return (
    <div className="anim-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        {failed ? (
          <span className="relative flex h-6 w-6 items-center justify-center">
            <AlertTriangle size={18} className="text-red-600 anim-scale-in" />
          </span>
        ) : (
          <span className="relative flex h-6 w-6 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-30" />
            <Loader2 size={18} className="animate-spin text-blue-600" />
          </span>
        )}
        <h2 className="text-base font-semibold text-slate-900">
          {failed ? "Processing failed" : "Analyzing footage…"}
        </h2>
      </div>

      {failed && error && (
        <div className="anim-shake mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
          {error}
        </div>
      )}

      <ol className="space-y-4">
        {STATUS_STAGES.filter((s) => s.value !== "done").map((stage, i) => {
          const done = currentIndex > i && !failed;
          const active = currentIndex === i && !failed;
          const isFailedHere = failed && currentIndex === i;

          return (
            <li
              key={stage.value}
              className="flex items-center gap-3 anim-fade-in-left"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ring-1 ring-inset transition-all duration-300 ${
                  done
                    ? "bg-green-100 text-green-700 ring-green-600/20 scale-100"
                    : active
                    ? "bg-blue-100 text-blue-700 ring-blue-600/20 scale-110 shadow-md shadow-blue-100"
                    : isFailedHere
                    ? "bg-red-100 text-red-700 ring-red-600/20 anim-shake"
                    : "bg-slate-100 text-slate-400 ring-slate-500/20"
                }`}
              >
                {done ? (
                  <Check size={14} className="anim-scale-in" />
                ) : active ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-sm transition-all duration-300 ${
                  active
                    ? "font-medium text-slate-900"
                    : done
                    ? "text-slate-600"
                    : "text-slate-400"
                }`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {!failed && (
        <p className="mt-5 text-xs text-slate-400 anim-gentle-pulse">
          This can take a few minutes depending on footage length. The page
          updates automatically.
        </p>
      )}
    </div>
  );
}
