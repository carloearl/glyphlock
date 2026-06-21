import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import EntertainerCheckInComponent from "@/components/nups/EntertainerCheckIn";

/**
 * EntertainerCheckIn — door-mounted daily check-in.
 *
 * Auth model: the COMPONENT itself authenticates each entertainer via PIN
 * against the venue's roster. There is no NUPS-staff login required —
 * the door tablet stays logged in as the Door Girl / Doorman, and dancers
 * tap their name and enter their 4-digit PIN to clock in.
 *
 * Previously this page was gated by NUPSRouteGuard requiring role
 * "PERFORMER", which caused the 404/unauthorized loop because dancers
 * never carry a NUPS staff session.
 */
export default function EntertainerCheckInPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Pass through whoever is logged in on the tablet — usually a door
    // staffer. The check-in component handles the per-entertainer PIN.
    const load = async () => {
      try {
        const nupsSession = sessionStorage.getItem("nups_session");
        if (nupsSession) { setUser(JSON.parse(nupsSession)); return; }
        const u = await base44.auth.me().catch(() => null);
        setUser(u);
      } catch { /* anonymous OK — component handles PIN auth */ }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <EntertainerCheckInComponent user={user} />
      </div>
    </div>
  );
}