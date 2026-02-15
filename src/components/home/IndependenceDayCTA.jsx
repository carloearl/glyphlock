import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, useInView } from "framer-motion";
import { Lock, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function CountdownBox({ value, label, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="bg-[#141a2e] border border-[#5b9fd4]/30 rounded-xl p-4 sm:p-6 text-center"
    >
      <span className="text-3xl sm:text-5xl font-extrabold text-[#5b9fd4] block mb-2 tabular-nums">
        {value}
      </span>
      <span className="text-[10px] uppercase tracking-[2px] text-[#5b9fd4]">{label}</span>
    </motion.div>
  );
}

function StatBox({ value, label, color }) {
  return (
    <div className="bg-[#141a2e] border border-white/10 rounded-xl p-6 text-center">
      <div className={`text-4xl sm:text-5xl font-extrabold mb-2 ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[2px] text-[#8b92a8]">{label}</div>
    </div>
  );
}

export default function IndependenceDayCTA() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.15 });
  const [countdown, setCountdown] = useState({ days: "000", hours: "00", minutes: "00", seconds: "00" });
  const [uptimeText, setUptimeText] = useState("CALCULATING...");

  useEffect(() => {
    function update() {
      const launchDate = new Date("July 4, 2026 00:00:00").getTime();
      const now = Date.now();
      const distance = launchDate - now;
      if (distance > 0) {
        setCountdown({
          days: String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(3, "0"),
          hours: String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, "0"),
          minutes: String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0"),
          seconds: String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, "0"),
        });
      }
      const startDate = new Date("January 1, 2026 00:00:00").getTime();
      const uptime = now - startDate;
      const d = Math.floor(uptime / (1000 * 60 * 60 * 24));
      const h = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
      setUptimeText(`${d}d ${h}h ${m}m`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate beta progress based on time
  const betaStart = new Date("January 1, 2026").getTime();
  const betaEnd = new Date("July 4, 2026").getTime();
  const now = Date.now();
  const progressPercent = Math.min(99, Math.max(0, Math.round(((now - betaStart) / (betaEnd - betaStart)) * 100)));

  return (
    <section ref={containerRef} className="w-full max-w-[800px] mx-auto px-4" style={{ background: "transparent" }}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl border border-white/10 p-6 sm:p-10"
        style={{ background: "linear-gradient(180deg, #0f1525 0%, #0a0e1a 100%)" }}
      >
        {/* System Status Bar */}
        <div className="bg-[#141a2e] rounded-xl py-3 px-4 mb-8">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[1px] text-[#8b92a8]">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-pulse" />
              ALL SYSTEMS NOMINAL
            </div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[1px] text-[#8b92a8]">
              <Lock className="w-3 h-3" /> ENCRYPTED
            </div>
            <div className="text-[11px] uppercase tracking-[1px] text-[#8b92a8]">
              <Clock className="w-3 h-3 inline mr-1" /> UPTIME: {uptimeText}
            </div>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-2 bg-[#00ff88]/10 border border-[#00ff88]/30 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[1px] text-[#00ff88]">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88] animate-pulse" />
              LIVE BETA 2.0
            </span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-[11px] uppercase tracking-[3px] text-[#5b9fd4] font-semibold mb-5">
            Final Countdown to Full Launch
          </div>
          <h2 className="text-3xl sm:text-[42px] font-extrabold text-white mb-2 leading-tight">
            INDEPENDENCE DAY
          </h2>
          <h3 className="text-2xl sm:text-4xl font-bold text-[#5b9fd4] mb-6">
            PROTOCOL LAUNCH
          </h3>
          <p className="text-sm text-[#8b92a8] leading-relaxed">
            On <strong className="text-white">July 4th, 2026</strong> — GlyphLock exits beta and goes fully operational.
          </p>
          <p className="text-[#00ff88] font-semibold text-sm mt-2">
            No more locked boxes. No more permission slips. Full sovereignty.
          </p>
        </div>

        {/* Countdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <CountdownBox value={countdown.days} label="Days" delay={0.2} />
          <CountdownBox value={countdown.hours} label="Hours" delay={0.3} />
          <CountdownBox value={countdown.minutes} label="Min" delay={0.4} />
          <CountdownBox value={countdown.seconds} label="Sec" delay={0.5} />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] uppercase tracking-[2px] text-[#8b92a8]">Beta Progress</span>
            <span className="text-[13px] text-[#5b9fd4] font-semibold">{progressPercent}% Complete</span>
          </div>
          <div className="h-1.5 bg-[#141a2e] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: `${progressPercent}%` } : {}}
              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #5b9fd4 0%, #a855f7 100%)" }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatBox value="47" label="Modules Deployed" color="text-[#00ff88]" />
          <StatBox value="312" label="Security Audits" color="text-[#5b9fd4]" />
          <StatBox value="0" label="Zero Breaches" color="text-[#a855f7]" />
        </div>

        {/* Uptime Box */}
        <div className="bg-[#141a2e] border border-white/10 rounded-xl p-8 text-center mb-8">
          <div className="text-5xl sm:text-7xl font-extrabold text-[#00ff88] mb-3">99.97%</div>
          <div className="text-[10px] uppercase tracking-[2px] text-[#8b92a8] mb-4">Uptime</div>
          <div className="text-xs text-[#8b92a8] leading-relaxed">
            Operational since January 1st, 2026 · Arizona Time (UTC-7)<br />
            Protected under the Master Covenant · All rights reserved
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: "linear-gradient(135deg, #0a0e1a 0%, #1a0a0a 100%)" }}>
          <h3 className="text-3xl sm:text-5xl font-black text-white mb-2">STOP GETTING</h3>
          <h3 className="text-3xl sm:text-5xl font-black text-red-500 mb-8">ROBBED.</h3>
          <Link to={createPageUrl("Consultation")}>
            <Button
              size="lg"
              className="relative overflow-hidden text-[#0a0e1a] text-base sm:text-lg px-10 sm:px-12 py-6 font-extrabold uppercase tracking-wide border-none rounded-full shadow-[0_10px_30px_rgba(91,159,212,0.3)] hover:shadow-[0_15px_40px_rgba(91,159,212,0.5)] hover:-translate-y-1 transition-all duration-300"
              style={{ background: "linear-gradient(135deg, #5b9fd4 0%, #00ff88 100%)" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
              />
              <span className="relative flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                TAKE CONTROL NOW
                <ArrowRight className="w-5 h-5" />
              </span>
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}