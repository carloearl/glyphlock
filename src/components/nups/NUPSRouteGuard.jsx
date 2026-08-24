/**
 * NUPSRouteGuard
 * 
 * Wraps any NUPS operational page/component.
 * - Verifies authentication
 * - Verifies the user has at least one NUPS operational role
 * - Blocks public GlyphLock website users without operational roles
 * - Redirects to gateway on failure
 * 
 * Usage:
 *   <NUPSRouteGuard requiredRoles={["VENUE_OWNER", "PLATFORM_ADMIN"]}>
 *     <YourPage />
 *   </NUPSRouteGuard>
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { writeVerdict } from "@/lib/nups/routeGuardCache";

// All valid operational roles — public GlyphLock users have NONE of these
const ALL_OPERATIONAL_ROLES = [
  "PLATFORM_ADMIN",
  "SOVEREIGN",
  "VENUE_OWNER",
  "VENUE_MANAGER",
  "FLOOR_HOST",
  "BARTENDER",
  "DJ",
  "SECURITY",
  "KIOSK",
  "PERFORMER",
  "HOSTESS",
  "DOOR_GIRL",
  "DOORMAN",
  "DEMO",
];

const GRANT_TO_NUPS_ROLE = {
  OWNER: "VENUE_OWNER",
  ADMINISTRATOR: "PLATFORM_ADMIN",
  MANAGER: "VENUE_MANAGER",
  ENTERTAINER: "PERFORMER",
};

export default function NUPSRouteGuard({ children, requiredRoles = [], allowAdmin = true }) {
  const navigate = useNavigate();
  // Never render protected children from a cached client verdict. Every mount
  // revalidates the current server-side grant and operating mode.
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await base44.functions.invoke("nupsAccessControl", { action: "checkAccess" });
        const access = res.data || {};
        if (cancelled) return;
        if (access.authorized !== true || access.mode !== "REAL") {
          setStatus("denied");
          return;
        }
        const assignedRole = access.decision_tier === "SOVEREIGN"
          ? "SOVEREIGN"
          : (GRANT_TO_NUPS_ROLE[access.granted_role] || access.granted_role);
        if (!ALL_OPERATIONAL_ROLES.includes(assignedRole)) {
          if (!cancelled) setStatus("denied");
          return;
        }
        const isAdminRole = ["SOVEREIGN", "PLATFORM_ADMIN", "VENUE_OWNER"].includes(assignedRole);
        if (requiredRoles.length > 0 && !(allowAdmin && isAdminRole) && !requiredRoles.includes(assignedRole)) {
          setStatus("denied");
          return;
        }
        writeVerdict({ status: "granted", email: access.actor_email, why: "server_grant" });
        setStatus("granted");
      } catch (error) {
        if (!cancelled) setStatus(error?.response?.status === 401 ? "unauthenticated" : "denied");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
          <p className="text-gray-600 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-gray-900/80 border border-yellow-500/20 rounded-2xl p-8 text-center space-y-5">
          <Lock className="w-12 h-12 text-yellow-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">Authentication Required</h2>
            <p className="text-gray-500 text-sm mt-2">
              You must sign in with an authorized NUPS account to access this area.
            </p>
          </div>
          <Button
            onClick={() => navigate("/NUPSGateway")}
            className="w-full bg-gradient-to-r from-violet-600 to-blue-600"
          >
            Go to Access Gateway
          </Button>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-gray-900/80 border border-red-500/20 rounded-2xl p-8 text-center space-y-5">
          <Lock className="w-12 h-12 text-red-400 mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-white">Access Denied</h2>
            <p className="text-gray-500 text-sm mt-2">
              Your account does not have an authorized operational role for this section of N.U.P.S.
            </p>
            <p className="text-gray-600 text-xs mt-2">
              A GlyphLock website account does not automatically grant access to operational tools.
              Contact your system administrator for role assignment.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/NUPSGateway")}
              className="flex-1 border-white/10 text-gray-400"
            >
              Gateway
            </Button>
            <Button
              onClick={() => base44.auth.logout("/NUPSGateway")}
              className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
