/**
 * Owner visual-access bypass — authorized by Carlo (2026-07-20).
 *
 * Appending ?pin=90210 to any NUPS URL grants a view-only owner preview
 * session for this browser tab. Mirrors the standing Owner PIN convention
 * ("Owner PIN 90210 bypasses all role-based view restrictions").
 * The flag lives in sessionStorage — closing the tab ends the preview.
 */
const OWNER_PIN = "90210";
const FLAG = "nups_owner_preview";

export function hasOwnerPreview() {
  if (typeof window === "undefined") return false;
  try {
    const pin = new URLSearchParams(window.location.search).get("pin");
    if (pin === OWNER_PIN) {
      sessionStorage.setItem(FLAG, "1");
      // Seed an operator identity so pages that read the kiosk session render fully.
      if (!sessionStorage.getItem("nups_session")) {
        sessionStorage.setItem("nups_session", JSON.stringify({
          full_name: "Owner Preview",
          username: "owner-preview",
          role: "VENUE_OWNER",
          venue_id: "dream_palace",
          preview: true,
        }));
      }
    }
    return sessionStorage.getItem(FLAG) === "1";
  } catch {
    return false;
  }
}