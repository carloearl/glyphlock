import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = (await readFile(new URL('../base44/functions/glyphbotWebSearch/entry.ts', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
function harness(responses, env = {}) {
  const calls = [], prompts = [];
  let handler;
  const log = { create: async () => ({}) };
  const base44 = {
    auth: { me: async () => ({ email: 'researcher@example.org' }) },
    entities: { SystemAuditLog: log, GlyphBotActivityLog: log },
    integrations: { Core: { InvokeLLM: async (options) => {
      prompts.push(options);
      return options.response_json_schema ? { queries: [] } : 'Summary of retrieved public evidence.';
    } } },
  };
  const context = vm.createContext({
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } },
    createClientFromRequest: () => base44,
    fetch: async url => {
      calls.push(url);
      const payload = responses(url);
      return { ok: payload !== null, json: async () => payload };
    },
    console: { error() {} }, setTimeout, clearTimeout, AbortController, Response, URL,
  });
  vm.runInContext(source, context);
  return { context, calls, prompts, search: async (body) => {
    const response = await handler({ json: async () => body });
    return response.json();
  } };
}

test('empty SerpAPI results fall through to Google', async () => {
  const h = harness(url => url.includes('serpapi.com') ? { organic_results: [] }
    : url.includes('googleapis.com') ? { items: [{ title: 'Official profile', link: 'https://example.org/profile', snippet: 'Published role' }] } : null,
    { SERP_API_KEY: 'test', GOOGLE_SEARCH_API_KEY: 'test', GOOGLE_SEARCH_CX: 'test' });
  const result = await h.context.runProviderChain({}, 'Example Person', 5);
  assert.equal(result.provider, 'google');
  assert.equal(result.results.length, 1);
});

test('empty SerpAPI results fall through to DuckDuckGo without Google', async () => {
  const h = harness(url => url.includes('serpapi.com') ? { organic_results: [] }
    : url.includes('duckduckgo.com') ? { Heading: 'Example', AbstractText: 'Public biography', AbstractURL: 'https://example.org/bio' } : null,
    { SERP_API_KEY: 'test' });
  const result = await h.context.runProviderChain({}, 'Example Person', 5);
  assert.equal(result.provider, 'duckduckgo');
});

test('synthesis receives retrieved evidence', async () => {
  const h = harness(url => url.includes('duckduckgo.com') ? { Heading: 'Example', AbstractText: 'Published role', AbstractURL: 'https://example.org/bio' } : null);
  await h.search({ query: 'Example Person', synthesis: true });
  assert.ok(h.prompts.at(-1).prompt.includes('https://example.org/bio'));
  assert.ok(h.prompts.at(-1).prompt.includes('Published role'));
});

test('AI synthesis is separate from external source results', async () => {
  const h = harness(() => null);
  const result = await h.search({ query: 'Example Person', synthesis: true });
  assert.equal(result.results.length, 0);
  assert.equal(result.aiSummary, 'Summary of retrieved public evidence.');
  assert.equal(result.results.some(item => item.url === 'https://glyphlock.io'), false);
});

test('deep searches include professional and official public-record query angles', async () => {
  const h = harness(() => null);
  const result = await h.search({ query: 'Example Person', deep: true });
  for (const site of ['github.com', 'orcid.org', 'patents.google.com']) {
    assert.ok(result.subQueries.some(query => query.includes('site:' + site)), site);
  }
});

test('successful primary search retains its results without fallback calls', async () => {
  const h = harness(url => url.includes('serpapi.com') ? { organic_results: [{ title: 'Official', link: 'https://example.org', snippet: 'Public record' }] } : null,
    { SERP_API_KEY: 'test', GOOGLE_SEARCH_API_KEY: 'test', GOOGLE_SEARCH_CX: 'test' });
  const result = await h.context.runProviderChain({}, 'Example', 5);
  assert.equal(result.provider, 'serpapi');
  assert.equal(h.calls.length, 1);
});

const clientSource = (await readFile(new URL('../src/components/glyphlock/bot/logic/glyphbotClient.jsx', import.meta.url), 'utf8'))
  .replace(/^import .*;$/gm, '').replace(/^export default .*;$/gm, '').replace(/^export \{.*\};$/gm, '');
test('Live research uses deep public search through the existing toggle', async () => {
  let options;
  const context = vm.createContext({
    PERSONAS: {}, console,
    searchService: { query: async (_query, _max, opts) => { options = opts; return { success: true, summary: 'Public professional profile', results: [] }; } },
    askGlyphBot: async () => ({ text: 'Answer', model: 'test' }),
  });
  vm.runInContext(clientSource + '\nglobalThis.client = glyphbotClient;', context);
  await context.client.sendMessage([{ role: 'user', content: 'Research Example Person professional work' }], { realTime: true });
  assert.equal(options.deep, true);
});
