import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// F-3 BPAAA v3.0: SettlementReports reads from POSZReport.total_sales ONLY.
// Single source of truth. Must match what was printed on the Z-Report exactly.
// No independent recalculation from POSTransaction.

export default function SettlementReports() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: zReports = [], isLoading } = useQuery({
    queryKey: ['settlement-z-reports'],
    queryFn: () => base44.entities.POSZReport.list('-report_date', 50),
  });

  const filteredReports = selectedDate
    ? zReports.filter(r => r.report_date === selectedDate)
    : zReports;

  const selectedReport = filteredReports[0] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Daily Settlement Reports
        </h1>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          ℹ️ Settlement figures are read directly from the Z-Report (POSZReport.total_sales). This is the single source of truth per BPAAA v3.0. Generate a Z-Report first to view settlement data.
        </div>

        <Card>
          <CardHeader><CardTitle>Select Report Date</CardTitle></CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {isLoading && (
          <div className="text-slate-500 text-sm text-center py-8">Loading Z-Reports...</div>
        )}

        {!isLoading && !selectedReport && (
          <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="text-slate-600">No Z-Report found for {selectedDate}.</p>
            <p className="text-slate-400 text-sm mt-1">
              Generate a Z-Report from the Reports module to view settlement data.
            </p>
          </div>
        )}

        {selectedReport && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Settlement — {selectedReport.report_date}
                  <span className="text-xs font-normal text-slate-500 ml-2">
                    Source: Z-Report {selectedReport.report_id}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">Cash Sales</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${(selectedReport.cash_sales || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">Card Sales</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${(selectedReport.card_sales || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-purple-900 font-semibold">Total Sales</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ${(selectedReport.total_sales || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-500 mt-1">Cash + Card only</p>
                  </div>
                  <div className={`p-4 rounded-lg ${selectedReport.requires_review ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
                    <p className="text-sm text-slate-900">Cash Over/Short</p>
                    <p className={`text-2xl font-bold ${(selectedReport.cash_over_short || 0) < 0 ? 'text-red-700' : 'text-slate-700'}`}>
                      ${(selectedReport.cash_over_short || 0).toFixed(2)}
                    </p>
                    {selectedReport.requires_review && (
                      <p className="text-xs text-red-500 mt-1">⚠️ Requires Review</p>
                    )}
                  </div>
                </div>

                {/* F-4: Tips — pass-through display only */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-800">
                    Tips — staff pass-through (not venue revenue)
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Tips are excluded from all revenue totals above. See Tip Pool Report for full tip detail.
                  </p>
                </div>

                <div className="mt-4 space-y-1 text-sm text-slate-500">
                  <div className="flex justify-between">
                    <span>Cashier</span>
                    <span className="font-medium text-slate-700">{selectedReport.cashier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Real Transactions</span>
                    <span className="font-medium text-slate-700">
                      {selectedReport.real_transaction_count ?? selectedReport.transaction_count}
                    </span>
                  </div>
                  {selectedReport.demo_transaction_count > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Demo Transactions (excluded)</span>
                      <span>{selectedReport.demo_transaction_count}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Reconciled By</span>
                    <span className="font-medium text-slate-700">{selectedReport.reconciled_by}</span>
                  </div>
                  {selectedReport.reconciliation_notes && (
                    <div className="flex justify-between">
                      <span>Reconciliation Notes</span>
                      <span className="font-medium text-slate-700 max-w-xs text-right">
                        {selectedReport.reconciliation_notes}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GlyphBucks Liability — F-2: separate section, never added to revenue */}
            {(() => {
              let extra = {};
              try { extra = JSON.parse(selectedReport.notes || '{}'); } catch { /* Intentionally ignored: best-effort operation. */ }
              if (!extra.gb_ledger_issued && !extra.glyph_buck_issued_value) return null;
              return (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-amber-700 flex items-center gap-2">
                      GlyphBucks Liability — not venue revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-700">
                      ⚠️ GlyphBucks are a stored-value liability instrument. These figures are never counted as venue revenue.
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-900">GB Issued</p>
                        <p className="text-xl font-bold text-amber-700">
                          {(extra.gb_ledger_issued || 0).toFixed(2)} GB
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-900">GB Redeemed</p>
                        <p className="text-xl font-bold text-amber-700">
                          {(extra.gb_ledger_redeemed || 0).toFixed(2)} GB
                        </p>
                      </div>
                      <div className="p-4 bg-amber-50 rounded-lg">
                        <p className="text-sm text-amber-900">Net GB Liability</p>
                        <p className="text-xl font-bold text-amber-700">
                          {(extra.gb_ledger_net || 0).toFixed(2)} GB
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {filteredReports.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-slate-600">
                    All Z-Reports for {selectedDate}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredReports.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-mono text-sm text-slate-800">{r.report_id}</p>
                          <p className="text-xs text-slate-500">{r.cashier_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">${(r.total_sales || 0).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">Total Sales (Z-Report)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}