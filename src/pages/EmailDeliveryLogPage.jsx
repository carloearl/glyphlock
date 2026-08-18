import React, { useEffect, useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mail } from 'lucide-react';
import EmailDeliveryRow from '@/components/notifications/EmailDeliveryRow';

export default function EmailDeliveryLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await base44.entities.EmailDeliveryLog.list('-created_date', 100);
    setLogs(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sentCount = logs.filter(l => l.status === 'sent').length;
  const failedCount = logs.length - sentCount;

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Mail className="h-6 w-6 text-cyan-400" />
              Notification Delivery Log
            </h1>
            <p className="text-slate-400 text-sm mt-2">
              Every intake and contact notification send attempt, with its result.
            </p>
          </div>
          <Button onClick={load} variant="outline" className="border-slate-700 text-slate-200 shrink-0">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-green-500/30">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{sentCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/60 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase tracking-wide">Failed</p>
              <p className="text-2xl font-bold text-red-400">{failedCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Recent Attempts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <p className="text-slate-400 text-sm p-6">Loading delivery log…</p>
            ) : logs.length === 0 ? (
              <p className="text-slate-400 text-sm p-6">
                No notifications sent yet. Submit an intake or contact form and it will appear here.
              </p>
            ) : (
              logs.map(log => <EmailDeliveryRow key={log.id} log={log} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}