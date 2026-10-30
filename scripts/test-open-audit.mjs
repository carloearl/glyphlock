import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const raw = (await readFile(new URL('../base44/functions/runSiteAudit/entry.ts', import.meta.url), 'utf8')).replace(/^import .*;\n/, '');
const compiled = ts.transpileModule(raw, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function harness(env = {}) {
  const calls = [];
  const tree = Array.from({ length: 31 }, (_, index) => ({ type: 'blob', path: 'base44/functions/auth' + String(index).padStart(2, '0') + '/entry.ts', size: 100, sha: 'blob' + index }));
  tree.push({ type: 'blob', path: 'src/pages/ZZZ.jsx', size: 100, sha: 'target' });
  const context = vm.createContext({
    Deno: { env: { get: key => env[key] }, serve() {} }, URL, Response, AbortController, setTimeout, clearTimeout, console,
    fetch: async (url) => {
      calls.push(String(url));
      const data = String(url).includes('/commits/') ? { sha: 'pinned', commit: { tree: { sha: 'tree' } } }
        : String(url).includes('/git/trees/') ? { truncated: false, tree }
        : { lighthouseResult: { categories: { performance: { score: 0.75, auditRefs: [] } }, audits: {} } };
      return { ok: true, json: async () => data, text: async () => 'const ok = true;' };
    },
  });
  vm.runInContext(compiled, context);
  return { context, calls };
}

test('PageSpeed uses a configured dedicated API key', async () => {
  const h = harness({ PAGESPEED_API_KEY: 'fixture-key' });
  await h.context.fetchPageSpeedEvidence('https://glyphlock.io');
  assert.equal(new URL(h.calls[0]).searchParams.get('key'), 'fixture-key');
});

test('targeted source paths are included ahead of the bounded sample', async () => {
  const h = harness();
  const result = await h.context.fetchRepositoryEvidence('security', ['src/pages/ZZZ.jsx']);
  assert.ok(result.sources.some(source => source.path === 'src/pages/ZZZ.jsx'));
  assert.equal(result.sources.length, 30);
});

test('source coverage reports sampling instead of claiming a full scan', async () => {
  const h = harness();
  const result = await h.context.fetchRepositoryEvidence('security');
  assert.equal(result.coverage.sampled, true);
  assert.equal(result.coverage.inventoryCount, 32);
  assert.equal(result.coverage.filesScanned, 30);
  assert.equal(result.coverage.inventoryTruncated, false);
});

test('real Lighthouse category scores are preserved', async () => {
  const h = harness();
  const result = await h.context.fetchPageSpeedEvidence('https://glyphlock.io');
  assert.equal(result.status, 'measured');
  assert.equal(result.categoryScores.performance, 75);
});