# NUPS Batch 17 Browser Smoke Evidence

**Date:** 2026-08-22  
**Environment:** Base44 local preview, Chromium 151, Playwright 1.62.1  
**Test data:** Synthetic only

Playwright and its Linux browser libraries were installed ephemerally in the cloud sandbox with `--no-save --no-package-lock`. They are not application dependencies and no production publish occurred.

## Public GlyphLock page

Route:

```text
http://127.0.0.1:5173/
```

Result:

```text
PASS
Title: GlyphLock | Evidence Infrastructure for Identity, Operations & Proof
Visible body characters: 8,288
Application console/page errors: 0
Failed HTTP requests: 0
Anonymous 401/403 requests: 0
```

The test ignores only the local Vite HMR WebSocket refusal caused by direct localhost access outside the Base44 tunnel. It does not ignore application API or React errors.

During the first run, the browser exposed:

- a duplicate anonymous Base44 user/auth probe;
- a React image-priority property warning;
- visual-edit metadata being applied to `React.Fragment`.

Corrections:

- `Layout`, `NUPSPermissionsProvider`, and `RoleClassBadge` now consume the authoritative `AuthContext` rather than independently probing anonymous visitors;
- the conflicting image-priority prop was removed;
- the system-map fragment was replaced with a DOM-safe `contents` wrapper.

The browser was rerun after these fixes and passed cleanly.

## Unknown NUPS kiosk device

Route:

```text
http://127.0.0.1:5173/NUPSKiosk?panel=clockIn
```

Synthetic browser ID:

```text
B17-UNKNOWN-BROWSER-SMOKE
```

The test simulated installed/standalone display mode so the operational kiosk could render without a physical fullscreen gesture.

Result:

```text
PASS
Device Approval Required visible: yes
Exact synthetic device ID visible: yes
Copy Device ID control visible: yes
Check Approval control visible: yes
“This is not a bad PIN” explanation visible: yes
PIN submit control visible: no
nupsClockInV2 boundary response: HTTP 409
Unexpected anonymous 401/403 responses: 0
Application console/page errors: 0
```

The expected HTTP 409 is the server’s fail-closed terminal decision and is not treated as an application crash.

A screenshot was captured to the sandbox temporary path `/tmp/b17-kiosk-approval.png`; it contains no credentials or protected evidence and was not committed.

## Limitation

This evidence verifies the public page and unknown-device kiosk experience. It does not replace the authenticated DEMO/SANDBOX operational journey, real terminal commissioning, or real-provider DJ soak required for a release `GO` verdict.
