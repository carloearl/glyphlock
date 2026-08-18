import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Printer, ReceiptText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  downloadReceiptHtml,
  formatReceiptMoney,
  getLastReceipt,
  printCurrentNupsView,
  printNupsReceipt,
  subscribeToReceiptReady,
} from '@/lib/nups/receiptService';
import { useNUPSOperatingMode } from '@/hooks/useNUPSOperatingMode';

function copyReceipt(receipt) {
  const lines = [
    `NUPS ${receipt.receipt_number}`,
    receipt.venue_name,
    new Date(receipt.created_at).toLocaleString(),
    ...receipt.lines.map((line) => `${line.quantity} × ${line.label} — ${formatReceiptMoney(line.total_cents, receipt.currency)}`),
    `TOTAL ${formatReceiptMoney(receipt.total_cents, receipt.currency)}`,
    receipt.environment !== 'LIVE' ? `${receipt.environment} · NOT A LIVE RECORD` : '',
  ].filter(Boolean);
  return navigator.clipboard.writeText(lines.join('\n'));
}

export default function ReceiptPrintHub({ inline = false }) {
  const { operatingMode: environment } = useNUPSOperatingMode();
  const [receipt, setReceipt] = useState(() => getLastReceipt());
  const [open, setOpen] = useState(false);

  useEffect(() => subscribeToReceiptReady((next) => {
    if (!next) return;
    setReceipt(next);
    setOpen(true);
  }), []);

  const total = useMemo(() => receipt ? formatReceiptMoney(receipt.total_cents, receipt.currency) : null, [receipt]);

  const handlePrintCurrent = () => {
    const result = printCurrentNupsView({ title: `NUPS ${environment}` });
    if (result.ok) toast.success('Print view opened');
    else toast.info(result.reason || 'Browser print opened');
  };

  const handleReprint = () => {
    if (!receipt) return toast.error('No receipt has been recorded in this browser yet.');
    const result = printNupsReceipt(receipt);
    if (result.ok) toast.success(`Printing ${receipt.receipt_number}`);
    else toast.info(result.reason || 'Printable receipt prepared');
  };

  const handleCopy = async () => {
    if (!receipt) return;
    try {
      await copyReceipt(receipt);
      toast.success('Receipt copied');
    } catch {
      toast.error('Clipboard access was blocked');
    }
  };

  return (
    <div className={inline ? "relative z-[120] print:hidden" : "fixed bottom-4 right-4 z-[120] flex flex-col items-end gap-2 print:hidden"} data-no-print>
      {open && (
        <div className={`${inline ? "absolute right-0 top-full mt-2" : ""} w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#020713]/95 shadow-[0_20px_70px_rgba(0,0,0,.6),0_0_35px_rgba(34,211,238,.15)] backdrop-blur-2xl`}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-black text-white"><ReceiptText className="h-4 w-4 text-cyan-300" /> RECEIPT CONTROL</div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close receipt controls"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-4">
            {receipt ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] tracking-[.18em] text-cyan-300">LAST RECEIPT</div>
                    <div className="mt-1 font-black text-white">{receipt.receipt_number}</div>
                    <div className="mt-1 text-xs text-slate-400">{new Date(receipt.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right text-xl font-black text-white">{total}</div>
                </div>
                {receipt.environment !== 'LIVE' && (
                  <div className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/[.07] px-3 py-2 font-mono text-[9px] font-bold tracking-[.12em] text-amber-200">
                    {receipt.environment} · NOT A LIVE RECORD
                  </div>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button type="button" onClick={handleReprint} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-cyan-300/35 bg-cyan-400/10 px-2 text-[10px] font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"><Printer className="h-3.5 w-3.5" /> REPRINT</button>
                  <button type="button" onClick={handleCopy} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-blue-300/30 bg-blue-400/10 px-2 text-[10px] font-black text-blue-100 transition hover:bg-blue-300 hover:text-slate-950"><Copy className="h-3.5 w-3.5" /> COPY</button>
                  <button type="button" onClick={() => downloadReceiptHtml(receipt)} className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-violet-300/30 bg-violet-400/10 px-2 text-[10px] font-black text-violet-100 transition hover:bg-violet-300 hover:text-slate-950"><Download className="h-3.5 w-3.5" /> SAVE</button>
                </div>
              </>
            ) : (
              <p className="text-sm leading-relaxed text-slate-400">No receipt has been recorded in this browser. You can still print the current operational view.</p>
            )}
            <button type="button" onClick={handlePrintCurrent} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.05] px-3 text-xs font-black text-white transition hover:border-white/35 hover:bg-white/10"><Printer className="h-4 w-4" /> PRINT CURRENT VIEW</button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={inline ? "relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition hover:border-cyan-300/40 hover:bg-white/[0.07] hover:text-cyan-200" : "flex h-12 items-center gap-2 rounded-full border border-cyan-300/35 bg-[#020713]/90 px-4 font-mono text-[10px] font-black tracking-[.12em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200/70 hover:shadow-[0_0_40px_rgba(34,211,238,.4)]"}
        aria-expanded={open}
        aria-label="Receipt controls"
        title="Receipt controls"
      >
        <Printer className="h-4 w-4" />
        {!inline && <>RECEIPTS</>}
        {receipt && <span className={inline ? "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300" : "h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7]"} />}
      </button>
    </div>
  );
}