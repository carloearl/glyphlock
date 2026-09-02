import { readFileSync, existsSync } from 'node:fs';

const requiredFiles = [
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

const failures = [];
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const yamlKeyPattern = (key) => `(?:${escapeRegExp(key)}|"${escapeRegExp(key)}"|'${escapeRegExp(key)}')`;
const isYamlKeyLine = (line, spaces, key) => (
  new RegExp(`^ {${spaces}}${yamlKeyPattern(key)}\\s*:\\s*`).test(line)
);
const getYamlScalar = (line, spaces, key) => (
  line.match(new RegExp(`^ {${spaces}}${yamlKeyPattern(key)}\\s*:\\s*(.*?)\\s*$`))?.[1]
);
const getYamlKey = (line, spaces) => {
  const match = line.match(new RegExp(
    `^ {${spaces}}(?:"([^"]+)"|'([^']+)'|([a-zA-Z][a-zA-Z0-9_-]*))\\s*:`,
  ));
  return match?.[1] ?? match?.[2] ?? match?.[3];
};
const isMappingKeyLine = (line, spaces) => (
  getYamlKey(line, spaces) !== undefined
);

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

requireText('.github/workflows/repository-governance.yml', [
  /name: Repository Governance/,
  /pull_request_target:/,
  /pull_request_review:/,
  /name: Validate protected controls/,
  /const trustedOwner = 'carloearl'/,
  /const protectedPaths = \[/,
  /Repository Governance \/ Validate protected controls/,
  /createCommitStatus/,
  /files\.length !== pull\.changed_files/,
  /previous_filename/,
  /npm-shrinkwrap/,
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
  const workflowNames = workflowLines
    .map((line) => getYamlScalar(line, 0, 'name'))
    .filter((value) => value !== undefined);
  if (workflowNames.length !== 1 || workflowNames[0] !== 'NUPS CI') {
    failures.push('NUPS CI workflow name must be exactly NUPS CI');
  }
  if (workflowLines.some((line) => /(?:^|\s)(?:<<\s*:|[&*][a-zA-Z_][a-zA-Z0-9_-]*)/.test(line))) {
    failures.push('NUPS CI cannot use YAML anchors, aliases, or merge keys');
  }
  for (const globalOverride of ['defaults', 'env']) {
    if (workflowLines.some((line) => isYamlKeyLine(line, 0, globalOverride))) {
      failures.push(`NUPS CI cannot set workflow-level ${globalOverride}`);
    }
  }
  const pullRequestStarts = workflowLines
    .map((line, index) => (isYamlKeyLine(line, 2, 'pull_request') ? index : -1))
    .filter((index) => index !== -1);
  if (pullRequestStarts.length !== 1) {
    failures.push('NUPS CI must define exactly one pull_request trigger');
  }
  const pullRequestStart = pullRequestStarts[0] ?? -1;
  const pullRequestEnd = workflowLines.findIndex(
    (line, index) => index > pullRequestStart && isMappingKeyLine(line, 2),
  );
  const pullRequestBlock = workflowLines.slice(
    pullRequestStart + 1,
    pullRequestEnd === -1 ? workflowLines.length : pullRequestEnd,
  );
  const branchesValue = pullRequestBlock
    .map((line) => getYamlScalar(line, 4, 'branches'))
    .find((value) => value !== undefined);
  if (!/^\[\s*["']?main["']?\s*\]$/.test(branchesValue ?? '')) {
    failures.push('NUPS CI pull_request must target main');
  }
  for (const filter of ['types', 'paths', 'paths-ignore', 'branches-ignore']) {
    if (pullRequestBlock.some((line) => isYamlKeyLine(line, 4, filter))) {
      failures.push(`NUPS CI pull_request cannot use a restrictive filter: ${filter}`);
    }
  }
  const pullRequestKeys = pullRequestBlock.map((line) => getYamlKey(line, 4)).filter(Boolean);
  if (pullRequestKeys.length !== 1 || pullRequestKeys[0] !== 'branches') {
    failures.push('NUPS CI pull_request may only define the main branches filter');
  }

  const verifyJobStarts = workflowLines
    .map((line, index) => (isYamlKeyLine(line, 2, 'verify') ? index : -1))
    .filter((index) => index !== -1);
  const verifyJobStart = verifyJobStarts[0] ?? -1;
  const verifyJobEnd = workflowLines.findIndex(
    (line, index) => index > verifyJobStart && isMappingKeyLine(line, 2),
  );
  const verifyJobLines = verifyJobStart === -1 ? [] : workflowLines.slice(
    verifyJobStart + 1,
    verifyJobEnd === -1 ? workflowLines.length : verifyJobEnd,
  );
  if (verifyJobStarts.length !== 1) {
    failures.push('NUPS CI must define exactly one verify job');
  }
  const stepsStart = verifyJobLines.findIndex((line) => isYamlKeyLine(line, 4, 'steps'));
  const jobKeys = verifyJobLines.map((line) => getYamlKey(line, 4)).filter(Boolean);
  const canonicalJobKeys = ['name', 'runs-on', 'timeout-minutes', 'steps'];
  if (jobKeys.length !== canonicalJobKeys.length
    || canonicalJobKeys.some((key) => !jobKeys.includes(key))) {
    failures.push('NUPS CI verify job may only define name, runs-on, timeout-minutes, and steps once');
  }
  const jobName = verifyJobLines
    .map((line) => getYamlScalar(line, 4, 'name'))
    .find((value) => value !== undefined);
  if (jobName !== 'Verify source and production build') {
    failures.push('NUPS CI verify job name must be exactly Verify source and production build');
  }
  const runsOn = verifyJobLines
    .map((line) => getYamlScalar(line, 4, 'runs-on'))
    .find((value) => value !== undefined);
  if (runsOn !== 'ubuntu-latest') {
    failures.push('NUPS CI verify job must run on ubuntu-latest');
  }
  const stepLines = stepsStart === -1 ? [] : verifyJobLines.slice(stepsStart + 1);
  const stepStarts = stepLines
    .map((line, index) => (/^      -\s+/.test(line) ? index : -1))
    .filter((index) => index !== -1);
  const steps = stepStarts.map((start, index) => {
    const end = stepStarts[index + 1] ?? stepLines.length;
    const lines = stepLines.slice(start, end);
    const firstLine = lines[0].replace(/^      -\s+/, '        ');
    const propertyLines = [firstLine, ...lines.slice(1)];
    const properties = propertyLines.map((line) => getYamlKey(line, 8)).filter(Boolean);
    const withStart = propertyLines.findIndex((line) => isYamlKeyLine(line, 8, 'with'));
    const withEnd = propertyLines.findIndex(
      (line, propertyIndex) => propertyIndex > withStart && isMappingKeyLine(line, 8),
    );
    const withLines = withStart === -1 ? [] : propertyLines.slice(
      withStart + 1,
      withEnd === -1 ? propertyLines.length : withEnd,
    );
    const withEntries = withLines
      .map((line) => {
        const key = getYamlKey(line, 10);
        return key ? { key, value: getYamlScalar(line, 10, key) } : undefined;
      })
      .filter(Boolean);
    const hasWithScalarContinuation = withLines.some((line, withIndex) => {
      if (!getYamlKey(line, 10)) return false;
      const nextKeyIndex = withLines.findIndex(
        (candidate, candidateIndex) => candidateIndex > withIndex && isMappingKeyLine(candidate, 10),
      );
      return withLines
        .slice(withIndex + 1, nextKeyIndex === -1 ? withLines.length : nextKeyIndex)
        .some((candidate) => candidate.trim() && !candidate.trimStart().startsWith('#'));
    });
    const hasScalarContinuation = (key) => {
      const scalarStart = propertyLines.findIndex((line) => isYamlKeyLine(line, 8, key));
      if (scalarStart === -1) return false;
      const scalarEnd = propertyLines.findIndex(
        (line, propertyIndex) => propertyIndex > scalarStart && isMappingKeyLine(line, 8),
      );
      return propertyLines
        .slice(scalarStart + 1, scalarEnd === -1 ? propertyLines.length : scalarEnd)
        .some((line) => line.trim() && !line.trimStart().startsWith('#'));
    };
    return {
      name: propertyLines.map((line) => getYamlScalar(line, 8, 'name')).find((value) => value !== undefined),
      run: propertyLines.map((line) => getYamlScalar(line, 8, 'run')).find((value) => value !== undefined),
      uses: propertyLines.map((line) => getYamlScalar(line, 8, 'uses')).find((value) => value !== undefined),
      condition: propertyLines.map((line) => getYamlScalar(line, 8, 'if')).find((value) => value !== undefined),
      properties,
      withEntries,
      hasProtectedScalarContinuation: ['run', 'uses', 'if'].some(hasScalarContinuation),
      hasWithScalarContinuation,
    };
  });
  if (!steps.length) failures.push('NUPS CI verify job must define steps');
  const expectedSteps = [
    { uses: 'actions/checkout@v4', properties: ['name', 'uses'] },
    {
      uses: 'actions/setup-node@v4',
      properties: ['name', 'uses', 'with'],
      with: { 'node-version': '20', cache: 'npm' },
    },
    { run: 'node scripts/check-repository-governance.mjs', properties: ['name', 'run'] },
    { run: 'npm run check:secrets', properties: ['name', 'run'] },
    { run: 'npm ci', properties: ['name', 'run'] },
    { run: 'npm run audit:entities', properties: ['name', 'run'] },
    { run: 'npm run check:nups-write-gateway', properties: ['name', 'run'] },
    { run: 'npm run ci:base44', properties: ['name', 'run'] },
    { run: 'npm run check:dj-functions', properties: ['name', 'run'] },
    { run: 'npm run check:integrations', properties: ['name', 'run'] },
    { run: 'npm run check:nups-isolation', properties: ['name', 'run'] },
    { run: 'npm run audit:nups-ui', properties: ['name', 'run'] },
    { run: 'npm run lint', properties: ['name', 'run'] },
    { run: 'npm run typecheck', properties: ['name', 'run'] },
    { run: 'npm run build', properties: ['name', 'run'] },
    {
      uses: 'actions/upload-artifact@v4',
      condition: 'always()',
      properties: ['name', 'if', 'uses', 'with'],
      with: {
        name: 'base44-entity-audit',
        path: 'artifacts/entity-audit/',
        'if-no-files-found': 'warn',
        'retention-days': '30',
      },
    },
  ];
  if (steps.length !== expectedSteps.length) {
    failures.push(`NUPS CI verify job must define exactly ${expectedSteps.length} canonical steps`);
  }
  for (const [index, expected] of expectedSteps.entries()) {
    const step = steps[index];
    const sameProperties = step && step.properties.length === expected.properties.length
      && expected.properties.every((property) => step.properties.includes(property));
    const expectedWith = Object.entries(expected.with ?? {});
    const sameWith = step && step.withEntries.length === expectedWith.length
      && expectedWith.every(([key, value]) => (
        step.withEntries.some((entry) => entry.key === key && entry.value === value)
      ));
    if (!step || step.run !== expected.run || step.uses !== expected.uses
      || step.condition !== expected.condition || !sameProperties || !sameWith
      || step.hasProtectedScalarContinuation || step.hasWithScalarContinuation) {
      failures.push(`NUPS CI verify step ${index + 1} is not canonical and fail closed`);
    }
  }
  if (steps.some((step) => /^npm\s+(?:i|install)(?:\s|$)/.test(step.run ?? ''))) {
    failures.push('NUPS CI cannot run npm install or npm i; use the canonical npm ci step');
  }
}

if (existsSync('.npmrc')) {
  const npmConfig = readFileSync('.npmrc', 'utf8');
  if (/^\s*script-shell\s*=/im.test(npmConfig)) {
    failures.push('.npmrc cannot override script-shell');
  }
  if (/^\s*node-options\s*=/im.test(npmConfig)) {
    failures.push('.npmrc cannot set node-options');
  }
}

if (existsSync('.base44/ci-checks.json')) {
  const config = JSON.parse(readFileSync('.base44/ci-checks.json', 'utf8'));
  if (!config.scripts?.includes('check:repository-governance')) {
    failures.push('.base44/ci-checks.json must run check:repository-governance');
  }
  if (!config.scripts?.includes('test:repository-governance')) {
    failures.push('.base44/ci-checks.json must run test:repository-governance');
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
  if (pkg.scripts?.['test:repository-governance'] !== 'node --test scripts/test-repository-governance.mjs') {
    failures.push('package.json must bind test:repository-governance to its regression suite');
  }
}

if (failures.length) {
  console.error('Repository governance check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Repository governance controls are present.');
