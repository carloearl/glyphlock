import React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardCheck,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  UsersRound,
  WalletCards,
} from "lucide-react";

const NEBULA = "https://media.base44.com/images/public/697a087fb354faebb72df54b/b8cdc4d09_generated_image.png";
const CYAN = "#00F0FF";

const WORKFLOWS = [
  [Fingerprint, "Verify", "Identity, age, account, venue, and role checks"],
  [ClipboardCheck, "Document", "Contracts, consent, events, and audit records"],
  [WalletCards, "Process / Overlay", "Use Stripe natively through GlyphLock/NUPS or keep the venue processor and bind its approval evidence"],
  [ShieldCheck, "Defend", "Evidence retrieval and dispute-ready transaction history"],
];

const CAPABILITY_BANDS = [
  { label: "LIVE CORE", value: "Identity · POS · contracts · GlyphBucks · audit", tone: "#10b981" },
  { label: "PROCESSING", value: "Stripe-native path + existing-processor overlay", tone: "#00d4ff" },
  { label: "EXPANDING", value: "Final dispute PDF · direct processor APIs · full offline coverage", tone: "#fbbf24" },
];

export default function CommandDeckHero({ onEnter }) {
  return (
    <section className="cd-hero" aria-labelledby="command-deck-title">
      <style>{`
        .cd-hero {
          position: relative;
          width: 100%;
          min-height: 680px;
          padding: 26px 24px 64px;
          overflow: hidden;
          border-block: 1px solid rgba(0,240,255,0.12);
          isolation: isolate;
        }
        .cd-hero__bg {
          position: absolute; inset: 0;
          background-image: url('${NEBULA}');
          background-size: cover;
          background-position: center;
          z-index: 0;
          opacity: .58;
        }
        .cd-hero__bg::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(3,6,20,.76), rgba(3,6,20,.94)), radial-gradient(ellipse 60% 55% at 50% 35%, transparent, #030614 86%);
        }
        .cd-inner { position: relative; z-index: 2; max-width: 1240px; margin: 0 auto; }
        .cd-topbar { display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:52px; }
        .cd-brand { display:flex; align-items:center; gap:12px; color:#fff; font-family:'Orbitron',sans-serif; font-weight:800; letter-spacing:.14em; }
        .cd-brand img { width:34px; height:34px; filter:drop-shadow(0 0 12px rgba(0,240,255,.6)); }
        .cd-status { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; border:1px solid rgba(16,185,129,.4); background:rgba(16,185,129,.1); color:#a7f3d0; font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
        .cd-bands { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:0 0 34px; }
        .cd-band { position:relative; overflow:hidden; min-height:84px; border:1px solid rgba(255,255,255,.1); background:rgba(3,6,20,.76); border-radius:14px; padding:15px 16px; }
        .cd-band::before { content:''; position:absolute; inset:0 auto 0 0; width:3px; background:var(--band); box-shadow:0 0 18px var(--band); }
        .cd-band__label { font-family:'JetBrains Mono',monospace; font-size:9px; font-weight:900; letter-spacing:.2em; color:var(--band); }
        .cd-band__value { margin-top:8px; color:#e2e8f0; font-size:12px; line-height:1.4; font-weight:650; }
        .cd-grid { display:grid; grid-template-columns:1.05fr .95fr; gap:60px; align-items:center; }
        .cd-eyebrow { display:inline-flex; align-items:center; gap:10px; color:${CYAN}; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:800; letter-spacing:.28em; text-transform:uppercase; }
        .cd-copy h2 { margin:18px 0 20px; font-family:'Orbitron',sans-serif; font-size:clamp(34px,5vw,66px); line-height:1.02; letter-spacing:-.025em; color:#fff; }
        .cd-copy h2 span { display:block; margin-top:6px; background:linear-gradient(120deg,#a5f3fc,#3b82f6,#a78bfa); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
        .cd-copy p { max-width:680px; margin:0; color:rgba(203,213,225,.82); font-size:18px; line-height:1.6; }
        .cd-copy strong { color:#e0f2fe; }
        .cd-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:30px; }
        .cd-btn { min-height:52px; display:inline-flex; align-items:center; justify-content:center; gap:9px; border-radius:12px; padding:0 22px; font-family:'JetBrains Mono',monospace; font-size:10px; font-weight:900; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; transition:.2s; }
        .cd-btn:hover { transform:translateY(-2px); }
        .cd-btn.primary { border:1px solid rgba(165,243,252,.5); background:linear-gradient(135deg,#0891b2,#4f46e5); color:white; box-shadow:0 18px 50px rgba(15,23,42,.5); }
        .cd-btn.secondary { border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.05); color:white; }
        .cd-note { display:flex; gap:9px; align-items:flex-start; margin-top:18px; max-width:680px; color:#94a3b8; font-family:'JetBrains Mono',monospace; font-size:10px; line-height:1.6; }
        .cd-panel { border:1px solid rgba(0,240,255,.18); background:rgba(3,6,20,.74); border-radius:22px; padding:24px; box-shadow:0 30px 80px rgba(0,0,0,.42); backdrop-filter:blur(16px); }
        .cd-panel__head { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-bottom:16px; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,.1); color:#fff; font-family:'Orbitron',sans-serif; font-size:13px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .cd-workflow { display:grid; grid-template-columns:42px 1fr; gap:12px; padding:14px 0; border-bottom:1px solid rgba(255,255,255,.07); }
        .cd-workflow:last-child { border-bottom:none; }
        .cd-workflow__icon { display:grid; place-items:center; width:42px; height:42px; border-radius:11px; border:1px solid rgba(0,240,255,.18); background:rgba(0,240,255,.07); color:#a5f3fc; }
        .cd-workflow h3 { margin:0; color:#fff; font-size:14px; }
        .cd-workflow p { margin:4px 0 0; color:#94a3b8; font-size:12px; line-height:1.45; }
        .cd-audience { margin-top:16px; display:flex; align-items:center; gap:8px; color:#c4b5fd; font-family:'JetBrains Mono',monospace; font-size:9px; letter-spacing:.1em; text-transform:uppercase; }
        @media (max-width: 900px) { .cd-grid { grid-template-columns:1fr; gap:34px; } .cd-topbar { margin-bottom:30px; } .cd-bands { grid-template-columns:1fr; } }
        @media (max-width: 640px) { .cd-hero { min-height:auto; padding:20px 14px 44px; } .cd-copy p { font-size:16px; } .cd-actions { flex-direction:column; } .cd-btn { width:100%; } }
      `}</style>

      <div className="cd-hero__bg" aria-hidden="true" />
      <div className="cd-inner">
        <div className="cd-topbar">
          <div className="cd-brand">
            <img src="https://media.base44.com/images/public/697a087fb354faebb72df54b/77d157364_lglogo.png" alt="" />
            GLYPHLOCK
          </div>
          <div className="cd-status"><BadgeCheck size={13} aria-hidden="true" /> Live core · expansion clearly labeled</div>
        </div>

        <div className="cd-bands" aria-label="Current NUPS capability status">
          {CAPABILITY_BANDS.map((band) => (
            <div className="cd-band" key={band.label} style={{ '--band': band.tone }}>
              <div className="cd-band__label">{band.label}</div>
              <div className="cd-band__value">{band.value}</div>
            </div>
          ))}
        </div>

        <div className="cd-grid">
          <div className="cd-copy">
            <div className="cd-eyebrow"><Building2 size={15} aria-hidden="true" /> Hybrid payment + evidence infrastructure</div>
            <h2 id="command-deck-title">Process with Stripe.<span>Or keep your processor.</span></h2>
            <p>
              NUPS supports both models without splitting the operating system in two. When GlyphLock/NUPS owns the payment path, <strong>Stripe is the native processing rail</strong>. When a venue keeps its merchant account, terminal, settlement, or processor relationship, NUPS operates as the verification and evidence layer above that transaction. Identity, approvals, contracts, receipts, payouts, and audit records remain linked either way.
            </p>
            <div className="cd-actions">
              <button className="cd-btn primary" type="button" onClick={onEnter}>Open NUPS Gateway <ArrowRight size={16} aria-hidden="true" /></button>
              <button className="cd-btn secondary" type="button" onClick={() => document.getElementById('nups-video')?.scrollIntoView({ behavior: 'smooth' })}>Watch capability demo <ReceiptText size={16} aria-hidden="true" /></button>
            </div>
            <div className="cd-note"><LockKeyhole size={15} aria-hidden="true" /><span>Architecture rule: one NUPS transaction model, two payment adapters. Stripe-native is used for GlyphLock-controlled processing; external processors remain supported through approval/reference capture and optional integrations.</span></div>
          </div>

          <aside className="cd-panel" aria-label="NUPS workflow summary">
            <div className="cd-panel__head"><span>Core operating cycle</span><LayoutDashboard size={18} color={CYAN} aria-hidden="true" /></div>
            {WORKFLOWS.map(([Icon, title, description]) => (
              <div className="cd-workflow" key={title}>
                <div className="cd-workflow__icon"><Icon size={19} aria-hidden="true" /></div>
                <div><h3>{title}</h3><p>{description}</p></div>
              </div>
            ))}
            <div className="cd-audience"><UsersRound size={14} aria-hidden="true" /> Owner · manager · front door · entertainer · staff · guest</div>
          </aside>
        </div>
      </div>
    </section>
  );
}
