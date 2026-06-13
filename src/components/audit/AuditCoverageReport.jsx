import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSearch, CheckCircle2 } from "lucide-react";

const SEV_BADGE = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/40",
};

const ENTITY_LABEL = {
  DailySettlement: "Settlement",
  DriverPayout: "Driver Payout",
  GlyphBucksOrder: "GB Order",
};

export default function AuditCoverageReport({ gaps = [] }) {
  // Sort by severity (critical first)
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...gaps].sort((a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));

  return (
    <Card className="bg-gray-900/60 border-amber-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <FileSearch className="w-4 h-4 text-amber-400" />
          Coverage Gaps
          <span className="ml-auto text-amber-400 font-mono text-sm">{gaps.length}</span>
        </CardTitle>
        <p className="text-[11px] text-gray-500 mt-1">
          Critical actions that occurred without a matching ActivityLog entry — fix before audit.
        </p>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <div className="text-center py-10 text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10" />
            <div className="font-bold">All critical actions are logged ✓</div>
            <div className="text-xs text-gray-500">Coverage complete — no remediation needed.</div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {sorted.map((g, i) => (
              <div
                key={`${g.entity}-${g.record_id}-${i}`}
                className="bg-black/40 border border-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className={SEV_BADGE[g.severity]}>
                    {g.severity.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">
                    {ENTITY_LABEL[g.entity] || g.entity}
                  </span>
                  <span className="text-xs text-white font-bold">{g.identifier}</span>
                  {g.ts && (
                    <span className="text-[10px] text-gray-600 ml-auto">
                      {new Date(g.ts).toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-300">{g.message}</p>
                <p className="text-[10px] text-gray-600 mt-1 font-mono">id: {g.record_id}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}