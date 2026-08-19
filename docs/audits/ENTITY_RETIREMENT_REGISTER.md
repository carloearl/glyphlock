# Entity Retirement Register

**Run:** DACO-20260819-CONSOLIDATION  
**Policy:** No permanent deletion. Retired entities remain available for rollback until a separately approved export-and-delete phase.

| Entity | State | Records verified | Active source writers | Action | Rollback |
|---|---|---:|---:|---|---|
| `QrScanEvent` | CANONICAL | 0 | Protected backend + existing analytics writers | Extended to accept both redirect analytics and structured diagnostics telemetry | Restore the pre-run checkpoint |
| `QRScanEvent` | LEGACY ARCHIVE | 0 | 0 | All active writes routed to `QrScanEvent`; schema retained and labeled | Repoint the two archived call sites if required |
| `_noop` | LEGACY PARKED | 0 | 0 | Labeled unused; retained | Remove the label |
| `Noop` | LEGACY PARKED | 0 | 0 | Labeled unused; retained | Remove the label |
| `Tmp` | LEGACY PARKED | 0 | 0 | Labeled unused; retained | Remove the label |

## QR compatibility decision

The two scan entities had different field shapes but normalized to the same name. `QrScanEvent` was selected because it already owns the redirect, analytics, tamper, webhook, export, and command-center paths. Its schema now includes the structured diagnostics fields formerly written to `QRScanEvent`.

The protected `recordQrScanEvent` backend function now writes the canonical stream and supplies required compatibility fields. `QrStudio` invokes that backend function instead of performing a direct frontend entity write.

## Deferred physical removal

The Base44 registry will continue to report a normalized duplicate while `QRScanEvent` remains preserved. Physical deletion is intentionally deferred because the DACO instruction forbids permanent deletion in this run. A later retirement phase must export schemas and records, verify a zero-write observation window, and obtain explicit approval before deletion.
