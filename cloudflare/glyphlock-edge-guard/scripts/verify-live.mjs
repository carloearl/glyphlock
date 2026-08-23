import fs from 'node:fs';

const ORIGIN = 'https://glyphlock.io';
const ATTEMPTS = 4;
const RETRY_DELAY_MS = 5_000;
const REQUEST_TIMEOUT_MS = 15_000;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const OPENAI_SEARCH_UA = 'Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) fs.appendFileSync(summaryFile, `${markdown}\n`);
  else process.stdout.write(`${markdown}\n`);
}

async function request(pathname, userAgent) {
  const response = await fetch(new URL(pathname, ORIGIN), {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

function requireCrawlerBlock(result, label) {
  requireCheck(result.status === 404, `${label} was not blocked`, `status=${result.status}`);
  requireCheck(/noindex/i.test(result.robots), `${label} is missing noindex`);
  requireCheck(/nofollow/i.test(result.robots), `${label} is missing nofollow`);
  requireCheck(/no-store/i.test(result.cacheControl), `${label} is cacheable`);
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
    requireCheck(/<html|GlyphLock/i.test(publicPage.body), 'Public route body no longer resembles GlyphLock');
  }
  requireCheck(
    !publicPage.robots.toLowerCase().includes('noindex'),
    'Public route incorrectly received a noindex edge header',
    `x-robots-tag=${publicPage.robots || '(missing)'}`,
  );

  const crawlerAdmin = await request('/admin/settlement', GOOGLEBOT_UA);
  requireCrawlerBlock(crawlerAdmin, 'Googlebot admin request');

  const encodedCrawlerAdmin = await request('/admin%2Fsettlement', GOOGLEBOT_UA);
  requireCrawlerBlock(encodedCrawlerAdmin, 'Encoded Googlebot admin request');

  const backslashCrawlerAdmin = await request('/admin%5Csettlement', GOOGLEBOT_UA);
  requireCrawlerBlock(backslashCrawlerAdmin, 'Backslash-encoded Googlebot admin request');

  const openAiAdmin = await request('/NUPSAdminPortal', OPENAI_SEARCH_UA);
  requireCrawlerBlock(openAiAdmin, 'OAI-SearchBot NUPS admin request');

  const browserAdmin = await request('/NUPSAdminPortal', BROWSER_UA);
  requireCheck(browserAdmin.status < 500, 'Protected browser route returned a server error', `status=${browserAdmin.status}`);
  requireCheck(/noindex/i.test(browserAdmin.robots), 'Protected browser route is missing noindex');
  requireCheck(/nofollow/i.test(browserAdmin.robots), 'Protected browser route is missing nofollow');
  requireCheck(/no-store/i.test(browserAdmin.cacheControl), 'Protected browser route is cacheable');

  return {
    publicStatus: publicPage.status,
    googlebotStatus: crawlerAdmin.status,
    encodedStatus: encodedCrawlerAdmin.status,
    backslashStatus: backslashCrawlerAdmin.status,
    openAiStatus: openAiAdmin.status,
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
| Public browser \`/About\` | ${result.publicStatus} |
| Googlebot \`/admin/settlement\` | ${result.googlebotStatus} |
| Googlebot encoded admin path | ${result.encodedStatus} |
| Googlebot backslash-encoded admin path | ${result.backslashStatus} |
| OAI-SearchBot \`/NUPSAdminPortal\` | ${result.openAiStatus} |
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

The delivery workflow must roll back the exact \`glyphlock-edge-guard\` route and script.`);
throw lastError ?? new Error('Cloudflare edge guard live verification failed.');
