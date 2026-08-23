import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, FileText, Film } from "lucide-react";
import { api } from "../lib/api";
import Skeleton from "../components/Skeleton";
import HeatmapImage from "../components/HeatmapImage";
import { EVENT_TYPE_LABELS } from "../lib/constants";
import { formatDate } from "../lib/format";

const PAGE = 200;
const MAX_PAGES = 12;

async function fetchAllEvents(examId) {
  let page = 1;
  let items = [];
  let total = Infinity;
  while (items.length < total && page <= MAX_PAGES) {
    const { data } = await api.get(`/exams/${examId}/events`, {
      params: { page, page_size: PAGE },
    });
    total = data.total ?? items.length;
    items = items.concat(data.items || []);
    if (!data.items || data.items.length < PAGE) break;
    page += 1;
  }
  return items;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 print-avoid-break print:bg-slate-50 print:border-slate-200">
      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display">
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    </div>
  );
}

function ReviewTable({ title, rows, eventsList }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="print-avoid-break">
      <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
        {title}
      </h3>
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Event</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Person</th>
              <th className="px-3 py-2 font-medium text-center">Clip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => {
              const ev = eventsList?.find(e => e.eventId === r.event_id);
              return (
                <tr key={r.event_id}>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                    #{r.event_id}
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400">
                    {EVENT_TYPE_LABELS[r.type] || r.type}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                    #{r.person}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {ev?.hasClip ? (
                      <Link
                        to={`/events/${ev.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-800 transition"
                      >
                        <Film size={16} />
                      </Link>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
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

  const { data: eventsList } = useQuery({
    queryKey: ["all-events", id],
    queryFn: () => fetchAllEvents(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-6">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4"
              >
                <Skeleton className="mb-2 h-7 w-10 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-3 w-20 bg-slate-200 dark:bg-slate-700" />
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
        <p className="text-slate-600 dark:text-slate-400">
          {notReady
            ? "The report isn't ready yet — processing may still be running."
            : "Failed to load the report."}
        </p>
        <Link
          to={`/exams/${id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <ArrowLeft size={16} />
          Back to exam
        </Link>
      </div>
    );
  }

  const info = report.exam_info || {};
  const video = report.video_info || {};
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

      <div className="print-container rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-8 shadow-sm print:bg-white print:border-none print:shadow-none">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FileText size={22} />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-display">
              Investigation Report
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {exam?.examName ? `${exam.examName} · ` : ""}
              {info.exam_type}
              {exam?.processedAt ? (
                <>
                  {" · "}
                  <span className="font-mono">
                    {formatDate(exam.processedAt)}
                  </span>
                </>
              ) : (
                ""
              )}
            </p>
          </div>
        </div>

        {info.exam_description && (
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{info.exam_description}</p>
        )}

        {/* Key stats */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <Stat label="Total events" value={exam?.summary?.totalEvents ?? eventsList?.length ?? events.total_events ?? 0} />
          <Stat label="High severity" value={exam?.summary?.eventsBySeverity?.HIGH ?? exam?.summary?.eventsBySeverity?.high ?? events.high_severity ?? 0} />
          <Stat label="Medium severity" value={exam?.summary?.eventsBySeverity?.MEDIUM ?? exam?.summary?.eventsBySeverity?.medium ?? events.medium_severity ?? 0} />
        </div>

        {/* Video + processing details */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 print-avoid-break">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
              Recording
            </h3>
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Resolution</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {video.resolution || "—"}
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {video.duration_seconds
                  ? `${Math.round(video.duration_seconds)}s`
                  : "—"}
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Total frames</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {video.total_frames ?? "—"}
              </dd>
            </dl>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
              Recommendations
            </h3>
            <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Manual review</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                <span className="font-mono">
                  {rec.manual_review_required ?? 0}
                </span>{" "}
                events
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Est. review time</dt>
              <dd className="text-slate-800 dark:text-slate-200">
                <span className="font-mono">
                  {rec.estimated_review_time_minutes ?? 0}
                </span>{" "}
                min
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Attention persons</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {rec.attention_persons?.length
                  ? rec.attention_persons.map((p) => `#${p}`).join(", ")
                  : "—"}
              </dd>
            </dl>
          </div>
        </div>

        {exam?.hasHeatmap && (
          <div className="mb-6 print-avoid-break">
            <HeatmapImage examId={id} />
          </div>
        )}

        {/* Priority tables */}
        <div className="space-y-5">
          <ReviewTable
            title="Immediate review (high severity)"
            rows={priority.immediate_review}
            eventsList={eventsList}
          />
          <ReviewTable
            title="Secondary review (medium severity)"
            rows={priority.secondary_review}
            eventsList={eventsList}
          />
          {!priority.immediate_review?.length &&
            !priority.secondary_review?.length && (
              <p className="text-sm text-slate-500">
                No high or medium severity events flagged for review.
              </p>
            )}
        </div>

        {/* Final review */}
        <div className="mt-8 print-avoid-break">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100 font-display">
            Final review
          </h2>
          {!eventsList ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : eventsList.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No events found.</p>
          ) : (
            (() => {
              const confirmed = eventsList.filter(e => e.reviewed && e.reviewStatus === "confirmed");
              const falsePositives = eventsList.filter(e => e.reviewed && e.reviewStatus === "false_positive");
              const pending = eventsList.filter(e => !e.reviewed);
              
              if (eventsList.filter(e => e.reviewed).length === 0) {
                return <p className="text-sm text-slate-500 dark:text-slate-400">No events reviewed yet.</p>;
              }
              
              return (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-5 print:bg-white print:border-slate-200">
                  <div className="mb-5 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display">{confirmed.length}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Confirmed cheating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display">{falsePositives.length}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">False positive</div>
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display">{pending.length}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Pending review</div>
                    </div>
                  </div>
                  
                  {confirmed.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                      <h3 className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">Confirmed Events:</h3>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {confirmed.map(e => (
                          <li key={e.id} className="text-sm text-slate-600 dark:text-slate-400">
                            Event <span className="font-mono text-slate-900 dark:text-slate-200">#{e.eventId}</span> · {EVENT_TYPE_LABELS[e.eventType] || e.eventType} · Person <span className="font-mono text-slate-900 dark:text-slate-200">#{e.personId}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
