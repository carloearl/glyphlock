import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/nups/operatingMode.js',
    patterns: [
      /TRAINING:\s*'TRAINING'/,
      /ledgerModeForOperatingMode/,
      /OPERATING_MODE\.TRAINING.*LEDGER_MODE\.DEMO/s,
      /training_session_id/,
      /getCurrentOperatingMode/,
    ],
  },
  {
    file: 'src/lib/nups/trainingStore.js',
    patterns: [/localStorage/, /TRAINING_BROWSER_SESSION_KEY/, /environment:\s*'TRAINING'/],
    forbidden: [/@\/api\/base44Client/, /base44\.entities/, /functions\.invoke/],
  },
  {
    file: 'src/lib/nups/writeEntity.js',
    patterns: [/stampOperationalRecord/, /getOperatingMode/, /saveLastReceipt/],
    forbidden: [/operatingEnvironment/, /NUPS_TRAINING_WRITE_BLOCKED/],
  },
  {
    file: 'src/components/nups/shell/ModeToggle.jsx',
    patterns: [/OPERATING_MODE\.TRAINING/, /Open Training Center/, /Confirm wipe/],
  },
  {
    file: 'src/components/nups/shell/NUPSAppShell.jsx',
    patterns: [/NavigationMenu/, /<ModeToggle\s*\/>/, /NUPSActionSafety/],
    forbidden: [/NUPSEnvironmentBar/, /SideRail/, /TrainingCoach/],
  },
  {
    file: 'src/pages/NUPSTraining.jsx',
    patterns: [/NUPSAppShell/, /TRAINING WORKFLOW MENU/, /printNupsReceipt/, /Training mode is required/],
    forbidden: [/NUPSEnvironmentBar/, /<aside/],
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
    if (pattern.test(source)) failures.push(`${check.file}: forbidden duplicate/conflict ${pattern}`);
  }
}

const removedDuplicates = [
  'src/lib/nups/operatingEnvironment.js',
  'src/hooks/useNupsEnvironment.js',
  'src/components/nups/shell/NUPSEnvironmentBar.jsx',
  'src/components/nups/training/TrainingCoach.jsx',
];
for (const file of removedDuplicates) {
  if (fs.existsSync(file)) failures.push(`${file}: duplicate system should be removed`);
}

if (failures.length) {
  console.error('NUPS mode/navigation consolidation guard failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('NUPS consolidation guard passed: one native mode dropdown, one navigation dropdown, isolated training store, and no duplicate environment UI.');
