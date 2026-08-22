import { Flag, AlertTriangle, ShieldAlert, Shield } from "lucide-react";

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
      value: bySeverity.HIGH ?? 0,
      icon: ShieldAlert,
      tone: "text-red-600 bg-red-100",
    },
    {
      label: "Medium severity",
      value: bySeverity.MEDIUM ?? 0,
      icon: AlertTriangle,
      tone: "text-amber-600 bg-amber-100",
    },
    {
      label: "Low severity",
      value: bySeverity.LOW ?? 0,
      icon: Shield,
      tone: "text-slate-500 bg-slate-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span
              className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.tone}`}
            >
              <Icon size={18} />
            </span>
            <div className="text-2xl font-semibold text-slate-900 font-display">
              {c.value}
            </div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        );
      })}
    </div>
  );
}
