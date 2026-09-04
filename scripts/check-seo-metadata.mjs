#!/usr/bin/env node
// ============================================================================
// scripts/check-seo-metadata.mjs
// ----------------------------------------------------------------------------
// Deterministic SEO/metadata canonicality check for GlyphLock.
// Fails (exit 1) when any of the following are found in active SEO sources:
//   - retired/misleading strings
//   - stale app IDs
//   - preview URLs
//   - retired NUPS expansions and sales-system terminology
//   - duplicate canonical/schema patterns
//   - Home/About metadata regression
// Active SEO sources are the runtime source of truth (SEOHead + seoData) plus
// every active metadata/schema/crawler emitter.
// ============================================================================

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
let failures = [];
const fail = (msg) => failures.push(msg);

// ── Active SEO sources (runtime source of truth + metadata/schema/crawler emitters) ──
const ACTIVE_SOURCES = [
  'index.html',
  'src/App.jsx',
  'src/components/SEOHead.jsx',
  'src/components/seo/PrerenderHints.jsx',
  'src/components/seo/seoData.jsx',
  'src/components/Footer.jsx',
  'src/Layout.jsx',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/llms.txt',
  'public/nups.webmanifest',
  'base44/functions/llmsTxt/entry.ts',
  'base44/functions/aiTxtEnhanced/entry.ts',
  'base44/functions/aiTxt/entry.ts',
  'base44/functions/glyphlockKnowledge/entry.ts',
  'src/pages/SDKDocs.jsx',
  'src/pages/CaseStudyOracleOHIP.jsx',
  'src/pages/CaseStudyNUPS.jsx',
  'src/pages/ProvenanceMethodology.jsx',
  'src/pages/CaseStudyCovenantVictory.jsx',
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

// Public-facing terminology is audited across every page, component, content
// source, crawler document, agent knowledge source, and generated copy source.
const TERMINOLOGY_ROOTS = [
  'index.html', 'public', 'src/pages', 'src/components', 'src/content',
  'src/constants', 'src/functions', 'src/glyphbucks', 'src/entities',
  'base44/agents', 'base44/functions', 'base44/entities',
];
const TEXT_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.jsonc', '.md', '.html', '.txt', '.xml', '.webmanifest']);
const terminologyFiles = [];
function collectTerminologyFiles(path) {
  const full = join(ROOT, path);
  if (!existsSync(full)) return;
  const stat = statSync(full);
  if (stat.isDirectory()) {
    for (const name of readdirSync(full)) collectTerminologyFiles(join(path, name));
    return;
  }
  if (path === 'index.html' || TEXT_EXTENSIONS.has(extname(path))) terminologyFiles.push(path);
}
for (const root of TERMINOLOGY_ROOTS) collectTerminologyFiles(root);

const RETIRED_NUPS_EXPANSION = 'Nexus Unified ' + 'P' + 'OS System';
const RETIRED_TERMINOLOGY_PATTERNS = [
  { label: 'retired NUPS expansion', pattern: new RegExp(RETIRED_NUPS_EXPANSION, 'i') },
  { label: 'retired sales acronym', pattern: /\bP(?:OS)\b/ },
  { label: 'retired point-of-sale phrase', pattern: /point[- ]of[- ]sale/i },
  { label: 'retired universal sales expansion', pattern: /Nexus Universal (?:Point[- ]of[- ]Sale|P(?:OS))/i },
];
for (const path of terminologyFiles) {
  const content = read(path) || '';
  for (const { label, pattern } of RETIRED_TERMINOLOGY_PATTERNS) {
    if (pattern.test(content)) fail(`${label} present in ${relative(ROOT, join(ROOT, path))}`);
  }
}

// Normalize apostrophes (curly ↔ straight) for resilient exact-value checks.
const norm = (s) => (s || '').replace(/[\u2019\u2018]/g, "'");

// Parse emitted HTML attributes without assuming attribute order.
const getHtmlAttribute = (tag, name) =>
  tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"))?.[1] || "";
const hasHtmlToken = (tag, name, token) =>
  getHtmlAttribute(tag, name).split(/\s+/).some((value) => value.toLowerCase() === token.toLowerCase());

// ── 1. Retired/misleading strings (case-insensitive) ──
const RETIRED_STRINGS = [
  'What If an Image Could Carry Proof',
  RETIRED_NUPS_EXPANSION,
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
const WRONG_NUPS = [RETIRED_NUPS_EXPANSION, 'Nightclub & Unique Venue', 'Nightclub and Unique Venue'];
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
  const linkTags = [...indexHtml.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
  const canonicalTags = linkTags.filter((tag) => hasHtmlToken(tag, 'rel', 'canonical'));
  if (canonicalTags.length !== 1) fail(`index.html must have exactly one canonical link (found ${canonicalTags.length})`);
  if (canonicalTags.length === 1 && getHtmlAttribute(canonicalTags[0], 'href') !== 'https://glyphlock.io/') {
    fail(`index.html root canonical must be exactly https://glyphlock.io/ (found ${getHtmlAttribute(canonicalTags[0], 'href') || 'missing href'})`);
  }

  const metaTags = [...indexHtml.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
  const ogTitleCount = metaTags.filter((tag) => getHtmlAttribute(tag, 'property').toLowerCase() === 'og:title').length;
  if (ogTitleCount !== 1) fail(`index.html must have exactly one og:title (found ${ogTitleCount})`);
  const descCount = metaTags.filter((tag) => getHtmlAttribute(tag, 'name').toLowerCase() === 'description').length;
  if (descCount !== 1) fail(`index.html must have exactly one description meta (found ${descCount})`);
}

// Static homepage identity graph: source-level contract for raw crawlers and runtime de-duplication.
let identityGraph = null;
if (indexHtml) {
  const scriptTags = [...indexHtml.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const jsonLdScripts = scriptTags.filter((match) => /\btype=["']application\/ld\+json["']/i.test(match[1]));
  const identityScripts = scriptTags.filter((match) => /\bid=["']identity-schema["']/i.test(match[1]));

  if (jsonLdScripts.length !== 1) fail(`index.html must contain exactly one static JSON-LD script (found ${jsonLdScripts.length})`);
  if (identityScripts.length !== 1) fail(`index.html must contain exactly one script with id="identity-schema" (found ${identityScripts.length})`);

  if (identityScripts.length === 1) {
    if (!/\btype=["']application\/ld\+json["']/i.test(identityScripts[0][1])) {
      fail('identity-schema must use type="application/ld+json"');
    }
    try {
      identityGraph = JSON.parse(identityScripts[0][2].trim());
    } catch (error) {
      fail(`identity-schema must contain valid JSON: ${error.message}`);
    }
  }

  const gaLoader = 'https://www.googletagmanager.com/gtag/js?id=G-8ND3NFNM48';
  const gaLoaderCount = indexHtml.split(gaLoader).length - 1;
  const gaConfigCount = (indexHtml.match(/gtag\(['"]config['"],\s*['"]G-8ND3NFNM48['"]/g) || []).length;
  if (gaLoaderCount !== 1) fail(`index.html must load the GlyphLock GA4 tag exactly once (found ${gaLoaderCount})`);
  if (gaConfigCount !== 1) fail(`index.html must configure G-8ND3NFNM48 exactly once (found ${gaConfigCount})`);
  if (!/send_page_view\s*:\s*false/.test(indexHtml)) fail('Initial GA4 config must retain send_page_view: false for SPA route tracking');
  if (indexHtml.includes('G-XXXXXXXXXX')) fail('index.html contains the retired GA placeholder');
  if (/data-seo-source\s*=\s*["']builder["']/i.test(indexHtml)) fail('index.html contains a Base44 builder JSON-LD marker');
  if (/glyphlock\.com/i.test(indexHtml)) fail('index.html contains a retired glyphlock.com reference');
}

if (identityGraph) {
  if (identityGraph['@context'] !== 'https://schema.org') fail('identity-schema @context must be https://schema.org');
  const graph = identityGraph['@graph'];
  if (!Array.isArray(graph)) {
    fail('identity-schema must contain an @graph array');
  } else {
    const hasType = (node, expected) => {
      const types = Array.isArray(node?.['@type']) ? node['@type'] : [node?.['@type']];
      return types.includes(expected);
    };
    const organizations = graph.filter((node) => hasType(node, 'Organization'));
    const websites = graph.filter((node) => hasType(node, 'WebSite'));
    if (organizations.length !== 1 || organizations[0]?.['@id'] !== 'https://glyphlock.io/#organization') {
      fail('identity-schema must have one canonical Organization at https://glyphlock.io/#organization');
    }
    if (websites.length !== 1 || websites[0]?.['@id'] !== 'https://glyphlock.io/#website') {
      fail('identity-schema must have one canonical WebSite at https://glyphlock.io/#website');
    }

    const requiredNodes = new Map([
      ['NUPS', 'https://glyphlock.io/NUPSLanding'],
      ['GlyphLock QR Studio', 'https://glyphlock.io/SecureQRStudio'],
      ['GlyphBot', 'https://glyphlock.io/GlyphBot'],
      ['GlyphLock Image Lab', 'https://glyphlock.io/ImageLab'],
      ['GlyphLock SDK Documentation', 'https://glyphlock.io/SDKDocs'],
    ]);
    for (const [name, url] of requiredNodes) {
      const matches = graph.filter((node) => node?.name === name);
      if (matches.length !== 1 || matches[0]?.url !== url) {
        fail(`identity-schema must have one ${name} node at ${url}`);
      }
    }

    const serialized = JSON.stringify(identityGraph);
    if (/glyphlock\.com/i.test(serialized)) fail('identity-schema contains a retired glyphlock.com reference');
    const forbiddenKeys = new Set([
      'telephone', 'faxNumber', 'address', 'streetAddress',
      'postOfficeBoxNumber', 'postalCode', 'addressLocality',
      'addressRegion', 'addressCountry',
    ]);
    const scanPrivateFields = (value, path = '$') => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (forbiddenKeys.has(key)) fail(`identity-schema exposes forbidden location/phone field: ${path}.${key}`);
        scanPrivateFields(child, `${path}.${key}`);
      }
    };
    scanPrivateFields(identityGraph);

    const organization = organizations[0];
    if (organization && !Array.isArray(organization.sameAs)) fail('Organization sameAs must be an array');
    if (organization && !organization.sameAs?.includes('https://github.com/carloearl/glyphlock')) {
      fail('Organization sameAs must include https://github.com/carloearl/glyphlock');
    }
  }
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
  const lastmods = [...sitemapXml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
  if (lastmods.length !== locs.length) fail('Every sitemap URL must have one lastmod date');
  for (const date of lastmods) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail(`Invalid sitemap lastmod date: ${date}`);
  }
}

const llmsText = sourceContents['public/llms.txt'];
if (llmsText) {
  for (const required of ['107857124', '17363', '4-463913260838', '1654123', '1655445']) {
    if (!llmsText.includes(required)) fail(`public/llms.txt missing required identifier: ${required}`);
  }
  const requiredOracleBoundaries = [
    ['Production access', /\bproduction(?: OPERA Cloud)? access\b/i],
    ['Marketplace listing', /\b(?:published NUPS |Oracle )?Marketplace listing\b/i],
    ['Simphony certification', /\bSimphony(?: Solution Validation or)? certification\b/i],
  ];
  const oracleBoundaryClause = llmsText
    .split(/[;.!?]+/)
    .find((clause) => requiredOracleBoundaries.every(([, pattern]) => pattern.test(clause)));
  if (!oracleBoundaryClause) {
    for (const [label, pattern] of requiredOracleBoundaries) {
      if (!pattern.test(llmsText)) fail(`public/llms.txt missing required boundary: ${label}`);
    }
    fail('public/llms.txt must keep all Oracle production boundaries in one clause');
  } else {
    const negativeOracleStatus = /\b(?:are|is|remain(?:s)?)\s+(?:not approved|unapproved|not available|under (?:Oracle )?review)\b|\bhave not (?:been )?approved\b|\bapproval (?:is )?(?:pending|has not been granted)\b/i;
    if (!negativeOracleStatus.test(oracleBoundaryClause)) {
      fail('public/llms.txt Oracle production boundaries must remain explicitly unapproved or under review');
    }
  }
  for (const stale of ['/CaseStudies', '/CaseStudyTruthStrike', '/CaseStudyAIBinding']) {
    if (llmsText.includes(stale)) fail(`public/llms.txt contains retired route: ${stale}`);
  }
}

// ── 6. Home / About regression (exact canonical values, apostrophe-normalized) ──
if (seoData) {
  const n = norm(seoData);
  const HOME_TITLE = 'GlyphLock | Evidence Infrastructure for Identity & Proof';
  const HOME_DESC = 'Evidence infrastructure for identity, operations, and proof. Secure QR, verified access, and financial accountability in one auditable system.';
  const HOME_OG_TITLE = 'GlyphLock | Evidence Infrastructure for Identity & Proof';
  const HOME_OG_DESC = 'Evidence infrastructure for identity, operations, and proof. Secure QR, verified access, and financial accountability in one auditable system.';
  const ABOUT_TITLE = 'About GlyphLock | Technology, NUPS & Evidence Architecture';
  const ABOUT_DESC = 'GlyphLock builds evidence infrastructure connecting identity, permissions, and financial accountability. Founded 2025 in El Mirage, Arizona.';
  const ABOUT_OG_TITLE = 'About GlyphLock | Technology, NUPS & Evidence Architecture';
  const ABOUT_OG_DESC = 'GlyphLock builds evidence infrastructure connecting identity, permissions, and financial accountability. Founded 2025 in El Mirage, Arizona.';
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
if (seoHead && seoHead.includes('identity-schema')) {
  fail('SEOHead must not create, update, or remove the static identity-schema');
}
const sdkDocs = sourceContents['src/pages/SDKDocs.jsx'];
if (sdkDocs && !sdkDocs.includes('https://github.com/carloearl/glyphlock')) {
  fail('SDKDocs GitHub URL must be https://github.com/carloearl/glyphlock');
}

// ── 8. NUPS expansion present in canonical sources ──
const expansionSources = ['base44/functions/llmsTxt/entry.ts', 'base44/functions/aiTxtEnhanced/entry.ts', 'base44/functions/glyphlockKnowledge/entry.ts'];
for (const p of expansionSources) {
  const c = sourceContents[p];
  if (c && !c.includes('Nexus Unified Portal System')) {
    fail(`NUPS expansion "Nexus Unified Portal System" missing in ${p}`);
  }
}


// ── 9. Prerender/SEO remediation invariants ──
if (seoData) {
  const entryMatches = [...seoData.matchAll(/^  "([^"]+)": \{([\s\S]*?)^  \},/gm)];
  const entries = entryMatches.map((match) => {
    const block = match[2];
    const value = (field) => block.match(new RegExp(`^    ${field}:\\s*"([^"]+)"`, 'm'))?.[1] || '';
    return { key: match[1], title: value('title'), description: value('description'), url: value('url'), ogTitle: value('ogTitle'), ogDescription: value('ogDescription') };
  });
  if (entries.length !== 41) fail(`SEO_DATA must contain 41 approved public routes including the Oracle OHIP evidence page (found ${entries.length})`);
  const descriptions = entries.map((entry) => entry.description);
  if (new Set(descriptions).size !== descriptions.length) fail('Every public route description must be distinct');
  for (const entry of entries) {
    if (!entry.title || !entry.description || !entry.url) fail(`Incomplete SEO record: ${entry.key}`);

    const pagePath = `src/pages/${entry.key}.jsx`;
    const pageSource = read(pagePath);
    if (pageSource === null) fail(`Missing public route component: ${pagePath}`);
    else if (!/<SEOHead\b/.test(pageSource)) fail(`Public route must mount SEOHead: ${entry.url} (${pagePath})`);
    if (entry.title.length >= 60) fail(`Public title must stay under 60 characters for ${entry.url} (found ${entry.title.length})`);
    if (entry.description.length > 155) fail(`Public description must stay at or below 155 characters for ${entry.url} (found ${entry.description.length})`);
    if (entry.ogTitle !== entry.title) fail(`ogTitle must mirror title for ${entry.key}`);
    if (entry.ogDescription !== entry.description) fail(`ogDescription must mirror description for ${entry.key}`);
  }

  const suppliedRouteCopy = new Map([
    ['/', 'Evidence infrastructure for identity, operations, and proof. Secure QR, verified access, and financial accountability in one auditable system.'],
    ['/About', 'GlyphLock builds evidence infrastructure connecting identity, permissions, and financial accountability. Founded 2025 in El Mirage, Arizona.'],
    ['/Pricing', 'GlyphLock pricing for Secure QR, NUPS venue operations, and API access. Plans for single venues through multi-site operators.'],
    ['/Solutions', 'Identity and permission workflows, secure QR carriers, venue operations, and API integration — built on a single evidence architecture.'],
    ['/SDKDocs', 'GlyphLock SDK documentation: authentication, QR generation and verification, webhooks, and error handling.'],
    ['/NUPSLanding', 'NUPS: venue operations software for check-in, floor status, VIP contracts, register operations, and nightly settlement.'],
    ['/SecureQRStudio', 'Generate and manage verifiable secure QR codes with permission binding and offline verification.'],
    ['/Contact', 'Contact GlyphLock LLC in El Mirage, Arizona for demos, partnerships, and integration questions.'],
  ]);
  for (const [url, expected] of suppliedRouteCopy) {
    const entry = entries.find((candidate) => candidate.url === url);
    if (!entry) fail(`Missing supplied route metadata: ${url}`);
    else if (entry.description !== expected) fail(`Supplied route description changed: ${url}`);
  }
  for (const entry of entries.filter((candidate) => !suppliedRouteCopy.has(candidate.url))) {
    if (entry.description.length < 140 || entry.description.length > 155) {
      fail(`Buyer description must be 140–155 characters for ${entry.url} (found ${entry.description.length})`);
    }
  }
}

if (indexHtml) {
  for (const required of [
    'https://glyphlock.io/glyphlock-social-card.png',
    'property="og:image:width" content="1200"',
    'property="og:image:height" content="630"',
    'name="twitter:card" content="summary_large_image"',
    'name="twitter:image" content="https://glyphlock.io/glyphlock-social-card.png"',
  ]) {
    if (!indexHtml.includes(required)) fail(`index.html missing social-card invariant: ${required}`);
  }
}
if (seoHead) {
  if (!seoHead.includes('const path = location.pathname || "/"')) fail('SEOHead canonical resolution must use pathname only');
  if (/\blocation\.search\b/.test(seoHead)) fail('SEOHead canonical resolution must not include query parameters');
  if (seoHead.includes('qtrypzzcjebvfcihiynt.supabase.co/storage')) fail('SEOHead og:image must not use raw Supabase storage');
  if (!seoHead.includes("const isCanonicalPublicPath = Boolean(key && autoData.url === path)")) fail('SEOHead must fail closed for non-canonical/private routes');
  if (!seoHead.includes("'noindex, nofollow, noarchive, nosnippet'")) fail('SEOHead private-route noindex policy missing');
  if (!seoHead.includes("updateMetaTag('theme-color', '#020617')")) fail('SEOHead theme color must remain #020617');
}

const robotsText = sourceContents['public/robots.txt'];
for (const route of ['/admin/', '/IntegrationTests', '/SiteBuilderTest', '/EmergencyBackup', '/FullExport', '/NotFound', '/unauthorized', '/demo/', '/NUPSAdminPortal', '/ProviderConsole']) {
  if (robotsText && !robotsText.includes(`Disallow: ${route}`)) fail(`robots.txt missing disallow: ${route}`);
}
if (sitemapXml) {
  for (const route of ['/admin/', '/IntegrationTests', '/SiteBuilderTest', '/EmergencyBackup', '/FullExport', '/NotFound', '/unauthorized', '/NUPSAdminPortal', '/ProviderConsole']) {
    if (sitemapXml.includes(route)) fail(`Public sitemap leaks protected route: ${route}`);
  }
  const sitemapRoutes = [...sitemapXml.matchAll(/<loc>https:\/\/glyphlock\.io(\/[^<]*)<\/loc>/g)].map((match) => match[1]);
  const seoRoutes = [...seoData.matchAll(/^    url:\s*"([^"]+)"/gm)].map((match) => match[1]);
  const missingInSeo = sitemapRoutes.filter((route) => !seoRoutes.includes(route));
  const missingInSitemap = seoRoutes.filter((route) => !sitemapRoutes.includes(route));
  if (missingInSeo.length || missingInSitemap.length) {
    fail(`Sitemap/SEO_DATA route mismatch — missing SEO: ${missingInSeo.join(', ') || 'none'}; missing sitemap: ${missingInSitemap.join(', ') || 'none'}`);
  }
}

for (const asset of ['public/glyphlock-logo.png', 'public/glyphlock-social-card.png']) {
  const full = join(ROOT, asset);
  if (!existsSync(full)) {
    fail(`Missing same-origin image asset: ${asset}`);
    continue;
  }
  const png = readFileSync(full);
  if (png.subarray(1, 4).toString('ascii') !== 'PNG') fail(`${asset} is not a PNG`);
  if (asset.endsWith('social-card.png') && png.length >= 24) {
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (width !== 1200 || height !== 630) fail(`Social card must be 1200×630 (found ${width}×${height})`);
  }
}


// ── 10. Render-readiness and crawler-policy ownership ──
const appSource = sourceContents['src/App.jsx'];
if (appSource) {
  if (!appSource.includes("isCanonicalPublicSeoPath(currentPath)")) {
    fail('Public SEO routes must render while auth/public settings load');
  }
  if (appSource.includes("currentPathLower.startsWith('/nupslanding')")) {
    fail('Legacy hard-coded prerender allowlist still present in App.jsx');
  }
}

const prerenderHints = sourceContents['src/components/seo/PrerenderHints.jsx'];
if (prerenderHints) {
  for (const forbidden of ["addMeta('robots'", "addMeta('fragment'", 'prerender-status-code']) {
    if (prerenderHints.includes(forbidden)) fail(`PrerenderHints must not mutate metadata: ${forbidden}`);
  }
  if (!prerenderHints.includes('window.prerenderReady = true')) {
    fail('PrerenderHints readiness signal missing');
  }
}

if (seoHead && !seoHead.includes('const resolvedPath = autoData.url || url || path || "/"')) {
  fail('Canonical SEO_DATA URL must outrank page-local URL props');
}

if (seoData && !seoData.includes('export const CANONICAL_POSITIONING_LINE = "GlyphLock connects identity and permission, secure QR and image carriers, AI-assisted workflows, NUPS venue operations, financial accountability, APIs, hardware, and governance through one evidence architecture."')) {
  fail('Canonical GlyphLock positioning line missing or rewritten');
}

const robotsSources = [
  ['public/robots.txt', robotsText],
  ['base44/functions/robotsTxt/entry.ts', sourceContents['base44/functions/robotsTxt/entry.ts']],
];
for (const [path, content] of robotsSources) {
  if (!content) continue;
  const requiredAgents = ['Googlebot', 'Bingbot', 'GPTBot', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', '*'];
  for (const agent of requiredAgents) {
    if (!content.includes(`User-agent: ${agent}`) && !content.includes(`'${agent}'`) && !content.includes(`"${agent}"`)) {
      fail(`${path} missing crawler policy for: ${agent}`);
    }
  }
  for (const route of ['/nupsadminportal', '/providerconsole']) {
    if (!content.includes(`Disallow: ${route}`) && !content.includes(`'${route}'`) && !content.includes(`"${route}"`)) {
      fail(`${path} missing lowercase protected-route block: ${route}`);
    }
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
