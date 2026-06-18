import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScaleIcon, CheckCircle2, AlertTriangle, FileText, Database } from "lucide-react";
import { reconcileBatchVsZReport } from "@/lib/nups/auditDifferential";

/**
 * Z-Report Reconciliation Panel
 * ─────────────────────────────
 * Cross-checks live POSTransaction totals against the saved POSZReport snapshot
 * for a given business date. Enforces the Vinnie Principle:
 *   total_sales = cash_sales + card_sales (never GB, never payouts).
 */
export default function ZReportReconciliationPanel({ venueId }) {
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { data: zReports = [] } = useQuery({
    queryKey: ["zreports-recent", venueId],
    queryFn: () => base44.entities.POSZReport.list("-report_date", 30),
  });

  const activeReport = useMemo(() => {
    if (selectedReportId) return zReports.find((r) => r.id === selectedReportId);
    return zReports[0] || null;
  }, [zReports, selectedReportId]);

  const { data: txns = [] } = useQuery({
    queryKey: ["zreport-txns", activeReport?.report_date, activeReport?.batch_id],
    queryFn: async () => {
      const all = await base44.entities.POSTransaction.list("-created_date", 1000);
      if (!activeReport) return [];
      const date = activeReport.report_date;
      return all.filter((t) => (t.created_date || "").slice(0, 10) === date);
    },
    enabled: !!activeReport,
  });

  const reconciliation = useMemo(() => {
    if (!activeReport) return [];
    return reconcileBatchVsZReport(txns, activeReport);
  }, [txns, activeReport]);

  const allBalanced = reconciliation.length > 0 && reconciliation.every((r) => r.ok);

  if (!zReports.length) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-6 text-center text-slate-500 text-sm">
          No Z-Reports generated yet. Reconciliation will appear after the first end-of-night close.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base text-emerald-300">
            <ScaleIcon className="w-5 h-5" />
            Z-Report Reconciliation
          </CardTitle>
          <Select
            value={activeReport?.id || ""}
            onValueChange={(v) => setSelectedReportId(v)}
          >
            <SelectTrigger className="w-56 bg-slate-800 border-slate-700 text-xs">
              <SelectValue placeholder="Select Z-Report" />
            </SelectTrigger>
            <SelectContent>
              {zReports.slice(0, 14).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.report_date} · {r.report_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Live POSTransaction totals vs the saved Z-Report snapshot. Variance &gt; $0.01 = investigation required.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {activeReport && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono">
                <FileText className="w-3 h-3 mr-1" /> {activeReport.report_id}
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                {activeReport.report_date}
              </Badge>
              <Badge variant="outline" className="border-slate-700 text-slate-300">
                <Database className="w-3 h-3 mr-1" /> {txns.length} txn{txns.length !== 1 ? "s" : ""} loaded
              </Badge>
              {allBalanced ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Balanced
                </Badge>
              ) : (
                <Badge variant="outline" className="border-rose-500/40 text-rose-300 bg-rose-500/10">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Variance Detected
                </Badge>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="text-left p-2 font-medium">Metric</th>
                    <th className="text-right p-2 font-medium">Computed (Live)</th>
                    <th className="text-right p-2 font-medium">Z-Report</th>
                    <th className="text-right p-2 font-medium">Variance</th>
                    <th className="text-center p-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reconciliation.map((row) => (
                    <tr key={row.label} className="border-t border-slate-800/50">
                      <td className="p-2 text-slate-300">{row.label}</td>
                      <td className="p-2 text-right text-white font-mono">${row.expected.toFixed(2)}</td>
                      <td className="p-2 text-right text-slate-300 font-mono">${row.actual.toFixed(2)}</td>
                      <td
                        className={`p-2 text-right font-mono ${
                          row.ok ? "text-slate-600" : row.variance > 0 ? "text-emerald-300" : "text-rose-300"
                        }`}
                      >
                        {row.ok ? "—" : `${row.variance > 0 ? "+" : ""}$${row.variance.toFixed(2)}`}
                      </td>
                      <td className="p-2 text-center">
                        {row.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] text-slate-600 bg-slate-950/50 rounded p-2 border border-slate-800">
              <span className="text-emerald-400 font-bold">RULE:</span>{" "}
              total_sales = cash_sales + card_sales · GlyphBucks excluded · Comp tracked as gap
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}