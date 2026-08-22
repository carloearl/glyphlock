import React from "react";
import SEOHead from "@/components/SEOHead";
import InteractiveWebGrid from "@/components/global/InteractiveWebGrid";
import FounderStoryNarrative from "@/components/about/carlo/FounderStoryNarrative";

export default function AboutCarloPage() {
  return (
    <>
      <SEOHead />
      <InteractiveWebGrid />

      <main
        className="min-h-screen w-full text-white flex flex-col items-center pt-20 pb-24 px-4 relative z-10"
        style={{ background: 'transparent' }}
      >
        <FounderStoryNarrative />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Carlo René Earl",
            "jobTitle": "Founder, Owner, Chief Executive Officer and Directing Architectural Control Officer",
            "worksFor": {
              "@type": "Organization",
              "name": "GlyphLock LLC",
              "url": "https://glyphlock.io"
            },
            "description": "Founder of GlyphLock LLC and creator of NUPS, shaped by firsthand experience in venue operations, identity, transaction evidence, agreements, and accountability.",
            "url": "https://glyphlock.io/about-carlo",
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