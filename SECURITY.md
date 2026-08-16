# Security Policy

## Reporting a security issue

Please do not open a public GitHub issue for a vulnerability that could expose credentials, customer data, payment data, authentication bypasses, or sensitive operational information.

Use the private contact channel published on https://glyphlock.io for responsible disclosure.

## Secrets

Credentials must not be stored in source control. `.env` files are ignored by this repository. Backend secrets should be supplied through Base44, Supabase, deployment-provider, or other approved secret-management facilities.

If a credential is ever committed, treat it as compromised: revoke or rotate it first, then remove it from the repository and history as appropriate.

## Scope

This repository contains application and integration code. Security posture, compliance alignment, external audits, certifications, and third-party provider controls are separate claims and should be documented independently.
