# Owner Payroll Workspace Implementation Plan

**Goal:** Move employee payroll out of Legacy into Admin → Payroll, retaining checks and payroll information.

**Architecture:** React workspace uses the existing owner/admin employeePayrollCheck backend. EmployeePayrollCheck retains historical snapshots; new EmployeePayrollProfile stores reusable salary and schedule settings under the same venue/mode boundary. MigrationAuditLog exposes existing payroll activity. No existing data is migrated or overwritten.

**Tasks**
- [x] Write failing handler tests for employee persistence, tenant isolation, bad input, workspace reads, unauthenticated access and canonical navigation.
- [x] Add server-only employee settings entity and validated save/read handlers.
- [x] Add Payroll route, Admin menu entry, register/search/status filter, older-check pagination, employee settings and activity views.
- [x] Make OfficialChecks bookmarks converge on Payroll; keep historical contractor reports accessible.
- [x] Run required CI, lint, typecheck, production build and independent review.

**Invariants:** Owner/admin authorization remains server-side. Venue and REAL/DEMO scope remain mandatory. Check numbering, stored totals, check-specific tax snapshots, and unsigned printing do not change. Employee settings edits do not rewrite checks. Payroll preparation never marks wages paid or transfers money.

**Production impact:** Adds employee settings storage and scoped activity reads; no bulk migration, deletion or check creation during development. Payroll frontend remains unpublished until user publishes. Existing Chase stock still requires physical calibration.

**Rollback:** Revert this task's squash commit to dddfec1c603447fe682010fabc9f0772e0818f2d (or subsequent main baseline). Retain EmployeePayrollProfile rows and all check records; never reset check numbering. Source rollback restores former navigation.

**Known bounds:** Activity and employee lists display the latest/up to 1,000 records and say so. Check history pages in groups of 200. Saved profiles contain salary/schedule/internal reference only; employee tax elections are verified per paycheck and stored on the check, not inferred from salary. Monthly payday supports days 1–28 as a reference, never an automatic issue date.

**Review:** Independent reviewer found a deferred-save callback could invalidate a newly selected ledger load. Guard load and form completion against the originating scope; stale callbacks cannot start a fetch or navigate the active ledger. No remaining review findings.
