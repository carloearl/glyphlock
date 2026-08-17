import fs from 'node:fs';
import path from 'node:path';

const expected = 'npm:@base44/sdk@0.8.38';
const functions = [
  'youtubeMusicSearch',
  'resolveYouTubeVideo',
  'nupsDJGateway',
  'nupsMusicDiscovery',
  'archiveAudioSearch',
  'musicSearch',
];

const failures = [];
for (const name of functions) {
  const file = path.join('base44', 'functions', name, 'entry.ts');
  const source = fs.readFileSync(file, 'utf8');
  const firstLine = source.split(/\r?\n/, 1)[0] || '';
  if (!firstLine.includes(expected)) {
    failures.push(`${name}: expected ${expected}; found ${firstLine || '<empty>'}`);
  }
}

if (failures.length) {
  console.error('DJ Base44 runtime pin check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`DJ Base44 runtime pin check passed for ${functions.length} functions (${expected}).`);
