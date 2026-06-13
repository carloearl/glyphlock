import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Moon, Zap, Clock, CheckCircle2 } from "lucide-react";

const SEV_BADGE = {
  critical: "bg-red-500/20 text-red-300 border-red-500/40",
  high: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  low: "bg-blue-500/20 text-blue-300 border-blue-500/40",
};

const KIND_ICON = {
  after_hours: Moon,
  action_burst: Zap,
  time_gap: Clock,
};

const KIND_LABEL = {
  after_hours: "Off-Hours",
  action_burst: "Burst",
  time_gap: "Time Gap",
};

export default function AuditAnomalyList({ anomalies = [] }) {
  const sevOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...anomalies].sort(
    (a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9)
  );

  return (
    <Card className="bg-gray-900/60 border-violet-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <AlertTriangle className="w-4 h-4 text-violet-400" />
          Anomaly Detection
          <span className="ml-auto text-violet-400 font-mono text-sm">{anomalies.length}</span>
        </CardTitle>
        <p className="text-[11px] text-gray-500 mt-1">
          Patterns flagged for review — off-hours activity, action bursts, and stream gaps.
        </p>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-10 text-emerald-400 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-10 h-10" />
            <div className="font-bold">No anomalies detected ✓</div>
            <div className="text-xs text-gray-500">Activity patterns within expected envelope.</div>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {sorted.map((a, i) => {
              const Icon = KIND_ICON[a.kind] || AlertTriangle;
              return (
                <div
                  key={`${a.kind}-${i}`}
                  className="bg-black/40 border border-gray-800 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Icon className="w-3.5 h-3.5 text-violet-400" />
                    <Badge variant="outline" className={SEV_BADGE[a.severity]}>
                      {a.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-violet-300 font-mono">
                      {KIND_LABEL[a.kind] || a.kind}
                    </span>
                    {a.user && <span className="text-xs text-white">{a.user}</span>}
                    {a.timestamp && (
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{a.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}