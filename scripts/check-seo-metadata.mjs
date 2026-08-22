#!/usr/bin/env node
// ============================================================================
// scripts/check-seo-metadata.mjs
// ----------------------------------------------------------------------------
// Deterministic SEO/metadata canonicality check for GlyphLock.
// Fails (exit 1) when any of the following are found in active SEO sources:
//   - retired/misleading strings
//   - stale app IDs
//   - preview URLs
//   - wrong NUPS expansion ("Nexus Unified Portal System", "Nightclub & Unique Venue")
//   - duplicate canonical/schema patterns
//   - Home/About metadata regression
// Active SEO sources are the runtime source of truth (SEOHead + seoData) plus
// every active metadata/schema/crawler emitter.
// ============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
let failures = [];
const fail = (msg) => failures.push(msg);

// ── Active SEO sources (runtime source of truth + metadata/schema/crawler emitters) ──
const ACTIVE_SOURCES = [
  'index.html',
  'src/components/SEOHead.jsx',
  'src/components/seo/seoData.jsx',
  'src/components/Footer.jsx',
  'src/Layout.jsx',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/nups.webmanifest',
  'base44/functions/robotsTxt/entry.ts',
  'base44/functions/llmsTxt/entry.ts',
  'base44/functions/aiTxtEnhanced/entry.ts',
  'base44/functions/aiTxt/entry.ts',
  'base44/functions/glyphlockKnowledge/entry.ts',
  'base44/functions/sitemap/entry.ts',
  'base44/functions/sitemapIndex/entry.ts',
  'base44/functions/generateSitemapXML/entry.ts',
  'src/pages/Robots.jsx',
  'src/pages/sitemap-qr.jsx',
  'src/pages/SDKDocs.jsx',
  'src/pages/CaseStudyTruthStrike.jsx',
  'src/components/about/carlo/FounderStoryNarrative.jsx',
  'src/components/sdk/SDKFiles.jsx',
  'src/components/console/SDKDownloadCenter.jsx',
];

function read(path) {
  const full = join(ROOT, path);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

const sourceContents = {};
for (const p of ACTIVE_SOURCES) {
  const c = read(p);
  if (c === null) fail(`MISSING active SEO source: ${p}`);
  else sourceContents[p] = c;
}

// Normalize apostrophes (curly ↔ straight) for resilient exact-value checks.
const norm = (s) => (s || '').replace(/[\u2019\u2018]/g, "'");

// ── 1. Retired/misleading strings (case-insensitive) ──
const RETIRED_STRINGS = [
  'What If an Image Could Carry Proof',
  'Nexus Unified Portal System',
  'Dream Dollars',
  'banking-grade',
  'Quantum-Grade',
  'quantum-resistant',
  'quantum grade',
  'revolutionary',
  'instant payout',
  'automated processor split',
  'public-production API',
  'public production API',
  'Patent Pending',
  'USPTO Patent Application',
  '18/584,961',
  'Nightclub & Unique Venue',
  'Nightclub and Unique Venue',
  'DACO¹',
  'CAB Legal Binding System',
  'BPAA Certification Protocol',
  "humanity's first",
  'first successful binding',
  'N.U.P.S.',
  'github.com/glyphlock/',
  'github.com/glyphlock"',
  "github.com/glyphlock'",
];

for (const [path, content] of Object.entries(sourceContents)) {
  const lower = content.toLowerCase();
  for (const needle of RETIRED_STRINGS) {
    if (lower.includes(needle.toLowerCase())) {
      fail(`Retired string "${needle}" present in ${path}`);
    }
  }
}

// ── 2. Stale IDs ──
const STALE_IDS = ['U5jDzdts3bd4p19I5hID', 'app.base44.com/api/apps'];
for (const [path, content] of Object.entries(sourceContents)) {
  for (const id of STALE_IDS) {
    if (content.includes(id)) fail(`Stale ID/URL "${id}" present in ${path}`);
  }
}

// ── 3. Preview URLs ──
const PREVIEW_PATTERNS = ['preview.base44.app', '/preview/', 'wix-preview', 'base44.app/preview'];
for (const [path, content] of Object.entries(sourceContents)) {
  for (const pat of PREVIEW_PATTERNS) {
    if (content.includes(pat)) fail(`Preview URL "${pat}" present in ${path}`);
  }
}

// ── 4. Wrong NUPS expansion ──
const WRONG_NUPS = ['Nexus Unified Portal System', 'Nightclub & Unique Venue', 'Nightclub and Unique Venue'];
for (const [path, content] of Object.entries(sourceContents)) {
  const lower = content.toLowerCase();
  for (const wrong of WRONG_NUPS) {
    if (lower.includes(wrong.toLowerCase())) {
      fail(`Wrong NUPS expansion "${wrong}" present in ${path}`);
    }
  }
}

// ── 5. Duplicate canonical / schema patterns ──
const indexHtml = sourceContents['index.html'];
if (indexHtml) {
  const canonicalCount = (indexHtml.match(/rel="canonical"/gi) || []).length;
  if (canonicalCount !== 1) fail(`index.html must have exactly one canonical link (found ${canonicalCount})`);
  const ogTitleCount = (indexHtml.match(/property="og:title"/gi) || []).length;
  if (ogTitleCount !== 1) fail(`index.html must have exactly one og:title (found ${ogTitleCount})`);
  const descCount = (indexHtml.match(/name="description"/gi) || []).length;
  if (descCount !== 1) fail(`index.html must have exactly one description meta (found ${descCount})`);
}

// StructuredDataOrg.jsx must NOT exist (duplicate org schema eliminated).
const structuredOrgPath = join(ROOT, 'src/components/StructuredDataOrg.jsx');
if (existsSync(structuredOrgPath)) {
  fail('src/components/StructuredDataOrg.jsx still exists — duplicate org schema must be removed');
}

// Layout must not import StructuredDataOrg.
const layout = sourceContents['src/Layout.jsx'];
if (layout && layout.includes('StructuredDataOrg')) {
  fail('src/Layout.jsx still references StructuredDataOrg — remove import and usage');
}

// seoData SEO_DATA block must not contain two entries with the same url.
const seoData = sourceContents['src/components/seo/seoData.jsx'];
if (seoData) {
  const blockMatch = seoData.match(/export const SEO_DATA = \{([\s\S]*?)\n\};/);
  const block = blockMatch ? blockMatch[1] : seoData;
  const urlMatches = [...block.matchAll(/url:\s*"([^"]+)"/g)];
  const urls = urlMatches.map((m) => m[1]);
  const dupes = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dupes.length) fail(`Duplicate canonical URLs in seoData.jsx: ${[...new Set(dupes)].join(', ')}`);
}

// Sitemap must not list duplicate routes.
const sitemapXml = sourceContents['public/sitemap.xml'];
if (sitemapXml) {
  const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
  if (dupes.length) fail(`Duplicate <loc> in public/sitemap.xml: ${[...new Set(dupes)].join(', ')}`);
}

// ── 6. Home / About regression (exact canonical values, apostrophe-normalized) ──
if (seoData) {
  const n = norm(seoData);
  const HOME_TITLE = 'GlyphLock | Evidence Infrastructure for Identity, Operations & Proof';
  const HOME_DESC = 'GlyphLock connects identity and permission, secure QR and image carriers, AI-assisted workflows, NUPS venue operations, financial accountability, APIs, hardware, and governance through one evidence architecture.';
  const HOME_OG_TITLE = 'GlyphLock | Connected Evidence Infrastructure';
  const HOME_OG_DESC = 'From Secure QR and interactive media to automated DJ, NUPS, financial records, SDKs, APIs, hardware, and governance—GlyphLock connects the full operating event.';
  const ABOUT_TITLE = 'About GlyphLock | Technology, NUPS & Evidence Architecture';
  const ABOUT_DESC = 'See how GlyphLock connects identity, secure QR, image carriers, GlyphBot, automated DJ and Fable, NUPS venue operations, GlyphBucks accounting, SDKs, APIs, hardware, OHIP integration work, and governance.';
  const ABOUT_OG_TITLE = 'About GlyphLock | One Core, Six Domains, One Trust Envelope';
  const ABOUT_OG_DESC = "Explore GlyphLock's evidence core, six operating domains, trust envelope, technical systems, operating proof, leadership, and integration surfaces.";
  const ABOUT_H1 = 'Identity. Permission. Operations. Proof.';
  const ABOUT_URL = '/About';

  const checks = [
    ['Home title', HOME_TITLE],
    ['Home description', HOME_DESC],
    ['Home ogTitle', HOME_OG_TITLE],
    ['Home ogDescription', HOME_OG_DESC],
    ['About title', ABOUT_TITLE],
    ['About description', ABOUT_DESC],
    ['About ogTitle', ABOUT_OG_TITLE],
    ['About ogDescription', ABOUT_OG_DESC],
    ['About h1', ABOUT_H1],
    ['About canonical url', ABOUT_URL],
  ];
  for (const [label, value] of checks) {
    if (!n.includes(norm(value))) fail(`Home/About regression — missing ${label}`);
  }

  // Global fallback keywords must be canonical (array members present).
  const fbMembers = ['identity and permission workflows', 'financial accountability', 'API and SDK integration', 'evidence infrastructure', 'venue operations software'];
  for (const m of fbMembers) {
    if (!seoData.includes(m)) fail(`Global fallback keyword missing in seoData.jsx: "${m}"`);
  }
}

// ── 7. Canonical origin + GitHub social ──
if (indexHtml && !indexHtml.includes('https://glyphlock.io/')) {
  fail('index.html canonical origin must be https://glyphlock.io/');
}
const footer = sourceContents['src/components/Footer.jsx'];
if (footer && !footer.includes('https://github.com/carloearl/glyphlock')) {
  fail('Footer GitHub social must be https://github.com/carloearl/glyphlock');
}
const seoHead = sourceContents['src/components/SEOHead.jsx'];
if (seoHead && !seoHead.includes('https://github.com/carloearl/glyphlock')) {
  fail('SEOHead sameAs must include https://github.com/carloearl/glyphlock');
}
const sdkDocs = sourceContents['src/pages/SDKDocs.jsx'];
if (sdkDocs && !sdkDocs.includes('https://github.com/carloearl/glyphlock')) {
  fail('SDKDocs GitHub URL must be https://github.com/carloearl/glyphlock');
}

// ── 8. NUPS expansion present in canonical sources ──
const expansionSources = ['base44/functions/llmsTxt/entry.ts', 'base44/functions/aiTxtEnhanced/entry.ts', 'base44/functions/glyphlockKnowledge/entry.ts'];
for (const p of expansionSources) {
  const c = sourceContents[p];
  if (c && !c.includes('Nexus Unified POS System')) {
    fail(`NUPS expansion "Nexus Unified POS System" missing in ${p}`);
  }
}

// ── Report ──
if (failures.length) {
  console.error(`\n✗ check-seo-metadata FAILED (${failures.length} issue(s)):\n`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`\n✓ check-seo-metadata PASSED — ${ACTIVE_SOURCES.length} active SEO sources canonical.\n`);
process.exit(0);