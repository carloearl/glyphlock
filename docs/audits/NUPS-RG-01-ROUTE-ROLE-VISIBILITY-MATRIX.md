# NUPS-RG-01 Route, Role, and Visibility Matrix

**Evidence baseline:** `ebc520bf0fe9444cc9103c864c66aa6704d79fbb`

## Route Graph

```mermaid
flowchart TD
    A[Public /] --> B[/NUPSLanding]
    B --> C[/NUPSKiosk]
    C --> T[Test request / SANDBOX]
    C --> D[Training request / DEMO]
    C --> L[Live request / REAL<br/>baseline source only, absent from published chunk]
    C --> S[Owner/Admin sign-in]
    C --> P[PIN clock-in/out]
    S --> R[/RoleViews]
    R --> AO[Admin/Owner workspaces]
    P --> G{Server-validated role}
    G --> M[/ManagerConsole]
    G --> H[/HostessHome or VIPSale]
    G --> F[/FrontDoor]
    G --> BR[/BarRegister]
    G --> DJ[/DJHome]
    G --> E[/EntertainerHome]
    G --> ST[/StaffHome]
    G --> DR[Driver fallback to kiosk<br/>dedicated flow absent]
    AO --> HUB[/NUPSHub]
    M --> HUB
    HUB --> TX[POSTransaction.list without venue/mode filter<br/>RGSEC-001]
    PUB[Published asset QsiYU1fT] -. older than .-> BASE[Baseline asset BBYls9Gu]
```

## Route Inventory Observations

- `src/App.jsx` contains 171 explicit route definitions.
- 64 case-normalized path groups are duplicated across aliases and the fullscreen/non-fullscreen route trees.
- `NUPSAppShell` exposes 37 NUPS navigation destinations.
- The source directories contain 75 zero-byte files, including page/component stubs.
- Route-level guards are inconsistent. Many role stations are protected, while `/NUPSHub` is not wrapped in a NUPS role/session guard.
- The workspace layer is additive and explicitly non-destructive, so old route surfaces remain alongside newer ones.
- Admin and Legacy navigation is hidden unless Admin Override is active.
- Public crawler output is not equivalent to an interactive browser session.

## Role Matrix

| Role / mode | Entry method | Approval requirement | Expected destination | Primary guard/source | Expected navigation | Live evidence | Verdict | Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sovereign Owner | Platform sign-in via `/NUPSKiosk?panel=admin` | Protected owner email; no request required | `/RoleViews` then selected workspace / `/NUPSHub` | OwnerAdminSignIn + RoleClassGuard sovereign bypass | ADMIN and Legacy require Admin Override in shell | Source only; published build is stale and authenticated browser proof unavailable | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Owner-authenticated mobile/tablet/desktop session |
| Venue Owner | Approved REAL owner grant, then admin sign-in | Sovereign Owner approval only | `/RoleViews` / `/NUPSHub` | nupsAccessControl + RoleClassGuard | Owner/admin workspaces; no self-approval | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Second authorized owner identity and email OTP |
| Administrator | Approved REAL administrator grant | Owner approval; administrator cannot grant admin/owner | `/RoleViews` / `/NUPSHub` | nupsAccessControl + RoleClassGuard | Admin workspaces, subject to Admin Override | Source-only policy checks passed | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Administrator account plus owner decision |
| Venue Manager | PIN kiosk session or explicit REAL manager grant | Owner/admin operational approval | `/ManagerConsole` | KioskSessionGuard + NUPSRouteGuard | Manager rail, tonight, people, reconciliation/resolution | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Approved terminal and manager PIN/session |
| Hostess / Floor Host | PIN clock-in | Approved staff grant and assigned PIN | `/HostessHome` or `/VIPSale` | roleHomes/staffFlowState; VIPSale guard | Scoped VIP/guest/receipt actions | Source only; routing definitions are split across maps | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Hostess identity, PIN, venue and VIP workflow |
| Door Girl | PIN clock-in on trusted terminal | Approved staff grant and PIN | `/FrontDoor` / staff home | KioskSessionGuard roles DOOR_GIRL/DOORMAN | Front-door station only | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Physical terminal, scanner/camera and PIN |
| Doorman | PIN clock-in on trusted terminal | Approved staff grant and PIN | `/FrontDoor` or `/DoormanHome` | KioskSessionGuard | Door workflow only | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Physical terminal and PIN |
| Bartender | PIN clock-in on trusted terminal | Approved staff grant and PIN | `/BarRegister` | KioskSessionGuard role BARTENDER | Bar register station | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Physical terminal and test sale |
| DJ | PIN clock-in on trusted terminal | Approved staff grant and PIN | `/DJHome` | KioskSessionGuard role DJ | DJ console only | Reducer/static continuity passes; provider/browser soak missing | BLOCKED_HUMAN_OR_HARDWARE_PROOF | DJ identity and 30-minute real-browser/provider soak |
| Security | PIN clock-in | Approved staff grant and PIN | `/StaffHome` | RoleClassGuard STAFF | Generic staff home; no dedicated security workspace | Source only | SOURCE_ONLY_NOT_LIVE | Clarify acceptance for a dedicated security station versus generic staff home |
| Entertainer / Performer | PIN clock-in or approved performer access | Owner/admin approval, contractor onboarding | `/EntertainerHome` | RoleClassGuard ENTERTAINER | Own scoped home, no admin rail | Source only | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Entertainer onboarding, PIN, contract and clock-in |
| Driver | No complete dedicated entry was found | Driver role exists in NUPSUser and domain entities, but not request selector/role class | `/NUPSKiosk` fallback | roleHomes maps DRIVER to kiosk; roleClass falls through STAFF | No dedicated driver workspace | No published or source-complete role flow | ABSENT | Define canonical driver role, approval, home and allowed actions |
| Public Applicant | Published kiosk buttons | Email/platform sign-in required before request | Published test/training panels; baseline adds `liveRequest` | AccessRequestForm + nupsAccessControl | No operational navigation before approval | Published build lacks baseline live-request control and retains old fullscreen blocker | REACHABLE_PARTIAL_OR_BROKEN | Publish exact approved repair and verify request record/owner notification |
| DEMO User | Training request or DEMO identity | Owner-reviewed DEMO grant | `/NUPSTraining`, `/NUPSSandbox`, role home | Mode guards / DEMO-backed training | Funds-off surfaces | Test/training button present; end-to-end session unproven | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Verified DEMO account, data isolation and role journey |
| SANDBOX User | Sandbox request | Owner-reviewed SANDBOX grant | `/NUPSSandbox` or scoped home | Mode guards | Funds-off isolated data | Test button present; end-to-end session unproven | BLOCKED_HUMAN_OR_HARDWARE_PROOF | Verified SANDBOX account and isolation check |

## Key Visibility Findings

1. The published kiosk is older than the audit baseline and does not expose the repaired live-request panel.
2. A valid source route does not establish that ordinary navigation reaches it.
3. A component behind Admin Override is not visible to an owner in default manager-parity mode.
4. Case aliases and two routing trees create shadowing and make route ownership difficult to prove.
5. Driver is present in data/domain code but not a coherent requested role, role-class mapping, and dedicated workspace.
6. Responsive viewport acceptance remains a human/browser test because no browser automation engine was available in the audit environment.
