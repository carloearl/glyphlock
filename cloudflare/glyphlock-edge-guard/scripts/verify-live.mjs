const ORIGIN = 'https://glyphlock.io';
const ATTEMPTS = 6;
const RETRY_DELAY_MS = 10_000;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36';
const CRAWLER_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    const fs = requireNodeFs();
    fs.appendFileSync(summaryFile, `${markdown}\n`);
  } else {
    process.stdout.write(`${markdown}\n`);
  }
}

function requireNodeFs() {
  // Kept behind a helper so this verifier remains dependency-free and does not
  // load filesystem access until a GitHub step summary is actually available.
  return globalThis.__nodeFs ??= awaitImportFs();
}

function awaitImportFs() {
  // createRequire is unnecessary here; Node exposes this module through the
  // synchronous module loader used by createRequire below.
  const { createRequire } = process.getBuiltinModule('node:module');
  return createRequire(import.meta.url)('node:fs');
}

async function request(pathname, userAgent) {
  const response = await fetch(new URL(pathname, ORIGIN), {
    method: 'GET',
    redirect: 'manual',
    headers: {
      'User-Agent': userAgent,
      Accept: 'text/html,application/xhtml+xml',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  const body = await response.text();
  return {
    status: response.status,
    contentType: response.headers.get('content-type') || '',
    robots: response.headers.get('x-robots-tag') || '',
    cacheControl: response.headers.get('cache-control') || '',
    body,
  };
}

function requireCheck(condition, message, details = '') {
  if (!condition) {
    const suffix = details ? ` (${details})` : '';
    throw new Error(`${message}${suffix}`);
  }
}

async function verifyOnce() {
  const publicPage = await request('/About', BROWSER_UA);
  requireCheck(
    publicPage.status >= 200 && publicPage.status < 400,
    'Public route did not remain available',
    `status=${publicPage.status}`,
  );
  if (publicPage.status < 300) {
    requireCheck(
      publicPage.contentType.toLowerCase().includes('text/html'),
      'Public route did not return HTML',
      `content-type=${publicPage.contentType || '(missing)'}`,
    );
    requireCheck(
      /<html|GlyphLock/i.test(publicPage.body),
      'Public route body no longer resembles the GlyphLock application',
    );
  }
  requireCheck(
    !publicPage.robots.toLowerCase().includes('noindex'),
    'Public route incorrectly received a noindex edge header',
    `x-robots-tag=${publicPage.robots || '(missing)'}`,
  );

  const crawlerAdmin = await request('/admin/settlement', CRAWLER_UA);
  requireCheck(crawlerAdmin.status === 404, 'Crawler admin request was not blocked', `status=${crawlerAdmin.status}`);
  requireCheck(/noindex/i.test(crawlerAdmin.robots), 'Crawler block is missing noindex');
  requireCheck(/nofollow/i.test(crawlerAdmin.robots), 'Crawler block is missing nofollow');
  requireCheck(/no-store/i.test(crawlerAdmin.cacheControl), 'Crawler block is cacheable');

  const encodedCrawlerAdmin = await request('/admin%2Fsettlement', CRAWLER_UA);
  requireCheck(
    encodedCrawlerAdmin.status === 404,
    'Encoded crawler admin request was not blocked',
    `status=${encodedCrawlerAdmin.status}`,
  );
  requireCheck(/noindex/i.test(encodedCrawlerAdmin.robots), 'Encoded crawler block is missing noindex');

  const browserAdmin = await request('/NUPSAdminPortal', BROWSER_UA);
  requireCheck(browserAdmin.status < 500, 'Protected browser route returned a server error', `status=${browserAdmin.status}`);
  requireCheck(/noindex/i.test(browserAdmin.robots), 'Protected browser route is missing noindex');
  requireCheck(/nofollow/i.test(browserAdmin.robots), 'Protected browser route is missing nofollow');
  requireCheck(/no-store/i.test(browserAdmin.cacheControl), 'Protected browser route is cacheable');

  return {
    publicStatus: publicPage.status,
    crawlerStatus: crawlerAdmin.status,
    encodedCrawlerStatus: encodedCrawlerAdmin.status,
    protectedBrowserStatus: browserAdmin.status,
  };
}

let lastError;
for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  try {
    const result = await verifyOnce();
    appendSummary(`## Cloudflare edge guard live verification

| Check | Result |
|---|---:|
| Public \`/About\` | ${result.publicStatus} |
| Googlebot \`/admin/settlement\` | ${result.crawlerStatus} |
| Googlebot encoded admin path | ${result.encodedCrawlerStatus} |
| Browser \`/NUPSAdminPortal\` | ${result.protectedBrowserStatus} |

**Result: PASS** — public traffic remained available and protected routes received the intended crawler block and noindex/no-store policy.`);
    console.log('[cloudflare:verify-live] PASS');
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.error(`[cloudflare:verify-live] attempt ${attempt}/${ATTEMPTS} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    if (attempt < ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }
}

appendSummary(`## Cloudflare edge guard live verification

**Result: FAIL** — ${lastError instanceof Error ? lastError.message : 'unknown verification error'}

The deployment workflow must roll back the exact \`glyphlock-edge-guard\` route and script.`);
throw lastError ?? new Error('Cloudflare edge guard live verification failed.');
