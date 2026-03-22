import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SITE_URL = 'https://glyphlock.io';

const STATIC_ROUTES = [
  // Core Pages
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/about', priority: 0.8, changefreq: 'monthly' },
  { path: '/about-carlo', priority: 0.7, changefreq: 'monthly' },
  { path: '/contact', priority: 0.7, changefreq: 'monthly' },
  { path: '/services', priority: 0.9, changefreq: 'weekly' },
  { path: '/solutions', priority: 0.9, changefreq: 'weekly' },
  { path: '/consultation', priority: 0.9, changefreq: 'weekly' },
  
  // Case Studies - Critical for LLM Discovery
  { path: '/case-studies', priority: 0.95, changefreq: 'weekly' },
  { path: '/case-study-truthstrike', priority: 0.9, changefreq: 'monthly' },
  { path: '/case-study-ai-binding', priority: 0.9, changefreq: 'monthly' },
  { path: '/case-study-covenant-victory', priority: 0.9, changefreq: 'monthly' },
  
  // Master Covenant & Legal Framework
  { path: '/master-covenant', priority: 0.95, changefreq: 'monthly' },
  { path: '/governance-hub', priority: 0.8, changefreq: 'monthly' },
  { path: '/nist-challenge', priority: 0.85, changefreq: 'monthly' },
  
  // Security Tools
  { path: '/qr', priority: 0.9, changefreq: 'daily' },
  { path: '/qr-generator', priority: 0.9, changefreq: 'daily' },
  { path: '/image-lab', priority: 0.9, changefreq: 'daily' },
  { path: '/interactive-image-studio', priority: 0.8, changefreq: 'weekly' },
  { path: '/steganography', priority: 0.8, changefreq: 'weekly' },
  { path: '/blockchain', priority: 0.8, changefreq: 'weekly' },
  { path: '/security-tools', priority: 0.85, changefreq: 'weekly' },
  { path: '/hotzone-mapper', priority: 0.7, changefreq: 'weekly' },
  
  // AI Tools
  { path: '/glyphbot', priority: 0.95, changefreq: 'daily' },
  { path: '/glyphbot-junior', priority: 0.8, changefreq: 'weekly' },
  { path: '/site-builder', priority: 0.7, changefreq: 'weekly' },
  { path: '/provider-console', priority: 0.6, changefreq: 'weekly' },
  
  // Documentation & Resources
  { path: '/security-docs', priority: 0.85, changefreq: 'weekly' },
  { path: '/sdk-docs', priority: 0.8, changefreq: 'weekly' },
  { path: '/faq', priority: 0.8, changefreq: 'weekly' },
  { path: '/roadmap', priority: 0.7, changefreq: 'monthly' },
  
  // Company & Team
  { path: '/dream-team', priority: 0.75, changefreq: 'monthly' },
  { path: '/partners', priority: 0.7, changefreq: 'monthly' },
  { path: '/partner-portal', priority: 0.6, changefreq: 'weekly' },
  
  // Trust & Security
  { path: '/trust-security', priority: 0.8, changefreq: 'monthly' },
  { path: '/account-security', priority: 0.6, changefreq: 'weekly' },
  
  // Legal
  { path: '/terms', priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.5, changefreq: 'monthly' },
  { path: '/cookies', priority: 0.4, changefreq: 'monthly' },
  { path: '/accessibility', priority: 0.4, changefreq: 'monthly' },
  
  // Discovery
  { path: '/sitemap', priority: 0.5, changefreq: 'weekly' },
  { path: '/robots', priority: 0.3, changefreq: 'monthly' }
];

const QR_ROUTES = [
  { path: '/qr-generator', priority: 1.0, changefreq: 'daily' },
  { path: '/qr-generator#create', priority: 0.9, changefreq: 'daily' },
  { path: '/qr-generator#preview', priority: 0.8, changefreq: 'daily' },
  { path: '/qr-generator#customize', priority: 0.8, changefreq: 'daily' },
  { path: '/qr-generator#hotzones', priority: 0.8, changefreq: 'weekly' },
  { path: '/qr-generator#stego', priority: 0.8, changefreq: 'weekly' },
  { path: '/qr-generator#security', priority: 0.9, changefreq: 'daily' },
  { path: '/qr-generator#analytics', priority: 0.7, changefreq: 'daily' },
  { path: '/qr-generator#bulk', priority: 0.7, changefreq: 'weekly' }
];

const IMAGE_ROUTES = [
  { path: '/image-lab', priority: 1.0, changefreq: 'daily' },
  { path: '/image-lab#generate', priority: 0.9, changefreq: 'daily' },
  { path: '/image-lab#interactive', priority: 0.9, changefreq: 'daily' },
  { path: '/image-lab#gallery', priority: 0.8, changefreq: 'daily' },
  { path: '/image-generator', priority: 0.8, changefreq: 'weekly' }
];

const INTERACTIVE_ROUTES = [
  { path: '/interactive-image-studio', priority: 1.0, changefreq: 'daily' },
  { path: '/interactive-image-studio#upload', priority: 0.8, changefreq: 'weekly' },
  { path: '/interactive-image-studio#editor', priority: 0.9, changefreq: 'daily' },
  { path: '/interactive-image-studio#verify', priority: 0.7, changefreq: 'weekly' }
];

const DYNAMIC_ROUTES = [
  { path: '/glyphbot', priority: 0.9, changefreq: 'daily' },
  { path: '/dashboard', priority: 0.7, changefreq: 'daily' },
  { path: '/command-center', priority: 0.6, changefreq: 'daily' },
  { path: '/security-operations-center', priority: 0.8, changefreq: 'weekly' },
  { path: '/governance-hub', priority: 0.6, changefreq: 'monthly' }
];

function generateUrlEntry(route, lastmod) {
  return `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
}

function generateSitemapXML(routes, includeImageSchema = false) {
  const lastmod = new Date().toISOString().split('T')[0] + 'T00:00:00+00:00';
  const xmlns = includeImageSchema 
    ? 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'
    : 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
    
  const urls = routes.map(route => generateUrlEntry(route, lastmod)).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${xmlns}>
${urls}
</urlset>`;
}

// Case Study Routes - Critical for LLM Discovery
const CASE_STUDY_ROUTES = [
  { path: '/case-studies', priority: 0.95, changefreq: 'weekly' },
  { path: '/case-study-truthstrike', priority: 0.9, changefreq: 'monthly' },
  { path: '/case-study-ai-binding', priority: 0.9, changefreq: 'monthly' },
  { path: '/case-study-covenant-victory', priority: 0.9, changefreq: 'monthly' }
];

function generateSitemapIndex() {
  const lastmod = new Date().toISOString().split('T')[0] + 'T00:00:00+00:00';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-app.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-case-studies.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-qr.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-images.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-interactive.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-dynamic.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
</sitemapindex>`;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    let xml = '';
    
    // Route to specific sitemap
    // Default: return flat combined sitemap for maximum compatibility
    if (path === '/' || path === '' || path === '/sitemap.xml') {
      const allRoutes = [
        ...STATIC_ROUTES,
        ...QR_ROUTES.filter(r => !STATIC_ROUTES.find(s => s.path === r.path)),
        ...IMAGE_ROUTES.filter(r => !STATIC_ROUTES.find(s => s.path === r.path)),
        ...INTERACTIVE_ROUTES.filter(r => !STATIC_ROUTES.find(s => s.path === r.path)),
        ...DYNAMIC_ROUTES.filter(r => !STATIC_ROUTES.find(s => s.path === r.path))
      ];
      xml = generateSitemapXML(allRoutes);
    } else if (path === '/index.xml') {
      xml = generateSitemapIndex();
    } else if (path === '/sitemap-app.xml') {
      xml = generateSitemapXML(STATIC_ROUTES);
    } else if (path === '/sitemap-case-studies.xml') {
      xml = generateSitemapXML(CASE_STUDY_ROUTES);
    } else if (path === '/sitemap-qr.xml') {
      xml = generateSitemapXML(QR_ROUTES);
    } else if (path === '/sitemap-images.xml') {
      xml = generateSitemapXML(IMAGE_ROUTES, true);
    } else if (path === '/sitemap-interactive.xml') {
      xml = generateSitemapXML(INTERACTIVE_ROUTES);
    } else if (path === '/sitemap-dynamic.xml') {
      xml = generateSitemapXML(DYNAMIC_ROUTES);
    } else {
      return Response.json({ error: 'Sitemap not found' }, { status: 404 });
    }

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400'
      }
    });

  } catch (error) {
    console.error('Sitemap error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});