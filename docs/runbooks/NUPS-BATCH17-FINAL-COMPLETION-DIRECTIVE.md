# NUPS Batch 17 Final Completion Directive

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Repository:** `carloearl/glyphlock`  
**Authority:** DACO / GlyphLock Engineering Protocol v5

Use this directive only after the five disposable Base44 test accounts have completed their emailed verification codes and the intended physical venue devices are available.

## Objective

Complete the remaining human-authenticated and physical acceptance evidence for Batch 17. Do not redesign the application, lower guards, create REAL financial activity, or publish production.

## Preferred workaround: browser-session console

The preferred path avoids exporting bearer tokens. After each disposable account completes Base44 email verification, open `/NUPSBatch17Acceptance` in five separate browser profiles, sign each profile in normally, and run only the role-specific case assigned to that authenticated session. The backend derives the expected role/venue/classification decision, reconciles the matching security audit, waits through the real signed-link lifetime for the expiry case, and stores only sanitized append-only evidence.

Do not copy passwords, OTPs, bearer tokens, signed URLs, private file URIs or protected content into chat, shell history, screenshots, committed files or browser storage. The token-driven CLI harness remains a secondary controlled option when an approved ephemeral secret manager can supply the five sessions without exposing them.

## Required starting state

1. `npm run check:nups-batch17` passes.
2. Direct-write count remains `120 / 287`, with zero live high-risk, zero live-medium NUPS, and zero classified live GlyphLock business bypasses.
3. NKS1 and the duplicate playlist endpoint return HTTP 410.
4. The five Batch 17 test identities are disposable DEMO/SANDBOX accounts, not real employees or customers.
5. `B17_SANDBOX_VENUE` is used only as isolated Venue B test context.
6. No synthetic terminal is active or trusted before the physical-device stage.

## Step 1 — Human-verify the disposable Base44 accounts

Complete Base44 email verification for exactly five distinct test accounts:

```text
Venue A manager       → VENUE_MANAGER
Venue A door operator → DOORMAN or DOOR_GIRL
Venue A ordinary staff→ BARTENDER or DJ
Venue B manager       → VENUE_MANAGER on B17_SANDBOX_VENUE
Global administrator  → PLATFORM_ADMIN or SOVEREIGN
```

After verification:

- reactivate only the five matching Batch 17 `NUPSUser` records;
- reactivate `B17_SANDBOX_VENUE` and its SANDBOX `VenueRateConfig` only for the test window;
- confirm every test identity is marked DEMO/SANDBOX and expires promptly;
- never disclose passwords, OTPs, bearer tokens, PINs, or signed URLs in chat, logs, screenshots, committed files, shell history, or `.env` files.

## Step 2 — Run the authenticated protected-evidence harness

The final run requires five distinct Base44 sessions, one for each test identity and role boundary.

Load five distinct Base44 sessions as authenticated session tokens through an approved secret manager or ephemeral local process environment. Do not paste them into the agent conversation.

Required runtime variables:

```text
B17_MANAGER_A_TOKEN
B17_DOOR_A_TOKEN
B17_STAFF_A_TOKEN
B17_MANAGER_B_TOKEN
B17_GLOBAL_TOKEN
B17_VENUE_A_ID=dream_palace
B17_VENUE_B_ID=B17_SANDBOX_VENUE
```

Execute:

```text
npm run test:nups-batch17-authenticated
```

The command must prove all of the following using synthetic files only:

```text
same-venue manager identity allow
same-venue manager tax allow
same-venue manager biometric allow
same-venue manager contract allow
door identity allow
door tax denial
door biometric denial
ordinary-staff identity denial
ordinary-staff contract denial
wrong-venue manager denial
global-role cross-venue behavior
signed URL succeeds before expiry
same signed URL fails after expiry
access and denial audits reconcile
no file_uri, signed URL, token, PIN, OTP, or raw evidence enters audit metadata
```

A policy-unit test is not a substitute for this five-session deployed run.

## Step 3 — Commission real venue devices

On each physical browser/device that will operate NUPS:

```text
open NUPS
→ copy the displayed device ID
→ owner/manager opens Venue Admin Settings → Terminals
→ select the correct venue
→ set device type and physical station
→ Approve This Device or Approve & Activate
→ return to the device
→ Check Approval
```

Commission the physically available stations:

```text
Front Door
Staff Clock
DJ Booth
Manager Office
ID Scanner
VIP Station
Kiosk
Payment Terminal, when applicable
```

For each real device verify:

```text
exact device ID recorded
correct venue
correct terminal type
physical station identified
status = active
trusted = true
getPublicMode succeeds
staff PIN entry becomes available
NKS2 session uses the same venue
StaffShift uses the same venue
heartbeat succeeds
clock-out invalidates the session
```

Use a disposable test device for inactive, untrusted, revoked, unknown, and wrong-venue denial tests. Do not revoke hardware needed for live operations.

## Step 4 — Run the authenticated DEMO/SANDBOX browser journey

Using synthetic records prefixed `B17-` or `BATCH17-`, execute through the actual UI:

```text
owner/admin login
→ select venue
→ select DEMO or SANDBOX
→ verify approved terminal
→ staff clock-in
→ synthetic ID scan
→ GuestProfile create or match
→ linked VIPGuest projection
→ entertainer credential workflow
→ Daily Checklist save and refresh
→ entertainer playlist save, refresh, and reload
→ safe non-live POS transaction
→ VIP workflow
→ synthetic protected-evidence capture
→ non-live contract workflow where safe
→ VIP room/session open and close
→ non-live batch close
→ non-live Z-report
```

Confirm after refresh:

```text
venue persists
mode persists
terminal binding persists
Daily Checklist persists
playlist order persists
GuestProfile/VIPGuest relationship persists
VIP room/session state persists
batch state persists
Z-report persists
```

Verify:

```text
total_sales = cash_sales + card_sales
GlyphBucks remains outside revenue
driver payout remains a disbursement
entertainers remain outside employee payroll and tip pools
no B17 record appears in REAL or under the wrong venue
```

Do not perform a live card charge, mint REAL GlyphBucks, scan a real ID, upload a real tax form or biometric, or sign a real customer contract.

## Step 5 — Run the real DJ continuity soak

Run the actual DJ workspace for at least 30 continuous minutes with lawful test content and an available playback provider.

Exercise:

```text
Deck A playback
Visualizer navigation
mixer return
playlist save/reload
internal tab changes
Deck B load
crossfade
cue/pause/resume
automation view
mixer return
repeated navigation
```

Record:

```text
start time
end time
duration
provider
tracks used
view changes
unexpected stops
state resets
duplicate audio
runtime errors
result
```

The automated reducer tests remain required, but do not replace this real provider/browser soak.

## Step 6 — Final verification

Run:

```text
npm run check:nups-batch16
npm run check:nups-batch17
npm run check:nups-write-gateway
npm run check:nups-frozen-rules
npm run check:nups-isolation
npm run check:nups-protected-evidence
npm run check:nups-api-key-secrets
npm run check:nups-guest-identity
npm run check:nups-live-venue-boundaries
npm run check:nups-sensitive-reads
npm run check:nups-terminal-governance
npm run test:dj
npm run check:nups-dj-continuity
npm run audit:nups-ui
npm run check:secrets
npm run check:integrations
npm run lint
npm run typecheck
npm run build
```

Then verify the ending commit exists on GitHub `main` and the `NUPS CI` workflow passes for that exact commit.

## Step 7 — Cleanup

After evidence is captured:

- suspend the five disposable NUPS test identities;
- expire their DEMO/SANDBOX access;
- disable the synthetic Venue B configuration unless retained for a documented recurring test suite;
- revoke temporary sessions and temporary PINs;
- remove synthetic business records through governed cleanup paths;
- retain security/audit evidence;
- leave no synthetic terminal active or trusted;
- retain real terminal records only for devices actually commissioned for venue use.

## Completion standard

Use `COMPLETE` and release verdict `GO` only when:

```text
authenticated five-session protected-evidence harness PASS
signed URL before/after-expiry proof PASS
real required terminals commissioned and recognized
full DEMO/SANDBOX browser journey PASS
30-minute real DJ soak PASS
all static checks PASS
GitHub NUPS CI PASS on the ending commit
no P0/P1 defect remains
rollback checkpoint created
```

If any item is absent, report the exact result as `NOT VERIFIED`, `BLOCKED`, or `FAIL`. Do not convert engineering confidence into acceptance evidence.

## Production boundary

Do not publish production. Production release requires a separate explicit DACO owner directive after the final Batch 17 acceptance report returns `GO`.
