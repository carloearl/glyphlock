import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle2, User } from 'lucide-react';
import { TYPE_LABELS, SEV_STYLES, STATUS_STYLES, fmtTime } from '@/lib/nups/reconciliationConstants';

export default function ExceptionTable({ exceptions, loading, onRowClick }) {
  if (loading) {
    return <div className="text-center py-12 text-white/50">Loading exceptions...</div>;
  }
  if (exceptions.length === 0) {
    return (
      <Card className="p-12 bg-white/5 border-white/10 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p className="text-lg font-medium">No exceptions found</p>
        <p className="text-sm text-white/50 mt-1">The payment chain is clean for these filters.</p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-white/50 bg-white/5">
            <th className="text-left p-3 whitespace-nowrap">Exception ID</th>
            <th className="text-left p-3">Venue</th>
            <th className="text-left p-3">Type</th>
            <th className="text-left p-3">Severity</th>
            <th className="text-left p-3">Status</th>
            <th className="text-left p-3">Assigned</th>
            <th className="text-left p-3">Detected</th>
            <th className="text-left p-3">Description</th>
          </tr>
        </thead>
        <tbody>
          {exceptions.map(e => (
            <tr
              key={e.id}
              onClick={() => onRowClick(e)}
              className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
            >
              <td className="p-3 font-mono text-xs whitespace-nowrap">{e.exception_id?.slice(0, 20) || '—'}</td>
              <td className="p-3 text-white/70">{e.venue_id || '—'}</td>
              <td className="p-3 font-medium whitespace-nowrap">{TYPE_LABELS[e.exception_type] || e.exception_type}</td>
              <td className="p-3"><Badge className={SEV_STYLES[e.severity] || ''}>{e.severity}</Badge></td>
              <td className="p-3"><Badge className={STATUS_STYLES[e.status] || ''}>{e.status}</Badge></td>
              <td className="p-3 text-white/70">
                {e.assigned_to ? (
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.assigned_to.split('@')[0]}</span>
                ) : <span className="text-white/30">—</span>}
              </td>
              <td className="p-3 text-white/50 text-xs whitespace-nowrap">{fmtTime(e.detected_at)}</td>
              <td className="p-3 max-w-xs truncate text-white/60">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}