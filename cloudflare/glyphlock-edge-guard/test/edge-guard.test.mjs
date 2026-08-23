import test from 'node:test';
import assert from 'node:assert/strict';
import { isCrawler, isProtectedPath, normalizePathname } from '../src/index.js';
import { routePatternCoversApex } from '../scripts/route-pattern.mjs';

test('normalizes repeated, trailing, encoded, and double-encoded slashes', () => {
  assert.equal(normalizePathname('//admin//settlement/'), '/admin/settlement');
  assert.equal(normalizePathname('/admin%2Fsettlement'), '/admin/settlement');
  assert.equal(normalizePathname('/admin%252Fsettlement'), '/admin/settlement');
  assert.equal(normalizePathname('/'), '/');
});

test('matches protected paths case-insensitively', () => {
  for (const path of [
    '/admin',
    '/admin/settlement',
    '/ADMIN/payment-reconciliation/',
    '/NUPSAdminPortal',
    '/ProviderConsole',
    '/IntegrationTests',
    '/SiteBuilderTest',
    '/EmergencyBackup',
    '/FullExport',
    '/NotFound',
    '/unauthorized',
    '/demo/example',
  ]) {
    assert.equal(isProtectedPath(path), true, path);
  }
});

test('does not classify public or misleading prefix routes as protected', () => {
  for (const path of [
    '/',
    '/About',
    '/Pricing',
    '/Solutions',
    '/NUPSLanding',
    '/SecureQRStudio',
    '/SDKDocs',
    '/administrator',
    '/demonstration',
  ]) {
    assert.equal(isProtectedPath(path), false, path);
  }
});

test('recognizes search and social crawlers without classifying browsers', () => {
  assert.equal(isCrawler('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
  assert.equal(isCrawler('facebookexternalhit/1.1'), true);
  assert.equal(isCrawler('Twitterbot/1.0'), true);
  assert.equal(isCrawler('Mozilla/5.0 Chrome/151.0.0.0 Safari/537.36'), false);
});

test('detects every Cloudflare route form that covers the apex', () => {
  for (const pattern of [
    'glyphlock.io',
    'glyphlock.io/*',
    'https://glyphlock.io/*',
    'http://glyphlock.io/*',
    '*glyphlock.io/*',
    'https://*glyphlock.io/*',
    '*/*',
  ]) {
    assert.equal(routePatternCoversApex(pattern, 'glyphlock.io'), true, pattern);
  }
});

test('does not treat subdomain-only or lookalike routes as apex routes', () => {
  for (const pattern of [
    '*.glyphlock.io/*',
    'admin.glyphlock.io/*',
    'glyphlock.io.evil.test/*',
    '',
  ]) {
    assert.equal(routePatternCoversApex(pattern, 'glyphlock.io'), false, pattern);
  }
});
