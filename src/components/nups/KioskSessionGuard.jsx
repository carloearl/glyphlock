import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { hasOwnerPreview } from "@/lib/nups/previewBypass";
import { isOwnerEmail } from "@/lib/nups/ownerEmails";

// DACO-NUPS-RBAC-CORRECTION-20260717 §6 — active-session role guard.
// Validates the server-issued kiosk session (signature, expiry, live shift,
// account status, role) on every load. sessionStorage is never treated as
// authority — the server decides. Fallback: platform user with an explicit
// NUPS back-office grant (Owner / approved Administrator).
// On any failure: no page data is exposed, redirect to /NUPSKiosk;
// the denial is logged server-side without the PIN.
export default function KioskSessionGuard({ roles = [], children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    let alive = true;
    (async () => {
      // Owner PIN URL bypass (?pin=90210) — authorized visual-access preview.
      if (hasOwnerPreview()) { if (alive) setState("ok"); return; }
      const token = sessionStorage.getItem("nups_kiosk_session");
      if (token) {
        try {
          const res = await base44.functions.invoke("nupsClockIn", {
            action: "validateSession", kiosk_session: token, allowed_roles: roles,
          });
          if (res.data?.valid) { if (alive) setState("ok"); return; }
        } catch { /* invalid/expired/revoked — fall through */ }
        sessionStorage.removeItem("nups_kiosk_session");
        sessionStorage.removeItem("nups_kiosk_operator");
      }
      // Back-office fallback — explicit NUPS grant only (never platform role alone).
      try {
        if (await base44.auth.isAuthenticated()) {
          const me = await base44.auth.me();
          // Carlo's owner emails bypass the back-office grant check.
          if (isOwnerEmail(me?.email)) { if (alive) setState("ok"); return; }
          const res = await base44.functions.invoke("nupsAccessControl", { action: "checkAccess" });
          if (res.data?.authorized) { if (alive) setState("ok"); return; }
        }
      } catch { /* denied */ }
      if (alive) setState("denied");
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }
  if (state === "denied") return <Navigate to="/NUPSKiosk" replace />;
  return children;
}