import React from "react";
import SEOHead from "@/components/SEOHead";
import FinancialHero from "@/components/financial/FinancialHero";
import FinancialModules from "@/components/financial/FinancialModules";
import FinancialFooter from "@/components/financial/FinancialFooter";

export default function GlyphLockFinancial() {
  // Replace with your actual uploaded video URL when ready
  const heroVideoUrl = null; 

  return (
    <>
      <SEOHead
        title="GlyphLock Financial, LLC — Enterprise POS, Blockchain, Currency & Entertainment"
        description="GlyphLock Financial is the commerce and technology arm of the GlyphLock ecosystem. N.U.P.S. point-of-sale, blockchain verification, club currency press, and DJ entertainment systems."
        keywords="GlyphLock Financial, NUPS POS, blockchain verification, club currency, Dream Dollars, DJ mixer, entertainment technology"
        url="/GlyphLockFinancial"
      />

      <main className="w-full relative" style={{ background: 'transparent' }}>
        <FinancialHero videoUrl={heroVideoUrl} />
        <FinancialModules />
        <FinancialFooter />
      </main>
    </>
  );
}