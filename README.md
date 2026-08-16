# GlyphLock

Canonical source repository for the current GlyphLock Base44 application.

## Source of truth

This repository is the active Base44-backed GlyphLock codebase. The application uses Vite/React with `@base44/sdk` and `@base44/vite-plugin`, and Base44 automation writes changes to the `main` branch.

Older repositories under this account may contain historical prototypes, experiments, or unrelated earlier implementations. They should not be treated as the current production source unless a file or commit is explicitly migrated here.

## Current platform surfaces

- GlyphLock homepage and public platform experience
- NUPS venue operations platform
- QR Studio and verification tooling
- Governance Hub / Master Covenant documentation
- GlyphBot AI workflows
- Image Lab
- GlyphLock Financial operational tooling
- Security Operations
- Creative/DJ tooling

## Development

```bash
npm ci
npm run typecheck
npm run build
npm run dev
```

## Repository policy

- `main` is the canonical branch for the current Base44 application.
- Public claims in website copy should be evidence-backed and clearly distinguish internal standards, demonstrations, pending work, third-party certifications, and independently verified facts.
- Do not commit credentials, API keys, OAuth tokens, private customer records, or regulated personal data.
- Historical experiments should be archived rather than mixed into the current application unless intentionally migrated.

## Legacy repositories

The following repositories may represent historical/alternate projects and should not be confused with this codebase:

- `carloearl/GlyphlockLLC-v0-skin-cabaret-site` — older Next.js/v0 project
- `carloearl/https-github.com-GlyphlockLLC-v0-skin-cabaret-site` — empty accidental repository
- `carloearl/glyphlock-copy` — private duplicate/backup pending archive review
- `carloearl/Master-Covenant-Protocol-Site` — separate Master Covenant project

## Security and disclosure

Before making this repository public, review commit history and tracked files for secrets or private data. Changing a repository from private to public exposes its full reachable Git history, not only the current working tree.
