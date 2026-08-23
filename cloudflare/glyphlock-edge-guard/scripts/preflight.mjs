import fs from 'node:fs';
import path from 'node:path';
import { routePatternCoversApex, workerDomainCoversApex } from './route-pattern.mjs';

const API_ROOT = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'glyphlock.io';
const WORKER_NAME = 'glyphlock-edge-guard';
const API_TIMEOUT_MS = 20_000;

const token = [
  process.env.CLOUDFLARE_API_TOKEN,
  process.env.CF_API_TOKEN,
  process.env.CLOUDFLARE_TOKEN,
].find((value) => typeof value === 'string' && value.trim());

if (!token) {
  throw new Error('No Cloudflare API token was found in the approved server-side environment.');
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

function errorSummary(payload) {
  if (!payload || typeof payload !== 'object') return 'unknown Cloudflare API error';
  const errors = Array.isArray(payload.errors) ? payload.errors : [];
  if (!errors.length) return 'Cloudflare API returned success=false without an error body';
  return errors
    .map((error) => `${error?.code ?? 'unknown'}: ${error?.message ?? 'unknown error'}`)
    .join('; ');
}

async function cloudflare(pathname) {
  const response = await fetch(`${API_ROOT}${pathname}`, {
    headers,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Cloudflare API ${pathname} returned HTTP ${response.status} with a non-JSON body.`);
  }

  if (!response.ok || payload.success !== true) {
    throw new Error(`Cloudflare API ${pathname} failed with HTTP ${response.status}: ${errorSummary(payload)}`);
  }

  return payload.result;
}

function writeOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) fs.appendFileSync(outputFile, `${name}=${String(value)}\n`);
}

function appendSummary(markdown) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) fs.appendFileSync(summaryFile, `${markdown}\n`);
  else process.stdout.write(`${markdown}\n`);
}

function routeScript(route) {
  return route?.script || route?.script_name || '';
}

const zoneQuery = new URLSearchParams({
  name: ZONE_NAME,
  status: 'active',
  per_page: '50',
});
const zones = await cloudflare(`/zones?${zoneQuery}`);

if (!Array.isArray(zones) || zones.length !== 1) {
  throw new Error(`Expected exactly one active ${ZONE_NAME} zone, found ${Array.isArray(zones) ? zones.length : 0}.`);
}

const zone = zones[0];
const zoneId = zone.id;
const accountId = zone.account?.id;

if (!zoneId || !accountId) {
  throw new Error(`Cloudflare did not return both zone and account identifiers for ${ZONE_NAME}.`);
}

const accountHint = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
if (accountHint && accountHint !== accountId) {
  throw new Error('The configured Cloudflare account ID does not own the active glyphlock.io zone.');
}

const dnsQuery = new URLSearchParams({ name: ZONE_NAME, per_page: '100' });
const [routes, scripts, workerDomains, pageRules, rulesets, dnsRecords, settings] = await Promise.all([
  cloudflare(`/zones/${zoneId}/workers/routes`),
  cloudflare(`/accounts/${accountId}/workers/scripts`),
  cloudflare(`/accounts/${accountId}/workers/domains?per_page=100`),
  cloudflare(`/zones/${zoneId}/pagerules?per_page=100`),
  cloudflare(`/zones/${zoneId}/rulesets`),
  cloudflare(`/zones/${zoneId}/dns_records?${dnsQuery}`),
  cloudflare(`/zones/${zoneId}/settings`),
]);

const rulesetSummaries = Array.isArray(rulesets)
  ? rulesets.map((ruleset) => ({
      name: ruleset.name || '',
      description: ruleset.description || '',
      kind: ruleset.kind || '',
      phase: ruleset.phase || '',
      version: ruleset.version || '',
    }))
  : [];

const pageRuleSummaries = Array.isArray(pageRules)
  ? pageRules.map((rule) => ({
      status: rule.status || '',
      priority: rule.priority ?? null,
      targets: Array.isArray(rule.targets) ? rule.targets.map((target) => target.target).filter(Boolean) : [],
      actions: Array.isArray(rule.actions) ? rule.actions.map((action) => action.id).filter(Boolean) : [],
    }))
  : [];

const settingIds = new Set([
  'always_online',
  'browser_cache_ttl',
  'cache_level',
  'development_mode',
  'minify',
  'rocket_loader',
]);
const cacheSettings = Array.isArray(settings)
  ? settings
      .filter((setting) => settingIds.has(setting.id))
      .map((setting) => ({ id: setting.id, value: setting.value, editable: setting.editable }))
  : [];

const routeSummaries = Array.isArray(routes)
  ? routes.map((route) => ({ pattern: route.pattern || '', script: routeScript(route) }))
  : [];
const scriptSummaries = Array.isArray(scripts)
  ? scripts.map((script) => ({ name: script.id || script.name || '', modified_on: script.modified_on || null }))
  : [];
const workerDomainSummaries = Array.isArray(workerDomains)
  ? workerDomains.map((domain) => ({
      hostname: domain.hostname || '',
      service: domain.service || '',
      environment: domain.environment || '',
      zone_id: domain.zone_id || '',
      zone_name: domain.zone_name || '',
    }))
  : [];
const dnsSummaries = Array.isArray(dnsRecords)
  ? dnsRecords.map((record) => ({
      name: record.name || '',
      type: record.type || '',
      proxied: record.proxied === true,
      ttl: record.ttl ?? null,
    }))
  : [];

const apexRoutes = routeSummaries.filter((route) => routePatternCoversApex(route.pattern, ZONE_NAME));
const conflictingRoutes = apexRoutes.filter((route) => route.script !== WORKER_NAME);
const existingGuardScript = scriptSummaries.some((script) => script.name === WORKER_NAME);
const existingGuardRoutes = apexRoutes.filter((route) => route.script === WORKER_NAME);
const apexWorkerDomains = workerDomainSummaries.filter((domain) => workerDomainCoversApex(domain.hostname, ZONE_NAME));
const conflictingWorkerDomains = apexWorkerDomains.filter((domain) => domain.service !== WORKER_NAME);
const existingGuardDomains = apexWorkerDomains.filter((domain) => domain.service === WORKER_NAME);
const proxiedApexDns = dnsSummaries.some(
  (record) => record.name.toLowerCase() === ZONE_NAME && record.proxied,
);

// First deployment is deliberately strict. Any existing apex route, custom
// Worker domain, or same-named script requires a reviewed migration and
// rollback plan rather than an automatic overwrite or stacked edge control.
const safeToDeploy =
  proxiedApexDns &&
  apexRoutes.length === 0 &&
  conflictingRoutes.length === 0 &&
  apexWorkerDomains.length === 0 &&
  conflictingWorkerDomains.length === 0 &&
  !existingGuardScript &&
  existingGuardRoutes.length === 0 &&
  existingGuardDomains.length === 0;

const freshDeploy =
  !existingGuardScript &&
  existingGuardRoutes.length === 0 &&
  existingGuardDomains.length === 0;

const inventory = {
  generated_at: new Date().toISOString(),
  zone: ZONE_NAME,
  dns: dnsSummaries,
  worker_routes: routeSummaries,
  worker_scripts: scriptSummaries,
  worker_domains: workerDomainSummaries,
  page_rules: pageRuleSummaries,
  rulesets: rulesetSummaries,
  cache_settings: cacheSettings,
  decision: {
    proxied_apex_dns: proxiedApexDns,
    apex_route_count: apexRoutes.length,
    conflicting_apex_route_count: conflictingRoutes.length,
    apex_worker_domain_count: apexWorkerDomains.length,
    conflicting_apex_worker_domain_count: conflictingWorkerDomains.length,
    existing_guard_script: existingGuardScript,
    safe_to_deploy: safeToDeploy,
  },
};

const inventoryDir = process.env.CLOUDFLARE_INVENTORY_DIR || path.join(process.cwd(), 'artifacts');
fs.mkdirSync(inventoryDir, { recursive: true });
fs.writeFileSync(
  path.join(inventoryDir, 'cloudflare-preflight-inventory.json'),
  `${JSON.stringify(inventory, null, 2)}\n`,
);

writeOutput('account_id', accountId);
writeOutput('zone_id', zoneId);
writeOutput('safe_to_deploy', safeToDeploy);
writeOutput('fresh_deploy', freshDeploy);

const routeRows = routeSummaries.length
  ? routeSummaries.map((route) => `| \`${route.pattern}\` | \`${route.script || '(none)'}\` |`).join('\n')
  : '| None | None |';
const workerDomainRows = workerDomainSummaries.length
  ? workerDomainSummaries.map((domain) => `| \`${domain.hostname}\` | \`${domain.service || '(none)'}\` |`).join('\n')
  : '| None | None |';
const rulesetRows = rulesetSummaries.length
  ? rulesetSummaries.map((ruleset) => `| ${ruleset.name || '(unnamed)'} | \`${ruleset.phase || '(none)'}\` | ${ruleset.kind || ''} |`).join('\n')
  : '| None | None | None |';
const cacheRows = cacheSettings.length
  ? cacheSettings.map((setting) => `| \`${setting.id}\` | \`${JSON.stringify(setting.value)}\` | ${setting.editable ? 'yes' : 'no'} |`).join('\n')
  : '| None visible | None | None |';

appendSummary(`## Cloudflare glyphlock.io preflight

- Token authentication: **passed**
- Active zone resolution: **passed**
- Proxied apex DNS record: **${proxiedApexDns ? 'yes' : 'no'}**
- Worker scripts visible: **${scriptSummaries.length}**
- Worker routes visible: **${routeSummaries.length}**
- Worker custom domains visible: **${workerDomainSummaries.length}**
- Page Rules visible: **${pageRuleSummaries.length}**
- Zone rulesets visible: **${rulesetSummaries.length}**
- First-deploy decision: **${safeToDeploy ? 'SAFE TO DEPLOY' : 'BLOCKED'}**

### Worker routes

| Pattern | Script |
|---|---|
${routeRows}

### Worker custom domains

| Hostname | Service |
|---|---|
${workerDomainRows}

### Rulesets

| Name | Phase | Kind |
|---|---|---|
${rulesetRows}

### Selected cache settings

| Setting | Value | Editable |
|---|---|---|
${cacheRows}
`);

if (!safeToDeploy) {
  throw new Error('Cloudflare preflight blocked deployment. Review the generated inventory before changing the zone.');
}
