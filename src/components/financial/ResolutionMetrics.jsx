import React from "react";
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, DollarSign, Clock, TrendingUp } from "lucide-react";

const METRIC_CONFIG = [
  { key: "total", label: "Total Requests", icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "pending_approval", label: "Pending Approval", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "executed", label: "Executed", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  { key: "execution_failed", label: "Failed", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10" },
  { key: "rolled_back", label: "Rolled Back", icon: RefreshCw, color: "text-purple-400", bg: "bg-purple-500/10" },
];

export default function ResolutionMetrics({ metrics }) {
  if (!metrics) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {METRIC_CONFIG.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className={`${bg} border border-white/10 rounded-xl p-4`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className="text-2xl font-bold text-white">{metrics[key] || 0}</div>
            <div className="text-xs text-white/60">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <DollarSign className="w-4 h-4 text-cyan-400 mb-1" />
          <div className="text-lg font-bold text-white">${(metrics.total_adjustment_amount || 0).toFixed(2)}</div>
          <div className="text-xs text-white/60">Total Adjustments</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <DollarSign className="w-4 h-4 text-red-400 mb-1" />
          <div className="text-lg font-bold text-white">${(metrics.total_refund_amount || 0).toFixed(2)}</div>
          <div className="text-xs text-white/60">Total Refunds</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <Clock className="w-4 h-4 text-blue-400 mb-1" />
          <div className="text-lg font-bold text-white">{metrics.avg_approval_hours || 0}h</div>
          <div className="text-xs text-white/60">Avg Approval Time</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
          <div className="text-lg font-bold text-white">{metrics.success_rate || 0}%</div>
          <div className="text-xs text-white/60">Success Rate</div>
        </div>
      </div>
    </div>
  );
}