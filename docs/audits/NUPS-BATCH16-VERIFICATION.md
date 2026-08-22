# NUPS Batch 16 Verification Record

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Authority:** GlyphLock Engineering Protocol v5 / DACO directive  
**Date:** 2026-08-21  
**Starting checkpoint:** `6a88eb46edc09062de382ffc`  
**Starting commit:** `44f0eb4e6bf735538404419c65cc01f269c3dc33`

## Scorecard

| Metric | Result |
|---|---:|
| Original direct-write baseline | 287 |
| Batch 16 start | 167 |
| Batch 16 end | **161** |
| Removed in Batch 16 | **6** |
| Total removed | **126** |
| New bypasses | **0** |
| Live high-risk NUPS bypasses | **0** |
| Live-medium NUPS bypasses | **0** |

## Final operational writes

### DailyChecklistConfig

`DailyChecklistEditor` now routes create and update through `writeEntity()`.

The save path requires:

- active venue;
- authenticated actor;
- explicit create/update intent;
- existing-record venue consistency;
- visible gateway rejection rather than direct-write fallback.

Checklist item identity, order, required flags, active state, editor identity and timestamps remain intact.

### Entertainer playlists

Playlist persistence now uses the authenticated `manageEntertainerPlaylist` backend.

The backend validates:

- live Base44 authentication;
- NUPS role (`DJ`, venue manager/owner, platform admin or sovereign);
- active authorized venue;
- entertainer membership in that venue;
- one active playlist per entertainer;
- bounded and normalized track data.

Existing active playlists without a venue field remain migration-compatible. They can be loaded for the validated entertainer and acquire venue scope on the next governed save rather than being abandoned.

### DJ diagnostic

The former create/delete Playlist permission probe was removed. The diagnostic now invokes the non-mutating `capability` action on `manageEntertainerPlaylist`.

## VenueTerminal governance

### Backend

`manageVenueTerminal` implements:

- list;
- provision;
- update;
- activate;
- deactivate;
- revoke;
- binding inspection.

The backend resolves the authenticated NUPS identity, validates the target venue, denies cross-venue administration for non-global roles and preserves revoked terminal records rather than hard deleting them.

Security events include:

- `TERMINAL_PROVISIONED`;
- `TERMINAL_UPDATED`;
- `TERMINAL_TRUST_CHANGED`;
- `TERMINAL_ACTIVATED`;
- `TERMINAL_DEACTIVATED`;
- `TERMINAL_REVOKED`;
- `UNKNOWN_TERMINAL_BLOCKED`.

### UI

`VenueTerminalManager` is mounted in Venue Admin Settings.

It supports:

- displaying the current browser's stable registration candidate;
- manually entering a known physical device ID;
- selecting terminal type and station;
- recording notes;
- explicit trust approval;
- editing terminal configuration;
- activate, deactivate and revoke actions.

The browser-generated ID is untrusted by default. Local generation does not grant server trust.

### Provisioning state

No fake production terminal record was created. Real door, clock, DJ, manager, scanner, VIP and kiosk IDs remain to be physically identified and approved through the new control.

The temporary `VenuePaymentConfig.terminal_id` compatibility fallback remains because no deployed terminal has yet been proven migrated to `VenueTerminal`.

## Runtime boundary evidence

Permanent runtime check:

```text
npm run check:nups-batch16-runtime-boundaries
```

Verified against deployed functions:

| Scenario | Result |
|---|---|
| Anonymous `manageVenueTerminal` | PASS — HTTP 401 |
| Anonymous `manageEntertainerPlaylist` | PASS — HTTP 401 |
| Unknown pre-auth terminal public-mode request | PASS — HTTP 409 |
| Unknown-terminal response exposes venue | PASS — no venue disclosed |
| Unknown-terminal response exposes payment provider | PASS — no payment configuration disclosed |
| Unknown-terminal security event implementation | PASS — `UNKNOWN_TERMINAL_BLOCKED` |

Batch 15's deployed protected-evidence check remains green:

```text
anonymous getProtectedEvidence → HTTP 401
```

### Authenticated runtime limitations

The available execution boundary did not expose distinct deployed authenticated sessions for:

- authorized manager retrieval;
- bartender or DJ wrong-role retrieval;
- door-role tax/biometric denial;
- Venue A actor against Venue B evidence;
- authorized signed URL before and after expiry;
- physical trusted terminal recognition.

Those scenarios remain `NOT VERIFIED`, not inferred from policy tests.

## Browser workflow

The available Base44 execution tools did not provide an interactive browser session or screenshot automation for the NUPS preview. The full DEMO/SANDBOX click-through was therefore not executed.

Coverage available in this run:

- operational UI audit: green, zero errors and zero warnings;
- route/component compilation: green;
- typecheck: green;
- production build: green;
- backend endpoint startup and anonymous boundary probes: green.

No REAL transaction, payment, GlyphBucks liability, customer contract or protected identity record was created for testing.

## Permanent Batch 16 checks

- `check:nups-final-operational-writes`
- `check:nups-terminal-governance`
- `check:nups-batch16-runtime-boundaries`
- `check:nups-protected-evidence`
- `check:nups-api-key-secrets`
- `check:nups-guest-identity`
- `check:nups-live-venue-boundaries`
- `check:nups-sensitive-reads`
- `check:nups-anonymous-protected-evidence`
- `check:nups-write-gateway`
- `check:nups-frozen-rules`
- `check:nups-isolation`
- `audit:nups-ui`
- `check:secrets`
- `check:integrations`
- `lint`
- `typecheck`
- `build`

Aggregate command:

```text
npm run check:nups-batch16
```

Final aggregate result:

```text
GREEN PASS
```

## Issue state

- `NUPS-0002`: OPEN — controlled migration now `161/287`; zero live high/medium NUPS business bypasses.
- `NUPS-0009`: OPEN — authenticated multi-identity and signed-expiry proof remains.
- `NUPS-0011`: OPEN — private boundary and anonymous runtime denial are green; authenticated E2E remains.
- `NUPS-0013`: OPEN — provisioning control is implemented; real physical terminal approval remains.

## Frozen invariants

| Invariant | Result |
|---|---|
| `total_sales = cash_sales + card_sales` | Preserved |
| GlyphBucks remains liability | Preserved |
| Entertainers remain independent contractors | Preserved |
| Entertainers excluded from employee tip pools | Preserved |
| REAL / DEMO / SANDBOX isolation | PASS |
| Dynamic venue isolation | PASS |
| Governed write/audit architecture | Improved to 161/287 |
| Identity privacy | Preserved; authenticated E2E remains open |
| Accounting balance semantics | Untouched |
| API credential secrecy | PASS |
| Trusted terminal boundary | Implemented and fail-closed; real devices pending |

## Status

`PARTIAL`

All implementation, static checks, deployed anonymous/runtime boundary probes, repository audits, lint, typecheck and production build are green. Completion remains partial only because distinct authenticated runtime identities, signed-URL expiry and real physical terminal IDs are external to the available execution boundary.

No production publish was triggered.
