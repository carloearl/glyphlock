import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare, ArrowRight, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import { buildSettlementDiff } from "@/lib/nups/auditDifferential";

/**
 * Settlement Diff Panel — surfaces pre-lock vs post-lock state of every
 * DailySettlement that has been LOCKED. Pulls before/after snapshots from
 * ActivityLog entries whose entity_affected matches "DailySettlement:<id>".
 */
export default function SettlementDiffPanel({ venueId, limit = 5 }) {
  const { data: settlements = [], isLoading } = useQuery({
    queryKey: ["settlements-diff", venueId],
    queryFn: async () => {
      const all = await base44.entities.DailySettlement.list("-business_date", 50);
      const filtered = venueId ? all.filter((s) => s.venue_id === venueId) : all;
      return filtered.filter((s) => s.status === "LOCKED").slice(0, limit);
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["settlements-diff-logs"],
    queryFn: async () => {
      const all = await base44.entities.ActivityLog.list("-timestamp", 500);
      return all.filter(
        (l) => l.action_type === "SETTLEMENT_RUN" || (l.entity_affected || "").startsWith("DailySettlement:")
      );
    },
  });

  const pairs = useMemo(() => {
    return settlements.map((s) => {
      const matched = logs.find((l) => (l.entity_affected || "") === `DailySettlement:${s.id}`);
      const before = matched?.before_value || {};
      const after = matched?.after_value || s;
      return { settlement: s, log: matched, diff: buildSettlementDiff(before, after) };
    });
  }, [settlements, logs]);

  if (isLoading) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 text-center text-slate-500 text-sm">Loading diff…</CardContent>
      </Card>
    );
  }

  if (pairs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 text-center text-slate-500 text-sm">
          No locked settlements yet. Diffs will appear here after the first nightly close.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-cyan-300">
          <GitCompare className="w-5 h-5" />
          Settlement Before / After
        </CardTitle>
        <p className="text-xs text-slate-500">
          Differential audit log — pre-lock vs post-lock values for the last {pairs.length} locked nights.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pairs.map(({ settlement, log, diff }) => (
          <div key={settlement.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <span className="font-semibold text-white">
                  {settlement.business_date || settlement.settlement_date || "—"}
                </span>
                <Badge variant="outline" className="border-rose-500/40 text-rose-300 text-[10px]">
                  LOCKED
                </Badge>
              </div>
              {log?.user_email && (
                <span className="text-[10px] text-slate-500 font-mono">
                  by {log.user_email} · {new Date(log.timestamp).toLocaleString()}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="text-left p-2 font-medium">Field</th>
                    <th className="text-right p-2 font-medium">Before</th>
                    <th className="text-center p-2 font-medium w-8"></th>
                    <th className="text-right p-2 font-medium">After</th>
                    <th className="text-right p-2 font-medium">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {diff.map((row) => (
                    <tr key={row.field} className="border-t border-slate-800/50">
                      <td className="p-2 text-slate-300 font-mono text-[11px]">{row.field}</td>
                      <td className="p-2 text-right text-slate-400 font-mono">
                        {formatVal(row.before)}
                      </td>
                      <td className="p-2 text-center text-slate-600">
                        <ArrowRight className="w-3 h-3 inline" />
                      </td>
                      <td className="p-2 text-right text-white font-mono">{formatVal(row.after)}</td>
                      <td
                        className={`p-2 text-right font-mono ${
                          row.changed
                            ? row.delta === null
                              ? "text-amber-300"
                              : row.delta > 0
                              ? "text-emerald-300"
                              : "text-rose-300"
                            : "text-slate-700"
                        }`}
                      >
                        {row.delta === null ? "•" : row.delta === 0 ? "—" : signed(row.delta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              {Math.abs((settlement.variance || 0)) < 0.01 ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Balanced — no variance
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  Variance: ${Number(settlement.variance).toFixed(2)}
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function formatVal(v) {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return `$${v.toFixed(2)}`;
  return String(v);
}

function signed(n) {
  const v = Number(n);
  if (Math.abs(v) < 0.01) return "—";
  return `${v > 0 ? "+" : ""}$${v.toFixed(2)}`;
}