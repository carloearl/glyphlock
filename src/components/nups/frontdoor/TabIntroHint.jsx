import React from "react";
import { Info } from "lucide-react";

/**
 * One-line "what to do on this tab" coaching strip. Placed directly above
 * a tab's content so new staff don't have to guess the standard flow.
 */
export default function TabIntroHint({ children }) {
  return (
    <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/60">
      <Info className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
      <div className="text-xs text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}