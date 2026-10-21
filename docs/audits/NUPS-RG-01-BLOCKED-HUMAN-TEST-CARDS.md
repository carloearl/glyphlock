# NUPS-RG-01 Blocked Human and Hardware Test Cards

These tests were not marked passed from source. Each requires a real authenticated identity, email OTP, browser viewport, provider, or physical device.

| Card | Test | Procedure | Acceptance | Required control | Requirements |
| --- | --- | --- | --- | --- | --- |
| HT-01 | Published public viewport acceptance | Open `/`, `/NUPSLanding`, `/NUPSKiosk` at 390×844, 800×1280, 1280×800, 1440×900. | No horizontal overflow, clipped controls, duplicate overlays, or inaccessible actions. Record screenshots and console/network errors. | Browser/computer-use with exact viewport support. | P02-R02, P06-R02, P12-R01 |
| HT-02 | Live access request to owner decision | New verified applicant opens live request, signs in by OTP, submits, owner sees it on mobile, approves/rejects, applicant status updates. | Exactly one request in correct venue/mode; no self-approval; owner notification and approval center agree. | Applicant email OTP and authorized owner session. | P12-R02, P13-R01 |
| HT-03 | Full role-route matrix | Run one session for every listed role and mode from entry to role home. | Correct destination, navigation, venue/mode scope; no cross-role controls; no stranded role. | Multiple authorized accounts/PINs. | P12-R03, P13-R04 |
| HT-04 | Staff and entertainer onboarding persistence | Submit each onboarding path, reload, search, reopen, and verify linked records. | Application, profile, employee/contractor identity and venue linkage persist exactly once. | Manager/owner account; safe test identities. | P13-R02 |
| HT-05 | PIN and terminal lifecycle | Approve physical device, issue temporary PIN, require first-use change, clock in/out, lock keypad, manager unlock, revoke session. | All server-side controls enforce correctly; PIN never appears in storage/logs. | Physical phone/tablet and manager PIN. | P13-R03 |
| HT-06 | Front door ID capture and fallback | Test bright/low light, torch where available, no-flash device, scanner failure and manual license entry; upload ID image. | Readable capture or clear fallback; file upload path used; no oversized data URL; expiration behavior matches policy. | Physical camera/tablet/scanner and safe test ID. | P16-R01 |
| HT-07 | Guest reuse and VIP linkage | Create guest, start a second contract, autofill guest, link entertainer/hostess/manager. | One canonical guest profile; no duplicate identity; contract links survive reload. | Manager/hostess sessions. | P16-R01 |
| HT-08 | VIP three-party contract | Hostess starts, client reviews total/terms and signs, manager verifies and finalizes. | One scrollable contract, one client signature, explicit checkboxes, immutable final record, receipt/QR linkage. | Hostess, client and manager handoff. | P16-R01 |
| HT-09 | POS cash/card and receipt chain | Open batch, sell by cash and external card confirmation, print receipt, rescan barcode/QR, test void/refund authority. | Cash/card totals follow frozen rule; receipt links transaction, contract and verification; unauthorized actions denied. | Register terminal, printer/scanner and processor test mode. | P15-R01, P15-R03, P17-R01 |
| HT-10 | GlyphBucks full lifecycle | Issue/sell, print sheet, scan, redeem, attempt duplicate redemption, reconcile liability. | Stored-value liability never enters sales; inventory and redemption are atomic and auditable. | Printer/scanner and manager session. | P14-R01, P14-R03 |
| HT-11 | Close night and accounting | Close batch, generate Z report/settlement, review trial balance, reconciliation and journal correction. | Debits=credits; total_sales=cash+card; driver payouts separate; GlyphBucks liability rolls forward. | Manager and admin sessions with safe test night. | P16-R02, P16-R03, P16-R04 |
| HT-12 | Payment provider acceptance | Run provider test checkout, webhook, return, reconciliation, refund and replay/idempotency cases. | Provider signature and idempotency pass; records reconcile; no live funds used. | Configured provider test account/webhook. | P17-R01, P17-R04 |
| HT-13 | DJ continuity soak | Run both decks, queue, provider discovery, AI playlist, auto-cue, view/tab changes and 30-minute playback. | No audio reset, silent gap, duplicate audio owner, lost queue or unauthorized 403 for valid DJ/admin. | Real browser, audio output and provider account. | P09-R02, P17-R04 |
| HT-14 | Protected evidence five-session packet | Complete same-venue manager allow, door allow/deny cases, ordinary staff deny, wrong-venue manager deny, signed URL expiry and audit reconciliation. | Every access result and audit event matches policy; no private URI exposed. | Five authenticated sessions and OTPs. | P07-R02, P16-R03 |
| HT-15 | Physical terminal commissioning | Commission each production browser/device with its exact VenueTerminal ID and retest after revoke/replace. | Only trusted active device operates pre-auth kiosk; revoked device fails closed. | Each physical production device. | P12-R03, P13-R03 |

## Execution Rules

- Use DEMO/SANDBOX and disposable test identities unless REAL behavior is the specific acceptance target.
- Do not upload real customer identity documents or use live funds.
- Capture route, role, venue, mode, viewport, screenshot, network/console error and resulting record ID.
- Stop on cross-role, cross-venue or cross-mode leakage.
- Never expose PINs, private file URIs, full IDs, card data, bearer tokens or OTPs in evidence.
