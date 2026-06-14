import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { TrendingUp, AlertCircle, DollarSign, Clock } from "lucide-react";

/**
 * DACO-20260614: Live Settlement Ticker for Front Door POS
 * Real-time cash + card totals + pending driver payout visibility
 * Polling interval: 30 seconds (safe for high-volume parallel operations)
 */
export default function SettlementTicker({ venueId, businessDate }) {
  const today = businessDate || new Date().toISOString().split("T")[0];

  const { data: settlement, isLoading, isError } = useQuery({
    queryKey: ["settlement-live", venueId, today],
    queryFn: async () => {
      const response = await base44.functions.invoke("getLiveSettlementTotals", {
        venue_id: venueId,
        business_date: today,
      });
      return response.data;
    },
    refetchInterval: 30000, // 30s poll
    enabled: !!venueId,
  });

  // Determine cashier's drawer status
  const drawerStatus = useMemo(() => {
    if (!settlement) return null;
    if (settlement.cash_shortage_flag) {
      return { status: "critical", label: "DRAWER SHORT", color: "red" };
    }
    if (settlement.net_drawer < 100) {
      return { status: "warning", label: "LOW CASH", color: "yellow" };
    }
    return { status: "healthy", label: "GOOD", color: "green" };
  }, [settlement]);

  if (isError) {
    return (
      <div className="bg-red-900/20 border border-red-500/40 rounded-lg p-4 mb-6 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
        <span className="text-sm text-red-300">Settlement data unavailable</span>
      </div>
    );
  }

  if (isLoading || !settlement) {
    return (
      <div className="bg-gray-900/40 border border-gray-700/40 rounded-lg p-4 mb-6 animate-pulse">
        <div className="h-12 bg-gray-700/30 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
      {/* CASH SALES */}
      <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/40 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-green-600 font-semibold">
              Cash Sales
            </div>
            <div className="text-3xl font-black text-green-300 mt-2">
              ${settlement.cash_sales.toFixed(2)}
            </div>
            <div className="text-xs text-green-600/70 mt-1">
              {settlement.transaction_count} transactions
            </div>
          </div>
          <DollarSign className="w-6 h-6 text-green-500 opacity-50" />
        </div>
      </div>

      {/* CARD SALES */}
      <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-500/40 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
              Card Sales
            </div>
            <div className="text-3xl font-black text-blue-300 mt-2">
              ${settlement.card_sales.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600/70 mt-1">
              Processor batch
            </div>
          </div>
          <TrendingUp className="w-6 h-6 text-blue-500 opacity-50" />
        </div>
      </div>

      {/* TOTAL SALES */}
      <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/40 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-purple-600 font-semibold">
              Total Sales
            </div>
            <div className="text-3xl font-black text-purple-300 mt-2">
              ${settlement.total_sales.toFixed(2)}
            </div>
            <div className="text-xs text-purple-600/70 mt-1">
              Cash + Card
            </div>
          </div>
          <DollarSign className="w-6 h-6 text-purple-500 opacity-50" />
        </div>
      </div>

      {/* PAYOUT OWED (Critical Field) */}
      <div className="bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/40 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-orange-600 font-semibold">
              Payout Owed
            </div>
            <div className="text-3xl font-black text-orange-300 mt-2">
              ${settlement.payout_owed.toFixed(2)}
            </div>
            <div className="text-xs text-orange-600/70 mt-1">
              {settlement.payout_count} drivers pending
            </div>
          </div>
          <AlertCircle className="w-6 h-6 text-orange-500 opacity-50" />
        </div>
      </div>

      {/* DRAWER STATUS (Operational Readiness) */}
      <div
        className={`bg-gradient-to-br ${
          drawerStatus?.color === "red"
            ? "from-red-900/30 to-red-900/10 border-red-500/40"
            : drawerStatus?.color === "yellow"
            ? "from-yellow-900/30 to-yellow-900/10 border-yellow-500/40"
            : "from-green-900/30 to-green-900/10 border-green-500/40"
        } border rounded-xl p-4`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Drawer Balance
            </div>
            <div
              className={`text-3xl font-black mt-2 ${
                drawerStatus?.color === "red"
                  ? "text-red-300"
                  : drawerStatus?.color === "yellow"
                  ? "text-yellow-300"
                  : "text-green-300"
              }`}
            >
              ${settlement.net_drawer.toFixed(2)}
            </div>
            <div
              className={`text-xs font-semibold mt-1 ${
                drawerStatus?.color === "red"
                  ? "text-red-500"
                  : drawerStatus?.color === "yellow"
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {drawerStatus?.label}
            </div>
          </div>
          <Clock className={`w-6 h-6 opacity-50 ${
            drawerStatus?.color === "red"
              ? "text-red-500"
              : drawerStatus?.color === "yellow"
              ? "text-yellow-500"
              : "text-green-500"
          }`} />
        </div>
      </div>
    </div>
  );
}