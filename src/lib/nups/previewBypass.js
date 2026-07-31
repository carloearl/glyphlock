/**
 * DACO-SIP-001 NUPS-CRIT-001 remediation (2026-07-31).
 *
 * The former ?pin=90210 URL bypass was removed. A static PIN literal in the
 * client bundle granted full owner/admin view to anyone who read the shipped
 * JS. Identity authority must never come from a URL parameter. Owner/admin
 * access now flows exclusively through the authenticated owner-email check
 * (isOwnerEmail) and the server-validated kiosk session — no client-side PIN.
 *
 * This shim is retained so existing callers keep compiling; it always denies.
 */
export function hasOwnerPreview() {
  return false;
}