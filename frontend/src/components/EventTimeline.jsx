import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { api } from "../lib/api";
import { SEVERITY_FILL, formatTimestamp } from "../lib/format";
import { EVENT_TYPE_LABELS, SEVERITIES } from "../lib/constants";
import Skeleton from "./Skeleton";

// The events list endpoint caps page_size at 200 (backend/app/routers/exams.py),
// so we page through until we've collected every event. Bounded so a runaway
// count can't spin forever.
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
  return { items, total };
}

// Taller marks read as more serious, so height doubles as a severity cue
// alongside color.
const MARK_HEIGHT = { HIGH: "100%", MEDIUM: "68%", LOW: "42%" };

// Paint LOW → MEDIUM → HIGH so the most serious marks land on top.
const PAINT_ORDER = { HIGH: 3, MEDIUM: 2, LOW: 1 };

export default function EventTimeline({ examId, durationSeconds }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["timeline", examId],
    queryFn: () => fetchAllEvents(examId),
  });

  const events = data?.items || [];
  // Prefer the real recording length; fall back to the last event's end time
  // so the plot still spans sensibly if duration metadata is missing.
  const maxEnd = events.reduce((m, e) => Math.max(m, e.endTime || 0), 0);
  const span = durationSeconds && durationSeconds > 0 ? durationSeconds : maxEnd;

  const counts = SEVERITIES.reduce((acc, s) => {
    acc[s] = events.filter((e) => e.severity === s).length;
    return acc;
  }, {});

  const sorted = [...events].sort(
    (a, b) => (PAINT_ORDER[a.severity] || 0) - (PAINT_ORDER[b.severity] || 0)
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Activity size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800">Event timeline</h3>
        {!isLoading && !isError && events.length > 0 && (
          <span className="font-mono text-xs text-slate-400">
            {events.length} {events.length === 1 ? "event" : "events"} over{" "}
            {formatTimestamp(span)}
          </span>
        )}
        {/* Severity legend */}
        <div className="ml-auto flex items-center gap-3">
          {SEVERITIES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: SEVERITY_FILL[s] }}
              />
              <span className="font-mono text-[11px] uppercase tracking-wide text-slate-500">
                {s} {counts[s] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : isError ? (
        <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          Couldn't load the timeline.
        </div>
      ) : events.length === 0 || span <= 0 ? (
        <div className="flex h-24 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          No events were flagged in this recording.
        </div>
      ) : (
        <>
          {/* Plot area */}
          <div className="relative">
            {/* Tooltip for the hovered/focused mark */}
            {active && (
              <div
                className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
                style={{
                  left: `${Math.min(
                    98,
                    Math.max(2, (active.startTime / span) * 100)
                  )}%`,
                }}
              >
                <span className="font-mono">
                  {active.startTimeFormatted || formatTimestamp(active.startTime)}
                </span>{" "}
                · {EVENT_TYPE_LABELS[active.eventType] || active.eventType} ·{" "}
                <span className="font-mono">#{active.personId}</span>
              </div>
            )}

            <div
              role="group"
              aria-label="Flagged events over the recording timeline"
              className="relative h-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* Quarter gridlines */}
              {[25, 50, 75].map((p) => (
                <div
                  key={p}
                  className="absolute top-0 bottom-0 w-px bg-slate-200/70"
                  style={{ left: `${p}%` }}
                />
              ))}

              {/* Event marks, anchored to the baseline */}
              {sorted.map((ev) => {
                const pct = Math.min(100, Math.max(0, (ev.startTime / span) * 100));
                const isActive = active?.id === ev.id;
                const time =
                  ev.startTimeFormatted || formatTimestamp(ev.startTime);
                const label = EVENT_TYPE_LABELS[ev.eventType] || ev.eventType;
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => navigate(`/events/${ev.id}`)}
                    onMouseEnter={() => setActive(ev)}
                    onMouseLeave={() => setActive((a) => (a?.id === ev.id ? null : a))}
                    onFocus={() => setActive(ev)}
                    onBlur={() => setActive((a) => (a?.id === ev.id ? null : a))}
                    aria-label={`${ev.severity} severity — ${label} at ${time}, person ${ev.personId}. Open event.`}
                    className="group absolute bottom-0 top-0 flex w-2.5 -translate-x-1/2 items-end justify-center outline-none"
                    style={{ left: `${pct}%`, zIndex: isActive ? 5 : undefined }}
                  >
                    <span
                      className="rounded-t-sm transition-all group-hover:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-slate-900/40"
                      style={{
                        width: isActive ? 5 : 3,
                        height: MARK_HEIGHT[ev.severity] || "42%",
                        backgroundColor: SEVERITY_FILL[ev.severity],
                        opacity: isActive ? 1 : 0.85,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time axis */}
          <div className="mt-2 flex justify-between font-mono text-[11px] text-slate-400">
            <span>0:00</span>
            <span>{formatTimestamp(span / 2)}</span>
            <span>{formatTimestamp(span)}</span>
          </div>
        </>
      )}
    </section>
  );
}
