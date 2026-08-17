import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleHelp, GraduationCap, Home, X } from 'lucide-react';
import useNupsEnvironment from '@/hooks/useNupsEnvironment';

const workflows = [
  {
    match: /(register|cash|pos|bar)/i,
    title: 'Register workflow',
    steps: ['Confirm the correct venue, operator and open shift.', 'Add the item or service and verify quantity/price.', 'Select the correct tender and confirm once.', 'Print or save the receipt before starting the next sale.'],
  },
  {
    match: /(door|checkin|admission|guest)/i,
    title: 'Front-door workflow',
    steps: ['Confirm operator and door station.', 'Verify guest details and admission type.', 'Complete the check-in only once.', 'Issue the receipt or confirmation and continue to the next guest.'],
  },
  {
    match: /(vip|contract)/i,
    title: 'VIP workflow',
    steps: ['Confirm guest, entertainer, room and duration.', 'Review amount, split and applicable terms.', 'Collect the required acknowledgments/signatures.', 'Complete payment, issue the receipt and preserve the contract record.'],
  },
  {
    match: /(settlement|closeout|zreport|account|ledger|financial)/i,
    title: 'Closeout workflow',
    steps: ['Stop new register activity for the drawer being closed.', 'Compare expected totals with counted tender.', 'Resolve or document variances before approval.', 'Close the batch and print/save the final report.'],
  },
  {
    match: /(dj|mixer|music)/i,
    title: 'DJ workflow',
    steps: ['Confirm the venue session and playable source.', 'Load and preview the cue deck before going live.', 'Verify Auto Blend/Auto-DJ settings and crossfader position.', 'Monitor playback health, requests and crowd feedback.'],
  },
  {
    match: /.*/,
    title: 'NUPS operator checklist',
    steps: ['Verify the environment, venue and operator context.', 'Complete one workflow at a time.', 'Read every success/error message before continuing.', 'Print or preserve the resulting record before leaving the screen.'],
  },
];

export default function NUPSOperatorAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { environment } = useNupsEnvironment();
  const [open, setOpen] = useState(false);

  const workflow = useMemo(
    () => workflows.find((item) => item.match.test(location.pathname)) || workflows[workflows.length - 1],
    [location.pathname],
  );

  return (
    <div className="fixed bottom-4 left-4 z-[120] print:hidden" data-no-print>
      {open && (
        <div className="mb-2 w-[min(380px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-blue-300/25 bg-[#020713]/95 shadow-[0_20px_70px_rgba(0,0,0,.6),0_0_35px_rgba(59,130,246,.15)] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <div className="font-mono text-[8px] font-bold tracking-[.16em] text-blue-300">OPERATOR ASSIST · {environment}</div>
              <div className="mt-1 text-sm font-black text-white">{workflow.title}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white" aria-label="Close operator help"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-4">
            <ol className="space-y-3">
              {workflow.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-blue-300/25 bg-blue-300/[.07] font-mono text-[9px] font-black text-blue-200">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => navigate(-1)} className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[.04] text-[10px] font-black text-slate-200 transition hover:bg-white/10"><ArrowLeft className="h-3.5 w-3.5" /> BACK</button>
              <Link to="/NUPSLanding" className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] text-[10px] font-black text-cyan-100 transition hover:bg-cyan-300/15"><Home className="h-3.5 w-3.5" /> NUPS</Link>
              <Link to="/NUPSTraining" className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-amber-300/25 bg-amber-300/[.06] text-[10px] font-black text-amber-100 transition hover:bg-amber-300/15"><GraduationCap className="h-3.5 w-3.5" /> TRAIN</Link>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[.04] p-3 text-[11px] leading-relaxed text-emerald-100/80"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" /> Finish one record, confirm the success message, then move to the next task. Never double-click a financial action.</div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-12 items-center gap-2 rounded-full border border-blue-300/30 bg-[#020713]/90 px-4 font-mono text-[10px] font-black tracking-[.12em] text-blue-100 shadow-[0_0_28px_rgba(59,130,246,.20)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-blue-200/65 hover:shadow-[0_0_40px_rgba(59,130,246,.38)]" aria-expanded={open}><CircleHelp className="h-4 w-4" /> OPERATOR HELP</button>
    </div>
  );
}
