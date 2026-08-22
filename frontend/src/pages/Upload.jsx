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
        className="anim-fade-in-left mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700 hover:gap-2"
      >
        <ArrowLeft size={16} />
        Back to uploads
      </Link>

      <h1 className="anim-fade-in-up anim-delay-1 text-2xl font-semibold text-slate-900">
        Upload exam footage
      </h1>
      <p className="anim-fade-in-up anim-delay-2 mt-1 text-sm text-slate-500">
        The recording is analyzed by the proctoring pipeline: people are
        tracked, suspicious events are flagged, and a motion heatmap is
        generated.
      </p>

      <form
        onSubmit={handleSubmit}
        className="anim-slide-up anim-delay-3 mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover-glow"
      >
        {error && (
          <div className="anim-shake rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
            {error}
          </div>
        )}

        <div className="anim-fade-in-up anim-delay-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Exam name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Physics Final — Hall B — Morning"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:bg-slate-50"
          />
        </div>

        <div className="anim-fade-in-up anim-delay-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Exam type
          </label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            disabled={submitting}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:bg-slate-50"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {selectedType && (
            <p className="mt-1.5 text-xs text-slate-500">{selectedType.hint}</p>
          )}
        </div>

        <div className="anim-fade-in-up anim-delay-6">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Footage
          </label>
          <UploadDropzone file={file} onFile={setFile} disabled={submitting} />
        </div>

        {submitting && (
          <div className="anim-fade-in-up">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 anim-gentle-pulse" />
                {progress < 100 ? "Uploading…" : "Finalizing upload…"}
              </span>
              <span className="font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="progress-animated h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-press ripple-container inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? "Uploading…" : "Upload & analyze"}
        </button>
      </form>
    </div>
  );
}
