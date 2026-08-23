# NUPS Batch 17 Physical Device Inventory

**Date:** 2026-08-22  
**Venue commissioning status:** No real physical station was available to the remote engineering sandbox for exact browser-ID capture.

| Intended station | Physical device available to this run | Exact ID obtained | Approved active + trusted | Runtime tested | Result |
|---|---:|---:|---:|---:|---|
| Front Door | No | No | No | No | Physical commissioning required |
| Staff Clock | No | No | No | No | Physical commissioning required |
| DJ Booth | No | No | No | No | Physical commissioning required |
| Manager Office | No | No | No | No | Physical commissioning required |
| ID Scanner | No | No | No | No | Physical commissioning required |
| VIP Station | No | No | No | No | Physical commissioning required |
| Kiosk | No | No | No | No | Physical commissioning required |
| Payment Terminal | No | No | No | No | Inventory relationship must be verified on the actual terminal |

## Existing registry state

The only known Batch 16 verification terminal is synthetic, clearly labeled, and permanently:

```text
status  = revoked
trusted = false
```

No synthetic terminal may be used to claim physical commissioning.

## Acceptance boundary

The software control is complete and fail-closed. The physical acceptance step requires the exact `nups_terminal_id` stored by the browser on each real device. The remote sandbox cannot derive that value for hardware it is not operating.

Commission each available station using `docs/runbooks/NUPS-TERMINAL-APPROVAL.md`. Record the real device ID, venue, terminal type, physical station, approval actor and runtime result without recording employee PINs.
