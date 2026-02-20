import React from "react";
import { motion } from "framer-motion";

/**
 * Shared ambient section wrapper for all Financial page sections.
 * Gives every section the same alive feel as the hero:
 * - Emerald-to-black gradient bg
 * - Pulsing gold grid overlay
 * - Floating glow orbs (green + gold/orange)
 * - Grid lines
 */
export default function FinancialSectionShell({ children, orbSeed = 0 }) {
  // Vary orb positions/timings per section so they don't look identical
  return (
    <section className="relative overflow-hidden" style={{ background: 'transparent' }}>

      {/* Content */}
      <div className="relative z-10 py-20 md:py-28">
        {children}
      </div>
    </section>
  );
}