import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['scripts/twilio-trust-audit.mjs'],{
  env:{PATH:process.env.PATH},encoding:'utf8'
});
assert.equal(result.status,2);
assert.match(result.stderr,/Missing TWILIO_ACCOUNT_SID/);
assert.doesNotMatch(result.stdout,/AC[a-f0-9]{32}/i);
console.log('Twilio trust audit guard: PASS (fails closed without credentials)');
