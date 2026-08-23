import fs from 'node:fs';

const API_ROOT = 'https://api.cloudflare.com/client/v4';
const WORKER_NAME = 'glyphlock-edge-guard';
const ROUTE_PATTERN = 'glyphlock.io/*';
const API_TIMEOUT_MS = 15_000;

const token = [
  process.env.CLOUDFLARE_API_TOKEN,
  process.env.CF_API_TOKEN,
  process.env.CLOUDFLARE_TOKEN,
].find((value) => typeof value === 'string' && value.trim());
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const zoneId = process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID;

if (!token) throw new Error('Cloudflare rollback cannot run without an API token.');
if (!accountId) throw new Error('Cloudflare rollback cannot run without the verified account ID.');
if (!zoneId) throw new Error('Cloudflare rollback cannot run without the verified zone ID.');

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

function appendSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) fs.appendFileSync(summaryFile, `${markdown}\n`);
  else process.stdout.write(`${markdown}\n`);
}

function errorSummary(payload) {
  const errors = Array.isArray(payload?.errors) ? payload.errors : [];
  return errors.length
    ? errors.map((error) => `${error?.code ?? 'unknown'}: ${error?.message ?? 'unknown error'}`).join('; ')
    : 'unknown Cloudflare API error';
}

async function cloudflare(pathname, { method = 'GET', tolerate404 = false } = {}) {
  const response = await fetch(`${API_ROOT}${pathname}`, {
    method,
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      if (response.ok) return null;
      throw new Error(`Cloudflare API ${pathname} returned HTTP ${response.status} with a non-JSON body.`);
    }
  }

  if (response.status === 404 && tolerate404) return null;
  if (!response.ok || (payload && payload.success !== true)) {
    throw new Error(`Cloudflare API ${pathname} failed with HTTP ${response.status}: ${errorSummary(payload)}`);
  }

  return payload?.result ?? null;
}

function routeScript(route) {
  return route?.script || route?.script_name || '';
}

async function listRoutes() {
  const result = await cloudflare(`/zones/${zoneId}/workers/routes`);
  return Array.isArray(result) ? result : [];
}

async function listScripts() {
  const result = await cloudflare(`/accounts/${accountId}/workers/scripts`);
  return Array.isArray(result) ? result : [];
}

const errors = [];
const initialRoutes = await listRoutes();
const exactRoutes = initialRoutes.filter(
  (route) => route?.pattern === ROUTE_PATTERN && routeScript(route) === WORKER_NAME,
);
const initialForeignGuardRoutes = initialRoutes.filter(
  (route) => routeScript(route) === WORKER_NAME && route?.pattern !== ROUTE_PATTERN,
);

for (const route of exactRoutes) {
  if (!route?.id) {
    errors.push('The exact edge-guard route had no Cloudflare route ID and could not be removed safely.');
    continue;
  }

  try {
    await cloudflare(`/zones/${zoneId}/workers/routes/${route.id}`, { method: 'DELETE', tolerate404: true });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown route deletion error.');
  }
}

let postRouteRemovalRoutes = [];
let remainingExactRoutes = [];
let currentForeignGuardRoutes = [];

try {
  postRouteRemovalRoutes = await listRoutes();
  remainingExactRoutes = postRouteRemovalRoutes.filter(
    (route) => route?.pattern === ROUTE_PATTERN && routeScript(route) === WORKER_NAME,
  );
  currentForeignGuardRoutes = postRouteRemovalRoutes.filter(
    (route) => routeScript(route) === WORKER_NAME && route?.pattern !== ROUTE_PATTERN,
  );
} catch (error) {
  errors.push(error instanceof Error ? error.message : 'Could not refresh Worker routes before script deletion.');
}

if (remainingExactRoutes.length) {
  errors.push(`Refused to delete the ${WORKER_NAME} script because the exact ${ROUTE_PATTERN} route still references it.`);
} else if (currentForeignGuardRoutes.length) {
  errors.push(`Refused to delete the ${WORKER_NAME} script because ${currentForeignGuardRoutes.length} non-target route(s) currently reference it.`);
} else if (!errors.length) {
  try {
    await cloudflare(`/accounts/${accountId}/workers/scripts/${WORKER_NAME}`, { method: 'DELETE', tolerate404: true });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown Worker script deletion error.');
  }
}

let scriptStillPresent = false;
try {
  const finalRoutes = await listRoutes();
  remainingExactRoutes = finalRoutes.filter(
    (route) => route?.pattern === ROUTE_PATTERN && routeScript(route) === WORKER_NAME,
  );
  currentForeignGuardRoutes = finalRoutes.filter(
    (route) => routeScript(route) === WORKER_NAME && route?.pattern !== ROUTE_PATTERN,
  );
  const finalScripts = await listScripts();
  scriptStillPresent = finalScripts.some((script) => (script?.id || script?.name) === WORKER_NAME);
} catch (error) {
  errors.push(error instanceof Error ? error.message : 'Unknown rollback verification error.');
}

if (remainingExactRoutes.length) {
  errors.push(`The exact ${ROUTE_PATTERN} route still references ${WORKER_NAME} after rollback.`);
}
if (scriptStillPresent && currentForeignGuardRoutes.length === 0) {
  errors.push(`The ${WORKER_NAME} script still exists after rollback.`);
}

const success = errors.length === 0;
appendSummary(`## Cloudflare edge guard rollback

- Exact target route: \`${ROUTE_PATTERN}\`
- Exact target script: \`${WORKER_NAME}\`
- Matching routes found before rollback: **${exactRoutes.length}**
- Non-target routes referencing the script before rollback: **${initialForeignGuardRoutes.length}**
- Non-target routes referencing the script after route removal: **${currentForeignGuardRoutes.length}**
- Matching routes remaining: **${remainingExactRoutes.length}**
- Script remaining: **${scriptStillPresent ? 'yes' : 'no'}**
- Result: **${success ? 'PASS' : 'FAIL'}**

${success ? 'Only the exact edge-guard route and script were removed. DNS, SSL/TLS, cache settings, Page Rules, rulesets, and unrelated Workers were untouched.' : errors.map((error) => `- ${error}`).join('\n')}`);

if (!success) throw new Error(`Cloudflare rollback was incomplete: ${errors.join(' | ')}`);
console.log('[cloudflare:rollback] PASS');
