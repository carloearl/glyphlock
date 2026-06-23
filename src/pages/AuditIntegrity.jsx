import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowLeft, RefreshCw, Loader2, Download, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { analyzeAuditLogs } from "@/lib/audit/auditAnalytics";
import AuditIntegrityCards from "@/components/audit/AuditIntegrityCards";
import AuditActionBreakdown from "@/components/audit/AuditActionBreakdown";
import CriticalEventsStream from "@/components/audit/CriticalEventsStream";
import IntegrityFindingsPanel from "@/components/audit/IntegrityFindingsPanel";
import TopActorsPanel from "@/components/audit/TopActorsPanel";

/**
 * Audit Integrity — admin-only compliance dashboard.
 * Sits on top of ActivityLog; never mutates. Surfaces:
 *   • integrity score + 24h volume delta
 *   • action breakdown (critical actions highlighted)
 *   • top actors with critical-action counts
 *   • critical events stream
 *   • anomaly findings (A1–A5)
 */
export default function AuditIntegrity() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setIsAdmin(u?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
      setAuthChecked(true);
    })();
  }, []);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["audit-integrity-logs"],
    queryFn: () => base44.entities.ActivityLog.list("-timestamp", 2000),
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const { data: systemMode = "REAL" } = useQuery({
    queryKey: ["audit-integrity-mode"],
    queryFn: async () => {
      const rows = await base44.entities.SystemConfig.filter({ config_key: "global" });
      return rows?.[0]?.mode || "REAL";
    },
    enabled: isAdmin,
  });

  const analytics = useMemo(
    () => analyzeAuditLogs(logs, { systemMode }),
    [logs, systemMode]
  );

  const handleExportFindings = () => {
    if (!analytics.findings.length) return;
    const payload = {
      generated_at: new Date().toISOString(),
      system_mode: systemMode,
      integrity_score: analytics.integrityScore,
      totals: analytics.totals,
      findings: analytics.findings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_findings_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Findings exported");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Restricted</h2>
          <p className="text-sm text-gray-400 mb-6">
            Audit Integrity is admin-only per BPAAA §11.
          </p>
          <Button variant="outline" onClick={() => navigate("/NUPSHub")} className="border-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-blue-950/30 px-4 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/NUPSHub")} className="border-white/10 text-gray-400">
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Audit Integrity</h1>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Append-only · Mode = {systemMode} · {logs.length} entries loaded
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/Search")}
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" /> Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {analytics.findings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFindings}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Findings JSON
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Analyzing audit trail…</span>
          </div>
        ) : (
          <>
            <AuditIntegrityCards analytics={analytics} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <AuditActionBreakdown breakdown={analytics.actionBreakdown} />
              <TopActorsPanel actors={analytics.topActors} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <CriticalEventsStream events={analytics.criticalEvents} />
              <IntegrityFindingsPanel findings={analytics.findings} onExport={handleExportFindings} />
            </div>

            <div className="text-[10px] text-gray-600 bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-violet-400 font-bold">✓ APPEND-ONLY:</span>
              <span>No UPDATE / DELETE paths exposed on ActivityLog</span>
              <span>Server-injected timestamps</span>
              <span>Session-resolved actors</span>
              <span className="ml-auto">
                Open ActivityLog viewer:{" "}
                <button
                  className="text-blue-400 underline"
                  onClick={() => navigate("/admin/activity-log")}
                >
                  /admin/activity-log
                </button>
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}