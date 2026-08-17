import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  FileSignature,
  Gauge,
  GraduationCap,
  Printer,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  ShoppingCart,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import NUPSEnvironmentBar from '@/components/nups/shell/NUPSEnvironmentBar';
import ReceiptPrintHub from '@/components/nups/receipts/ReceiptPrintHub';
import {
  checkInTrainingGuest,
  closeTrainingShift,
  createTrainingSale,
  createTrainingVipContract,
  getTrainingState,
  markTrainingStepComplete,
  resetTrainingState,
  startTrainingShift,
  subscribeToTrainingState,
} from '@/lib/nups/trainingStore';
import { printNupsReceipt } from '@/lib/nups/receiptService';

const getServerSnapshot = () => ({
  shift: null,
  guests: [],
  transactions: [],
  vip_contracts: [],
  audit_events: [],
  completed_steps: [],
  venue: { name: 'NUPS Training Venue' },
  operator: { name: 'Training Operator' },
});

const trainingSteps = [
  { id: 'environment', title: 'Confirm Training Environment', icon: ShieldCheck, description: 'Verify the amber TRAINING bar and no-live-money warning.' },
  { id: 'shift', title: 'Open a Shift', icon: DoorOpen, description: 'Start the operator shift before creating any operational record.' },
  { id: 'guest', title: 'Check In a Guest', icon: UserCheck, description: 'Practice a front-door admission and guest record.' },
  { id: 'sale', title: 'Complete & Print a Sale', icon: ShoppingCart, description: 'Create a transaction and print a watermarked training receipt.' },
  { id: 'vip', title: 'Create a VIP Contract', icon: FileSignature, description: 'Practice contract details without generating a live agreement.' },
  { id: 'closeout', title: 'Close the Shift', icon: ClipboardCheck, description: 'Finish the training cycle and review the audit trail.' },
];

function centsFromDollars(value) {
  return Math.max(0, Math.round((Number(value) || 0) * 100));
}

function TrainingStep({ step, completed, active, onOpen }) {
  const Icon = step.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(step.id)}
      className={`group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-amber-200/60 bg-amber-300/[.10] shadow-[0_0_30px_rgba(251,191,36,.16)]' : completed ? 'border-emerald-300/30 bg-emerald-300/[.05]' : 'border-white/10 bg-white/[.035] hover:border-white/25 hover:bg-white/[.06]'}`}
    >
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl border ${completed ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200' : active ? 'border-amber-300/50 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-black/20 text-slate-400'}`}>
        {completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-white">{step.title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-slate-400">{step.description}</span>
      </span>
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass = 'min-h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-amber-300/55 focus:ring-2 focus:ring-amber-300/10';

export default function NUPSTraining() {
  const state = useSyncExternalStore(subscribeToTrainingState, getTrainingState, getServerSnapshot);
  const [activeStep, setActiveStep] = useState('environment');
  const [busy, setBusy] = useState(false);
  const [operatorName, setOperatorName] = useState(state.operator?.name || 'Training Operator');
  const [guestName, setGuestName] = useState('Alex Practice');
  const [admission, setAdmission] = useState('20.00');
  const [saleItem, setSaleItem] = useState('General Admission');
  const [salePrice, setSalePrice] = useState('20.00');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [vipGuest, setVipGuest] = useState('Jordan Practice');
  const [vipRoom, setVipRoom] = useState('VIP 1');
  const [vipMinutes, setVipMinutes] = useState('30');
  const [vipAmount, setVipAmount] = useState('150.00');

  const derivedCompleted = useMemo(() => {
    const completed = new Set(state.completed_steps || []);
    completed.add('environment');
    if (state.shift) completed.add('shift');
    if ((state.guests || []).length) completed.add('guest');
    if ((state.transactions || []).length) completed.add('sale');
    if ((state.vip_contracts || []).length) completed.add('vip');
    if (state.shift?.status === 'CLOSED') completed.add('closeout');
    return completed;
  }, [state]);

  const progress = Math.round((derivedCompleted.size / trainingSteps.length) * 100);

  const run = async (action, successMessage, nextStep) => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await action();
      if (nextStep) {
        markTrainingStepComplete(activeStep);
        setActiveStep(nextStep);
      }
      toast.success(successMessage);
      return result;
    } catch (error) {
      toast.error(error?.message || 'Training action failed');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleSale = async () => {
    const next = await run(
      () => createTrainingSale({ item: saleItem, unitPriceCents: centsFromDollars(salePrice), paymentMethod }),
      'Training sale completed',
      'vip',
    );
    const transaction = next?.transactions?.[0];
    if (transaction) {
      printNupsReceipt({
        ...transaction,
        venue_name: next.venue?.name,
        venue_address: next.venue?.address,
        lines: [{ label: transaction.item, quantity: transaction.quantity, unit_price_cents: transaction.unit_price_cents, total_cents: transaction.subtotal_cents }],
        environment: 'TRAINING',
      });
    }
  };

  const handleReprint = (transaction) => printNupsReceipt({
    ...transaction,
    venue_name: state.venue?.name,
    venue_address: state.venue?.address,
    lines: [{ label: transaction.item, quantity: transaction.quantity, unit_price_cents: transaction.unit_price_cents, total_cents: transaction.subtotal_cents }],
    environment: 'TRAINING',
  });

  const handleReset = () => {
    if (!window.confirm('Reset this training session? This only deletes browser-isolated practice records.')) return;
    resetTrainingState();
    setActiveStep('environment');
    toast.success('Training session reset');
  };

  return (
    <>
      <SEOHead title="NUPS Training Center | GlyphLock" description="Practice NUPS operational workflows with isolated browser-only training records and printable watermarked receipts." url="/NUPSTraining" />
      <main className="min-h-screen bg-[#02040c] text-white">
        <NUPSEnvironmentBar />

        <section className="relative overflow-hidden border-b border-amber-300/15 px-5 py-12 md:py-16">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(251,191,36,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.08) 1px,transparent 1px)', backgroundSize: '38px 38px' }} />
          <div className="absolute right-[8%] top-[5%] h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />
          <div className="relative mx-auto max-w-7xl">
            <Link to="/NUPSLanding" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to NUPS</Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-[.22em] text-amber-200"><GraduationCap className="h-4 w-4" /> SAFE PRACTICE ENVIRONMENT</div>
                <h1 className="mt-4 text-4xl font-black tracking-[-.04em] md:text-6xl">NUPS TRAINING CENTER</h1>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 md:text-lg">Learn the full operating flow without touching live money, live venue records, external messages or connected hardware. Training data stays in this browser session and every printed document is watermarked.</p>
              </div>
              <button type="button" onClick={handleReset} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-400/[.07] px-5 text-xs font-black text-rose-100 transition hover:border-rose-200/65 hover:bg-rose-400/15"><RefreshCcw className="h-4 w-4" /> RESET TRAINING</button>
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[9px] tracking-[.18em] text-slate-500">COURSE PROGRESS</div>
                  <div className="mt-1 text-sm font-black text-white">{derivedCompleted.size} of {trainingSteps.length} workflows complete</div>
                </div>
                <div className="text-2xl font-black text-amber-200">{progress}%</div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 py-10 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-3">
            {trainingSteps.map((step) => <TrainingStep key={step.id} step={step} completed={derivedCompleted.has(step.id)} active={activeStep === step.id} onOpen={setActiveStep} />)}
          </aside>

          <div className="min-w-0 rounded-[26px] border border-white/10 bg-[#050817]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,.35)] md:p-8">
            {activeStep === 'environment' && (
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/10 text-amber-200"><ShieldCheck className="h-7 w-7" /></div>
                <h2 className="mt-5 text-3xl font-black">Confirm the safety boundary</h2>
                <p className="mt-3 max-w-2xl leading-relaxed text-slate-400">The amber environment bar must read TRAINING. Existing legacy mode checks are also forced into their non-live DEMO path, providing a second guard against live writes.</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {['Browser-isolated records', 'No real payment processing', 'No external email or SMS', 'No cash drawer or venue hardware', 'Watermarked printable receipts', 'Resettable practice session'].map((label) => <div key={label} className="flex items-center gap-2 rounded-xl border border-emerald-300/15 bg-emerald-300/[.04] p-3 text-sm text-emerald-100"><BadgeCheck className="h-4 w-4 flex-none text-emerald-300" /> {label}</div>)}
                </div>
                <button type="button" onClick={() => { markTrainingStepComplete('environment'); setActiveStep('shift'); }} className="mt-7 min-h-12 rounded-xl bg-amber-300 px-6 font-black text-slate-950 transition hover:bg-amber-100">I UNDERSTAND · START TRAINING</button>
              </div>
            )}

            {activeStep === 'shift' && (
              <div>
                <h2 className="text-3xl font-black">Open the operator shift</h2>
                <p className="mt-3 text-slate-400">A real operation needs a named operator and an open shift before transactions begin.</p>
                <div className="mt-7 max-w-xl space-y-4">
                  <Field label="Operator name"><input className={inputClass} value={operatorName} onChange={(e) => setOperatorName(e.target.value)} /></Field>
                  <button type="button" disabled={busy || state.shift?.status === 'OPEN'} onClick={() => run(() => startTrainingShift({ operatorName }), 'Training shift opened', 'guest')} className="min-h-12 w-full rounded-xl bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45">{state.shift?.status === 'OPEN' ? 'SHIFT ALREADY OPEN' : busy ? 'OPENING…' : 'OPEN TRAINING SHIFT'}</button>
                </div>
              </div>
            )}

            {activeStep === 'guest' && (
              <div>
                <h2 className="text-3xl font-black">Practice front-door check-in</h2>
                <p className="mt-3 text-slate-400">Capture a guest name and admission amount, then confirm the record in the training audit trail.</p>
                <div className="mt-7 grid max-w-2xl gap-4 sm:grid-cols-2">
                  <Field label="Guest name"><input className={inputClass} value={guestName} onChange={(e) => setGuestName(e.target.value)} /></Field>
                  <Field label="Admission amount"><input className={inputClass} inputMode="decimal" value={admission} onChange={(e) => setAdmission(e.target.value)} /></Field>
                  <button type="button" disabled={busy || state.shift?.status !== 'OPEN'} onClick={() => run(() => checkInTrainingGuest({ name: guestName, admissionCents: centsFromDollars(admission) }), 'Guest checked in', 'sale')} className="min-h-12 rounded-xl bg-cyan-300 px-5 font-black text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2">{busy ? 'CHECKING IN…' : 'CHECK IN TRAINING GUEST'}</button>
                </div>
              </div>
            )}

            {activeStep === 'sale' && (
              <div>
                <h2 className="text-3xl font-black">Complete and print a sale</h2>
                <p className="mt-3 text-slate-400">This creates a browser-only transaction and opens a real print-ready receipt with a TRAINING watermark.</p>
                <div className="mt-7 grid max-w-3xl gap-4 sm:grid-cols-2">
                  <Field label="Item"><input className={inputClass} value={saleItem} onChange={(e) => setSaleItem(e.target.value)} /></Field>
                  <Field label="Price"><input className={inputClass} inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} /></Field>
                  <Field label="Payment method"><select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="CASH">Cash</option><option value="CARD">Card simulation</option><option value="GLYPHBUCKS">GlyphBucks simulation</option></select></Field>
                  <div className="flex items-end"><button type="button" disabled={busy || state.shift?.status !== 'OPEN'} onClick={handleSale} className="min-h-12 w-full rounded-xl bg-emerald-300 px-5 font-black text-slate-950 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45"><ReceiptText className="mr-2 inline h-4 w-4" /> {busy ? 'PROCESSING…' : 'COMPLETE & PRINT'}</button></div>
                </div>
                {(state.transactions || []).length > 0 && (
                  <div className="mt-7 overflow-hidden rounded-2xl border border-white/10">
                    {state.transactions.slice(0, 5).map((transaction) => <div key={transaction.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.06] bg-black/20 p-4 last:border-b-0"><div><div className="font-bold text-white">{transaction.receipt_number} · {transaction.item}</div><div className="mt-1 text-xs text-slate-500">{new Date(transaction.created_at).toLocaleString()} · {transaction.payment_method}</div></div><div className="flex items-center gap-3"><strong>${(transaction.total_cents / 100).toFixed(2)}</strong><button type="button" onClick={() => handleReprint(transaction)} className="flex min-h-10 items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-300/[.06] px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300 hover:text-slate-950"><Printer className="h-4 w-4" /> REPRINT</button></div></div>)}
                  </div>
                )}
              </div>
            )}

            {activeStep === 'vip' && (
              <div>
                <h2 className="text-3xl font-black">Create a training VIP contract</h2>
                <p className="mt-3 text-slate-400">Practice guest, room, duration and amount entry. This creates no live contract and requests no real signature.</p>
                <div className="mt-7 grid max-w-3xl gap-4 sm:grid-cols-2">
                  <Field label="Guest"><input className={inputClass} value={vipGuest} onChange={(e) => setVipGuest(e.target.value)} /></Field>
                  <Field label="Room"><input className={inputClass} value={vipRoom} onChange={(e) => setVipRoom(e.target.value)} /></Field>
                  <Field label="Minutes"><input className={inputClass} inputMode="numeric" value={vipMinutes} onChange={(e) => setVipMinutes(e.target.value)} /></Field>
                  <Field label="Amount"><input className={inputClass} inputMode="decimal" value={vipAmount} onChange={(e) => setVipAmount(e.target.value)} /></Field>
                  <button type="button" disabled={busy || state.shift?.status !== 'OPEN'} onClick={() => run(() => createTrainingVipContract({ guestName: vipGuest, room: vipRoom, minutes: Number(vipMinutes), amountCents: centsFromDollars(vipAmount) }), 'Training VIP contract created', 'closeout')} className="min-h-12 rounded-xl bg-violet-300 px-5 font-black text-slate-950 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-45 sm:col-span-2">{busy ? 'CREATING…' : 'CREATE TRAINING CONTRACT'}</button>
                </div>
              </div>
            )}

            {activeStep === 'closeout' && (
              <div>
                <h2 className="text-3xl font-black">Close and review</h2>
                <p className="mt-3 text-slate-400">Finish the shift, then review the records NUPS would use for closeout, reporting and audit.</p>
                <div className="mt-7 grid gap-3 sm:grid-cols-4">
                  {[
                    ['Guests', state.guests?.length || 0],
                    ['Sales', state.transactions?.length || 0],
                    ['VIP contracts', state.vip_contracts?.length || 0],
                    ['Audit events', state.audit_events?.length || 0],
                  ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="font-mono text-[9px] tracking-[.14em] text-slate-500">{label}</div><div className="mt-2 text-3xl font-black text-white">{value}</div></div>)}
                </div>
                <button type="button" disabled={busy || state.shift?.status !== 'OPEN'} onClick={() => run(closeTrainingShift, 'Training shift closed')} className="mt-6 min-h-12 rounded-xl bg-amber-300 px-6 font-black text-slate-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-45">{state.shift?.status === 'CLOSED' ? 'SHIFT CLOSED' : busy ? 'CLOSING…' : 'CLOSE TRAINING SHIFT'}</button>

                <div className="mt-8">
                  <h3 className="flex items-center gap-2 text-lg font-black"><Gauge className="h-5 w-5 text-cyan-300" /> Training audit trail</h3>
                  <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/20">
                    {(state.audit_events || []).length ? state.audit_events.map((event) => <div key={event.id} className="border-b border-white/[.06] p-4 last:border-b-0"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-mono text-[9px] font-bold tracking-[.13em] text-cyan-300">{event.event_type}</span><span className="text-[10px] text-slate-600">{new Date(event.occurred_at).toLocaleString()}</span></div><p className="mt-1 text-sm text-slate-300">{event.description}</p></div>) : <div className="p-6 text-center text-sm text-slate-500">No training events yet.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[.04] p-5">
            <div className="flex items-start gap-3"><BookOpenCheck className="mt-0.5 h-5 w-5 flex-none text-cyan-300" /><div><h2 className="font-black text-white">Training completion standard</h2><p className="mt-1 text-sm leading-relaxed text-slate-400">A trainee should be able to open a shift, check in a guest, complete and print a sale, create a VIP contract, close the shift and explain the audit trail without entering LIVE mode. Production permissions and venue-specific procedures still require supervisor approval.</p></div></div>
          </div>
        </section>

        <ReceiptPrintHub />
      </main>
    </>
  );
}
