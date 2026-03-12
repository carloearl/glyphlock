import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, AlertTriangle } from 'lucide-react';

/**
 * QUICK STATS DASHBOARD WIDGET
 * Real-time venue performance metrics
 */

export default function QuickStatsWidget({ stats }) {
  const metrics = [
    {
      title: 'Today\'s Revenue',
      value: `$${stats?.revenue || 0}`,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'Active Bills',
      value: stats?.active_bills || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Entertainers On-Shift',
      value: stats?.entertainers || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Pending Payouts',
      value: stats?.pending_payouts || 0,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, idx) => (
        <Card key={idx}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {metric.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${metric.bg}`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}