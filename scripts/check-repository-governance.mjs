import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.base44/ci-checks.json',
  '.github/CODEOWNERS',
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
  /node scripts\/run-base44-ci\.mjs/,
]);

requireText('.github/CODEOWNERS', [
  /\/\.github\/workflows\/ @carloearl/,
  /\/scripts\/check-repository-governance\.mjs @carloearl/,
  /\/scripts\/run-base44-ci\.mjs @carloearl/,
]);

requireText('scripts/run-base44-ci.mjs', [
  /const requiredScripts = \['check:repository-governance'\]/,
]);

if (existsSync('.github/workflows/nups-ci.yml')) {
  const workflow = readFileSync('.github/workflows/nups-ci.yml', 'utf8');
  const workflowLines = workflow.split(/\r?\n/);
  const pullRequestStart = workflowLines.findIndex((line) => /^  pull_request:\s*$/.test(line));
  const pullRequestEnd = workflowLines.findIndex(
    (line, index) => index > pullRequestStart && /^  [a-zA-Z][a-zA-Z0-9_-]*:\s*$/.test(line),
  );
  const pullRequestBlock = workflowLines.slice(
    pullRequestStart + 1,
    pullRequestEnd === -1 ? workflowLines.length : pullRequestEnd,
  );

  if (!pullRequestBlock.some((line) => /^    branches:\s*\[main\]\s*$/.test(line))) {
    failures.push('NUPS CI pull_request must target main');
  }
  if (pullRequestBlock.some((line) => /^    types:/.test(line))) {
    failures.push('NUPS CI pull_request must use default activity types so opened, reopened, and synchronized changes run');
  }

  const runCommands = workflowLines
    .map((line) => line.match(/^\s+run:\s*(.+?)\s*$/)?.[1])
    .filter(Boolean);
  const requiredCommandOrder = [
    'node scripts/check-repository-governance.mjs',
    'node scripts/check-no-tracked-secrets.mjs',
    'npm ci',
    'node scripts/run-base44-ci.mjs',
  ];
  const commandIndexes = requiredCommandOrder.map((command) => runCommands.indexOf(command));

  for (const [index, command] of requiredCommandOrder.entries()) {
    if (commandIndexes[index] === -1) {
      failures.push(`.github/workflows/nups-ci.yml must actively run: ${command}`);
    }
  }
  for (let index = 1; index < commandIndexes.length; index += 1) {
    if (commandIndexes[index - 1] !== -1 && commandIndexes[index] !== -1
      && commandIndexes[index - 1] > commandIndexes[index]) {
      failures.push(`Workflow command must run earlier: ${requiredCommandOrder[index - 1]}`);
    }
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
