/**
 * Receipts — standalone page for today's transaction log.
 * Split out of the former /Register?tab=receipts sub-view so the operator
 * has dedicated screen space and a clean back button.
 */
import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import TransactionHistory from "@/components/nups/TransactionHistory";

function ReceiptsInner() {
  const { data: transactions = [] } = useQuery({
    queryKey: ["receipts-page-transactions"],
    queryFn: async () => {
      const all = await base44.entities.POSTransaction.list("-created_date", 200);
      return all.filter((t) => !t.validation_run);
    },
    refetchInterval: 60000,
  });

  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return transactions.filter((t) => (t.created_date || "").slice(0, 10) === today);
  }, [transactions]);

  return (
    <NUPSAppShell
      title="Receipts"
      subtitle="Today's receipts & transaction log"
      role="CASHIER"
    >
      <div className="max-w-[1600px] mx-auto space-y-3">
        <Card className="bg-white/[0.02] border-emerald-500/20">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-emerald-300">Today's Receipts & Transaction Log</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap any transaction to reprint its receipt. Older nights remain searchable in Accounting.
              </p>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono">
              {todayTransactions.length} txn{todayTransactions.length !== 1 ? "s" : ""}
            </Badge>
          </CardContent>
        </Card>
        <TransactionHistory transactions={todayTransactions} showReceipt={true} />
      </div>
    </NUPSAppShell>
  );
}

export default function Receipts() {
  return (
    <NUPSRouteGuard requiredPermission="pos_access">
      <ReceiptsInner />
    </NUPSRouteGuard>
  );
}