import {
  SEVERITY_CLASSES,
  STATUS_CLASSES,
  formatConfidence,
} from "../lib/format";
import { STATUS_LABELS } from "../lib/constants";

const BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-all duration-200";

export function SeverityBadge({ severity }) {
  const cls = SEVERITY_CLASSES[severity] || SEVERITY_CLASSES.LOW;
  return (
    <span className={`${BASE} ${cls} hover:scale-105`}>
      {severity || "—"}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = STATUS_CLASSES[status] || STATUS_CLASSES.uploaded;
  return (
    <span className={`${BASE} ${cls} hover:scale-105`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// Small neutral pill for arbitrary labels (event type, confidence, etc.).
export function Pill({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
    blue: "bg-blue-100 text-blue-800 ring-blue-600/20",
    green: "bg-green-100 text-green-800 ring-green-600/20",
  };
  return (
    <span className={`${BASE} ${tones[tone] || tones.slate} hover:scale-105`}>
      {children}
    </span>
  );
}

export function ConfidencePill({ value }) {
  return <Pill tone="blue">{formatConfidence(value)}</Pill>;
}
