/**
 * Sitemap Index - Primary sitemap index for GlyphLock.io
 * Serves at: https://glyphlock.io/sitemap.xml
 * References all child sitemaps with proper .xml extensions
 */

const SITE_URL = 'https://glyphlock.io';

Deno.serve(async (req) => {
  const now = new Date();
  const lastmod = now.toISOString();
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
              xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
              xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                                  http://www.sitemaps.org/schemas/sitemap/0.9/siteindex.xsd">
  <!-- GlyphLock.io Sitemap Index -->
  <!-- Generated: ${lastmod} -->
  
  <sitemap>
    <loc>${SITE_URL}/sitemap-app.xml</loc>
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

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noarchive',
      'Access-Control-Allow-Origin': '*'
    }
  });
});