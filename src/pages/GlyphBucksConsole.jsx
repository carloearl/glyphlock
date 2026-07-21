import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import RoleHomeButton from "@/components/nups/RoleHomeButton";
import UnifiedGlyphBucksTab from "@/components/nups/glyphbucks/UnifiedGlyphBucksTab";

/**
 * GlyphBucksConsole — the single, directly-reachable home for the entire
 * GlyphBucks system: Sales · Redeem · Press (5-sheet designer + serial / denom /
 * barcode / QR print) · Ledger · Inventory · Contract · Search · Fraud.
 *
 * Lives on /glyphbucks — NOT behind the kiosk sign-in gate — so the full
 * console is always visible and usable.
 */
export default function GlyphBucksConsole() {
  const [user, setUser] = useState(null);
  const [entertainers, setEntertainers] = useState([]);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.venue_id || activeVenue?.id || "dream_palace";

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    base44.entities.Entertainer
      .filter({ status: "active" }, "-created_date", 20)
      .then(setEntertainers)
      .catch(() => setEntertainers([]));
  }, []);

  const isAdmin = ["admin", "PLATFORM_ADMIN", "VENUE_OWNER"].includes(user?.role);

  return (
    <NUPSAppShell
      title="GlyphBucks Console"
      subtitle="Sales · Redeem · Press · Ledger · Inventory · Search · Fraud"
      role="MANAGER"
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        <RoleHomeButton />
        <UnifiedGlyphBucksTab
          user={user}
          venueId={venueId}
          entertainers={entertainers}
          isAdmin={isAdmin}
        />
      </div>
    </NUPSAppShell>
  );
}