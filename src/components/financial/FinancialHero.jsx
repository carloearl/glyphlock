import React from "react";
import { motion } from "framer-motion";
import FinancialCoinHero from "./FinancialCoinHero";
import FinancialCTA from "./FinancialCTA";

const SHIELD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";

export default function FinancialHero() {
  return (
    <section className="relative w-full flex flex-col items-center overflow-hidden">
      <style>{`
        @keyframes fin-title-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
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
        {/* Animated grid pulse overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundImage: `
              linear-gradient(rgba(234,179,8,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(234,179,8,0.06) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Ambient glow orbs — more alive */}
      <motion.div className="absolute top-20 left-[20%] w-[500px] h-[500px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.12, 0.3, 0.12] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.35), transparent 70%)', filter: 'blur(80px)' }}
      />
      <motion.div className="absolute bottom-20 right-[15%] w-[450px] h-[450px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.1, 0.28, 0.1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.3), transparent 70%)', filter: 'blur(80px)' }}
      />
      {/* Gold accent orb */}
      <motion.div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] rounded-full pointer-events-none z-[1]"
        animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.05, 0.18, 0.05] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.2), transparent 70%)', filter: 'blur(60px)' }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl py-12 md:py-24">
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

            {/* MAIN TITLE */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-10"
            >
              <span
                className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.9]"
                style={{
                  letterSpacing: '-1px',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fbbf24 40%, #f97316 70%, #ffffff 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'fin-title-gradient 6s ease infinite',
                }}
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

            {/* SUBTITLE */}
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

            {/* COMPLIANCE TAG STACK */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex items-center gap-4 mb-14"
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

            {/* CTA BUTTONS — Gold glow, green shimmer, pop-out */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-wrap gap-5"
            >
              <FinancialCTA to="Consultation" variant="primary">
                Initiate Qualification
              </FinancialCTA>
              <FinancialCTA to="SecurityDocs" variant="outline">
                View Framework Documentation
              </FinancialCTA>
            </motion.div>
          </div>

          {/* 3D Coin Hero */}
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