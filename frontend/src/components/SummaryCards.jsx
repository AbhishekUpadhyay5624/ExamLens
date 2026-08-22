import { useEffect, useState } from "react";
import { Flag, AlertTriangle, ShieldAlert, Shield } from "lucide-react";

// Animated counter that counts up from 0 to target
function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    let start = 0;
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display}</span>;
}

// Top-of-dashboard KPI cards with stagger-in animation
export default function SummaryCards({ summary }) {
  const bySeverity = summary?.eventsBySeverity || {};
  const cards = [
    {
      label: "Total events",
      value: summary?.totalEvents ?? 0,
      icon: Flag,
      tone: "text-blue-600 bg-blue-100",
      borderTone: "hover:border-blue-200",
    },
    {
      label: "High severity",
      value: bySeverity.HIGH ?? 0,
      icon: ShieldAlert,
      tone: "text-red-600 bg-red-100",
      borderTone: "hover:border-red-200",
    },
    {
      label: "Medium severity",
      value: bySeverity.MEDIUM ?? 0,
      icon: AlertTriangle,
      tone: "text-amber-600 bg-amber-100",
      borderTone: "hover:border-amber-200",
    },
    {
      label: "Low severity",
      value: bySeverity.LOW ?? 0,
      icon: Shield,
      tone: "text-slate-500 bg-slate-100",
      borderTone: "hover:border-slate-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`anim-fade-in-up hover-card btn-press group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${c.borderTone}`}
            style={{ animationDelay: `${0.1 + idx * 0.1}s` }}
          >
            <span
              className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all group-hover:scale-110 group-hover:shadow-sm ${c.tone}`}
            >
              <Icon size={18} />
            </span>
            <div className="text-2xl font-semibold text-slate-900">
              <AnimatedNumber value={c.value} />
            </div>
            <div className="text-xs text-slate-500">{c.label}</div>
          </div>
        );
      })}
    </div>
  );
}
