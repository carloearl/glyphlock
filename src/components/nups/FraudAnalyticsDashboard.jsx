import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Shield, Clock } from 'lucide-react';

/**
 * Real-time fraud analytics dashboard for Dream Dollar operations.
 * Detects anomalies, duplicate redemptions, and suspicious patterns.
 */
export default function FraudAnalyticsDashboard({ venue_id }) {
  const [alerts, setAlerts] = useState([]);

  // Fetch recent transactions for analysis
  const { data: recentBills } = useQuery({
    queryKey: ['fraud-analysis-bills', venue_id],
    queryFn: async () => {
      const bills = await base44.entities.DreamDollarBill.filter(
        { venue_id },
        '-created_date',
        100
      );
      return bills;
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  const { data: recentPayouts } = useQuery({
    queryKey: ['fraud-analysis-payouts', venue_id],
    queryFn: async () => {
      const payouts = await base44.entities.ContractorPayout.filter(
        { venue_id },
        '-created_date',
        50
      );
      return payouts;
    },
    refetchInterval: 30000
  });

  // Run fraud detection
  useEffect(() => {
    if (!recentBills || !recentPayouts) return;

    const detected = [];

    // 1. Detect rapid-fire redemptions (same contractor, <5 min apart)
    const redemptions = recentBills
      .filter(b => b.status === 'redeemed')
      .sort((a, b) => new Date(b.redeemed_at) - new Date(a.redeemed_at));

    for (let i = 0; i < redemptions.length - 1; i++) {
      const current = redemptions[i];
      const next = redemptions[i + 1];

      if (current.redeemed_by_contractor_id === next.redeemed_by_contractor_id) {
        const time_diff = (new Date(current.redeemed_at) - new Date(next.redeemed_at)) / 1000 / 60;
        if (time_diff < 5) {
          detected.push({
            severity: 'WARNING',
            type: 'rapid_redemption',
            message: `Rapid-fire redemption: ${current.redeemed_by_contractor_id} redeemed multiple bills within ${time_diff.toFixed(1)} minutes`,
            timestamp: current.redeemed_at,
            data: { bills: [current.serial_number, next.serial_number] }
          });
        }
      }
    }

    // 2. Detect duplicate serial attempts
    const serialMap = new Map();
    recentBills.forEach(bill => {
      if (serialMap.has(bill.serial_number)) {
        serialMap.get(bill.serial_number).push(bill);
      } else {
        serialMap.set(bill.serial_number, [bill]);
      }
    });

    serialMap.forEach((bills, serial) => {
      if (bills.length > 1) {
        detected.push({
          severity: 'CRITICAL',
          type: 'duplicate_serial',
          message: `Duplicate serial number detected: ${serial} appears ${bills.length} times`,
          timestamp: new Date().toISOString(),
          data: { serial, occurrences: bills.length }
        });
      }
    });

    // 3. Detect unusually high payout values
    const avg_payout = recentPayouts.reduce((sum, p) => sum + (p.total_payout || 0), 0) / recentPayouts.length;
    const high_threshold = avg_payout * 3;

    recentPayouts.forEach(payout => {
      if (payout.total_payout > high_threshold) {
        detected.push({
          severity: 'WARNING',
          type: 'high_payout',
          message: `Unusually high payout: $${payout.total_payout.toFixed(2)} (avg: $${avg_payout.toFixed(2)})`,
          timestamp: payout.created_date,
          data: { payout_id: payout.payout_id, contractor: payout.contractor_name }
        });
      }
    });

    // 4. Detect off-hours redemptions (before 6 PM or after 4 AM)
    redemptions.forEach(bill => {
      const hour = new Date(bill.redeemed_at).getHours();
      if (hour < 18 || hour > 4) {
        detected.push({
          severity: 'INFO',
          type: 'off_hours',
          message: `Off-hours redemption at ${new Date(bill.redeemed_at).toLocaleTimeString()}`,
          timestamp: bill.redeemed_at,
          data: { serial: bill.serial_number }
        });
      }
    });

    setAlerts(detected.slice(0, 10)); // Show top 10 alerts
  }, [recentBills, recentPayouts]);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = alerts.filter(a => a.severity === 'WARNING').length;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="glyph-glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-400">{criticalCount}</div>
                <div className="text-sm text-gray-400">Critical Alerts</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glyph-glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-400">{warningCount}</div>
                <div className="text-sm text-gray-400">Warnings</div>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glyph-glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-400">{recentBills?.length || 0}</div>
                <div className="text-sm text-gray-400">Bills Monitored</div>
              </div>
              <Shield className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert List */}
      <Card className="glyph-glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-cyan-400" />
            Fraud Detection Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No alerts detected. All operations normal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-900/20 border-red-500/50'
                      : alert.severity === 'WARNING'
                      ? 'bg-yellow-900/20 border-yellow-500/50'
                      : 'bg-blue-900/20 border-blue-500/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.severity === 'CRITICAL' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    ) : alert.severity === 'WARNING' ? (
                      <TrendingUp className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{alert.message}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()} • Type: {alert.type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}