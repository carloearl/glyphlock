# W3-012A Phase 1 — Feature Inventory

**Purpose:** Complete inventory of every route, page, workspace, and capability before any UI modification. Nothing may disappear without documentation.

---

## WORKSPACE MAP (Proposed)

| Workspace | Route Prefix | Role Access | Purpose |
|---|---|---|---|
| Staff | /staffhome, /frontdoor | STAFF, MANAGER, ADMIN | Daily operations, clock-in, check-in |
| Register / POS | /register, /registerconsole | STAFF, MANAGER, ADMIN | Point-of-sale transactions |
| Manager | /managerconsole, /nupshub | MANAGER, ADMIN | Operational awareness, approvals |
| Back Office | /accounting, /admin/* | ADMIN | Financial operations, ledger, audit |
| Owner Command Center | /nupsowner | ADMIN (Owner tier) | Executive overview |
| System Administration | /admin/registry, /admin/venue-settings | ADMIN (Sovereign) | Users, roles, config, diagnostics |

---

## EXISTING ROUTES (Preserved)

### Operations
- `/NUPSHub` → Dashboard (TodaysSummary, TopProducts, HourlySales, VenuePerformance, OperatorFlowStrip, DailySettlementSummary)
- `/FrontDoor` → Door operations (cover charges, driver drops, guest check-in)
- `/EntertainerCheckIn` → Entertainer check-in kiosk
- `/Register` / `/RegisterConsole` → POS terminal (tabs: register, bar, dj, staff, audit)
- `/DriverPayouts` → Driver payout management
- `/Receipts` → Receipt history
- `/Tonight` → Tonight snapshot
- `/StaffHome` → Staff landing page
- `/EntertainerHome` → Entertainer landing page

### Accounting / Back Office
- `/Accounting` → Accounting overview
- `/AccountingHub` → GL reports
- `/admin/ledger` → Ledger trial balance
- `/admin/settlement` → Daily settlement dashboard
- `/admin/payout-history` → Driver payout history
- `/admin/activity-log` → Activity log viewer

### Governance Surfaces
- `/admin/audit-integrity` → Audit integrity dashboard
- `/admin/payment-reconciliation` → Reconciliation exception queue
- `/admin/financial-resolution` → Financial resolution workflow
- `/admin/adr` → Architectural decision register

### Admin
- `/NUPSOwner` → Owner command center (tabs: analytics, glyphbucks, staff, vip, reports, payroll, audit, admin, demo, dj, customers, marketing, inventory)
- `/NUPSAdminPortal` → Back-office portal
- `/ManagerConsole` → Manager dashboard
- `/admin/venue-settings` → Venue admin settings
- `/admin/registry` → Feature registry admin
- `/PeopleArchive` → Person record archive
- `/Contracts` / `/ContractsHub` → Contract management

### Kiosk / Landing
- `/NUPSLanding` → Public landing
- `/NUPSGateway` → Role-based gateway
- `/NUPSLogin` → Staff login
- `/NUPSSandbox` → Sandbox environment
- `/ClubTV` → Club TV display
- `/MobileScanner` → Mobile QR scanner

---

## SHELL INFRASTRUCTURE (Existing — Enhanced)

- `NUPSAppShell` — Sidebar + top bar + global search. Role-scoped sections (DACO 003 §2).
- `KioskShell` — Kiosk mode wrapper with Manager PIN exit.
- `GlobalSearchDrawer` — ⌘K command palette (reads Feature Registry).
- `ModeToggle` — REAL/DEMO/SANDBOX mode switcher.
- `RoleClassGuard` — Route-level RBAC guard.
- `RoleClassBadge` — Role class indicator.
- `useNUPSPermissions` — RBAC permission hook (can, hasRole, isOwnerTier, isManagerTier, isStaffTier, isPerformerTier).

---

## NAVIGATION SECTIONS (Existing in NUPSAppShell)

### Operations · Tonight's Flow
- Dashboard, Open Night, Check In Talent, Register, Driver Payouts, Receipts, Tonight Snapshot

### Floor & Staff
- Staff, DJ Console, Customers, Marketing, People Archive

### Accounting
- Accounting (children: GL Reports, Trial Balance, Settlements, Payout Log), Analytics, Reports, Payroll, Inventory, Contracts (children: VIP Shows, GlyphBucks, Big Spender, Entertainer, Venue Terms, Lookup)

### Admin
- Audit (children: Integrity, Audit Log, Activity), Admin Console, Feature Registry, Decision Register, Demo Keys, Venue Settings

---

## CHANGE LOG

| Component | Previous Location | New Location | Action | Reason | Status |
|---|---|---|---|---|---|
| WorkspaceSwitcher | (new) | NUPSAppShell top bar | Created | W3-012A Phase 1 workspace separation | Done |
| Workspace config | (new) | src/lib/nups/workspaceConfig.js | Created | Single source of truth for workspace definitions (6 workspaces, role-scoped) | Done |
| WORKSPACE_ITEM_MAP | (new) | src/lib/nups/workspaceConfig.js | Created | Maps every sidebar item ID to workspace tags for filtering | Done |
| getWorkspaceForPath | (new) | src/lib/nups/workspaceConfig.js | Created | Detects active workspace from URL + role class, priority-ordered | Done |
| NUPSAppShell sidebar | Showed all role-scoped sections | Filters by active workspace | Enhanced | Sidebar now shows only items relevant to the active workspace (Staff, Register, Manager, Back Office, Owner, System) | Done |
| Directive doc | (new) | src/docs/governance/DACO-W3-012A-UIX-001.md | Created | Formal directive with 5-phase plan and acceptance criteria | Done |
| Feature inventory | (new) | src/docs/governance/W3-012A-FEATURE-INVENTORY.md | Created | Complete route/page/workspace inventory with change log | Done |

**Action values:** Preserved, Enhanced, Relocated, Merged, Expanded, Simplified, Renamed

All subsequent modifications will be appended to this change log.