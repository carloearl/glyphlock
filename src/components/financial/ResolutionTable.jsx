import React from "react";
import { Loader2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS = {
  PENDING_CORPORATE: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  PENDING_COMPLIANCE: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  PENDING_OWNERSHIP: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  APPROVED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  REJECTED: "bg-red-500/20 text-red-300 border-red-500/30",
  CHANGES_REQUESTED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  EXECUTING: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  EXECUTED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  EXECUTION_FAILED: "bg-red-600/20 text-red-400 border-red-600/30",
  ROLLED_BACK: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function ResolutionTable({ requests, loading, onSelect }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="w-10 h-10 text-white/20 mb-2" />
        <p className="text-white/50">No resolution requests found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr className="text-left text-white/60">
            <th className="px-3 py-2 font-medium">Resolution ID</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Amount</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Requested By</th>
            <th className="px-3 py-2 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r)}
              className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <td className="px-3 py-2 font-mono text-xs text-cyan-300">{r.resolution_id?.substring(0, 24)}</td>
              <td className="px-3 py-2 text-white/80">{(r.resolution_type || "").replace(/_/g, " ")}</td>
              <td className="px-3 py-2 text-white/80">${(r.amount || 0).toFixed(2)}</td>
              <td className="px-3 py-2">
                <Badge className={STATUS_COLORS[r.approval_status] || "bg-white/10 text-white/60 border-white/20"}>
                  {(r.approval_status || "").replace(/_/g, " ")}
                </Badge>
              </td>
              <td className="px-3 py-2 text-white/70 text-xs">{r.requested_by}</td>
              <td className="px-3 py-2 text-white/50 text-xs">{r.created_date?.substring(0, 16)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}