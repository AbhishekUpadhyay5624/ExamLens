import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Upload as UploadIcon, XCircle } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import UploadDropzone from "../components/UploadDropzone";
import { EXAM_TYPES } from "../lib/constants";

export default function Upload() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef(null);

  const [file, setFile] = useState(null);
  const [examName, setExamName] = useState("");
  const [examType, setExamType] = useState(EXAM_TYPES[0]?.value || "CBT");
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const selectedType = EXAM_TYPES.find((t) => t.value === examType);

  function handleCancelUpload() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setSubmitting(false);
    setProgress(0);
    setInfoMessage("Upload was cancelled.");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a video file to upload.");
      return;
    }
    setError(null);
    setInfoMessage(null);
    setSubmitting(true);
    setProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const form = new FormData();
    form.append("examName", examName.trim());
    form.append("examType", examType);
    form.append("video", file);

    try {
      const res = await api.post("/exams", form, {
        signal: controller.signal,
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      queryClient.invalidateQueries({ queryKey: ["exams"] });
      navigate(`/exams/${res.data.id}`, { replace: true });
    } catch (err) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        setInfoMessage("Upload was cancelled.");
      } else {
        setError(apiErrorMessage(err, "Upload failed."));
      }
      setSubmitting(false);
    } finally {
      abortControllerRef.current = null;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        to="/uploads"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        <span>Back to uploads</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display">
          Upload Exam Footage
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          The recording is analyzed by the proctoring pipeline: people are tracked, suspicious events are flagged, and a motion heatmap is generated.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-xl"
      >
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
            {infoMessage}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Exam Name / Hall Label
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Computer Science Final — Hall 3A"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 px-3.5 py-2.5 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Testing Format
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {EXAM_TYPES.map((t) => {
              const checked = t.value === examType;
              return (
                <label
                  key={t.value}
                  className={`flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                    checked
                      ? "border-blue-600 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="examType"
                    value={t.value}
                    checked={checked}
                    onChange={(e) => setExamType(e.target.value)}
                    disabled={submitting}
                    className="sr-only"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.label}
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">
                      {t.value}
                    </span>
                  </div>
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.description}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            CCTV Video File
          </label>
          <UploadDropzone
            file={file}
            onFileSelect={setFile}
            disabled={submitting}
          />
        </div>

        {/* Progress Bar & Actions */}
        {submitting && (
          <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
              <span className="flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin" /> Uploading footage to GPU pipeline…
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900/60">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !file || !examName.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 active:scale-95 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing Upload…</span>
              </>
            ) : (
              <>
                <UploadIcon size={16} />
                <span>Start Proctoring Analysis</span>
              </>
            )}
          </button>

          {submitting && (
            <button
              type="button"
              onClick={handleCancelUpload}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300"
            >
              <XCircle size={16} />
              <span>Cancel Upload</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
