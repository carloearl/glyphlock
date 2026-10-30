# Hourly payroll and owner access repair

**Goal:** Remove named month/employee/salary presets, calculate standard withholding on hourly minimum-wage pay plus reported tips, and repair the erroneous owner payroll restriction.

**Implementation:** The Payroll workspace remains Admin → Payroll. EmployeePayrollForm defaults to hourly with blank employee/date/hour fields; salary is still available. Shared hourlyEarnings.js computes full hourly base wages, weekly overtime at 1.5× and reported taxable tips. It selects verified 2026 statewide/Tucson/Flagstaff floors. No tip credit is taken. Workweek hours and tip reports require operator verification. Server recalculates and rejects altered totals, and stores a versioned earnings snapshot. Paid tips reduce the check amount separately from tax deductions; both stub formats explain the reconciliation. Existing IRS15T/W4, Social Security6.2%, Medicare1.45%/additional Medicare and A4 Arizona withholding remain authoritative. No federal exemption or tips deduction is guessed.

**Access repair:** Legacy NUPSOwner previously trusted persistent UI role data before authenticating, and stale highest-role payloads could override a current admin login. Revalidate the authenticated identity, then resolve canonical owner/admin roles before staff roles. Backend payroll mirrors nupsAccessControl's exact canonical sovereign identities; no username/local-part matching. Retain non-owner server authorization and tenant/mode restrictions. Remove duplicate Admin Payroll entry. Saved employee profiles now have an explicit hourly_rate_cents and a .jsonc schema matching Base44 resource conventions.

**Validation:** Add failing-then-passing tests for missing earnings calculation, overtime/local floors, paid-tip reconciliation, insufficient cash, removed presets and owner-access regression. Handler tests cover canonical owner identity, hourly salary storage, tampered totals and full draft persistence. Run configured CI, lint, typecheck, build and independent review before merge.

**Invariants:** Never rewrite old checks or reset numbering. Never deduct employer taxes from employee wages. Already-paid tips remain taxable and are not paid twice. Insufficient cash to cover withholding blocks this regular calculation for specialist collection-priority/uncollected-tax handling. No checks issued, signed or paid during development. No role grants or user data edits.

**Scope:** Wage rules cover2026 earning periods. Other years, tip-credit payroll, bonuses/service charges/regular-rate adjustments and uncollected tip tax handling require separate payroll processing. Actual issue dates remain entered by the operator. Existing records remain readable and printable. Frontend publication remains the owner's step.

**Sources checked October30,2026:**
- https://www.azica.gov/news/2026-minimum-wage-increase-effective-january-1-2026
- https://www.tucsonaz.gov/Departments/Business-Services-Department/Tucson-Minimum-Wage-Act
- https://www.flagstaff.az.gov/3520/Minimum-Wage
- https://www.irs.gov/taxtopics/tc751
- https://www.irs.gov/taxtopics/tc761
- https://www.irs.gov/publications/p15t
- https://azdor.gov/forms/withholding-forms/arizona-withholding-percentage-election

**Rollback:** Revert this task's squash commit; retain all employee/check records and sequences. Restore previous source/schema from0deee271d71c06836ed2607d4d37f2171fc87785 plus preserved subsequent main changes. Newly stored hourly checks retain their snapshots; avoid re-reviewing/reprinting them under a renderer that does not understand paid tips. No automatic downgrade or destructive migration.

**Verification completed:** 36 configured checks, 67 payroll tests (48 publish/hourly/access plus19 employee tests), lint, typecheck and production build passed. Existing chunk-size warning remains. Independent review found an inherited-object-key jurisdiction bypass; own-property/positive-integer checks and red-green calculator/handler regressions closed it. Focused re-review found no remaining blocker. No production check or payroll profile data was created by verification.
