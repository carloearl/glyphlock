import React, { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Zap, Lock, Rocket, Radio, Check, Circle, Target } from "lucide-react";

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
const pad3 = (n) => n.toString().padStart(3, "0");

const CountdownDigit = ({ value, label, padFn = pad }) => (
  <div className="flex flex-col items-center">
    <div className="bg-[#141a2e] border border-[#5b9fd4]/30 rounded-lg px-2 py-1.5 sm:px-3.5 sm:py-3 min-w-[40px] sm:min-w-[60px]">
      <span className="text-xl sm:text-3xl md:text-4xl font-extrabold text-[#5b9fd4] tabular-nums tracking-tight block text-center">
        {padFn(value)}
      </span>
    </div>
    <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#5b9fd4] font-bold mt-1">{label}</span>
  </div>
);

const StatusBadge = ({ icon: Icon, text, pulse }) => (
  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[1px] text-[#8b92a8]">
    {pulse && (
      <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-pulse flex-shrink-0" />
    )}
    {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
    <span>{text}</span>
  </div>
);

export default function CountdownPill() {
  const [t, setT] = useState(getCountdown());
  const [up, setUp] = useState(getUptime());
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

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
        className="relative max-w-[800px] w-full rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0f1525 0%, #0a0e1a 100%)" }}
      >
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(91,159,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(91,159,212,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />

        <div className="relative px-5 py-6 sm:px-8 sm:py-8">

          {/* ─── System Status Bar ─── */}
          <div className="bg-[#141a2e] rounded-xl py-3 px-4 mb-6">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-3">
              <StatusBadge text="ALL SYSTEMS NOMINAL" pulse />
              <StatusBadge icon={Lock} text="ENCRYPTED" />
              <StatusBadge text={`⏱ UPTIME: ${up.d}d ${pad(up.h)}h ${pad(up.m)}m`} />
            </div>
            <div className="text-center">
              <span className="inline-flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/30 px-4 py-1 rounded-full text-[10px] uppercase tracking-[1px] text-[#00ff88] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-pulse" />
                LIVE BETA 3.0
              </span>
            </div>
          </div>

          {/* ─── Header ─── */}
          <div className="text-center mb-6">
            <div className="text-[10px] sm:text-[11px] uppercase tracking-[3px] text-[#5b9fd4] font-semibold mb-4">
              Final Countdown to Full Launch
            </div>
            <h2 className="text-2xl sm:text-[36px] md:text-[42px] font-extrabold text-white mb-1 leading-tight">
              INDEPENDENCE DAY
            </h2>
            <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#5b9fd4] mb-5">
              PROTOCOL LAUNCH
            </h3>
            <p className="text-xs sm:text-sm text-[#8b92a8] leading-relaxed">
              On <strong className="text-white">July 4th, 2026</strong> — GlyphLock exits beta and goes fully operational.
            </p>
            <p className="text-[#00ff88] font-semibold text-xs sm:text-sm mt-1.5">
              No more locked boxes. No more permission slips. Full sovereignty.
            </p>
          </div>

          {/* ─── Countdown Digits ─── */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 mb-6">
            <CountdownDigit value={t.d} label="Days" padFn={pad3} />
            <span className="text-xl sm:text-2xl text-[#5b9fd4]/50 font-bold mt-[-14px]">:</span>
            <CountdownDigit value={t.h} label="Hours" />
            <span className="text-xl sm:text-2xl text-[#5b9fd4]/50 font-bold mt-[-14px]">:</span>
            <CountdownDigit value={t.m} label="Min" />
            <span className="text-xl sm:text-2xl text-[#5b9fd4]/50 font-bold mt-[-14px]">:</span>
            <CountdownDigit value={t.s} label="Sec" />
          </div>

          {/* ─── Milestone Timeline ─── */}
          <div className="max-w-xl mx-auto mb-6 px-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[2px] text-[#8b92a8]">Mission Milestones</span>
              <span className="text-[12px] text-[#00ff88] font-semibold">7 / 10 ACHIEVED</span>
            </div>

            {/* Timeline Track */}
            <div className="relative">
              {/* Background track */}
              <div className="absolute top-[9px] left-[9px] right-[9px] h-[3px] bg-[#1a2040] rounded-full" />
              {/* Filled track */}
              <motion.div
                className="absolute top-[9px] left-[9px] h-[3px] rounded-full"
                style={{ background: "linear-gradient(90deg, #00ff88 0%, #5b9fd4 50%, #a855f7 100%)" }}
                initial={{ width: 0 }}
                animate={isInView ? { width: "70%" } : { width: 0 }}
                transition={{ delay: 0.8, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Milestone dots */}
              <div className="relative flex justify-between">
                {[
                  { label: "Beta 1.0", done: true },
                  { label: "QR Engine", done: true },
                  { label: "Image Lab", done: true },
                  { label: "GlyphBot AI", done: true },
                  { label: "Beta 2.0", done: true },
                  { label: "Voice Studio", done: true },
                  { label: "Beta 3.0", done: true, current: true },
                  { label: "SOC Module", done: false },
                  { label: "Enterprise", done: false },
                  { label: "LAUNCH", done: false, launch: true },
                ].map((m, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: '10%' }}>
                    <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center relative z-10 ${
                      m.current 
                        ? 'bg-[#00ff88] shadow-[0_0_12px_#00ff88]' 
                        : m.done 
                          ? 'bg-[#5b9fd4]' 
                          : m.launch 
                            ? 'bg-[#141a2e] border-2 border-[#a855f7]' 
                            : 'bg-[#141a2e] border-2 border-[#2a3050]'
                    }`}>
                      {m.done ? (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      ) : m.launch ? (
                        <Rocket className="w-2.5 h-2.5 text-[#a855f7]" />
                      ) : (
                        <Circle className="w-2 h-2 text-[#2a3050]" />
                      )}
                    </div>
                    <span className={`text-[7px] sm:text-[8px] mt-1.5 text-center leading-tight font-semibold ${
                      m.current ? 'text-[#00ff88]' : m.done ? 'text-[#5b9fd4]' : m.launch ? 'text-[#a855f7]' : 'text-[#3a4060]'
                    }`}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current milestone callout */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <Target className="w-3.5 h-3.5 text-[#00ff88]" />
              <span className="text-[10px] sm:text-xs text-[#8b92a8]">
                Currently: <span className="text-[#00ff88] font-bold">Beta 3.0</span> — Next: <span className="text-[#a855f7] font-bold">SOC Module</span>
              </span>
            </div>
          </div>

          {/* ─── Stats Grid ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
            {[
              { label: "Modules Deployed", value: "63", color: "text-[#00ff88]" },
              { label: "Security Audits", value: "1,247", color: "text-[#5b9fd4]" },
              { label: "Zero Breaches", value: "0", color: "text-[#a855f7]" },
              { label: "Uptime", value: "99.99%", color: "text-[#00ff88]" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#141a2e] border border-white/10 rounded-xl p-3 sm:p-4 text-center">
                <div className={`text-2xl sm:text-3xl font-extrabold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] uppercase tracking-[2px] text-[#8b92a8]">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* ─── Bottom Declaration ─── */}
          <div className="text-center">
            <p className="text-[10px] sm:text-xs text-[#8b92a8] leading-relaxed">
              Operational since January 1st, 2026 · Arizona Time (UTC-7)<br />
              <span className="text-[#5b9fd4]/70">Protected under the Master Covenant · All rights reserved</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}