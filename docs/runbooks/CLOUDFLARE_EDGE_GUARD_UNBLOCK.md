# Cloudflare Edge Guard credential-unblock runbook

Status: ready for account-owner credential action  
Target zone: `glyphlock.io`  
Worker: `glyphlock-edge-guard`  
Protected GitHub environment: `cloudflare-production-preflight`

## Diagnosed failure

GitHub Actions run `32631854660` on August 23, 2026 proved that the Worker, route-matching logic, verifier, rollback script, and tests passed.

The credentialed inventory job then failed because all supported credential variables were blank:

- `CLOUDFLARE_API_TOKEN`
- `CF_API_TOKEN`
- `CLOUDFLARE_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CF_ACCOUNT_ID`

The deploy job was correctly skipped. This is not a Worker-code failure and does not require waiting for Cloudflare's partnerships team.

## Required account-owner action

Create one narrowly scoped Cloudflare custom API token for the GlyphLock account and `glyphlock.io` zone.

Minimum intended access for the current preflight, deployment, verification, and exact rollback path:

### Account permissions

- Workers Scripts: Edit

### Zone permissions for `glyphlock.io` only

- Zone: Read
- DNS: Read
- Workers Routes: Edit
- Page Rules: Read
- Rulesets: Read
- Zone Settings: Read

Restrict the token to the single GlyphLock account and the `glyphlock.io` zone. Do not paste the token into source, issues, pull requests, workflow output, artifacts, email, or chat.

In the GitHub repository, open the protected environment `cloudflare-production-preflight` and create:

- secret `CLOUDFLARE_API_TOKEN`
- secret `CLOUDFLARE_ACCOUNT_ID`

The account ID is a non-secret identifier but remains in the protected environment so the workflow can reject a mismatched account before mutation.

## Execution sequence

1. Confirm the current `main` workflow still validates the pinned preflight and route-pattern hashes.
2. Manually dispatch **Cloudflare Edge Guard Delivery** from `main`.
3. Review the inventory job summary and download the sanitized preflight artifact.
4. Continue only when the decision is exactly `SAFE TO DEPLOY`.
5. Confirm live verification passes for public and protected routes.
6. Preserve the run ID and artifact as deployment evidence.

## Automatic stop conditions

Deployment must remain blocked when any of these conditions is true:

- no active `glyphlock.io` zone is found;
- the configured account ID does not own the zone;
- the apex DNS record is not proxied;
- any existing Worker route covers the apex;
- a conflicting apex Worker route exists;
- a `glyphlock-edge-guard` script or route already exists and requires migration review;
- the public route check fails;
- crawler blocking or noindex/no-store verification fails.

## Rollback boundary

The rollback may remove only:

- route `glyphlock.io/*` when it references `glyphlock-edge-guard`;
- script `glyphlock-edge-guard` when no non-target route references it.

It must not change DNS, SSL/TLS mode, Base44 authentication, cache settings, Page Rules, rulesets, or unrelated Workers.

## Pull-request cleanup

- PR #20 is superseded because current `main` already uses `actions/checkout@v4` in the Cloudflare workflow.
- PR #19 must not be merged as-is if GitHub reports it stale or non-mergeable. Preserve its intent, but execute from current `main` after credentials are configured.

## Partnership lane

The Cloudflare Technology Partnerships application can remain open as a go-to-market lane. It is not a prerequisite for using Cloudflare products, deploying the Worker, or protecting `glyphlock.io` through the existing self-service architecture.
