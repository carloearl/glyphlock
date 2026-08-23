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
npm test
npx wrangler deploy --dry-run
```

## Deployment sequence

1. Let the pull-request workflow run credential-free source and route-pattern tests. Pull-request code never receives a Cloudflare token.
2. Merge only after NUPS CI, the credential-free Cloudflare validation, and security review pass.
3. The merge to trusted `main` automatically runs **Cloudflare Edge Guard Preflight**; it can also be manually dispatched from `main`. Its credentialed job checks protected source hashes before executing.
4. Confirm the token can read the active `glyphlock.io` zone, proxied apex DNS, Worker scripts/routes, Page Rules, rulesets, and selected cache settings.
5. Stop if any route pattern that covers the apex or any `glyphlock-edge-guard` script already exists. Scheme-qualified and leading-wildcard patterns are included.
6. Add and review a separate deployment workflow only after the sanitized inventory reports `safe_to_deploy=true`. Never put an API token in source, workflow output, artifacts, or chat.
7. After deployment, verify public responses are unchanged, crawler requests to protected paths return 404, and browser responses on protected paths include the noindex/no-store headers.

## Authentication boundary

This Worker does not guess Base44 session state. A true unauthenticated 401/403 for all operator routes remains an application-auth or Cloudflare Access decision and requires a verified allow policy so legitimate venue operators are not locked out.
