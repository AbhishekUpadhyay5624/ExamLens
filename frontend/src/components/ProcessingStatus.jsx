import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { STATUS_STAGES } from "../lib/constants";
import { api, apiErrorMessage } from "../lib/api";

// Vertical stepper over the pipeline stages. Highlights the current stage,
// checks off completed ones, and renders a failure banner if status==failed.
export default function ProcessingStatus({ status, error, examId }) {
  const navigate = useNavigate();
  const failed = status === "failed";
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  // Index of the current stage within the ordered stage list.
  const currentIndex = STATUS_STAGES.findIndex((s) => s.value === status);

  async function handleCancel() {
    if (!examId) return;
    if (!window.confirm("Cancel processing and remove this exam recording?")) {
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await api.delete(`/exams/${examId}`);
      navigate("/uploads", { replace: true });
    } catch (err) {
      setCancelError(apiErrorMessage(err, "Failed to cancel processing."));
      setCancelling(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-md p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {failed ? (
            <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
          ) : (
            <Loader2 size={18} className="animate-spin text-blue-600 dark:text-blue-400" />
          )}
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
            {failed ? "Processing failed" : "Analyzing footage…"}
          </h2>
        </div>

        {examId && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 disabled:opacity-50 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
          >
            {cancelling ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <XCircle size={13} />
            )}
            <span>{cancelling ? "Cancelling…" : "Cancel Job"}</span>
          </button>
        )}
      </div>

      {!failed && (
        <div
          className="mb-5 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-950"
          role="progressbar"
          aria-label="Analysis in progress"
        >
          <div className="h-full w-1/3 rounded-full bg-blue-600 dark:bg-blue-500 animate-sweep" />
        </div>
      )}

      {cancelError && (
        <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {cancelError}
        </div>
      )}

      {failed && error && (
        <div className="mb-5 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-950/50 dark:text-red-300">
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
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-semibold ring-1 ring-inset ${
                    done
                      ? "bg-green-100 text-green-700 ring-green-600/20 dark:bg-green-950/50 dark:text-green-300"
                      : active
                      ? "bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/50 dark:text-blue-300"
                      : isFailedHere
                      ? "bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-950/50 dark:text-red-300"
                      : "bg-slate-100 text-slate-400 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-500"
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
                    ? "font-semibold text-slate-900 dark:text-slate-100"
                    : done
                    ? "text-slate-600 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {!failed && (
        <p className="mt-5 text-xs text-slate-400 dark:text-slate-500">
          This can take a few moments depending on footage duration. The page updates automatically.
        </p>
      )}
    </div>
  );
}
