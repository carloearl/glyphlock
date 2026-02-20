import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * GlyphLock Financial CTA — matches sitewide button style
 */
export default function FinancialCTA({ children, to, variant = "primary", className = "" }) {
  const isPrimary = variant === "primary";

  return (
    <Link
      to={createPageUrl(to)}
      className={`
        inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold uppercase tracking-[2px] transition-all duration-300
        ${isPrimary
          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 shadow-[0_0_25px_rgba(87,61,255,0.3)] hover:shadow-[0_0_40px_rgba(87,61,255,0.5)] hover:-translate-y-0.5'
          : 'border border-white/15 text-white/80 hover:border-indigo-400/40 hover:text-white hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(87,61,255,0.2)]'
        }
        ${className}
      `}
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {children}
    </Link>
  );
}