# Employee Payroll / Check Preparation — Implementation Plan (2026-10-30)

## Scope

Restore a functional **employee** payroll/check-preparation workflow behind Legacy NUPS → Payroll, reusing
`src/pages/OfficialChecks.jsx` and the existing `NUPSOwner` payroll mount. Contractor (1099) payouts and the
retired entertainer payroll engine are out of scope and remain untouched.

## What is being replaced

`OfficialChecks.jsx` previously derived checks from `PayrollRecord` (entertainer/contractor ledger) and:

- computed federal/SS/Medicare/AZ withholding from fixed percentages (fake tax compliance);
- derived check numbers from `4471 + array index` (unstable, not persisted, not duplicate safe);
- reported YTD as the current record's own gross;
- printed the pay-period end date as the pay date;
- used contractor labels ("Commissions", "Tips", "Contract Pay Rate", generic "Entertainer").

Those assumptions are removed for the new employee workflow. `PayrollRecord` rows stay historical and read-only.

## Architecture

```
OfficialChecks (owner/admin UI)
  → employeePayrollCheck (backend function: authenticated trust boundary)
      → PayrollCheckSequence (account-scoped numbering, compare-and-set)
      → EmployeePayrollCheck  (draft / reviewed records)
      → MigrationAuditLog     (existing write-governance audit row per mutation)
```

- **Trust boundary:** every read, draft creation and review runs in `base44/functions/employeePayrollCheck`
  with `asServiceRole` writes. The client never chooses tenant, mode, check number, status, or totals.
- **Authorization:** authenticated user must be platform `admin` or an active NUPS identity with
  `PLATFORM_ADMIN` / `VENUE_OWNER` / `SOVEREIGN`. No hardcoded email bypass.
- **Tenant + mode:** venue comes from the server-resolved NUPS identity; a client-supplied venue that differs is
  rejected (`cross_tenant_write_blocked`). Mode is `REAL` or `DEMO` and must match the actor's account mode when
  known. `account_key = GLYPHLOCK_LLC:<venue>:<mode>` scopes numbering and reads.

## Data model

`EmployeePayrollCheck` (new): integer cents (`gross_cents`, `total_deductions_cents`, `net_cents`), explicit
`deductions[]` entered and verified by the user, `period_start`/`period_end` (earning period) distinct from
`issue_date` (actual check date), `ytd_status` = `VERIFIED_OPENING` (with opening figures) or `UNAVAILABLE`,
`bank_name` fixed to `Chase`, `check_stock` = preprinted stock, `status` `DRAFT` → `REVIEWED`, `idempotency_key`.
No routing/account numbers, no SSN, no signatures, no tax-rate fields.

`PayrollCheckSequence` (new): `account_key`, `next_number`, `last_allocated`, `last_token`. Server-only RLS.

## Invariants

1. Integer cents everywhere; `net_cents = gross_cents − total_deductions_cents`, never negative.
2. Deductions are user-entered and explicitly acknowledged; the product makes **no** claim of automatic tax
   compliance or withholding accuracy.
3. Check numbers are permanent, allocated once per account, monotonic, duplicate-protected by compare-and-set
   plus a post-allocation existence check.
4. Retries are idempotent on `idempotency_key`.
5. `DRAFT` renders **NON-NEGOTIABLE**. Only `REVIEWED` prints without the draft stamp, and it still prints as
   UNSIGNED. Paid/void records always reprint as NON-NEGOTIABLE copies.
6. No bank digits are stored, bundled, logged or printed. Preprinted Chase stock only.
7. No automatic issuance, funds transfer, "mark paid", signature image, or fabricated payroll/tax/bank data.
8. Historical records are read-only; no deletion path is added.

## Files

- `base44/entities/EmployeePayrollCheck.jsonc`, `base44/entities/PayrollCheckSequence.jsonc`
- `base44/functions/employeePayrollCheck/{entry.ts,payrollPolicy.js}`
- `src/lib/payroll/{checkFormat.js,payrollApi.js,printCheck.js}`
- `src/components/payroll/{EmployeePayrollForm.jsx,EmployeeCheckDocument.jsx,EmployeeCheckRegister.jsx}`
- `src/pages/OfficialChecks.jsx` (rewritten), `src/App.jsx` (route), `src/pages/NUPSOwner.jsx` (link)
- `scripts/test-employee-payroll.mjs` (+ npm script, `.base44/ci-checks.json`)

## Verification

`node --test scripts/test-employee-payroll.mjs` (rounding/net, missing deductions/bank/issue date, concurrent
numbering, unauthorized/cross-tenant scope, paid reprint stamping), then `npm run build`, `check:nups-frozen-rules`,
`check:seo-metadata`, `check:glyphlock-write-governance`, `ci:base44`.

## Known limitations (disclosed in the UI)

- No integrated payroll tax calculation or filing; withholding is whatever the operator enters and verifies.
- No direct deposit / funds movement; preprinted check stock printing only.
- Opening YTD must be supplied and verified by the operator or is displayed as unavailable.