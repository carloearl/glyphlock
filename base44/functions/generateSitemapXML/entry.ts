/**
 * generateSitemapXML — canonical sitemap XML generator for glyphlock.io.
 * Public indexable routes only, actual route casing, no duplicates.
 * NUPS = Nexus Unified POS System.
 */

const SITE_URL = 'https://glyphlock.io';

const PUBLIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/About', priority: 0.9, changefreq: 'weekly' },
  { path: '/AboutCarlo', priority: 0.8, changefreq: 'monthly' },
  { path: '/Services', priority: 0.9, changefreq: 'weekly' },
  { path: '/Solutions', priority: 0.9, changefreq: 'weekly' },
  { path: '/Pricing', priority: 0.9, changefreq: 'weekly' },
  { path: '/Contact', priority: 0.8, changefreq: 'monthly' },
  { path: '/Consultation', priority: 0.8, changefreq: 'monthly' },
  { path: '/SecureQRStudio', priority: 0.9, changefreq: 'daily' },
  { path: '/ImageLab', priority: 0.9, changefreq: 'weekly' },
  { path: '/ImageGenerator', priority: 0.8, changefreq: 'weekly' },
  { path: '/InteractiveImageStudio', priority: 0.8, changefreq: 'weekly' },
  { path: '/GlyphBot', priority: 0.9, changefreq: 'daily' },
  { path: '/GlyphBotMixer', priority: 0.8, changefreq: 'weekly' },
  { path: '/SecurityTools', priority: 0.8, changefreq: 'weekly' },
  { path: '/SecurityOperationsCenter', priority: 0.8, changefreq: 'weekly' },
  { path: '/Blockchain', priority: 0.8, changefreq: 'weekly' },
  { path: '/SDKDocs', priority: 0.7, changefreq: 'weekly' },
  { path: '/SecurityDocs', priority: 0.7, changefreq: 'weekly' },
  { path: '/Roadmap', priority: 0.7, changefreq: 'monthly' },
  { path: '/Partners', priority: 0.8, changefreq: 'monthly' },
  { path: '/DreamTeam', priority: 0.7, changefreq: 'monthly' },
  { path: '/FAQ', priority: 0.7, changefreq: 'monthly' },
  { path: '/GovernanceHub', priority: 0.95, changefreq: 'monthly' },
  { path: '/MasterCovenant', priority: 0.95, changefreq: 'monthly' },
  { path: '/TrustSecurity', priority: 0.8, changefreq: 'monthly' },
  { path: '/NISTChallenge', priority: 0.8, changefreq: 'monthly' },
  { path: '/CaseStudies', priority: 0.95, changefreq: 'weekly' },
  { path: '/CaseStudyTruthStrike', priority: 0.9, changefreq: 'monthly' },
  { path: '/CaseStudyAIBinding', priority: 0.9, changefreq: 'monthly' },
  { path: '/CaseStudyCovenantVictory', priority: 0.9, changefreq: 'monthly' },
  { path: '/GlyphLockFinancial', priority: 0.7, changefreq: 'monthly' },
  { path: '/NUPSLanding', priority: 0.9, changefreq: 'weekly' },
  { path: '/VideoUpload', priority: 0.5, changefreq: 'monthly' },
  { path: '/ProviderConsole', priority: 0.5, changefreq: 'monthly' },
  { path: '/Privacy', priority: 0.5, changefreq: 'yearly' },
  { path: '/Terms', priority: 0.5, changefreq: 'yearly' },
  { path: '/Cookies', priority: 0.4, changefreq: 'yearly' },
  { path: '/Accessibility', priority: 0.4, changefreq: 'yearly' },
  { path: '/CodeOfEthics', priority: 0.6, changefreq: 'yearly' },
];

function generateSitemapXML(routes) {
  const lastmod = new Date().toISOString().split('T')[0];
  const urls = routes.map((route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const type = body?.type || 'xml';
    const routes = type === 'app' ? PUBLIC_ROUTES.slice(0, 8) : PUBLIC_ROUTES;
    return Response.json({ xml: generateSitemapXML(routes) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});