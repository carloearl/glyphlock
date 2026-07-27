# NUPS Owner Access Chain Findings

## Legitimate entry

1. User opens `/NUPSKiosk`.
2. User chooses **Owner / Admin Sign In**.
3. Base44 platform authentication is required.
4. Frontend invokes backend function `nupsAccessControl` with `action: "checkAccess"`.
5. Authorized accounts are routed to `/RoleViews`.
6. `/RoleViews` is ADMIN-guarded and links to role workspaces.

## Approval flow

- Authenticated users may submit an access request through `nupsAccessControl`.
- Requests begin in `PENDING_OWNER_APPROVAL`.
- Decision buttons are shown only to:
  - `carloearl@glyphlock.com`
  - `carloearl@gmail.com`
- The frontend states that the backend repeats the owner-only decision rule, but backend source was not located in the GitHub repository and remains unverified.

## Unsafe alternate entry

The frontend currently accepts `?pin=90210` and grants a session-scoped owner preview. This path is trusted by both `RoleClassGuard` and `KioskSessionGuard` and therefore crosses from visual preview into authorization logic.

## Required safe transition

Before deleting the unsafe preview bypass:

1. Confirm Carlo can complete Base44 authentication with one of the approved email accounts.
2. Invoke `nupsAccessControl/checkAccess` and record its response.
3. If denied, inspect the live access request / role assignment records and repair the server-approved grant.
4. Confirm `/RoleViews`, `/NUPSHub`, `/NUPSAdminPortal`, and one shadow role view load through the legitimate path.
5. Remove the frontend shared-PIN path.
6. Clear preview session storage keys on application startup.
7. Run unauthorized and forged-URL tests.

The shared PIN must not be used for the audit because using the bypass would invalidate the authorization test being performed.
