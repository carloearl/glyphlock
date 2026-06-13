import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function TopActorsPanel({ actors = [] }) {
  const max = Math.max(1, ...actors.map((a) => a.count));
  return (
    <Card className="bg-gray-900/60 border-emerald-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Users className="w-4 h-4 text-emerald-400" /> Top Actors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actors.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-3">No actor activity</p>
        )}
        {actors.map((a) => {
          const pct = (a.count / max) * 100;
          return (
            <div key={a.email}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-200 truncate max-w-[60%]" title={a.email}>
                  {a.email}
                </span>
                <span className="font-mono text-gray-400">
                  {a.count}
                  {a.critical > 0 && (
                    <span className="ml-2 text-violet-400 font-bold">· {a.critical} crit</span>
                  )}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${a.critical > 0 ? "bg-violet-500" : "bg-emerald-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[9px] text-gray-600 mt-0.5">{a.role || "—"}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}