import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FinancialCTA({ children, to, variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";

  return (
    <Link to={createPageUrl(to)}>
      <motion.div
        className={`group relative inline-flex items-center justify-center cursor-pointer overflow-hidden rounded-xl ${className}`}
        whileHover={{ scale: 1.06, y: -3 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
      >
        {/* Outer glow ring — always visible, intensifies on hover */}
        <div
          className="absolute -inset-[3px] rounded-xl transition-opacity duration-500"
          style={{
            background: isPrimary
              ? 'linear-gradient(135deg, rgba(249,115,22,0.7), rgba(234,179,8,0.6), rgba(249,115,22,0.7))'
              : 'linear-gradient(135deg, rgba(234,179,8,0.4), rgba(249,115,22,0.3), rgba(234,179,8,0.4))',
            backgroundSize: '200% 200%',
            animation: 'fin-glow-shift 3s ease infinite',
            filter: 'blur(6px)',
            opacity: isPrimary ? 0.5 : 0.25,
          }}
        />
        <div
          className="absolute -inset-[3px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-400"
          style={{
            background: isPrimary
              ? 'linear-gradient(135deg, rgba(249,115,22,0.9), rgba(234,179,8,0.8), rgba(249,115,22,0.9))'
              : 'linear-gradient(135deg, rgba(234,179,8,0.6), rgba(249,115,22,0.5), rgba(234,179,8,0.6))',
            backgroundSize: '200% 200%',
            animation: 'fin-glow-shift 3s ease infinite',
            filter: 'blur(8px)',
          }}
        />

        {/* Button body */}
        <div
          className={`relative z-10 px-8 py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[3px] transition-all duration-300
            ${isPrimary
              ? 'bg-gradient-to-r from-amber-600/90 via-orange-500/80 to-amber-600/90 border border-amber-400/60 text-black group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)]'
              : 'bg-black/70 border border-amber-500/40 text-amber-400 group-hover:border-amber-400/70 group-hover:text-amber-300 group-hover:shadow-[0_0_25px_rgba(234,179,8,0.3)]'
            }
          `}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {/* Shimmer sweep */}
          <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
            <div
              className="absolute top-0 -left-full h-full w-1/2 group-hover:animate-[fin-shimmer_1.5s_ease-in-out_infinite]"
              style={{
                background: isPrimary
                  ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(234,179,8,0.15), transparent)',
              }}
            />
          </div>

          {/* Bottom accent bar */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-[85%] transition-all duration-500 ease-out rounded-full"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.9), rgba(234,179,8,0.9), rgba(249,115,22,0.9), transparent)',
            }}
          />

          <span className="relative z-10">{children}</span>
        </div>

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