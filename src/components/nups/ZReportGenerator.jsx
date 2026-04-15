import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, DollarSign, ShoppingCart, Printer, Calendar, Banknote, Users, Coins, ScrollText } from "lucide-react";

export default function ZReportGenerator({ user: userProp }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(userProp || null);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');
  const [reconciliationNotes, setReconciliationNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!userProp) {
      base44.auth.me().then(setUser).catch(() => {});
    }
  }, [userProp]); // Section 4 — required when discrepancy exists

  const { data: todayTransactions = [] } = useQuery({
    queryKey: ['today-transactions'],
    queryFn: async () => {
      const all = await base44.entities.POSTransaction.list('-created_date', 500);
      const today = new Date().toDateString();
      return all.filter(t => new Date(t.created_date).toDateString() === today);
    }
  });

  const { data: todayVIPSessions = [] } = useQuery({
    queryKey: ['today-vip-sessions'],
    queryFn: async () => {
      const all = await base44.entities.VIPRoom.list('-created_date', 500);
      const today = new Date().toDateString();
      return all.filter(r => r.start_time && new Date(r.start_time).toDateString() === today);
    }
  });

  const { data: todayOrders = [] } = useQuery({
    queryKey: ['today-glyph-orders'],
    queryFn: async () => {
      const all = await base44.entities.GlyphBucksOrder.list('-created_date', 500);
      const today = new Date().toDateString();
      return all.filter(o => new Date(o.created_date).toDateString() === today);
    }
  });

  const { data: todayGBTransactions = [] } = useQuery({
    queryKey: ['today-gb-transactions'],
    queryFn: async () => {
      const all = await base44.entities.GlyphBucksTransaction.list('-created_date', 500);
      const today = new Date().toDateString();
      return all.filter(t => new Date(t.created_date).toDateString() === today && t.status === 'active');
    }
  });

  const { data: todayContracts = [] } = useQuery({
    queryKey: ['today-venue-contracts'],
    queryFn: async () => {
      const all = await base44.entities.VenueContract.list('-created_date', 500);
      const today = new Date().toDateString();
      return all.filter(c => new Date(c.created_date).toDateString() === today && c.status !== 'voided');
    }
  });

  const { data: todayTipPayouts = [] } = useQuery({
    queryKey: ['today-tip-payouts'],
    queryFn: async () => {
      const all = await base44.entities.TipPayout.list('-created_date', 50);
      const today = new Date().toDateString();
      return all.filter(p => new Date(p.created_date).toDateString() === today);
    }
  });

  const { data: recentReports = [] } = useQuery({
    queryKey: ['z-reports'],
    queryFn: () => base44.entities.POSZReport.list('-created_date', 10)
  });

  // Section 3 — separate REAL vs DEMO transactions
  const realTransactions = todayTransactions.filter(t => !t.mode || t.mode === 'REAL');
  const demoTransactions = todayTransactions.filter(t => t.mode === 'DEMO' || t.mode === 'TEST');
  const demoTotal = demoTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  // Station breakdown
  const doorTransactions = realTransactions.filter(t => !t.station || t.station === 'door');
  const barTransactions = realTransactions.filter(t => t.station === 'bar');
  const doorSales = doorTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const barSales = barTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

  // F-5: Card sales whitelist — BPAAA v3.0
  const CARD_WHITELIST = ['Credit Card', 'Debit Card', 'Digital Wallet', 'Gift Card', 'Tab'];

  // Live preview calculations — REAL only for financials. Tips excluded — staff pass-through only.
  const cashSales = realTransactions
    .filter(t => t.payment_method === 'Cash')
    .reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);

  const cardSales = realTransactions
    .filter(t => CARD_WHITELIST.includes(t.payment_method))
    .reduce((sum, t) => sum + ((t.total || 0) - (t.tip || 0)), 0);

  const vipRevenue = todayVIPSessions
    .reduce((sum, s) => sum + (s.total_charge || 0), 0);

  // FINANCIAL RULE — LOCKED UNDER BPAAA v3.0
  // total_sales = cash_sales + card_sales ONLY
  // Tips excluded — staff pass-through only
  // GlyphBucks excluded — liability, not revenue
  // Card sales whitelist: Credit Card, Debit Card, Digital Wallet, Gift Card, Tab
  // SettlementReports reads from POSZReport.total_sales only
  // Do not modify without DACO authorization
  const totalSales = cashSales + cardSales;

  // Section 4 — live preview reconciliation
  const expectedCash = Number(openingCash) + cashSales;
  const actualCash = Number(closingCash);
  const cashOverShort = actualCash - expectedCash;
  const requiresReview = Math.abs(cashOverShort) > 0.01;

  const glyphBuckRevenue = todayOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
  const glyphBuckIssued = todayOrders.reduce((s, o) => s + (o.glyphbucks_value || 0), 0);
  const glyphBuckRedeemed = todayOrders.filter(o => o.status === 'archived').reduce((s, o) => s + (o.glyphbucks_value || 0), 0);
  const entertainerPayouts = todayTipPayouts.reduce((s, p) => s + (p.total_tips || 0), 0);

  // NEW LEDGER SYSTEM — GlyphBucksTransaction entity
  const gbLedgerIssued   = todayGBTransactions.filter(t => t.transaction_type === 'Issue').reduce((s, t) => s + (t.amount || 0), 0);
  const gbLedgerRedeemed = todayGBTransactions.filter(t => t.transaction_type === 'Redeem').reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const gbLedgerNet      = gbLedgerIssued - gbLedgerRedeemed;
  // VenueContract totals
  const contractCount    = todayContracts.length;
  const contractValue    = todayContracts.reduce((s, c) => s + (c.contract_amount || 0), 0);
  const contractGBIssued = todayContracts.reduce((s, c) => s + (c.glyphbucks_issued || 0), 0);

  const handleGenerate = async () => {
    // B6 — block anonymous / no-transaction generation
    if (!user?.email) {
      alert('You must be logged in to generate a Z-Report.');
      return;
    }
    if (realTransactions.length === 0) {
      alert('No REAL transactions found for today. Cannot generate an empty Z-Report.');
      return;
    }

    // SECTION 4 — block generation if discrepancy exists and notes are missing
    const s4_expectedCash = Number(openingCash) + cashSales;
    const s4_actualCash = Number(closingCash);
    const s4_cashOverShort = s4_actualCash - s4_expectedCash;
    const s4_requiresReview = Math.abs(s4_cashOverShort) > 0.01;
    if (s4_requiresReview && !reconciliationNotes.trim()) {
      alert(`Cash discrepancy of $${s4_cashOverShort.toFixed(2)} detected.\n\nReconciliation notes are REQUIRED before generating this report.\nPlease enter notes in the Reconciliation Notes field.`);
      return;
    }

    // B1 — duplicate guard
    if (isGenerating) return;
    setIsGenerating(true);

    if (!window.confirm('Generate Z-Report for today? This closes the reporting period.')) {
      setIsGenerating(false);
      return;
    }

    try {
      // Section 3 — REAL transactions only for product breakdown
      const barRevenue = realTransactions
        .filter(t => t.items?.some(item => item.product_name?.includes('Drink')))
        .reduce((sum, t) => sum + (t.total || 0), 0);

      // C-4 FIX: merchandiseRevenue = POS sales minus bar — VIP is tracked separately, not subtracted from totalSales
              const merchandiseRevenue = totalSales - barRevenue;

      const productSalesMap = {};
      realTransactions.forEach(t => {
        t.items?.forEach(item => {
          if (!productSalesMap[item.product_name]) {
            productSalesMap[item.product_name] = { quantity: 0, total: 0 };
          }
          productSalesMap[item.product_name].quantity += item.quantity;
          productSalesMap[item.product_name].total += item.total;
        });
      });

      const products_sold = Object.entries(productSalesMap).map(([name, data]) => ({
        product_name: name,
        quantity: data.quantity,
        total: data.total
      }));

      const cashierDisplay = user?.full_name || user?.name || user?.email || 'Unknown';

      // Section 3 — find today's closed batch to attach batch_id
      const allBatches = await base44.entities.POSBatch.list('-created_date', 20);
      const today = new Date().toDateString();
      const todayBatch = allBatches.find(b =>
        new Date(b.start_time).toDateString() === today &&
        (b.status === 'closed' || b.status === 'REQUIRES_REVIEW')
      );

      const report = await base44.entities.POSZReport.create({
        report_id: `Z-${Date.now()}`,
        report_date: new Date().toISOString().split('T')[0],
        start_time: new Date(new Date().setHours(0,0,0,0)).toISOString(),
        end_time: new Date().toISOString(),
        cashier_name: cashierDisplay,
        opening_cash: Number(openingCash),
        closing_cash: Number(closingCash),
        cash_sales: cashSales,
        card_sales: cardSales,
        // SECTION 4 — total_sales = cash_sales + card_sales ONLY
        total_sales: totalSales,
        transaction_count: realTransactions.length,
        real_transaction_count: realTransactions.length,
        demo_transaction_count: demoTransactions.length,
        batch_id: todayBatch?.batch_id || null,
        vip_room_revenue: vipRevenue,
        bar_revenue: barRevenue,
        merchandise_revenue: merchandiseRevenue,
        // SECTION 4 — reconciliation fields
        expected_cash: s4_expectedCash,
        actual_cash: s4_actualCash,
        cash_over_short: s4_cashOverShort,
        corrected_total_sales: totalSales,
        batch_discrepancy_total: s4_cashOverShort,
        requires_review: s4_requiresReview,
        reconciliation_notes: reconciliationNotes.trim() || null,
        reconciled_by: user.email,
        reconciled_at: new Date().toISOString(),
        // legacy discrepancy field preserved
        discrepancy: s4_cashOverShort,
        products_sold,
        notes: JSON.stringify({
          glyph_buck_issued_value: glyphBuckIssued,
          glyph_buck_revenue_charged: glyphBuckRevenue,
          glyph_buck_redeemed_value: glyphBuckRedeemed,
          glyph_buck_contracts: todayOrders.length,
          entertainer_tip_payouts: entertainerPayouts,
          demo_transaction_count: demoTransactions.length,
          demo_total: demoTotal,
          gb_ledger_issued: gbLedgerIssued,
          gb_ledger_redeemed: gbLedgerRedeemed,
          gb_ledger_net: gbLedgerNet,
          venue_contract_count: contractCount,
          venue_contract_value: contractValue,
          venue_contract_gb_issued: contractGBIssued,
          door_register_sales: doorSales,
          door_register_count: doorTransactions.length,
          bar_register_sales: barSales,
          bar_register_count: barTransactions.length,
        })
      });

      // OMEGA SECTION A — Permanent audit log write on batch close
      await base44.entities.SystemAuditLog.create({
        event_type: 'Z_REPORT_GENERATED',
        description: `Z-Report ${report.report_id} closed. Total Sales: $${report.total_sales.toFixed(2)}. Cash Over/Short: $${(report.cash_over_short || 0).toFixed(2)}.`,
        actor_id: user.email,
        status: s4_requiresReview ? 'alert' : 'success',
        severity: s4_requiresReview ? 'high' : 'low',
        resource_id: report.report_id,
        metadata: {
          report_id: report.report_id,
          batch_id: report.batch_id,
          total_sales: report.total_sales,
          cash_sales: report.cash_sales,
          card_sales: report.card_sales,
          cash_over_short: report.cash_over_short,
          requires_review: report.requires_review,
          real_transactions: report.real_transaction_count,
          demo_transactions: report.demo_transaction_count,
          glyphbucks_issued: glyphBuckIssued,
          glyphbucks_redeemed: glyphBuckRedeemed,
          opening_cash: report.opening_cash,
          closing_cash: report.closing_cash,
          section: 'OMEGA-A-Z-REPORT'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['z-reports'] });
      alert(`Z-Report generated!\nReal Transactions: ${realTransactions.length}\nDemo Transactions: ${demoTransactions.length}\nTotal Sales (real tender): $${report.total_sales.toFixed(2)}`);
      printReport(report, demoTransactions.length);
    } finally {
      setIsGenerating(false);
    }
  };

  const printReport = (report, demoCount = 0) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      alert('Print blocked by browser. Please allow popups for this site and try again.');
      return;
    }
    let extra = {};
    try { extra = JSON.parse(report.notes || '{}'); } catch(e) {}

    printWindow.document.write(`
      <html>
        <head>
          <title>Z-Report ${report.report_id}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #000; }
            .section { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; padding-top: 10px; }
            .demo-note { background: #fff3cd; border: 1px solid #ffc107; padding: 8px; font-size: 11px; }
          </style>
        </head>
        <body>
          <h1>N.U.P.S. POS - Z-REPORT</h1>
          <div class="section">
            <div class="row"><span>Report ID:</span><span>${report.report_id}</span></div>
            <div class="row"><span>Date:</span><span>${report.report_date}</span></div>
            <div class="row"><span>Cashier:</span><span>${report.cashier_name}</span></div>
            ${report.batch_id ? `<div class="row"><span>Batch ID:</span><span>${report.batch_id}</span></div>` : ''}
          </div>
          <div class="section">
            <h3>CASH DRAWER RECONCILIATION (Section 4)</h3>
            <div class="row"><span>Opening Cash:</span><span>$${(report.opening_cash||0).toFixed(2)}</span></div>
            <div class="row"><span>Cash Sales:</span><span>$${(report.cash_sales||0).toFixed(2)}</span></div>
            <div class="row"><span>Expected Cash (Open + Cash Sales):</span><span>$${(report.expected_cash||0).toFixed(2)}</span></div>
            <div class="row"><span>Actual Cash (Closing):</span><span>$${(report.actual_cash||report.closing_cash||0).toFixed(2)}</span></div>
            <div class="row" style="font-weight:bold;color:${(report.cash_over_short||0) !== 0 ? 'red' : 'green'}"><span>Cash Over/Short:</span><span>$${(report.cash_over_short||0).toFixed(2)}</span></div>
            ${report.requires_review ? `<div style="background:#fff3cd;border:1px solid #ffc107;padding:6px;margin-top:4px;font-size:11px;">⚠️ REQUIRES REVIEW — Discrepancy: $${(report.batch_discrepancy_total||0).toFixed(2)}</div>` : ''}
            ${report.reconciliation_notes ? `<div class="row"><span>Reconciliation Notes:</span><span style="max-width:60%;text-align:right;">${report.reconciliation_notes}</span></div>` : ''}
            <div class="row" style="font-size:10px;color:#666;"><span>Reconciled By:</span><span>${report.reconciled_by||''}</span></div>
          </div>
          <div class="section">
            <h3>SALES BREAKDOWN (Real Tender Only)</h3>
            <div class="row"><span>Cash Sales:</span><span>$${report.cash_sales.toFixed(2)}</span></div>
            <div class="row"><span>Card Sales:</span><span>$${report.card_sales.toFixed(2)}</span></div>
            <div class="row"><span>VIP Room Revenue:</span><span>$${report.vip_room_revenue.toFixed(2)}</span></div>
            <div class="row"><span>Bar Revenue:</span><span>$${report.bar_revenue.toFixed(2)}</span></div>
            <div class="row"><span>Merchandise:</span><span>$${report.merchandise_revenue.toFixed(2)}</span></div>
          </div>
          <div class="section">
            <h3>STATION BREAKDOWN</h3>
            <div class="row"><span>🚪 Door Register Sales:</span><span>$${(extra.door_register_sales||0).toFixed(2)} (${extra.door_register_count||0} txns)</span></div>
            <div class="row"><span>🍸 Bar Register Sales:</span><span>$${(extra.bar_register_sales||0).toFixed(2)} (${extra.bar_register_count||0} txns)</span></div>
          </div>
          <div class="section">
            <h3>TRANSACTION COUNTS</h3>
            <div class="row"><span>Real Transactions:</span><span>${report.real_transaction_count || report.transaction_count}</span></div>
            ${(report.demo_transaction_count || demoCount) > 0 ? `
            <div class="demo-note">
              ⚠️ Demo Transactions: ${report.demo_transaction_count || demoCount} — $${((extra.demo_total||0)).toFixed(2)} — NOT INCLUDED IN TOTALS
            </div>` : ''}
          </div>
          <div class="section">
            <h3>PRODUCTS SOLD</h3>
            ${(report.products_sold || []).map(p => `
              <div class="row">
                <span>${p.product_name} (x${p.quantity})</span>
                <span>$${p.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          ${extra.glyph_buck_contracts ? `
          <div class="section">
            <h3>GLYPHBUCKS LEDGER (Liability — Not Revenue)</h3>
            <div class="row"><span>GB Issued (Ledger):</span><span>${(extra.gb_ledger_issued||0).toFixed(2)} GB</span></div>
            <div class="row"><span>GB Redeemed (Ledger):</span><span>${(extra.gb_ledger_redeemed||0).toFixed(2)} GB</span></div>
            <div class="row" style="font-weight:bold;"><span>Net GB Liability:</span><span>${(extra.gb_ledger_net||0).toFixed(2)} GB</span></div>
          </div>
          <div class="section">
            <h3>CONTRACT SYSTEM (Reference)</h3>
            <div class="row"><span>Contracts Today:</span><span>${extra.venue_contract_count||0}</span></div>
            <div class="row"><span>Contract Value:</span><span>$${(extra.venue_contract_value||0).toFixed(2)}</span></div>
            <div class="row"><span>GB Issued via Contracts:</span><span>${(extra.venue_contract_gb_issued||0).toFixed(2)} GB</span></div>
          </div>
          <div class="section">
            <h3>LEGACY GLYPH BUCK™ ORDERS (Reference)</h3>
            <div class="row"><span>Orders Issued Today:</span><span>${extra.glyph_buck_contracts||0}</span></div>
            <div class="row"><span>Face Value Issued:</span><span>$${(extra.glyph_buck_issued_value||0).toFixed(2)}</span></div>
            <div class="row"><span>Revenue Charged (w/ surcharge):</span><span>$${(extra.glyph_buck_revenue_charged||0).toFixed(2)}</span></div>
            <div class="row"><span>Redeemed Value:</span><span>$${(extra.glyph_buck_redeemed_value||0).toFixed(2)}</span></div>
            <div class="row"><span>Entertainer Tip Payouts:</span><span>$${(extra.entertainer_tip_payouts||0).toFixed(2)}</span></div>
          </div>
          <div style="font-size:9px;color:#666;margin-bottom:8px;">GlyphBucks™ is a proprietary stored-value instrument of GlyphLock Financial LLC. All transactions are audit-logged. GlyphBucks are liabilities, not revenue.</div>
          ` : ''}
          <div class="section total">
            <div class="row"><span>Real Transactions:</span><span>${report.real_transaction_count || report.transaction_count}</span></div>
            <div class="row"><span>TOTAL SALES (Cash + Card — Real Tender Only):</span><span>$${(report.total_sales||0).toFixed(2)}</span></div>
            <div class="row"><span>CORRECTED TOTAL SALES:</span><span>$${(report.corrected_total_sales||report.total_sales||0).toFixed(2)}</span></div>
          </div>
          <div style="margin-top:20px;border-top:1px solid #000;padding-top:12px;display:flex;gap:40px;">
            <div style="flex:1;"><div style="font-size:10px;font-weight:bold;margin-bottom:4px;">MANAGER SIGNATURE</div><div style="border-bottom:1px solid #000;height:28px;"></div></div>
            <div style="flex:1;"><div style="font-size:10px;font-weight:bold;margin-bottom:4px;">DATE</div><div style="border-bottom:1px solid #000;height:28px;"></div></div>
          </div>
          <div style="text-align:center;font-size:9px;color:#999;margin-top:10px;">N.U.P.S. POS — GlyphLock Financial LLC — ${new Date().toLocaleString()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const canGenerate = user?.email && realTransactions.length > 0 && !isGenerating;

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="glass-card-dark border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-400">Cash Sales</span>
            </div>
            <div className="text-2xl font-bold text-cyan-400">${cashSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Card Sales</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">${cardSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-pink-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-400">VIP Revenue</span>
            </div>
            <div className="text-2xl font-bold text-pink-400">${vipRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Real Transactions</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{realTransactions.length}</div>
            {demoTransactions.length > 0 && (
              <div className="text-xs text-yellow-500 mt-1">{demoTransactions.length} demo excluded</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Door Register</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">${doorSales.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">{doorTransactions.length} txns</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Bar Register</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">${barSales.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">{barTransactions.length} txns</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-gray-400">GB Issued (Ledger)</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">{gbLedgerIssued.toFixed(2)} GB</div>
            <div className="text-xs text-gray-600 mt-1">Legacy orders: ${glyphBuckIssued.toFixed(2)} (ref only)</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">GB Redeemed (Ledger)</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">{gbLedgerRedeemed.toFixed(2)} GB</div>
            <div className="text-xs text-gray-600 mt-1">Net liability: {gbLedgerNet.toFixed(2)} GB</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ScrollText className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Contracts Today</span>
            </div>
            <div className="text-2xl font-bold text-purple-400">{contractCount}</div>
            <div className="text-xs text-gray-600 mt-1">${contractValue.toFixed(2)} value · {contractGBIssued.toFixed(0)} GB via contracts</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-pink-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-pink-400" />
              <span className="text-sm text-gray-400">Entertainer Payouts</span>
            </div>
            <div className="text-2xl font-bold text-pink-400">${entertainerPayouts.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Report */}
      <Card className="glass-card-dark border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-cyan-400" />
            Generate Z-Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user?.email && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
              ⚠️ You must be logged in to generate a Z-Report.
            </div>
          )}
          {realTransactions.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
              ⚠️ No REAL transactions today. A Z-Report cannot be generated for an empty session.
            </div>
          )}
          {demoTransactions.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 text-sm text-amber-400 font-semibold">
              ⚠️ Demo Transactions: {demoTransactions.length} — ${demoTotal.toFixed(2)} — NOT INCLUDED IN TOTALS
            </div>
          )}

          {/* SECTION 4 — Live reconciliation preview */}
          <div className="bg-gray-800/60 border border-gray-600/40 rounded-lg p-4 space-y-1 text-sm">
            <div className="text-gray-400 font-semibold mb-2">Section 4 — Live Reconciliation Preview</div>
            <div className="flex justify-between text-gray-300">
              <span>Expected Cash (Opening + Cash Sales):</span>
              <span className="font-mono">${expectedCash.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Actual Cash (Closing):</span>
              <span className="font-mono">${actualCash.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between font-bold ${Math.abs(cashOverShort) > 0.01 ? 'text-red-400' : 'text-green-400'}`}>
              <span>Cash Over/Short:</span>
              <span className="font-mono">${cashOverShort.toFixed(2)}</span>
            </div>
            {requiresReview && (
              <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-red-400 text-xs mt-2">
                ⚠️ REQUIRES REVIEW — Reconciliation notes are mandatory before generating.
              </div>
            )}
          </div>

          {/* Section 4 — Reconciliation Notes (required if discrepancy) */}
          {requiresReview && (
            <div>
              <Label className="text-white">Reconciliation Notes <span className="text-red-400">*Required</span></Label>
              <textarea
                value={reconciliationNotes}
                onChange={(e) => setReconciliationNotes(e.target.value)}
                className="w-full mt-1 rounded-lg bg-gray-800 border border-red-500/50 text-white p-3 text-sm resize-none"
                rows={3}
                placeholder="Explain the cash discrepancy before generating report..."
              />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-white">Opening Cash</Label>
              <Input
                type="number"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                className="glass-input"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label className="text-white">Closing Cash</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                className="glass-input"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate & Print'}
              </Button>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Expected Total Sales (Real Tender Only)</div>
              <div className="text-3xl font-bold text-green-400">${totalSales.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">Cash + Card only · Tips, GlyphBucks, VIP, and DEMO transactions excluded per BPAAA v3.0</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card className="glass-card-dark border-gray-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-gray-400" />
            Recent Z-Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentReports.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No Z-Reports yet.</p>
            )}
            {recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => printReport(report)}
              >
                <div>
                  <div className="font-semibold text-white">{report.report_id}</div>
                  <div className="text-sm text-gray-400">{report.report_date} · {report.cashier_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-400">${(report.total_sales || 0).toFixed(2)}</div>
                  <div className="text-xs text-gray-400">
                    {report.real_transaction_count ?? report.transaction_count} real
                    {report.demo_transaction_count > 0 && ` · ${report.demo_transaction_count} demo`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}