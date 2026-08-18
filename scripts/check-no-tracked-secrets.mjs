import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const safeEnvTemplates = new Set(['.env.example', '.env.sample', '.env.template']);

function isSensitiveFilename(file) {
  const normalized = file.replaceAll('\\', '/');
  const base = path.posix.basename(normalized).toLowerCase();

  if (safeEnvTemplates.has(base)) return false;
  if (base === '.env' || base.startsWith('.env.') || base.endsWith('.env') || base.includes('.env.')) return true;
  if (['.npmrc', '.pypirc', '.netrc', '.secrets'].includes(base)) return true;
  if (/^id_(rsa|dsa|ecdsa|ed25519)$/.test(base)) return true;
  if (/\.(pem|key|p8|p12|pfx|jks|keystore)$/.test(base)) return true;
  if (/^(secrets?|tokens?|credentials?)\.(json|ya?ml|toml|ini|conf|txt)$/.test(base)) return true;
  if (/(^|[-_])(client[-_]?secret|oauth[-_]?client|service[-_]?account|firebase[-_]?adminsdk|google[-_]?credentials|api[-_]?keys?|refresh[-_]?token)([-_].*)?\.json$/.test(base)) return true;
  if (/[-_](secrets?|credentials?)[-_]?.*\.json$/.test(base)) return true;
  return false;
}

const credentialPatterns = [
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----\s+[A-Za-z0-9+/=\r\n]{40,}-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/m],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Google OAuth client secret', /\bGOCSPX-[0-9A-Za-z_-]{20,}\b/],
  ['OpenAI API key', /\bsk-(?:proj-)?[0-9A-Za-z_-]{20,}\b/],
  ['Anthropic API key', /\bsk-ant-api[0-9A-Za-z_-]{20,}\b/],
  ['GitHub token', /\bgh[pousr]_[0-9A-Za-z]{20,}\b/],
  ['AWS access key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Stripe secret key', /\bsk_(?:live|test)_[0-9A-Za-z]{16,}\b/],
  ['Slack token', /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/],
  ['Hugging Face token', /\bhf_[0-9A-Za-z]{24,}\b/],
  ['Perplexity API key', /\bpplx-[0-9A-Za-z]{20,}\b/],
];

const filenameFailures = trackedFiles.filter(isSensitiveFilename);
const contentFailures = [];

for (const file of trackedFiles) {
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    continue;
  }
  if (!stat.isFile() || stat.size > 5_000_000) continue;

  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  for (const [label, pattern] of credentialPatterns) {
    if (pattern.test(content)) contentFailures.push({ file, label });
  }
}

if (filenameFailures.length || contentFailures.length) {
  console.error('Tracked secret guard failed. No secret values are printed.');
  for (const file of filenameFailures) console.error(`- sensitive filename: ${file}`);
  for (const hit of contentFailures) console.error(`- ${hit.label}: ${hit.file}`);
  console.error('Remove the file/value from Git, rotate exposed credentials, and store runtime secrets in Base44/GitHub secret storage.');
  process.exit(1);
}

console.log(`Tracked secret guard passed for ${trackedFiles.length} files.`);
