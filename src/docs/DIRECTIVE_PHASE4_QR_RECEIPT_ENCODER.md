# DACO-20260613-PHASE4 — QR / Receipt Encoder Directive (STUB)
## Codename: EXEC-02 (QR Lifecycle & Receipt Generation)
## Issued: 2026-06-13 (America/Phoenix)
## Authority: DACO (Carlo René Earl / GlyphLock LLC)
## Status: QUEUED — awaits EXEC-01 (ID-01 Driver/Device Quarantine) closure

---

## EXECUTIVE INTENT

After the driver/device quarantine is locked (EXEC-01 complete), NUPS requires
a unified QR encoding and receipt generation system that:

1. **Generates audit-grade QR codes** for contracts, GlyphBucks bills, and
   receipts — with deterministic encoding so a bill's QR is reproducible for
   reprinting.

2. **Encodes contract metadata** into QR payloads so a door/bartender scanner
   captures full context (contract type, customer ID, entertainer, amount, fees).

3. **Chains to receipt print system** — QR generation → receipt layout → thermal
   or digital print, with audit logging at each step.

4. **Isolates encoding logic in a backend function** so no PII or payment tokens
   leak into QR payloads; the QR points to a signed storage URL or secure lookup.

5. **Logs all codec operations** to `ActivityLog` per BPAAA v3.0 compliance
   — what was encoded, by whom, when, and whether print succeeded.

---

## SCOPE

### In Scope (Phase 4)
- QR codec backend function (`encodeContractQR`, `encodeGlyphBucksBillQR`)
- Receipt template system (HTML → PDF / thermal format)
- Deterministic seed-based encoding (same contract always produces same QR)
- Audit logging for all encode + print operations
- Integration with `VenueContract` and `GlyphBucksBill` entities
- Signed URL generation for secure QR target links
- Mock thermal printer driver (for development)

### Out of Scope (Phase 5+)
- Hardware printer driver integration (Phase 5B)
- Barcode scanning / decoding (Phase 5C)
- Receipt reprinting / archival workflow (Phase 6)
- Multi-language receipt templates (Phase 8)

---

## ARCHITECTURE OUTLINE

### Backend Functions (New)
1. **`encodeContractQR`**
   - Input: `{ contract_id, contract_type, encoding_seed }`
   - Output: `{ qr_svg, qr_png_url, qr_hash, audit_id }`
   - Mode-stamped write to `ActivityLog` + `AuditEvent`
   - No PII in QR payload; points to signed `VenueContract.scanned_document_url`

2. **`encodeGlyphBucksBillQR`**
   - Input: `{ bill_id, denomination, encoding_seed }`
   - Output: `{ qr_svg, qr_png_url, bill_barcode, audit_id }`
   - Deterministic so reprints match original

3. **`generateReceiptHTML`**
   - Input: `{ type: "contract" | "glyphbucks" | "payout", entity_id, qr_url, ... }`
   - Output: `{ html, pdf_url }`
   - Venue-aware layout (venue logo, address, legal footer)

4. **`logReceiptPrint`**
   - Input: `{ receipt_id, printer_id, status: "sent" | "failed" }`
   - Output: `{ audit_id, logged_at }`
   - BPAAA-compliant audit trail

### Entities (Extend)
- **`VenueContract`** — add `qr_encoded_at`, `qr_seed`, `receipt_print_status`
- **`GlyphBucksBill`** — add `qr_encoded_at`, `qr_seed`, `barcode_value`
- New: **`ReceiptAuditLog`** — fields: receipt_id, contract_id, bill_id,
  generated_by, printed_by, printer_id, status, html_url, pdf_url, qr_hash,
  created_at, printed_at

### Frontend Integration
- Add "Encode QR & Print Receipt" button to `VIPContractFlow` and
  `GlyphBucksHub` components
- Display QR preview (SVG inline) before print commit
- Show print job status (queued/sent/failed) with retry UI

---

## EXECUTION GATES (Pre-Start Checklist)

- [ ] EXEC-01 (ID-01 Driver/Device Quarantine) is DONE and locked.
- [ ] Phase 0–3 (mode resolver, writeEntity, integrityCheck) live and verified.
- [ ] `PayoutSafetyLimit` entity is populated with venue-specific compliance thresholds.
- [ ] `ActivityLog` and `AuditEvent` entities exist and are writable by backend.
- [ ] QR code library (e.g., `qr-code-styling`, `qrcode`) is available in
  package.json and tested in existing projects.

---

## KNOWN DEPENDENCIES

- **From EXEC-01:** `DoorStationDevice`, `DeviceAuditEvent`, mode resolver,
  writeEntity gateway, BPAAA audit trail compliance.
- **From earlier phases:** `ActivityLog`, `AuditEvent`, `VenueRateConfig`,
  `VenueContract`, `GlyphBucksBill`, `DriverPayout` entities.
- **New secrets (if required):** None for core codec; thermal printer API keys
  (Phase 5B) deferred.

---

## RISK & MITIGATION

| Risk | Mitigation |
|---|---|
| **Encoding drift** — QR seed changes cause reprints to not match originals | Seed is immutable once written to VenueContract.qr_seed; backend enforces deterministic codec. |
| **PII leak into QR** — contract data (customer SSN, card #) ends up in QR payload | Backend encodes only contract_id (UUID); QR points to signed URL requiring authentication. |
| **Print failures leave no trace** | All print attempts logged to `ReceiptAuditLog` even if printer unreachable. |
| **No fallback if encoder fails** | Frontend shows "Encode failed — retry" button; audit event documents the failure. |

---

## SUCCESS CRITERIA

1. **Code proof** — `functions/encodeContractQR.js`, `functions/generateReceiptHTML.js`,
   and related files exist in repo.
2. **Entity proof** — `ReceiptAuditLog` live; `VenueContract` and `GlyphBucksBill`
   extended with qr_* and receipt_* fields.
3. **Live proof** — Frontend buttons functional; QR preview renders on demand.
4. **Audit proof** — `ActivityLog` entries exist for every encode + print operation.
5. **Regression proof** — existing POS/contract flows unchanged.

---

## RESUME INSTRUCTIONS (When Ready to Start)

1. Read this directive end-to-end.
2. Confirm all execution gates are green.
3. Fork a feature branch: `feature/qr-receipt-encoder`.
4. Implement backend functions in order: `encodeContractQR` →
   `encodeGlyphBucksBillQR` → `generateReceiptHTML` → `logReceiptPrint`.
5. Extend entities: `VenueContract`, `GlyphBucksBill`, and create `ReceiptAuditLog`.
6. Add UI buttons to `VIPContractFlow` and `GlyphBucksHub`.
7. Run integration tests on contract + glyphbucks flows.
8. Merge when all success criteria are met.

---

## FUTURE PHASES (Post-EXEC-02)

- **Phase 5A** — Thermal printer API integration (ESC/POS protocol)
- **Phase 5B** — Hardware printer driver + network discovery
- **Phase 5C** — Barcode scanning (camera + decoder)
- **Phase 6** — Receipt reprinting / archival UI
- **Phase 7** — Multi-language template engine

---

## CHANGE LOG

| Version | Date | Note |
|---|---|---|
| STUB-0 | 2026-06-13 | Initial stub. Awaiting EXEC-01 completion. |