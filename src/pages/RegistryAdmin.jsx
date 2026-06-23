import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ShieldCheck, AlertTriangle, RefreshCw, GitBranch } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { seedFeatureRegistry } from "@/lib/registry/reconcileRegistry";
import { LIVE_APP_ROUTES } from "@/lib/registry/liveRouteCrawler";
import { loadRegistry, invalidateRegistryCache } from "@/lib/registry/featureRegistry";

/**
 * BPAA-NUPS-MASTER-001 §3 — Registry Admin.
 * Operator surface for seeding/reconciling the Feature Registry and
 * inspecting the diff report. Manager only.
 */
export default function RegistryAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      invalidateRegistryCache();
      const data = await loadRegistry();
      setRows(data);
    } catch (e) {
      setError(e?.message || "Failed to load registry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const runSeed = async () => {
    setRunning(true);
    setError(null);
    setReport(null);
    try {
      const result = await seedFeatureRegistry({ liveRoutes: LIVE_APP_ROUTES });
      setReport(result);
      await refresh();
    } catch (e) {
      setError(e?.message || "Seed failed");
    } finally {
      setRunning(false);
    }
  };

  const grouped = rows.reduce((acc, r) => {
    const g = r.group || "Other";
    if (!acc[g]) acc[g] = [];
    acc[g].push(r);
    return acc;
  }, {});

  const statusColor = (s) => {
    if (s === "ACTIVE") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
    if (s === "ROADMAP") return "bg-amber-500/10 text-amber-300 border-amber-500/30";
    return "bg-red-500/10 text-red-300 border-red-500/30";
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "linear-gradient(180deg, #050818 0%, #0a0f2c 100%)" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold">
              BPAA-NUPS-MASTER-001 · §3 Keystone
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              Feature Registry
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Single source of truth for nav, search, help, and assistant.
              Reconciled against the live router on every seed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refresh} disabled={loading || running} className="border-white/20 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={runSeed} disabled={running} className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}
              Seed + Reconcile
            </Button>
          </div>
        </header>

        {error && (
          <Card className="bg-red-950/40 border-red-500/40">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <div className="text-red-200 font-semibold text-sm">Seed/reconcile failed</div>
                <div className="text-red-300/80 text-xs mt-1 font-mono">{error}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {report && (
          <Card className="bg-emerald-950/40 border-emerald-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-200 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Diff Report — F-1/F-2 verified
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Seeded (new)" value={report.seeded} color="emerald" />
              <Stat label="Updated" value={report.updated} color="cyan" />
              <Stat label="Crawl→Roadmap" value={report.addedFromCrawl?.length || 0} color="amber" />
              <Stat label="Duplicates" value={report.duplicates?.length || 0} color="red" />
              {report.addedFromCrawl?.length > 0 && (
                <div className="col-span-full text-xs text-amber-200/70 mt-2">
                  Newly discovered live routes (registered as ROADMAP):{" "}
                  <span className="font-mono">{report.addedFromCrawl.join(", ")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/[0.02] border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center justify-between">
              <span>Registered Features</span>
              <Badge variant="outline" className="border-white/20 text-gray-300 text-[10px]">
                {rows.length} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="text-center py-10 text-gray-500 text-sm">
                Registry is empty. Click <b className="text-cyan-400">Seed + Reconcile</b> to initialize.
              </div>
            ) : (
              <ScrollArea className="h-[60vh] pr-2">
                <div className="space-y-6">
                  {Object.entries(grouped).map(([group, items]) => (
                    <div key={group}>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-2">
                        {group} · {items.length}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {items
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map(r => (
                            <div key={r.id || r.feature_id} className="p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold text-white truncate">{r.label}</div>
                                  <div className="text-[10px] font-mono text-gray-500 truncate">
                                    {r.feature_id} → {r.route}
                                  </div>
                                </div>
                                <Badge variant="outline" className={`text-[9px] ${statusColor(r.status)}`}>
                                  {r.status}
                                  {r.discovered_by_crawl && " · CRAWL"}
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(r.roles || []).slice(0, 4).map(role => (
                                  <span key={role} className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  const colorMap = {
    emerald: "text-emerald-300",
    cyan: "text-cyan-300",
    amber: "text-amber-300",
    red: "text-red-300",
  };
  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/5">
      <div className="text-[10px] uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${colorMap[color] || "text-white"} font-mono`}>{value || 0}</div>
    </div>
  );
}