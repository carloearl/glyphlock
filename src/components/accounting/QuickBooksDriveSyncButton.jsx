import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Cloud, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

/**
 * QuickBooksDriveSyncButton — pushes a fresh QB Desktop (.iif) and QB Online
 * (.csv) Journal Entry file into the connected Google Drive for the current
 * Accounting date range. Bookkeeper opens the link and imports — same outcome
 * as a real-time sync, no Intuit Developer app needed.
 */
export default function QuickBooksDriveSyncButton({ range, venueId }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runSync = async () => {
    if (!range?.start || !range?.end) {
      toast.error("Pick a date range first.");
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke("quickbooksNightlySync", {
        start_date: range.start,
        end_date: range.end,
        venue_id: venueId || null,
      });
      const data = res?.data || {};
      if (data.error) throw new Error(data.error);

      if (data.skipped) {
        toast.info(data.message || "No records to sync in that range.");
        setRunning(false);
        return;
      }

      setResult(data);
      toast.success("Synced to Google Drive — share links ready for your bookkeeper.");
    } catch (e) {
      toast.error(`Sync failed: ${e.message || "unknown error"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        onClick={runSync}
        disabled={running}
        className="bg-sky-600 hover:bg-sky-500 text-white"
      >
        {running ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5 mr-1.5" />}
        {running ? "Syncing…" : "Sync to Drive"}
      </Button>

      <Dialog open={!!result} onOpenChange={(o) => !o && setResult(null)}>
        <DialogContent className="bg-slate-950 border-sky-500/40 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sky-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              QuickBooks Files Synced to Google Drive
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {result?.start_date === result?.end_date
                ? `For ${result?.start_date}`
                : `For ${result?.start_date} → ${result?.end_date}`}
              {" · "}
              {result?.counts?.settlements ?? 0} settlements ·{" "}
              {result?.counts?.drivers ?? 0} driver payouts ·{" "}
              {result?.counts?.payroll ?? 0} payroll ·{" "}
              {result?.counts?.glyphbucks ?? 0} GB orders
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {result?.iif?.url && (
              <a
                href={result.iif.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-all"
              >
                <div>
                  <div className="text-sm font-bold text-emerald-300">QuickBooks Desktop (IIF)</div>
                  <div className="text-[11px] text-emerald-200/70 font-mono">{result.iif.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    File → Utilities → Import → IIF Files
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-400" />
              </a>
            )}

            {result?.csv?.url && (
              <a
                href={result.csv.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/15 transition-all"
              >
                <div>
                  <div className="text-sm font-bold text-blue-300">QuickBooks Online (CSV)</div>
                  <div className="text-[11px] text-blue-200/70 font-mono">{result.csv.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Settings ⚙ → Import data → Journal Entries
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-blue-400" />
              </a>
            )}

            <div className="text-[10px] text-gray-500 pt-2 border-t border-white/5">
              Both files are now shareable by link — send to your bookkeeper or they auto-import nightly via scheduled sync. Logged to the audit trail.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}