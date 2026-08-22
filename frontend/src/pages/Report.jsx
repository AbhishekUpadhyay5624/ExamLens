import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import { api } from "../lib/api";
import Skeleton from "../components/Skeleton";
import { EVENT_TYPE_LABELS } from "../lib/constants";
import { formatDateTime } from "../lib/format";

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 print-avoid-break">
      <div className="text-2xl font-semibold text-slate-900 font-display">
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ReviewTable({ title, rows, showDuration }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="print-avoid-break">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 font-display">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Person</th>
              <th className="px-3 py-2 font-medium">Time</th>
              {showDuration && <th className="px-3 py-2 font-medium">Duration</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.event_id}>
                <td className="px-3 py-2 font-mono text-slate-700">
                  #{r.event_id}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {EVENT_TYPE_LABELS[r.type] || r.type}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600">
                  #{r.person}
                </td>
                <td className="px-3 py-2 font-mono text-slate-600">{r.time}</td>
                {showDuration && (
                  <td className="px-3 py-2 font-mono text-slate-600">
                    {r.duration}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Report() {
  const { id } = useParams();

  const { data: exam } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => api.get(`/exams/${id}`).then((r) => r.data),
  });

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["report", id],
    queryFn: () => api.get(`/exams/${id}/report`).then((r) => r.data),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-6">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <Skeleton className="mb-2 h-7 w-10 bg-slate-200" />
                <Skeleton className="h-3 w-20 bg-slate-200" />
              </div>
            ))}
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    const notReady = error?.response?.status === 409;
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-slate-600">
          {notReady
            ? "The report isn't ready yet — processing may still be running."
            : "Failed to load the report."}
        </p>
        <Link
          to={`/exams/${id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          Back to exam
        </Link>
      </div>
    );
  }

  const info = report.exam_info || {};
  const video = report.video_info || {};
  const proc = report.processing_summary || {};
  const events = report.events_summary || {};
  const priority = report.investigation_priority || {};
  const rec = report.recommendations || {};

  return (
    <div className="mx-auto max-w-3xl">
      {/* Chrome — hidden when printing */}
      <div className="no-print mb-4 flex items-center justify-between">
        <Link
          to={`/exams/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to exam
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Printer size={16} />
          Print / Save as PDF
        </button>
      </div>

      <div className="print-container rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 pb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FileText size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 font-display">
              Investigation Report
            </h1>
            <p className="text-sm text-slate-500">
              {exam?.examName ? `${exam.examName} · ` : ""}
              {info.exam_type}
              {exam?.processedAt ? (
                <>
                  {" · "}
                  <span className="font-mono">
                    {formatDateTime(exam.processedAt)}
                  </span>
                </>
              ) : (
                ""
              )}
            </p>
          </div>
        </div>

        {info.exam_description && (
          <p className="mb-6 text-sm text-slate-600">{info.exam_description}</p>
        )}

        {/* Key stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total events" value={events.total_events ?? 0} />
          <Stat label="High severity" value={events.high_severity ?? 0} />
          <Stat label="Medium severity" value={events.medium_severity ?? 0} />
          <Stat label="People tracked" value={proc.persons_tracked ?? 0} />
        </div>

        {/* Video + processing details */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 font-display">
              Recording
            </h3>
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500">Resolution</dt>
              <dd className="font-mono text-slate-800">
                {video.resolution || "—"}
              </dd>
              <dt className="text-slate-500">Duration</dt>
              <dd className="font-mono text-slate-800">
                {video.duration_seconds
                  ? `${Math.round(video.duration_seconds)}s`
                  : "—"}
              </dd>
              <dt className="text-slate-500">Total frames</dt>
              <dd className="font-mono text-slate-800">
                {video.total_frames ?? "—"}
              </dd>
            </dl>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 font-display">
              Recommendations
            </h3>
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500">Manual review</dt>
              <dd className="text-slate-800">
                <span className="font-mono">
                  {rec.manual_review_required ?? 0}
                </span>{" "}
                events
              </dd>
              <dt className="text-slate-500">Est. review time</dt>
              <dd className="text-slate-800">
                <span className="font-mono">
                  {rec.estimated_review_time_minutes ?? 0}
                </span>{" "}
                min
              </dd>
              <dt className="text-slate-500">Attention persons</dt>
              <dd className="font-mono text-slate-800">
                {rec.attention_persons?.length
                  ? rec.attention_persons.map((p) => `#${p}`).join(", ")
                  : "—"}
              </dd>
            </dl>
          </div>
        </div>

        {/* Priority tables */}
        <div className="space-y-5">
          <ReviewTable
            title="Immediate review (high severity)"
            rows={priority.immediate_review}
            showDuration
          />
          <ReviewTable
            title="Secondary review (medium severity)"
            rows={priority.secondary_review}
          />
          {!priority.immediate_review?.length &&
            !priority.secondary_review?.length && (
              <p className="text-sm text-slate-500">
                No high or medium severity events flagged for review.
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
