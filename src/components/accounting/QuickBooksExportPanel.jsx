/**
 * QuickBooks Export Panel — modal that lets a manager pick:
 *   • Format (IIF for QB Desktop · CSV for QB Online)
 *   • Override chart-of-accounts mapping (defaults shipped, fully editable)
 *
 * Downloads a file that can be imported into QuickBooks directly.
 * Reuses the page's already-aggregated financial data — no extra fetches.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Download, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { buildIIF, buildQBOJournalCSV, DEFAULT_ACCOUNT_MAP } from '@/lib/accounting/quickbooksExport';

function download(filename, content, mime) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const FIELDS = [
  { key: 'cash', label: 'Cash Sales (debit)', hint: 'Bank account where cash deposits land' },
  { key: 'card', label: 'Card Sales (debit)', hint: 'Card processor clearing account' },
  { key: 'sales', label: 'Sales Revenue (credit)', hint: 'Income account for all sales' },
  { key: 'driver', label: 'Driver Payouts (debit)', hint: 'Expense account for driver disbursements' },
  { key: 'payroll', label: 'Payroll (debit)', hint: 'Expense account for staff wages' },
  { key: 'tips', label: 'Tip Pool (debit)', hint: 'Expense / clearing for tip pool distribution' },
  { key: 'contractor', label: 'Contractor (debit)', hint: 'Expense for 1099 contractor pay' },
  { key: 'gb_liability', label: 'GlyphBucks Liability', hint: 'Other Current Liability — gift card / stored value' },
];

export default function QuickBooksExportPanel({ data, range, venueLabel = 'Venue' }) {
  const [open, setOpen] = useState(false);
  const [accountMap, setAccountMap] = useState(DEFAULT_ACCOUNT_MAP);
  const timeline = data?.timeline || [];
  const hasData = timeline.length > 0;

  const handleField = (key, value) => setAccountMap((m) => ({ ...m, [key]: value }));

  const exportIIF = () => {
    if (!hasData) {
      toast.error('No data in the selected range to export.');
      return;
    }
    const iif = buildIIF({ timeline, data, range, venueLabel, accountMap });
    download(`quickbooks_${range.start}_to_${range.end}.iif`, iif, 'text/plain');
    toast.success('IIF generated — open it in QuickBooks Desktop: File → Utilities → Import → IIF Files.');
    setOpen(false);
  };

  const exportQBOCSV = () => {
    if (!hasData) {
      toast.error('No data in the selected range to export.');
      return;
    }
    const csv = buildQBOJournalCSV({ timeline, data, range, venueLabel, accountMap });
    download(`quickbooks_online_${range.start}_to_${range.end}.csv`, csv, 'text/csv');
    toast.success('CSV generated — in QBO: Sales → Customers → Import or use a Journal Entry import tool.');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-green-500/40 text-green-300 hover:bg-green-500/10"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1.5" /> QuickBooks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-300">
            <BookOpen className="w-5 h-5" /> Export to QuickBooks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400 leading-relaxed">
            Generates a journal-entry file from the aggregated period{' '}
            <span className="text-white font-mono">
              {range.start} → {range.end}
            </span>
            . Same numbers shown on this page — debits and credits balanced per day. Map each internal
            category to your QuickBooks account name below (the defaults work for a fresh chart of accounts).
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-[11px] uppercase tracking-wider text-slate-400">{f.label}</Label>
                <Input
                  value={accountMap[f.key] || ''}
                  onChange={(e) => handleField(f.key, e.target.value)}
                  className="h-9 bg-slate-900 border-slate-800 text-sm"
                />
                <div className="text-[10px] text-slate-500">{f.hint}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={exportIIF} className="bg-green-600 hover:bg-green-500" disabled={!hasData}>
              <Download className="w-4 h-4 mr-2" /> Download IIF (QB Desktop)
            </Button>
            <Button onClick={exportQBOCSV} variant="outline" className="border-green-500/40 text-green-300 hover:bg-green-500/10" disabled={!hasData}>
              <FileText className="w-4 h-4 mr-2" /> Download CSV (QB Online)
            </Button>
          </div>

          <div className="text-[10px] text-slate-600 pt-1 leading-relaxed">
            <span className="text-emerald-400 font-bold">✓ DACO-locked:</span> revenue lines are cash + card only,
            driver/payroll/tip/contractor are disbursements (debit expense / credit cash), GlyphBucks issuance
            posts to a liability account — never revenue.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}