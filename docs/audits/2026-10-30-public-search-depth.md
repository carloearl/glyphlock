# Public search depth restoration

Scope: GlyphLock app 697a087fb354faebb72df54b. Base: f7fdbb28c45e86e1ec1e9fd613df4972f644f03e. Task: fix/public-search-depth.

Changes: empty SerpAPI responses now fall through to Google/DuckDuckGo; deep queries include GitHub, ORCID, Google Patents, OpenCorporates, Arizona Corporation Commission and Arizona Courts; Live uses the existing deep search path; subqueries run four at a time; synthesis receives retrieved source evidence and does not masquerade as an independent source. Direct, detailed public professional/business research remains supported with citations and uncertain identity matches labeled.

Invariant review: login authentication remains required. No role grants, RLS, venue operations, financial calculations, employee data or REAL/DEMO boundaries change. Private personal contact details, credentials and location tracking are excluded from synthesis. No BeenVerified API integration or subscription access is claimed. Existing Google/SerpAPI credentials are reused without reading or exposing values.

Validation: eight deterministic tests reproduce provider fallback, evidence grounding, separate generated prose, source expansion, successful primary-provider behavior, Live mode routing and bounded concurrency. All eight pass. Typecheck and production build pass. Lint exits zero with one existing unused directive warning in OfficialChecks.jsx. Build reports existing large chunks. npm run ci:base44 fails at check:seo-metadata with five errors: expected route count 41 but got 42; /DCE description is 158 rather than <=155; DCE ogTitle and ogDescription do not match; buyer description is outside 140-155. These files were not changed by this task.

Production impact: not deployed. Live mode will issue more external search requests and may cost more; rate limits/quotas still depend on provider configuration. External providers and signed-in browser workflow have not been smoke-tested. Public repository web research returned tool errors, so no new third-party search framework was installed. No claim of exhaustive public-web coverage is made.

Rollback: revert this PR to the base SHA above. No data/schema migration is required. Release only after required GitHub checks pass and a signed-in Live search smoke test confirms citations, identity uncertainty and provider failure behavior.
