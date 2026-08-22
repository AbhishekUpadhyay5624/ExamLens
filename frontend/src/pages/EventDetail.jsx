import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Save } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { SeverityBadge, ConfidencePill } from "../components/Badge";
import ClipPlayer from "../components/ClipPlayer";
import Skeleton from "../components/Skeleton";
import { EVENT_TYPE_LABELS, REVIEW_STATUS } from "../lib/constants";
import { formatTimestamp } from "../lib/format";

export default function EventDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
  });

  const [reviewStatus, setReviewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Sync local form state whenever the event (re)loads.
  useEffect(() => {
    if (event) {
      setReviewStatus(event.reviewStatus || "");
      setNotes(event.reviewerNotes || "");
    }
  }, [event]);

  const mutation = useMutation({
    mutationFn: (body) => api.patch(`/events/${id}`, body).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["event", id], updated);
      // The dashboard's events table reflects the new review state.
      if (updated?.examId) {
        queryClient.invalidateQueries({ queryKey: ["events", updated.examId] });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  function handleSave() {
    const body = { reviewerNotes: notes };
    if (reviewStatus) {
      body.reviewStatus = reviewStatus; // backend sets reviewed=true implicitly
    } else {
      body.reviewed = false;
    }
    mutation.mutate(body);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="mb-6 flex items-center gap-3">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }
  if (isError || !event) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          We couldn't load this event. It may have been removed, or the backend
          isn't reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/exams/${event.examId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
      >
        <ArrowLeft size={16} />
        Back to exam
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 font-display">
          {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
        </h1>
        <SeverityBadge severity={event.severity} />
        <ConfidencePill value={event.confidence} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Clip + description */}
        <div className="space-y-4 lg:col-span-3">
          <ClipPlayer eventId={event.id} hasClip={event.hasClip} />
          {event.description && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
                Description
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
            </div>
          )}
        </div>

        {/* Metadata + review controls */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
              Details
            </h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500 dark:text-slate-400">Person</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">#{event.personId}</dd>
              <dt className="text-slate-500 dark:text-slate-400">Start</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {event.startTimeFormatted || formatTimestamp(event.startTime)}
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">End</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {event.endTimeFormatted || formatTimestamp(event.endTime)}
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">
                {event.duration != null ? `${event.duration.toFixed(1)}s` : "—"}
              </dd>
              <dt className="text-slate-500 dark:text-slate-400">Event ID</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200">#{event.eventId}</dd>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200 font-display">
              Review
            </h3>

            <div className="mb-4 flex gap-2">
              {REVIEW_STATUS.map((r) => {
                const active = reviewStatus === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReviewStatus(active ? "" : r.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      active
                        ? r.value === "confirmed"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                          : "border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reviewer notes…"
              className="mb-3 w-full resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm px-3 py-2 text-sm dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />

            {mutation.isError && (
              <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20">
                {apiErrorMessage(mutation.error, "Failed to save review.")}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={mutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : saved ? (
                <Check size={16} />
              ) : (
                <Save size={16} />
              )}
              {saved ? "Saved" : "Save review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
