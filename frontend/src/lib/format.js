// Small formatting helpers shared across components.

// Seconds -> "m:ss" (or "h:mm:ss" past an hour). Used for clip/video timestamps.
export function formatTimestamp(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

// ISO / date string -> local human-readable date-time. Falls back gracefully.
export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Bytes -> "12.3 MB". Used for upload file size display.
export function formatBytes(bytes) {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

// Tailwind utility class sets keyed by severity — used by badges and rows.
export const SEVERITY_CLASSES = {
  HIGH: "bg-red-100 text-red-800 ring-red-600/20",
  MEDIUM: "bg-amber-100 text-amber-800 ring-amber-600/20",
  LOW: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

// Fill colors for Recharts bars/segments, keyed by severity.
export const SEVERITY_FILL = {
  HIGH: "#dc2626", // red-600
  MEDIUM: "#d97706", // amber-600
  LOW: "#64748b", // slate-500
};

export const STATUS_CLASSES = {
  uploaded: "bg-slate-100 text-slate-700 ring-slate-500/20",
  tracking: "bg-blue-100 text-blue-800 ring-blue-600/20",
  detecting_events: "bg-blue-100 text-blue-800 ring-blue-600/20",
  generating_clips: "bg-blue-100 text-blue-800 ring-blue-600/20",
  generating_heatmap: "bg-blue-100 text-blue-800 ring-blue-600/20",
  done: "bg-green-100 text-green-800 ring-green-600/20",
  failed: "bg-red-100 text-red-800 ring-red-600/20",
};

// Round a possibly-fractional confidence (0..1) to a percentage string.
export function formatConfidence(value) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}
