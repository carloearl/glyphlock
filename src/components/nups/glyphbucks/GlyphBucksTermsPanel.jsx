import React, { useRef, useState, useEffect } from "react";
import { GB_TERMS, GB_TERMS_VERSION } from "@/constants/glyphbucksTerms";

/**
 * DACO §7.1-7.2 — displays the v2.0 terms IN FULL, tracks scroll depth and
 * dwell time, captures "INITIAL HERE" on Terms 1 & 3, then the clickwrap
 * "I AGREE" assent. Initials + metrics are sealed into the Evidence Record.
 */
export default function GlyphBucksTermsPanel({ assent, onAssent }) {
  const boxRef = useRef(null);
  const shownAtRef = useRef(new Date().toISOString());
  const [depth, setDepth] = useState(0);
  const [initials, setInitials] = useState({ term1: "", term3: "" });

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

  const initialsOk = initials.term1.trim().length >= 2 && initials.term3.trim().length >= 2;

  const agree = () => {
    const shownAt = shownAtRef.current;
    onAssent({
      clickwrap_accepted: true,
      terms_shown_at: shownAt,
      scroll_depth_pct: depth,
      dwell_seconds: Math.round((Date.now() - new Date(shownAt).getTime()) / 1000),
      accepted_at: new Date().toISOString(),
      initials_term1: initials.term1.trim().toUpperCase(),
      initials_term3: initials.term3.trim().toUpperCase(),
    });
  };

  const InitialInput = ({ k }) => (
    <input
      value={initials[k]}
      onChange={(e) => setInitials((p) => ({ ...p, [k]: e.target.value.replace(/[^a-zA-Z.]/g, "").slice(0, 5) }))}
      placeholder="INITIAL"
      disabled={!!assent}
      className="inline-block w-20 ml-2 rounded-lg border border-[#e8c86a]/60 bg-[#e8c86a]/10 px-2 py-1 text-center text-xs font-bold tracking-widest uppercase text-[#e8c86a] placeholder:text-white/30"
    />
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-blue-200/80 uppercase tracking-wider">Purchase Agreement {GB_TERMS_VERSION}</h4>
        <span className="text-[10px] text-blue-300/60 font-mono">read {depth}%</span>
      </div>
      <div ref={boxRef} onScroll={onScroll}
        className="h-48 overflow-y-auto rounded-xl bg-white/[0.04] backdrop-blur border border-white/10 p-3 text-xs text-blue-100/80 space-y-2">
        {GB_TERMS.map((t, i) => {
          const needsInitial = t.includes("[PURCHASER INITIALS]");
          const text = t.replace(" [PURCHASER INITIALS]", "");
          return (
            <p key={i}>
              <span className="font-bold text-white">{i + 1}.</span> {text}
              {needsInitial && <InitialInput k={i === 0 ? "term1" : "term3"} />}
            </p>
          );
        })}
        <p className="text-[10px] text-white/40 pt-2 border-t border-white/10">
          NOT CURRENCY · NOT A BANK DEPOSIT · NOT FDIC INSURED
        </p>
      </div>
      {assent ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/40 px-3 py-2 text-xs text-emerald-300 font-semibold">
          ✓ I AGREE captured {new Date(assent.accepted_at).toLocaleTimeString()} · scroll {assent.scroll_depth_pct}% · dwell {assent.dwell_seconds}s · initials {assent.initials_term1}/{assent.initials_term3}
        </div>
      ) : (
        <button onClick={agree} disabled={depth < 90 || !initialsOk}
          className="w-full rounded-xl btn-glow-blue font-extrabold py-3 min-h-[48px] disabled:opacity-40 transition-all">
          {depth < 90 ? "Scroll to read the full terms to enable I AGREE"
            : !initialsOk ? "Enter purchaser initials on Terms 1 and 3 to enable I AGREE"
            : "I AGREE — Clickwrap Assent"}
        </button>
      )}
    </div>
  );
}