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
  const verifyJobHeader = stepsStart === -1 ? verifyJobLines : verifyJobLines.slice(0, stepsStart);
  const jobKeys = verifyJobHeader.map((line) => getYamlKey(line, 4)).filter(Boolean);
  const allowedJobKeys = new Set(['name', 'runs-on', 'timeout-minutes']);
  const unsupportedJobKey = jobKeys.find((key) => !allowedJobKeys.has(key));
  if (unsupportedJobKey) {
    failures.push(`NUPS CI verify job cannot define ${unsupportedJobKey}`);
  }
  if (new Set(jobKeys).size !== jobKeys.length) {
    failures.push('NUPS CI verify job cannot define duplicate properties');
  }
  const runsOn = verifyJobHeader
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
    return {
      name: propertyLines.map((line) => getYamlScalar(line, 8, 'name')).find((value) => value !== undefined),
      run: propertyLines.map((line) => getYamlScalar(line, 8, 'run')).find((value) => value !== undefined),
      uses: propertyLines.map((line) => getYamlScalar(line, 8, 'uses')).find((value) => value !== undefined),
      properties,
    };
  });
  if (!steps.length) failures.push('NUPS CI verify job must define steps');
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
    const allowedProperties = new Set(['name', 'run']);
    if (step.properties.some((property) => !allowedProperties.has(property))
      || new Set(step.properties).size !== step.properties.length) {
      failures.push(`Required workflow step must be unconditional and fail closed: ${step.name ?? command}`);
    }
  }
  for (let index = 1; index < commandIndexes.length; index += 1) {
    if (commandIndexes[index - 1] !== -1 && commandIndexes[index] !== -1
      && commandIndexes[index - 1] > commandIndexes[index]) {
      failures.push(`Workflow command must run earlier: ${requiredCommandOrder[index - 1]}`);
    }
  }
  const expectedInitialSteps = [
    { uses: 'actions/checkout@v4', properties: ['name', 'uses'] },
    { uses: 'actions/setup-node@v4', properties: ['name', 'uses', 'with'] },
    { run: 'node scripts/check-repository-governance.mjs', properties: ['name', 'run'] },
    { run: 'npm run check:secrets', properties: ['name', 'run'] },
    { run: 'npm ci', properties: ['name', 'run'] },
  ];
  for (const [index, expected] of expectedInitialSteps.entries()) {
    const step = steps[index];
    const sameProperties = step && step.properties.length === expected.properties.length
      && step.properties.every((property, propertyIndex) => property === expected.properties[propertyIndex]);
    if (!step || step.run !== expected.run || step.uses !== expected.uses || !sameProperties) {
      failures.push(`NUPS CI protected pre-install step ${index + 1} is not canonical`);
    }
  }
  if (steps.some((step) => /^npm\s+(?:i|install)(?:\s|$)/.test(step.run ?? ''))) {
    failures.push('NUPS CI cannot run npm install or npm i; use the canonical npm ci step');
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
