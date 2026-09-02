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
  /npm run ci:base44/,
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
  const restrictedPullRequestFilter = pullRequestBlock.find((line) => (
    /^    (types|paths|paths-ignore|branches-ignore):/.test(line)
  ));
  if (restrictedPullRequestFilter) {
    failures.push(`NUPS CI pull_request cannot use a restrictive filter: ${restrictedPullRequestFilter.trim()}`);
  }

  const verifyJobStart = workflowLines.findIndex((line) => /^  verify:\s*$/.test(line));
  const stepsStart = workflowLines.findIndex(
    (line, index) => index > verifyJobStart && /^    steps:\s*$/.test(line),
  );
  const verifyJobHeader = workflowLines.slice(verifyJobStart + 1, stepsStart);
  if (verifyJobHeader.some((line) => /^    if:/.test(line))) {
    failures.push('NUPS CI verify job must be unconditional');
  }

  const stepStarts = workflowLines
    .map((line, index) => (/^      - name:\s+/.test(line) ? index : -1))
    .filter((index) => index !== -1);
  const steps = stepStarts.map((start, index) => {
    const end = stepStarts[index + 1] ?? workflowLines.length;
    const lines = workflowLines.slice(start, end);
    return {
      name: workflowLines[start].replace(/^      - name:\s+/, '').trim(),
      run: lines.map((line) => line.match(/^        run:\s*(.+?)\s*$/)?.[1]).find(Boolean),
      hasCondition: lines.some((line) => /^        if:/.test(line)),
      canContinueOnError: lines.some((line) => /^        continue-on-error:/.test(line)),
    };
  });
  const requiredCommandOrder = [
    'node scripts/check-repository-governance.mjs',
    'npm run check:secrets',
    'npm ci',
    'npm run ci:base44',
  ];
  const commandIndexes = requiredCommandOrder.map((command) => (
    steps.findIndex((step) => step.run === command)
  ));

  for (const [index, command] of requiredCommandOrder.entries()) {
    if (commandIndexes[index] === -1) {
      failures.push(`.github/workflows/nups-ci.yml must actively run: ${command}`);
      continue;
    }
    const step = steps[commandIndexes[index]];
    if (step.hasCondition || step.canContinueOnError) {
      failures.push(`Required workflow step must be unconditional and fail closed: ${step.name}`);
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
  if (pkg.scripts?.['check:secrets'] !== 'node scripts/check-no-tracked-secrets.mjs') {
    failures.push('package.json must bind check:secrets to scripts/check-no-tracked-secrets.mjs');
  }
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
