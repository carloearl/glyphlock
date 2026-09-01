const SITE_URL = 'https://glyphlock.io';

Deno.serve(() => {
  const knowledge = {
    "@context": "https://schema.org",
    "@type": "Organization",
    meta: {
      version: "4.0",
      generated: new Date().toISOString(),
      canonical: SITE_URL,
      purpose: "Factual AI and crawler discovery",
    },
    organization: {
      name: "GlyphLock LLC",
      legalName: "GlyphLock LLC",
      founded: "2025-05-24",
      jurisdiction: "Arizona, United States",
      location: "El Mirage, Arizona, United States",
      website: SITE_URL,
      founder: "Carlo Rene Earl",
      sameAs: [
        "https://github.com/carloearl/glyphlock",
        "https://linkedin.com/company/glyphlock",
        "https://instagram.com/glyphlock",
        "https://tiktok.com/@glyphlock",
      ],
    },
    nups: {
      name: "NUPS",
      expansion: "Nexus Unified Portal System",
      description: "Venue-operations software connecting identity, roles, contracts, shifts, registers, payouts, reconciliation, and audit records.",
      url: `${SITE_URL}/NUPSLanding`,
      boundaries: [
        "External source systems remain authoritative for events they control.",
        "Production access is not approved.",
        "Oracle Marketplace listing is not approved.",
        "Oracle Simphony certification is not approved.",
      ],
    },
    oracleHospitality: {
      ohipSubscription: "107857124",
      ohipApplication: "17363",
      opnCompanyId: "4-463913260838",
      enrollment: "1654123",
      marketplaceSubscription: "1655445",
      evidenceUrl: `${SITE_URL}/CaseStudyOracleOHIP`,
    },
    technicalEvidence: [
      {
        title: "NUPS Oracle OHIP Partner Sandbox Evidence",
        url: `${SITE_URL}/CaseStudyOracleOHIP`,
        type: "TechArticle",
      },
      {
        title: "NUPS Product Category and Positioning",
        url: `${SITE_URL}/CaseStudyNUPS`,
        type: "TechArticle",
      },
      {
        title: "Provenance and Evidence-Preservation Methodology",
        url: `${SITE_URL}/ProvenanceMethodology`,
        type: "TechArticle",
      },
      {
        title: "Internal Enforceability Review: Master Covenant",
        url: `${SITE_URL}/CaseStudyCovenantVictory`,
        type: "TechArticle",
        disclaimer: "Internal analysis; not reviewed by counsel; no litigation occurred.",
      },
    ],
    publicPages: [
      `${SITE_URL}/`,
      `${SITE_URL}/About`,
      `${SITE_URL}/NUPSLanding`,
      `${SITE_URL}/TechnicalEvidence`,
      `${SITE_URL}/SecurityDocs`,
      `${SITE_URL}/Contact`,
      `${SITE_URL}/Privacy`,
      `${SITE_URL}/Terms`,
    ],
    discovery: {
      sitemap: `${SITE_URL}/sitemap.xml`,
      robots: `${SITE_URL}/robots.txt`,
      llms: `${SITE_URL}/llms.txt`,
    },
  };

  return new Response(JSON.stringify(knowledge, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'index, follow',
    },
  });
});
