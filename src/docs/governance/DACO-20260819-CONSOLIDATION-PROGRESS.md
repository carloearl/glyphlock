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
   - Current cutoff: 278 grandfathered frontend writes. The number may decrease but cannot increase.

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

## Verification pending

- Full post-change CI-equivalent suite.
- Live authenticated UI verification.
- Screenshot evidence.
- Final checkpoint and GitHub commit/Actions verification.
