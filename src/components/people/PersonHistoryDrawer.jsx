import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Clock, UserPlus, LogIn, LogOut, FileSignature, AlertTriangle, Pencil, Trash2, Camera } from "lucide-react";

const EVENT_ICONS = {
  created: UserPlus,
  updated: Pencil,
  deleted: Trash2,
  checked_in: LogIn,
  checked_out: LogOut,
  contract_signed: FileSignature,
  status_change: AlertTriangle,
  snapshot: Camera,
};

const EVENT_COLORS = {
  created: "bg-green-500/15 text-green-300 border-green-500/30",
  checked_in: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  checked_out: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  contract_signed: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  updated: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  deleted: "bg-red-500/15 text-red-300 border-red-500/30",
  status_change: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  snapshot: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};

export default function PersonHistoryDrawer({ open, onClose, person, history }) {
  if (!person) return null;
  const sorted = [...(history || [])].sort(
    (a, b) => new Date(b.event_timestamp) - new Date(a.event_timestamp)
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-gray-950 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white">
            <span className="text-xl font-bold">{person.display_name}</span>
            <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 capitalize">
              {person.person_type}
            </Badge>
            {person.is_demo && (
              <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30">DEMO</Badge>
            )}
          </DialogTitle>
          <p className="text-xs text-gray-500">
            {sorted.length} event{sorted.length === 1 ? "" : "s"} on record · ID {person.person_id}
          </p>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-3">
          {sorted.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-12">No archive entries yet.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((row) => {
                const Icon = EVENT_ICONS[row.event_type] || Clock;
                const colorCls = EVENT_COLORS[row.event_type] || EVENT_COLORS.updated;
                return (
                  <div
                    key={row.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/60 border border-gray-800"
                  >
                    <div className={`p-2 rounded-md ${colorCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] capitalize ${colorCls}`}>
                          {row.event_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {format(new Date(row.event_timestamp), "MMM d, yyyy · h:mm:ss a")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        by {row.actor_name || row.actor_email || "System"}
                      </p>
                      {row.snapshot && (
                        <details className="mt-2">
                          <summary className="text-[11px] text-gray-600 cursor-pointer hover:text-gray-400">
                            View snapshot
                          </summary>
                          <pre className="mt-2 text-[10px] text-gray-400 bg-black/40 p-2 rounded border border-gray-800 overflow-x-auto max-h-48">
                            {JSON.stringify(row.snapshot, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}