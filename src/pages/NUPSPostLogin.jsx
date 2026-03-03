import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";

const OWNER_TIER_ROLES = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
const PERFORMER_ROLES = ["PERFORMER"];

function resolveDestination(permissionsData, base44Role, roleHint) {
  if (roleHint === "Staff") return "NUPSStaff";
  if (roleHint === "Entertainer") return "EntertainerCheckIn";

  if (permissionsData?.venue_access) {
    const keys = permissionsData.venue_access.map(va => va.role_key);
    if (keys.some(k => OWNER_TIER_ROLES.includes(k))) return "NUPSOwner";
    if (keys.some(k => PERFORMER_ROLES.includes(k))) return "EntertainerCheckIn";
  }

  return base44Role === "admin" ? "NUPSOwner" : "NUPSStaff";
}

export default function NUPSPostLogin() {
  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl("NUPSLogin");
          return;
        }

        const roleHint = sessionStorage.getItem("nups_role_hint") || null;
        sessionStorage.removeItem("nups_role_hint");

        let permissionsData = null;
        try {
          const res = await base44.functions.invoke('getUserPermissions', {});
          permissionsData = res.data;
        } catch (e) {}

        const user = await base44.auth.me();
        const target = resolveDestination(permissionsData, user.role, roleHint);
        window.location.href = createPageUrl(target);
      } catch (err) {
        window.location.href = createPageUrl("NUPSLogin");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-spin" />
        <p className="text-white/50 text-sm">Routing you to your dashboard…</p>
      </div>
    </div>
  );
}