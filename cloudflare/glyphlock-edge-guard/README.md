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
node --check scripts/verify-live.mjs
node --check scripts/rollback.mjs
node --test
npx wrangler deploy --dry-run
```

## Delivery controls

The GitHub workflow separates review from mutation:

1. Pull requests run credential-free syntax and unit tests only. Cloudflare secrets are never exposed to pull-request code.
2. A merge to `main` runs a trusted preflight against the live `glyphlock.io` zone.
3. Preflight inventories Worker scripts/routes, Page Rules, rulesets, exact apex DNS proxy state, and selected cache settings.
4. Deployment fails closed unless the apex is proxied and no existing apex Worker route or `glyphlock-edge-guard` script would be overwritten.
5. The workflow deploys only the exact `glyphlock-edge-guard` script on `glyphlock.io/*` using encrypted GitHub Actions secrets.
6. Live verification confirms that `/About` remains public, crawler requests to protected routes return HTTP 404, encoded admin-path variants are blocked, and protected browser responses receive noindex/no-store headers.
7. Any deployment or live-verification failure automatically attempts an exact-scope rollback.

The rollback script may delete only:

- Worker script: `glyphlock-edge-guard`
- Worker route: `glyphlock.io/*` when that route references `glyphlock-edge-guard`

It refuses to delete the script if a non-target route begins referencing it. It never edits DNS records, SSL/TLS mode, cache rules, Page Rules, rulesets, or unrelated Workers.

## Required encrypted secrets

The workflow accepts the canonical names below and supports the listed legacy aliases while they are migrated:

- `CLOUDFLARE_API_TOKEN` (`CF_API_TOKEN` or `CLOUDFLARE_TOKEN` also accepted)
- `CLOUDFLARE_ACCOUNT_ID` (`CF_ACCOUNT_ID` also accepted; preflight verifies ownership and derives the authoritative account ID from the active zone)

The API token must be scoped narrowly enough to read the `glyphlock.io` zone inventory and deploy/delete the dedicated Worker and route. Never place the token in source, workflow output, artifacts, issue comments, or chat.

## Authentication boundary

This Worker does not guess Base44 session state. A true unauthenticated 401/403 for all operator routes remains an application-auth or Cloudflare Access decision and requires a verified allow policy so legitimate venue operators are not locked out.
