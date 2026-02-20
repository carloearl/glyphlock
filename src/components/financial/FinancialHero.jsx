import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import FinancialCoinHero from "./FinancialCoinHero";

const SHIELD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";

const NEU_BTN_PRIMARY = "inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-[3px] uppercase text-white bg-[#0c2216] border border-yellow-600/40 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.6),_-3px_-3px_10px_rgba(16,185,129,0.08)] hover:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.5),_inset_-2px_-2px_6px_rgba(16,185,129,0.06)] hover:bg-[#0e2a1a] transition-all duration-200 cursor-pointer";
const NEU_BTN_OUTLINE = "inline-flex items-center justify-center px-10 py-4 text-sm font-bold tracking-[2px] uppercase text-yellow-500/90 bg-transparent border border-yellow-600/30 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.5),_-3px_-3px_10px_rgba(16,185,129,0.04)] hover:border-yellow-500/50 transition-all duration-200 cursor-pointer";

export default function FinancialHero() {
  return (
    <section className="relative w-full flex flex-col items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-black to-green-950" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16,185,129,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.08) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Ambient glow orbs */}
      <motion.div className="absolute top-20 left-[20%] w-[400px] h-[400px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.3), transparent 70%)', filter: 'blur(80px)' }}
      />
      <motion.div className="absolute bottom-20 right-[15%] w-[350px] h-[350px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.25), transparent 70%)', filter: 'blur(80px)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text side */}
          <div>
            {/* TOP LINE — Registered entity feel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-3 mb-10"
            >
              <img src={SHIELD_LOGO_URL} alt="GL" className="w-5 h-5 rounded-sm object-contain opacity-70" />
              <span
                className="text-[11px] font-semibold uppercase text-emerald-400/60"
                style={{ letterSpacing: '4px', fontFamily: "'Cinzel', serif" }}
              >
                GlyphLock Financial LLC
              </span>
            </motion.div>

            {/* MAIN TITLE — Brand dominant, anchored by FINANCIAL */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-10"
            >
              <span
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9]"
                style={{ letterSpacing: '-1px' }}
              >
                GLYPHLOCK
              </span>
              <span
                className="block text-2xl sm:text-3xl md:text-4xl font-semibold text-white/80 mt-2"
                style={{ letterSpacing: '8px', fontFamily: "'Cinzel', serif" }}
              >
                FINANCIAL
              </span>
            </motion.h1>

            {/* SUBTITLE — Institutional authority, two lines max */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-10"
            >
              <p
                className="text-lg md:text-xl font-semibold text-white/90 mb-2"
                style={{ letterSpacing: '1px', fontFamily: "'Cinzel', serif" }}
              >
                Operational Qualification Architecture
              </p>
              <p
                className="text-[14px] text-slate-400 leading-relaxed max-w-lg"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                Structured documentation framework aligned to formal underwriting review protocols.
              </p>
            </motion.div>

            {/* COMPLIANCE TAG STACK — Standards, not features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 mb-12"
            >
              <span
                className="text-[10px] uppercase font-bold text-slate-400"
                style={{ letterSpacing: '3px', fontFamily: "'Cinzel', serif" }}
              >
                Deterministic Risk Profile
              </span>
              <span className="w-px h-4 bg-yellow-600/40" />
              <span
                className="text-[10px] uppercase font-bold text-slate-400"
                style={{ letterSpacing: '3px', fontFamily: "'Cinzel', serif" }}
              >
                Verified Operations Standard
              </span>
            </motion.div>

            {/* CTA BUTTONS — Neumorphic, disciplined */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Link to={createPageUrl("Consultation")} className={NEU_BTN_PRIMARY} style={{ fontFamily: "'Cinzel', serif" }}>
                Initiate Qualification
              </Link>
              <Link to={createPageUrl("SecurityDocs")} className={NEU_BTN_OUTLINE} style={{ fontFamily: "'Cinzel', serif" }}>
                View Framework Documentation
              </Link>
            </motion.div>
          </div>

          {/* 3D Coin Hero — untouched */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <FinancialCoinHero />
          </motion.div>
        </div>
      </div>
    </section>
  );
}