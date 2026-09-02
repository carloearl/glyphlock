# GlyphLock Repository Agent Rules

These rules apply to every coding agent, including Base44 Builder, Codex, and other connected automation.

## Canonical systems

- GitHub repository `carloearl/glyphlock`, branch `main`, is the canonical source-history repository.
- Base44 app `697a087fb354faebb72df54b` is the canonical Base44 runtime and deployment surface.
- Pull or fetch the latest `main` before writing. Preserve commits made by other agents and never replace unrelated work.

## Base44 and GitHub synchronization boundary

- The installed Base44 GitHub App can synchronize ordinary repository content but does not have GitHub `workflows: write` permission.
- Base44 agents MUST NOT create, edit, rename, or delete files under `.github/workflows/**`.
- A rejected Base44 sync must not be "fixed" by disabling CI, secret scanning, or security checks.
- GitHub workflow files are maintained through an admin-capable GitHub connection or repository owner account.
- Base44-managed CI additions belong in normal repository code: add an npm script, then list that script in `.base44/ci-checks.json`.
- `.github/workflows/nups-ci.yml` invokes `npm run ci:base44`; therefore Base44 can extend CI without touching a protected workflow path.

## Branch and repository rules

- `main` is a protected release branch. No human, Base44 builder, coding agent, or other automation may use it as a normal working branch.
- Base44 and other agents must work on a purpose-named task branch and open a pull request into `main`.
- Pull requests into `main` must pass `Repository Governance / Validate protected controls` and `NUPS CI / Verify source and production build`, and must be current with `main` before squash merge.
- The default-branch governance workflow never executes pull-request code. Changes to workflows, governance, scripts, package bindings, invariants, or npm configuration require the repository owner as author or an exact-head owner approval.
- Base44 must not be configured as a standing bypass actor for ordinary changes. A time-bounded owner recovery exception is allowed only when the protected workflow itself is broken; record the reason and resulting commit in the pull request or recovery issue.
- Workflow-file changes remain admin-managed.
- Use squash merge so the pull-request title becomes the authoritative commit subject on `main`.
- Never force-push `main`, rewrite shared history, or delete another agent's branch without confirming it is obsolete.

## Branch names and commit subjects

- Use `feat/`, `fix/`, `security/`, `integration/`, `audit/`, `docs/`, `chore/`, or `recovery/` followed by a short kebab-case purpose.
- Pull-request titles and squash commit subjects must use a descriptive conventional form such as `fix(door): persist card tips through nightly closeout`.
- `External agent changes`, `update`, `changes`, and similarly non-descriptive titles are prohibited for pull requests and commits merged to `main`.

## Material changes

A material change is any change that can affect money, permissions, identity, evidence, production data, system boundaries, or externally observable operational behavior. This includes sales and payment calculations; cash/card treatment; GlyphBucks liability; payouts, tips, settlement, and nightly close; accounting; contracts and signatures; protected evidence; deletion or mutation rules; authentication and role grants; REAL/DEMO/SANDBOX separation; venue, device, or session boundaries; entity schemas; production write paths; provider integrations, APIs, webhooks, and MCP tools; security controls; audit logs; and real-shift workflows.

Every material change requires a task branch, pull request, green required CI, explicit invariant review, verification evidence, production-impact statement, and rollback plan. Wording, documentation, formatting, colors, icons, and spacing are light changes only when they do not change behavior, claims, security, accessibility, or an operational outcome.

## Verified releases

- A merged commit is not automatically a release.
- Create a verified release tag only after the exact commit has green required CI, is deployed to the intended environment, and passes the documented smoke checks.
- The release record must include the commit SHA, CI run, deployment/environment, smoke-test evidence, known limitations, and rollback SHA.
- Never label a baseline `verified`, `production-ready`, or `live` when a required human, provider, hardware, security, or operational gate remains open.

## Security and secrets

- Never commit `.env` files, API keys, OAuth secrets, private keys, service-account files, tokens, or provider credentials.
- Keep `npm run check:secrets` before dependency installation in CI.
- Do not print secret values in logs, comments, issues, pull requests, or screenshots.

## CI changes from Base44

1. Implement the check as a normal script under `scripts/`.
2. Add its npm script entry to `package.json`.
3. Add the npm script name to `.base44/ci-checks.json`.
4. Run `npm run ci:base44`, lint, typecheck, and build.
5. Do not edit `.github/workflows/nups-ci.yml` from Base44.
