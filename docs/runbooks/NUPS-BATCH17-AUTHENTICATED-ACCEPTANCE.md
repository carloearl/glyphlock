# NUPS Batch 17 Authenticated Security Acceptance

This runbook completes the deployed tests that cannot be performed by an anonymous Base44 sandbox session.

## Required accounts

Use five distinct Base44 users with matching active `NUPSUser` records:

| Runtime variable | Required NUPS role | Venue |
|---|---|---|
| `B17_MANAGER_A_TOKEN` | `VENUE_MANAGER` or `VENUE_OWNER` | Venue A |
| `B17_DOOR_A_TOKEN` | `DOORMAN` or `DOOR_GIRL` | Venue A |
| `B17_STAFF_A_TOKEN` | `BARTENDER` or `DJ` | Venue A |
| `B17_MANAGER_B_TOKEN` | `VENUE_MANAGER` | Venue B |
| `B17_GLOBAL_TOKEN` | `PLATFORM_ADMIN` or `SOVEREIGN` | global/cross-venue |

Also provide:

```text
B17_VENUE_A_ID
B17_VENUE_B_ID
```

Venue B should be a clearly isolated DEMO/SANDBOX venue when available. Do not repurpose a production employee or change a live worker’s role for this test.

## Obtaining tokens

Log in to the Base44 app as each controlled test account and obtain a short-lived access token through the supported authenticated developer/session workflow. Never paste passwords, PINs, OTPs, or tokens into source code, chat, committed files, browser URLs, or screenshots.

The SDK’s service-role SSO module is not an impersonation API. It only retrieves SSO tokens for the user who already made the authenticated request. It cannot manufacture the five sessions above.

## Execute

Provide the variables only to the current shell/process, then run:

```text
npm run test:nups-batch17-authenticated
```

Do not create an `.env` file.

The runner:

1. confirms five distinct authenticated Base44 users;
2. uploads synthetic text through `UploadPrivateFile`;
3. registers `PRIVATE_IDENTITY`, `PRIVATE_TAX`, `PRIVATE_BIOMETRIC`, and `PRIVATE_CONTRACT` evidence in SANDBOX mode;
4. verifies same-venue manager access;
5. verifies door identity-only access;
6. verifies door tax/biometric denial;
7. verifies ordinary-staff denial;
8. verifies wrong-venue manager denial;
9. verifies the documented global-role behavior;
10. fetches an authorized signed URL before expiry;
11. waits through the real returned TTL and verifies rejection afterward;
12. verifies access/denial audit events and checks their metadata for URLs or private file URIs.

The runner never prints tokens, signed URLs, or private file URIs. Its sanitized result is written to:

```text
artifacts/batch17/authenticated-security-result.json
```

## Test evidence

All uploaded content explicitly states that it is synthetic and not a real ID, tax form, biometric, or contract. The resulting SANDBOX evidence records and immutable security audits may be retained as acceptance evidence. Do not delete the audit trail.

## Failure handling

Any unexpected allow result is a release-blocking security defect. Preserve the result, assign a stable `NUPS-XXXX` issue, and use `NO-GO` until corrected and rerun.
