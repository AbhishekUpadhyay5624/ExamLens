import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Film, Check } from "lucide-react";
import { api } from "../lib/api";
import { SeverityBadge, ConfidencePill } from "./Badge";
import Pagination from "./Pagination";
import { SkeletonRows } from "./Skeleton";
import {
  SEVERITIES,
  EVENT_TYPE_LABELS,
  REVIEW_STATUS_LABELS,
} from "../lib/constants";
import { formatTimestamp } from "../lib/format";

const PAGE_SIZE = 25;

function buildParams({ page, severity, eventType, reviewed }) {
  const params = { page, page_size: PAGE_SIZE };
  if (severity) params.severity = severity;
  if (eventType) params.eventType = eventType;
  if (reviewed !== "") params.reviewed = reviewed === "reviewed";
  return params;
}

export default function EventsTable({ examId }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [severity, setSeverity] = useState("");
  const [eventType, setEventType] = useState("");
  const [reviewed, setReviewed] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["events", examId, page, severity, eventType, reviewed],
    queryFn: () =>
      api
        .get(`/exams/${examId}/events`, {
          params: buildParams({ page, severity, eventType, reviewed }),
        })
        .then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  // Reset to page 1 whenever a filter changes.
  function onFilter(setter) {
    return (e) => {
      setter(e.target.value);
      setPage(1);
    };
  }

  const items = data?.items || [];
  const selectCls =
    "rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
        <h3 className="mr-auto text-sm font-semibold text-slate-800 font-display">
          Flagged events
        </h3>
        <select value={severity} onChange={onFilter(setSeverity)} className={selectCls}>
          <option value="">All severities</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select value={eventType} onChange={onFilter(setEventType)} className={selectCls}>
          <option value="">All types</option>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select value={reviewed} onChange={onFilter(setReviewed)} className={selectCls}>
          <option value="">All</option>
          <option value="reviewed">Reviewed</option>
          <option value="unreviewed">Unreviewed</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonRows rows={6} cols={7} />
      ) : isError ? (
        <div className="p-10 text-center text-sm text-red-600">
          Couldn't load events. Check that the backend is running, then retry.
        </div>
      ) : items.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">
          No events match these filters.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Confidence</th>
                  <th className="px-4 py-3 font-medium">Clip</th>
                  <th className="px-4 py-3 font-medium">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono font-medium text-slate-900">
                      {ev.startTimeFormatted || formatTimestamp(ev.startTime)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      #{ev.personId}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <ConfidencePill value={ev.confidence} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {ev.hasClip ? (
                        <Film size={16} className="text-blue-500" />
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ev.reviewed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                          <Check size={14} />
                          {REVIEW_STATUS_LABELS[ev.reviewStatus] || "Reviewed"}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data?.total || 0}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
