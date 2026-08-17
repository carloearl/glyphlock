import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/nups/operatingEnvironment.js',
    patterns: [
      /TRAINING:\s*'TRAINING'/,
      /const legacyValue = environment === NUPS_ENVIRONMENTS\.LIVE \? 'REAL' : 'DEMO'/,
      /backendWrites:\s*false/,
      /getNupsDataScope/,
    ],
  },
  {
    file: 'src/lib/nups/trainingStore.js',
    patterns: [/localStorage/, /getTrainingSessionId/, /environment:\s*'TRAINING'/],
    forbidden: [/@\/api\/base44Client/, /base44\.entities/, /functions\.invoke/],
  },
  {
    file: 'src/lib/nups/writeEntity.js',
    patterns: [/NUPS_TRAINING_WRITE_BLOCKED/, /NUPS_DEMO_LIVE_SCOPE_CONFLICT/, /NUPS_LIVE_NONLIVE_SCOPE_CONFLICT/],
  },
  {
    file: 'src/components/nups/shell/NUPSEnvironmentBar.jsx',
    patterns: [/TRAINING MODE IS ISOLATED/, /NO LIVE MONEY/, /OPEN TRAINING CENTER/],
  },
  {
    file: 'src/pages/NUPSTraining.jsx',
    patterns: [/browser-only transaction/i, /NOT A LIVE/i, /printNupsReceipt/],
  },
];

const failures = [];
for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing`);
    continue;
  }
  const source = fs.readFileSync(check.file, 'utf8');
  for (const pattern of check.patterns || []) {
    if (!pattern.test(source)) failures.push(`${check.file}: missing ${pattern}`);
  }
  for (const pattern of check.forbidden || []) {
    if (pattern.test(source)) failures.push(`${check.file}: forbidden training dependency ${pattern}`);
  }
}

if (failures.length) {
  console.error('NUPS mode-isolation guard failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('NUPS environment isolation guard passed: LIVE/DEMO conflict checks, browser-only TRAINING store, UI lock and receipt watermark are present.');
