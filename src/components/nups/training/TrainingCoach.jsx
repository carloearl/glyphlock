import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, GraduationCap, RotateCcw, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNUPSOperatingMode } from '@/hooks/useNUPSOperatingMode';
import {
  TRAINING_PROGRESS_EVENT,
  getTrainingProgress,
  resetTrainingProgress,
} from '@/lib/nups/operatingMode';

const STEPS = [
  {
    id: 'batch-opened',
    label: 'Open a practice shift',
    detail: 'Count the training drawer and open a non-live batch.',
    to: '/ManagerConsole',
  },
  {
    id: 'batch-confirmed',
    label: 'Confirm the register',
    detail: 'Door confirmation proves the handoff between manager and station.',
    to: '/FrontDoor',
  },
  {
    id: 'transaction-completed',
    label: 'Complete a practice sale',
    detail: 'Ring items, choose tender, and post a funds-off transaction.',
    to: '/Register',
  },
  {
    id: 'receipt-printed',
    label: 'Print the receipt',
    detail: 'Verify the training watermark, totals, operator, and transaction id.',
    to: '/Receipts',
  },
  {
    id: 'batch-closed',
    label: 'Close and reconcile',
    detail: 'Count the drawer, explain discrepancies, and close the practice batch.',
    to: '/ManagerConsole',
  },
];

export default function TrainingCoach() {
  const navigate = useNavigate();
  const location = useLocation();
  const { venueId, isTraining, trainingSession } = useNUPSOperatingMode();
  const [progress, setProgress] = useState(() => getTrainingProgress(venueId));
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setProgress(getTrainingProgress(venueId));
    if (typeof window === 'undefined') return undefined;
    const onProgress = (event) => {
      if (!event?.detail?.venue_id || event.detail.venue_id === venueId) {
        setProgress(event?.detail?.progress || getTrainingProgress(venueId));
      }
    };
    window.addEventListener(TRAINING_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(TRAINING_PROGRESS_EVENT, onProgress);
  }, [venueId]);

  const completedCount = STEPS.filter((step) => Boolean(progress?.[step.id])).length;
  const nextStep = useMemo(
    () => STEPS.find((step) => !progress?.[step.id]) || null,
    [progress],
  );

  if (!isTraining) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[90] inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-sky-950/90 px-4 py-3 text-xs font-black text-sky-100 shadow-[0_12px_42px_rgba(2,132,199,.28)] backdrop-blur-xl"
        aria-label="Open training coach"
      >
        <GraduationCap className="h-4 w-4" />
        TRAINING {completedCount}/{STEPS.length}
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 z-[90] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-sky-300/35 bg-[#03101f]/95 shadow-[0_24px_80px_rgba(2,132,199,.30)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 bg-sky-500/[.08] px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-300/35 bg-sky-400/10 text-sky-200">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black text-white">NUPS Training Coach</div>
            <div className="truncate font-mono text-[9px] tracking-[.13em] text-sky-300/70">
              FUNDS OFF · SESSION {String(trainingSession?.id || 'STARTING').slice(0, 12)}
            </div>
          </div>
        </div>
        <button type="button" onClick={() => setCollapsed(true)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Collapse training coach">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300 transition-all duration-500" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
        </div>

        <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
          {STEPS.map((step, index) => {
            const complete = Boolean(progress?.[step.id]);
            const active = nextStep?.id === step.id;
            return (
              <button
                type="button"
                key={step.id}
                onClick={() => navigate(step.to)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${active ? 'border-sky-300/40 bg-sky-400/[.08]' : 'border-white/[.06] bg-black/15 hover:bg-white/[.035]'}`}
              >
                <div className="flex items-start gap-2.5">
                  {complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <Circle className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-sky-300' : 'text-slate-600'}`} />}
                  <div className="min-w-0 flex-1">
                    <div className={`text-[11px] font-black ${complete ? 'text-emerald-200' : active ? 'text-sky-100' : 'text-slate-300'}`}>
                      {index + 1}. {step.label}
                    </div>
                    <div className="mt-0.5 text-[10px] leading-snug text-slate-500">{step.detail}</div>
                  </div>
                  {active && <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <div className="text-[10px] text-slate-500">
            {completedCount === STEPS.length ? 'Practice flow complete.' : `Current page: ${location.pathname}`}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              resetTrainingProgress(venueId);
              setProgress({});
            }}
            className="h-8 gap-1.5 text-[10px] text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
        </div>
      </div>
    </aside>
  );
}
