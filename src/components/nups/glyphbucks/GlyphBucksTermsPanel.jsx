import React, { useRef, useState, useEffect } from "react";
import { GB_TERMS, GB_TERMS_VERSION } from "@/constants/glyphbucksTerms";

/**
 * DACO §7.1-7.2 — displays the v2.0 terms IN FULL, tracks scroll depth and
 * dwell time, then captures the clickwrap "I AGREE" assent.
 */
export default function GlyphBucksTermsPanel({ assent, onAssent }) {
  const boxRef = useRef(null);
  const shownAtRef = useRef(new Date().toISOString());
  const [depth, setDepth] = useState(0);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) setDepth(100);
  }, []);

  const onScroll = (e) => {
    const el = e.target;
    const pct = Math.min(100, Math.round(((el.scrollTop + el.clientHeight) / el.scrollHeight) * 100));
    setDepth((d) => Math.max(d, pct));
  };

  const agree = () => {
    const shownAt = shownAtRef.current;
    onAssent({
      clickwrap_accepted: true,
      terms_shown_at: shownAt,
      scroll_depth_pct: depth,
      dwell_seconds: Math.round((Date.now() - new Date(shownAt).getTime()) / 1000),
      accepted_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-pink-300">Terms — GlyphBucks Purchase Agreement {GB_TERMS_VERSION}</h3>
        <span className="text-[10px] text-neutral-400 font-mono">read {depth}%</span>
      </div>
      <div ref={boxRef} onScroll={onScroll}
        className="h-48 overflow-y-auto rounded-lg bg-[#171e33] border border-[#33405f] p-3 text-xs text-neutral-300 space-y-2">
        {GB_TERMS.map((t, i) => (
          <p key={i}><span className="font-bold text-neutral-100">{i + 1}.</span> {t}</p>
        ))}
        <p className="text-[10px] text-neutral-500 pt-2 border-t border-white/10">
          NOT CURRENCY · NOT A BANK DEPOSIT · NOT FDIC INSURED
        </p>
      </div>
      {assent ? (
        <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/40 px-3 py-2 text-xs text-emerald-300 font-semibold">
          ✓ I AGREE captured {new Date(assent.accepted_at).toLocaleTimeString()} · scroll {assent.scroll_depth_pct}% · dwell {assent.dwell_seconds}s
        </div>
      ) : (
        <button onClick={agree} disabled={depth < 90}
          className="w-full rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-40 font-extrabold py-3 min-h-[48px]">
          {depth < 90 ? "Scroll to read the full terms to enable I AGREE" : "I AGREE — Clickwrap Assent"}
        </button>
      )}
    </div>
  );
}