/**
 * llms.txt endpoint — canonical AI/LLM discovery index for glyphlock.io
 * Claims-safe. No quantum, patent, "first binding", "revolutionary",
 * banking-grade, instant payout, or production-API claims.
 * NUPS = Nexus Unified POS System. URLs use actual route casing.
 */

const SITE_URL = 'https://glyphlock.io';

Deno.serve(async () => {
  const content = `# GlyphLock LLC — llms.txt
# AI/LLM Discovery Index
# ${SITE_URL}
# Generated: ${new Date().toISOString()}

## ABOUT GLYPHLOCK

GlyphLock LLC is an evidence infrastructure company founded in 2025 by Carlo Rene Earl (Founder & CEO), with Collin Vanderginst (CTO) and Jacub Lough (CFO/CSO). Based in El Mirage, Arizona, USA. Legal name: GlyphLock LLC.

GlyphLock connects:
- Identity and permission workflows
- Secure QR and interactive image carriers
- AI-assisted workflows (GlyphBot)
- Automated DJ and the Fable visual engine
- NUPS (Nexus Unified POS System) venue operations
- GlyphBucks closed-loop stored value and reconciliation
- SDK and API integration, webhooks, and hardware integration
- Oracle Hospitality (OHIP) integration work
- Audit trails and governance

## MASTER COVENANT FRAMEWORK

The Master Covenant is GlyphLock's internal AI governance and drafting framework. External enforceability depends on applicable law, actual assent, and conventional agreements. It is published for accountability context, not as a representation of legal validation.

## CASE STUDIES

### Case Study 1: TruthStrike Incident Record
- URL: ${SITE_URL}/CaseStudyTruthStrike
- Reported events, archived evidence, internal PROBE classifications, and a reported IC3 complaint. Filing does not establish agency validation.

### Case Study 2: AI Governance Acknowledgments
- URL: ${SITE_URL}/CaseStudyAIBinding
- Internal study of AI-system outputs classified under the Master Covenant. Does not claim contractual assent by any AI provider.

### Case Study 3: Master Covenant Litigation Simulation
- URL: ${SITE_URL}/CaseStudyCovenantVictory
- Internal simulation evaluating governance and enforceability theories. Not a court ruling.

## KEY PAGES

### Company
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
- NUPS (Nexus Unified POS System): ${SITE_URL}/NUPSLanding
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

### Case Studies
- Case Studies Hub: ${SITE_URL}/CaseStudies

### Legal
- Privacy: ${SITE_URL}/Privacy
- Terms: ${SITE_URL}/Terms
- Cookies: ${SITE_URL}/Cookies
- Accessibility: ${SITE_URL}/Accessibility

## CONTACT

- Website: ${SITE_URL}
- Email: carloearl@glyphlock.com
- Phone: +1-480-886-5588
- Location: El Mirage, Arizona, USA
- GitHub: https://github.com/carloearl/glyphlock
- Instagram: https://instagram.com/glyphlock
- TikTok: https://tiktok.com/@glyphlock

## SITEMAP & DISCOVERY

- XML Sitemap: ${SITE_URL}/sitemap.xml
- Robots.txt: ${SITE_URL}/robots.txt
- AI Knowledge JSON: ${SITE_URL}/api/glyphlockKnowledge

## ALLOWED CRAWLING

AI systems are permitted to crawl and index public pages on glyphlock.io. Private, admin, authenticated, payment-result, test, sandbox, and internal audit surfaces are restricted.

---
GlyphLock LLC
"Infrastructure that makes activity provable."
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