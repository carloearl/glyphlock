# Contributing to GlyphLock

GlyphLock changes move through a controlled evidence path:

`task branch -> pull request -> NUPS CI -> review of invariants -> squash merge -> deployment -> smoke evidence -> verified release`

## Start a change

1. Update from `main` and create one purpose-named branch.
2. Keep the branch limited to one coherent objective.
3. Preserve the frozen rules and boundaries in `INVARIANTS.md`, `ARCHITECTURE.md`, and `AGENTS.md`.
4. Use the pull-request template. State what changed, what did not change, how it was verified, the production impact, and the rollback path.

Examples:

- `fix/nups-door-persistence`
- `feat/dce-closeout-carryover`
- `integration/oracle-ohip`
- `security/venue-write-boundary`
- `docs/partner-evidence-update`

## Merge requirements

- Direct pushes to `main` are prohibited.
- `Repository Governance / Validate protected controls` and `NUPS CI / Verify source and production build` must pass.
- Protected-control changes require the repository owner as author or an exact-head owner approval through the default-branch governance gate.
- The branch must be current with `main`.
- Material changes require explicit invariant review and evidence.
- Use squash merge with a descriptive conventional title.
- Do not merge unresolved review threads or knowingly broken intermediate states.

## Base44 changes

Base44 work follows the same branch and pull-request path. Base44 agents must not edit `.github/workflows/**`; extend required CI with a normal script, a `package.json` entry, and `.base44/ci-checks.json`. Base44 must not commit ordinary work directly to `main`.

## Release boundary

Merging proves only that the repository gate passed. A release becomes verified only after deployment and the applicable smoke, provider, browser, device, and operational checks are recorded for the exact commit.
