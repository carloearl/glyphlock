import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.base44/ci-checks.json',
  '.github/pull_request_template.md',
  '.github/workflows/nups-ci.yml',
  'docs/engineering/REPOSITORY_GOVERNANCE.md',
  'package.json',
  'scripts/run-base44-ci.mjs',
];

const failures = [];

for (const path of requiredFiles) {
  if (!existsSync(path)) failures.push(`Missing governance file: ${path}`);
}

const requireText = (path, patterns) => {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const pattern of patterns) {
    if (!pattern.test(content)) {
      failures.push(`${path} is missing required control: ${pattern}`);
    }
  }
};

requireText('AGENTS.md', [
  /main` is a protected release branch/,
  /Material changes/,
  /Base44 must not be configured as a standing bypass actor/,
  /Use squash merge/,
]);

requireText('.github/pull_request_template.md', [
  /Material-change classification/,
  /Invariants preserved/,
  /Verification evidence/,
  /Production impact/,
  /Rollback/,
]);

requireText('.github/workflows/nups-ci.yml', [
  /pull_request:\s*\n\s+branches:\s*\[main\]/,
  /name: Verify source and production build/,
  /npm run ci:base44/,
]);

requireText('scripts/run-base44-ci.mjs', [
  /const requiredScripts = \['check:repository-governance'\]/,
]);

if (existsSync('.github/workflows/nups-ci.yml')) {
  const workflow = readFileSync('.github/workflows/nups-ci.yml', 'utf8');
  const secretScan = workflow.indexOf('run: npm run check:secrets');
  const dependencyInstall = workflow.indexOf('run: npm ci');

  if (secretScan === -1) {
    failures.push('.github/workflows/nups-ci.yml must run check:secrets');
  }
  if (dependencyInstall === -1) {
    failures.push('.github/workflows/nups-ci.yml must use npm ci');
  }
  if (secretScan !== -1 && dependencyInstall !== -1 && secretScan > dependencyInstall) {
    failures.push('check:secrets must run before npm ci');
  }
}

if (existsSync('.base44/ci-checks.json')) {
  const config = JSON.parse(readFileSync('.base44/ci-checks.json', 'utf8'));
  if (!config.scripts?.includes('check:repository-governance')) {
    failures.push('.base44/ci-checks.json must run check:repository-governance');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['ci:base44'] !== 'node scripts/run-base44-ci.mjs') {
    failures.push('package.json must bind ci:base44 to scripts/run-base44-ci.mjs');
  }
}

if (failures.length) {
  console.error('Repository governance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Repository governance controls are present.');
