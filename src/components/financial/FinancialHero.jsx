import React from "react";
import { motion } from "framer-motion";
import FinancialCTA from "./FinancialCTA";

const SHIELD_LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a087fb354faebb72df54b/5e2e34bf7_b70d54f1-3b3b-418e-ac6f-c4ecad013f91.png";

export default function FinancialHero() {
  return (
    <section className="relative w-full flex flex-col items-center overflow-hidden" style={{ background: 'transparent' }}>
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 max-w-5xl py-16 md:py-28">
        <div className="text-center max-w-3xl mx-auto">
          {/* Entity tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-3 mb-8"
          >
            <img src={SHIELD_LOGO_URL} alt="GL" className="w-5 h-5 rounded-sm object-contain opacity-60" />
            <span className="text-[11px] font-semibold uppercase text-indigo-400/70" style={{ letterSpacing: '4px', fontFamily: "'Cinzel', serif" }}>
              GlyphLock Financial LLC
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <span className="block text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] text-white" style={{ letterSpacing: '-0.5px' }}>
              Operational Qualification
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl font-black leading-[0.95] mt-1" style={{ 
              background: 'linear-gradient(135deg, #818cf8, #6366f1, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              Architecture
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto mb-8"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Structured documentation framework for entertainment and hospitality venues 
            operating within high-scrutiny underwriting environments. Deterministic risk profiling 
            and verified operations standards.
          </motion.p>

          {/* Compliance tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex items-center justify-center gap-4 mb-12 flex-wrap"
          >
            {['Deterministic Risk Profile', 'Verified Operations Standard', 'Submission Dossier'].map((tag, i) => (
              <span key={i} className="text-[10px] uppercase font-bold text-slate-500 tracking-[2px] px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02]" style={{ fontFamily: "'Cinzel', serif" }}>
                {tag}
              </span>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <FinancialCTA to="Consultation" variant="primary">
              Initiate Qualification
            </FinancialCTA>
            <FinancialCTA to="SecurityDocs" variant="outline">
              View Documentation
            </FinancialCTA>
          </motion.div>
        </div>
      </div>
    </section>
  );
}