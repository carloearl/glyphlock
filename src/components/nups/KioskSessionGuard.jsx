import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldX } from "lucide-react";
import { isOwnerEmail } from "@/lib/nups/ownerEmails";
import { getActiveVenueId, saveActiveVenue } from "@/hooks/useActiveVenue";

const GRANT_TO_NUPS_ROLE = {
  OWNER: "VENUE_OWNER",
  ADMINISTRATOR: "PLATFORM_ADMIN",
  MANAGER: "VENUE_MANAGER",
  ENTERTAINER: "PERFORMER",
};
const ADMIN_ROLES = new Set(["VENUE_OWNER", "PLATFORM_ADMIN", "SOVEREIGN"]);

// DACO-NUPS-RBAC-CORRECTION-20260717 §6 — active-session role guard.
// Validates the server-issued kiosk session (signature, expiry, live shift,
// account status, role) on every load. sessionStorage is never treated as
// authority — the server decides. Fallback: platform user with an explicit
// NUPS back-office grant (Owner / approved Administrator).
// On any failure: no page data is exposed, redirect to /NUPSKiosk;
// the denial is logged server-side without the PIN.
export default function KioskSessionGuard({ roles = [], children }) {
  const [state, setState] = useState("checking");
  const [denial, setDenial] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = sessionStorage.getItem("nups_kiosk_session");
      if (token) {
        try {
          const res = await base44.functions.invoke("nupsClockInV2", {
            action: "validateSession", kiosk_session: token, allowed_roles: roles,
          });
          if (res.data?.valid) { if (alive) setState("ok"); return; }
          if (alive) setDenial("Your NUPS session is expired, revoked, or not authorized for this workspace.");
        } catch { if (alive) setDenial("Your NUPS session could not be verified for this workspace."); }
        sessionStorage.removeItem("nups_kiosk_session");
        sessionStorage.removeItem("nups_kiosk_operator");
      }
      // Back-office fallback — explicit NUPS grant only (never platform role alone).
      try {
        if (await base44.auth.isAuthenticated()) {
          const me = await base44.auth.me();
          // Carlo's owner emails bypass the back-office grant check.
          if (isOwnerEmail(me?.email)) { if (alive) setState("ok"); return; }
          let venueId = getActiveVenueId();
          if (!venueId) {
            const venues = await base44.entities.Venue.filter({ status: "active" }, "-created_date", 1);
            if (venues?.[0]) {
              saveActiveVenue(venues[0]);
              venueId = venues[0].id;
            }
          }
          if (venueId) {
            const res = await base44.functions.invoke("nupsAccessControl", {
              action: "checkAccess",
              venue_id: venueId,
              mode: "REAL",
            });
            const access = res.data || {};
            const resolvedRole = GRANT_TO_NUPS_ROLE[access.granted_role] || access.granted_role;
            const roleAllowed = ADMIN_ROLES.has(resolvedRole) || roles.includes(resolvedRole);
            if (access.authorized === true && access.mode === "REAL" && roleAllowed) {
              if (alive) setState("ok");
              return;
            }
          }
        }
      } catch { /* denied */ }
      if (alive) {
        setDenial((current) => current || "Access is denied. Clock in with an authorized role or ask a manager to unlock this workspace.");
        setState("denied");
      }
    })();
    return () => { alive = false; };
  }, []);  

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }
  if (state === "denied") {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-3xl border border-red-500/30 bg-slate-900/95 p-8 text-center shadow-2xl" role="alert">
          <ShieldX className="mx-auto h-14 w-14 text-red-300" />
          <h1 className="mt-5 text-2xl font-black">NUPS Access Denied</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {denial || "This signed-in identity is not authorized for the requested NUPS workspace."}
          </p>
          <Link
            to="/NUPSKiosk"
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-cyan-600 px-5 text-sm font-black text-white transition hover:bg-cyan-500"
          >
            Return to Staff Clock In
          </Link>
        </section>
      </main>
    );
  }
  return children;
}
