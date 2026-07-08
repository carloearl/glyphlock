# BPAAA REGISTER OPERATIONS STANDARD — v1.0 (PERMANENT)

**Status:** ADOPTED — Permanent standard. All future Register Workspace enhancements MUST comply.
**Attach to:** W3-013 (Register Workspace modernization) and every subsequent register directive.

## Lineage

| Field | Value |
|---|---|
| Parent | W3-012A (UI/UX Modernization — Preserve, Consolidate, Enhance) |
| Prerequisite | W3-012B Cycle 2 (Register — CONDITIONAL PASS conditions carried forward) |
| Supersedes | None (first register-specific standard) |
| Superseded By | — |
| Architecture Baseline | DACO-20260706-ARCH-BASELINE-01 |
| BPAAA Version | v3.0 (FROZEN) |

---

## Purpose

The Register Workspace is the operational heart of NUPS. Its purpose is **speed, accuracy, accountability, and confidence**. Every cashier, door host, and manager must immediately understand the current operational state without requiring training.

---

## 1. REGISTER LAYOUT — Operational Zones

### 1.1 Header (always visible)
Displays: Venue · Register Name · Register Type (Door / Bar / VIP) · Logged-in User · Active Shift · Active Batch · Mode (REAL / DEMO / SANDBOX) · Time · Connection Status.

### 1.2 Left Panel — Operational Actions
Large touch-friendly buttons (≥44px). Examples: Cover, VIP, Merchandise, Tabs, Driver, Refund (permission controlled), Void (permission controlled). **No scrolling required during normal operation.**

### 1.3 Center — Current Transaction (visual priority)
Always displays: Items · Quantity · Discounts · Notes · Running Total · Tax · Payment Status. The current transaction must always remain the visual priority.

### 1.4 Right Panel — Operational Awareness
Displays: Active Batch · Drawer Status · Recent Transactions · Batch Totals · Alerts · Manager Messages. **No accounting reports belong here.**

### 1.5 Footer — Persistent Actions
Always available: Cash · Card · Split Payment · Receipt · Suspend Sale · Cancel · Charge. **Charge remains the dominant action.**

---

## 2. FROZEN BUSINESS RULES (immutable)

1. `total_sales = cash_sales + card_sales`
2. GlyphBucks never contributes to `total_sales`
3. GlyphBucks remains stored in Notes JSON
4. All rates originate from `VenueRateConfig` — no hardcoded rates
5. `venue_id` remains dynamic
6. All writes use `writeEntity()`
7. Dual audit logging (AuditEvent + SystemAuditLog) remains mandatory
8. REAL / DEMO / SANDBOX isolation remains mandatory
9. Existing register calculations remain unchanged

---

## 3. RECEIPTS

Receipts shall clearly display: Transaction ID · Timestamp · Cashier · Register Type · Payment Method · Batch ID · Venue · Receipt Number · Audit Status.

- Door and Bar receipts continue using the **same receipt generation pipeline**.
- VIP-specific GlyphBucks printing remains **restricted to the VIP workflow only**.

---

## 4. OPERATOR EXPERIENCE — Five-Second Standard

A first-shift cashier shall understand within five seconds:

1. Is my drawer open?
2. Is my batch open?
3. Can I ring a sale?
4. Who am I logged in as?
5. Which register am I operating?
6. What happens next?

**If an operation is unavailable, explain why before the operator attempts it.**

---

## 5. SAFETY — The Register shall NEVER

- Hide validation errors
- Produce fake success states
- Accept incomplete transactions
- Allow bypasses around audit logging
- Allow bypasses around `writeEntity()`
- Hide batch status
- Hide receipt failures
- Hide synchronization failures

Errors must be **visible, understandable, and actionable**.

---

## 6. MODERNIZATION RULE

Improve the Register visually, ergonomically, in discoverability, and in speed.

Do NOT redesign: financial behavior · transaction logic · accounting · reconciliation.

The Register is an operational instrument, not a design exercise.

**If a proposed UI improvement requires modifying financial behavior, STOP and return to DACO before implementation.**

No overlays, duplicate screens, or hidden workflows. Every functional requirement maps to one authoritative interface.

---

## Appendix A — Compliance Gap Assessment (as of adoption, post-Cycle 2)

| Standard clause | Current state | Gap |
|---|---|---|
| 1.1 Header | RegisterConsole header shows venue, batch badge, mode, seed switch | Missing: register type label, logged-in user, active shift, clock, connection status |
| 1.2 Left panel actions | Vertical quick-charge buttons exist (Vinnie-compliant orientation) | Refund/Void live in separate manager flows, not surfaced with permission gating on register |
| 1.3 Center transaction | OrderDisplay shows items/total | Discounts/notes/payment status visibility to verify in W3-013 |
| 1.4 Right awareness panel | Batch badge only; recent transactions on separate tab | No consolidated awareness panel; drawer status not surfaced |
| 1.5 Footer persistent actions | Charge dominant inside POSCashRegister | No persistent footer; Suspend Sale does not exist (would be new logic — DACO ruling required) |
| 3 Receipts | Shared pipeline for Door/Bar confirmed; GlyphBucks print VIP-only confirmed | Audit Status line on receipt to verify |
| 4 Five-second | Partially met (Cycle 1–2: stations, no-batch banner) | Drawer status + shift identity not yet answerable in 5s |
| 5 Safety | Batch enforcement visible (Cycle 2 banner); errors surface via toasts | Sync-failure visibility (offline queue) to verify |

Gaps are W3-013 implementation scope. Items marked "DACO ruling required" (Suspend Sale) need explicit authorization since they exceed UI-only scope.

---

*Adopted 2026-07-08. Every future register directive references this standard by name instead of restating rules.*