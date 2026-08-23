# GlyphLock Batch 18 Governed-Write Inventory

**App:** Main GlyphLock / NUPS  
**Base44 App ID:** `697a087fb354faebb72df54b`  
**Authority:** DACO / GlyphLock Engineering Protocol v5  
**Recorded:** 2026-08-23  
**Original direct-write baseline:** 287  
**Batch 18 start:** 161 / 287  
**Batch 18 end:** 120 / 287

Batch 18 migrated the 41 remaining classified live GlyphLock business mutations outside NUPS. Every target now uses the explicit server-governed `glyphlockWriteGateway` boundary or a caller-scoped equivalent selected by that boundary. No target is permitted to fall back to a direct frontend entity write.

## Scope families

| Scope | Meaning |
|---|---|
| `GOVERNANCE` | Platform decisions, registries, deployment evidence and retained audit state |
| `PLATFORM_ADMIN` | Administrative mutation requiring authenticated platform authority |
| `PUBLIC_INTAKE` | Rate-limited public creation with server-owned privileged fields |
| `USER_PRIVATE` | Authenticated self-owned preferences, conversations and private records |
| `CONTENT_OWNER` | Authenticated content owner or authorized administrator |
| `PARTNER` | Authenticated partner or platform administrator with partner/tier isolation |
| `GLOBAL_SYSTEM` | Explicit server action not delegated to an arbitrary client-selected entity |

## Reconciled workstreams

| Workstream | Calls |
|---|---:|
| Governance, registry, ADR and deployment evidence | 12 |
| Consultation, contact, preferences and private conversation | 8 |
| QR, hotspot and interactive-image lifecycle | 16 |
| Usage metering, feedback and partner content | 5 |
| **Total** | **41** |

## Governance, registry, ADR and deployment evidence

| Source | Former mutation | Governed action | Scope | Retention rule |
|---|---|---|---|---|
| `src/components/devengine/DeployPanel.jsx` | `AgentChangeSet.delete` | `archive_agent_change_set` | `GOVERNANCE` | Archive, actor, time and reason retained; applied evidence is not hard-deleted |
| `src/components/glyphlock/bot/logic/useGlyphBotAudit.jsx` | `GlyphBotAudit.create` | `glyphbot_audit_create` | `USER_PRIVATE` | Owner-bound audit record with bounded fields |
| same | `GlyphBotAudit.update` ×3 | `glyphbot_audit_update` | `USER_PRIVATE` | Owner/admin authorization and field allow-list |
| same | `GlyphBotAudit.delete` | `glyphbot_audit_archive` | `USER_PRIVATE` | Archive/unarchive rather than destructive deletion |
| `src/lib/registry/reconcileRegistry.js` | `FeatureRegistry.create` ×2 | `reconcile_feature_registry` | `GOVERNANCE` | Administrative, idempotent seed/crawl reconciliation; duplicate ids/routes and route collisions rejected |
| same | `FeatureRegistry.update` | `reconcile_feature_registry` | `GOVERNANCE` | Existing deprecated state preserved; safe differences only |
| `src/pages/ArchitecturalDecisionRegister.jsx` | `ArchitecturalDecisionRecord.create` | `adr_save` | `GOVERNANCE` | Unique ADR identity and explicit supersession relationship |
| same | `ArchitecturalDecisionRecord.update` ×2 | `adr_save` | `GOVERNANCE` | Approved/historical decision text immutable; superseding ADR required |

## Consultation, contact and private chat

| Source | Former mutation | Governed action | Scope | Boundary |
|---|---|---|---|---|
| `src/components/verification/VerificationIntakeForm.jsx` | `Consultation.create` | `consultation_submit` | `PUBLIC_INTAKE` | Schema-derived field allow-list, valid email, rate limit, server-owned submitted/unpaid defaults |
| `src/components/admin/AdminConsultations.jsx` | `Consultation.update` | `consultation_status` | `PLATFORM_ADMIN` | Administrative role and allowed status transition required |
| `src/pages/Contact.jsx` | `ContactEvent.create` | `contact_submit` | `PUBLIC_INTAKE` | Length/format validation, rate limit, pending status and server-derived request fingerprint |
| same | `ContactEvent.update` | `contact_submit` | `PUBLIC_INTAKE` | Delivery result stamped by server after email attempt |
| `src/components/Chat.jsx` | `UserPreferences.create` | `preferences_save` | `USER_PRIVATE` | Authenticated caller-scoped entity/RLS; bounded voice configuration |
| same | `UserPreferences.update` | `preferences_save` | `USER_PRIVATE` | Self-owned record only |
| same | `Conversation.create` | `conversation_save` | `USER_PRIVATE` | Authenticated caller-scoped create, bounded title/messages |
| same | `Conversation.update` | `conversation_save` | `USER_PRIVATE` | Caller-scoped lookup/update; service role cannot bypass ownership |

Private conversation bodies are not copied into the generic app-wide audit. Audit evidence stores record identity, operation, safe counts and before/after hashes.

## QR, hotspot and interactive images

| Source | Former mutation | Governed action | Scope | Boundary |
|---|---|---|---|---|
| `src/components/glyphlock/HotspotPayloadConfig.jsx` | `HotspotPayload.delete` | `hotspot_payload_archive` | `CONTENT_OWNER` | Administrative archive evidence, no ordinary hard delete |
| `src/components/imageLab/tabs/GalleryTab.jsx` | `InteractiveImage.delete` ×2 | `interactive_image_archive` | `CONTENT_OWNER` | Owner/admin check; archive, revoke and unpublish |
| `src/components/imageLab/tabs/InteractiveTab.jsx` | `InteractiveImage.create` | `interactive_image_create` | `CONTENT_OWNER` | Authenticated owner and server-owned identifiers/status |
| same | `InteractiveImage.update` ×2 | `interactive_image_update` / `interactive_image_finalize` | `CONTENT_OWNER` | Owner/admin check, draft-only edits, bounded hotspots and immutable finalization hash |
| `src/components/studio/EditorTab.jsx` | `InteractiveImage.create` | `interactive_image_create` | `CONTENT_OWNER` | Same canonical owner boundary |
| `src/components/qr/QrBatchUploader.jsx` | `QRGenHistory.create` | `qr_record_generation` | `CONTENT_OWNER` or `PUBLIC_INTAKE` | Server-derived creator, hourly limit, bounded records and payload hash |
| `src/components/qr/QrPreviewPanel.jsx` | `QrPreview.create` | `qr_preview_save` | `USER_PRIVATE` | Authenticated user, bounded preview cache |
| `src/components/qr/QrPreviewStorage.jsx` | `QrPreview.create` | `qr_preview_save` | `USER_PRIVATE` | Owner-scoped create |
| same | `QrPreview.update` | `qr_preview_vault` | `USER_PRIVATE` | Owner/admin check and vault evidence |
| same | `QrPreview.delete` ×2 | `qr_preview_remove` | `USER_PRIVATE` | Vaulted previews archive; only ephemeral non-vaulted cache rows may hard-delete |
| `src/components/qr/QrStudio.jsx` | `QRGenHistory.create` | `qr_record_generation` | `CONTENT_OWNER` or `PUBLIC_INTAKE` | Canonical generation path |
| same | `QRAIScore.create` | `qr_record_generation` | `CONTENT_OWNER` or `PUBLIC_INTAKE` | AI score created with the generation record and bounded fields |
| same | `QrPreview.delete` | `qr_preview_remove` | `USER_PRIVATE` | Owner/admin and cache-versus-vault retention rule |

## Usage, feedback and partner content

| Source | Former mutation | Governed action | Scope | Boundary |
|---|---|---|---|---|
| `src/components/FreeTrialGuard.jsx` | `ServiceUsage.create` ×2 | `service_usage_check` | `USER_PRIVATE` or `PUBLIC_INTAKE` | Server-derived subject, allowed services, nonnegative monotonic count and request-id idempotency |
| `src/components/glyphbot/FeedbackWidget.jsx` | `LLMFeedback.create` | `llm_feedback_submit` | `USER_PRIVATE` or `PUBLIC_INTAKE` | Rating allow-list, rate limit, bounded feedback; prompt/response snippets deliberately blank |
| `src/components/partners/DocumentCenter.jsx` | `PartnerDocument.update` | `partner_document_access` | `PARTNER` | Server-resolved partner, cross-partner denial, append-only access evidence; file URL only after authorization |
| `src/components/partners/MarketingCollateral.jsx` | `MarketingAsset.update` | `marketing_asset_download` | `PARTNER` | Active asset, partner-tier enforcement, append-only download event and server-updated count |

## App-wide audit boundary

Every governed action writes `GlyphLockWriteAudit` with:

```text
action
entity
record id
operation
actor
actor role
scope
owner reference
intent
fields changed
before hash
after hash
result
reason
safe metadata
timestamp
```

The audit is append-only. Generic audit metadata does not accept passwords, OTPs, PINs, bearer tokens, API secrets, private file URIs, signed URLs, raw documents, full identity numbers, tax identifiers or biometric content.

## Final direct-write classification

| Category | Count |
|---|---:|
| Live high-risk NUPS business bypasses | 0 |
| Live-medium NUPS business bypasses | 0 |
| Live GlyphLock business bypasses outside NUPS | 0 |
| Explicit security/admin audit events | 33 |
| Domain events | 12 |
| Operational telemetry | 13 |
| Demo | 16 |
| Seed | 15 |
| Sandbox | 7 |
| Legacy/unmounted | 9 |
| Gateway/audit internals | 15 |
| **Total retained** | **120** |

The retained 120 calls are classified evidence, controlled non-production utilities, compatibility code or canonical gateway internals. They are not silently deleted to manufacture a lower score.
