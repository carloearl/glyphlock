import { spawnSync } from 'node:child_process';

const scripts = [
  'ci:base44',
  'check:nups-write-gateway',
  'check:nups-isolation',
  'audit:nups-ui',
  'check:secrets',
  'check:integrations',
  'lint',
  'typecheck',
  'build',
];

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
for (const script of scripts) {
  console.log(`\n[check:nups-batch15] Running npm run ${script}`);
  const result = spawnSync(npm, ['run', script], {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) {
    console.error(`[check:nups-batch15] Could not launch ${script}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`[check:nups-batch15] RED — ${script} failed with exit code ${result.status ?? 1}.`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[check:nups-batch15] GREEN PASS — Batch 15 implementation, security guards, repository audits, type checks, and production build all passed.');
