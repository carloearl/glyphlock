import React from "react";
import SEOHead from "@/components/SEOHead";
import InteractiveWebGrid from "@/components/global/InteractiveWebGrid";
import CarloHero from "@/components/about/carlo/CarloHero";
import CarloOriginStory from "@/components/about/carlo/CarloOriginStory";
import FounderArc from "@/components/about/carlo/FounderArc";
import PrototypeToLiveWorkflow from "@/components/about/carlo/PrototypeToLiveWorkflow";
import NUPSArchitectureMap from "@/components/about/carlo/NUPSArchitectureMap";
import LeadershipTeam from "@/components/about/carlo/LeadershipTeam";
import OpportunityPaths from "@/components/about/carlo/OpportunityPaths";
import ThrivalSignature from "@/components/about/carlo/ThrivalSignature";

export default function AboutCarloPage() {
  return (
    <>
      <SEOHead />
      <InteractiveWebGrid />

      <main
        className="min-h-screen w-full text-white flex flex-col items-center pt-20 pb-24 px-4 relative z-10"
        style={{ background: 'transparent' }}
      >
        <CarloHero />
        <CarloOriginStory />
        <FounderArc />
        <PrototypeToLiveWorkflow />
        <NUPSArchitectureMap />
        <LeadershipTeam />
        <OpportunityPaths />
        <ThrivalSignature />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Carlo René Earl",
            "jobTitle": "Founder, Owner, Chief Executive Officer",
            "worksFor": {
              "@type": "Organization",
              "name": "GlyphLock LLC",
              "url": "https://glyphlock.io"
            },
            "description": "Founder and product architect of GlyphLock LLC and the Nexus Unified POS System (NUPS), a venue operating system for hospitality and entertainment operations.",
            "url": "https://glyphlock.io/AboutCarlo",
            "knowsAbout": [
              "Venue operations",
              "Point of sale systems",
              "Evidence recordkeeping",
              "Secure image carriers",
              "Secure QR workflows",
              "Operational and financial recordkeeping",
              "Hospitality integrations"
            ]
          })}
        </script>
      </main>
    </>
  );
}