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

- Do not add push restrictions, signed-commit requirements, or pull-request-only enforcement that blocks `base44-builder[bot]` unless the Base44 GitHub App is explicitly configured as a bypass actor.
- If branch protection or a ruleset is introduced later, preserve required CI and secret checks while allowing Base44 ordinary-code synchronization.
- Workflow-file changes remain admin-managed even when Base44 is a ruleset bypass actor.
- Never force-push `main`, rewrite shared history, or delete another agent's branch without confirming it is obsolete.

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
