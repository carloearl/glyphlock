import React from "react";

/**
 * Hidden live region for screen reader announcements.
 * Use: document.getElementById('gl-sr-announce').textContent = "Page loaded";
 */
export default function ScreenReaderAnnouncer() {
  return (
    <div
      id="gl-sr-announce"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}