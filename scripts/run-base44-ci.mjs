import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, '.base44', 'ci-checks.json');
const packagePath = path.join(root, 'package.json');

function readJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`[ci:base44] Could not read ${label}: ${error.message}`);
    process.exit(1);
  }
}

const manifest = readJson(manifestPath, '.base44/ci-checks.json');
const pkg = readJson(packagePath, 'package.json');
const configured = manifest?.scripts;

if (!Array.isArray(configured)) {
  console.error('[ci:base44] Manifest field "scripts" must be an array.');
  process.exit(1);
}

const scriptNamePattern = /^[a-z0-9][a-z0-9:_-]*$/;
const seen = new Set();
const scripts = [];

for (const value of configured) {
  if (typeof value !== 'string' || !scriptNamePattern.test(value)) {
    console.error(`[ci:base44] Invalid npm script name: ${JSON.stringify(value)}`);
    process.exit(1);
  }
  if (value === 'ci:base44') {
    console.error('[ci:base44] Recursive ci:base44 entry is not allowed.');
    process.exit(1);
  }
  if (!pkg.scripts?.[value]) {
    console.error(`[ci:base44] package.json does not define npm script "${value}".`);
    process.exit(1);
  }
  if (!seen.has(value)) {
    seen.add(value);
    scripts.push(value);
  }
}

if (scripts.length === 0) {
  console.log('[ci:base44] No Base44-managed checks are configured.');
  process.exit(0);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

for (const script of scripts) {
  console.log(`\n[ci:base44] Running npm run ${script}`);
  const result = spawnSync(npmCommand, ['run', script], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`[ci:base44] Failed to launch "${script}": ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[ci:base44] "${script}" failed with exit code ${result.status ?? 1}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\n[ci:base44] PASS — ${scripts.length} configured check${scripts.length === 1 ? '' : 's'} completed.`);
