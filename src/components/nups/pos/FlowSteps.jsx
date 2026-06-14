import React from "react";
import { Check } from "lucide-react";

/**
 * FlowSteps — small horizontal "step 1 / 2 / 3" indicator used at the top
 * of POS-style screens (door register, driver payout handshake) so a new
 * operator can see the standard flow at a glance.
 *
 * Pure presentational. No business logic.
 *
 * Props:
 *  - steps:       [{ id, label, hint? }]
 *  - currentStep: zero-based index of the active step
 *  - tone:        'cyan' | 'yellow' | 'pink' (accent color)
 */
const TONES = {
  cyan:   { active: "bg-cyan-500/20 border-cyan-400 text-cyan-200",
            ring:   "ring-cyan-400/40",
            done:   "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" },
  yellow: { active: "bg-yellow-500/20 border-yellow-400 text-yellow-200",
            ring:   "ring-yellow-400/40",
            done:   "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" },
  pink:   { active: "bg-pink-500/20 border-pink-400 text-pink-200",
            ring:   "ring-pink-400/40",
            done:   "bg-emerald-500/15 border-emerald-500/50 text-emerald-300" },
};

export default function FlowSteps({ steps = [], currentStep = 0, tone = "cyan" }) {
  if (!steps.length) return null;
  const palette = TONES[tone] || TONES.cyan;

  return (
    <div className="flex items-stretch gap-1.5 w-full">
      {steps.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        const cls = done
          ? palette.done
          : active
            ? `${palette.active} ring-2 ${palette.ring}`
            : "bg-slate-800/40 border-slate-700 text-slate-500";

        return (
          <div
            key={step.id || i}
            className={`flex-1 min-w-0 rounded-lg border px-2 py-1.5 ${cls}`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black shrink-0 ${
                done ? "bg-emerald-500/30" : active ? "bg-white/15" : "bg-slate-700/60"
              }`}>
                {done ? <Check className="w-2.5 h-2.5" /> : i + 1}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                {step.label}
              </span>
            </div>
            {active && step.hint && (
              <div className="text-[10px] text-slate-300/80 mt-0.5 leading-tight truncate">
                {step.hint}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}