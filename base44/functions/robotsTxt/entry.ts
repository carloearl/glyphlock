/**
 * robots.txt endpoint — canonical same-origin robots for glyphlock.io
 * NUPS = Nexus Unified POS System.
 * Noindex: admin / private / authenticated / payment-result / test / sandbox / internal audit
 * plus duplicate-case route variants to avoid canonical duplication.
 */

const SITE_URL = 'https://glyphlock.io';

const PUBLIC_ALLOW = [
  '/About', '/AboutCarlo', '/Services', '/Solutions', '/Pricing',
  '/Contact', '/Consultation', '/SecureQRStudio', '/ImageLab', '/ImageGenerator',
  '/InteractiveImageStudio', '/GlyphBot', '/GlyphBotMixer', '/SecurityTools',
  '/SecurityOperationsCenter', '/Blockchain', '/SDKDocs', '/SecurityDocs',
  '/Roadmap', '/Partners', '/DreamTeam', '/FAQ', '/GovernanceHub',
  '/MasterCovenant', '/TrustSecurity', '/NISTChallenge', '/CaseStudies',
  '/CaseStudyTruthStrike', '/CaseStudyAIBinding', '/CaseStudyCovenantVictory',
  '/GlyphLockFinancial', '/NUPSLanding', '/VideoUpload', '/ProviderConsole',
  '/Privacy', '/Terms', '/Cookies', '/Accessibility', '/CodeOfEthics',
];

const NOINDEX = [
  '/Dashboard', '/CommandCenter', '/ProjectUpdates', '/AccountSecurity',
  '/BillingAndPayments', '/ManageSubscription', '/PaymentSuccess', '/PaymentCancel',
  '/ConsultationSuccess', '/EmergencyBackup', '/FullExport', '/GlyphLockAudit',
  '/GlyphLockPlayground', '/IntegrationTests', '/SystemAudit', '/SettlementReports',
  '/AnalyticsDashboard', '/NUPSDemoManager', '/NUPSOwner', '/NUPSPostLogin',
  '/NUPSReport', '/NUPSSandbox', '/NUPSStaff', '/NUPSAudit', '/NUPSInfrastructurePage',
  '/SiteBuilder', '/SiteBuilderTest', '/SiteAudit', '/Sie', '/ClubCurrencyPress',
  '/ContractArchive', '/ContractSearch', '/StrategicScale', '/OHIPReadiness',
  '/VIPContract', '/Sitemap', '/SitemapApp', '/SitemapDynamic', '/SitemapImages',
  '/SitemapInteractive', '/SitemapQr', '/sitemap-qr', '/Robots', '/NotFound',
  '/api/', '/functions/', '/admin/',
  '/nupskiosk', '/nupshub', '/register', '/registerconsole', '/barregister',
  '/receipts', '/driverpayouts', '/glyphbucks', '/accounting', '/tonight',
  '/contracts', '/contractshub', '/vipbillprinter', '/managerconsole',
  '/peoplearchive', '/ledgertrialbalance', '/frontdoor', '/entertainercheckin',
  '/djhome', '/vipsale', '/vipcommand', '/vipshowcontracts', '/v/',
  '/offlineverify', '/mobilescanner', '/clubtv', '/fablestage',
];

// Duplicate-case variants of public routes (noindex to avoid canonical duplication).
const DUP_CASE = [
  '/about', '/aboutcarlo', '/services', '/solutions', '/pricing', '/contact',
  '/consultation', '/secureqrstudio', '/imagelab', '/imagegenerator',
  '/interactiveimagestudio', '/glyphbot', '/glyphbotmixer', '/securitytools',
  '/securityoperationscenter', '/blockchain', '/sdkdocs', '/securitydocs',
  '/roadmap', '/partners', '/dreamteam', '/faq', '/governancehub',
  '/mastercovenant', '/trustsecurity', '/nistchallenge', '/casestudies',
  '/glyphlockfinancial', '/nupslanding',
];

Deno.serve(async () => {
  const allowLines = PUBLIC_ALLOW.map((p) => `Allow: ${p}`).join('\n');
  const noindexLines = NOINDEX.map((p) => `Disallow: ${p}`).join('\n');
  const dupCaseLines = DUP_CASE.map((p) => `Disallow: ${p}`).join('\n');

  const robotsContent = `# GlyphLock LLC — robots.txt
# Canonical origin: ${SITE_URL}
# NUPS = Nexus Unified POS System
# Generated: ${new Date().toISOString()}

User-agent: *
Allow: /
Allow: /$
${allowLines}

# Noindex: admin / private / authenticated / payment-result / test / sandbox / internal audit
${noindexLines}

# Duplicate-case route variants (noindex to avoid canonical duplication)
${dupCaseLines}

# Discovery
Sitemap: ${SITE_URL}/sitemap.txt
Sitemap: ${SITE_URL}/sitemap.xml

Crawl-delay: 1

User-agent: GPTBot
Allow: /
Crawl-delay: 2

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 2

User-agent: anthropic-ai
Allow: /
Crawl-delay: 2

User-agent: Claude-Web
Allow: /
Crawl-delay: 2

User-agent: Google-Extended
Allow: /
Crawl-delay: 2

User-agent: PerplexityBot
Allow: /
Crawl-delay: 2

User-agent: CCBot
Allow: /
Crawl-delay: 2

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1
`;

  return new Response(robotsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
});