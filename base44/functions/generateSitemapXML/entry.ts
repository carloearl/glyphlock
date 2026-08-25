const SITE_URL = 'https://glyphlock.io';
const ROUTES = [
  {
    "path": "/",
    "lastmod": "2026-08-22",
    "changefreq": "daily",
    "priority": "1.0"
  },
  {
    "path": "/About",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/AboutCarlo",
    "lastmod": "2026-08-22",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/Services",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/Solutions",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/Pricing",
    "lastmod": "2026-03-14",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/Contact",
    "lastmod": "2026-08-23",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/Consultation",
    "lastmod": "2026-08-17",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/SecureQRStudio",
    "lastmod": "2026-08-17",
    "changefreq": "daily",
    "priority": "0.9"
  },
  {
    "path": "/ImageLab",
    "lastmod": "2026-06-03",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/ImageGenerator",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/InteractiveImageStudio",
    "lastmod": "2026-02-02",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/GlyphBot",
    "lastmod": "2026-08-22",
    "changefreq": "daily",
    "priority": "0.9"
  },
  {
    "path": "/GlyphBotMixer",
    "lastmod": "2026-08-25",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/SecurityTools",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/SecurityOperationsCenter",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/Blockchain",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.8"
  },
  {
    "path": "/SDKDocs",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.7"
  },
  {
    "path": "/SecurityDocs",
    "lastmod": "2026-08-22",
    "changefreq": "weekly",
    "priority": "0.7"
  },
  {
    "path": "/Roadmap",
    "lastmod": "2026-08-22",
    "changefreq": "monthly",
    "priority": "0.7"
  },
  {
    "path": "/Partners",
    "lastmod": "2026-08-22",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/DreamTeam",
    "lastmod": "2026-08-17",
    "changefreq": "monthly",
    "priority": "0.7"
  },
  {
    "path": "/FAQ",
    "lastmod": "2026-08-22",
    "changefreq": "monthly",
    "priority": "0.7"
  },
  {
    "path": "/GovernanceHub",
    "lastmod": "2026-08-17",
    "changefreq": "monthly",
    "priority": "0.95"
  },
  {
    "path": "/MasterCovenant",
    "lastmod": "2025-11-16",
    "changefreq": "monthly",
    "priority": "0.95"
  },
  {
    "path": "/TrustSecurity",
    "lastmod": "2026-08-22",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/NISTChallenge",
    "lastmod": "2026-04-15",
    "changefreq": "monthly",
    "priority": "0.8"
  },
  {
    "path": "/TechnicalEvidence",
    "lastmod": "2026-08-25",
    "changefreq": "weekly",
    "priority": "0.95"
  },
  {
    "path": "/CaseStudyOracleOHIP",
    "lastmod": "2026-08-25",
    "changefreq": "monthly",
    "priority": "0.9"
  },
  {
    "path": "/OracleOHIPMilestone",
    "lastmod": "2026-08-25",
    "changefreq": "monthly",
    "priority": "0.9"
  },
  {
    "path": "/CaseStudyNUPS",
    "lastmod": "2026-08-25",
    "changefreq": "monthly",
    "priority": "0.9"
  },
  {
    "path": "/ProvenanceMethodology",
    "lastmod": "2026-08-25",
    "changefreq": "monthly",
    "priority": "0.9"
  },
  {
    "path": "/CaseStudyCovenantVictory",
    "lastmod": "2026-08-25",
    "changefreq": "monthly",
    "priority": "0.9"
  },
  {
    "path": "/GlyphLockFinancial",
    "lastmod": "2026-02-20",
    "changefreq": "monthly",
    "priority": "0.7"
  },
  {
    "path": "/NUPSLanding",
    "lastmod": "2026-08-24",
    "changefreq": "weekly",
    "priority": "0.9"
  },
  {
    "path": "/VideoUpload",
    "lastmod": "2026-03-17",
    "changefreq": "monthly",
    "priority": "0.5"
  },
  {
    "path": "/Privacy",
    "lastmod": "2026-08-24",
    "changefreq": "yearly",
    "priority": "0.5"
  },
  {
    "path": "/Terms",
    "lastmod": "2026-08-24",
    "changefreq": "yearly",
    "priority": "0.5"
  },
  {
    "path": "/Cookies",
    "lastmod": "2026-08-12",
    "changefreq": "yearly",
    "priority": "0.4"
  },
  {
    "path": "/Accessibility",
    "lastmod": "2026-08-17",
    "changefreq": "yearly",
    "priority": "0.4"
  },
  {
    "path": "/CodeOfEthics",
    "lastmod": "2026-08-17",
    "changefreq": "yearly",
    "priority": "0.6"
  }
];

Deno.serve(() => {
  const urls = ROUTES.map(({ path, lastmod, changefreq, priority }) =>
    `  <url><loc>${SITE_URL}${path}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
  ).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'index, follow',
    },
  });
});
