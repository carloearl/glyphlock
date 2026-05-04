# writeEntity() Gateway — Phase 4

**Tier:** TIER_1_OBSERVE (default)
**Location:** `src/lib/nups/writeEntity.js`

## API

```js
import { writeEntity } from '@/lib/nups/writeEntity';

const receipt = await writeEntity({
  entity: 'POSTransaction',     // entity name, must match an existing entity
  operation: 'create',          // 'create' | 'update' | 'delete' | 'bulkCreate'
  data: { ... },                // payload for create/update
  id: '...',                    // required for update/delete
  actor: { id, role, email },   // current NUPSUser context
  intent: 'shift_close_sale',   // free-form context tag
  venue_id: '...'               // optional
});

// receipt = { ok, audit_id, mode, tier, result, value }
```

## Behavior by Tier

### TIER_1_OBSERVE (current)
- Resolves mode via `getActiveMode()`.
- Performs the requested write through the standard `base44.entities[...]` API.
- Emits a `MigrationAuditLog` entry tagged `result: 'allowed'`.
- Returns the write receipt.

### TIER_1 + financial guard (active)
- If `mode === 'REAL'` AND the entity is in the financial set
  (POSTransaction, POSBatch, POSZReport, PayrollRecord, TipPayout,
  GlyphBucksTransaction, VenueContract, DriverPayout) AND
  `actor.role` is not in {VENUE_OWNER, VENUE_MANAGER, PLATFORM_ADMIN, SOVEREIGN}
  AND `actor.sovereign_flag !== true`:
  - The write is **blocked**.
  - `MigrationAuditLog` entry tagged `result: 'blocked'`.
  - Receipt: `{ ok: false, block_reason: 'role_not_authorized_in_REAL' }`.

### TIER_2_LOCKED (deferred — see TIER_DETECTION.md)
- Not active in this environment.

## Adoption

Tier 1 is observe-only. Existing direct-write call sites are NOT modified
this run. Adoption is a future incremental migration.