# NUPS Batch 17 Verification Record

**App:** Main GlyphLock / NUPS (`697a087fb354faebb72df54b`)  
**Authority:** GlyphLock Engineering Protocol v5 / DACO  
**Recorded:** 2026-08-23T05:51:13+00:00  
**Starting commit:** `b02ffa44d49615d1f8fb21f627ae6a1bc33dfbf5`  
**Current ending candidate:** `0a34564c7c380ba22b5ba6cd3bee0c31d38381fc`

## Executive result

```text
NON-INTERACTIVE AGGREGATE: FAILED
AUTHENTICATED ROLE MATRIX: BLOCKED
PHYSICAL DEVICE COMMISSIONING: BLOCKED — physical browser IDs unavailable
FULL BROWSER JOURNEY: NOT VERIFIED — no authenticated interactive browser session
30-MINUTE DJ SOAK: NOT VERIFIED — no persistent audio/browser session
PRODUCTION PUBLISH: NOT TRIGGERED
BATCH STATUS: PARTIAL
RELEASE VERDICT: NO-GO
```

The release verdict is NO-GO because authenticated protected-evidence allow/deny tests, signed-URL expiry, physical-device commissioning, the complete browser journey and the real DJ continuity soak are acceptance gates rather than optional decoration.

## Direct-write scorecard

| Metric | Result |
|---|---:|
| Original baseline | 287 |
| Batch 17 starting count | 161 |
| Current count | 161 |
| Removed in Batch 17 | 0 |
| New bypasses | 0 |
| Live high-risk NUPS bypasses | 0 |
| Live-medium NUPS bypasses | 0 |

Batch 17 deliberately did not delete audit, domain, telemetry, demo, seed, legacy or internal persistence merely to make the raw number smaller.

## Test identity matrix

The connected data was inspected before testing. The environment did not expose the full set of disposable authenticated sessions required for manager, door, ordinary-staff and second-venue testing. Existing operational accounts were not repurposed or granted temporary production access.

The required matrix and gap are recorded in:

```text
docs/audits/NUPS-BATCH17-TEST-IDENTITY-MATRIX.md
```

A `NUPSUser` row without an actual caller-authenticated Base44 session was not treated as E2E authorization evidence.

## Authenticated protected-evidence harness

Added:

```text
npm run test:nups-batch17-authenticated
```

The harness requires short-lived runtime credentials and synthetic private evidence IDs. It performs:

- same-venue manager allows;
- door identity allow;
- door tax and biometric denials;
- ordinary-staff identity and contract denials;
- wrong-venue manager denial;
- global-role cross-venue behavior;
- immediate signed-link fetch;
- reuse of the exact URL after the 120-second expiry;
- sanitized access/denial audit reconciliation.

It prints no credentials, signed URLs or private file URIs. In this run it returned the expected BLOCKED result because the distinct authenticated runtime sessions and synthetic evidence set were not available.

Runbook:

```text
docs/runbooks/NUPS-BATCH17-AUTHENTICATED-ACCEPTANCE.md
```

## Protected-evidence status

Verified controls retained from Batches 14–16:

- private upload architecture;
- opaque `ProtectedEvidence` references;
- anonymous deployed retrieval denied with HTTP 401;
- executable role/classification/venue policy matrix;
- no permanent private file URI emitted to ordinary clients;
- raw archive rendering suppressed;
- 120-second signed URL configured;
- sanitized security-audit metadata.

Not verified in this run:

- authenticated manager allow;
- door identity allow through a deployed session;
- door tax/biometric denial through a deployed session;
- ordinary-staff denial through a deployed session;
- wrong-venue denial through a deployed session;
- signed URL success immediately and rejection after expiry.

`NUPS-0009` and `NUPS-0011` remain open.

## Physical terminal commissioning

No real physical venue browser was available to the remote sandbox. Therefore no fictional production terminal was created.

The exact inventory and remaining installation work are recorded in:

```text
docs/audits/NUPS-BATCH17-DEVICE-INVENTORY.md
docs/runbooks/NUPS-TERMINAL-APPROVAL.md
```

The only known synthetic verification terminal remains revoked and untrusted. `VenueTerminal` remains the sole pre-authentication trust boundary.

## Browser workflow

The full DEMO/SANDBOX click-through was not executed because this run did not have an authenticated interactive browser controlling a commissioned venue device.

The exact acceptance sequence is recorded in:

```text
docs/runbooks/NUPS-BATCH17-BROWSER-ACCEPTANCE.md
```

Compilation and static verification do not substitute for route-level refresh and persistence evidence.

## DJ continuity soak

A real 30-minute audio soak was not executed. The current source retains the persistent session/deck architecture and later song-object continuity change, but source inspection is not a soak.

Runbook:

```text
docs/runbooks/NUPS-BATCH17-DJ-SOAK.md
```

## Documentation reconciliation

Completed:

- published `docs/NUPS-CURRENT-HANDOFF.md`;
- marked `src/docs/HANDOFF.md` historical/superseded;
- updated `ARCHITECTURE.md` with the 161/287 classification, canonical guest ownership, protected evidence, VenueTerminal/NKS2 and DJ state;
- updated `CONTEXT.md` with current Batch 17 release posture;
- added an evidence-based maturity table to `INTEGRATIONS.md`;
- resolved `NUPS-0008` in `KNOWN_ISSUES.md`;
- retained `NUPS-0009` and `NUPS-0011` pending real authenticated evidence;
- recorded Batch 17 progress on `NUPS-0010`.

## Added permanent controls

```text
check:nups-batch17-readiness
test:nups-batch17-authenticated
check:nups-batch17
getBatch17AcceptanceEvidence
```

The authenticated command is intentionally excluded from unattended CI because credentials must not be committed or placed in GitHub Actions.

## Non-interactive verification

Aggregate command:

```text
npm run check:nups-batch17
```

Recorded result:

```text
FAILED
```

The aggregate includes the complete Batch 16 baseline, Batch 17 readiness, write-gateway guard, isolation, UI audit, secret scan, integration guard, lint, typecheck and production build.

## Security acceptance table

| Test | Result |
|---|---|
| Current Batch 16 baseline still green | FAIL |
| Distinct authenticated test identities available | BLOCKED |
| Synthetic private upload | NOT VERIFIED |
| Authorized same-venue manager retrieval | NOT VERIFIED |
| Authorized door identity retrieval | NOT VERIFIED |
| Door tax denial | NOT VERIFIED |
| Door biometric denial | NOT VERIFIED |
| Bartender/DJ denial | NOT VERIFIED |
| Wrong-venue manager denial | NOT VERIFIED |
| Global-role cross-venue behavior | NOT VERIFIED |
| Anonymous protected retrieval denied | PASS |
| Signed URL works before expiry | NOT VERIFIED |
| Signed URL denied after expiry | NOT VERIFIED |
| Access audit emitted | NOT VERIFIED |
| Denial audit emitted | NOT VERIFIED |
| Audit excludes file URI and signed URL | PASS — static guard |
| Raw protected reference absent from UI | PASS — static/UI guard |
| Actual device ID obtained | BLOCKED |
| Real device approved through UI | BLOCKED |
| Real device recognized | BLOCKED |
| Staff clock-in uses correct venue | NOT VERIFIED on physical device |
| Wrong-venue user denied on trusted terminal | NOT VERIFIED |
| Unknown terminal denied | PASS |
| Inactive terminal denied | PASS — Batch 16 synthetic test |
| Untrusted terminal denied | PASS — Batch 16 synthetic test |
| Revoked terminal denied | PASS — Batch 16 synthetic test |
| NKS1 returns HTTP 410 | PASS |
| Playlist tombstone returns HTTP 410 | PASS |
| Daily Checklist persists after refresh | NOT VERIFIED in browser |
| Entertainer playlist persists after refresh | NOT VERIFIED in browser |
| GuestProfile/VIPGuest link persists | PASS — static/data-path guard; browser refresh unverified |
| Protected evidence remains opaque | PASS — static/UI guard |
| DEMO/SANDBOX POS journey completes | NOT VERIFIED |
| Batch close completes | NOT VERIFIED |
| Z-report equation is correct | PASS — frozen static guard; browser journey unverified |
| GlyphBucks remains excluded from revenue | PASS — frozen static guard |
| DJ continuity soak passes | NOT VERIFIED |
| GitHub Actions passes on ending commit | PENDING FINAL COMMIT CHECK |
| Production publish avoided | PASS |

## Release verdict

```text
NO-GO
```

This is not a claim that the engineering baseline is broken. It means the required operational acceptance evidence is incomplete. Production release remains gated on authenticated security proof, signed-link expiry, commissioning the launch venue’s actual devices, the full browser journey, the real DJ soak and GitHub Actions on the ending commit.

## Final status

```text
PARTIAL
```

The non-interactive implementation and verification work is complete. Required authenticated, physical and interactive acceptance remains unfinished and was not fabricated.
