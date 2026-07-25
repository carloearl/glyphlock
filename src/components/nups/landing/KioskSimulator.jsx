import React, { useState } from "react";

// NUPS Interactive Kiosk Simulator — "Back Play" flow.
// A self-contained glassmorphic mock-tablet that walks a prospective buyer
// through the 30-second unified NUPS flow with Previous / Next navigation.
// Pure presentation — no real hardware, no PII, mock data only.

const STEPS = [
  {
    key: "identity",
    tag: "Step 01 · Identity",
    title: "Live Identity Capture",
    caption:
      "Live camera scans ID. Face Match 98.2% & biometric thumbprint captured. 21+ auto-verified.",
  },
  {
    key: "consent",
    tag: "Step 02 · Clickwrap & Tender",
    title: "Scroll-Tracked Assent",
    caption:
      "Scroll-tracked clickwrap assent. Unified GlyphBucks + VIP tender calculated instantly.",
  },
  {
    key: "seal",
    tag: "Step 03 · Execution & Sealing",
    title: "Cryptographic Seal",
    caption:
      "Guest, Issuer & Manager e-sign. Sealed with SHA-256 + Ed25519, anchored to Bitcoin via OpenTimestamps.",
  },
  {
    key: "receipt",
    tag: "Step 04 · Receipt",
    title: "Verifiable Receipt",
    caption:
      "Contract sealed. Optional hardcopy printed. Verifiable by payment processors instantly.",
  },
];

const CYAN = "#00d4ff";
const VIOLET = "#8b5cf6";

function ScreenIdentity() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div
        style={{
          flex: 1,
          borderRadius: 14,
          border: "1px solid rgba(0,212,255,0.35)",
          background:
            "linear-gradient(160deg, rgba(0,212,255,0.06), rgba(139,92,246,0.04))",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 180,
        }}
      >
        {/* scan reticle */}
        <div
          style={{
            width: "62%",
            aspectRatio: "1.6",
            border: `2px solid ${CYAN}`,
            borderRadius: 10,
            boxShadow: `0 0 24px rgba(0,212,255,0.4), inset 0 0 24px rgba(0,212,255,0.15)`,
            position: "relative",
          }}
        >
          {["tl", "tr", "bl", "br"].map((c) => (
            <span
              key={c}
              style={{
                position: "absolute",
                width: 18,
                height: 18,
                border: `3px solid ${CYAN}`,
                [c.includes("t") ? "top" : "bottom"]: -3,
                [c.includes("l") ? "left" : "right"]: -3,
                borderTop: c.includes("t") ? undefined : "none",
                borderBottom: c.includes("b") ? undefined : "none",
                borderLeft: c.includes("l") ? undefined : "none",
                borderRight: c.includes("r") ? undefined : "none",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, transparent, ${CYAN}, transparent)`,
              boxShadow: `0 0 12px ${CYAN}`,
              animation: "kioskScan 2.4s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(224,231,255,0.6)",
            }}
          >
            SCANNING ID…
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { l: "Face Match", v: "98.2%", c: "#10b981" },
          { l: "Thumbprint", v: "MATCHED", c: CYAN },
          { l: "Age Check", v: "21+ ✓", c: "#10b981" },
        ].map((m) => (
          <div
            key={m.l}
            style={{
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 10,
              padding: "10px 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 8,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(160,160,176,0.9)",
              }}
            >
              {m.l}
            </div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 700, color: m.c, marginTop: 4 }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenConsent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <div
        style={{
          flex: 1,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          padding: 16,
          overflow: "hidden",
          position: "relative",
          minHeight: 160,
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.2em",
            color: CYAN,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Terms of Service · scroll-tracked
        </div>
        <div style={{ fontSize: 12, color: "rgba(224,231,255,0.75)", lineHeight: 1.6 }}>
          By initialing below you acknowledge the stored-value instrument is a
          non-refundable closed-loop voucher (Term 1) and consent to biometric
          identity binding for chargeback defense (Term 3). This agreement is
          sealed and independently verifiable…
        </div>
        {/* scroll progress */}
        <div
          style={{
            position: "absolute",
            right: 8,
            top: 16,
            bottom: 16,
            width: 4,
            borderRadius: 4,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ width: "100%", height: "82%", borderRadius: 4, background: CYAN, boxShadow: `0 0 8px ${CYAN}` }} />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid rgba(0,212,255,0.3)",
          borderRadius: 10,
          padding: "10px 14px",
          background: "rgba(0,212,255,0.06)",
        }}
      >
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", color: "rgba(160,160,176,0.9)", textTransform: "uppercase" }}>
            Unified Tender
          </div>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>$320.00</div>
        </div>
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#020617",
            background: CYAN,
            padding: "10px 18px",
            borderRadius: 8,
            boxShadow: `0 0 16px rgba(0,212,255,0.5)`,
          }}
        >
          I AGREE
        </div>
      </div>
    </div>
  );
}

function ScreenSeal() {
  const sigs = [
    { r: "Guest", ok: true },
    { r: "Issuer", ok: true },
    { r: "Manager", ok: true },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {sigs.map((s) => (
          <div
            key={s.r}
            style={{
              border: "1px solid rgba(139,92,246,0.4)",
              background: "rgba(139,92,246,0.06)",
              borderRadius: 10,
              padding: "12px 8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(160,160,176,0.9)" }}>
              {s.r}
            </div>
            <div style={{ fontSize: 20, color: "#10b981", marginTop: 4 }}>✓ /s/</div>
          </div>
        ))}
      </div>
      <div
        style={{
          border: `1px solid ${VIOLET}`,
          borderRadius: 12,
          padding: 16,
          background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,212,255,0.04))",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "#fff",
            background: `linear-gradient(135deg, ${CYAN}, ${VIOLET})`,
            padding: "12px",
            borderRadius: 8,
            boxShadow: `0 0 20px rgba(139,92,246,0.5)`,
          }}
        >
          🔒 SEAL CONTRACT
        </div>
        <div style={{ marginTop: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "rgba(160,160,176,0.9)", lineHeight: 1.7 }}>
          <div>SHA-256 · Ed25519 signed</div>
          <div style={{ color: CYAN }}>⛓ Anchored to Bitcoin · OpenTimestamps</div>
        </div>
      </div>
    </div>
  );
}

function ScreenReceipt() {
  const Qr = () => (
    <div
      style={{
        width: 78,
        height: 78,
        borderRadius: 6,
        background:
          "repeating-conic-gradient(#020617 0% 25%, #e0e7ff 0% 50%) 50% / 13px 13px",
        border: "3px solid #e0e7ff",
        boxShadow: `0 0 12px rgba(0,212,255,0.35)`,
      }}
    />
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, color: "#10b981" }}>✓</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>
          CONTRACT SEALED
        </div>
      </div>
      <div
        style={{
          flex: 1,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(224,231,255,0.75)" }}>
          <span>AGREEMENT</span>
          <span style={{ color: CYAN }}>GB-260725-0042</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "rgba(224,231,255,0.75)" }}>
          <span>TOTAL</span>
          <span style={{ color: "#fff" }}>$320.00</span>
        </div>
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: 12, display: "flex", justifyContent: "space-around", alignItems: "flex-start" }}>
          <div style={{ textAlign: "center" }}>
            <Qr />
            <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,160,176,0.9)" }}>VERIFY REF</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <Qr />
            <div style={{ marginTop: 6, fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.15em", color: "rgba(160,160,176,0.9)" }}>PROCESSOR</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const SCREENS = {
  identity: ScreenIdentity,
  consent: ScreenConsent,
  seal: ScreenSeal,
  receipt: ScreenReceipt,
};

export default function KioskSimulator() {
  const [step, setStep] = useState(0);
  const active = STEPS[step];
  const Screen = SCREENS[active.key];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      <style>{`
        @keyframes kioskScan {
          0% { top: 6%; opacity: 0.4; }
          50% { top: 90%; opacity: 1; }
          100% { top: 6%; opacity: 0.4; }
        }
        @keyframes kioskFade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="section-header">
        <h2>Experience the <b>30-Second</b> Flow</h2>
        <div className="index">§ Interactive Demo · Back-Play</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(280px, 420px) 1fr",
          gap: 40,
          alignItems: "center",
          marginBottom: 96,
          background: "linear-gradient(180deg, var(--abyss) 0%, var(--deep) 100%)",
          border: "1px solid var(--line)",
          borderRadius: 4,
          padding: "40px 32px",
          boxShadow: "var(--shadow-panel)",
        }}
        className="kiosk-sim"
      >
        {/* Mock tablet */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: "100%",
              maxWidth: 380,
              aspectRatio: "3 / 4",
              borderRadius: 26,
              border: "10px solid #0b1130",
              background: "#030614",
              boxShadow:
                "0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.15), inset 0 0 40px rgba(0,212,255,0.05)",
              padding: 16,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 46, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.12)" }} />
            <div key={active.key} style={{ height: "100%", paddingTop: 8, animation: "kioskFade 0.4s ease" }}>
              <Screen />
            </div>
          </div>

          {/* Back-Play navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={isFirst}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: isFirst ? "rgba(255,255,255,0.3)" : "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: isFirst ? "not-allowed" : "pointer",
                minHeight: 44,
              }}
            >
              ← Previous
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  onClick={() => setStep(i)}
                  aria-label={`Go to ${s.title}`}
                  style={{
                    width: i === step ? 26 : 10,
                    height: 10,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    background: i === step ? CYAN : "rgba(255,255,255,0.2)",
                    boxShadow: i === step ? `0 0 10px ${CYAN}` : "none",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={isLast}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(0,212,255,0.5)",
                background: isLast
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(139,92,246,0.2))",
                color: isLast ? "rgba(255,255,255,0.3)" : "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 700,
                cursor: isLast ? "not-allowed" : "pointer",
                minHeight: 44,
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Caption panel */}
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: CYAN,
              marginBottom: 16,
            }}
          >
            {active.tag}
          </div>
          <h3
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 700,
              fontSize: 34,
              lineHeight: 1.1,
              color: "#fff",
              marginBottom: 18,
            }}
          >
            {active.title}
          </h3>
          <p style={{ fontSize: 17, color: "var(--ink-dim)", lineHeight: 1.55, maxWidth: 520 }}>
            {active.caption}
          </p>
          <div
            style={{
              marginTop: 24,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--ink-dim)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981" }} />
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .kiosk-sim { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </>
  );
}