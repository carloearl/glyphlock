# DACO Consolidation Progress — 2026-08-19

**App:** Base44 `697a087fb354faebb72df54b`  
**Repository:** `carloearl/glyphlock`  
**Authority:** DACO  
**Deletion policy:** No permanent deletion; checkpoints and legacy retention required.

## Baseline evidence

- Pre-change checkpoint: `6a85519635b346ede002ba16` at commit `30a2bc67775fc4458e999dedd603e023661219af`.
- Production build: PASS.
- Typecheck: PASS.
- Lint baseline: 0 errors, 21 unused-directive warnings.
- Entity audit: 163 registered entities, 59 unreferenced, 69 with direct writes, 21 critical with direct writes.
- Normalized duplicate: `QrScanEvent` / `QRScanEvent`.
- Both QR scan entities and `_noop`, `Noop`, `Tmp`: zero records.
- GitHub: main branch active; no open PRs or issues at run start.

## Completed

1. Register safety improvements
   - `RegisterStatusHeader` now remains visible on every permitted RegisterConsole tab.
   - `OfflineSyncBanner` is embedded in RegisterConsole.
   - No POS calculations, financial fields, or payment behavior changed.

2. QR scan stream consolidation
   - `QrScanEvent` is the canonical stream.
   - Canonical schema extended with structured diagnostics telemetry.
   - `recordQrScanEvent` writes the canonical stream.
   - `QrStudio` diagnostics now use the protected backend function.
   - `QRScanEvent` retained as a labeled legacy archive; no deletion.

3. Tier 2 source cutoff
   - Added `scripts/check-nups-write-gateway.mjs`.
   - Added explicit legacy manifest at `config/nups-direct-write-legacy-manifest.json`.
   - CI now fails on any new frontend direct write, new call signature, or increased grandfathered count.
   - Current cutoff: 287 grandfathered direct frontend writes, including dynamic bracket-access calls. The number may decrease but cannot increase.

4. Legacy parking
   - `_noop`, `Noop`, and `Tmp` labeled LEGACY PARKED.
   - All three had zero records and zero source references.
   - Schemas remain available for rollback.

## Intentionally not executed

- EXEC-01 device quarantine was not reconstructed because the original ID-01 directive and Patch A are absent. Patch B explicitly forbids guessing.
- EXEC-02 QR/receipt encoder remains gated behind formal EXEC-01 closure. Existing QR capabilities were consolidated, not replaced.
- W3-012 financial governance remains PROPOSED because its directive requires formal DACO approval before implementation.
- Drawer state, split payment, suspend sale, manager messages, live batch totals, and receipt sequencing remain outside the approved UI-only register scope.
- The SOVEREIGN binding was not changed. Live inspection found the global `SystemConfig.sovereign_user_id` does not match the current SOVEREIGN-flagged NUPSUser; the existing directive says not to rebind automatically. This requires explicit identity confirmation.

## Verification complete

- Secret guard: PASS across 1,848 files.
- Entity audit: PASS across 163 registered entities and 1,200 source files; the retained `QrScanEvent` / `QRScanEvent` archive pair remains explicitly documented.
- Tier 2 source cutoff: PASS at 287 / 287 grandfathered direct writes.
- DJ function SDK audit: PASS for all 7 checked functions on SDK 0.8.38.
- Integration boundary audit: PASS.
- NUPS isolation audit: PASS.
- Operational UI audit: PASS with 0 errors and 0 warnings.
- ESLint: PASS with no warnings.
- TypeScript check: PASS.
- Production build: PASS across 4,284 transformed modules.
- Active source references to legacy `QRScanEvent`: 0.

## Evidence and final seal

- GitHub Actions `NUPS CI #819` completed successfully on current `main` during the final visual check.
- Workflow source was visually verified at `.github/workflows/nups-ci.yml` lines 37–44, including `npm run check:nups-write-gateway`.
- Register safety source was visually verified at `src/pages/RegisterConsole.jsx` lines 248–268, including `OfflineSyncBanner` and persistent `RegisterStatusHeader` mounting.
- The live protected Register route redirected the cloud browser to the Base44 login surface; authenticated runtime rendering was not claimed.
- Screenshots rendered successfully in the cloud browser, but the browser shared-files mount returned `EROFS` and could not synchronize durable screenshot files into the workspace. Verified public evidence URLs remain available in the run handoff.
- Final checkpoints: `6a8557c385e5c39bb903fb5f` (`DACO 2026-08-19 visual evidence seal`) and `6a85519635b346ede002ba16` (pre-change rollback baseline).
- Checkpoint commit `0f6eb2d24539d74bba49af6c0afe5dbee449b352` completed successfully as GitHub Actions run `NUPS CI #813`; newer concurrent Base44 commits on `main` also passed in `NUPS CI #818` and `#819`.
