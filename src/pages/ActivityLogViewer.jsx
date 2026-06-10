import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Download, RefreshCw, Filter, Search } from 'lucide-react';
import { logActivity } from '@/lib/nups/activityLog';

const ACTION_COLORS = {
  LOGIN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  LOGOUT: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  CREATE: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  UPDATE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  DELETE: 'bg-red-500/20 text-red-300 border-red-500/40',
  EXPORT: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
  SETTLEMENT_RUN: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  PAYOUT_TOGGLE: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  CONFIG_CHANGE: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
};

const ACTION_TYPES = ['LOGIN','LOGOUT','CREATE','UPDATE','DELETE','EXPORT','SETTLEMENT_RUN','PAYOUT_TOGGLE','CONFIG_CHANGE'];

function toCsv(rows) {
  const headers = ['timestamp','user_email','user_role','action_type','entity_affected','venue_id','mode','notes'];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n');
}

export default function ActivityLogViewer() {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    user_email: '',
    action_type: 'ALL',
    venue_id: '',
    mode: 'REAL',
    date_from: yesterday,
    date_to: today,
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const isManager = user && (
    user.role === 'admin' ||
    ['PLATFORM_ADMIN','VENUE_OWNER','VENUE_MANAGER'].includes(user._highestRole)
  );

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['activity-log', filters.mode],
    queryFn: () => base44.entities.ActivityLog.list('-timestamp', 500),
    enabled: !!isManager,
  });

  const filtered = useMemo(() => {
    return logs.filter(r => {
      if (filters.mode !== 'ALL' && r.mode && r.mode !== filters.mode) return false;
      if (filters.action_type !== 'ALL' && r.action_type !== filters.action_type) return false;
      if (filters.user_email && !(r.user_email || '').toLowerCase().includes(filters.user_email.toLowerCase())) return false;
      if (filters.venue_id && !(r.venue_id || '').toLowerCase().includes(filters.venue_id.toLowerCase())) return false;
      const ts = r.timestamp ? r.timestamp.slice(0, 10) : '';
      if (filters.date_from && ts < filters.date_from) return false;
      if (filters.date_to && ts > filters.date_to) return false;
      return true;
    });
  }, [logs, filters]);

  const handleExport = async () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    // Log the export action itself
    await logActivity({
      action_type: 'EXPORT',
      entity_affected: 'ActivityLog',
      notes: `exported_rows=${filtered.length} filters=${JSON.stringify(filters)}`,
    });
    refetch();
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }

  if (!isManager) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-900 border-red-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">Access Restricted</h2>
            <p className="text-slate-400 text-sm">Activity Log is Manager-role gated. External users cannot view.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              Admin Activity Log
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Append-only audit trail · {filtered.length} of {logs.length} records · Mode: {filters.mode}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="border-slate-700">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button onClick={handleExport} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-300">
              <Filter className="w-4 h-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-slate-400">User email</label>
              <Input
                placeholder="filter…"
                value={filters.user_email}
                onChange={e => setFilters(f => ({ ...f, user_email: e.target.value }))}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Action</label>
              <Select value={filters.action_type} onValueChange={v => setFilters(f => ({ ...f, action_type: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {ACTION_TYPES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Mode</label>
              <Select value={filters.mode} onValueChange={v => setFilters(f => ({ ...f, mode: v }))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REAL">REAL</SelectItem>
                  <SelectItem value="DEMO">DEMO</SelectItem>
                  <SelectItem value="SANDBOX">SANDBOX</SelectItem>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-slate-400">From</label>
              <Input type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400">To</label>
              <Input type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} className="bg-slate-800 border-slate-700 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Entity</th>
                  <th className="text-left p-3">Venue</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-left p-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading…</td></tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-500">No matching records.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                    <td className="p-3 font-mono text-xs text-slate-400">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-white">{r.user_email || '—'}</td>
                    <td className="p-3 text-slate-400 text-xs">{r.user_role || '—'}</td>
                    <td className="p-3">
                      <Badge className={`text-[10px] border ${ACTION_COLORS[r.action_type] || 'bg-slate-700/30 text-slate-300'}`}>
                        {r.action_type}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-400">{r.entity_affected || '—'}</td>
                    <td className="p-3 text-xs text-slate-400">{r.venue_id || '—'}</td>
                    <td className="p-3 text-xs">
                      <Badge variant="outline" className={r.mode === 'DEMO' ? 'border-amber-500/40 text-amber-300' : 'border-slate-600 text-slate-400'}>
                        {r.mode || '—'}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500 max-w-xs truncate">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}