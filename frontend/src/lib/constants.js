// Shared enums, labels, and small config maps that mirror the backend contract.
// Kept in one place so pages/components don't hard-code strings.

// Exam types accepted by POST /api/exams (see ml_config.VALID_EXAM_TYPES).
export const EXAM_TYPES = [
  {
    value: "CBT",
    label: "Computer-Based Test",
    hint: "Candidates work on computers. Laptop/screen interaction is expected, so laptop-interaction alerts are suppressed.",
  },
  {
    value: "PAPER_PEN",
    label: "Paper & Pen",
    hint: "Written exam. Any laptop/phone interaction is flagged as HIGH severity.",
  },
  {
    value: "PHYSICAL",
    label: "Physical / Practical",
    hint: "Movement-heavy setting. Excessive-movement alerts are relaxed.",
  },
  {
    value: "HYBRID",
    label: "Hybrid",
    hint: "Mixed setting. All detectors run with default sensitivity.",
  },
];

export const EXAM_TYPE_LABELS = Object.fromEntries(
  EXAM_TYPES.map((t) => [t.value, t.label])
);

// Pipeline stages emitted by the worker via status_cb, in order.
// The last two are terminal.
export const STATUS_STAGES = [
  { value: "uploaded", label: "Uploaded" },
  { value: "tracking", label: "Tracking people" },
  { value: "detecting_events", label: "Detecting events" },
  { value: "generating_clips", label: "Generating clips" },
  { value: "generating_heatmap", label: "Generating heatmap" },
  { value: "done", label: "Done" },
];

// Non-terminal stages -> keep polling while status is one of these.
export const ACTIVE_STATUSES = [
  "uploaded",
  "tracking",
  "detecting_events",
  "generating_clips",
  "generating_heatmap",
];

export const TERMINAL_STATUSES = ["done", "failed"];

export const STATUS_LABELS = {
  uploaded: "Uploaded",
  tracking: "Tracking people",
  detecting_events: "Detecting events",
  generating_clips: "Generating clips",
  generating_heatmap: "Generating heatmap",
  done: "Done",
  failed: "Failed",
};

export const SEVERITIES = ["HIGH", "MEDIUM", "LOW"];

// Human labels for the event types produced by the rule engine.
export const EVENT_TYPE_LABELS = {
  LAPTOP_INTERACTION: "Laptop interaction",
  SUSPICIOUS_STILLNESS: "Suspicious stillness",
  EXCESSIVE_MOVEMENT: "Excessive movement",
};

// Review workflow (PATCH /api/events/{id}).
// Values are lowercase to match the backend ReviewStatus literal.
export const REVIEW_STATUS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "false_positive", label: "False positive" },
];

export const REVIEW_STATUS_LABELS = Object.fromEntries(
  REVIEW_STATUS.map((r) => [r.value, r.label])
);

export const DEFAULT_PAGE_SIZE = 20;
