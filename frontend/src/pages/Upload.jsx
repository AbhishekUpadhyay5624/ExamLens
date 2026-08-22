import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api, apiErrorMessage } from "../lib/api";
import UploadDropzone from "../components/UploadDropzone";
import { EXAM_TYPES } from "../lib/constants";

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [file, setFile] = useState(null);
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState(EXAM_TYPES[0].value);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const selectedType = EXAM_TYPES.find((t) => t.value === examType);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a video file to upload.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setProgress(0);

    const form = new FormData();
    form.append("examName", examName.trim());
    form.append("examType", examType);
    form.append("video", file);

    try {
      const res = await api.post("/exams", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });
      // Freshly created — invalidate the list and jump to its dashboard.
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      navigate(`/exams/${res.data.id}`, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Upload failed."));
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/uploads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to uploads
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
        Upload footage
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        The recording is analyzed by the proctoring pipeline: people are
        tracked, suspicious events are flagged, and a motion heatmap is
        generated.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-6 shadow-sm"
      >
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Exam name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Physics Final — Hall B — Morning"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Exam type
          </label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {selectedType && (
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{selectedType.hint}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Footage
          </label>
          <UploadDropzone file={file} onFile={setFile} disabled={submitting} />
        </div>

        {submitting && (
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>
                {progress < 100 ? "Uploading…" : "Finalizing upload…"}
              </span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Uploading…" : "Upload & analyze"}
        </button>
      </form>
    </div>
  );
}
