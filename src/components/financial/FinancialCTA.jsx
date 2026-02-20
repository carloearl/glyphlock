import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * GlyphLock Financial CTA Button
 * Gold glow, green shimmer, pop-out on hover, bank-grade authority
 * 
 * variant: "primary" | "outline"
 */
export default function FinancialCTA({ children, to, variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";

  return (
    <Link to={createPageUrl(to)}>
      <motion.div
        className={`group relative inline-flex items-center justify-center cursor-pointer overflow-hidden rounded-lg ${className}`}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        {/* Outer gold glow pulse */}
        <div
          className="absolute -inset-[2px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: isPrimary
              ? 'linear-gradient(135deg, rgba(234,179,8,0.6), rgba(16,185,129,0.4), rgba(234,179,8,0.6))'
              : 'linear-gradient(135deg, rgba(234,179,8,0.4), rgba(16,185,129,0.25), rgba(234,179,8,0.4))',
            backgroundSize: '200% 200%',
            animation: 'fin-glow-shift 3s ease infinite',
            filter: 'blur(4px)',
          }}
        />

        {/* Button body */}
        <div
          className={`relative z-10 px-10 py-4 rounded-lg text-sm font-bold uppercase tracking-[2.5px] transition-all duration-300
            ${isPrimary
              ? 'bg-gradient-to-r from-[#0c2a16] via-[#0e3320] to-[#0c2a16] border border-yellow-500/50 text-white group-hover:border-yellow-400/80 group-hover:text-yellow-100'
              : 'bg-[#0a1a0f]/80 border border-yellow-600/30 text-yellow-500/90 group-hover:border-yellow-400/60 group-hover:text-yellow-400'
            }
          `}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Green shimmer sweep */}
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="absolute top-0 -left-full h-full w-1/2"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.15), rgba(234,179,8,0.1), transparent)',
                animation: 'fin-shimmer 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Inner gold highlight on hover */}
          <div
            className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${isPrimary ? 'bg-gradient-to-t from-yellow-600/10 to-transparent' : 'bg-gradient-to-t from-yellow-600/5 to-transparent'}`}
            style={{ pointerEvents: 'none' }}
          />

          {/* Gold bottom border accent */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-[80%] transition-all duration-500 ease-out"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(234,179,8,0.8), rgba(16,185,129,0.5), rgba(234,179,8,0.8), transparent)',
            }}
          />

          {/* Box shadow glow */}
          <div
            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              boxShadow: isPrimary
                ? '0 0 20px rgba(234,179,8,0.3), 0 0 40px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.4)'
                : '0 0 15px rgba(234,179,8,0.2), 0 0 30px rgba(16,185,129,0.1), 0 6px 24px rgba(0,0,0,0.3)',
            }}
          />

          {/* Text */}
          <span className="relative z-10">{children}</span>
        </div>

        {/* Keyframes injected via style tag */}
        <style>{`
          @keyframes fin-glow-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes fin-shimmer {
            0% { left: -50%; }
            100% { left: 150%; }
          }
        `}</style>
      </motion.div>
    </Link>
  );
}