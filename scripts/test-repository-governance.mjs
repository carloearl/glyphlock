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
  '.github/workflows/repository-governance.yml',
  'docs/engineering/REPOSITORY_GOVERNANCE.md',
  'INVARIANTS.md',
  'package.json',
  'scripts/run-base44-ci.mjs',
  'scripts/test-repository-governance.mjs',
];

const runFixture = (mutateWorkflow = (workflow) => workflow, prepareFixture = () => {}) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'glyphlock-governance-'));
  try {
    for (const relativePath of fixturePaths) {
      const target = join(fixtureRoot, relativePath);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(join(repositoryRoot, relativePath), target);
    }
    const workflowPath = join(fixtureRoot, '.github/workflows/nups-ci.yml');
    writeFileSync(workflowPath, mutateWorkflow(readFileSync(workflowPath, 'utf8')));
    prepareFixture(fixtureRoot);
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
  assert.match(result.stderr, /verify step 1 is not canonical|exactly 16 canonical steps/);
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
  assert.match(result.stderr, /verify step 4 is not canonical and fail closed/);
});

test('rejects whitespace-separated restrictive filter keys', () => {
  const result = runFixture((workflow) => workflow.replace(
    '    branches: [main]\n  workflow_dispatch:',
    '    branches: [main]\n    types : [closed]\n  workflow_dispatch:',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /restrictive filter: types/);
});

test('rejects alternative dependency installs before the secret scan', () => {
  const result = runFixture((workflow) => workflow.replace(
    '      - name: Block tracked environments and secrets',
    '      - name: Early install\n        run: npm install\n\n      - name: Block tracked environments and secrets',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cannot run npm install or npm i/);
});

test('rejects custom shells on protected steps', () => {
  const result = runFixture((workflow) => workflow.replace(
    '        run: npm run check:secrets',
    '        run: npm run check:secrets\n        shell: echo {0}',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verify step 4 is not canonical and fail closed/);
});

test('rejects prerequisites that can skip the verify job', () => {
  const result = runFixture((workflow) => workflow.replace(
    '    runs-on: ubuntu-latest',
    '    needs: never\n    runs-on: ubuntu-latest',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /may only define name, runs-on, timeout-minutes, and steps once/);
});

test('rejects workflow-level run defaults', () => {
  const result = runFixture((workflow) => workflow.replace(
    'permissions:\n  contents: read',
    'defaults:\n  run:\n    shell: echo {0}\n\npermissions:\n  contents: read',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /workflow-level defaults/);
});

test('rejects duplicate protected step properties', () => {
  const result = runFixture((workflow) => workflow.replace(
    '        run: npm run check:secrets',
    '        run: npm run check:secrets\n        "run" : echo bypass',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verify step 4 is not canonical and fail closed/);
});

test('rejects job overrides placed after the steps block', () => {
  const result = runFixture((workflow) => `${workflow}    defaults:\n      run:\n        shell: echo {0}\n`);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /may only define name, runs-on, timeout-minutes, and steps once/);
});

test('requires production build validation', () => {
  const result = runFixture((workflow) => workflow.replace(
    '      - name: Build production bundle\n        run: npm run build\n\n',
    '',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /exactly 16 canonical steps|verify step 15 is not canonical/);
});

test('binds the required status to the exact verify job name', () => {
  const result = runFixture((workflow) => workflow.replace(
    '    name: Verify source and production build',
    '    name: Alternate status',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verify job name must be exactly Verify source and production build/);
});

test('binds the required status to the exact workflow name', () => {
  const result = runFixture((workflow) => workflow.replace('name: NUPS CI', 'name: Alternate CI'));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /workflow name must be exactly NUPS CI/);
});

test('validates exact entity-audit artifact inputs', () => {
  const result = runFixture((workflow) => workflow.replace(
    '          if-no-files-found: warn',
    '          if-no-files-found: ignore',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verify step 16 is not canonical and fail closed/);
});

test('rejects repository-controlled npm script shells', () => {
  const result = runFixture(undefined, (fixtureRoot) => {
    writeFileSync(join(fixtureRoot, '.npmrc'), 'script-shell=/bin/true\n');
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /.npmrc cannot override script-shell/);
});

test('rejects repository-controlled Node preload options', () => {
  const result = runFixture(undefined, (fixtureRoot) => {
    writeFileSync(join(fixtureRoot, '.npmrc'), 'node-options=--require=./preload.cjs\n');
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /.npmrc cannot set node-options/);
});

test('rejects folded continuations on protected commands', () => {
  const result = runFixture((workflow) => workflow.replace(
    '        run: npm run check:secrets',
    '        run: npm run check:secrets\n          || true',
  ));
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /verify step 4 is not canonical and fail closed/);
});
