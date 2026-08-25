const CONTENT = "# GlyphLock LLC\n\nGlyphLock LLC is an Arizona limited liability company founded on May 24, 2025, in El Mirage, Arizona. GlyphLock develops evidence infrastructure for identity, permission, secure QR, venue operations, financial accountability, APIs, hardware-assisted workflows, and governance.\n\n## NUPS\n\nNUPS means Nexus Unified POS System. It is venue-operations software that connects identity, role, contract, shift, register, payout, reconciliation, and audit records. Source systems remain authoritative for the events they control.\n\n## Oracle Hospitality identifiers\n\n- OHIP subscription: 107857124\n- OHIP application: 17363\n- Oracle PartnerNetwork company ID: 4-463913260838\n- Enrollment: 1654123\n- Marketplace subscription: 1655445\n\nThese identifiers document enrollment and development activity. Production access, an Oracle Marketplace listing, and Oracle Simphony certification are not approved as of August 25, 2026.\n\n## Public pages\n\n- Home: https://glyphlock.io/\n- About: https://glyphlock.io/About\n- NUPS: https://glyphlock.io/NUPSLanding\n- Technical Evidence: https://glyphlock.io/TechnicalEvidence\n- Oracle OHIP evidence: https://glyphlock.io/CaseStudyOracleOHIP\n- NUPS positioning: https://glyphlock.io/CaseStudyNUPS\n- Provenance methodology: https://glyphlock.io/ProvenanceMethodology\n- Internal Master Covenant review: https://glyphlock.io/CaseStudyCovenantVictory\n- Security documentation: https://glyphlock.io/SecurityDocs\n- Contact: https://glyphlock.io/Contact\n- Privacy: https://glyphlock.io/Privacy\n- Terms: https://glyphlock.io/Terms\n\n## Discovery\n\n- Sitemap: https://glyphlock.io/sitemap.xml\n- Robots: https://glyphlock.io/robots.txt\n- Canonical origin: https://glyphlock.io\n\nPublic descriptions are factual summaries, not certifications, legal opinions, or claims of third-party approval.\n";

Deno.serve(() => new Response(CONTENT, {
  status: 200,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'Access-Control-Allow-Origin': '*',
    'X-Robots-Tag': 'index, follow',
  },
}));
