import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileSearch } from "lucide-react";
import AuditFindingsBadge from "@/components/audit/AuditFindingsBadge";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { aggregateFinancials } from "@/lib/accounting/aggregateFinancials";
import AccountingDateFilter, { computeRange } from "@/components/accounting/AccountingDateFilter";
import AccountingSummaryCards from "@/components/accounting/AccountingSummaryCards";
import RevenueBreakdown from "@/components/accounting/RevenueBreakdown";
import DisbursementsBreakdown from "@/components/accounting/DisbursementsBreakdown";
import LiabilityLedger from "@/components/accounting/LiabilityLedger";
import AccountingTrendChart from "@/components/accounting/AccountingTrendChart";
import QuickBooksExportModal from "@/components/accounting/QuickBooksExportModal";
import QuickBooksDriveSyncButton from "@/components/accounting/QuickBooksDriveSyncButton";
import SettlementDiffPanel from "@/components/accounting/SettlementDiffPanel";
import ZReportReconciliationPanel from "@/components/accounting/ZReportReconciliationPanel";
import { toast } from "sonner";

/**
 * Accounting — Manager-tier consolidated financial control center.
 * Pulls from: DailySettlement (revenue), DriverPayout / PayrollRecord / TipPayout / ContractorPayout
 * (disbursements), GlyphBucksOrder + GlyphBucksBill (liability ledger).
 *
 * Hard rules enforced by the aggregator:
 *   • Revenue = cash_sales + card_sales ONLY (from settlements)
 *   • GlyphBucks face value is liability, NEVER revenue
 *   • Driver/payroll/tip/contractor payouts are disbursements, NEVER negative revenue
 */
export default function Accounting() {
  return (
    <NUPSRouteGuard
      requiredRoles={["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"]}
    >
      <AccountingContent />
    </NUPSRouteGuard>
  );
}

function inRange(date, start, end) {
  if (!date) return false;
  const d = String(date).slice(0, 10);
  return d >= start && d <= end;
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function downloadCSV(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function AccountingContent() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;

  const initial = computeRange({ key: "7d", days: 7 });
  const [range, setRange] = useState(initial);
  const [preset, setPreset] = useState("7d");
  const [qbOpen, setQbOpen] = useState(false);

  // Data fetches — frontend pulls, in-memory aggregation
  const venueFilter = venueId ? { venue_id: venueId } : {};

  const { data: settlements = [], isLoading: lS } = useQuery({
    queryKey: ["acct-settlements", venueId, range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.DailySettlement.filter(venueFilter, "-business_date", 500);
      return all.filter((r) => inRange(r.business_date || r.settlement_date, range.start, range.end));
    },
  });

  const { data: driverPayouts = [], isLoading: lD } = useQuery({
    queryKey: ["acct-drivers", venueId, range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.DriverPayout.filter(venueFilter, "-payout_date", 1000);
      return all.filter((r) => inRange(r.payout_date, range.start, range.end));
    },
  });

  const { data: payrollRecords = [], isLoading: lP } = useQuery({
    queryKey: ["acct-payroll", range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.PayrollRecord.list("-pay_period_end", 500);
      return all.filter((r) => inRange(r.pay_period_end, range.start, range.end));
    },
  });

  const { data: tipPayouts = [], isLoading: lT } = useQuery({
    queryKey: ["acct-tips", venueId, range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.TipPayout.filter(venueFilter, "-payout_date", 500);
      return all.filter((r) => inRange(r.payout_date, range.start, range.end));
    },
  });

  const { data: contractorPayouts = [], isLoading: lC } = useQuery({
    queryKey: ["acct-contractor", venueId, range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.ContractorPayout.filter(venueFilter, "-payout_date", 1000);
      return all.filter((r) => inRange(r.payout_date, range.start, range.end));
    },
  });

  // GlyphBucks ledger uses lifetime data (liability is cumulative)
  const { data: glyphBucksOrders = [], isLoading: lO } = useQuery({
    queryKey: ["acct-gb-orders", venueId],
    queryFn: () => base44.entities.GlyphBucksOrder.filter(venueFilter, "-created_date", 2000),
  });

  const { data: glyphBucksBills = [], isLoading: lB } = useQuery({
    queryKey: ["acct-gb-bills", venueId],
    queryFn: () => base44.entities.GlyphBucksBill.filter(venueFilter, "-created_date", 5000),
  });

  // POS transactions — needed so the aggregator can surface comp gross (gap)
  const { data: posTransactions = [], isLoading: lTx } = useQuery({
    queryKey: ["acct-pos-tx", venueId, range.start, range.end],
    queryFn: async () => {
      const all = await base44.entities.POSTransaction.filter(venueFilter, "-created_date", 2000);
      return all.filter((r) => inRange(r.created_date, range.start, range.end));
    },
  });

  const loading = lS || lD || lP || lT || lC || lO || lB || lTx;

  const data = useMemo(
    () =>
      aggregateFinancials({
        settlements,
        driverPayouts,
        payrollRecords,
        tipPayouts,
        contractorPayouts,
        glyphBucksOrders,
        glyphBucksBills,
        posTransactions,
      }),
    [settlements, driverPayouts, payrollRecords, tipPayouts, contractorPayouts, glyphBucksOrders, glyphBucksBills, posTransactions]
  );

  const handleExportSummary = () => {
    const rows = [
      { metric: "Period", value: `${range.start} to ${range.end}` },
      { metric: "Venue", value: venueId || "ALL" },
      { metric: "Cash Sales", value: data.revenue.cash_sales.toFixed(2) },
      { metric: "Card Sales", value: data.revenue.card_sales.toFixed(2) },
      { metric: "Gross Revenue", value: data.revenue.gross_revenue.toFixed(2) },
      { metric: "Driver Disbursements", value: data.disbursements.driver.toFixed(2) },
      { metric: "Payroll Disbursements", value: data.disbursements.payroll.toFixed(2) },
      { metric: "Tip Disbursements", value: data.disbursements.tips.toFixed(2) },
      { metric: "Contractor Disbursements", value: data.disbursements.contractor.toFixed(2) },
      { metric: "Total Disbursements", value: data.disbursements.total.toFixed(2) },
      { metric: "Net Position", value: data.net_position.toFixed(2) },
      { metric: "GB Issued (face)", value: data.glyphbucks.issued_face_value.toFixed(2) },
      { metric: "GB Redeemed (face)", value: data.glyphbucks.redeemed_face_value.toFixed(2) },
      { metric: "GB Outstanding Liability", value: data.glyphbucks.outstanding_face_value.toFixed(2) },
    ];
    downloadCSV(`accounting_${range.start}_to_${range.end}.csv`, toCSV(rows));
    toast.success("Accounting summary exported");
  };

  const handleExportTimeline = () => {
    if (!data.timeline.length) {
      toast.error("No timeline data to export");
      return;
    }
    downloadCSV(`accounting_timeline_${range.start}_to_${range.end}.csv`, toCSV(data.timeline));
    toast.success("Timeline exported");
  };

  const actions = (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/admin/audit-integrity")}
        className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hidden sm:inline-flex"
      >
        <FileSearch className="w-3.5 h-3.5 mr-1.5" /> Audit
        <AuditFindingsBadge />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportSummary}
        className="border-white/10 text-slate-300 hover:bg-white/5 hidden lg:inline-flex"
      >
        <Download className="w-3.5 h-3.5 mr-1.5" /> CSV
      </Button>
      <QuickBooksDriveSyncButton range={range} venueId={venueId} />
      <Button
        size="sm"
        onClick={() => setQbOpen(true)}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_-6px_rgba(16,185,129,0.6)]"
      >
        <span className="inline-flex w-4 h-4 rounded-sm bg-white/20 items-center justify-center text-[8px] font-mono mr-1.5">QB</span>
        QuickBooks
      </Button>
    </>
  );

  return (
    <NUPSAppShell
      title="Accounting"
      subtitle="Revenue · Disbursements · Liability — single source of truth"
      actions={actions}
      role="MANAGER"
    >
      <QuickBooksExportModal open={qbOpen} onOpenChange={setQbOpen} range={range} venueId={venueId} />

      <div className="max-w-[1600px] mx-auto">
        <AccountingDateFilter
          value={range}
          onChange={setRange}
          activePreset={preset}
          onPresetChange={setPreset}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Consolidating financial data…</span>
          </div>
        ) : (
          <>
            <AccountingSummaryCards data={data} />

            <div className="mb-6">
              <AccountingTrendChart timeline={data.timeline} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <RevenueBreakdown data={data} settlements={settlements} />
              <DisbursementsBreakdown data={data} />
            </div>

            <div className="mb-6">
              <LiabilityLedger data={data} />
            </div>

            <div className="mb-6">
              <ZReportReconciliationPanel venueId={venueId} />
            </div>

            <div className="mb-6">
              <SettlementDiffPanel venueId={venueId} limit={5} />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold uppercase tracking-widest">DACO Locked</span>
                <span className="ml-2 hidden sm:inline">total_sales = cash + card</span>
                <span className="hidden sm:inline">· GlyphBucks ≠ revenue</span>
                <span className="hidden sm:inline">· Payouts = disbursements</span>
              </div>
              <div className="font-mono text-slate-600">
                {data._meta.counts.settlements} settlements ·{" "}
                {data._meta.counts.driverPayouts} driver ·{" "}
                {data._meta.counts.payrollRecords} payroll ·{" "}
                {data._meta.counts.tipPayouts} tips ·{" "}
                {data._meta.counts.contractorPayouts} 1099 ·{" "}
                {data._meta.counts.glyphBucksOrders} GB
              </div>
            </div>

            <div className="lg:hidden mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSummary}
                className="flex-1 border-white/10 text-slate-300"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Summary CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTimeline}
                className="flex-1 border-white/10 text-slate-300"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Timeline CSV
              </Button>
            </div>
          </>
        )}
      </div>
    </NUPSAppShell>
  );
}