# Public search and audit engine integration

## Implemented

The shared glyphbotWebSearch backend now supports SearXNG's documented HTTP JSON API. When SEARXNG_BASE_URL is configured, it requests /search?q=...&format=json with an eight-second timeout and redirects disabled, maps source URLs/snippets/engine names, and preserves existing provider fallbacks on empty/unavailable responses. Configuration is server-side only. Local/private literal endpoints and embedded URL credentials are rejected. DNS is administrator-controlled; this is not a general-purpose user-supplied fetch endpoint.

Public GitHub repository discovery runs alongside the existing public sources and returns repository URLs, descriptions, language and license metadata when supplied. No provider is described as exhaustive. Search results expose SearXNG status as not_configured, invalid_configuration, unavailable, empty or measured. GlyphBot forwards these statuses and source counts to its brain and return metadata. Sensitive query/key values are not written in provider-fetch error logs.

GlyphBot now follows the same permitted-public-research-first approach as Agent Brain, treats external results as untrusted evidence and distinguishes uncertain identity matches. Private contact enrichment, identity dossiers, sensitive attributes, harmful tracking and private-database access are not added.

runSiteAudit already consumes Lighthouse results through PageSpeed. It now supports a dedicated PAGESPEED_API_KEY, prioritizes up to10 exact source_paths within the existing30-file/180KB budget and reports actual sampled coverage, failed reads and requested paths not scanned. Findings still require pinned source or real measurement evidence. Zero findings and missing measurements never imply a healthy/secure site.

## Repository research and provenance

- SearXNG: https://github.com/searxng/searxng — AGPL-3.0. Documented API: https://github.com/searxng/searxng/blob/master/docs/dev/search_api.rst . The integration uses its HTTP API; no upstream source was vendored.
- Lighthouse: https://github.com/GoogleChrome/lighthouse — Apache-2.0. README and license inspected. Existing PageSpeed measurement integration is retained; a Chromium/Lighthouse service was not installed in Base44's Deno functions.
- GitHub repository search was exercised against the live public API and returned searxng/searxng with AGPL-3.0 metadata. Search results are discovery evidence, not permission to redistribute arbitrary repository code.

No proprietary BeenVerified code, private records, subscription credentials or access controls were copied or bypassed. No claim of matching a commercial data broker's coverage is made.

## Activation

At implementation time neither SEARXNG_BASE_URL nor PAGESPEED_API_KEY was present in the app's secret-name inventory. Existing providers remain usable. The SearXNG connector is implemented but not active until a public HTTPS instance is provisioned and configured with JSON output enabled; many shared instances disable JSON. Configure SEARXNG_BASE_URL to that administrator-controlled origin, optionally including its mounted path. Do not use arbitrary public instances as production dependencies. Follow upstream installation instructions at https://docs.searxng.org/admin/installation.html and its license when hosting or modifying it.

Configure PAGESPEED_API_KEY with a project key authorized for the PageSpeed Insights API and suitable quota. A key alone does not guarantee quota or measurement availability. Do not place secret values in code, prompts, browser storage or logs. Signed-in real-provider searches and live PageSpeed quota still require an operational smoke test after setup.

## Validation and release

Thirteen search tests cover previous behavior plus SearXNG success/fallback/missing configuration/private literal endpoint rejection and public repository evidence. Four audit tests cover dedicated key use, targeted path priority, sampled coverage and real Lighthouse scores. All35 pre-existing configured checks plus the new audit check are retained. Independent review and required GitHub CI gate merge. Known configuration gaps above must remain visible in release notes. No business-data/schema migration, role grants, workflow changes, accounting changes or REAL/DEMO boundary changes. Separate Batch17 operational NO-GO boundaries remain unchanged. Roll back by reverting this PR to base dddfec1c603447fe682010fabc9f0772e0818f2d.