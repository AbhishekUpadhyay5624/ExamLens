import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { SEVERITY_FILL } from "../lib/format";
import { EVENT_TYPE_LABELS, SEVERITIES } from "../lib/constants";

function ChartCard({ title, children, empty }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-800">{title}</h3>
      {empty ? (
        <div className="flex h-56 items-center justify-center text-sm text-slate-400">
          No events detected
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function SeverityCharts({ summary }) {
  const bySeverity = summary?.eventsBySeverity || {};
  const byType = summary?.eventsByType || {};

  const severityData = SEVERITIES.map((s) => ({
    name: s,
    count: bySeverity[s] || 0,
  }));

  const typeData = Object.entries(byType).map(([type, count]) => ({
    name: EVENT_TYPE_LABELS[type] || type,
    count,
  }));

  const severityEmpty = severityData.every((d) => d.count === 0);
  const typeEmpty = typeData.length === 0 || typeData.every((d) => d.count === 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartCard title="Events by severity" empty={severityEmpty}>
        <BarChart data={severityData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {severityData.map((d) => (
              <Cell key={d.name} fill={SEVERITY_FILL[d.name]} />
            ))}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard title="Events by type" empty={typeEmpty}>
        <BarChart data={typeData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={64} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
