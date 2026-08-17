import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpenCheck, Database, Eye, Radio, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import useNupsEnvironment from '@/hooks/useNupsEnvironment';
import { NUPS_ENVIRONMENTS } from '@/lib/nups/operatingEnvironment';

const environmentStyles = {
  LIVE: {
    icon: Radio,
    badge: 'border-emerald-300/45 bg-emerald-400/[.10] text-emerald-100',
    dot: 'bg-emerald-300 shadow-[0_0_12px_#6ee7b7]',
  },
  DEMO: {
    icon: Eye,
    badge: 'border-violet-300/45 bg-violet-400/[.10] text-violet-100',
    dot: 'bg-violet-300 shadow-[0_0_12px_#c4b5fd]',
  },
  TRAINING: {
    icon: BookOpenCheck,
    badge: 'border-amber-300/45 bg-amber-400/[.10] text-amber-100',
    dot: 'bg-amber-300 shadow-[0_0_12px_#fcd34d]',
  },
};

export default function NUPSEnvironmentBar({ compact = false }) {
  const { environment, policy, dataScope, setEnvironment } = useNupsEnvironment();
  const [switching, setSwitching] = useState(false);
  const style = environmentStyles[environment] || environmentStyles.LIVE;
  const Icon = style.icon;

  const switchMode = async (next) => {
    if (next === environment || switching) return;

    if (next === NUPS_ENVIRONMENTS.LIVE) {
      const confirmed = window.confirm(
        'Switch to LIVE mode? Live mode can create real operational and financial records. Confirm the venue, operator and register before continuing.',
      );
      if (!confirmed) return;
    }

    setSwitching(true);
    try {
      setEnvironment(next);
      toast.success(`${next} mode active`, {
        description: next === 'TRAINING'
          ? 'Practice records stay in this browser and never enter the live NUPS database.'
          : next === 'DEMO'
            ? 'Demo guardrails are active. External money and hardware actions are disabled.'
            : 'Live operations enabled. Verify venue and operator context before transactions.',
      });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <section
      className={`relative z-[95] border-b backdrop-blur-2xl print:hidden ${environment === 'LIVE' ? 'border-emerald-300/20 bg-[#03100d]/92' : environment === 'TRAINING' ? 'border-amber-300/25 bg-[#130d02]/94' : 'border-violet-300/25 bg-[#09051a]/94'}`}
      data-no-print
      aria-label="NUPS operating environment"
    >
      <div className={`mx-auto flex max-w-[1680px] flex-col gap-3 px-3 py-2.5 md:px-5 ${compact ? '' : 'lg:flex-row lg:items-center lg:justify-between'}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl border ${style.badge}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] font-black tracking-[.18em] text-white">NUPS // {environment}</span>
              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
              {environment !== 'LIVE' && (
                <span className={`rounded-full border px-2 py-0.5 font-mono text-[8px] font-bold tracking-[.14em] ${style.badge}`}>NO LIVE MONEY</span>
              )}
            </div>
            {!compact && <p className="mt-0.5 truncate text-[11px] text-slate-400">{policy.description} · scope {dataScope}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-white/10 bg-black/25 p-1" role="group" aria-label="Select NUPS environment">
            {Object.values(NUPS_ENVIRONMENTS).map((mode) => (
              <button
                key={mode}
                type="button"
                disabled={switching}
                onClick={() => switchMode(mode)}
                className={`min-h-9 rounded-lg px-3 font-mono text-[9px] font-black tracking-[.12em] transition ${mode === environment ? environmentStyles[mode].badge + ' shadow-[0_0_18px_rgba(255,255,255,.08)]' : 'border border-transparent text-slate-500 hover:bg-white/[.05] hover:text-white'} disabled:opacity-50`}
                aria-pressed={mode === environment}
              >
                {mode}
              </button>
            ))}
          </div>

          <Link
            to="/NUPSTraining"
            className="flex min-h-10 items-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/[.07] px-3 font-mono text-[9px] font-black tracking-[.12em] text-amber-100 transition hover:border-amber-200/70 hover:bg-amber-300/15"
          >
            <BookOpenCheck className="h-4 w-4" /> TRAINING CENTER
          </Link>

          {!compact && (
            <div className="hidden xl:flex items-center gap-3 rounded-xl border border-white/[.07] bg-black/20 px-3 py-2 font-mono text-[8px] tracking-[.12em] text-slate-500">
              <span className="flex items-center gap-1.5"><Database className="h-3 w-3" /> {policy.backendWrites ? 'DB WRITES' : 'LOCAL ONLY'}</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> {policy.externalPayments ? 'MONEY LIVE' : 'MONEY BLOCKED'}</span>
            </div>
          )}
        </div>
      </div>

      {environment === 'LIVE' && !compact && (
        <div className="border-t border-emerald-300/10 bg-emerald-300/[.025] px-4 py-1.5 text-center font-mono text-[8px] tracking-[.12em] text-emerald-100/65">
          <AlertTriangle className="mr-1.5 inline h-3 w-3" /> LIVE MODE: confirm venue, operator, drawer and payment context before completing transactions.
        </div>
      )}
    </section>
  );
}
