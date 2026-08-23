import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const verifier = await readFile(new URL('./verify-live.mjs', import.meta.url), 'utf8');
const rollback = await readFile(new URL('./rollback.mjs', import.meta.url), 'utf8');
const preflight = await readFile(new URL('./preflight.mjs', import.meta.url), 'utf8');

test('live verification bounds network latency and response bodies', () => {
  assert.match(verifier, /REQUEST_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(verifier, /MAX_BODY_BYTES\s*=\s*256\s*\*\s*1024/);
  assert.match(verifier, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(verifier, /readBodyBounded/);
  assert.match(verifier, /reader\.cancel/);
  assert.doesNotMatch(verifier, /response\.text\(\)/);
});

test('only the public route reads a response body', () => {
  assert.match(verifier, /request\('\/About',[\s\S]*?\{ readBody: true \}\)/);
  assert.doesNotMatch(verifier, /request\('\/admin\/settlement',[^\n]*readBody/);
  assert.doesNotMatch(verifier, /request\('\/admin%2Fsettlement',[^\n]*readBody/);
  assert.doesNotMatch(verifier, /request\('\/NUPSAdminPortal',[^\n]*readBody/);
});

test('rollback bounds Cloudflare API calls and response bodies', () => {
  assert.match(rollback, /REQUEST_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(rollback, /MAX_API_BODY_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(rollback, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(rollback, /readTextBounded/);
  assert.match(rollback, /reader\.cancel/);
  assert.doesNotMatch(rollback, /response\.text\(\)/);
  assert.match(rollback, /route\?\.pattern === ROUTE_PATTERN/);
  assert.match(rollback, /Refused to delete/);
});


test('preflight bounds Cloudflare inventory requests and response bodies', () => {
  assert.match(preflight, /REQUEST_TIMEOUT_MS\s*=\s*8_000/);
  assert.match(preflight, /MAX_API_BODY_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(preflight, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(preflight, /readTextBounded/);
  assert.match(preflight, /reader\.cancel/);
  assert.doesNotMatch(preflight, /response\.text\(\)/);
});
