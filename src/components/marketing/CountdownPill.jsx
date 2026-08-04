import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Lock, Rocket, Check, Circle, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ─── CONSTANTS ───
const BETA_START_UTC = Date.UTC(2026, 0, 1, 7, 0, 0);
const GLYPHS_STR = '◆◇◈◉◊○●◐◑◒◓◔◕◖◗◘◙◚◛◜◝◞◟◠◡◢◣◤◥◦◧◨◩◪◫◬◭◮◯';
const CODE_SNIPPETS = ['0x', '1A', 'FF', 'A3', 'E9', '7C', 'B2', 'D4', '5F', '8E'];

const pad = (n) => n.toString().padStart(2, "0");

// System is now ACTIVE — no more countdown
function getCountdown() {
  return { launched: true, d: 0, h: 0, m: 0, s: 0 };
}

function getUptime() {
  const diff = Date.now() - BETA_START_UTC;
  if (diff <= 0) return "0D 0H 0M";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  return `${d}D ${h}H ${m}M`;
}

// ─── NEURAL NETWORK CANVAS ───
function NeuralCanvas({ containerRef }) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Init nodes
    nodesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.5,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const nodes = nodesRef.current;

      // Connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(79,70,229,${(1 - dist / 100) * 0.25})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6,182,212,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(6,182,212,0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.35, borderRadius: 'inherit' }}
    />
  );
}

// ─── GLYPH MATRIX OVERLAY ───
function GlyphMatrix() {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const isCode = Math.random() > 0.7;
      const id = idRef.current++;
      setItems(prev => [...prev.slice(-25), {
        id,
        text: isCode
          ? CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]
          : GLYPHS_STR[Math.floor(Math.random() * GLYPHS_STR.length)],
        left: Math.random() * 100,
        dur: Math.random() * 6 + 4,
        delay: Math.random() * 2,
      }]);
    };
    const i = setInterval(spawn, 400);
    for (let j = 0; j < 12; j++) spawn();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 'inherit' }}>
      {items.map(g => (
        <span
          key={g.id}
          className="absolute text-[10px] text-cyan-400/20"
          style={{
            left: `${g.left}%`,
            fontFamily: 'monospace',
            textShadow: '0 0 6px rgba(6,182,212,0.4)',
            animation: `glyphFallPill ${g.dur}s ${g.delay}s linear forwards`,
          }}
        >
          {g.text}
        </span>
      ))}
    </div>
  );
}

// ─── DATA STREAMS ───
function DataStreams() {
  const [streams, setStreams] = useState([]);
  const idRef = useRef(0);

  useEffect(() => {
    const spawn = () => {
      const id = idRef.current++;
      setStreams(prev => [...prev.slice(-12), {
        id,
        left: Math.random() * 100,
        dur: Math.random() * 2.5 + 2,
        delay: Math.random() * 1.5,
      }]);
    };
    const i = setInterval(spawn, 700);
    for (let j = 0; j < 8; j++) spawn();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: 'inherit' }}>
      {streams.map(s => (
        <div
          key={s.id}
          className="absolute w-[2px] h-[80px]"
          style={{
            left: `${s.left}%`,
            background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.5), transparent)',
            animation: `streamFlowPill ${s.dur}s ${s.delay}s linear forwards`,
          }}
        />
      ))}
    </div>
  );
}

// ─── AUDIO VISUALIZER BARS ───
function AudioVisualizer() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[50px] flex items-end justify-around px-4 gap-[3px] pointer-events-none opacity-20">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-t-sm"
          style={{
            background: 'linear-gradient(180deg, rgba(6,182,212,1), rgba(124,58,237,1))',
            boxShadow: '0 0 6px rgba(6,182,212,0.5)',
            animation: `audioBarPill ${0.5 + Math.random()}s ${Math.random()}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

// ─── COUNTDOWN BLOCK ───
const CountdownBlock = ({ value, label }) => (
  <div className="relative bg-[#0a0118]/80 border-2 border-indigo-600/40 px-2 py-2 sm:px-3 sm:py-3 min-w-[52px] sm:min-w-[64px] overflow-hidden text-center"
    style={{ clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)' }}
  >
    <div className="absolute inset-0 pointer-events-none" style={{
      background: 'linear-gradient(45deg, transparent, rgba(6,182,212,0.15), transparent)',
      animation: 'shimmerSweepPill 3s linear infinite',
    }} />
    <div className="text-2xl sm:text-3xl md:text-4xl font-black tabular-nums relative z-10"
      style={{
        background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {value}
    </div>
    <div className="text-[8px] sm:text-[9px] uppercase tracking-[0.12em] text-cyan-400 font-bold mt-0.5 relative z-10">{label}</div>
  </div>
);

// ─── STAT MINI ───
const StatMini = ({ value, label }) => (
  <div className="bg-[#0a0118]/60 border-2 border-indigo-600/30 p-3 text-center transition-all duration-300 hover:border-cyan-400/60 hover:shadow-[0_8px_30px_rgba(6,182,212,0.3)] hover:-translate-y-1"
    style={{ clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)' }}
  >
    <div className="text-xl sm:text-2xl font-black"
      style={{
        background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >{value}</div>
    <div className="text-[7px] sm:text-[8px] uppercase tracking-[0.1em] text-white/40 font-semibold mt-0.5">◆ {label}</div>
  </div>
);

// ─── MILESTONES ───
const MILESTONES = [
  { label: "NUPS Core", done: true },
  { label: "POS Register", done: true },
  { label: "Double-Entry GL", done: true },
  { label: "Driver Payouts", done: true },
  { label: "1099 Payroll", done: true },
  { label: "Audit Engine", done: true },
  { label: "BPAAA v3.0", done: true, current: true },
  { label: "Multi-Venue", done: false },
  { label: "Mobile Kiosk", done: false },
  { label: "FULL ROLLOUT", done: false, launch: true },
];

// ─── MAIN COMPONENT ───
export default function CountdownPill() {
  const [t, setT] = useState(getCountdown());
  const [uptime, setUptime] = useState(getUptime());
  const containerRef = useRef(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  useEffect(() => {
    const i = setInterval(() => {
      setT(getCountdown());
      setUptime(getUptime());
    }, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div ref={ref} className="w-full flex justify-center mt-6 mb-4 px-3 sm:px-4 select-none">
      {/* Keyframes */}
      <style>{`
        @keyframes glyphFallPill {
          0% { transform: translateY(-20px); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(600px); opacity: 0; }
        }
        @keyframes streamFlowPill {
          0% { transform: translateY(-100px); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(600px); opacity: 0; }
        }
        @keyframes audioBarPill {
          0% { height: 15%; }
          100% { height: 80%; }
        }
        @keyframes shimmerSweepPill {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(200%); }
        }
        @keyframes scanlinePill {
          0% { transform: translateY(0); }
          100% { transform: translateY(20px); }
        }
        @keyframes orbitalSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes emPulsePill {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.08); opacity: 0.4; }
        }
        @keyframes hexPulsePill {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }
        @keyframes statusPulsePill {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px currentColor; }
          50% { transform: scale(1.3); box-shadow: 0 0 20px currentColor; }
        }
        @keyframes liveBadgeSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradShift {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        @keyframes shimmerText {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
        @keyframes progressShinePill {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>

      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[1200px] w-full overflow-hidden"
        style={{
          background: 'rgba(10,1,24,0.95)',
          border: '3px solid transparent',
          borderImage: 'linear-gradient(90deg, #4f46e5, #06b6d4, #7c3aed, #ec4899) 1',
          borderRadius: '60px',
          padding: '2rem 2.5rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 80px rgba(6,182,212,0.2), 0 0 60px rgba(79,70,229,0.3), inset 0 0 80px rgba(6,182,212,0.03)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── BG LAYERS ── */}
        {/* Orbital rings */}
        <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: 'inherit' }}>
          <div className="absolute inset-[-5%] border-[2px] border-transparent rounded-[80px] opacity-30 pointer-events-none"
            style={{ borderTopColor: '#06b6d4', borderRightColor: '#7c3aed', animation: 'orbitalSpin 8s linear infinite' }} />
          <div className="absolute inset-[-8%] border-[2px] border-transparent rounded-[80px] opacity-20 pointer-events-none"
            style={{ borderTopColor: '#7c3aed', borderRightColor: '#ec4899', animation: 'orbitalSpin 12s linear infinite reverse' }} />
        </div>

        {/* EM field */}
        <div className="absolute inset-[-10%] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 50%)',
            filter: 'blur(40px)',
            animation: 'emPulsePill 4s ease-in-out infinite',
          }} />

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            borderRadius: 'inherit',
            background: 'repeating-linear-gradient(0deg, rgba(6,182,212,0.02) 0px, transparent 2px, transparent 4px)',
            animation: 'scanlinePill 8s linear infinite',
          }} />

        {/* Circuit grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            borderRadius: 'inherit',
            backgroundImage: 'linear-gradient(90deg, transparent 49%, rgba(6,182,212,0.08) 49%, rgba(6,182,212,0.08) 51%, transparent 51%), linear-gradient(0deg, transparent 49%, rgba(6,182,212,0.08) 49%, rgba(6,182,212,0.08) 51%, transparent 51%)',
            backgroundSize: '40px 40px',
          }} />

        {/* Hex grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 'inherit',
            backgroundImage: 'linear-gradient(30deg, rgba(79,70,229,0.03) 12%, transparent 12.5%, transparent 87%, rgba(79,70,229,0.03) 87.5%), linear-gradient(150deg, rgba(79,70,229,0.03) 12%, transparent 12.5%, transparent 87%, rgba(79,70,229,0.03) 87.5%)',
            backgroundSize: '40px 70px',
            backgroundPosition: '0 0, 20px 35px',
            animation: 'hexPulsePill 8s ease-in-out infinite',
          }} />

        {/* Nebulas */}
        <div className="absolute top-[-30%] left-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[-30%] right-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full pointer-events-none opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', filter: 'blur(60px)' }} />

        <NeuralCanvas containerRef={containerRef} />
        <GlyphMatrix />
        <DataStreams />
        <AudioVisualizer />

        {/* ── CONTENT ── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-center">

          {/* LEFT */}
          <div className="text-center lg:text-left">
            {/* Status bar */}
            <div className="flex flex-col gap-1.5 mb-4 items-center lg:items-start">
              {[
                { color: '#10b981', text: 'PLATFORM ONLINE' },
                { color: '#06b6d4', text: 'ZERO-TRUST ACTIVE' },
                { color: '#7c3aed', text: uptime },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-white/50">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                    style={{ background: s.color, boxShadow: `0 0 10px ${s.color}`, animation: 'statusPulsePill 2s ease-in-out infinite' }} />
                  {s.text}
                </div>
              ))}
            </div>

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-[10px] font-black tracking-[0.15em] text-emerald-400 uppercase"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '2px solid rgba(16,185,129,0.5)',
                clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
              }}
            >
              <span style={{ display: 'inline-block', animation: 'liveBadgeSpin 3s linear infinite' }}>◆</span>
              SYSTEMS LIVE
            </div>

            {/* Header tagline — above the GlyphLock banner */}
            <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.05em] text-violet-400 leading-relaxed font-mono mb-3">
              QUANTUM-RESISTANT SECURITY · PROTECTING DATA, IDENTITY &amp; DIGITAL ASSETS<br />
              TECHNOLOGY SERVICES BUILT AROUND YOUR OPERATIONS
            </p>

            {/* Title */}
            <div className="mb-2">
              <span className="block text-base sm:text-lg md:text-xl font-black uppercase"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  background: 'linear-gradient(90deg, #06b6d4, #4f46e5, #7c3aed)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'gradShift 4s linear infinite',
                  filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.4))',
                }}
              >GLYPHLOCK</span>
              <span className="block text-xl sm:text-2xl md:text-3xl font-black uppercase"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  background: 'linear-gradient(135deg, #fff 0%, #06b6d4 30%, #7c3aed 70%, #fff 100%)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: 'shimmerText 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 15px rgba(124,58,237,0.4))',
                }}
              >SECURITY PLATFORM</span>
            </div>

            <p className="text-[11px] sm:text-xs font-semibold text-white/80 mb-2">
              <span className="text-emerald-400 font-black" style={{ textShadow: '0 0 15px rgba(16,185,129,0.6)' }}>NOW ACTIVE</span>
            </p>

            <p className="text-[10px] sm:text-[11px] text-white/60 leading-relaxed max-w-md mx-auto lg:mx-0">
              GlyphLock provides custom technology services for venues, studios, and business
              operators — combining computer systems, security, DevOps, systems integration, and
              implementation of the GlyphLock and NUPS platforms.
            </p>
          </div>

          {/* CENTER — ACTIVE STATUS */}
          <div className="flex flex-col items-center px-0 lg:px-5 py-4 lg:py-0 border-t lg:border-t-0 lg:border-l lg:border-r border-indigo-600/20">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="relative">
                <span className="block text-5xl sm:text-6xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #4f46e5, #7c3aed)',
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'shimmerText 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.6))',
                  }}
                >ACTIVE</span>
                <span className="absolute -top-2 -right-3 w-3 h-3 rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 15px #10b981', animation: 'statusPulsePill 1.5s ease-in-out infinite' }} />
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold font-mono">
                ◆ SYSTEM ONLINE ◆
              </div>
            </div>

            {/* Progress */}
            <div className="w-full max-w-[260px]">
              <div className="flex justify-between text-[8px] sm:text-[9px] uppercase tracking-[0.1em] text-white/40 mb-2 font-mono">
                <span>◆ OPERATIONAL</span>
                <span className="text-emerald-400 font-black">100%</span>
              </div>
              <div className="relative h-[5px] bg-indigo-900/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative"
                  style={{ background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #10b981)', boxShadow: '0 0 15px rgba(6,182,212,0.5)' }}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: '100%' } : { width: 0 }}
                  transition={{ delay: 0.8, duration: 2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="absolute top-0 h-full w-full"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                      animation: 'progressShinePill 2s linear infinite',
                    }} />
                </motion.div>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="text-center lg:text-right">
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
              <StatMini value="QR" label="VERIFICATION" />
              <StatMini value="AI" label="DEFENSE" />
              <StatMini value="256" label="SHA HASHING" />
              <StatMini value="24/7" label="MONITORING" />
            </div>

            <div className="flex gap-3 justify-center lg:justify-end mb-3">
              <Link
                to={createPageUrl('SecurityTools')}
                className="inline-block px-5 py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.1em] text-black no-underline relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
                  clipPath: 'polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)',
                  boxShadow: '0 8px 30px rgba(6,182,212,0.4)',
                  transition: 'all 0.3s ease',
                }}
              >
                <span className="relative z-10">◆ SECURITY TOOLS ◆</span>
              </Link>
              <Link
                to={createPageUrl('CommandCenter')}
                className="inline-block px-4 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] text-cyan-400 border-2 border-cyan-400/60 no-underline"
                style={{
                  clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)',
                  transition: 'all 0.3s ease',
                }}
              >
                <span className="relative z-10">COMMAND CENTER</span>
              </Link>
            </div>

            <div className="text-[8px] sm:text-[9px] text-white/25 font-mono">
              OPERATIONAL SINCE <span className="text-cyan-400/60">JAN 1, 2026</span><br />
              QUANTUM-RESISTANT · ZERO-TRUST
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}