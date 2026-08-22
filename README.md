# GlyphLock

GlyphLock is the canonical source repository for the GlyphLock platform and its Base44 application.

GlyphLock builds custom software, AI-assisted workflows, verification tooling, operational systems, and the flagship **NUPS (Nexus Unified POS System)** venue-operations platform.

## Canonical project

- Website: https://glyphlock.io
- Repository: `carloearl/glyphlock`
- Primary branch: `main`
- App platform: Base44

This repository is the active codebase. Older GlyphLock repositories may contain experiments, prototypes, archived concepts, or superseded implementations and should not be treated as the current source of truth.

## Major platform areas

- **NUPS** — venue operations, POS/register workflows, contracts, staff workflows, payouts, reporting, audit records, and integration surfaces.
- **QR Studio** — QR generation, payload tooling, verification, scan workflows, and related vault/record features.
- **GlyphBot** — AI-assisted research, analysis, support, coding, and workflow tooling.
- **Image Lab** — image-generation and interactive-image workflows.
- **GlyphLock Financial** — operational ledger, settlement, payout, and reporting interfaces.
- **Security Operations** — access-control, monitoring, audit, and security-operation surfaces.
- **Governance Hub** — GlyphLock governance documentation and operating frameworks.
- **Creative tooling** — including DJ/audio interfaces and related experimental modules.

## Public-claims policy

GlyphLock distinguishes between:

1. features implemented in this repository;
2. internal standards or research frameworks;
3. integrations or interoperability work;
4. third-party certifications, registrations, partnerships, patents, court rulings, or regulatory approvals.

A third-party name appearing in code or documentation does **not** by itself mean endorsement, partnership, certification, or legal validation. External claims should be supported by independent documentation before being presented as verified fact.

See [`docs/PUBLIC_CLAIMS_POLICY.md`](docs/PUBLIC_CLAIMS_POLICY.md).

## Development

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run build
```

Additional scripts are documented in `package.json`.

## Secrets and credentials

Do not commit credentials, service-role keys, API secrets, OAuth tokens, private keys, or `.env` files. Runtime secrets must be supplied through the appropriate environment or platform secret store.

See [`SECURITY.md`](SECURITY.md).

## Repository visibility

This repository is intentionally public for transparency and technical review. Public visibility does not grant rights beyond those provided by an explicit license or applicable law.

## Status

GlyphLock is under active development. Individual modules vary in maturity, and public documentation should accurately distinguish production functionality, sandbox functionality, prototypes, research, and planned work.
