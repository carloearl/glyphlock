# Employee payroll generator — publish preparation

## Scope
GlyphLock LLC employee salary/check preparation in Legacy NUPS and /OfficialChecks. Chase preprinted business stock. Start 26-395. August–October 2026 $4,000 gross presets; no payroll issued, signed, paid or funded by this work.

## Changes
- Owner query uses positional SDK array contract; preserves REAL filtering.
- Authenticated platform admin selects active venue independently of stale demo staff; full email binding only.
- One provisioned bank numbering sequence per REAL/DEMO ledger, shared across venues; venue-scoped payroll reads remain separate.
- Persistent atomic save lock covers retry lookup, number allocation and record persistence; no automatic cold sequence initialization. Conflicting config fails closed. Crash-held lock requires owner reconciliation before removal; never clear a lock without checking drafts and consumed stock.
- Server and UI share versioned 2026 regular-wage calculator, IRS15-T Worksheet1A annual schedules, W4 2020+, employee FICA, Arizona A4. Calculations are recomputed on save. Extra manual deductions are post-tax. Unsupported tax years, pre-tax benefits, supplemental wages and nonresident adjustments require separate payroll review.
- Opening YTD explicitly means before this check, not current cumulative YTD.
- Plain-paper copies are nonnegotiable. Separate Letter top-check overlay has inch coordinates, point font sizes and a MICR clear band. Stock printing requires REVIEWED REAL record and operator-confirmed alignment. Blank account/routing area is supplied by bank stock.

## Primary tax references, retrieved 2026-10-30
- https://www.irs.gov/publications/p15t — Worksheet1A and 2026 annual automated tables (standard and Step2)
- https://www.irs.gov/publications/p15 — employee FICA rates, wage base and Additional Medicare
- https://azdor.gov/sites/default/files/document/FORMS_WITHHOLDING_2026_A-4_f.pdf
- https://azdor.gov/sites/default/files/document/FORMS_WITHHOLDING_2026_A-4i.pdf

## Repository research
Reviewed https://github.com/rabidpenguin87/endorse README (GPLv3) for calibration, per-account numbering and print workflow patterns, and https://github.com/Shimizu-Technology/cornerstone-payroll README for separation of calculation/review/check/stub workflows. No source code, fonts, signatures or banking details copied. Guam tax rules were not reused.

## Invariants and operational limits
No terminal/payment processing, employer tax debits, signatures or funds transfers. Contractor payouts and tip pools remain isolated. Actual issue date remains distinct from earning periods. Existing financial/evidence data not deleted. Number config provisioned at suffix395 for REAL and DEMO after confirming no sequence/payroll records existed.

Exact Chase stock alignment is not certified: a redacted blank stock sample/template number and physical 100% scale paper test are still required. Default field positions are a starting calibration profile. No bank acceptance claim. Full routing/account information is not collected; blank-stock MICR generation is outside this release.

## Validation and release
Run test:employee-payroll and test:payroll-publish, ci:base44, lint, typecheck, build. Publish only after required GitHub checks are green. Code-review findings addressed with regression tests, including nonboolean exemption values. No real payroll mutation was used for testing. Live smoke: verified authenticated page renders; prior 403 diagnosed and regression tested; recheck backend after branch integration. Frontend production publication remains user-controlled.

Rollback: revert this payroll release PR; preserve created records and numbering sequences for reconciliation. Never reset a consumed stock number.
