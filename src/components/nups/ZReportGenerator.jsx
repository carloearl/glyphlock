import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, DollarSign, ShoppingCart, Printer, Calendar, Banknote, Users } from "lucide-react";

export default function ZReportGenerator({ user }) {
  const queryClient = useQueryClient();
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false); // B1 — duplicate guard

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

  // Live preview calculations
  const cashSales = todayTransactions
    .filter(t => t.payment_method === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const cardSales = todayTransactions
    .filter(t => t.payment_method !== 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const vipRevenue = todayVIPSessions
    .reduce((sum, s) => sum + (s.total_charge || 0), 0);

  // B2 — total_sales = real tender only. GlyphBucks are reference-only.
  const totalSales = cashSales + cardSales + vipRevenue;

  const glyphBuckRevenue = todayOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
  const glyphBuckIssued = todayOrders.reduce((s, o) => s + (o.glyphbucks_value || 0), 0);
  const glyphBuckRedeemed = todayOrders.filter(o => o.status === 'archived').reduce((s, o) => s + (o.glyphbucks_value || 0), 0);
  const entertainerPayouts = todayTipPayouts.reduce((s, p) => s + (p.total_tips || 0), 0);

  const handleGenerate = async () => {
    // B6 — block anonymous / no-transaction generation
    if (!user?.email) {
      alert('You must be logged in to generate a Z-Report.');
      return;
    }
    if (todayTransactions.length === 0) {
      alert('No transactions found for today. Cannot generate an empty Z-Report.');
      return;
    }

    // B1 — duplicate guard
    if (isGenerating) return;
    setIsGenerating(true);

    if (!window.confirm('Generate Z-Report for today? This closes the reporting period.')) return;
    try {
      const barRevenue = todayTransactions
        .filter(t => t.items?.some(item => item.product_name?.includes('Drink')))
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const merchandiseRevenue = totalSales - barRevenue - vipRevenue;

      const productSalesMap = {};
      todayTransactions.forEach(t => {
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
        total_sales: totalSales,
        transaction_count: todayTransactions.length,
        vip_room_revenue: vipRevenue,
        bar_revenue: barRevenue,
        merchandise_revenue: merchandiseRevenue,
        discrepancy: Number(closingCash) - Number(openingCash) - cashSales,
        products_sold,
        notes: JSON.stringify({
          glyph_buck_issued_value: glyphBuckIssued,
          glyph_buck_revenue_charged: glyphBuckRevenue,
          glyph_buck_redeemed_value: glyphBuckRedeemed,
          glyph_buck_contracts: todayOrders.length,
          entertainer_tip_payouts: entertainerPayouts,
        })
      });

      queryClient.invalidateQueries({ queryKey: ['z-reports'] });
      alert(`Z-Report generated!\nTotal Sales (real tender): $${report.total_sales.toFixed(2)}`);
      printReport(report);
    } finally {
      setIsGenerating(false);
    }
  };

  const printReport = (report) => {
    const printWindow = window.open('', '', 'width=800,height=600');
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
          </style>
        </head>
        <body>
          <h1>N.U.P.S. POS - Z-REPORT</h1>
          <div class="section">
            <div class="row"><span>Report ID:</span><span>${report.report_id}</span></div>
            <div class="row"><span>Date:</span><span>${report.report_date}</span></div>
            <div class="row"><span>Cashier:</span><span>${report.cashier_name}</span></div>
          </div>
          <div class="section">
            <h3>CASH DRAWER</h3>
            <div class="row"><span>Opening Cash:</span><span>$${report.opening_cash.toFixed(2)}</span></div>
            <div class="row"><span>Closing Cash:</span><span>$${report.closing_cash.toFixed(2)}</span></div>
            <div class="row"><span>Discrepancy:</span><span>$${report.discrepancy.toFixed(2)}</span></div>
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
            <h3>GLYPH BUCK™ ACTIVITY (Reference — Not in Total Sales)</h3>
            <div class="row"><span>Contracts Issued Today:</span><span>${extra.glyph_buck_contracts}</span></div>
            <div class="row"><span>Face Value Issued:</span><span>$${(extra.glyph_buck_issued_value||0).toFixed(2)}</span></div>
            <div class="row"><span>Revenue Charged (w/ surcharge):</span><span>$${(extra.glyph_buck_revenue_charged||0).toFixed(2)}</span></div>
            <div class="row"><span>Redeemed Value:</span><span>$${(extra.glyph_buck_redeemed_value||0).toFixed(2)}</span></div>
            <div class="row"><span>Entertainer Tip Payouts:</span><span>$${(extra.entertainer_tip_payouts||0).toFixed(2)}</span></div>
          </div>
          <div style="font-size:9px;color:#666;margin-bottom:8px;">Glyph Buck™ is a proprietary instrument of GlyphLock Financial LLC. All redemptions are audit-logged.</div>
          ` : ''}
          <div class="section total">
            <div class="row"><span>Total Transactions:</span><span>${report.transaction_count}</span></div>
            <div class="row"><span>TOTAL SALES (Cash + Card + VIP):</span><span>$${report.total_sales.toFixed(2)}</span></div>
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

  const canGenerate = user?.email && todayTransactions.length > 0 && !isGenerating;

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
              <span className="text-sm text-gray-400">Transactions</span>
            </div>
            <div className="text-2xl font-bold text-green-400">{todayTransactions.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-gray-400">Glyph Bucks Issued</span>
            </div>
            <div className="text-2xl font-bold text-amber-400">${glyphBuckIssued.toFixed(2)}</div>
            <div className="text-xs text-gray-600 mt-1">{todayOrders.length} contracts · ${glyphBuckRevenue.toFixed(2)} charged (ref only)</div>
          </CardContent>
        </Card>

        <Card className="glass-card-dark border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="w-5 h-5 text-orange-400" />
              <span className="text-sm text-gray-400">Glyph Bucks Redeemed</span>
            </div>
            <div className="text-2xl font-bold text-orange-400">${glyphBuckRedeemed.toFixed(2)}</div>
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
          {todayTransactions.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
              ⚠️ No transactions today. A Z-Report cannot be generated for an empty session.
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
              <div className="text-xs text-gray-500 mt-1">Cash + Card + VIP · GlyphBuck revenue excluded per audit</div>
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
                  <div className="text-xs text-gray-400">{report.transaction_count} transactions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}