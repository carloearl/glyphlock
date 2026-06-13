import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { CRITICAL_ACTIONS } from "@/lib/audit/auditAnalytics";

export default function AuditActionBreakdown({ breakdown = [] }) {
  const max = Math.max(1, ...breakdown.map((b) => b.count));
  return (
    <Card className="bg-gray-900/60 border-blue-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4 text-blue-400" /> Action Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {breakdown.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-3">No actions recorded</p>
        )}
        {breakdown.map((b) => {
          const pct = (b.count / max) * 100;
          const isCritical = CRITICAL_ACTIONS.has(b.action);
          return (
            <div key={b.action}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={`font-mono font-bold ${isCritical ? "text-violet-300" : "text-gray-300"}`}>
                  {b.action}
                  {isCritical && (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-violet-500">
                      critical
                    </span>
                  )}
                </span>
                <span className="text-gray-400 font-mono">{b.count}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${isCritical ? "bg-violet-500" : "bg-blue-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}