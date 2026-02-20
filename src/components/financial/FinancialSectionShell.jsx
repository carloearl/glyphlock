import React from "react";

/**
 * Clean section wrapper — transparent background, 
 * relies on sitewide nebula/layout for ambiance.
 */
export default function FinancialSectionShell({ children, orbSeed = 0 }) {
  return (
    <section className="relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="relative z-10 py-16 md:py-24">
        {children}
      </div>
    </section>
  );
}