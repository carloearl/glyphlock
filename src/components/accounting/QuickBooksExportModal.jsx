/**
 * QuickBooksExportModal — generates server-side IIF or CSV journal entries,
 * lets the manager download a file they can drop straight into QuickBooks.
 *
 * Format choices:
 *   • IIF — QuickBooks Desktop / Enterprise (File → Utilities → Import → IIF Files)
 *   • CSV — QuickBooks Online (Cog → Import data → Journal entries)
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Download, Loader2, FileText, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FORMAT_OPTIONS = [
  {
    id: 'iif',
    title: 'QuickBooks Desktop',
    subtitle: 'IIF file · Enterprise / Pro / Premier',
    instructions: 'In QuickBooks Desktop: File → Utilities → Import → IIF Files → select downloaded file.',
    icon: BookOpen,
  },
  {
    id: 'csv',
    title: 'QuickBooks Online',
    subtitle: 'Journal Entry CSV · QBO',
    instructions: 'In QuickBooks Online: ⚙ Settings → Import data → Journal Entries → upload CSV.',
    icon: FileText,
  },
];

export default function QuickBooksExportModal({ open, onOpenChange, range, venueId }) {
  const [format, setFormat] = useState('iif');
  const [busy, setBusy] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const handleExport = async () => {
    if (!range?.start || !range?.end) {
      toast.error('Pick a date range first');
      return;
    }
    setBusy(true);
    try {
      const res = await base44.functions.invoke('exportQuickBooksIIF', {
        start_date: range.start,
        end_date: range.end,
        venue_id: venueId || undefined,
        format,
      });

      // The function returns a file body. base44.functions.invoke wraps in
      // an axios response — use res.data and trigger a browser download.
      const data = res?.data;
      if (!data || (typeof data === 'object' && data.error)) {
        toast.error(data?.error || 'Export failed');
        return;
      }

      const mime = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/octet-stream';
      const ext = format === 'csv' ? 'csv' : 'iif';
      const filename = `quickbooks_${range.start}_to_${range.end}.${ext}`;
      const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data)], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      // Record-counts header is best-effort (browsers may strip it).
      const counts = res?.headers?.['x-record-counts'];
      setLastExport({ filename, counts: counts ? JSON.parse(counts) : null });
      toast.success(`QuickBooks ${format.toUpperCase()} downloaded`);
    } catch (e) {
      toast.error(e.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <span className="inline-flex w-7 h-7 rounded-md bg-emerald-500/20 text-emerald-300 items-center justify-center text-xs font-mono">QB</span>
            Export to QuickBooks
          </DialogTitle>
          <p className="text-xs text-slate-400">
            Period: <span className="text-emerald-300 font-mono">{range?.start} → {range?.end}</span>
          </p>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label className="text-xs text-slate-300">Choose format</Label>
          <div className="grid grid-cols-1 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = format === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`text-left rounded-xl border p-3 transition ${
                    active
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold flex items-center gap-2">
                        {opt.title}
                        {active && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div className="text-[11px] text-slate-400">{opt.subtitle}</div>
                      <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{opt.instructions}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed border-l-2 border-emerald-500/30 pl-3">
            <span className="text-emerald-400 font-bold">Account mapping:</span> Cash Sales · Card Sales ·
            GlyphBucks Liability · GlyphBucks Surcharge · Driver Payouts · Payroll · Cash Drawer · Card Clearing.
            QuickBooks will reuse existing accounts of the same name; missing accounts are created on import.
          </div>

          {lastExport && (
            <div className="text-[11px] text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Downloaded {lastExport.filename}
              {lastExport.counts && (
                <span className="text-slate-500 ml-auto font-mono">
                  {lastExport.counts.settlements}s · {lastExport.counts.drivers}d · {lastExport.counts.payroll}p ·{' '}
                  {lastExport.counts.glyphbucks}gb
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700">
            Close
          </Button>
          <Button onClick={handleExport} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {busy ? 'Generating…' : `Download ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}