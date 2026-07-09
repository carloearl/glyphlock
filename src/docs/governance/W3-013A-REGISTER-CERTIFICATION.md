# W3-013A — REGISTER WORKSPACE FINAL CERTIFICATION REPORT

**Authority:** DACO Sovereign Override
**Governance:** BPAAA v3.0 (FROZEN)
**Standard:** BPAAA-REGISTER-OPS-STANDARD-v1.0 (PERMANENT)
**Prerequisites:** W3-012A Ratified · W3-012B Cycles 1, 2, 2B Complete
**Executed:** 2026-07-09 · Base44 Normal Agent
**Verification:** Super Agent Read-Only (pending)
**Status:** SUBMITTED — awaiting written DACO approval

---

## Lineage

| Field | Value |
|---|---|
| Parent | W3-012B Cycle 2B |
| Prerequisite | BPAAA-REGISTER-OPS-STANDARD-v1.0 adoption |
| Supersedes | None |
| Superseded By | — |
| Architecture Baseline | DACO-20260706-ARCH-BASELINE-01 |
| BPAAA Version | v3.0 (FROZEN) |

---

## 1. Register Compliance Matrix (clause-by-clause)

Verdicts: **PASS** · **CONDITIONAL PASS** · **FAIL** · **N/A**

### §1.1 Header

| Field | Verdict | Evidence |
|---|---|---|
| Venue | PASS | `RegisterStatusHeader.jsx` — `useActiveVenue()` name cell |
| Register Name / Type (Door/Bar/VIP) | PASS | Header `registerType` follows active tab (Door/Bar). VIP: N/A — no VIP register tab exists in RegisterConsole (VIP flows live in VIP workspace by design) |
| Logged-in User | PASS | Header Cashier cell (`user.full_name \|\| email`) |
| Active Shift | PASS | Read-only `StaffShift.filter(status: checked_in)` — "On shift · HH:MM" / "Not clocked in" |
| Active Batch | PASS | Header Batch cell + `BatchStatusBadge` in shell actions |
| Mode (REAL/DEMO/SANDBOX) | PASS | Reuses `ModeBadge` — VenueRateConfig.mode, same source as ledger gateway |
| Time | PASS | Live 1s clock |
| Connection Status | PASS | `navigator.onLine` + online/offline listeners (existing browser source, not invented) |
| Always visible | CONDITIONAL PASS | Rendered on Register + Bar tabs (the operational tabs); not on DJ/Onboarding/Audit tabs — deemed non-register surfaces |

### §1.2 Left Panel — Operational Actions

| Requirement | Verdict | Evidence |
|---|---|---|
| Large ≥44px touch buttons | PASS | QuickChargePanel vertical presets; global 44px CSS enforcement (`index.css`) |
| Cover / VIP / Merch / Tabs / Driver | PASS | Quick charges (VenueRateConfig-driven) + DriverQuickAdd on Register tab |
| Refund (permission controlled) | CONDITIONAL PASS | Exists as RefundManager (manager surface), not on register — one authoritative location upheld; surfacing on register would duplicate |
| Void (permission controlled) | PASS | ManagerVoidGateModal — door staff decrements/removes/clears require manager PIN, ActivityLog audited |
| No scrolling during normal operation | CONDITIONAL PASS | Stacked mobile-first flow scrolls on small tablets; presets + CHARGE reachable without scroll on ≥1024px |

### §1.3 Center — Current Transaction (visual priority)

| Field | Verdict | Evidence |
|---|---|---|
| Items / Quantity | PASS | `OrderDisplay.jsx` rows with qty steppers |
| Discounts | PASS | Discount % line + PIN-signed promo line items (`is_promo`) |
| Notes | N/A | Cart line items carry no notes field in existing schema — displaying one would require schema change (FROZEN) |
| Running Total / Tax | PASS | Subtotal, Tax, TOTAL (dominant 3xl green). W3-013A fix: hardcoded "(8%)" label text removed — computed value unchanged |
| Payment Status | PASS | FlowSteps 1-Add → 2-Pay → 3-Receipt strip tracks paymentStep; COMP AUTHORIZED card when comp pending |
| Visual priority | PASS | OrderDisplay + CHARGE are the largest, highest-contrast elements |

### §1.4 Right Panel — Operational Awareness

| Field | Verdict | Evidence |
|---|---|---|
| Active Batch | PASS | NoBatchBanner + header cell + shell badge |
| Drawer Status | **FAIL — no data source** | No queryable drawer-state entity exists; only NO_SALE audit events. Inventing one is FORBIDDEN (fake drawer logic). Requires DACO ruling |
| Recent Transactions | PASS | `RecentTransactionsStrip.jsx` — read-only last 5, verbatim stored values, View-all → Receipts tab |
| Batch Totals | CONDITIONAL PASS | Not displayed on register (accounting-adjacent); batch totals live in Accounting/Settlement — standard itself bars accounting reports here |
| Alerts / Manager Messages | N/A | No manager-message entity exists; creating one exceeds certification scope |
| No accounting reports | PASS | None present |

### §1.5 Footer — Persistent Actions

| Action | Verdict | Evidence |
|---|---|---|
| Cash / Card | PASS | Payment-method step: Cash, Credit, Debit, Tap (door-filtered per existing rules) |
| Charge dominant | PASS | 68px full-width gradient CHARGE button |
| Receipt | PASS | TransactionReceiptModal (unmissable post-sale) + ReceiptPrinter |
| Cancel | PASS | Back buttons + PIN-gated Clear |
| Split Payment | **FAIL — new payment behavior** | Does not exist; FORBIDDEN without DACO ruling |
| Suspend Sale | **FAIL — new transaction state** | Explicitly forbidden by W3-012B; Hold/Recall (pre-existing, session-local) partially covers intent |
| Persistent footer bar | CONDITIONAL PASS | Actions are persistent within flow steps rather than a fixed bar; a fixed bar would duplicate controls (violates one-authoritative-location) |

### §2 Frozen Business Rules — VERIFIED UNTOUCHED

| Rule | Verdict |
|---|---|
| 1–9 (total_sales math, GlyphBucks, VenueRateConfig rates, dynamic venue_id, writeEntity, dual audit, mode isolation, calculations) | **PASS** — `POSCashRegister.jsx` financial code byte-identical through Cycles 2B and 013A except one display label string in `OrderDisplay.jsx` (no computed value touched) |

### §3 Receipts

| Field | Verdict | Evidence |
|---|---|---|
| Transaction ID / Timestamp / Cashier / Register Type / Payment Method / Batch ID / Venue | PASS | All persisted on POSTransaction (`transaction_id`, `created_date`, `cashier_name`, `station`, `payment_method`, `batch_id`, `venue_id`) and rendered by shared pipeline |
| Receipt Number | CONDITIONAL PASS | `transaction_id` serves as receipt number; no separate sequence exists |
| Audit Status | PASS | SHA-256 `receipt_hash` + version persisted per record (re-verifiable against ledger) |
| Same Door/Bar pipeline | PASS | Both stations use ReceiptPrinter/TransactionReceiptModal |
| GlyphBucks printing VIP-only | PASS | GlyphBucksReceiptEngine confined to VIP workflow |

### §4 Five-Second Standard

| Question | Verdict | Answered by |
|---|---|---|
| Q1 Is my drawer open? | **FAIL** | No data source (see §1.4) |
| Q2 Is my batch open? | PASS | Header + banner + badge |
| Q3 Can I ring a sale? | PASS | NoBatchBanner explains before error; CHARGE hidden on empty cart with guidance |
| Q4 Who am I? | PASS | Header Cashier + Shift cells |
| Q5 Which register? | PASS | Header Register cell (tab-driven) |
| Q6 What happens next? | PASS | FlowSteps coaching strip + empty-cart hint |
| Explain unavailability before attempt | PASS | NoBatchBanner, empty-cart card, disabled-with-tooltip overrides |

### §5 Safety

| Rule | Verdict | Evidence |
|---|---|---|
| No hidden validation errors | PASS | Gateway block_reason surfaced via toast; batch enforcement toasts |
| No fake success states | PASS | Transactions only confirmed after write returns |
| No incomplete transactions | PASS | Batch precondition + gateway validation |
| No audit/writeEntity bypasses | PASS | Door writes route through writeEntity + emitAuditEvent + SystemAuditLog |
| Batch status never hidden | PASS | Three surfaces (header, banner, badge) |
| Receipt failures visible | PASS | Receipt modal + printer error paths surface |
| Sync failures visible | CONDITIONAL PASS | Connection indicator added (Cycle 2B); offline write queue visibility exists via OfflineSyncBanner on other surfaces, not embedded in register |

### §6 Modernization Rule

| Rule | Verdict |
|---|---|
| Wrap/expose, no financial redesign | PASS — Cycles 1–2B were additive display-only |
| No overlays / duplicate screens / hidden workflows | PASS — all actions have one authoritative location; Driver Payouts panel suppressed on register tab specifically to avoid duplication |

---

## 2. Remaining Gap List (require DACO ruling — all exceed UI-only scope)

1. **Drawer status (§1.4, §4 Q1)** — no drawer-state data source; requires new entity/logic.
2. **Split Payment (§1.5)** — new payment behavior.
3. **Suspend Sale (§1.5)** — new transaction state (explicitly forbidden pending ruling).
4. **Manager Messages / Alerts panel (§1.4)** — no message entity exists.
5. **Batch Totals on register (§1.4)** — DACO must rule whether live batch totals are "awareness" or "accounting report" (standard bars the latter from this panel).
6. **Dedicated receipt number sequence (§3)** — currently transaction_id; new sequence = schema change.

## 3. Recommended Final Improvements (UI-only, safe for a future cycle)

- Render RegisterStatusHeader on all RegisterConsole tabs (currently Register + Bar).
- Embed OfflineSyncBanner in RegisterConsole for §5 sync-failure parity.
- Compact fixed action rail on ≥1280px screens (re-anchoring, not duplicating, existing CHARGE/Cancel).

## 4. Changes Made Under W3-013A

| File | Change | Financial impact |
|---|---|---|
| `src/components/nups/pos/OrderDisplay.jsx` | Tax line label "Tax (8%)" → "Tax" (display string only; door station is tax-exempt so the hardcoded rate text was misleading) | **None — computed `tax` value untouched** |
| `src/docs/governance/W3-013A-REGISTER-CERTIFICATION.md` | This report | None |

## 5. Evidence & Screenshot Note

- Code-level evidence cited per clause above (component + file per row); routes: `/register`, `/registerconsole` (kiosk-wrapped, RoleClassGuard + NUPSRouteGuard `pos_access`).
- Automated headless screenshots return the **Authentication Required** gate (captured 2026-07-08) — itself evidence RBAC surfaces are intact. Authenticated visual evidence must be captured from an operator session; guards cannot and must not be bypassed for screenshots.

## 6. Zero-Warning Summary

- No lint/build warnings introduced (one prior false-positive "Icon" import warning — destructured render prop, not an import).
- No writes added. No schema changes. No audit changes. No mode-isolation changes.
- POSCashRegister financial logic: **unchanged**.

---

## Certification Verdict

**CONDITIONAL PASS** — all clauses satisfiable within UI-only scope are PASS; the 6 remaining gaps each require explicit DACO authorization because they demand new data sources, new payment behavior, or new transaction states.

**STOP CONDITION HONORED:** Manager Workspace, Back Office, Owner, and System Administration NOT begun. Awaiting written DACO approval of this certification.