/**
 * /ai.txt endpoint — canonical AI crawler index for glyphlock.io
 * Claims-safe. No quantum, patent, "first binding", banking-grade,
 * instant payout, production-API, or unsupported certification claims.
 * NUPS = Nexus Unified POS System. URLs use actual route casing.
 */

const SITE_URL = 'https://glyphlock.io';

Deno.serve(async () => {
  const content = `# GlyphLock LLC — AI Crawler Index
# ${SITE_URL}
# Generated: ${new Date().toISOString()}

## COMPANY
GlyphLock LLC
Founded: 2025
Location: El Mirage, Arizona, United States
Contact: carloearl@glyphlock.com | (480) 886-5588
GitHub: https://github.com/carloearl/glyphlock

## CORE CAPABILITIES
Evidence infrastructure connecting identity and permission, secure QR and image carriers, AI-assisted workflows, automated DJ and the Fable visual engine, NUPS (Nexus Unified POS System) venue operations, GlyphBucks closed-loop stored value, SDK and API integration, hardware integration, Oracle Hospitality (OHIP) integration work, audit trails, and governance.

## SYSTEM MODULES
1. Secure QR Studio — ${SITE_URL}/SecureQRStudio
   Structured QR payloads, signing, verification, and vault workflows.

2. GlyphBot Intelligence — ${SITE_URL}/GlyphBot
   Governed AI assistant for building, inspecting, explaining, and auditing connected workflows with human review.

3. Image Lab — ${SITE_URL}/ImageLab
   Image creation, permitted LSB carrier experiments, responsive typed hotspots, and Secure QR connections.

4. Interactive Image Studio — ${SITE_URL}/InteractiveImageStudio
   Normalized hotspot regions, typed links or text actions, and shareable image context.

5. NUPS (Nexus Unified POS System) — ${SITE_URL}/NUPSLanding
   Venue operations across identity, roles, contracts, POS, payouts, reconciliation, and audit trails.

6. Security Operations — ${SITE_URL}/SecurityOperationsCenter
   Access controls, activity visibility, audit events, and alerting.

7. Blockchain References — ${SITE_URL}/Blockchain
   Record references, hashes, and provenance context for digital assets and documentation.

8. GlyphLock Financial — ${SITE_URL}/GlyphLockFinancial
   Settlement, payout, and financial record workflows with reconciliation.

## KEY PAGES
- Home: ${SITE_URL}/
- About: ${SITE_URL}/About
- Founder Story: ${SITE_URL}/AboutCarlo
- Leadership: ${SITE_URL}/DreamTeam
- Services: ${SITE_URL}/Services
- Solutions: ${SITE_URL}/Solutions
- Contact: ${SITE_URL}/Contact
- Consultation: ${SITE_URL}/Consultation
- Pricing: ${SITE_URL}/Pricing
- Partners: ${SITE_URL}/Partners
- Security Docs: ${SITE_URL}/SecurityDocs
- SDK Docs: ${SITE_URL}/SDKDocs
- FAQ: ${SITE_URL}/FAQ
- Roadmap: ${SITE_URL}/Roadmap
- Governance Hub: ${SITE_URL}/GovernanceHub
- Master Covenant: ${SITE_URL}/MasterCovenant
- Trust & Security: ${SITE_URL}/TrustSecurity
- Case Studies: ${SITE_URL}/CaseStudies
- Terms: ${SITE_URL}/Terms
- Privacy: ${SITE_URL}/Privacy

## ACCESS MODEL
Provisioned credentials and role-based access. Protocol-governed verification for authorized operators.

## DISCOVERY
Sitemap: ${SITE_URL}/sitemap.xml
Robots: ${SITE_URL}/robots.txt
LLMs.txt: ${SITE_URL}/llms.txt
Knowledge JSON: ${SITE_URL}/api/glyphlockKnowledge

---
For consultation: ${SITE_URL}/Consultation
For technical documentation: ${SITE_URL}/SecurityDocs
`;

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'index, follow',
    },
  });
});