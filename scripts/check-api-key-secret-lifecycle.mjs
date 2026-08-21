import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const schema = read('base44/entities/APIKey.jsonc');
const generate = read('base44/functions/generateAPIKey/entry.ts');
const rotate = read('base44/functions/rotateAPIKey/entry.ts');
const manage = read('base44/functions/manageAPIKeySecurity/entry.ts');
const uiFiles = [
  'src/components/dashboard/DeveloperKeys.jsx',
  'src/components/console/APIKeyVault.jsx',
  'src/pages/CommandCenter.jsx',
];
const ui = uiFiles.map((path) => `${path}\n${read(path)}`).join('\n');

assert(/"secret_key_hash"\s*:/.test(schema), 'APIKey schema must persist secret_key_hash.');
assert(!/"secret_key"\s*:/.test(schema), 'APIKey schema must not define a plaintext secret_key field.');
assert(/secret_key_hash\s*,/.test(generate), 'generateAPIKey must persist the secret hash.');
assert(/secret_key:\s*secretKey/.test(generate), 'generateAPIKey must return the one-time secret to the creation response.');
const createBlock = generate.slice(generate.indexOf('APIKey.create({'), generate.indexOf('});', generate.indexOf('APIKey.create({')) + 3);
assert(!/\bsecret_key\s*:/.test(createBlock), 'generateAPIKey must not persist plaintext secret_key in APIKey.create.');
assert(/secret_key_hash:\s*new_secret_key_hash/.test(rotate), 'rotateAPIKey must persist only the replacement secret hash.');
assert(/secret_key:\s*newSecretKey/.test(rotate), 'rotateAPIKey must return the replacement secret once.');
assert(!/\bkey\.secret_key\b/.test(ui), 'Persisted APIKey list/detail UI must not read key.secret_key.');
assert(/oneTimeSecret/.test(ui), 'API-key UI must hold create/rotate secrets in transient one-time state.');
assert(!/(localStorage|sessionStorage)[^\n]{0,160}(secret_key|oneTimeSecret)|(secret_key|oneTimeSecret)[^\n]{0,160}(localStorage|sessionStorage)/i.test(ui), 'One-time API secrets must not be written to browser storage.');
assert(!/metadata\s*:\s*\{[^}]*secret/i.test(generate + rotate + manage), 'API-key audit metadata must not include plaintext secret material.');
assert(/status:\s*'revoked'/.test(manage), 'Normal security action must revoke and preserve the key record.');

if (failures.length) {
  console.error('[check:api-key-secret-lifecycle] FAILED');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}
console.log('[check:api-key-secret-lifecycle] passed: one-time secret response, hash-only persistence, no persisted-list secret reads, revoke preserves history.');
