import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

const ACTION_STYLES = {
  DELETE: "bg-red-500/15 text-red-300 border-red-500/30",
  CONFIG_CHANGE: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PAYOUT_TOGGLE: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  SETTLEMENT_RUN: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  EXPORT: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

function fmtTime(s) {
  try {
    return new Date(s).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export default function CriticalEventsStream({ events = [] }) {
  return (
    <Card className="bg-gray-900/60 border-violet-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2 text-base">
          <Zap className="w-4 h-4 text-violet-400" /> Critical Events Stream
        </CardTitle>
        <p className="text-[10px] text-gray-500 mt-1">
          Highest-risk actions, newest first — append-only per BPAAA §11.3
        </p>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-6">
            No critical events in current window — clean
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-1.5">
            {events.map((e) => {
              const style = ACTION_STYLES[e.action_type] || "bg-gray-700/30 text-gray-300 border-gray-700";
              return (
                <div
                  key={e.id || e.log_id}
                  className="bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${style}`}>
                      {e.action_type}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{fmtTime(e.timestamp)}</span>
                  </div>
                  <div className="text-gray-300 truncate">
                    <span className="text-gray-500">by</span> {e.user_email}{" "}
                    <span className="text-gray-600 text-[10px]">({e.user_role || "—"})</span>
                  </div>
                  {e.entity_affected && (
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">
                      → {e.entity_affected}
                    </div>
                  )}
                  {e.notes && (
                    <div className="text-[10px] text-gray-600 mt-0.5 italic truncate">{e.notes}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}