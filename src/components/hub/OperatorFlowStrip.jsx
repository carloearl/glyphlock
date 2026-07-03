/**
 * OperatorFlowStrip
 *
 * Canonical front-to-back sequence of a shift, rendered at the top of the
 * Hub so any operator lands and instantly knows what to do next — no
 * hunting through sidebar entries. Each step is a live link into the
 * matching NUPS surface.
 *
 * Order matches BPAA-NUPS-MASTER-001 §7 (Guest Flow — Door to VIP), but
 * expressed as operator tasks rather than guest events.
 */
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DoorOpen, Mic2, ShoppingCart, Truck, ReceiptText,
  Banknote, ShieldCheck, ChevronRight,
} from "lucide-react";

const STEPS = [
  {
    n: 1, id: "open",       label: "Open Night",     to: "/FrontDoor",
    icon: DoorOpen,   sub: "Batch · rates · door",
    tone: "cyan",
  },
  {
    n: 2, id: "checkin",    label: "Check In Talent", to: "/EntertainerCheckIn",
    icon: Mic2,       sub: "Contract + PIN",
    tone: "pink",
  },
  {
    n: 3, id: "register",   label: "Run Register",   to: "/Register",
    icon: ShoppingCart, sub: "Cover · bar · comps",
    tone: "emerald",
  },
  {
    n: 4, id: "drivers",    label: "Pay Drivers",    to: "/DriverPayouts",
    icon: Truck,      sub: "Net at scan",
    tone: "amber",
  },
  {
    n: 5, id: "receipts",   label: "Reconcile",      to: "/Receipts",
    icon: ReceiptText, sub: "Match receipts",
    tone: "violet",
  },
  {
    n: 6, id: "settle",     label: "Settle & Close", to: "/admin/settlement",
    icon: Banknote,   sub: "Deposit + Z-report",
    tone: "blue",
  },
  {
    n: 7, id: "audit",      label: "Audit Log",      to: "/admin/audit-integrity",
    icon: ShieldCheck, sub: "Sign-off",
    tone: "rose",
  },
];

const TONE = {
  cyan:    { chip: "bg-cyan-500/10 border-cyan-400/40 text-cyan-200", dot: "bg-cyan-400", ring: "shadow-[0_0_18px_rgba(6,182,212,0.35)]" },
  pink:    { chip: "bg-pink-500/10 border-pink-400/40 text-pink-200", dot: "bg-pink-400", ring: "shadow-[0_0_18px_rgba(236,72,153,0.35)]" },
  emerald: { chip: "bg-emerald-500/10 border-emerald-400/40 text-emerald-200", dot: "bg-emerald-400", ring: "shadow-[0_0_18px_rgba(16,185,129,0.35)]" },
  amber:   { chip: "bg-amber-500/10 border-amber-400/40 text-amber-200", dot: "bg-amber-400", ring: "shadow-[0_0_18px_rgba(245,158,11,0.35)]" },
  violet:  { chip: "bg-violet-500/10 border-violet-400/40 text-violet-200", dot: "bg-violet-400", ring: "shadow-[0_0_18px_rgba(139,92,246,0.35)]" },
  blue:    { chip: "bg-blue-500/10 border-blue-400/40 text-blue-200", dot: "bg-blue-400", ring: "shadow-[0_0_18px_rgba(59,130,246,0.35)]" },
  rose:    { chip: "bg-rose-500/10 border-rose-400/40 text-rose-200", dot: "bg-rose-400", ring: "shadow-[0_0_18px_rgba(244,63,94,0.35)]" },
};

export default function OperatorFlowStrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathLower = location.pathname.toLowerCase();

  const activeIdx = STEPS.findIndex((s) => pathLower.startsWith(s.to.toLowerCase()));

  return (
    <section
      className="rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/80 to-black/60 p-4 sm:p-5"
      aria-label="Tonight's operator flow"
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-cyan-400/80">
            Tonight · Operator Flow
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
            Front to back, in order
          </h2>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
          §7 · Door → Close
        </div>
      </div>

      {/* Horizontal scroll on mobile, wraps on desktop. Each step is a
          full tap target with a step number, label, and live route. */}
      <ol className="flex gap-2 overflow-x-auto lg:overflow-visible lg:flex-wrap scrollbar-hide -mx-1 px-1 pb-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const tone = TONE[step.tone];
          const isActive = i === activeIdx;
          const isDone = activeIdx > -1 && i < activeIdx;

          return (
            <li key={step.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate(step.to)}
                className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2 min-w-[168px] transition-all active:scale-[0.98] ${
                  isActive
                    ? `${tone.chip} ${tone.ring}`
                    : isDone
                    ? "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    : "bg-white/[0.02] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.05]"
                }`}
                title={`Step ${step.n} — ${step.label}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-black/40" : "bg-white/[0.04]"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? tone.dot : isDone ? "bg-slate-500" : "bg-slate-700"}`} />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                      Step {step.n}
                    </span>
                  </div>
                  <div className="text-[13px] font-bold leading-tight truncate">{step.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{step.sub}</div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-700 hidden sm:block shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}