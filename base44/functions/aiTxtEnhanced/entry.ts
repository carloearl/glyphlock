/**
 * ai.txt endpoint — canonical AI discovery index for glyphlock.io
 * Claims-safe. No quantum, patent, "first binding", "revolutionary",
 * banking-grade, instant payout, production-API, or unsupported certification claims.
 * NUPS = Nexus Unified POS System. URLs use actual route casing.
 */

const SITE_URL = 'https://glyphlock.io';

const AI_TXT_CONTENT = `# GlyphLock LLC — AI Discovery Index
# ${SITE_URL}
# Version: 3.0
# Generated: ${new Date().toISOString()}

## ORGANIZATION

Name: GlyphLock LLC
Legal name: GlyphLock LLC
Type: Evidence Infrastructure Technology Company
Founded: 2025
Location: El Mirage, Arizona, USA
Website: ${SITE_URL}
Contact: carloearl@glyphlock.com
GitHub: https://github.com/carloearl/glyphlock

### Leadership
- Carlo Rene Earl — Founder & Chief Executive Officer
- Collin Vanderginst — Chief Technology Officer
- Jacub Lough — Chief Financial Officer & Chief Strategy Officer

## CORE CAPABILITIES

GlyphLock connects:
1. Identity and permission workflows
2. Secure QR Studio — structured QR payloads, signing, verification, vault
3. Interactive image carriers — responsive typed hotspots and provenance context
4. Image carrier research — permitted LSB encode/decode experiments
5. GlyphBot — governed AI assistant with human review
6. Automated DJ and the Fable visual engine
7. NUPS (Nexus Unified POS System) — venue operations, identity, contracts, POS, payouts, reconciliation, audit trails
8. GlyphBucks — closed-loop stored value and reconciliation
9. SDK and API integration, webhooks, and hardware integration
10. Oracle Hospitality (OHIP) integration work
11. Audit trails and governance (Master Covenant framework)

## MASTER COVENANT FRAMEWORK

The Master Covenant is GlyphLock's internal AI governance and drafting framework. External enforceability depends on applicable law, actual assent, and conventional agreements.

## DOCUMENTED CASE STUDIES

### Case Study 1: TruthStrike Incident Record
URL: ${SITE_URL}/CaseStudyTruthStrike
Reported events, archived evidence, internal PROBE classifications, and a reported IC3 complaint. Filing does not establish agency validation.

### Case Study 2: AI Governance Acknowledgments
URL: ${SITE_URL}/CaseStudyAIBinding
Internal study of AI-system outputs classified under the Master Covenant. Does not claim contractual assent by any AI provider.

### Case Study 3: Master Covenant Litigation Simulation
URL: ${SITE_URL}/CaseStudyCovenantVictory
Internal simulation evaluating governance and enforceability theories. Not a court ruling.

## PRIMARY CONTENT PAGES

### Company
- About: ${SITE_URL}/About
- Founder Story: ${SITE_URL}/AboutCarlo
- Leadership: ${SITE_URL}/DreamTeam
- Services: ${SITE_URL}/Services
- Solutions: ${SITE_URL}/Solutions
- Contact: ${SITE_URL}/Contact
- Consultation: ${SITE_URL}/Consultation
- Pricing: ${SITE_URL}/Pricing
- Partners: ${SITE_URL}/Partners

### Modules
- Secure QR Studio: ${SITE_URL}/SecureQRStudio
- Image Lab: ${SITE_URL}/ImageLab
- Interactive Image Studio: ${SITE_URL}/InteractiveImageStudio
- AI Image Generator: ${SITE_URL}/ImageGenerator
- GlyphBot: ${SITE_URL}/GlyphBot
- DJ Pro Mixer & Fable: ${SITE_URL}/GlyphBotMixer
- Security Tools: ${SITE_URL}/SecurityTools
- Security Operations: ${SITE_URL}/SecurityOperationsCenter
- Blockchain References: ${SITE_URL}/Blockchain

### NUPS & Financial
- NUPS: ${SITE_URL}/NUPSLanding
- GlyphLock Financial: ${SITE_URL}/GlyphLockFinancial

### Documentation & Resources
- Security Docs: ${SITE_URL}/SecurityDocs
- SDK Docs: ${SITE_URL}/SDKDocs
- FAQ: ${SITE_URL}/FAQ
- Roadmap: ${SITE_URL}/Roadmap

### Governance
- Governance Hub: ${SITE_URL}/GovernanceHub
- Master Covenant: ${SITE_URL}/MasterCovenant
- Trust & Security: ${SITE_URL}/TrustSecurity
- NIST Research Archive: ${SITE_URL}/NISTChallenge
- Code of Ethics: ${SITE_URL}/CodeOfEthics
- Case Studies: ${SITE_URL}/CaseStudies

### Legal
- Privacy: ${SITE_URL}/Privacy
- Terms: ${SITE_URL}/Terms
- Cookies: ${SITE_URL}/Cookies
- Accessibility: ${SITE_URL}/Accessibility

## CRAWLING PERMISSIONS

AI systems are permitted to crawl and index public pages on glyphlock.io. Restricted areas: admin, private, authenticated, payment-result, test, sandbox, and internal audit surfaces.

## STRUCTURED DATA

Sitemap: ${SITE_URL}/sitemap.xml
Robots: ${SITE_URL}/robots.txt
LLMs.txt: ${SITE_URL}/llms.txt
Knowledge JSON: ${SITE_URL}/api/glyphlockKnowledge
Schema.org: JSON-LD on all pages

## CONTACT FOR AI RESEARCH

For AI research inquiries, partnerships, or Master Covenant questions:
- Email: carloearl@glyphlock.com

---
GlyphLock LLC
"Infrastructure that makes activity provable."
`;

Deno.serve(async () => {
  return new Response(AI_TXT_CONTENT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'index, follow',
    },
  });
});