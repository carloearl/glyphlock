# NUPS Batch 17 Post-Run Record

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Repository:** `carloearl/glyphlock`  
**Branch:** `main`  
**Authority:** DACO / GlyphLock Engineering Protocol v5  
**Execution date:** 2026-08-23

The exact ending commit and Base44 checkpoint are reported by the final checkpoint metadata after this document is committed. GitHub Actions is verified against that exact post-run commit as an external post-commit gate.

## Baseline

| Metric | Result |
|---|---:|
| Original direct-write baseline | 287 |
| Batch 17 starting count | 161 |
| Batch 17 ending count | **161** |
| Removed in Batch 17 | **0** |
| New bypasses introduced | **0** |
| Live high-risk NUPS bypasses | **0** |
| Live-medium NUPS bypasses | **0** |

Batch 17 is an acceptance and release-gate run. It did not delete audit, domain-event, telemetry, demo, seed, legacy, or internal persistence merely to make the counter smaller.

## Non-interactive engineering result

```text
npm run check:nups-batch17
→ GREEN PASS
```

The aggregate completed:

- 21 Base44-managed checks;
- write-gateway enforcement;
- REAL/DEMO/SANDBOX isolation;
- protected-evidence policy and anonymous runtime denial;
- API-key secret lifecycle;
- canonical guest identity projection;
- venue and terminal boundaries;
- NKS1 and duplicate-playlist HTTP 410 tombstones;
- final operational-write governance;
- integration-maturity governance;
- current documentation checks;
- secret-safe authenticated acceptance runner checks;
- DJ reducer and continuity controls;
- SEO canonical-source guard;
- public runtime boundary checks;
- operational UI audit with zero errors and zero warnings;
- tracked-secret scan;
- integration-boundary scan;
- lint;
- typecheck;
- production build.

## Authenticated test identity matrix

Batch 17 registered five disposable plus-address Base44 users and created matching DEMO/SANDBOX NUPS role bindings:

```text
Venue A manager       → VENUE_MANAGER / Dream Palace
Venue A door operator → DOORMAN / Dream Palace
Venue A ordinary staff→ BARTENDER / Dream Palace
Venue B manager       → VENUE_MANAGER / B17_SANDBOX_VENUE
Global administrator  → PLATFORM_ADMIN
```

No real employee or customer identity was repurposed. No live role or venue assignment was changed.

Base44 required completion of the emailed one-time verification code before password login. The available automation safety boundary did not permit submitting one-time verification codes. Therefore:

- no bearer session was created;
- no authenticated allow or denial was inferred;
- all five synthetic NUPS identities were suspended;
- their DEMO/SANDBOX window was closed;
- temporary credentials were removed from the sandbox;
- `B17_SANDBOX_VENUE` was made inactive;
- its SANDBOX `VenueRateConfig` was disabled.

The exact evidence is recorded in `docs/audits/NUPS-BATCH17-TEST-IDENTITY-MATRIX.md`.

## Protected-evidence acceptance

### Proven

- synthetic private upload works through the canonical Base44 private-file path;
- `ProtectedEvidence` stores opaque canonical references;
- ordinary clients do not receive permanent `file_uri` values;
- anonymous `getProtectedEvidence` is denied with HTTP 401;
- anonymous possession of a generated signed URL does not grant access;
- role/classification/venue policy is executable and fail-closed;
- archive and list surfaces do not render raw protected references;
- audit schemas and guards forbid file URIs, signed URLs, raw documents, tax identifiers, biometrics, PINs, and API secrets.

### Not verified

The following require five real authenticated sessions:

- same-venue manager allow;
- door identity allow;
- door tax denial;
- door biometric denial;
- ordinary-staff identity and contract denial;
- wrong-venue manager denial;
- global-role cross-venue behavior;
- authenticated signed-URL success before expiry;
- authenticated rejection of the exact same URL after expiry;
- corresponding deployed access and denial audit reconciliation.

`NUPS-0009` and `NUPS-0011` remain open.

## Terminal commissioning

The software terminal-trust control is complete:

```text
exact browser/device ID
→ active + trusted VenueTerminal
→ active venue
→ NKS2 PIN/session boundary
```

Unknown, inactive, untrusted, and revoked devices remain fail-closed. `VenuePaymentConfig` does not grant device trust.

No real venue hardware was falsely commissioned from the cloud sandbox. The only synthetic terminal remains revoked and untrusted. Physical commissioning remains an installation task on the actual front-door, clock, DJ, manager, scanner, VIP, kiosk, and payment-terminal browsers that will be used.

## Browser evidence

Playwright browser smoke evidence passes for:

- the public GlyphLock route with zero application errors and zero failed HTTP requests;
- the unknown-device NUPS kiosk experience;
- visible `Device Approval Required` guidance;
- exact synthetic device ID display;
- Copy Device ID and Check Approval controls;
- no PIN submit control before terminal approval;
- HTTP 409 fail-closed terminal response;
- zero unexpected anonymous 401/403 requests.

The authenticated end-to-end venue journey was not executed because the disposable accounts could not complete the required human email-verification step through the automated boundary.

Evidence: `docs/audits/NUPS-BATCH17-BROWSER-SMOKE.md`.

## DJ continuity

Automated results:

```text
npm run test:dj
→ 10/10 PASS

npm run check:nups-dj-continuity
→ PASS
```

The tests prove persistent session identity across accelerated view changes, resident deck preservation, transport-state continuity, venue/operator/device/mode cache isolation, truthful provider capability classification, playlist matching behavior, and YouTube retry/deduplication rules.

A real playback-provider/browser soak lasting at least 30 continuous minutes was not executed. Automated reducer tests are not labeled as a real provider soak.

## Integration maturity

Seven governed `IntegrationMaturity` records exist for:

- Base44 backend functions;
- Base44 private file storage;
- Google Drive OAuth;
- Google Analytics OAuth;
- Notion OAuth;
- GitHub source synchronization;
- VenueTerminal trust boundary.

Each record uses the canonical evidence ladder and retains known limitations. No integration was promoted merely because a credential, setting, logo, or code path exists.

## Financial and operational invariants

The static and build suite confirms no regression to:

```text
total_sales = cash_sales + card_sales
GlyphBucks = stored-value liability, not revenue
driver payout = disbursement, not negative sales
entertainer = independent contractor
DEBITS = CREDITS
REAL / DEMO / SANDBOX remain isolated
```

A full authenticated DEMO/SANDBOX venue register, VIP, batch-close, and Z-report browser journey remains unverified.

## Security acceptance table

| Test | Result |
|---|---|
| Current Batch 16 baseline remains green | PASS |
| Batch 17 non-interactive aggregate | PASS |
| Distinct disposable Base44 accounts registered | PASS |
| Matching isolated NUPS roles prepared | PASS |
| Human email verification completed | BLOCKED |
| Five authenticated sessions available | BLOCKED |
| Synthetic private upload | PASS |
| Authorized same-venue manager retrieval | NOT VERIFIED |
| Authorized door identity retrieval | NOT VERIFIED |
| Door tax denial | NOT VERIFIED |
| Door biometric denial | NOT VERIFIED |
| Bartender/DJ denial | NOT VERIFIED |
| Wrong-venue manager denial | NOT VERIFIED |
| Global-role cross-venue behavior | NOT VERIFIED |
| Anonymous protected retrieval denied | PASS |
| Signed URL works before expiry while authenticated | NOT VERIFIED |
| Signed URL denied after expiry while authenticated | NOT VERIFIED |
| Access and denial audit reconciliation | NOT VERIFIED |
| Audit/reference leakage guards | PASS |
| Raw protected reference absent from UI | PASS |
| Terminal trust software boundary | PASS |
| Unknown terminal denied | PASS |
| Inactive terminal denied | PASS |
| Untrusted terminal denied | PASS |
| Revoked terminal denied | PASS |
| Real device commissioned | NOT VERIFIED |
| NKS1 HTTP 410 | PASS |
| Duplicate playlist endpoint HTTP 410 | PASS |
| Public/browser kiosk smoke | PASS |
| Full authenticated DEMO/SANDBOX journey | NOT VERIFIED |
| Automated DJ continuity | PASS |
| Real 30-minute DJ provider soak | NOT VERIFIED |
| Production publish avoided | PASS |

## Cleanup

- five synthetic NUPS identities: suspended;
- synthetic test access: expired;
- synthetic Venue B: inactive;
- synthetic Venue B rate configuration: inactive;
- temporary credential file: removed;
- synthetic Batch 16 terminal: revoked and untrusted;
- security and audit evidence: retained;
- production publish: not triggered.

## Completion directive

The exact remaining acceptance procedure is saved at:

```text
docs/runbooks/NUPS-BATCH17-FINAL-COMPLETION-DIRECTIVE.md
```

It requires human-verified disposable sessions, the authenticated five-role evidence harness, real device commissioning, full DEMO/SANDBOX browser acceptance, a real 30-minute DJ soak, final static checks, and GitHub CI on the ending commit.

## Status and release verdict

**Batch status:** `IMPLEMENTED / UNVERIFIED`  
**Release verdict:** `NO-GO`

The engineering and non-interactive verification are green. Production release remains blocked on authenticated protected-evidence proof, physical device commissioning, the full authenticated browser journey, and the real provider DJ soak.

No production publish occurred.
