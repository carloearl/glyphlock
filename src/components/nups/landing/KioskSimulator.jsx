import React, { useState, useEffect, useRef } from "react";

// NUPS FULLY INTERACTIVE Kiosk Simulator.
// The visitor actually taps through a realistic 30-second check-in:
//   Scan ID (tap → scan animates) → Consent (tick the box → I Agree) →
//   Seal (tap Seal → sealing runs) → Receipt (done, Reset to replay).
// Pure presentation — no real hardware, no PII, mock data only.

const CYAN = "#00F0FF";
const VIOLET = "#7B2CBF";

const STEPS = [
  { key: "identity", tag: "Step 01 · Identity", title: "Scan the Guest ID", caption: "Tap Scan ID — the camera reads the license, matches the face, and auto-verifies 21+ in real time." },
  { key: "consent", tag: "Step 02 · Clickwrap & Tender", title: "Capture Consent", caption: "Guest reviews scroll-tracked terms and taps to agree. Unified GlyphBucks + VIP tender is calculated instantly." },
  { key: "seal", tag: "Step 03 · Execution & Sealing", title: "Seal the Contract", caption: "Guest, Issuer & Manager e-sign. Tap Seal — SHA-256 + Ed25519 signed, anchored to Bitcoin via OpenTimestamps." },
  { key: "receipt", tag: "Step 04 · Receipt", title: "Verifiable Receipt", caption: "Contract sealed. Optional hardcopy printed. Verifiable by any payment processor instantly." },
];

/* ---------- Step 1: Identity ---------- */
function ScreenIdentity({ onDone }) {
  const [state, setState] = useState("idle"); // idle | scanning | done
  useEffect(() => {
    if (state !== "scanning") return;
    const t = setTimeout(() => setState("done"), 2200);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => onDone(), 900);
    return () => clearTimeout(t);
  }, [state, onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div
        style={{
          flex: 1, borderRadius: 14, border: `1px solid ${CYAN}59`,
          background: "linear-gradient(160deg, rgba(0,240,255,0.06), rgba(123,44,191,0.05))",
          position: "relative", overflow: "hidden", display: "flex",
          alignItems: "center", justifyContent: "center", minHeight: 170,
        }}
      >
        <div style={{ width: "62%", aspectRatio: "1.6", border: `2px solid ${CYAN}`, borderRadius: 10, boxShadow: `0 0 24px rgba(0,240,255,0.4), inset 0 0 24px rgba(0,240,255,0.12)`, position: "relative" }}>
          {["tl", "tr", "bl", "br"].map((c) => (
            <span key={c} style={{ position: "absolute", width: 18, height: 18, border: `3px solid ${CYAN}`, [c.includes("t") ? "top" : "bottom"]: -3, [c.includes("l") ? "left" : "right"]: -3, borderTop: c.includes("t") ? undefined : "none", borderBottom: c.includes("b") ? undefined : "none", borderLeft: c.includes("l") ? undefined : "none", borderRight: c.includes("r") ? undefined : "none" }} />
          ))}
          {state === "scanning" && (
            <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`, boxShadow: `0 0 12px ${CYAN}`, animation: "kioskScan 1.6s ease-in-out infinite" }} />
          )}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.2em", color: state === "done" ? "#10b981" : "rgba(224,231,255,0.6)" }}>
            {state === "idle" && "READY TO SCAN"}
            {state === "scanning" && "SCANNING ID…"}
            {state === "done" && "✓ VERIFIED"}
          </div>
        </div>
      </div>

      {state === "done" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[{ l: "Face Match", v: "98.2%", c: "#10b981" }, { l: "Thumbprint", v: "MATCHED", c: CYAN }, { l: "Age Check", v: "21+ ✓", c: "#10b981" }].map((m) => (
            <div key={m.l} style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(160,160,176,0.9)" }}>{m.l}</div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: m.c, marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>
      ) : (
        <button className="kiosk-cta" disabled={state === "scanning"} onClick={() => setState("scanning")}>
          {state === "scanning" ? "Reading license…" : "📷  Scan ID"}
        </button>
      )}
    </div>
  );
}

/* ---------- Step 2: Consent ---------- */
function ScreenConsent({ onDone }) {
  const [agreed, setAgreed] = useState(false);
  const scrollRef = useRef(null);
  const [pct, setPct] = useState(0);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setPct(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 100);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ flex: 1, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", padding: 14, position: "relative", minHeight: 150, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.2em", color: CYAN, textTransform: "uppercase", marginBottom: 8 }}>
          Terms · scroll {pct}%
        </div>
        <div ref={scrollRef} onScroll={onScroll} style={{ overflowY: "auto", fontSize: 12, color: "rgba(224,231,255,0.75)", lineHeight: 1.6, paddingRight: 10 }}>
          By initialing below you acknowledge the stored-value instrument is a non-refundable closed-loop voucher (Term 1) and consent to biometric identity binding for chargeback defense (Term 3). This agreement is sealed and independently verifiable. All tender is final at execution. Consent is documented, time-stamped, and revocable per statutory retention policy. The venue retains a cryptographic record of this transaction for dispute defense.
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 12, color: "rgba(224,231,255,0.85)" }}>
        <span
          onClick={() => setAgreed((a) => !a)}
          style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${agreed ? CYAN : "rgba(255,255,255,0.3)"}`, background: agreed ? CYAN : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#020617", fontWeight: 900, flexShrink: 0, transition: "all .2s" }}
        >
          {agreed && "✓"}
        </span>
        I have read and agree to the terms
      </label>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${CYAN}4d`, borderRadius: 10, padding: "8px 14px", background: "rgba(0,240,255,0.06)" }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.16em", color: "rgba(160,160,176,0.9)", textTransform: "uppercase" }}>Unified Tender</div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 17, fontWeight: 700, color: "#fff" }}>$320.00</div>
        </div>
        <button className="kiosk-cta kiosk-cta--sm" disabled={!agreed} onClick={onDone}>I Agree</button>
      </div>
    </div>
  );
}

/* ---------- Step 3: Seal ---------- */
function ScreenSeal({ onDone }) {
  const [state, setState] = useState("idle"); // idle | sealing | done
  useEffect(() => {
    if (state !== "sealing") return;
    const t = setTimeout(() => setState("done"), 2000);
    return () => clearTimeout(t);
  }, [state]);
  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => onDone(), 850);
    return () => clearTimeout(t);
  }, [state, onDone]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {["Guest", "Issuer", "Manager"].map((r) => (
          <div key={r} style={{ border: `1px solid ${VIOLET}66`, background: "rgba(123,44,191,0.08)", borderRadius: 10, padding: "12px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(160,160,176,0.9)" }}>{r}</div>
            <div style={{ fontSize: 18, color: "#10b981", marginTop: 4 }}>✓ /s/</div>
          </div>
        ))}
      </div>
      <div style={{ border: `1px solid ${VIOLET}`, borderRadius: 12, padding: 16, background: "linear-gradient(135deg, rgba(123,44,191,0.12), rgba(0,240,255,0.05))", textAlign: "center" }}>
        <button
          className="kiosk-cta"
          disabled={state !== "idle"}
          onClick={() => setState("sealing")}
          style={{ background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`, color: "#fff" }}
        >
          {state === "idle" && "🔒  Seal Contract"}
          {state === "sealing" && "Sealing…"}
          {state === "done" && "✓ Sealed"}
        </button>
        <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(160,160,176,0.9)", lineHeight: 1.7 }}>
          <div style={{ color: state === "idle" ? "rgba(160,160,176,0.5)" : "#10b981" }}>SHA-256 · Ed25519 signed</div>
          <div style={{ color: state === "done" ? CYAN : "rgba(160,160,176,0.5)" }}>⛓ Anchored to Bitcoin · OpenTimestamps</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Step 4: Receipt ---------- */
function ScreenReceipt({ onReset }) {
  const Qr = () => (
    <div style={{ width: 70, height: 70, borderRadius: 6, background: "repeating-conic-gradient(#020617 0% 25%, #e0e7ff 0% 50%) 50% / 12px 12px", border: "3px solid #e0e7ff", boxShadow: `0 0 12px rgba(0,240,255,0.35)` }} />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, color: "#10b981" }}>✓</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>CONTRACT SEALED</div>
      </div>
      <div style={{ flex: 1, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(224,231,255,0.75)" }}><span>AGREEMENT</span><span style={{ color: CYAN }}>GB-260725-0042</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(224,231,255,0.75)" }}><span>TOTAL</span><span style={{ color: "#fff" }}>$320.00</span></div>
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 10, display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}><Qr /><div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,160,176,0.9)" }}>VERIFY REF</div></div>
          <div style={{ textAlign: "center" }}><Qr /><div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,160,176,0.9)" }}>PROCESSOR</div></div>
        </div>
      </div>
      <button className="kiosk-cta" onClick={onReset} style={{ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}>↺  Run it again</button>
    </div>
  );
}

export default function KioskSimulator() {
  const [step, setStep] = useState(0);
  const active = STEPS[step];

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const reset = () => setStep(0);

  return (
    <>
      <style>{`
        @keyframes kioskScan { 0%{top:6%;opacity:.4} 50%{top:90%;opacity:1} 100%{top:6%;opacity:.4} }
        @keyframes kioskFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .kiosk-cta {
          width: 100%; padding: 14px; border-radius: 10; border: none;
          font-family: 'Orbitron', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.08em; color: #020617; background: ${CYAN};
          cursor: pointer; min-height: 48px; transition: all .2s;
          box-shadow: 0 0 18px rgba(0,240,255,0.4);
        }
        .kiosk-cta:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
        .kiosk-cta:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
        .kiosk-cta--sm { width: auto; padding: 10px 20px; min-height: 40px; }
        @media (max-width: 900px) { .kiosk-sim { grid-template-columns: 1fr !important; gap: 28px !important; } }
      `}</style>

      <div className="section-header">
        <h2>Try the <b>30-Second</b> Flow</h2>
        <div className="index">§ Interactive · Hands-On</div>
      </div>

      <div
        className="kiosk-sim"
        style={{
          display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 40,
          alignItems: "center", marginBottom: 96,
          background: "linear-gradient(180deg, var(--abyss) 0%, var(--deep) 100%)",
          border: "1px solid var(--line)", borderRadius: 4, padding: "40px 32px",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        {/* Mock tablet */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: "100%", maxWidth: 380, aspectRatio: "3 / 4", borderRadius: 26,
              border: "10px solid #0b1130", background: "#030614",
              boxShadow: "0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,240,255,0.18), inset 0 0 40px rgba(0,240,255,0.05)",
              padding: 16, position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 46, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
            <div key={active.key} style={{ height: "100%", paddingTop: 8, animation: "kioskFade 0.4s ease" }}>
              {active.key === "identity" && <ScreenIdentity onDone={goNext} />}
              {active.key === "consent" && <ScreenConsent onDone={goNext} />}
              {active.key === "seal" && <ScreenSeal onDone={goNext} />}
              {active.key === "receipt" && <ScreenReceipt onReset={reset} />}
            </div>
          </div>

          {/* Progress dots (jump between completed steps) */}
          <div style={{ display: "flex", gap: 8 }}>
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                onClick={() => i <= step && setStep(i)}
                aria-label={`Step ${i + 1}: ${s.title}`}
                style={{
                  width: i === step ? 26 : 10, height: 10, borderRadius: 999, border: "none",
                  cursor: i <= step ? "pointer" : "default", padding: 0,
                  background: i === step ? CYAN : i < step ? "rgba(0,240,255,0.5)" : "rgba(255,255,255,0.2)",
                  boxShadow: i === step ? `0 0 10px ${CYAN}` : "none", transition: "all .3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Caption panel */}
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: CYAN, marginBottom: 16 }}>
            {active.tag}
          </div>
          <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 34, lineHeight: 1.1, color: "#fff", marginBottom: 18 }}>
            {active.title}
          </h3>
          <p style={{ fontSize: 17, color: "var(--ink-dim)", lineHeight: 1.55, maxWidth: 520 }}>
            {active.caption}
          </p>
          <div style={{ marginTop: 24, display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-dim)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            Step {step + 1} of {STEPS.length} · tap the screen to advance
          </div>
        </div>
      </div>
    </>
  );
}