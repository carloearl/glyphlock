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

1. Run the repository's Cloudflare preflight workflow from `cloudflare/edge-guard`.
2. Confirm the stored API token can read the active `glyphlock.io` zone, DNS proxy state, Worker scripts/routes, Page Rules, rulesets, and cache settings.
3. Stop if an existing apex Worker route or script collision is present.
4. Merge the reviewed deployment workflow only after preflight passes.
5. Deploy with GitHub Actions using encrypted repository secrets. Never put the API token in source, workflow output, artifacts, or chat.
6. Verify public responses are unchanged, crawler requests to protected paths return 404, and browser responses on protected paths include the noindex/no-store headers.

## Authentication boundary

This Worker does not guess Base44 session state. A true unauthenticated 401/403 for all operator routes remains an application-auth or Cloudflare Access decision and requires a verified allow policy so legitimate venue operators are not locked out.
