import { Flag, AlertTriangle, ShieldAlert, Shield } from "lucide-react";
import { useCountUp } from "../lib/useCountUp";

// One KPI card. The count-up runs on mount and the card fades up with a small
// per-card delay so the row reveals as a quick left-to-right cascade.
function StatCard({ label, value, icon: Icon, tone, index }) {
  const count = useCountUp(value);
  return (
    <div
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <span
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}
      >
        <Icon size={18} />
      </span>
      <div className="text-2xl font-semibold text-slate-900 font-display tabular-nums">
        {count}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

// Top-of-dashboard KPI cards. `summary` is exam.summary from the API.
export default function SummaryCards({ summary }) {
  const bySeverity = summary?.eventsBySeverity || {};
  const cards = [
    {
      label: "Total events",
      value: summary?.totalEvents ?? 0,
      icon: Flag,
      tone: "text-blue-600 bg-blue-100",
    },
    {
      label: "High severity",
      value: bySeverity.HIGH ?? bySeverity.high ?? 0,
      icon: ShieldAlert,
      tone: "text-red-600 bg-red-100",
    },
    {
      label: "Medium severity",
      value: bySeverity.MEDIUM ?? bySeverity.medium ?? 0,
      icon: AlertTriangle,
      tone: "text-amber-600 bg-amber-100",
    },
    {
      label: "Low severity",
      value: bySeverity.LOW ?? bySeverity.low ?? 0,
      icon: Shield,
      tone: "text-slate-500 bg-slate-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c, i) => (
        <StatCard key={c.label} index={i} {...c} />
      ))}
    </div>
  );
}
