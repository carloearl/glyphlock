# NUPS-RG-01 Evidence Index

## Evidence Discipline

The audit separates:

1. **Planning evidence**: what was intended.
2. **Source evidence**: what exists in files.
3. **Route evidence**: what is mounted or linked.
4. **Compile/static evidence**: what passes non-mutating checks.
5. **Published asset evidence**: what bundle the public origins serve.
6. **Authenticated browser evidence**: what a real role sees.
7. **Provider/hardware evidence**: what works with external systems and devices.

No stronger class was inferred from a weaker one.

## Evidence Register

| ID | Evidence | Class | Location/identifier | Supports | Confidence |
| --- | --- | --- | --- | --- | --- |
| E-001 | Baseline commit | GitHub/Base44 | ebc520bf0fe9444cc9103c864c66aa6704d79fbb | Exact RG-01 source evidence freeze | High |
| E-002 | Current main | GitHub/Base44 | ae10db138a3caf4df46dc9ab2d5b85b275fd2f23 | Main advanced one package-update commit after baseline | High |
| E-003 | Audit branch | GitHub | audit/nups-rg-01-phase-1-18-baseline | Created from baseline; later fast-forward only if needed to keep PR docs-only | High |
| E-004 | Baseline CI | GitHub Actions | run 22323285961 | NUPS CI succeeded on exact baseline | High |
| E-005 | Published index assets | Public HTTP | index-UgdpG7wn.js; index-BCZXi6OH.css | Both public origins use same published family | High |
| E-006 | Published kiosk asset | Public HTTP | NUPSKiosk-QsiYU1fT.js | Older kiosk strings and no liveRequest | High |
| E-007 | Baseline kiosk asset | Exact local build | NUPSKiosk-BBYls9Gu.js | Contains liveRequest and repaired fullscreen text | High |
| E-008 | Route inventory | Static analysis | src/App.jsx; NUPSAppShell | 171 routes, 64 duplicate groups, 37 NUPS nav destinations | High |
| E-009 | Zero-byte inventory | Static analysis | src/pages; src/components; src/lib; src/hooks | 75 zero-byte source files | High |
| E-010 | Master roadmap | Recovered conversation context | GL-MASTER-23 | Working Phase 1–18 titles; no exact repository/Drive source found | Medium |
| E-011 | Historical NUPS phases | Repository | docs/audits/NUPS_BUILD_PHASE_AUDIT_2026-07-26.md | Separate NUPS 0–12 namespace | High |
| E-012 | QR/OMEGA reports | Repository | src/docs/internal_index/*PHASE*; OMEGA* | Separate QR and OMEGA namespaces | High |
| E-013 | W3-012A | Repository | src/docs/governance/DACO-W3-012A-UIX-001.md | Additive UI plan, not business logic or live proof | High |
| E-014 | Batch 15–18 | Repository | docs/audits/*BATCH* | Backend governance/migration evidence | High |
| E-015 | Static check suite | Exact baseline temp worktree | npm scripts listed in baseline report | All required checks passed after valid Git context | High |
| E-016 | Dependency audit | Exact baseline | npm audit --omit=dev | 18 production advisories: 12 high, 6 moderate | High |
| E-017 | Dependency remediation PR | GitHub | #21 | Open, non-mergeable, stale-base remediation candidate | High |
| E-018 | Transaction read finding | Source/RLS | App.jsx; NUPSHub.jsx; POSTransaction.jsonc | Validated static cross-venue exposure path | High |
| E-019 | Supabase inventory | Connected Supabase | two inactive projects | No canonical active production project selected | High |
| E-020 | Google Drive search | Connected Drive | three exact/broadened roadmap searches | No authoritative Phase 1–18 planning document found | Medium |
| E-021 | Browser acceptance limitation | Audit environment | no Chromium/Playwright/Puppeteer | Interactive viewport and authenticated proof blocked | High |

## Exact Source Anchors

- `src/App.jsx:58-117`: global auth/public/fullscreen route classification.
- `src/App.jsx:224-276`: operational/accounting route definitions.
- `src/pages/NUPSHub.jsx:89-105`: user lookup and unfiltered `POSTransaction.list`.
- `base44/entities/POSTransaction.jsonc`: transaction fields and broad read RLS.
- `src/components/nups/RoleClassGuard.jsx`: server-verified role-class gate.
- `src/components/nups/KioskSessionGuard.jsx`: server-validated kiosk session gate.
- `src/lib/nups/roleClass.js:15-75`: canonical role classes and homes.
- `src/lib/nups/workspaceConfig.js:22-271`: workspace modules and path detection.
- `src/pages/NUPSKiosk.jsx`: public kiosk panels.
- `src/components/nups/kiosk/AccessRequestForm.jsx`: request UI/mode behavior.
- `base44/functions/nupsAccessControl/entry.ts`: request, status, access and decision policy.
- `scripts/check-nups-sensitive-read-boundaries.mjs:6-43`: current sensitive-read test coverage, excluding NUPSHub.
- `docs/NUPS-CURRENT-HANDOFF.md`: backend engineering and release boundary.
- `docs/audits/GLYPHLOCK-BATCH18-VERIFICATION.md`: governed-write migration evidence.
- `docs/audits/GLYPHLOCK-RELEASE18-EXECUTION-STATE.md`: integration/release state.
- `.github/workflows/cloudflare-edge-guard-preflight.yml`: edge deployment preflight source.
- `src/supabase/*` and `base44/functions/supabaseProxy/entry.ts`: optional/fail-closed Supabase source.

## Evidence Not Available

- Exact original Phase 1–18 prompt/document with detailed acceptance criteria.
- Interactive browser screenshots at the four required viewports.
- Authenticated role sessions and OTPs.
- Physical scanner, camera, printer, terminal and audio acceptance.
- Live provider checkout/webhook/refund proof.
- Live Cloudflare inventory/deployment state.
- End-to-end OpenAI provider output.
