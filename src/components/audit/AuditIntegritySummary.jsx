import React from "react";
import { ShieldCheck, AlertTriangle, Activity, FileSearch } from "lucide-react";

export default function AuditIntegritySummary({ coverage, gapsBySeverity, anomaliesBySeverity, totalLogs }) {
  const scorePct = (coverage.score * 100).toFixed(1);
  const scoreColor =
    coverage.score >= 0.95 ? "emerald" : coverage.score >= 0.8 ? "amber" : "red";

  const cards = [
    {
      label: "Coverage Score",
      value: `${scorePct}%`,
      sub: `${coverage.covered} of ${coverage.total} critical actions logged`,
      icon: ShieldCheck,
      color: scoreColor,
    },
    {
      label: "Coverage Gaps",
      value: String(coverage.missing),
      sub: `${gapsBySeverity.critical} critical · ${gapsBySeverity.high} high · ${gapsBySeverity.medium} medium`,
      icon: FileSearch,
      color: coverage.missing === 0 ? "emerald" : gapsBySeverity.critical > 0 ? "red" : "amber",
    },
    {
      label: "Anomalies Detected",
      value: String(
        anomaliesBySeverity.critical + anomaliesBySeverity.high + anomaliesBySeverity.medium + anomaliesBySeverity.low
      ),
      sub: `${anomaliesBySeverity.medium} after-hours · ${anomaliesBySeverity.low} bursts/gaps`,
      icon: AlertTriangle,
      color: anomaliesBySeverity.medium > 0 ? "amber" : "blue",
    },
    {
      label: "Log Entries Analyzed",
      value: String(totalLogs),
      sub: "Append-only audit trail",
      icon: Activity,
      color: "violet",
    },
  ];

  const colorMap = {
    emerald: "border-emerald-500/40 text-emerald-400",
    amber: "border-amber-500/40 text-amber-400",
    red: "border-red-500/40 text-red-400",
    blue: "border-blue-500/40 text-blue-400",
    violet: "border-violet-500/40 text-violet-400",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className={`bg-gray-900/70 border rounded-2xl p-5 ${colorMap[c.color]} backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {c.label}
              </span>
              <Icon className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-3xl font-black text-white tracking-tight">{c.value}</div>
            <div className="text-[11px] text-gray-500 mt-2 leading-snug">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}