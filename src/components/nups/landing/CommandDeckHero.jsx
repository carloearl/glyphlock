import React from "react";

// Cinematic Command Deck hero for the NUPS landing page.
// Full-bleed nebula, top brand/status bar, live-stat ticker, and a glowing
// tablet device mockup with an animated command-deck waveform.
// Pure presentation — the interactive flow lives in KioskSimulator below it.

const NEBULA = "https://media.base44.com/images/public/697a087fb354faebb72df54b/b8cdc4d09_generated_image.png";
const CYAN = "#00F0FF";
const VIOLET = "#7B2CBF";

function StatChip({ icon, value, label, accent, live }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderRadius: 12,
        border: "1px solid rgba(0,240,255,0.18)",
        background: "rgba(6,10,26,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        minWidth: 150,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: accent,
          border: `1px solid ${accent}55`,
          background: `${accent}12`,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ lineHeight: 1.1 }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(160,175,215,0.9)",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 17,
            fontWeight: 800,
            color: live ? accent : "#fff",
          }}
        >
          {live && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: accent,
                boxShadow: `0 0 10px ${accent}`,
                animation: "cd-pulse 1.4s ease-in-out infinite",
              }}
            />
          )}
          {value}
        </div>
      </div>
    </div>
  );
}

export default function CommandDeckHero({ onEnter, onExit }) {
  return (
    <section className="cd-hero">
      <style>{`
        .cd-hero {
          position: relative;
          width: 100%;
          min-height: 720px;
          padding: 22px 24px 60px;
          overflow: hidden;
          border-bottom: 1px solid rgba(0,240,255,0.12);
          isolation: isolate;
        }
        .cd-hero__bg {
          position: absolute; inset: 0;
          background-image: url('${NEBULA}');
          background-size: cover;
          background-position: center;
          z-index: 0;
          opacity: 0.9;
          animation: cd-drift 40s ease-in-out infinite alternate;
        }
        .cd-hero__bg::after {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 38%, transparent 0%, rgba(3,3,8,0.55) 70%, #030308 100%);
        }
        @keyframes cd-drift {
          0% { transform: scale(1.05) translate(0,0); }
          100% { transform: scale(1.12) translate(-1.5%, -1%); }
        }
        @keyframes cd-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        .cd-inner { position: relative; z-index: 2; max-width: 1240px; margin: 0 auto; }
        .cd-topbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 28px;
        }
        .cd-brand { display: flex; align-items: center; gap: 12px; }
        .cd-brand__mark {
          width: 34px; height: 34px;
          filter: drop-shadow(0 0 12px rgba(0,240,255,0.6));
        }
        .cd-brand__name {
          font-family: 'Orbitron', sans-serif; font-weight: 800; font-size: 18px;
          letter-spacing: 0.14em;
          background: linear-gradient(180deg,#fff,${CYAN});
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        .cd-topmeta { display: flex; align-items: center; gap: 14px; }
        .cd-topmeta__tag {
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.24em;
          text-transform: uppercase; color: rgba(160,175,215,0.9);
        }
        .cd-exit {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 999px;
          border: 1px solid rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.1);
          color: #fca5a5;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em;
          text-transform: uppercase; cursor: pointer; font-weight: 700;
          min-height: 40px; transition: all .2s;
        }
        .cd-exit:hover { background: rgba(239,68,68,0.2); }
        .cd-statrow {
          display: flex; gap: 14px; flex-wrap: wrap; justify-content: center;
          margin: 0 auto 44px;
        }
        .cd-headline { text-align: center; }
        .cd-eyebrow {
          display: inline-flex; align-items: center; gap: 12px;
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.42em;
          text-transform: uppercase; color: ${CYAN}; margin-bottom: 18px;
        }
        .cd-eyebrow::before, .cd-eyebrow::after {
          content: ''; width: 40px; height: 1px;
          background: linear-gradient(90deg, transparent, ${CYAN}, transparent);
        }
        .cd-headline h1 {
          font-family: 'Orbitron', sans-serif; font-weight: 700;
          font-size: clamp(34px, 5.5vw, 72px); line-height: 0.98; margin: 0 0 20px;
          letter-spacing: -0.01em;
        }
        .cd-headline h1 .l1 { display:block; color:#fff; text-shadow: 0 0 40px rgba(0,240,255,0.3); }
        .cd-headline h1 .l2 {
          display:block; font-weight: 800;
          background: linear-gradient(120deg, ${CYAN} 0%, #3b82f6 45%, ${VIOLET} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: cd-grad 6s ease-in-out infinite;
        }
        @keyframes cd-grad { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .cd-sub {
          max-width: 640px; margin: 0 auto; font-size: 17px; line-height: 1.5;
          color: rgba(190,202,235,0.85);
        }
        .cd-sub b { color: ${CYAN}; font-weight: 600; }

        .cd-device-wrap {
          margin: 40px auto 34px; max-width: 560px; position: relative;
        }
        .cd-device-glow {
          position: absolute; inset: -40px -10px; z-index: 0; border-radius: 50%;
          background: radial-gradient(ellipse at center, rgba(0,240,255,0.28), rgba(123,44,191,0.14) 45%, transparent 72%);
          filter: blur(30px); animation: cd-pulse 5s ease-in-out infinite;
        }
        .cd-device {
          position: relative; z-index: 1;
          border-radius: 22px; border: 8px solid #0b1130;
          background: linear-gradient(180deg,#060a1c,#020510);
          box-shadow: 0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,240,255,0.22), inset 0 0 50px rgba(0,240,255,0.06);
          padding: 14px; overflow: hidden;
        }
        .cd-screen {
          border-radius: 12px; background: #030614;
          border: 1px solid rgba(0,240,255,0.12);
          aspect-ratio: 16 / 8; position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center;
        }
        .cd-wave { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.9; }
        .cd-play {
          position: relative; z-index: 3;
          width: 62px; height: 62px; border-radius: 50%;
          border: 1px solid rgba(0,240,255,0.6);
          background: rgba(0,240,255,0.12);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: ${CYAN};
          box-shadow: 0 0 26px rgba(0,240,255,0.5);
          transition: transform .2s;
        }
        .cd-play:hover { transform: scale(1.08); }
        .cd-tabs { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }
        .cd-tab {
          padding: 9px 18px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: rgba(210,220,245,0.9);
          font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.16em;
          text-transform: uppercase; cursor: pointer; font-weight: 600; min-height: 40px;
          transition: all .2s;
        }
        .cd-tab.primary {
          border-color: rgba(0,240,255,0.55);
          background: linear-gradient(135deg, rgba(0,240,255,0.2), rgba(123,44,191,0.2));
          color:#fff; box-shadow: 0 0 18px rgba(0,240,255,0.3);
        }
        .cd-tab:hover { border-color: rgba(0,240,255,0.5); }
        @media (max-width: 640px) {
          .cd-hero { min-height: auto; padding: 18px 14px 40px; }
          .cd-topmeta__tag { display: none; }
        }
      `}</style>

      <div className="cd-hero__bg" aria-hidden="true" />

      <div className="cd-inner">
        {/* Top brand + exit */}
        <div className="cd-topbar">
          <div className="cd-brand">
            <img
              className="cd-brand__mark"
              src="https://media.base44.com/images/public/697a087fb354faebb72df54b/77d157364_lglogo.png"
              alt=""
            />
            <span className="cd-brand__name">GLYPHLOCK</span>
          </div>
          <div className="cd-topmeta">
            <span className="cd-topmeta__tag">NUPS · ARIZONA · VENUE</span>
            <button className="cd-exit" onClick={onExit}>Exit (Manager PIN)</button>
          </div>
        </div>

        {/* Live status ticker */}
        <div className="cd-statrow">
          <StatChip
            label="Transactions"
            value="1,284"
            accent={CYAN}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>}
          />
          <StatChip
            label="Success Rate"
            value="99.6%"
            accent="#10b981"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>}
          />
          <StatChip
            label="System Shield"
            value="ACTIVE"
            accent={VIOLET}
            live
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L4 6v6c0 5 4 9 8 10 4-1 8-5 8-10V6z" /></svg>}
          />
        </div>

        {/* Headline */}
        <div className="cd-headline">
          <span className="cd-eyebrow">Node Universal Platform System</span>
          <h1>
            <span className="l1">The operating system</span>
            <span className="l2">behind the venue.</span>
          </h1>
          <p className="cd-sub">
            One <b>closed-loop command deck</b> — identity, payment, payout, audit, and dispute defense unified on a single multi-tenant platform engineered for <b>high-risk venues</b>.
          </p>
        </div>

        {/* Device mockup */}
        <div className="cd-device-wrap">
          <div className="cd-device-glow" aria-hidden="true" />
          <div className="cd-device">
            <div className="cd-screen">
              <svg className="cd-wave" viewBox="0 0 600 300" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="cd-wg" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={CYAN} stopOpacity="0.1" />
                    <stop offset="50%" stopColor={CYAN} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={VIOLET} stopOpacity="0.4" />
                  </linearGradient>
                </defs>
                {[0, 1, 2].map((i) => (
                  <path
                    key={i}
                    d="M0,150 C100,90 200,210 300,150 C400,90 500,210 600,150"
                    fill="none"
                    stroke="url(#cd-wg)"
                    strokeWidth={2.5 - i * 0.6}
                    opacity={0.9 - i * 0.28}
                    style={{ transformOrigin: "center", animation: `cd-wave-${i} ${3 + i}s ease-in-out infinite` }}
                  />
                ))}
                <style>{`
                  @keyframes cd-wave-0 { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-14px) scaleY(1.25)} }
                  @keyframes cd-wave-1 { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(16px) scaleY(0.8)} }
                  @keyframes cd-wave-2 { 0%,100%{transform:translateY(0) scaleY(1)} 50%{transform:translateY(-8px) scaleY(1.1)} }
                `}</style>
              </svg>
              <button className="cd-play" onClick={onEnter} aria-label="Enter live system">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Persona tabs */}
        <div className="cd-tabs">
          <button className="cd-tab primary" onClick={onEnter}>Experience Live System</button>
          <button className="cd-tab" onClick={onEnter}>Owner</button>
          <button className="cd-tab" onClick={onEnter}>Manager</button>
          <button className="cd-tab" onClick={onEnter}>Door</button>
          <button className="cd-tab" onClick={onEnter}>Entertainer</button>
        </div>
      </div>
    </section>
  );
}