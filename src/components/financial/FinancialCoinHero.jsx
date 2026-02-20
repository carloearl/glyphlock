import React, { useEffect, useRef } from "react";

export default function FinancialCoinHero() {
  const canvasRef = useRef(null);

  // Starfield on canvas for performance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 1.5 + 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.8,
    }));

    let raf;
    const draw = (t) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      stars.forEach((s) => {
        const alpha = 0.15 + 0.55 * Math.abs(Math.sin(s.phase + t * 0.001 * s.speed));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  const SHIELD = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";
  const COIN = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/b001ff48e_ChatGPTImageFeb6202606_25_17PM.png";

  return (
    <div className="glf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;600;700&display=swap');

        .glf-root {
          position: relative; width: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 16px 32px;
          overflow: hidden; font-family: 'Cinzel', serif;
          background: radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,40,20,0.6) 0%, transparent 70%);
        }

        .glf-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; }

        /* ====== MASSIVE NEON GREEN AURA ====== */
        .glf-neon-aura {
          position: absolute; width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle,
            rgba(0,255,128,0.25) 0%,
            rgba(0,255,100,0.12) 25%,
            rgba(0,200,80,0.06) 45%,
            transparent 65%
          );
          filter: blur(30px);
          animation: glf-auraPulse 3s ease-in-out infinite;
          pointer-events: none; z-index: 1;
        }
        .glf-neon-aura-2 {
          position: absolute; width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle,
            rgba(0,255,100,0.35) 0%,
            rgba(16,255,80,0.15) 35%,
            transparent 60%
          );
          filter: blur(15px);
          animation: glf-auraPulse2 2.5s ease-in-out infinite;
          pointer-events: none; z-index: 1;
        }
        @keyframes glf-auraPulse {
          0%, 100% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes glf-auraPulse2 {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        /* ====== STAGE ====== */
        .glf-stage {
          position: relative; width: min(580px, 92vw); height: min(580px, 92vw);
          display: flex; align-items: center; justify-content: center;
          z-index: 2; perspective: 1400px; transform-style: preserve-3d;
        }

        /* ====== ORBIT TRACKS — glowing rings ====== */
        .glf-ring { position: absolute; border-radius: 50%; pointer-events: none; }
        .glf-ring-1 {
          inset: 10px; border: 1.5px solid rgba(0,255,128,0.25);
          box-shadow: 0 0 12px rgba(0,255,128,0.15), inset 0 0 12px rgba(0,255,128,0.08);
          animation: glf-rCW 28s linear infinite;
          transform: rotateX(75deg);
        }
        .glf-ring-2 {
          inset: 40px; border: 1px solid rgba(255,215,0,0.2);
          box-shadow: 0 0 8px rgba(255,215,0,0.12), inset 0 0 8px rgba(255,215,0,0.06);
          animation: glf-rCCW 22s linear infinite;
          transform: rotateX(75deg) rotateZ(60deg);
        }
        .glf-ring-3 {
          inset: 70px; border: 1px solid rgba(0,255,128,0.15);
          box-shadow: 0 0 6px rgba(0,255,128,0.1);
          animation: glf-rCW 32s linear infinite;
          transform: rotateX(75deg) rotateZ(120deg);
        }
        @keyframes glf-rCW  { to { transform: rotateX(75deg) rotateY(360deg); } }
        @keyframes glf-rCCW { to { transform: rotateX(75deg) rotateZ(60deg) rotateY(-360deg); } }

        /* ====== TEXT ORBIT RINGS (SVG) ====== */
        .glf-orbit-svg {
          position: absolute; inset: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 3;
        }
        .glf-txt-outer { animation: glf-txtCW 30s linear infinite; transform-origin: 290px 290px; }
        .glf-txt-inner { animation: glf-txtCCW 22s linear infinite; transform-origin: 290px 290px; }
        @keyframes glf-txtCW  { to { transform: rotate(360deg); } }
        @keyframes glf-txtCCW { to { transform: rotate(-360deg); } }

        /* ====== ORBITING BTC SPHERE ====== */
        .glf-btc-arm {
          position: absolute; inset: 0;
          animation: glf-btcOrbit 8s linear infinite;
          pointer-events: none; z-index: 6;
        }
        @keyframes glf-btcOrbit { to { transform: rotate(360deg); } }
        .glf-btc {
          position: absolute; top: 18px; left: 50%;
          width: 52px; height: 52px; border-radius: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle at 30% 25%, #fff8dc 0%, #FFD700 30%, #DAA520 60%, #8B6914 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; font-weight: 900; color: #3a2000;
          box-shadow:
            inset -4px -4px 8px rgba(0,0,0,0.3),
            inset 4px 4px 8px rgba(255,255,255,0.3),
            0 0 25px rgba(255,215,0,1),
            0 0 60px rgba(255,215,0,0.7),
            0 0 100px rgba(255,215,0,0.3);
          animation: glf-btcPulse 2s ease-in-out infinite alternate;
        }
        @keyframes glf-btcPulse {
          from { box-shadow: inset -4px -4px 8px rgba(0,0,0,0.3), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 25px rgba(255,215,0,1), 0 0 60px rgba(255,215,0,0.7); }
          to   { box-shadow: inset -4px -4px 8px rgba(0,0,0,0.3), inset 4px 4px 8px rgba(255,255,255,0.3), 0 0 35px rgba(255,215,0,1), 0 0 90px rgba(255,215,0,1), 0 0 150px rgba(255,215,0,0.4); }
        }



        /* ====== 3D COIN ====== */
        .glf-scene {
          width: min(320px, 58vw); height: min(320px, 58vw);
          perspective: 1000px; position: relative; z-index: 5; cursor: grab;
        }
        .glf-scene:active { cursor: grabbing; }

        /* HEAVY green glow BEHIND the coin */
        .glf-coin-neon {
          position: absolute; inset: -50px; border-radius: 50%;
          background: radial-gradient(circle,
            rgba(0,255,120,0.4) 0%,
            rgba(0,255,100,0.2) 30%,
            rgba(0,200,80,0.08) 55%,
            transparent 70%
          );
          filter: blur(12px);
          z-index: 1; pointer-events: none;
          animation: glf-coinNeon 2.5s ease-in-out infinite;
        }
        @keyframes glf-coinNeon {
          0%, 100% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }

        .glf-coin {
          width: 100%; height: 100%; transform-style: preserve-3d;
          animation: glf-coinSpin 10s linear infinite;
          position: relative; z-index: 4;
        }
        .glf-coin:hover { animation-play-state: paused; }
        @keyframes glf-coinSpin {
          from { transform: rotateY(0deg) rotateX(10deg); }
          to   { transform: rotateY(360deg) rotateX(10deg); }
        }

        .glf-edge {
          position: absolute; inset: -7px; border-radius: 50%; z-index: -1;
          background: conic-gradient(from 0deg,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700, #8B6914, #FFD700, #8B6914,
            #FFD700
          );
          box-shadow: 0 0 20px rgba(255,200,0,0.4);
        }

        .glf-face {
          position: absolute; inset: 0; border-radius: 50%;
          backface-visibility: hidden; overflow: hidden;
          background: #0a0a0a;
          box-shadow:
            0 0 0 5px #c8960a,
            0 0 0 9px #5a3e00,
            0 0 50px rgba(255,200,0,0.5),
            0 0 100px rgba(255,200,0,0.2);
        }
        .glf-face-front { transform: translateZ(10px); }
        .glf-face-back  { transform: rotateY(180deg) translateZ(10px); position: relative; }
        .glf-face img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; position: relative; z-index: 2; }

        /* ====== HEAVY NEON GREEN BEHIND SHIELD ====== */
        .glf-shield-neon {
          position: absolute; inset: -40px; border-radius: 50%; z-index: 1;
          pointer-events: none;
          background: radial-gradient(circle,
            rgba(0,255,100,0.6) 0%,
            rgba(0,255,80,0.35) 30%,
            rgba(0,200,60,0.15) 55%,
            transparent 70%
          );
          filter: blur(10px);
          animation: glf-shieldNeon 2s ease-in-out infinite;
        }
        @keyframes glf-shieldNeon {
          0%, 100% { opacity: 0.7; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.08); }
        }

        .glf-shine {
          position: absolute; inset: 0; border-radius: 50%; z-index: 5; pointer-events: none;
          background: linear-gradient(125deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 30%, transparent 55%);
        }

        /* ====== BRAND TEXT ====== */
        .glf-brand { margin-top: 28px; text-align: center; position: relative; z-index: 10; }
        .glf-brand-glyph {
          font-family: 'Cinzel Decorative', serif;
          font-size: clamp(28px, 7vw, 48px);
          font-weight: 900; letter-spacing: 8px;
          background: linear-gradient(180deg, #FFF8DC 0%, #FFD700 25%, #DAA520 55%, #8B6914 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; color: transparent;
          filter: drop-shadow(0 0 20px rgba(218,165,32,0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.8));
        }
        .glf-brand-sub {
          font-family: 'Cinzel', serif; font-size: clamp(10px, 2.5vw, 15px);
          letter-spacing: 16px; text-transform: uppercase; margin-top: 6px;
          color: #00ff88 !important; -webkit-text-fill-color: #00ff88;
          text-shadow: 0 0 20px rgba(0,255,100,0.8), 0 0 40px rgba(0,255,100,0.4);
          animation: glf-subPulse 3s ease-in-out infinite;
        }
        @keyframes glf-subPulse {
          0%, 100% { text-shadow: 0 0 15px rgba(0,255,100,0.6), 0 0 30px rgba(0,255,100,0.3); }
          50% { text-shadow: 0 0 30px rgba(0,255,100,1), 0 0 60px rgba(0,255,100,0.6), 0 0 100px rgba(0,255,100,0.2); }
        }

        /* ====== TICKER ====== */
        .glf-ticker-wrap {
          position: relative; z-index: 10; width: 100%; max-width: 680px;
          overflow: hidden; margin-top: 24px;
          border-top: 1px solid rgba(218,165,32,0.25);
          border-bottom: 1px solid rgba(218,165,32,0.25);
          padding: 8px 0;
          background: linear-gradient(90deg, transparent, rgba(0,255,100,0.03), transparent);
        }
        .glf-ticker-track {
          display: flex; white-space: nowrap;
          animation: glf-ticker 30s linear infinite;
          font-family: 'Cinzel', serif; font-size: 9px;
          color: #DAA520 !important; letter-spacing: 2.5px;
          -webkit-text-fill-color: #DAA520;
        }
        @keyframes glf-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .glf-ti { padding: 0 20px; }
        .glf-td { color: #00ff88 !important; -webkit-text-fill-color: #00ff88; padding: 0 8px; font-size: 7px; }

        /* ====== MOBILE ====== */
        @media (max-width: 640px) {
          .glf-root { padding: 40px 12px 20px; }
          .glf-stage { width: 340px; height: 340px; }
          .glf-scene { width: 200px; height: 200px; }
          .glf-btc { width: 36px; height: 36px; font-size: 18px; top: 10px; }
          .glf-em { width: 20px; height: 20px; bottom: 20px; }
          .glf-ring-1 { inset: 6px; }
          .glf-ring-2 { inset: 24px; }
          .glf-ring-3 { inset: 42px; }
          .glf-neon-aura { width: 400px; height: 400px; }
          .glf-neon-aura-2 { width: 300px; height: 300px; }
          .glf-coin-neon { inset: -30px; }
          .glf-shield-neon { inset: -25px; }
        }
      `}</style>

      {/* Canvas starfield */}
      <canvas ref={canvasRef} className="glf-canvas" />

      {/* Massive neon green aura layers */}
      <div className="glf-neon-aura" />
      <div className="glf-neon-aura-2" />

      <div className="glf-stage">
        {/* 3D orbit rings */}
        <div className="glf-ring glf-ring-1" />
        <div className="glf-ring glf-ring-2" />
        <div className="glf-ring glf-ring-3" />

        {/* SVG text orbits */}
        <svg className="glf-orbit-svg" viewBox="0 0 580 580" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <path id="glfO" d="M290,290 m-258,0 a258,258 0 1,1 516,0 a258,258 0 1,1 -516,0"/>
            <path id="glfI" d="M290,290 m-222,0 a222,222 0 1,0 444,0 a222,222 0 1,0 -444,0"/>
          </defs>
          <g className="glf-txt-outer">
            <text fontFamily="Cinzel,serif" fontSize="10.5" fill="rgba(218,165,32,0.75)" letterSpacing="3">
              <textPath href="#glfO">GLYPHLOCK FINANCIAL LLC ◆ AZ REGISTERED ENTITY ◆ PATENT PENDING #18/584,961 ◆ VENUE QUALIFICATION ARCHITECTURE ◆ PCI DSS ALIGNED ◆ SOC 2 ALIGNED ◆ INDEPENDENTLY STRUCTURED ◆</textPath>
            </text>
          </g>
          <g className="glf-txt-inner">
            <text fontFamily="Cinzel,serif" fontSize="9" fill="rgba(0,255,128,0.6)" letterSpacing="2.5">
              <textPath href="#glfI">ZERO BREACH RECORD ◆ END-TO-END ENCRYPTED ◆ MULTI-SIGNATURE PROTECTED ◆ ISO 27001 ALIGNED ◆ GDPR ALIGNED ◆ HIPAA ALIGNED ◆ AES-256 ◆ TLS 1.3 ◆</textPath>
            </text>
          </g>
        </svg>

        {/* Orbiting gold BTC sphere */}
        <div className="glf-btc-arm">
          <div className="glf-btc">₿</div>
        </div>



        {/* 3D Coin */}
        <div className="glf-scene">
          <div className="glf-coin-neon" />
          <div className="glf-coin">
            <div className="glf-edge" />
            <div className="glf-face glf-face-front">
              <img src={COIN} alt="GlyphLock Financial GL Coin" />
              <div className="glf-shine" />
            </div>
            <div className="glf-face glf-face-back">
              <div className="glf-shield-neon" />
              <img src={SHIELD} alt="GlyphLock Financial Shield" />
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

      {/* Scrolling ticker */}
      <div className="glf-ticker-wrap">
        <div className="glf-ticker-track">
          {[1, 2].map(k => (
            <React.Fragment key={k}>
              <span className="glf-ti">AZ REGISTERED ENTITY</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">PATENT PENDING #18/584,961</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">NUPS POS SYSTEM</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">DREAM DOLLAR PRESS</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">BLOCKCHAIN VERIFIED</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">PCI DSS ALIGNED</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">SOC 2 ALIGNED</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">AES-256 ENCRYPTED</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">ISO 27001 ALIGNED</span>
              <span className="glf-td">◆</span>
              <span className="glf-ti">ZERO BREACH RECORD</span>
              <span className="glf-td">◆</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}