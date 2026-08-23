import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('./verify-live.mjs', import.meta.url), 'utf8');

test('live verification bounds network latency and response bodies', () => {
  assert.match(source, /REQUEST_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(source, /MAX_BODY_BYTES\s*=\s*256\s*\*\s*1024/);
  assert.match(source, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(source, /readBodyBounded/);
  assert.match(source, /reader\.cancel/);
  assert.doesNotMatch(source, /response\.text\(\)/);
});

test('only the public route reads a response body', () => {
  assert.match(source, /request\('\/About',[\s\S]*?\{ readBody: true \}\)/);
  assert.doesNotMatch(source, /request\('\/admin\/settlement',[^\n]*readBody/);
  assert.doesNotMatch(source, /request\('\/admin%2Fsettlement',[^\n]*readBody/);
  assert.doesNotMatch(source, /request\('\/NUPSAdminPortal',[^\n]*readBody/);
});
