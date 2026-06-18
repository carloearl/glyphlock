import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Calculator, Download, ArrowLeft, Loader2, ShieldCheck, FileSearch, Search, Moon } from "lucide-react";
import AuditFindingsBadge from "@/components/audit/AuditFindingsBadge";
import NUPSRouteGuard from "@/components/nups/NUPSRouteGuard";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { aggregateFinancials, fmtUSD } from "@/lib/accounting/aggregateFinancials";
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-emerald-950/30 px-4 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-white/10 text-gray-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Accounting</h1>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Revenue · Disbursements · Liability — single source of truth
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/Tonight")}
              className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              <Moon className="w-3.5 h-3.5 mr-1.5" /> Tonight
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/Search")}
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" /> Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/audit-integrity")}
              className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              <FileSearch className="w-3.5 h-3.5 mr-1.5" /> Audit Integrity
              <AuditFindingsBadge />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSummary}
              className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Summary CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportTimeline}
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Timeline CSV
            </Button>
            <QuickBooksDriveSyncButton range={range} venueId={venueId} />
            <Button
              size="sm"
              onClick={() => setQbOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <span className="inline-flex w-4 h-4 rounded-sm bg-white/20 items-center justify-center text-[8px] font-mono mr-1.5">QB</span>
              QuickBooks
            </Button>
          </div>
        </div>
      </div>

      <QuickBooksExportModal open={qbOpen} onOpenChange={setQbOpen} range={range} venueId={venueId} />

      <div className="max-w-7xl mx-auto px-4 py-6">
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <RevenueBreakdown data={data} settlements={settlements} />
              <DisbursementsBreakdown data={data} />
            </div>

            <div className="mb-6">
              <LiabilityLedger data={data} />
            </div>

            {/* Z-Report reconciliation (live POS vs saved snapshot) */}
            <div className="mb-6">
              <ZReportReconciliationPanel venueId={venueId} />
            </div>

            {/* Before/After diff log for locked settlements */}
            <div className="mb-6">
              <SettlementDiffPanel venueId={venueId} limit={5} />
            </div>

            {/* Data integrity footer */}
            <div className="text-[10px] text-gray-600 bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
              <span className="text-emerald-400 font-bold">✓ DACO-LOCKED:</span>
              <span>total_sales = cash + card only</span>
              <span>GlyphBucks ≠ revenue</span>
              <span>Payouts = disbursements</span>
              <span className="ml-auto text-gray-700">
                Records aggregated: {data._meta.counts.settlements} settlements ·{" "}
                {data._meta.counts.driverPayouts} driver ·{" "}
                {data._meta.counts.payrollRecords} payroll ·{" "}
                {data._meta.counts.tipPayouts} tips ·{" "}
                {data._meta.counts.contractorPayouts} contractor ·{" "}
                {data._meta.counts.glyphBucksOrders} GB orders
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}