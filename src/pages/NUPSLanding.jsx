import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight, Music2, Zap, DollarSign, Users, BarChart3, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const MARQUEE_ITEMS = [
  "POS System", "GlyphBucks", "GlyphCoin", "VIP Contracts", "Payroll Engine",
  "Staff Clock-In", "DJ Integration", "Dream Palace", "Entertainer Payouts",
  "Live Analytics", "Barcode Scanner", "Shift Management", "Inventory Control",
];

const MODULES = [
  { icon: <BarChart3 className="w-5 h-5" />, label: "POS & Sales", color: "from-violet-500 to-purple-600" },
  { icon: <DollarSign className="w-5 h-5" />, label: "GlyphBucks", color: "from-yellow-500 to-orange-500" },
  { icon: <Music2 className="w-5 h-5" />, label: "DJ Studio", color: "from-cyan-500 to-blue-500" },
  { icon: <Users className="w-5 h-5" />, label: "Staff Hub", color: "from-pink-500 to-rose-500" },
  { icon: <Star className="w-5 h-5" />, label: "VIP Suite", color: "from-amber-400 to-yellow-500" },
  { icon: <Clock className="w-5 h-5" />, label: "Time Clock", color: "from-green-500 to-emerald-600" },
];

export default function NUPSLanding() {
  const navigate = useNavigate();
  const [beat, setBeat] = useState(0);
  const [marqueePos, setMarqueePos] = useState(0);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter") navigate("/NUPSLogin");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  // Pulsing beat animation
  useEffect(() => {
    const interval = setInterval(() => setBeat(b => (b + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  // Marquee scroll
  useEffect(() => {
    const interval = setInterval(() => setMarqueePos(p => p - 1), 20);
    return () => clearInterval(interval);
  }, []);

  const marqueeText = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  const itemWidth = 160;
  const totalWidth = MARQUEE_ITEMS.length * itemWidth;
  const offset = ((marqueePos % totalWidth) + totalWidth) % totalWidth;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">

      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a0040_0%,#000000_60%)]" />

      {/* Animated orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-700/25 blur-[100px] animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-purple-600/10 blur-[80px]" />
        {/* Cyan accent */}
        <div className="absolute top-1/3 right-[5%] w-[200px] h-[200px] rounded-full bg-cyan-600/15 blur-[80px] animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      {/* Beat bars - bottom visualizer */}
      <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-[3px] px-8 pointer-events-none opacity-30">
        {Array.from({ length: 60 }).map((_, i) => {
          const height = 8 + Math.abs(Math.sin((i + beat * 3) * 0.4)) * 60 + Math.random() * 20;
          return (
            <div
              key={i}
              className="w-1 rounded-t-sm flex-shrink-0 transition-all duration-200"
              style={{
                height: `${height}px`,
                background: `hsl(${260 + i * 2}, 80%, 65%)`,
              }}
            />
          );
        })}
      </div>

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 4px)',
        }}
      />

      {/* Grid lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(120,80,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(120,80,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* MARQUEE STRIP */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-violet-950/60 border-b border-violet-500/20 overflow-hidden flex items-center z-20">
        <div
          className="flex gap-0 whitespace-nowrap"
          style={{ transform: `translateX(${-offset}px)`, transition: 'none' }}
        >
          {marqueeText.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-10 text-[11px] font-bold tracking-[0.2em] uppercase text-violet-300/70"
              style={{ width: `${itemWidth}px` }}
            >
              <Zap className="w-3 h-3 text-violet-400 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-2xl w-full text-center px-6 pt-16 pb-24 space-y-8">

        {/* Logo block */}
        <div className="flex flex-col items-center gap-3">
          {/* Glowing shield */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-violet-500/40 blur-2xl scale-150" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.7)] border border-violet-400/30">
              <Shield className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black tracking-[0.5em] text-violet-400/80 uppercase mb-1">GlyphLock Financial LLC</p>
            <h1 className="text-6xl md:text-7xl font-black tracking-tight leading-none">
              <span
                className="bg-gradient-to-r from-violet-300 via-purple-200 to-blue-300 bg-clip-text text-transparent"
                style={{ textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(167,139,250,0.5))' }}
              >
                N.U.P.S.
              </span>
            </h1>
            <p className="text-gray-500 text-xs mt-2 tracking-[0.4em] uppercase font-semibold">
              Nexus Unified Portal System
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
          The all-in-one operational backbone for{" "}
          <span className="text-violet-300 font-semibold">entertainment venues</span> —
          from the bar floor to the booth, every dollar tracked,
          every beat logged, every shift secured.
        </p>

        {/* Module grid */}
        <div className="grid grid-cols-3 gap-3">
          {MODULES.map((mod, i) => (
            <div
              key={i}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex flex-col items-center gap-2 hover:border-violet-500/30 hover:bg-white/[0.06] transition-all group"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                {mod.icon}
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 group-hover:text-gray-200 transition-colors">
                {mod.label}
              </span>
            </div>
          ))}
        </div>

        {/* DJ teaser banner */}
        <div className="bg-gradient-to-r from-cyan-950/60 via-blue-950/60 to-violet-950/60 border border-cyan-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Music2 className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-[11px] font-black tracking-widest uppercase text-cyan-400">Coming Soon</p>
            <p className="text-xs text-gray-400">GlyphMixer DJ Studio — integrated directly into NUPS</p>
          </div>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-1 rounded-full bg-cyan-400/60 transition-all duration-200"
                style={{ height: `${beat === i ? 20 : 8}px` }}
              />
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 text-xs text-amber-400/70 flex items-start gap-2">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500/60" />
          <span>Access restricted to authorized personnel only. All sessions are logged, audited, and encrypted.</span>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/NUPSLogin")}
            className="h-14 px-10 text-lg font-black rounded-xl active:scale-95 transition-all border-0"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(124,58,237,0.2)',
            }}
          >
            Enter N.U.P.S.
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>

        <p className="text-[10px] text-gray-800 tracking-widest">
          PRESS ENTER · SECURED BY GLYPHLOCK FINANCIAL LLC · v3.1
        </p>
      </div>
    </div>
  );
}