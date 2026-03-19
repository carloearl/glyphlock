import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, ChevronRight, Music2, Zap, DollarSign, Users,
  BarChart3, Clock, Star, Lock, Scan, Package, Fingerprint
} from "lucide-react";

const ROW_1 = [
  "GlyphBucks", "GlyphCoin", "VIP Contracts", "Payroll Engine",
  "Staff Clock-In", "DJ Integration", "Dream Palace",
];
const ROW_2 = [
  "Entertainer Payouts", "Live Analytics", "Barcode Scanner",
  "Shift Management", "Inventory Control", "POS System",
];

const MODULES = [
  { icon: BarChart3, label: "POS System", sub: "Real-time sales", color: "#7c3aed", glow: "rgba(124,58,237,0.5)" },
  { icon: DollarSign, label: "GlyphBucks", sub: "Club currency", color: "#d97706", glow: "rgba(217,119,6,0.5)" },
  { icon: Star, label: "VIP Contracts", sub: "Digital signing", color: "#ec4899", glow: "rgba(236,72,153,0.5)" },
  { icon: Users, label: "Staff Hub", sub: "RBAC management", color: "#0891b2", glow: "rgba(8,145,178,0.5)" },
  { icon: Music2, label: "DJ Studio", sub: "Integrated mixer", color: "#06b6d4", glow: "rgba(6,182,212,0.5)" },
  { icon: Clock, label: "Time Clock", sub: "Shift tracking", color: "#16a34a", glow: "rgba(22,163,74,0.5)" },
  { icon: Fingerprint, label: "Biometrics", sub: "ID verification", color: "#9333ea", glow: "rgba(147,51,234,0.5)" },
  { icon: Scan, label: "Barcode Scan", sub: "Bill scanning", color: "#f59e0b", glow: "rgba(245,158,11,0.5)" },
  { icon: Package, label: "Inventory", sub: "Stock control", color: "#64748b", glow: "rgba(100,116,139,0.5)" },
];

function MarqueeRow({ items, speed = 40, reverse = false }) {
  const [pos, setPos] = useState(0);
  const tripled = [...items, ...items, ...items];
  const itemW = 200;
  const totalW = items.length * itemW;

  useEffect(() => {
    const id = setInterval(() => {
      setPos(p => {
        const next = reverse ? p + 0.6 : p - 0.6;
        if (!reverse && Math.abs(next) >= totalW) return 0;
        if (reverse && next >= 0) return -totalW;
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [totalW, reverse]);

  return (
    <div className="overflow-hidden w-full" style={{ maskImage: 'linear-gradient(90deg, transparent, black 10%, black 90%, transparent)' }}>
      <div className="flex" style={{ transform: `translateX(${pos}px)`, willChange: 'transform' }}>
        {tripled.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2 mx-2 rounded-full"
            style={{
              width: `${itemW - 16}px`,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(167,139,250,0.2)',
            }}
          >
            <Zap size={10} className="text-violet-400 flex-shrink-0" />
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-violet-300/70 truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Waveform({ beat }) {
  return (
    <div className="flex items-end justify-center gap-[2px] h-12 pointer-events-none">
      {Array.from({ length: 40 }).map((_, i) => {
        const h = 4 + Math.abs(Math.sin((i + beat * 2.5) * 0.5)) * 36 + Math.abs(Math.sin((i * 0.3 + beat))) * 10;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-150"
            style={{
              height: `${h}px`,
              background: `linear-gradient(to top, #7c3aed, #a78bfa, #c4b5fd)`,
              opacity: 0.6 + Math.abs(Math.sin(i * 0.4 + beat)) * 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

export default function NUPSLanding() {
  const navigate = useNavigate();
  const [beat, setBeat] = useState(0);
  const [hoveredMod, setHoveredMod] = useState(null);
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Enter") navigate("/NUPSLogin"); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  useEffect(() => {
    const id = setInterval(() => setBeat(b => (b + 1) % 100), 120);
    return () => clearInterval(id);
  }, []);

  // Occasional glitch effect on title
  useEffect(() => {
    const id = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 180);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden select-none">

      {/* ── DEEP SPACE BASE ── */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(91,33,182,0.25) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(29,78,216,0.2) 0%, transparent 50%), #000' }} />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{ backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,1) 3px, rgba(255,255,255,1) 4px)' }} />

      {/* Ambient orbs */}
      <div className="absolute top-[-5%] left-[-5%] w-[600px] h-[600px] rounded-full bg-violet-700/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-blue-700/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12), transparent)', filter: 'blur(60px)' }} />

      {/* ── TOP STATUS BAR ── */}
      <div className="relative z-30 flex items-center justify-between px-5 py-2 border-b"
        style={{ background: 'rgba(0,0,0,0.7)', borderColor: 'rgba(139,92,246,0.2)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-green-400">SYSTEM ONLINE</span>
        </div>
        <span className="text-[10px] font-mono text-violet-400/60 tracking-widest">N.U.P.S. v3.1 · GLYPHLOCK FINANCIAL LLC</span>
        <div className="flex items-center gap-1.5">
          <Lock size={10} className="text-violet-400/60" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-violet-400/60">ENCRYPTED</span>
        </div>
      </div>

      {/* ── DUAL MARQUEE ── */}
      <div className="relative z-20 py-3 space-y-2 border-b" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(139,92,246,0.1)' }}>
        <MarqueeRow items={ROW_1} speed={40} reverse={false} />
        <MarqueeRow items={ROW_2} speed={35} reverse={true} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* LOGO + TITLE */}
        <div className="text-center mb-10">
          {/* Animated shield */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-3xl blur-3xl" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.6), transparent)', transform: 'scale(1.8)' }} />
            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5b21b6, #4f46e5)', boxShadow: '0 0 50px rgba(124,58,237,0.7), 0 0 100px rgba(124,58,237,0.3)', border: '1px solid rgba(167,139,250,0.4)' }}>
              <Shield size={36} className="text-white drop-shadow-lg" />
            </div>
          </div>

          <p className="text-[9px] font-black tracking-[0.6em] uppercase text-violet-400/70 mb-3">
            GlyphLock Financial LLC
          </p>

          {/* Glitch title */}
          <div className="relative inline-block">
            <h1
              className="text-7xl md:text-8xl font-black tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, #c4b5fd, #a78bfa, #818cf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 40px rgba(167,139,250,0.6))`,
                ...(glitching ? {
                  textShadow: '2px 0 #ff00ff, -2px 0 #00ffff',
                  transform: 'skewX(-2deg)',
                } : {})
              }}
            >
              N.U.P.S.
            </h1>
            {glitching && (
              <h1 className="absolute inset-0 text-7xl md:text-8xl font-black tracking-tight leading-none opacity-30"
                style={{ color: '#00ffff', transform: 'translate(-3px, 1px)', mixBlendMode: 'screen' }}>
                N.U.P.S.
              </h1>
            )}
          </div>

          <p className="text-[11px] tracking-[0.5em] uppercase font-semibold mt-2" style={{ color: 'rgba(167,139,250,0.5)' }}>
            Nexus Unified Portal System
          </p>

          <p className="text-slate-400 text-sm md:text-base mt-5 max-w-md mx-auto leading-relaxed">
            The all-in-one operational backbone for{" "}
            <span className="text-violet-300 font-semibold">entertainment venues</span> —
            every dollar tracked, every beat logged, every shift secured.
          </p>
        </div>

        {/* WAVEFORM */}
        <div className="w-full max-w-sm mb-8">
          <Waveform beat={beat} />
        </div>

        {/* MODULE GRID — holographic cards */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8">
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const isHovered = hoveredMod === i;
            return (
              <div
                key={i}
                className="rounded-xl p-3 flex flex-col items-center gap-2 cursor-default transition-all duration-300"
                onMouseEnter={() => setHoveredMod(i)}
                onMouseLeave={() => setHoveredMod(null)}
                style={{
                  background: isHovered ? `rgba(${mod.color === '#7c3aed' ? '124,58,237' : '255,255,255'},0.07)` : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${isHovered ? mod.color + '66' : 'rgba(255,255,255,0.07)'}`,
                  boxShadow: isHovered ? `0 0 25px ${mod.glow}` : 'none',
                  transform: isHovered ? 'translateY(-2px) scale(1.03)' : 'none',
                }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isHovered ? mod.color : 'rgba(255,255,255,0.06)',
                    boxShadow: isHovered ? `0 0 20px ${mod.glow}` : 'none',
                  }}>
                  <Icon size={17} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black tracking-wider uppercase text-gray-300 leading-tight">{mod.label}</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">{mod.sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* DJ TEASER */}
        <div className="w-full max-w-lg mb-6 rounded-xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(8,145,178,0.08), rgba(6,182,212,0.05))', border: '1px solid rgba(6,182,212,0.2)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)' }} />
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 0 15px rgba(6,182,212,0.5)' }}>
              <Music2 size={15} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black tracking-widest uppercase text-cyan-400">Coming Soon</p>
              <p className="text-xs text-gray-500">GlyphMixer DJ Studio — integrated directly into NUPS</p>
            </div>
            <div className="flex items-end gap-[3px] h-6">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="w-[3px] rounded-full transition-all duration-150"
                  style={{ height: `${beat % 5 === i ? 22 : 8 + Math.abs(Math.sin(i + beat * 0.3)) * 10}px`, background: '#06b6d4', opacity: 0.7 }} />
              ))}
            </div>
          </div>
        </div>

        {/* SECURITY NOTICE */}
        <div className="w-full max-w-lg mb-8 flex items-start gap-2.5 rounded-xl px-4 py-3"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <Shield size={13} className="text-amber-500/60 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-amber-400/60 leading-relaxed">
            Access restricted to authorized personnel only. All sessions are logged, audited, and encrypted end-to-end.
          </p>
        </div>

        {/* CTA BUTTON */}
        <div className="relative group">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: '0 0 0 1px rgba(139,92,246,0.4), 0 0 60px rgba(124,58,237,0.4)', borderRadius: '14px' }} />

          <button
            onClick={() => navigate("/NUPSLogin")}
            className="relative h-14 px-12 text-lg font-black rounded-2xl flex items-center gap-2 transition-all duration-200 active:scale-95 group-hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
              border: '1px solid rgba(167,139,250,0.3)',
            }}
          >
            {/* Shine sweep */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
            </div>
            <span className="relative">Enter N.U.P.S.</span>
            <ChevronRight size={20} className="relative" />
          </button>
        </div>

        <p className="mt-6 text-[9px] font-mono tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.1)' }}>
          PRESS ENTER · SECURED BY GLYPHLOCK · AES-256 · TLS 1.3
        </p>
      </div>

      {/* ── BOTTOM WAVEFORM FLOOR ── */}
      <div className="relative z-10 h-20 flex items-end justify-center gap-[2px] px-6 pointer-events-none overflow-hidden border-t"
        style={{ borderColor: 'rgba(139,92,246,0.1)', background: 'rgba(0,0,0,0.4)' }}>
        {Array.from({ length: 80 }).map((_, i) => {
          const h = 4 + Math.abs(Math.sin((i + beat * 2) * 0.35)) * 50 + Math.abs(Math.cos(i * 0.2 + beat * 0.5)) * 15;
          return (
            <div key={i} className="rounded-t-sm flex-shrink-0 transition-all duration-100"
              style={{ width: '2px', height: `${Math.min(h, 64)}px`, background: `hsl(${255 + i * 1.5}, 75%, ${50 + i * 0.2}%)`, opacity: 0.25 + Math.abs(Math.sin(i * 0.3 + beat * 0.2)) * 0.35 }} />
          );
        })}
      </div>
    </div>
  );
}