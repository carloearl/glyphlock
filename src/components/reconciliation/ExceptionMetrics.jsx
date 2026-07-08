import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertOctagon, AlertTriangle, ShieldAlert, CheckCircle2, Clock, Building2, Repeat, TrendingUp } from 'lucide-react';
import { fmtDuration } from '@/lib/nups/reconciliationConstants';

export default function ExceptionMetrics({ metrics }) {
  const m = metrics || {};
  const cards = [
    { label: 'Open', value: m.open ?? 0, icon: AlertOctagon, color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20' },
    { label: 'Critical', value: m.critical ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
    { label: 'Escalated', value: m.escalated ?? 0, icon: ShieldAlert, color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20' },
    { label: 'Avg Resolution', value: fmtDuration(m.avg_resolution_hours), icon: Clock, color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20' },
    { label: 'Total', value: m.total ?? 0, icon: CheckCircle2, color: 'text-white/60', bg: 'bg-white/5 border-white/10' },
    { label: 'Monthly Resolve %', value: m.monthly_resolution_rate != null ? `${m.monthly_resolution_rate.toFixed(0)}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/5 border-cyan-500/20' }
  ];

  const topVenues = Object.entries(m.by_venue || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topTypes = Object.entries(m.by_type || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map(c => (
          <Card key={c.label} className={`p-4 ${c.bg}`}>
            <div className="flex items-center gap-2">
              <c.icon className={`w-5 h-5 ${c.color}`} />
              <div>
                <p className="text-xs text-white/50">{c.label}</p>
                <p className="text-xl font-bold">{c.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-white/50" />
            <p className="text-xs text-white/50">By Venue</p>
          </div>
          {topVenues.length > 0 ? topVenues.map(([v, n]) => (
            <div key={v} className="flex justify-between text-sm py-1">
              <span className="text-white/70">{v}</span>
              <span className="font-medium">{n}</span>
            </div>
          )) : <p className="text-sm text-white/30">No data</p>}
        </Card>
        <Card className="p-4 bg-white/5 border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-4 h-4 text-white/50" />
            <p className="text-xs text-white/50">Recurring Types</p>
          </div>
          {topTypes.length > 0 ? topTypes.map(([t, n]) => (
            <div key={t} className="flex justify-between text-sm py-1">
              <span className="text-white/70 truncate max-w-[200px]">{t.replace(/_/g, ' ')}</span>
              <span className="font-medium">{n}</span>
            </div>
          )) : <p className="text-sm text-white/30">No data</p>}
        </Card>
      </div>
    </div>
  );
}