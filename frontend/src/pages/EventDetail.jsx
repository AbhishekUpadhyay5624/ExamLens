import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Save } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { SeverityBadge, ConfidencePill } from "../components/Badge";
import ClipPlayer from "../components/ClipPlayer";
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
    return <div className="py-16 text-center text-slate-400">Loading event…</div>;
  }
  if (isError || !event) {
    return (
      <div className="py-16 text-center text-red-600">
        Event not found or failed to load.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/exams/${event.examId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to exam
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">
                Description
              </h3>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          )}
        </div>

        {/* Metadata + review controls */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Details</h3>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-slate-500">Person</dt>
              <dd className="text-slate-800">#{event.personId}</dd>
              <dt className="text-slate-500">Start</dt>
              <dd className="text-slate-800">
                {event.startTimeFormatted || formatTimestamp(event.startTime)}
              </dd>
              <dt className="text-slate-500">End</dt>
              <dd className="text-slate-800">
                {event.endTimeFormatted || formatTimestamp(event.endTime)}
              </dd>
              <dt className="text-slate-500">Duration</dt>
              <dd className="text-slate-800">
                {event.duration != null ? `${event.duration.toFixed(1)}s` : "—"}
              </dd>
              <dt className="text-slate-500">Event ID</dt>
              <dd className="text-slate-800">#{event.eventId}</dd>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Review</h3>

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
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-400 bg-slate-100 text-slate-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reviewer notes…"
              className="mb-3 w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
