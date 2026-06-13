import React from "react";
import { ShieldCheck, Activity, AlertTriangle, ScrollText } from "lucide-react";

function ScoreColor(score) {
  if (score >= 90) return { border: "border-emerald-500/40", text: "text-emerald-400", label: "HEALTHY" };
  if (score >= 70) return { border: "border-amber-500/40", text: "text-amber-400", label: "REVIEW" };
  return { border: "border-red-500/40", text: "text-red-400", label: "ATTENTION" };
}

export default function AuditIntegrityCards({ analytics }) {
  const score = analytics.integrityScore;
  const sc = ScoreColor(score);
  const deltaPositive = analytics.totals.delta >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className={`bg-gray-900/70 border rounded-2xl p-5 ${sc.border}`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Integrity Score
          </span>
          <ShieldCheck className={`w-5 h-5 ${sc.text}`} />
        </div>
        <div className={`text-4xl font-black ${sc.text} tracking-tight`}>{score}</div>
        <div className={`text-[10px] font-bold mt-1 ${sc.text}`}>{sc.label}</div>
      </div>

      <div className="bg-gray-900/70 border border-blue-500/40 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Events / 24h
          </span>
          <Activity className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-3xl font-black text-white">{analytics.totals.last24h}</div>
        <div className={`text-[10px] mt-1 ${deltaPositive ? "text-emerald-400" : "text-amber-400"}`}>
          {deltaPositive ? "▲" : "▼"} {Math.abs(analytics.totals.delta)} vs prior 24h
        </div>
      </div>

      <div className="bg-gray-900/70 border border-violet-500/40 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Critical Actions
          </span>
          <ScrollText className="w-5 h-5 text-violet-400" />
        </div>
        <div className="text-3xl font-black text-white">{analytics.totals.critical}</div>
        <div className="text-[10px] text-gray-500 mt-1">DELETE · CONFIG · PAYOUT · SETTLE · EXPORT</div>
      </div>

      <div className="bg-gray-900/70 border border-amber-500/40 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Open Findings
          </span>
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-3xl font-black text-white">{analytics.findings.length}</div>
        <div className="text-[10px] text-gray-500 mt-1">
          {analytics.findings.filter((f) => f.severity === "high").length} high ·{" "}
          {analytics.findings.filter((f) => f.severity === "medium").length} med
        </div>
      </div>
    </div>
  );
}