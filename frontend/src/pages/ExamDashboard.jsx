import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Video } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/Badge";
import ProcessingStatus from "../components/ProcessingStatus";
import SummaryCards from "../components/SummaryCards";
import SeverityCharts from "../components/SeverityCharts";
import HeatmapImage from "../components/HeatmapImage";
import EventsTable from "../components/EventsTable";
import { ACTIVE_STATUSES, EXAM_TYPE_LABELS } from "../lib/constants";
import { formatDateTime } from "../lib/format";

export default function ExamDashboard() {
  const { id } = useParams();

  const { data: exam, isLoading, isError } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get(`/exams/${id}`).then((r) => r.data),
    // Poll every 3s while the pipeline is still running; stop once terminal.
    refetchInterval: (query) =>
      ACTIVE_STATUSES.includes(query.state.data?.status) ? 3000 : false,
  });

  if (isLoading) {
    return <div className="py-16 text-center text-slate-400">Loading exam…</div>;
  }
  if (isError || !exam) {
    return (
      <div className="py-16 text-center text-red-600">
        Exam not found or failed to load.
      </div>
    );
  }

  const isActive = ACTIVE_STATUSES.includes(exam.status);
  const isFailed = exam.status === "failed";
  const isDone = exam.status === "done";
  const vp = exam.videoProperties;

  return (
    <div>
      <Link
        to="/uploads"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to uploads
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              {exam.examName}
            </h1>
            <StatusBadge status={exam.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
            {vp?.durationSeconds
              ? ` · ${Math.round(vp.durationSeconds)}s`
              : ""}
            {vp?.resolution ? ` · ${vp.resolution}` : ""}
            {exam.uploadedAt
              ? ` · uploaded ${formatDateTime(exam.uploadedAt)}`
              : ""}
          </p>
        </div>

        {isDone && (
          <Link
            to={`/exams/${id}/report`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FileText size={16} />
            Investigation report
          </Link>
        )}
      </div>

      {(isActive || isFailed) && (
        <div className="mx-auto max-w-xl">
          <ProcessingStatus status={exam.status} error={exam.error} />
        </div>
      )}

      {isDone && (
        <div className="space-y-6">
          <SummaryCards summary={exam.summary} />
          <SeverityCharts summary={exam.summary} />

          <div className="grid gap-6 lg:grid-cols-2">
            {exam.hasHeatmap ? (
              <HeatmapImage examId={id} />
            ) : (
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-400 shadow-sm">
                <Video size={16} className="mr-2" />
                No heatmap generated for this exam.
              </div>
            )}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Video properties
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Resolution</dt>
                <dd className="text-slate-800">{vp?.resolution || "—"}</dd>
                <dt className="text-slate-500">Frame rate</dt>
                <dd className="text-slate-800">
                  {vp?.fps ? `${vp.fps.toFixed(1)} fps` : "—"}
                </dd>
                <dt className="text-slate-500">Duration</dt>
                <dd className="text-slate-800">
                  {vp?.durationSeconds
                    ? `${Math.round(vp.durationSeconds)}s`
                    : "—"}
                </dd>
                <dt className="text-slate-500">Total frames</dt>
                <dd className="text-slate-800">{vp?.totalFrames ?? "—"}</dd>
                <dt className="text-slate-500">Processed</dt>
                <dd className="text-slate-800">
                  {formatDateTime(exam.processedAt)}
                </dd>
              </dl>
            </div>
          </div>

          <EventsTable examId={id} />
        </div>
      )}
    </div>
  );
}
