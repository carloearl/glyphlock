# GlyphLock Edge Guard

This Cloudflare Worker is intentionally narrow and reversible. It does not prerender pages, rewrite marketing content, alter DNS, purge cache, change SSL/TLS, or replace Base44 authentication.

It performs two edge controls:

1. Recognized search and social crawlers receive HTTP 404 on protected internal routes.
2. Other protected-route responses retain their Base44 status and body while receiving `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Cache-Control: private, no-store`.

Public traffic passes through unchanged. The crawler-prerender fallback remains disabled until the corrected Base44 application is published and the seven-route verification proves the built-in renderer still fails.

## Protected routes

- `/admin` and descendants
- `/demo` and descendants
- `/IntegrationTests`
- `/SiteBuilderTest`
- `/EmergencyBackup`
- `/FullExport`
- `/NotFound`
- `/unauthorized`
- `/NUPSAdminPortal`
- `/ProviderConsole`

Matching is case-insensitive, ignores trailing and repeated separators, and handles encoded and double-encoded slash or backslash variants.

## Local verification

Use Node.js 22 or newer.

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm run deploy:dry-run
```

## Trusted delivery sequence

1. Pull requests run syntax checks, unit tests, dependency installation from `package-lock.json`, and a Wrangler dry run without Cloudflare credentials.
2. After merge, trusted `main` inventories the active `glyphlock.io` zone using the `cloudflare-production-preflight` environment.
3. Inventory fails closed unless the apex DNS record is proxied and no existing apex Worker route, apex Worker custom domain, or `glyphlock-edge-guard` script would be overwritten.
4. The deploy job reruns the inventory immediately before mutation to narrow the preflight-to-deploy race window.
5. Deployment is limited to script `glyphlock-edge-guard` and route `glyphlock.io/*`.
6. Live verification uses bounded requests and checks public browser traffic, Googlebot encoded-path handling, OAI-SearchBot protection, and protected browser headers.
7. A failed deploy or live verification triggers exact-scope rollback. Rollback removes only `glyphlock.io/*` when it references `glyphlock-edge-guard`, then removes only that script when no non-target route references it.

Deployment credentials remain inside trusted-main jobs and GitHub environments. Tokens are never printed, stored in artifacts, passed to pull-request-controlled code, or committed to the repository.

## Rollback boundary

Rollback never edits DNS records, SSL/TLS mode, cache rules, Page Rules, rulesets, Base44 configuration, unrelated Worker routes, or unrelated Worker scripts. API calls and live checks have explicit timeouts so the job retains time to execute rollback.

## Authentication boundary

This Worker does not guess Base44 session state. A true unauthenticated 401/403 for every operator route remains an application-auth or Cloudflare Access decision and requires a verified allow policy so legitimate venue operators are not locked out.
