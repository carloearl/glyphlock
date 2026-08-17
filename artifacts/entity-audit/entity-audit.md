# Base44 Entity Model Audit

Generated: 2026-08-17T15:30:34.096Z

## Summary

- Registry entities: **163**
- Source files scanned: **1153**
- Referenced entities: **100**
- Unreferenced entities: **63**
- Entities with direct SDK writes: **68**
- Critical entities with direct SDK writes: **21**

## Normalized duplicate names

- QrScanEvent / QRScanEvent

## Critical entities with direct frontend writes

| Entity | Domain | Writes | Gateway mentions | Source files |
|---|---|---:|---:|---:|
| DriverPayout | financial | 15 | 1 | 28 |
| POSTransaction | financial | 10 | 2 | 51 |
| NUPSUser | identity-access | 9 | 0 | 39 |
| VenueContract | contracts-compliance | 9 | 0 | 16 |
| APIKey | security-audit | 6 | 1 | 8 |
| GlyphBucksOrder | financial | 5 | 1 | 17 |
| SystemConfig | security-audit | 5 | 0 | 5 |
| VIPContractRecord | contracts-compliance | 5 | 0 | 14 |
| ContractTermsConfig | contracts-compliance | 4 | 0 | 4 |
| GlyphBucksTransaction | financial | 4 | 0 | 10 |
| PayrollRecord | financial | 3 | 0 | 11 |
| ContractorPayout | financial | 2 | 0 | 11 |
| ContractorTaxForm | financial | 2 | 0 | 3 |
| UserRoleAssignment | identity-access | 2 | 0 | 3 |
| GlyphBucksBatch | financial | 1 | 0 | 3 |
| GlyphBucksBill | financial | 1 | 0 | 7 |
| JournalEntry | financial | 1 | 1 | 8 |
| LedgerAccount | financial | 1 | 0 | 2 |
| POSZReport | financial | 1 | 1 | 10 |
| TipPayout | financial | 1 | 0 | 10 |
| VIPContract | contracts-compliance | 1 | 0 | 7 |

## Unreferenced registry entities

- AccessibilityAuditRow (security-audit, high)
- AgentAuditRow (security-audit, high)
- AgentRuntimeModule (agent-ai, standard)
- AlertThreshold (general, standard)
- AnalyticsPrediction (agent-ai, standard)
- AssetRegistry (content-media, medium)
- AuditComment (security-audit, high)
- AuditReport (contracts-compliance, high)
- AuthenticatorCredential (identity-access, critical)
- BackendAuditRow (security-audit, high)
- BarcodeRegistry (qr-barcode, medium)
- BlockchainProofExport (security-audit, high)
- BrowserAgentSession (agent-ai, standard)
- ChargebackEvidence (financial, high)
- CollaborationSession (general, standard)
- ComponentRegistry (platform-governance, medium)
- ContentAuditRow (security-audit, high)
- CrowdMetrics (venue-operations, standard)
- CustomerIdentity (identity-access, critical)
- DomainAuditRow (security-audit, high)
- FeatureAuditRow (security-audit, high)
- FileStorage (content-media, standard)
- FinancialResolutionLog (general, standard)
- GlyphBotFeedback (agent-ai, standard)
- GlyphBotMemory (agent-ai, standard)
- ImageGenAttempt (agent-ai, standard)
- ImageGenAudit (security-audit, high)
- IntegrationTestAuditRow (security-audit, high)
- JukeboxRequest (content-media, standard)
- NavAuditRow (security-audit, high)
- PaymentProvider (financial, critical)
- PaymentVerificationLog (financial, critical)
- PayoutSafetyLimit (financial, critical)
- PerformanceAnalytics (general, standard)
- PerformanceAuditRow (security-audit, high)
- PlatformDecisions (platform-governance, standard)
- PromptSpec (agent-ai, standard)
- QRKeyRegistry (qr-barcode, medium)
- QrVersion (qr-barcode, standard)
- ReconciliationRecord (financial, high)
- ReferenceImage (content-media, standard)
- RouteAuditRow (security-audit, high)
- ScanConfig (qr-barcode, medium)
- ScanRun (qr-barcode, standard)
- SecureQRCode (security-audit, high)
- SecurityAlert (security-audit, critical)
- SecurityAuditRow (security-audit, high)
- SeoAuditRow (security-audit, high)
- SharedAuditAccess (security-audit, high)
- SIEActionLog (platform-governance, standard)
- SieComponentRecord (platform-governance, standard)
- SieFeatureRecord (platform-governance, standard)
- SieFindingRecord (platform-governance, standard)
- SiePageRecord (platform-governance, standard)
- SieRouteRecord (platform-governance, standard)
- SieScanRun (qr-barcode, standard)
- SitemapAuditRow (security-audit, high)
- StegoAsset (content-media, standard)
- SystemSnapshot (security-audit, high)
- UxAuditRow (security-audit, high)
- VenuePaymentConfig (financial, critical)
- VerificationToken (identity-access, critical)
- VoiceProfile (agent-ai, standard)

## Full inventory

| Entity | Domain | Risk | Status | Reads | Writes | Gateway | Files |
|---|---|---|---|---:|---:|---:|---:|
| AgentChangeSet | agent-ai | standard | direct-write | 1 | 1 | 0 | 1 |
| AgentRuntimeModule | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| AnalyticsPrediction | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| BrowserAgentSession | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| GlyphBotActivityLog | agent-ai | standard | direct-write | 0 | 1 | 0 | 1 |
| GlyphBotChat | agent-ai | standard | referenced | 3 | 0 | 1 | 4 |
| GlyphBotFeedback | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| GlyphBotMemory | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| ImageGenAttempt | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| LLMFeedback | agent-ai | standard | direct-write | 0 | 1 | 0 | 2 |
| PromptSpec | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| VoiceProfile | agent-ai | standard | unreferenced | 0 | 0 | 0 | 0 |
| AssetRegistry | content-media | medium | unreferenced | 0 | 0 | 0 | 0 |
| FileStorage | content-media | standard | unreferenced | 0 | 0 | 0 | 0 |
| Hotspot | content-media | standard | referenced | 2 | 0 | 0 | 9 |
| HotspotMap | content-media | standard | referenced | 1 | 0 | 0 | 1 |
| HotspotPayload | content-media | standard | direct-write | 2 | 1 | 0 | 2 |
| ImageHashLog | content-media | standard | referenced | 1 | 0 | 0 | 2 |
| ImageHotspot | content-media | standard | referenced | 0 | 0 | 0 | 1 |
| InteractiveImage | content-media | standard | direct-write | 10 | 6 | 1 | 12 |
| InteractiveImageShare | content-media | standard | referenced | 1 | 0 | 0 | 1 |
| JukeboxRequest | content-media | standard | unreferenced | 0 | 0 | 0 | 0 |
| MarketingAsset | content-media | standard | direct-write | 1 | 1 | 0 | 1 |
| Playlist | content-media | standard | referenced | 0 | 0 | 0 | 10 |
| ReferenceImage | content-media | standard | unreferenced | 0 | 0 | 0 | 0 |
| StegoAsset | content-media | standard | unreferenced | 0 | 0 | 0 | 0 |
| Track | content-media | standard | referenced | 0 | 0 | 0 | 30 |
| AuditReport | contracts-compliance | high | unreferenced | 0 | 0 | 0 | 0 |
| Consultation | contracts-compliance | high | direct-write | 0 | 2 | 1 | 44 |
| ContractTermsConfig | contracts-compliance | critical | direct-write | 3 | 4 | 0 | 4 |
| ResolutionRequest | contracts-compliance | high | referenced | 2 | 0 | 0 | 1 |
| SealRecord | contracts-compliance | high | referenced | 0 | 0 | 0 | 1 |
| VenueContract | contracts-compliance | critical | direct-write | 8 | 9 | 0 | 16 |
| VerificationMedia | contracts-compliance | high | referenced | 0 | 0 | 0 | 1 |
| VIPContract | contracts-compliance | critical | direct-write | 2 | 1 | 0 | 7 |
| VIPContractRecord | contracts-compliance | critical | direct-write | 6 | 5 | 0 | 14 |
| VIPShowContract | contracts-compliance | critical | referenced | 5 | 0 | 3 | 5 |
| ChargebackEvidence | financial | high | unreferenced | 0 | 0 | 0 | 0 |
| ChartOfAccounts | financial | high | direct-write | 1 | 4 | 0 | 1 |
| ContractorPayout | financial | critical | direct-write | 5 | 2 | 0 | 11 |
| ContractorTaxForm | financial | critical | direct-write | 2 | 2 | 0 | 3 |
| DailySettlement | financial | critical | referenced | 9 | 0 | 3 | 20 |
| DriverPayout | financial | critical | direct-write | 13 | 15 | 1 | 28 |
| GlyphBucksBatch | financial | critical | direct-write | 0 | 1 | 0 | 3 |
| GlyphBucksBill | financial | critical | direct-write | 2 | 1 | 0 | 7 |
| GlyphBucksLedger | financial | critical | referenced | 0 | 0 | 0 | 2 |
| GlyphBucksOrder | financial | critical | direct-write | 9 | 5 | 1 | 17 |
| GlyphBucksSale | financial | critical | referenced | 0 | 0 | 0 | 1 |
| GlyphBucksTransaction | financial | critical | direct-write | 4 | 4 | 0 | 10 |
| JournalEntry | financial | critical | direct-write | 4 | 1 | 1 | 8 |
| LedgerAccount | financial | critical | direct-write | 2 | 1 | 0 | 2 |
| PaymentProvider | financial | critical | unreferenced | 0 | 0 | 0 | 0 |
| PaymentRecord | financial | critical | referenced | 0 | 0 | 0 | 2 |
| PaymentVerificationLog | financial | critical | unreferenced | 0 | 0 | 0 | 0 |
| PayoutSafetyLimit | financial | critical | unreferenced | 0 | 0 | 0 | 0 |
| PayrollRecord | financial | critical | direct-write | 6 | 3 | 0 | 11 |
| POSBatch | financial | high | direct-write | 18 | 6 | 1 | 28 |
| POSCampaign | financial | high | direct-write | 1 | 1 | 1 | 3 |
| POSCustomer | financial | high | direct-write | 5 | 3 | 1 | 9 |
| POSInventoryBatch | financial | high | direct-write | 1 | 1 | 1 | 3 |
| POSLocation | financial | high | direct-write | 0 | 2 | 1 | 3 |
| POSProduct | financial | high | direct-write | 4 | 10 | 1 | 14 |
| POSTransaction | financial | critical | direct-write | 24 | 10 | 2 | 51 |
| POSZReport | financial | critical | direct-write | 8 | 1 | 1 | 10 |
| ReconciliationException | financial | high | referenced | 2 | 0 | 0 | 1 |
| ReconciliationRecord | financial | high | unreferenced | 0 | 0 | 0 | 0 |
| TipPayout | financial | critical | direct-write | 5 | 1 | 0 | 10 |
| VenuePaymentConfig | financial | critical | unreferenced | 0 | 0 | 0 | 0 |
| VenueRateConfig | financial | high | direct-write | 9 | 6 | 0 | 19 |
| ActivityLog | general | standard | direct-write | 9 | 9 | 0 | 30 |
| AlertThreshold | general | standard | unreferenced | 0 | 0 | 0 | 0 |
| BotFeedback | general | standard | referenced | 1 | 0 | 0 | 2 |
| CollaborationSession | general | standard | unreferenced | 0 | 0 | 0 | 0 |
| ContactEvent | general | standard | direct-write | 0 | 2 | 0 | 1 |
| Conversation | general | standard | direct-write | 1 | 2 | 0 | 8 |
| ConversationStorage | general | standard | referenced | 2 | 0 | 0 | 1 |
| DemoLead | general | standard | referenced | 0 | 0 | 0 | 1 |
| FinancialResolutionLog | general | standard | unreferenced | 0 | 0 | 0 | 0 |
| Partner | general | standard | referenced | 1 | 0 | 0 | 7 |
| PartnerDocument | general | standard | direct-write | 1 | 1 | 0 | 1 |
| PartnerLead | general | standard | referenced | 3 | 0 | 0 | 3 |
| PerformanceAnalytics | general | standard | unreferenced | 0 | 0 | 0 | 0 |
| ServiceUsage | general | standard | direct-write | 2 | 2 | 1 | 3 |
| AIDJPersona | identity-access | high | referenced | 0 | 0 | 0 | 2 |
| AssentEvidence | identity-access | critical | referenced | 0 | 0 | 0 | 1 |
| AuthenticatorCredential | identity-access | critical | unreferenced | 0 | 0 | 0 | 0 |
| CustomerIdentity | identity-access | critical | unreferenced | 0 | 0 | 0 | 0 |
| DriverProfile | identity-access | high | direct-write | 5 | 7 | 0 | 8 |
| Entertainer | identity-access | high | direct-write | 18 | 10 | 1 | 82 |
| EntertainerShift | identity-access | high | direct-write | 12 | 4 | 1 | 23 |
| GuestProfile | identity-access | high | direct-write | 3 | 4 | 0 | 5 |
| NUPSAccessRequest | identity-access | high | referenced | 0 | 0 | 0 | 1 |
| NUPSUser | identity-access | critical | direct-write | 32 | 9 | 0 | 39 |
| PersonRecord | identity-access | high | direct-write | 2 | 1 | 0 | 2 |
| PlatformRole | identity-access | high | referenced | 0 | 0 | 0 | 1 |
| UserPreferences | identity-access | high | direct-write | 2 | 2 | 0 | 2 |
| UserRoleAssignment | identity-access | critical | direct-write | 1 | 2 | 0 | 3 |
| VerificationToken | identity-access | critical | unreferenced | 0 | 0 | 0 | 0 |
| ArchitecturalDecisionRecord | platform-governance | standard | direct-write | 1 | 3 | 0 | 1 |
| BuilderActionLog | platform-governance | standard | referenced | 0 | 0 | 0 | 2 |
| ComponentRegistry | platform-governance | medium | unreferenced | 0 | 0 | 0 | 0 |
| FeatureRegistry | platform-governance | medium | direct-write | 4 | 3 | 0 | 3 |
| PlatformDecisions | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SIEActionLog | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SieComponentRecord | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SieFeatureRecord | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SieFindingRecord | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SiePageRecord | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| SieRouteRecord | platform-governance | standard | unreferenced | 0 | 0 | 0 | 0 |
| BarcodeRegistry | qr-barcode | medium | unreferenced | 0 | 0 | 0 | 0 |
| QRAIScore | qr-barcode | standard | direct-write | 0 | 1 | 1 | 3 |
| QrAsset | qr-barcode | standard | referenced | 4 | 0 | 0 | 2 |
| QRGenHistory | qr-barcode | standard | direct-write | 1 | 2 | 1 | 6 |
| QRKeyRegistry | qr-barcode | medium | unreferenced | 0 | 0 | 0 | 0 |
| QrPreview | qr-barcode | standard | direct-write | 4 | 6 | 2 | 4 |
| QrScanEvent | qr-barcode | medium | duplicate-name | 2 | 0 | 0 | 3 |
| QRScanEvent | qr-barcode | medium | duplicate-name | 0 | 1 | 0 | 1 |
| QrVersion | qr-barcode | standard | unreferenced | 0 | 0 | 0 | 0 |
| ScanConfig | qr-barcode | medium | unreferenced | 0 | 0 | 0 | 0 |
| ScanRun | qr-barcode | standard | unreferenced | 0 | 0 | 0 | 0 |
| SieScanRun | qr-barcode | standard | unreferenced | 0 | 0 | 0 | 0 |
| AccessibilityAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| AgentAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| APIKey | security-audit | critical | direct-write | 10 | 6 | 1 | 8 |
| AuditComment | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| AuditEvent | security-audit | high | direct-write | 5 | 7 | 0 | 16 |
| BackendAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| BlockchainActivity | security-audit | high | direct-write | 2 | 4 | 0 | 2 |
| BlockchainProofExport | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| ContentAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| DomainAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| FeatureAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| GlyphBotAudit | security-audit | high | direct-write | 4 | 5 | 0 | 3 |
| ImageGenAudit | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| IntegrationTestAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| MigrationAuditLog | security-audit | high | direct-write | 0 | 1 | 0 | 2 |
| NavAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| PerformanceAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| QRThreatLog | security-audit | high | direct-write | 2 | 1 | 2 | 6 |
| RateLimitAttempt | security-audit | high | referenced | 0 | 0 | 0 | 1 |
| RouteAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SecureQRCode | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SecurityAlert | security-audit | critical | unreferenced | 0 | 0 | 0 | 0 |
| SecurityAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SeoAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SharedAuditAccess | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SiteAudit | security-audit | high | referenced | 0 | 0 | 0 | 3 |
| SitemapAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| SystemAuditLog | security-audit | high | direct-write | 10 | 46 | 0 | 36 |
| SystemConfig | security-audit | critical | direct-write | 11 | 5 | 0 | 5 |
| SystemSnapshot | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| UxAuditRow | security-audit | high | unreferenced | 0 | 0 | 0 | 0 |
| CrowdMetrics | venue-operations | standard | unreferenced | 0 | 0 | 0 | 0 |
| DailyChecklistConfig | venue-operations | medium | direct-write | 1 | 2 | 0 | 2 |
| FrontDoorConfig | venue-operations | medium | direct-write | 1 | 2 | 0 | 3 |
| StaffShift | venue-operations | standard | direct-write | 7 | 2 | 2 | 11 |
| Venue | venue-operations | standard | direct-write | 13 | 2 | 0 | 91 |
| VenueHardware | venue-operations | standard | referenced | 5 | 0 | 0 | 5 |
| VIPConfig | venue-operations | medium | direct-write | 2 | 1 | 0 | 1 |
| VIPGuest | venue-operations | standard | direct-write | 14 | 12 | 1 | 24 |
| VIPRoom | venue-operations | standard | direct-write | 16 | 11 | 1 | 24 |
| VIPSession | venue-operations | standard | direct-write | 1 | 1 | 0 | 2 |
| VIPSessionReport | venue-operations | standard | direct-write | 0 | 1 | 0 | 2 |
