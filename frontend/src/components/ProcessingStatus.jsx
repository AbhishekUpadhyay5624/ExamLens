import { Check, Loader2, AlertTriangle } from "lucide-react";
import { STATUS_STAGES } from "../lib/constants";

// Vertical stepper over the pipeline stages. Highlights the current stage,
// checks off completed ones, and renders a failure banner if status==failed.
export default function ProcessingStatus({ status, error }) {
  const failed = status === "failed";
  // Index of the current stage within the ordered stage list.
  const currentIndex = STATUS_STAGES.findIndex((s) => s.value === status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {failed ? (
          <AlertTriangle size={18} className="text-red-600" />
        ) : (
          <Loader2 size={18} className="animate-spin text-blue-600" />
        )}
        <h2 className="text-base font-semibold text-slate-900 font-display">
          {failed ? "Processing failed" : "Analyzing footage…"}
        </h2>
      </div>

      {!failed && (
        <div
          className="mb-5 h-1 overflow-hidden rounded-full bg-blue-100"
          role="progressbar"
          aria-label="Analysis in progress"
        >
          {/* Indeterminate sweep — conveys ongoing work without a real %. */}
          <div className="h-full w-1/3 rounded-full bg-blue-500 animate-sweep" />
        </div>
      )}

      {failed && error && (
        <div className="mb-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
          {error}
        </div>
      )}

      <ol className="space-y-4">
        {STATUS_STAGES.filter((s) => s.value !== "done").map((stage, i) => {
          const done = currentIndex > i && !failed;
          const active = currentIndex === i && !failed;
          const isFailedHere = failed && currentIndex === i;

          return (
            <li key={stage.value} className="flex items-center gap-3">
              <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center">
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-blue-400/50 animate-pulse-ring"
                  />
                )}
                <span
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-medium ring-1 ring-inset ${
                    done
                      ? "bg-green-100 text-green-700 ring-green-600/20"
                      : active
                      ? "bg-blue-100 text-blue-700 ring-blue-600/20"
                      : isFailedHere
                      ? "bg-red-100 text-red-700 ring-red-600/20"
                      : "bg-slate-100 text-slate-400 ring-slate-500/20"
                  }`}
                >
                  {done ? (
                    <Check size={14} />
                  ) : active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    i + 1
                  )}
                </span>
              </span>
              <span
                className={`text-sm ${
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
        <p className="mt-5 text-xs text-slate-400">
          This can take a few minutes depending on footage length. The page
          updates automatically.
        </p>
      )}
    </div>
  );
}
