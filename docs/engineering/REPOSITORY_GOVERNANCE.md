# GlyphLock Repository Governance

Status: authoritative engineering control for `carloearl/glyphlock`

## Canonical flow

All work uses this sequence:

`main -> task branch -> pull request -> required NUPS CI -> squash merge -> deployment -> smoke evidence -> verified tag`

The branch is the workspace. The pull request is the review and evidence record. `main` contains only the final descriptive squash commit for each accepted change.

## Required GitHub control

The `main` branch ruleset must enforce:

- pull request before merge;
- required status check `NUPS CI / Verify source and production build`;
- branch current with `main` before merge;
- force pushes blocked;
- branch deletion blocked;
- direct pushes blocked for humans and automation during ordinary work;
- no standing Base44 bypass for ordinary changes;
- owner bypass reserved for time-bounded recovery when the protected workflow itself is unavailable.

Mandatory approval count may remain zero while the core team is small. The non-negotiable controls are pull-request routing, required CI, current branches, and protected history.

Cloudflare Edge Guard is not a universal merge gate while it depends on environment-specific protected credentials. Require its workflow for Cloudflare, edge-security, or deployment changes after the credential path is configured; keep NUPS CI universal.

## Base44 synchronization boundary

Base44 remains the canonical runtime and deployment surface, but it is not permitted to treat `main` as a working branch. A Base44 session must use a purpose-named branch or an equivalent branch-bound synchronization path, produce a pull request, and pass the same gate as human or Codex changes.

Because the installed Base44 GitHub App does not have `workflows: write`, Base44 must not mutate `.github/workflows/**`. It extends CI by adding a normal check script, registering an npm script, and adding that script to `.base44/ci-checks.json`.

If the connected Base44 workflow cannot target a non-default branch, stop the GitHub synchronization before ordinary work and use the Base44 sandbox for implementation plus an admin-capable GitHub connection for the branch/PR handoff. Do not weaken protection to keep direct-to-`main` synchronization convenient.

## Material-change test

A change is material when a changed result could affect:

- money, sales, payments, cash/card treatment, liability, payouts, tips, settlement, accounting, or closeout;
- identity, authentication, permissions, approvals, role grants, deletion, signatures, contracts, or evidence;
- REAL/DEMO/SANDBOX separation or venue, device, tenant, session, and production-data boundaries;
- schemas, production write paths, audit logs, security controls, APIs, webhooks, MCP tools, or provider integrations;
- externally observable behavior in a real operational workflow.

Material changes require explicit invariant review, focused tests, green required CI, production-impact analysis, and rollback evidence. A change is light only when it cannot alter behavior, security, accessibility, public claims, or operational outcomes.

## Merge and commit hygiene

- Use purpose-named branches.
- Use descriptive conventional pull-request titles.
- Squash merge.
- Never merge `External agent changes` or another non-descriptive title to `main`.
- Preserve old history; do not rewrite it for appearance.
- Keep failed intermediate agent commits on task branches, where the final squash removes them from the authoritative `main` narrative.

## Verified baseline gate

Do not tag a baseline until the exact merge commit has:

1. green required CI;
2. deployment evidence for the intended environment;
3. applicable browser, provider, hardware, security, and operational smoke evidence;
4. known limitations and blocked gates recorded;
5. a tested or explicitly documented rollback SHA.

Use the tag form `nups-vMAJOR.MINOR.PATCH[-qualifier]`. The release record must identify the commit, CI run, deployment, tests, limitations, and rollback. A candidate with open acceptance gates is not a verified release.
