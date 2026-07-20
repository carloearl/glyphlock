import React from "react";
import { Car, UserCheck, ShoppingCart, Sparkles, Clock } from "lucide-react";

/**
 * FrontDoorSideNav — left rail, ordered by the actual door workflow.
 *
 * Each step has its OWN distinct color, number, icon, and one-line hint so
 * an operator brand new to NUPS can read the screen top-to-bottom and know
 * exactly what to do next. NO repeated styling, NO grid of identical tabs.
 *
 *   1. GUEST      (cyan)    — Scan ID, age-verify (ALWAYS first)
 *   2. DRIVER     (yellow)  — Driver drops guests off
 *   3. REGISTER   (emerald) — Ring up cover + drinks (open in new tab)
 *   4. ENTERTAIN. (pink)    — Dancer check-in / acknowledgments
 *   5. STAFF      (violet)  — Staff clock in/out
 */
const STEPS = [
  {
    id: "guests",
    n: 1,
    icon: UserCheck,
    label: "Guest Check-In",
    hint: "Scan ID — verify age first",
    color: "cyan",
  },
  {
    id: "drivers",
    n: 2,
    icon: Car,
    label: "Driver Drop-Off",
    hint: "Tap a driver, +1 per guest",
    color: "yellow",
  },
  {
    id: "register",
    n: 3,
    icon: ShoppingCart,
    label: "Ring Up",
    hint: "Cover, drinks, payouts",
    color: "emerald",
    // In-place tab — POS mounts inside FrontDoor, no new route/tab.
  },
  {
    id: "dancers",
    n: 4,
    icon: Sparkles,
    label: "Entertainer Check-In",
    hint: "Acknowledgments + clock in",
    color: "pink",
  },
  {
    id: "staff",
    n: 5,
    icon: Clock,
    label: "Staff Clock In/Out",
    hint: "Punch in for shift",
    color: "violet",
  },
];

// Plain literal class maps so Tailwind keeps them in the build.
const CLS = {
  yellow:  { active: "bg-yellow-500/15 border-yellow-400/60 text-yellow-200", ring: "bg-yellow-500 text-black", icon: "text-yellow-300" },
  cyan:    { active: "bg-cyan-500/15 border-cyan-400/60 text-cyan-200",       ring: "bg-cyan-500 text-black",   icon: "text-cyan-300" },
  emerald: { active: "bg-emerald-500/15 border-emerald-400/60 text-emerald-200", ring: "bg-emerald-500 text-black", icon: "text-emerald-300" },
  pink:    { active: "bg-pink-500/15 border-pink-400/60 text-pink-200",       ring: "bg-pink-500 text-black",   icon: "text-pink-300" },
  violet:  { active: "bg-violet-500/15 border-violet-400/60 text-violet-200", ring: "bg-violet-500 text-black", icon: "text-violet-300" },
};

export default function FrontDoorSideNav({ activeId, onSelect, enabledIds }) {
  // Register is a permanent in-place step, always visible.
  const visible = STEPS.filter(s => s.id === "register" || enabledIds.includes(s.id));

  return (
    <nav className="w-full lg:w-64 shrink-0 space-y-2">
      <div className="px-3 pb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Door Workflow</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          Top to bottom — that's the order of every guest's night.
        </p>
      </div>

      {visible.map((s) => {
        const Icon = s.icon;
        const isActive = activeId === s.id;
        const cls = CLS[s.color];
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`block w-full text-left rounded-xl border p-3 min-h-[64px] flex items-center gap-3 transition-all active:scale-[0.99] ${
              isActive
                ? `${cls.active} shadow-[0_0_20px_-8px_currentColor]`
                : "bg-slate-900/40 border-slate-800 hover:border-slate-600 text-slate-300"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm shrink-0 ${
              isActive ? cls.ring : "bg-slate-800 text-slate-400"
            }`}>
              {s.n}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-4 h-4 ${isActive ? cls.icon : "text-slate-500"}`} />
                <span className="font-bold text-sm truncate">{s.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{s.hint}</p>
            </div>
          </button>
        );
      })}
    </nav>
  );
}