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

The former create/delete Playlist permission probe was removed. The diagnostic now invokes the non-mutating `probePlaylistPermission` action on the canonical `nupsDJGateway`. The unused duplicate `manageEntertainerPlaylist` writer was replaced in source by an explicit HTTP 410 tombstone so playlist authorization cannot drift across two backends. During preview-resource synchronization the previously deployed copy still denies anonymous access with HTTP 401 and has no supported caller; the runtime guard accepts only that closed state or the final HTTP 410 tombstone.

## VenueTerminal governance

### Backend

`manageVenueTerminal` implements:

- list;
- pending registration (`provision`);
- explicit approval (`approve`);
- update;
- activate;
- deactivate;
- revoke;
- binding inspection.

The backend resolves the authenticated NUPS identity, validates the target venue, denies cross-venue administration for non-global roles and preserves revoked terminal records rather than hard deleting them.

Security events include:

- `TERMINAL_PROVISIONED`;
- `TERMINAL_APPROVED`;
- `TERMINAL_UPDATED`;
- `TERMINAL_TRUST_CHANGED`;
- `TERMINAL_ACTIVATED`;
- `TERMINAL_DEACTIVATED`;
- `TERMINAL_REVOKED`;
- `UNKNOWN_TERMINAL_BLOCKED`.

### UI

One `TerminalManagementEditor` is mounted in the dedicated **Venue Admin Settings → Terminals** tab. The duplicate terminal panel was removed.

It supports:

- displaying the current browser’s stable device ID and current server state;
- copying that non-secret ID from a blocked kiosk;
- manually entering a different physical device ID;
- selecting terminal type and physical station;
- recording approval notes;
- **Register Pending** without granting staff-login access;
- **Approve This Device** for the browser currently in use;
- **Approve & Activate** for a different copied device ID;
- editing details, deactivation and permanent revocation;
- re-checking approval from the kiosk without refreshing.

Approval means the server has an exact device/venue record with `status = active` and `trusted = true`. Local ID generation, possession of the ID, or knowledge of a staff PIN grants no trust.

### Provisioning state

No fake production terminal record was created. Real door, clock, DJ, manager, scanner, VIP and kiosk IDs remain to be physically identified and commissioned once.

`VenuePaymentConfig.terminal_id` no longer confers device trust. `VenueTerminal` is the sole accepted pre-authentication device-to-venue boundary. The kiosk now explains an unapproved device before PIN entry, and the legacy TimeClock submits the same canonical device ID.

The exact physical device ID exists in that browser’s local storage, so commissioning must occur on the device or by copying its displayed ID to an authorized manager. This is an installation step, not missing Batch 16 application logic. The exact procedure is recorded in `docs/runbooks/NUPS-TERMINAL-APPROVAL.md`.

## Runtime boundary evidence

Permanent runtime check:

```text
npm run check:nups-batch16-runtime-boundaries
```

Verified against deployed functions:

| Scenario | Result |
|---|---|
| Anonymous `manageVenueTerminal` | PASS — HTTP 401 |
| Unused `manageEntertainerPlaylist` preview resource | PASS — anonymous HTTP 401 while committed 410 tombstone synchronizes; no supported caller |
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
- authorized physical-terminal recognition after the real device is commissioned.

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
- `NUPS-0013`: CONTROL COMPLETE — software approval boundary is complete; one-time real-device commissioning remains.
- `NUPS-0014`: RESOLVED — deployed NKS1 endpoint returns HTTP 410 with `NKS1_ENDPOINT_RETIRED`.

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
| Trusted terminal boundary | COMPLETE and fail-closed; physical devices require one-time commissioning |

## Status

`BATCH 16 ENGINEERING COMPLETE — OPERATIONAL ACCEPTANCE ITEMS RECORDED`

All scoped implementation, static controls, deployed anonymous/runtime boundaries, repository audits, lint, typecheck and production build are green. The terminal trust design, explicit approval flow, NKS2 cutover, NKS1 retirement, final operational-write migration and CI controls are complete.

The following are installation or separate acceptance evidence rather than unfinished Batch 16 code:

- commissioning each real venue device using the exact ID generated in that browser;
- executing the full browser click-through on installed venue hardware;
- exercising protected-evidence retrieval with distinct authenticated role accounts and waiting through signed-URL expiry.

No production publish was triggered.
