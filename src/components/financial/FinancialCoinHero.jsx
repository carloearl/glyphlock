import React, { useEffect, useRef } from "react";

export default function FinancialCoinHero() {
  const starsRef = useRef(null);

  useEffect(() => {
    if (!starsRef.current) return;
    const container = starsRef.current;
    container.innerHTML = "";
    for (let i = 0; i < 120; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2 + 0.5;
      Object.assign(star.style, {
        position: "absolute",
        borderRadius: "50%",
        background: "#fff",
        width: `${size}px`,
        height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animation: `glf-twinkle ${2 + Math.random() * 4}s ease-in-out infinite alternate`,
        animationDelay: `${Math.random() * 3}s`,
      });
      container.appendChild(star);
    }
  }, []);

  const SHIELD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";
  const GL_COIN_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/b001ff48e_ChatGPTImageFeb6202606_25_17PM.png";

  return (
    <div className="glf-coin-hero">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&display=swap');

        .glf-coin-hero {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 16px 24px;
          overflow: hidden;
          font-family: 'Cinzel', serif;
        }

        .glf-stars { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        @keyframes glf-twinkle { from { opacity: 0.05; } to { opacity: 0.7; } }

        /* ===== GREEN PULSE GLOW ===== */
        .glf-green-pulse {
          position: absolute;
          width: min(480px, 85vw);
          height: min(480px, 85vw);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.08) 40%, transparent 70%);
          animation: glf-greenPulse 3s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        @keyframes glf-greenPulse {
          0%, 100% { 
            transform: scale(0.92); 
            opacity: 0.4;
            box-shadow: 0 0 60px rgba(16,185,129,0.3), 0 0 120px rgba(16,185,129,0.15);
          }
          50% { 
            transform: scale(1.08); 
            opacity: 1;
            box-shadow: 0 0 100px rgba(16,185,129,0.5), 0 0 200px rgba(16,185,129,0.25), 0 0 300px rgba(16,185,129,0.1);
          }
        }

        .glf-stage {
          position: relative;
          width: min(560px, 90vw);
          height: min(560px, 90vw);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .glf-orbit-svg {
          position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none;
        }

        /* ===== MULTI-AXIS ORBIT RINGS ===== */
        .glf-orbit-outer { 
          animation: glf-orbitCW 22s linear infinite; 
          transform-origin: 280px 280px; 
        }
        .glf-orbit-inner { 
          animation: glf-orbitCCW 16s linear infinite; 
          transform-origin: 280px 280px; 
        }
        @keyframes glf-orbitCW  { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes glf-orbitCCW { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        /* Orbit track rings — spinning on different axes */
        .glf-orbit-track-1 {
          position: absolute; inset: 25px; border-radius: 50%;
          border: 1px solid rgba(16,185,129,0.2);
          pointer-events: none;
          animation: glf-ringSpinX 18s linear infinite;
        }
        .glf-orbit-track-2 {
          position: absolute; inset: 55px; border-radius: 50%;
          border: 1px solid rgba(234,179,8,0.15);
          pointer-events: none;
          animation: glf-ringSpinY 14s linear infinite reverse;
        }
        .glf-orbit-track-3 {
          position: absolute; inset: 85px; border-radius: 50%;
          border: 1px solid rgba(16,185,129,0.12);
          pointer-events: none;
          animation: glf-ringSpinZ 20s linear infinite;
        }
        @keyframes glf-ringSpinX {
          from { transform: rotateX(0deg) rotateZ(0deg); }
          to   { transform: rotateX(360deg) rotateZ(60deg); }
        }
        @keyframes glf-ringSpinY {
          from { transform: rotateY(0deg) rotateZ(0deg); }
          to   { transform: rotateY(360deg) rotateZ(-45deg); }
        }
        @keyframes glf-ringSpinZ {
          from { transform: rotateZ(0deg) rotateX(0deg); }
          to   { transform: rotateZ(360deg) rotateX(30deg); }
        }

        /* ===== ORBITING ELEMENT ===== */
        .glf-btc-arm {
          position: absolute; inset: 0; 
          animation: glf-btcOrbit 7s linear infinite; 
          pointer-events: none;
        }
        @keyframes glf-btcOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .glf-btc {
          position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
          width: 50px; height: 50px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ffe066 0%, #DAA520 55%, #8B6914 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; font-weight: 900; color: #3a2000;
          box-shadow: 0 0 20px rgba(255,215,0,1), 0 0 50px rgba(255,215,0,0.6), 0 0 90px rgba(255,215,0,0.2);
          animation: glf-btcGlow 2s ease-in-out infinite alternate, glf-btcSelfSpin 4s linear infinite;
        }
        @keyframes glf-btcGlow {
          from { box-shadow: 0 0 20px rgba(255,215,0,1), 0 0 50px rgba(255,215,0,0.6); }
          to   { box-shadow: 0 0 28px rgba(255,215,0,1), 0 0 80px rgba(255,215,0,1), 0 0 130px rgba(255,215,0,0.4); }
        }
        @keyframes glf-btcSelfSpin {
          from { transform: translateX(-50%) rotateY(0deg); }
          to   { transform: translateX(-50%) rotateY(360deg); }
        }

        /* ===== 3D COIN ===== */
        .glf-scene {
          width: min(340px, 60vw); height: min(340px, 60vw);
          perspective: 900px; position: relative; z-index: 5; cursor: grab;
        }
        .glf-scene:active { cursor: grabbing; }
        .glf-coin {
          width: 100%; height: 100%; transform-style: preserve-3d;
          animation: glf-coinSpin 9s linear infinite;
        }
        .glf-coin:hover { animation-play-state: paused; }
        @keyframes glf-coinSpin {
          from { transform: rotateY(0deg) rotateX(12deg); }
          to   { transform: rotateY(360deg) rotateX(12deg); }
        }

        /* Green glow ring behind coin */
        .glf-coin-glow {
          position: absolute;
          inset: -20px;
          border-radius: 50%;
          z-index: 3;
          pointer-events: none;
          animation: glf-coinGlowPulse 2.5s ease-in-out infinite;
        }
        @keyframes glf-coinGlowPulse {
          0%, 100% {
            box-shadow: 0 0 40px rgba(16,185,129,0.3), 0 0 80px rgba(16,185,129,0.15), inset 0 0 30px rgba(16,185,129,0.1);
          }
          50% {
            box-shadow: 0 0 70px rgba(16,185,129,0.5), 0 0 140px rgba(16,185,129,0.25), 0 0 200px rgba(16,185,129,0.1), inset 0 0 50px rgba(16,185,129,0.15);
          }
        }

        .glf-edge {
          position: absolute; inset: -6px; border-radius: 50%; z-index: -1;
          background: conic-gradient(
            #FFD700 0deg,#8B6914 15deg,#FFD700 30deg,#8B6914 45deg,
            #FFD700 60deg,#8B6914 75deg,#FFD700 90deg,#8B6914 105deg,
            #FFD700 120deg,#8B6914 135deg,#FFD700 150deg,#8B6914 165deg,
            #FFD700 180deg,#8B6914 195deg,#FFD700 210deg,#8B6914 225deg,
            #FFD700 240deg,#8B6914 255deg,#FFD700 270deg,#8B6914 285deg,
            #FFD700 300deg,#8B6914 315deg,#FFD700 330deg,#8B6914 345deg,
            #FFD700 360deg
          );
        }

        .glf-face {
          position: absolute; inset: 0; border-radius: 50%;
          backface-visibility: hidden; overflow: hidden;
          box-shadow: 0 0 0 5px #c8960a, 0 0 0 9px #5a3e00,
            0 0 60px rgba(255,200,0,0.45), 0 0 120px rgba(255,200,0,0.15);
        }
        .glf-face-front { transform: translateZ(9px); }
        .glf-face-back  { transform: rotateY(180deg) translateZ(9px); }
        .glf-face img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
        .glf-shine {
          position: absolute; inset: 0; border-radius: 50%; z-index: 3; pointer-events: none;
          background: linear-gradient(130deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 30%, transparent 60%);
        }

        .glf-brand { margin-top: 24px; text-align: center; position: relative; z-index: 10; }
        .glf-brand-glyph {
          font-family: 'Cinzel Decorative', serif; font-size: clamp(24px, 6vw, 40px);
          font-weight: 900; letter-spacing: 6px;
          background: linear-gradient(180deg, #FFE566 0%, #DAA520 45%, #8B6914 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; color: transparent;
          filter: drop-shadow(0 0 14px rgba(218,165,32,0.5));
        }
        .glf-brand-sub {
          font-family: 'Cinzel', serif; font-size: clamp(9px, 2vw, 13px);
          color: rgba(16,185,129,0.9) !important; letter-spacing: 14px;
          text-transform: uppercase; margin-top: 5px;
          filter: drop-shadow(0 0 8px rgba(16,185,129,0.6));
          -webkit-text-fill-color: rgba(16,185,129,0.9);
          animation: glf-subGlow 3s ease-in-out infinite;
        }
        @keyframes glf-subGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(16,185,129,0.4)); }
          50% { filter: drop-shadow(0 0 14px rgba(16,185,129,0.8)); }
        }

        .glf-ticker-wrap {
          position: relative; z-index: 10; width: 100%; max-width: 620px;
          overflow: hidden; margin-top: 20px;
          border-top: 1px solid rgba(218,165,32,0.2);
          border-bottom: 1px solid rgba(218,165,32,0.2);
          padding: 6px 0;
        }
        .glf-ticker-track {
          display: flex; white-space: nowrap; animation: glf-ticker 28s linear infinite;
          font-family: 'Cinzel', serif; font-size: 8.5px;
          color: #b8860b !important; letter-spacing: 2px;
          -webkit-text-fill-color: #b8860b;
        }
        @keyframes glf-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .glf-ti { padding: 0 18px; }
        .glf-td { color: rgba(16,185,129,0.7) !important; -webkit-text-fill-color: rgba(16,185,129,0.7); padding: 0 8px; }

        @media (max-width: 640px) {
          .glf-stage { width: 320px; height: 320px; }
          .glf-scene { width: 200px; height: 200px; }
          .glf-btc { width: 32px; height: 32px; font-size: 16px; top: 16px; }
          .glf-orbit-track-1 { inset: 14px; }
          .glf-orbit-track-2 { inset: 34px; }
          .glf-orbit-track-3 { inset: 54px; }
          .glf-green-pulse { width: 300px; height: 300px; }
        }
      `}</style>

      <div ref={starsRef} className="glf-stars" />

      <div className="glf-stage">
        {/* Green pulse glow behind everything */}
        <div className="glf-green-pulse" />

        {/* Multi-axis spinning orbit tracks */}
        <div className="glf-orbit-track-1" />
        <div className="glf-orbit-track-2" />
        <div className="glf-orbit-track-3" />

        {/* Orbit text rings — corrected verbiage */}
        <svg className="glf-orbit-svg" viewBox="0 0 560 560" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="glfOuterPath" d="M280,280 m-248,0 a248,248 0 1,1 496,0 a248,248 0 1,1 -496,0"/>
            <path id="glfInnerPath" d="M280,280 m-214,0 a214,214 0 1,0 428,0 a214,214 0 1,0 -428,0"/>
          </defs>
          <g className="glf-orbit-outer">
            <text fontFamily="Cinzel,serif" fontSize="11" fill="rgba(218,165,32,0.8)" letterSpacing="3">
              <textPath href="#glfOuterPath">GLYPHLOCK FINANCIAL LLC &nbsp;◆&nbsp; AZ REGISTERED ENTITY &nbsp;◆&nbsp; PATENT PENDING #18/584,961 &nbsp;◆&nbsp; VENUE QUALIFICATION ARCHITECTURE &nbsp;◆&nbsp; PCI DSS ALIGNED &nbsp;◆&nbsp; SOC 2 ALIGNED &nbsp;◆&nbsp; INDEPENDENTLY STRUCTURED &nbsp;◆&nbsp;</textPath>
            </text>
          </g>
          <g className="glf-orbit-inner">
            <text fontFamily="Cinzel,serif" fontSize="9.5" fill="rgba(16,185,129,0.75)" letterSpacing="2.5">
              <textPath href="#glfInnerPath">ZERO BREACH RECORD &nbsp;◆&nbsp; END-TO-END ENCRYPTED &nbsp;◆&nbsp; MULTI-SIGNATURE PROTECTED &nbsp;◆&nbsp; ISO 27001 ALIGNED &nbsp;◆&nbsp; GDPR ALIGNED &nbsp;◆&nbsp; HIPAA ALIGNED &nbsp;◆&nbsp; AES-256 &nbsp;◆&nbsp; TLS 1.3 &nbsp;◆&nbsp;</textPath>
            </text>
          </g>
        </svg>

        {/* Orbiting gold element */}
        <div className="glf-btc-arm">
          <div className="glf-btc">₿</div>
        </div>

        {/* 3D Coin with green glow */}
        <div className="glf-scene">
          <div className="glf-coin-glow" />
          <div className="glf-coin">
            <div className="glf-edge" />
            <div className="glf-face glf-face-front">
              <img src={GL_COIN_URL} alt="GlyphLock Financial GL Coin" />
              <div className="glf-shine" />
            </div>
            <div className="glf-face glf-face-back">
              <img src={SHIELD_LOGO_URL} alt="GlyphLock Financial Shield" />
              <div className="glf-shine" />
            </div>
          </div>
        </div>
      </div>

      {/* Brand text */}
      <div className="glf-brand">
        <div className="glf-brand-glyph">GLYPHLOCK</div>
        <div className="glf-brand-sub">FINANCIAL</div>
      </div>

      {/* Scrolling ticker — corrected verbiage */}
      <div className="glf-ticker-wrap">
        <div className="glf-ticker-track">
          {[1, 2].map(k => (
            <React.Fragment key={k}>
              <span className="glf-ti">AZ REGISTERED ENTITY</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">PATENT PENDING #18/584,961</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">NUPS POS SYSTEM</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">DREAM DOLLAR PRESS</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">BLOCKCHAIN VERIFIED</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">PCI DSS ALIGNED</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">SOC 2 ALIGNED</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">AES-256 ENCRYPTED</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">ISO 27001 ALIGNED</span>
              <span className="glf-td">▲</span>
              <span className="glf-ti">ZERO BREACH RECORD</span>
              <span className="glf-td">▲</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}