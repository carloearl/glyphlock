# GlyphLock Edge Guard

This Cloudflare Worker is intentionally narrow and reversible. It does not prerender pages, rewrite marketing content, alter DNS, purge cache, or replace Base44 authentication.

It performs two edge controls:

1. Recognized search and social crawlers receive HTTP 404 on protected internal routes.
2. Other protected-route responses retain their Base44 status and body while receiving `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` and `Cache-Control: private, no-store`.

Public traffic passes through unchanged. The crawler-prerender fallback remains disabled until the corrected Base44 application is published and the seven-route Phase 4 verification proves the built-in renderer still fails.

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

Matching is case-insensitive, ignores trailing and repeated slashes, and handles common encoded-path variants.

## Local verification

```bash
node --check src/index.js
node --check scripts/preflight.mjs
node --check scripts/route-pattern.mjs
node --check scripts/verify-live.mjs
node --check scripts/rollback.mjs
node --test
npx wrangler deploy --dry-run
```

## Trusted delivery sequence

1. Pull requests run credential-free Worker, route-pattern, live-verifier, rollback, and unit tests. Pull-request code never receives a Cloudflare token.
2. Merge only after NUPS CI, credential-free Cloudflare validation, and security review pass.
3. The merge to trusted `main` automatically runs **Cloudflare Edge Guard Delivery**; it can also be manually dispatched from `main`.
4. The credentialed preflight job uses the protected `cloudflare-production-preflight` environment and verifies pinned hashes for the inventory and route-pattern sources before executing them.
5. Preflight inventories the active `glyphlock.io` zone, proxied apex DNS, Worker scripts/routes, Page Rules, rulesets, and selected cache settings.
6. Deployment stops if any route pattern covers the apex or if any `glyphlock-edge-guard` script already exists. Scheme-qualified and leading-wildcard patterns are included.
7. Deployment is limited to the exact script `glyphlock-edge-guard` and route `glyphlock.io/*`.
8. Live verification confirms that browser `/About` remains public, Googlebot requests to `/admin/settlement` and its encoded-path variant return HTTP 404, and protected browser responses receive noindex/no-store headers.
9. Any deployment or live-verification failure automatically attempts the exact rollback described below and then fails the workflow.

## Exact rollback boundary

The rollback script may delete only:

- Worker route `glyphlock.io/*` when that route references `glyphlock-edge-guard`
- Worker script `glyphlock-edge-guard`

It refuses to delete the script if a non-target route begins referencing it. It never edits DNS records, SSL/TLS mode, cache rules, Page Rules, rulesets, Base44 configuration, or unrelated Workers.

## Required encrypted secrets

The trusted environment may use these names:

- `CLOUDFLARE_API_TOKEN`, with `CF_API_TOKEN` or `CLOUDFLARE_TOKEN` accepted as aliases
- `CLOUDFLARE_ACCOUNT_ID`, with `CF_ACCOUNT_ID` accepted as an alias

Preflight derives the authoritative account and zone IDs from the active `glyphlock.io` zone and rejects a mismatched account hint. Never put an API token in source, workflow output, artifacts, issue comments, or chat.

## Authentication boundary

This Worker does not guess Base44 session state. A true unauthenticated 401/403 for all operator routes remains an application-auth or Cloudflare Access decision and requires a verified allow policy so legitimate venue operators are not locked out.
