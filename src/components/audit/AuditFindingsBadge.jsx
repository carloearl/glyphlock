/**
 * Phase 6 / H3 — Audit Findings Inline Badge
 *
 * Drop-in pill for any header. Self-fetches recent ActivityLog,
 * runs auditAnalytics, and shows critical+high count.
 * Returns null when zero — never noise.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldAlert } from "lucide-react";
import { analyzeAuditLogs } from "@/lib/audit/auditAnalytics";

export default function AuditFindingsBadge({ className = "" }) {
  const { data: logs = [] } = useQuery({
    queryKey: ["audit-findings-badge"],
    queryFn: () => base44.entities.ActivityLog.list("-timestamp", 500),
    staleTime: 5 * 60_000,
  });

  let criticalCount = 0;
  try {
    const result = analyzeAuditLogs(logs);
    const findings = result?.findings || [];
    criticalCount = findings.filter(f => f.severity === "high" || f.severity === "critical").length;
  } catch {
    return null;
  }

  if (criticalCount === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 ml-1.5 px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-bold text-red-300 ${className}`}
      title={`${criticalCount} critical / high audit finding${criticalCount === 1 ? "" : "s"}`}
    >
      <ShieldAlert className="w-2.5 h-2.5" />
      {criticalCount}
    </span>
  );
}