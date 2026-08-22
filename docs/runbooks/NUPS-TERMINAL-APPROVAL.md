# NUPS Terminal Approval and Commissioning

**Scope:** One-time commissioning of each physical NUPS browser, tablet, workstation, kiosk or terminal.

## What approval means

Every NUPS device receives a stable, non-secret browser/device ID stored locally under `nups_terminal_id`. The server permits pre-authentication venue context and staff PIN entry only when the exact ID has a `VenueTerminal` record with:

```text
venue_id = the correct venue
status   = active
trusted  = true
```

An employee PIN does not approve a device. Merely knowing or copying a device ID does not approve it either.

## Approve the device you are currently using

1. Sign in with an authorized NUPS owner, venue manager, platform administrator or sovereign account.
2. Open **Venue Admin Settings**.
3. Select the correct venue.
4. Open the **Terminals** tab.
5. Confirm the displayed **This browser’s device ID** belongs to the physical device in front of you.
6. Choose the device type, such as Door, Clock, DJ, Manager, Scanner, VIP or Kiosk.
7. Enter a physical station name, such as `Front Door`, `DJ Booth` or `Manager Office`.
8. Add approval notes identifying the hardware and location.
9. Click **Approve This Device**.
10. Return to the NUPS PIN screen and click **Check Approval**.

## Approve a different device

1. On the unapproved device, open the NUPS PIN screen.
2. The screen displays **Device Approval Required** and the exact device ID.
3. Click **Copy Device ID** or copy it manually.
4. On an authorized manager device, open **Venue Admin Settings → Terminals**.
5. Paste the copied ID into **Device ID**.
6. Select the correct venue, device type and physical station.
7. Click **Approve & Activate**.
8. On the original device, click **Check Approval**.

## Register without granting access

Use **Register Pending** when inventorying a device before physically verifying it. Pending registration creates an inactive, untrusted record. Staff PIN entry remains blocked.

## Device states

| State | Staff PIN entry | Meaning |
|---|---|---|
| Active + trusted | Allowed | Exact device and venue were explicitly approved |
| Inactive | Blocked | Device was disabled or only registered pending approval |
| Active + untrusted | Blocked | Record exists but trust was not granted |
| Revoked | Blocked | Device was permanently revoked in the normal manager workflow |
| Unknown | Blocked | No `VenueTerminal` record exists for the ID |

## Deactivation and revocation

**Deactivate** is reversible and removes trust while preserving the record and audit history.

**Revoke** is the normal response to a lost, stolen, replaced or compromised device. Revoked records cannot be silently re-approved or reactivated through ordinary venue settings. Register replacement hardware with a new device ID.

## Security evidence

Terminal registration, approval, trust changes, deactivation, revocation, venue mismatches and unknown-device blocks create `SystemAuditLog` events. PINs, payment secrets and protected documents are never written into terminal audit metadata.
