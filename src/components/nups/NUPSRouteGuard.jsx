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
import { isSovereign } from "@/lib/nups/sovereign";

// All valid operational roles — public GlyphLock users have NONE of these
const ALL_OPERATIONAL_ROLES = [
  "PLATFORM_ADMIN",
  "VENUE_OWNER",
  "VENUE_MANAGER",
  "FLOOR_HOST",
  "BARTENDER",
  "DJ",
  "SECURITY",
  "KIOSK",
  "PERFORMER",
  "DEMO",
];

export default function NUPSRouteGuard({ children, requiredRoles = [], allowAdmin = true }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading | granted | denied | unauthenticated

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          if (!cancelled) setStatus("unauthenticated");
          return;
        }

        const user = await base44.auth.me();

        // SOVEREIGN BYPASS — Carlo (Vinnie) + AI skip every gate.
        // Resolved by NUPSUser.sovereign_flag === true OR role === "SOVEREIGN",
        // looked up by created_by === auth email.
        try {
          const sovMatches = await base44.entities.NUPSUser.filter({ created_by: user.email });
          if ((sovMatches || []).some(isSovereign)) {
            if (!cancelled) setStatus("granted");
            return;
          }
        } catch { /* fall through to standard checks */ }

        // Base44 admin role always gets access
        if (allowAdmin && user.role === "admin") {
          if (!cancelled) setStatus("granted");
          return;
        }

        // Attempt RBAC lookup
        let assignedRoles = [];
        try {
          const res = await base44.functions.invoke("getUserPermissions", {});
          assignedRoles = res.data?.venue_access?.map(va => va.role_key) || [];
        } catch {
          // RBAC unavailable — if user is admin, allow; otherwise deny
          if (user.role === "admin") {
            if (!cancelled) setStatus("granted");
          } else {
            if (!cancelled) setStatus("denied");
          }
          return;
        }

        // Check: does user have ANY operational role at all?
        const hasAnyOperationalRole = assignedRoles.some(r => ALL_OPERATIONAL_ROLES.includes(r));
        if (!hasAnyOperationalRole) {
          if (!cancelled) setStatus("denied");
          return;
        }

        // Check: does user have the SPECIFIC required roles for this route?
        if (requiredRoles.length > 0) {
          const hasRequired = requiredRoles.some(r => assignedRoles.includes(r));
          if (!hasRequired) {
            if (!cancelled) setStatus("denied");
            return;
          }
        }

        if (!cancelled) setStatus("granted");
      } catch {
        if (!cancelled) setStatus("unauthenticated");
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