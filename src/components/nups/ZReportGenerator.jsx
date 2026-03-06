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
      const all = await base44.entities.DreamPalaceOrder.list('-created_date', 500);
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

  const generateZReport = useMutation({
    mutationFn: () => {
      const cashSales = todayTransactions
        .filter(t => t.payment_method === 'Cash')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const cardSales = todayTransactions
        .filter(t => t.payment_method !== 'Cash')
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const vipRevenue = todayVIPSessions
        .reduce((sum, s) => sum + (s.total_charge || 0), 0);

      const totalSales = cashSales + cardSales + vipRevenue;

      // Categorize revenue
      const barRevenue = todayTransactions
        .filter(t => t.items?.some(item => item.product_name?.includes('Drink')))
        .reduce((sum, t) => sum + (t.total || 0), 0);

      const merchandiseRevenue = totalSales - barRevenue - vipRevenue;

      // Product breakdown
      const productSales = {};
      todayTransactions.forEach(t => {
        t.items?.forEach(item => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = { quantity: 0, total: 0 };
          }
          productSales[item.product_name].quantity += item.quantity;
          productSales[item.product_name].total += item.total;
        });
      });

      const products_sold = Object.entries(productSales).map(([name, data]) => ({
        product_name: name,
        quantity: data.quantity,
        total: data.total
      }));

      const glyphBuckIssued = todayOrders.reduce((s, o) => s + (o.dream_dollar_value || 0), 0);
      const glyphBuckRevenue = todayOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
      const glyphBuckRedeemed = todayOrders.filter(o => o.status === "archived").reduce((s, o) => s + (o.dream_dollar_value || 0), 0);
      const entertainerPayouts = todayTipPayouts.reduce((s, p) => s + (p.total_tips || 0), 0);

      return base44.entities.POSZReport.create({
        report_id: `Z-${Date.now()}`,
        report_date: new Date().toISOString().split('T')[0],
        start_time: new Date(new Date().setHours(0,0,0,0)).toISOString(),
        end_time: new Date().toISOString(),
        cashier_name: user?.email || 'Unknown',
        opening_cash: Number(openingCash),
        closing_cash: Number(closingCash),
        cash_sales: cashSales,
        card_sales: cardSales,
        total_sales: totalSales + glyphBuckRevenue,
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
    },
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['z-reports'] });
      alert(`✅ Z-Report generated!\nTotal Sales: $${report.total_sales.toFixed(2)}`);
      printReport(report);
    }
  });

  const { data: recentReports = [] } = useQuery({
    queryKey: ['z-reports'],
    queryFn: () => base44.entities.POSZReport.list('-created_date', 10)
  });

  const printReport = (report) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Z-Report ${report.report_id}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            h1 { text-align: center; border-bottom: 2px solid #000; }
            .section { margin: 20px 0; }
            .row { display: flex; justify-between; margin: 5px 0; }
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
            <h3>SALES BREAKDOWN</h3>
            <div class="row"><span>Cash Sales:</span><span>$${report.cash_sales.toFixed(2)}</span></div>
            <div class="row"><span>Card Sales:</span><span>$${report.card_sales.toFixed(2)}</span></div>
            <div class="row"><span>VIP Room Revenue:</span><span>$${report.vip_room_revenue.toFixed(2)}</span></div>
            <div class="row"><span>Bar Revenue:</span><span>$${report.bar_revenue.toFixed(2)}</span></div>
            <div class="row"><span>Merchandise:</span><span>$${report.merchandise_revenue.toFixed(2)}</span></div>
          </div>
          
          <div class="section">
            <h3>PRODUCTS SOLD</h3>
            ${report.products_sold.map(p => `
              <div class="row">
                <span>${p.product_name} (x${p.quantity})</span>
                <span>$${p.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="section total">
            <div class="row"><span>Total Transactions:</span><span>${report.transaction_count}</span></div>
            <div class="row"><span>TOTAL SALES:</span><span>$${report.total_sales.toFixed(2)}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const cashSales = todayTransactions
    .filter(t => t.payment_method === 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const cardSales = todayTransactions
    .filter(t => t.payment_method !== 'Cash')
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const vipRevenue = todayVIPSessions
    .reduce((sum, s) => sum + (s.total_charge || 0), 0);

  const glyphBuckRevenue = todayOrders.reduce((s, o) => s + (o.grand_total || 0), 0);
  const glyphBuckIssued = todayOrders.reduce((s, o) => s + (o.dream_dollar_value || 0), 0);
  const glyphBuckRedeemed = todayOrders.filter(o => o.status === "archived").reduce((s, o) => s + (o.dream_dollar_value || 0), 0);
  const entertainerPayouts = todayTipPayouts.reduce((s, p) => s + (p.total_tips || 0), 0);

  const totalSales = cashSales + cardSales + vipRevenue + glyphBuckRevenue;

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
                onClick={() => generateZReport.mutate()}
                disabled={generateZReport.isPending}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                <Printer className="w-4 h-4 mr-2" />
                {generateZReport.isPending ? "Generating..." : "Generate & Print"}
              </Button>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Expected Total Sales</div>
              <div className="text-3xl font-bold text-green-400">${totalSales.toFixed(2)}</div>
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
            {recentReports.map((report) => (
              <div 
                key={report.id}
                className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => printReport(report)}
              >
                <div>
                  <div className="font-semibold text-white">{report.report_id}</div>
                  <div className="text-sm text-gray-400">{report.report_date} • {report.cashier_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-cyan-400">${report.total_sales.toFixed(2)}</div>
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