import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.github/pull_request_template.md',
  'docs/engineering/REPOSITORY_GOVERNANCE.md',
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
  /pull_request:/,
  /name: Verify source and production build/,
  /npm run ci:base44/,
]);

if (existsSync('.base44/ci-checks.json')) {
  const config = JSON.parse(readFileSync('.base44/ci-checks.json', 'utf8'));
  if (!config.scripts?.includes('check:repository-governance')) {
    failures.push('.base44/ci-checks.json must run check:repository-governance');
  }
}

if (failures.length) {
  console.error('Repository governance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Repository governance controls are present.');
