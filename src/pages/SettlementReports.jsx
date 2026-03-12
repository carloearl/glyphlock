import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { DollarSign, FileText, Download } from 'lucide-react';

export default function SettlementReports() {
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settlement, setSettlement] = useState(null);

  const generateSettlement = async () => {
    setIsGenerating(true);
    try {
      const sessionVenue = await base44.functions.invoke('getSessionVenueId', {});
      const venue_id = sessionVenue.data?.venue_id;

      const result = await base44.functions.invoke('generateDailySettlement', {
        venue_id,
        settlement_date: settlementDate
      });

      setSettlement(result.data.settlement);
      toast.success('Settlement report generated');
    } catch (error) {
      toast.error('Failed to generate settlement');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <FileText className="h-8 w-8 text-blue-600" />
          Daily Settlement Reports
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Generate Settlement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="date"
                value={settlementDate}
                onChange={(e) => setSettlementDate(e.target.value)}
              />
              <Button onClick={generateSettlement} disabled={isGenerating}>
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {settlement && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Revenue Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">Gross Revenue</p>
                    <p className="text-2xl font-bold text-green-700">
                      ${settlement.total_gross_revenue?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-900">Processing Fees</p>
                    <p className="text-2xl font-bold text-red-700">
                      -${settlement.total_processing_fees?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">Total Payouts</p>
                    <p className="text-2xl font-bold text-blue-700">
                      -${settlement.total_net_payouts?.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900">Venue Net</p>
                    <p className="text-2xl font-bold text-purple-700">
                      ${settlement.venue_net_income?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entertainer Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {settlement.entertainer_payouts?.map((ent, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{ent.stage_name}</p>
                        <p className="text-xs text-slate-600">
                          Gross: ${ent.gross_revenue?.toFixed(2)} | Commission: ${ent.house_commission?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">
                          ${ent.net_payout?.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-600">Net Payout</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {settlement.report_url && (
              <Button className="w-full" asChild>
                <a href={settlement.report_url} download={`settlement-${settlementDate}.pdf`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF Report
                </a>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}