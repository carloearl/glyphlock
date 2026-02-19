import React, { useState } from "react";
import SEOHead from "@/components/SEOHead";
import FinancialHero from "@/components/financial/FinancialHero";
import FinancialModules from "@/components/financial/FinancialModules";
import FinancialFooterCTA from "@/components/financial/FinancialFooterCTA";

export default function GlyphLockFinancial() {
  // Video URL — user can upload their hero video and set it here
  const [heroVideo] = useState(null);

  return (
    <>
      <SEOHead
        title="GlyphLock Financial LLC | POS, Blockchain, Club Currency & Venue Technology"
        description="GlyphLock Financial is the fintech arm of the GlyphLock ecosystem. NUPS point-of-sale, club currency press, blockchain verification, crypto tools, and DJ Pro Mixer for entertainment venues."
        keywords="GlyphLock Financial, NUPS POS, club currency, Dream Dollars, blockchain verification, entertainment venue technology, fintech, DJ mixer"
        url="/glyphlock-financial"
      />

      <div className="text-white min-h-screen" style={{ background: 'transparent' }}>
        <FinancialHero videoUrl={heroVideo} />
        <FinancialModules />
        <FinancialFooterCTA />
      </div>
    </>
  );
}