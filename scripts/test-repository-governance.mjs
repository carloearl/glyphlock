import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const checker = join(repositoryRoot, 'scripts/check-repository-governance.mjs');
const fixturePaths = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.base44/ci-checks.json',
  '.github/CODEOWNERS',
  '.github/pull_request_template.md',
  '.github/workflows/nups-ci.yml',
  'docs/engineering/REPOSITORY_GOVERNANCE.md',
  'package.json',
  'scripts/run-base44-ci.mjs',
  'scripts/test-repository-governance.mjs',
];

const runFixture = (mutateWorkflow = (workflow) => workflow) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'glyphlock-governance-'));
  try {
    for (const relativePath of fixturePaths) {
      const target = join(fixtureRoot, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(repositoryRoot, relativePath), target);
    }
    const workflowPath = join(fixtureRoot, '.github/workflows/nups-ci.yml');
    writeFileSync(workflowPath, mutateWorkflow(readFileSync(workflowPath, 'utf8')));
    return spawnSync(process.execPath, [checker], { cwd: fixtureRoot, encoding: 'utf8' });
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
};

test('accepts the canonical workflow', () => {
  const result = runFixture();
  assert.equal(result.status, 0, result.stderr);
});

test('requires protected commands inside the verify job', () => {
  const result = runFixture((workflow) => `${workflow.replace(/^  verify:/m, '  other:')}
  verify:
    name: Verify source and production build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout only
        uses: actions/checkout@v4
`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must actively run: node scripts\/check-repository-governance\.mjs/);
});

test('rejects quoted restrictive pull-request filters', () => {
  const result = runFixture((workflow) => workflow.replace(
    '    branches: [main]\n  workflow_dispatch:',
    '    branches: [main]\n    "types": [closed]\n  workflow_dispatch:',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /restrictive filter: types/);
});

test('rejects quoted conditions on protected steps', () => {
  const result = runFixture((workflow) => workflow.replace(
    '        run: npm run check:secrets',
    '        "if": false\n        run: npm run check:secrets',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /must be unconditional and fail closed/);
});
