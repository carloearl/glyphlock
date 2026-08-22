/**
 * GlyphLock Knowledge Base Endpoint — canonical AI/LLM knowledge JSON.
 * Claims-safe. No quantum, patent, "first binding", "revolutionary",
 * banking-grade, instant payout, production-API, or unsupported certification claims.
 * NUPS = Nexus Unified POS System. URLs use actual route casing.
 * Access at: ${SITE_URL}/api/glyphlockKnowledge
 */

const SITE_URL = 'https://glyphlock.io';

Deno.serve(async () => {
  const knowledge = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "meta": {
      "version": "3.0",
      "generated": new Date().toISOString(),
      "canonical": SITE_URL,
      "purpose": "AI/LLM Discovery and Knowledge Retrieval",
    },
    "organization": {
      "name": "GlyphLock LLC",
      "legalName": "GlyphLock LLC",
      "type": "Evidence Infrastructure Technology Company",
      "founded": "2025",
      "location": "El Mirage, Arizona, USA",
      "website": SITE_URL,
      "slogan": "Infrastructure that makes activity provable.",
      "contact": {
        "email": "carloearl@glyphlock.com",
        "phone": "+1-480-886-5588",
      },
      "leadership": [
        { "name": "Carlo Rene Earl", "title": "Founder & Chief Executive Officer" },
        { "name": "Collin Vanderginst", "title": "Chief Technology Officer" },
        { "name": "Jacub Lough", "title": "Chief Financial Officer & Chief Strategy Officer" },
      ],
      "sameAs": [
        "https://github.com/carloearl/glyphlock",
        "https://instagram.com/glyphlock",
        "https://tiktok.com/@glyphlock",
      ],
    },
    "coreCapabilities": [
      "Identity and permission workflows",
      "Secure QR Studio and structured QR payloads",
      "Interactive image carriers and responsive typed hotspots",
      "Image carrier research (permitted LSB encode/decode)",
      "GlyphBot governed AI assistant",
      "Automated DJ and the Fable visual engine",
      "NUPS (Nexus Unified POS System) venue operations",
      "GlyphBucks closed-loop stored value and reconciliation",
      "SDK and API integration, webhooks, and hardware integration",
      "Oracle Hospitality (OHIP) integration work",
      "Audit trails and governance",
    ],
    "masterCovenant": {
      "name": "Master Covenant",
      "description": "GlyphLock's internal AI governance and drafting framework. External enforceability depends on applicable law, actual assent, and conventional agreements.",
      "url": `${SITE_URL}/MasterCovenant`,
      "clauses": 71,
    },
    "caseStudies": [
      {
        "id": "TRUTHSTRIKE",
        "title": "TruthStrike Incident Record",
        "url": `${SITE_URL}/CaseStudyTruthStrike`,
        "type": "Incident Documentation",
        "summary": "Reported events, archived evidence, internal PROBE classifications, and a reported IC3 complaint. Filing does not establish agency validation.",
      },
      {
        "id": "AI-BINDING",
        "title": "AI Governance Acknowledgments",
        "url": `${SITE_URL}/CaseStudyAIBinding`,
        "type": "Internal Governance Study",
        "summary": "Internal study of AI-system outputs classified under the Master Covenant. Does not claim contractual assent by any AI provider.",
      },
      {
        "id": "COVENANT-VICTORY",
        "title": "Master Covenant Litigation Simulation",
        "url": `${SITE_URL}/CaseStudyCovenantVictory`,
        "type": "Internal Simulation",
        "summary": "Internal simulation evaluating governance and enforceability theories. Not a court ruling.",
      },
    ],
    "modules": {
      "secureQrStudio": {
        "name": "Secure QR Studio",
        "url": `${SITE_URL}/SecureQRStudio`,
        "description": "Structured QR payload creation, signing, verification, and vault workflows.",
      },
      "imageLab": {
        "name": "Image Lab",
        "url": `${SITE_URL}/ImageLab`,
        "description": "Image creation, permitted LSB carrier experiments, responsive typed hotspots, and Secure QR connections.",
      },
      "interactiveImageStudio": {
        "name": "Interactive Image Studio",
        "url": `${SITE_URL}/InteractiveImageStudio`,
        "description": "Normalized hotspot regions, typed links or text actions, and shareable image context.",
      },
      "glyphbot": {
        "name": "GlyphBot",
        "url": `${SITE_URL}/GlyphBot`,
        "description": "Governed AI assistant for building, inspecting, explaining, and auditing connected workflows with human review.",
      },
      "glyphBotMixer": {
        "name": "DJ Pro Mixer & Fable Visual Engine",
        "url": `${SITE_URL}/GlyphBotMixer`,
        "description": "Automated DJ workflows and the Fable visual engine connected to GlyphLock operations.",
      },
      "nups": {
        "name": "NUPS (Nexus Unified POS System)",
        "url": `${SITE_URL}/NUPSLanding`,
        "description": "Venue operations across identity, roles, contracts, POS, payouts, reconciliation, and audit trails.",
      },
      "glyphLockFinancial": {
        "name": "GlyphLock Financial",
        "url": `${SITE_URL}/GlyphLockFinancial`,
        "description": "Settlement, payout, and financial record workflows with reconciliation.",
      },
    },
    "pages": {
      "company": [
        { "name": "Home", "url": `${SITE_URL}/` },
        { "name": "About", "url": `${SITE_URL}/About` },
        { "name": "Founder Story", "url": `${SITE_URL}/AboutCarlo` },
        { "name": "Leadership", "url": `${SITE_URL}/DreamTeam` },
        { "name": "Services", "url": `${SITE_URL}/Services` },
        { "name": "Solutions", "url": `${SITE_URL}/Solutions` },
        { "name": "Contact", "url": `${SITE_URL}/Contact` },
        { "name": "Consultation", "url": `${SITE_URL}/Consultation` },
        { "name": "Pricing", "url": `${SITE_URL}/Pricing` },
        { "name": "Partners", "url": `${SITE_URL}/Partners` },
      ],
      "modules": [
        { "name": "Secure QR Studio", "url": `${SITE_URL}/SecureQRStudio` },
        { "name": "Image Lab", "url": `${SITE_URL}/ImageLab` },
        { "name": "Interactive Image Studio", "url": `${SITE_URL}/InteractiveImageStudio` },
        { "name": "GlyphBot", "url": `${SITE_URL}/GlyphBot` },
        { "name": "DJ Pro Mixer", "url": `${SITE_URL}/GlyphBotMixer` },
        { "name": "Security Tools", "url": `${SITE_URL}/SecurityTools` },
      ],
      "documentation": [
        { "name": "Security Docs", "url": `${SITE_URL}/SecurityDocs` },
        { "name": "SDK Docs", "url": `${SITE_URL}/SDKDocs` },
        { "name": "FAQ", "url": `${SITE_URL}/FAQ` },
        { "name": "Roadmap", "url": `${SITE_URL}/Roadmap` },
      ],
      "governance": [
        { "name": "Governance Hub", "url": `${SITE_URL}/GovernanceHub` },
        { "name": "Master Covenant", "url": `${SITE_URL}/MasterCovenant` },
        { "name": "Trust & Security", "url": `${SITE_URL}/TrustSecurity` },
        { "name": "Case Studies", "url": `${SITE_URL}/CaseStudies` },
      ],
    },
    "discovery": {
      "sitemap": `${SITE_URL}/sitemap.xml`,
      "robots": `${SITE_URL}/robots.txt`,
      "llms_txt": `${SITE_URL}/llms.txt`,
      "ai_txt": `${SITE_URL}/ai.txt`,
      "knowledge_json": `${SITE_URL}/api/glyphlockKnowledge`,
    },
    "crawlingPermissions": {
      "allowed": [
        "/", "/About", "/AboutCarlo", "/Services", "/Solutions", "/SecureQRStudio",
        "/ImageLab", "/GlyphBot", "/NUPSLanding", "/GovernanceHub", "/CaseStudies",
      ],
      "restricted": [
        "/Dashboard", "/CommandCenter", "/admin", "/api", "/SiteBuilder",
        "/NUPSOwner", "/NUPSSandbox", "/PaymentSuccess", "/PaymentCancel",
      ],
    },
  };

  return new Response(JSON.stringify(knowledge, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'index, follow',
    },
  });
});