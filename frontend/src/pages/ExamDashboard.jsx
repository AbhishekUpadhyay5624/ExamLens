import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Video } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/Badge";
import ProcessingStatus from "../components/ProcessingStatus";
import SummaryCards from "../components/SummaryCards";
import SeverityCharts from "../components/SeverityCharts";
import EventTimeline from "../components/EventTimeline";
import HeatmapImage from "../components/HeatmapImage";
import EventsTable from "../components/EventsTable";
import Skeleton, { SkeletonCard } from "../components/Skeleton";
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
    return (
      <div>
        <Skeleton className="mb-4 h-4 w-28" />
        <div className="mb-6 space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="mt-6 h-36 w-full rounded-2xl" />
      </div>
    );
  }
  if (isError || !exam) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-slate-600">
          We couldn't load this exam. It may have been removed, or the backend
          isn't reachable.
        </p>
        <Link
          to="/uploads"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to uploads
        </Link>
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
            <h1 className="text-2xl font-semibold text-slate-900 font-display">
              {exam.examName}
            </h1>
            <StatusBadge status={exam.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {EXAM_TYPE_LABELS[exam.examType] || exam.examType}
            {vp?.durationSeconds ? (
              <>
                {" · "}
                <span className="font-mono">
                  {Math.round(vp.durationSeconds)}s
                </span>
              </>
            ) : (
              ""
            )}
            {vp?.resolution ? (
              <>
                {" · "}
                <span className="font-mono">{vp.resolution}</span>
              </>
            ) : (
              ""
            )}
            {exam.uploadedAt ? (
              <>
                {" · uploaded "}
                <span className="font-mono">
                  {formatDateTime(exam.uploadedAt)}
                </span>
              </>
            ) : (
              ""
            )}
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
          <EventTimeline examId={id} durationSeconds={vp?.durationSeconds} />
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
              <h3 className="mb-3 text-sm font-semibold text-slate-800 font-display">
                Video properties
              </h3>
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                <dt className="text-slate-500">Resolution</dt>
                <dd className="font-mono text-slate-800">
                  {vp?.resolution || "—"}
                </dd>
                <dt className="text-slate-500">Frame rate</dt>
                <dd className="font-mono text-slate-800">
                  {vp?.fps ? `${vp.fps.toFixed(1)} fps` : "—"}
                </dd>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-mono text-slate-800">
                  {vp?.durationSeconds
                    ? `${Math.round(vp.durationSeconds)}s`
                    : "—"}
                </dd>
                <dt className="text-slate-500">Total frames</dt>
                <dd className="font-mono text-slate-800">
                  {vp?.totalFrames ?? "—"}
                </dd>
                <dt className="text-slate-500">Processed</dt>
                <dd className="font-mono text-slate-800">
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
