#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['run', 'check:nups-batch17']],
  ['npm', ['run', 'check:glyphlock-write-governance']],
  ['npm', ['run', 'check:glyphlock-batch18-runtime']],
  ['npm', ['run', 'check:nups-write-gateway']],
  ['npm', ['run', 'check:nups-isolation']],
  ['npm', ['run', 'audit:entities']],
  ['npm', ['run', 'audit:nups-ui']],
  ['npm', ['run', 'check:secrets']],
  ['npm', ['run', 'check:integrations']],
  ['npm', ['run', 'check:seo-metadata']],
  ['npm', ['run', 'lint']],
  ['npm', ['run', 'typecheck']],
  ['npm', ['run', 'build']],
];

for (const [command, args] of commands) {
  const label = `${command} ${args.join(' ')}`;
  console.log(`\n[check:glyphlock-batch18] Running ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    console.error(`[check:glyphlock-batch18] RED — ${label} failed with exit code ${result.status}.`);
    process.exit(result.status || 1);
  }
}

console.log('\n[check:glyphlock-batch18] GREEN PASS — app-wide business writes, retention, ownership, privacy, CI controls, type checks, and production build all passed.');
