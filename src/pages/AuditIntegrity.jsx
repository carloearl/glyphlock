import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, Loader2, Download } from "lucide-react";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import {
  analyzeAuditCoverage,
  analyzeAnomalies,
  computeCoverageScore,
  summarizeBySeverity,
} from "@/lib/nups/auditIntegrity";
import AuditIntegritySummary from "@/components/audit/AuditIntegritySummary";
import AuditCoverageReport from "@/components/audit/AuditCoverageReport";
import AuditAnomalyList from "@/components/audit/AuditAnomalyList";
import { toast } from "sonner";

/**
 * Phase 4 — Audit Tightening
 * Admin-only integrity dashboard. Cross-references critical entity states
 * against ActivityLog entries to surface gaps, then runs heuristics over the
 * log stream itself to flag suspicious patterns.
 */
export default function AuditIntegrity() {
  return (
    <NUPSRouteGuard requiredRoles={["PLATFORM_ADMIN", "VENUE_OWNER"]}>
      <AuditIntegrityContent />
    </NUPSRouteGuard>
  );
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

function downloadCSV(name, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function AuditIntegrityContent() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [lookbackDays, setLookbackDays] = useState(30);

  // Date floor for entity scans
  const sinceISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - lookbackDays);
    return d.toISOString();
  }, [lookbackDays]);

  const venueFilter = venueId ? { venue_id: venueId } : {};

  const { data: activityLogs = [], isLoading: lA } = useQuery({
    queryKey: ["audit-logs", venueId, lookbackDays],
    queryFn: async () => {
      const all = await base44.entities.ActivityLog.filter(venueFilter, "-timestamp", 5000);
      return all.filter((l) => !l.timestamp || l.timestamp >= sinceISO);
    },
  });

  const { data: settlements = [], isLoading: lS } = useQuery({
    queryKey: ["audit-settlements", venueId, lookbackDays],
    queryFn: async () => {
      const all = await base44.entities.DailySettlement.filter(venueFilter, "-business_date", 500);
      return all.filter((s) => {
        const d = s.locked_at || s.created_date;
        return !d || d >= sinceISO;
      });
    },
  });

  const { data: driverPayouts = [], isLoading: lD } = useQuery({
    queryKey: ["audit-drivers", venueId, lookbackDays],
    queryFn: async () => {
      const all = await base44.entities.DriverPayout.filter(venueFilter, "-payout_date", 1000);
      return all.filter((p) => {
        const d = p.processed_at || p.paid_at || p.created_date;
        return !d || d >= sinceISO;
      });
    },
  });

  const { data: glyphBucksOrders = [], isLoading: lG } = useQuery({
    queryKey: ["audit-gb-orders", venueId, lookbackDays],
    queryFn: async () => {
      const all = await base44.entities.GlyphBucksOrder.filter(venueFilter, "-created_date", 1000);
      return all.filter((o) => !o.created_date || o.created_date >= sinceISO);
    },
  });

  const loading = lA || lS || lD || lG;

  const gaps = useMemo(
    () => analyzeAuditCoverage({ activityLogs, settlements, driverPayouts, glyphBucksOrders }),
    [activityLogs, settlements, driverPayouts, glyphBucksOrders]
  );
  const anomalies = useMemo(() => analyzeAnomalies(activityLogs), [activityLogs]);
  const coverage = useMemo(
    () => computeCoverageScore({ settlements, driverPayouts, glyphBucksOrders, gaps }),
    [settlements, driverPayouts, glyphBucksOrders, gaps]
  );
  const gapsBySeverity = useMemo(() => summarizeBySeverity(gaps), [gaps]);
  const anomaliesBySeverity = useMemo(() => summarizeBySeverity(anomalies), [anomalies]);

  const handleExportReport = () => {
    const rows = [
      ...gaps.map((g) => ({
        type: "coverage_gap",
        severity: g.severity,
        kind: g.kind,
        entity: g.entity,
        record_id: g.record_id,
        identifier: g.identifier,
        timestamp: g.ts || "",
        message: g.message,
      })),
      ...anomalies.map((a) => ({
        type: "anomaly",
        severity: a.severity,
        kind: a.kind,
        entity: "",
        record_id: a.log_id || "",
        identifier: a.user || "",
        timestamp: a.timestamp || "",
        message: a.message,
      })),
    ];
    if (!rows.length) {
      toast.success("Nothing to export — system is clean");
      return;
    }
    downloadCSV(`audit_integrity_${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
    toast.success(`Exported ${rows.length} findings`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-red-950/30 px-4 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-white/10 text-gray-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-red-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Audit Integrity</h1>
              <p className="text-[11px] text-gray-500">
                Phase 4 · Coverage gaps · Anomaly detection · BPAAA §11.4
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(Number(e.target.value))}
              className="bg-black/40 border border-gray-700 text-gray-300 text-xs rounded-md px-2 py-1.5"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export Findings
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Cross-referencing audit trail…</span>
          </div>
        ) : (
          <>
            <AuditIntegritySummary
              coverage={coverage}
              gapsBySeverity={gapsBySeverity}
              anomaliesBySeverity={anomaliesBySeverity}
              totalLogs={activityLogs.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <AuditCoverageReport gaps={gaps} />
              <AuditAnomalyList anomalies={anomalies} />
            </div>

            <div className="text-[10px] text-gray-600 bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-violet-400 font-bold">✓ BPAAA §11.4:</span>
              <span>append-only ActivityLog</span>
              <span>RLS blocks UPDATE/DELETE</span>
              <span>server-timestamped only</span>
              <span className="ml-auto text-gray-700">
                Scope: {lookbackDays}d · {activityLogs.length} logs · {settlements.length} settlements ·{" "}
                {driverPayouts.length} payouts · {glyphBucksOrders.length} GB orders
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}