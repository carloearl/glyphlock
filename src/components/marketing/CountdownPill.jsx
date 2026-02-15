import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Zap, Lock, Rocket, Radio } from "lucide-react";

// LAUNCH DATE: July 4th, 2026 00:00 Arizona Time (UTC-7 => UTC 07:00)
const LAUNCH_UTC = Date.UTC(2026, 6, 4, 7, 0, 0);
// BETA START: Jan 1, 2026 00:00 Arizona Time
const BETA_START_UTC = Date.UTC(2026, 0, 1, 7, 0, 0);

function getCountdown() {
  const now = Date.now();
  const diff = LAUNCH_UTC - now;
  const elapsed = now - BETA_START_UTC;
  const total = LAUNCH_UTC - BETA_START_UTC;

  if (diff <= 0) return { launched: true, d: 0, h: 0, m: 0, s: 0, pct: 100 };

  return {
    launched: false,
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
    pct: Math.min(100, Math.max(0, Math.round((elapsed / total) * 100))),
  };
}

function getUptime() {
  const diff = Date.now() - BETA_START_UTC;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
  };
}

const pad = (n) => n.toString().padStart(2, "0");

const CountdownDigit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-b from-cyan-500/30 to-blue-600/20 rounded-lg blur-sm" />
      <div className="relative bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 sm:px-4 sm:py-3 min-w-[44px] sm:min-w-[64px] backdrop-blur-xl">
        <span className="text-xl sm:text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]">
          {pad(value)}
        </span>
      </div>
    </div>
    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-cyan-400/80 font-bold mt-1.5">{label}</span>
  </div>
);

const StatusBadge = ({ icon: Icon, text, pulse }) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
    {pulse && (
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
    )}
    {Icon && <Icon className="w-3 h-3 text-cyan-400" />}
    <span className="text-[10px] sm:text-xs text-white/80 font-medium">{text}</span>
  </div>
);

export default function CountdownPill() {
  const [t, setT] = useState(getCountdown());
  const [up, setUp] = useState(getUptime());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  useEffect(() => {
    const i = setInterval(() => {
      setT(getCountdown());
      setUp(getUptime());
    }, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div ref={ref} className="w-full flex justify-center mt-6 mb-4 px-3 sm:px-4 select-none">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-5xl w-full overflow-hidden rounded-2xl sm:rounded-3xl"
      >
        {/* Outer glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-600/30 to-purple-600/40 rounded-2xl sm:rounded-3xl blur-xl opacity-60" />
        <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/50 via-blue-500/40 to-purple-500/50 rounded-2xl sm:rounded-3xl" />

        {/* Main container */}
        <div className="relative bg-gradient-to-br from-slate-950 via-[#0a0e27] to-slate-950 rounded-2xl sm:rounded-3xl px-5 py-6 sm:px-10 sm:py-10 md:px-14 md:py-12 overflow-hidden">

          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />

          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl sm:rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-purple-500/40 rounded-tr-2xl sm:rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-blue-500/40 rounded-bl-2xl sm:rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/40 rounded-br-2xl sm:rounded-br-3xl" />

          {/* ─── Top Status Row ─── */}
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-5 sm:mb-8">
            <StatusBadge icon={Shield} text="ALL SYSTEMS NOMINAL" pulse />
            <StatusBadge icon={Lock} text="ENCRYPTED" />
            <StatusBadge icon={Zap} text={`UPTIME: ${up.d}d ${pad(up.h)}h ${pad(up.m)}m`} />
            <StatusBadge icon={Radio} text="LIVE BETA 2.0" pulse />
          </div>

          {/* ─── Pre-Launch Label ─── */}
          <div className="relative z-10 text-center mb-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 text-[10px] sm:text-xs tracking-[0.35em] uppercase font-bold text-cyan-300">
                FINAL COUNTDOWN TO FULL LAUNCH
              </span>
            </motion.div>
          </div>

          {/* ─── Headline ─── */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative z-10 text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-3 leading-tight"
          >
            <span className="drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">INDEPENDENCE DAY</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,0.8)]">
              PROTOCOL LAUNCH
            </span>
          </motion.h2>

          {/* ─── Sub-tagline ─── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative z-10 text-center text-xs sm:text-sm md:text-base text-slate-400 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
          >
            On <span className="text-white font-bold">July 4th, 2026</span> — GlyphLock exits beta and goes fully operational.
            <br className="hidden sm:block" />
            <span className="text-cyan-400 font-semibold">No more locked boxes. No more permission slips. Full sovereignty.</span>
          </motion.p>

          {/* ─── Countdown Digits ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
            className="relative z-10 flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-10"
          >
            <CountdownDigit value={t.d} label="Days" />
            <span className="text-2xl sm:text-3xl text-cyan-500/60 font-bold mt-[-12px]">:</span>
            <CountdownDigit value={t.h} label="Hours" />
            <span className="text-2xl sm:text-3xl text-cyan-500/60 font-bold mt-[-12px]">:</span>
            <CountdownDigit value={t.m} label="Min" />
            <span className="text-2xl sm:text-3xl text-cyan-500/60 font-bold mt-[-12px]">:</span>
            <CountdownDigit value={t.s} label="Sec" />
          </motion.div>

          {/* ─── Progress Bar ─── */}
          <div className="relative z-10 max-w-xl mx-auto mb-5 sm:mb-8 px-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide">BETA PROGRESS</span>
              <span className="text-[10px] sm:text-xs text-cyan-400 font-bold tracking-wide">{t.pct}% COMPLETE</span>
            </div>
            <div className="h-2 sm:h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: `${t.pct}%` } : { width: 0 }}
                transition={{ delay: 1, duration: 2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </motion.div>
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-slate-600">Jan 1, 2026</span>
              <span className="text-[9px] text-cyan-500/80 font-bold flex items-center gap-1">
                <Rocket className="w-3 h-3" /> JULY 4TH, 2026
              </span>
            </div>
          </div>

          {/* ─── Mission Stats ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto mb-5 sm:mb-8"
          >
            {[
              { label: "MODULES DEPLOYED", value: "47", color: "text-emerald-400" },
              { label: "SECURITY AUDITS", value: "312", color: "text-cyan-400" },
              { label: "ZERO BREACHES", value: "0", color: "text-green-400" },
              { label: "UPTIME", value: "99.97%", color: "text-blue-400" },
            ].map((stat, i) => (
              <div key={i} className="text-center bg-white/[0.03] rounded-xl border border-white/[0.06] px-3 py-3 sm:py-4 backdrop-blur-sm">
                <div className={`text-lg sm:text-2xl font-black ${stat.color} drop-shadow-[0_0_10px_currentColor]`}>{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* ─── Bottom Declaration ─── */}
          <div className="relative z-10 text-center">
            <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
              <span className="text-slate-400 font-semibold">Operational since January 1st, 2026</span> · Arizona Time (UTC-7)
              <br />
              <span className="text-cyan-500/70">Protected under the Master Covenant · All rights sovereign</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}