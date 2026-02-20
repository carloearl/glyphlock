import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FinancialCTA({ children, to, variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";

  return (
    <Link to={createPageUrl(to)}>
      <motion.div
        className={`group relative inline-flex items-center justify-center cursor-pointer overflow-hidden ${className}`}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        style={{ borderRadius: '6px' }}
      >
        {/* Hover glow */}
        {isPrimary && (
          <div
            className="absolute -inset-[2px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-400"
            style={{
              background: 'rgba(16,185,129,0.5)',
              filter: 'blur(10px)',
            }}
          />
        )}

        {/* Button body */}
        <div
          className={`relative z-10 px-7 py-3 rounded-md text-[13px] font-bold uppercase tracking-[2px] transition-all duration-300
            ${isPrimary
              ? 'bg-emerald-600 border border-emerald-400/60 text-white group-hover:bg-emerald-500 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
              : 'bg-transparent border border-emerald-500/50 text-emerald-400 group-hover:border-emerald-400 group-hover:text-emerald-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]'
            }
          `}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <span className="relative z-10">{children}</span>
        </div>
      </motion.div>
    </Link>
  );
}