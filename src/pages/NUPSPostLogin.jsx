import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Maps actual Base44 role to authorized destination
function getAuthorizedDestination(user, requestedRoleKey) {
  // SECURITY: Only users with Base44 role "admin" can access Owner dashboard
  const isActualAdmin = user.role === "admin";
  
  // If user requested Admin/Manager but isn't actually admin, downgrade to Staff
  if ((requestedRoleKey === "Admin" || requestedRoleKey === "Manager") && !isActualAdmin) {
    return "NUPSStaff";
  }
  
  // Map based on actual role, not requested role
  if (isActualAdmin) return "NUPSOwner";
  if (requestedRoleKey === "Entertainer") return "EntertainerCheckIn";
  return "NUPSStaff";
}

export default function NUPSPostLogin() {
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl("NUPSLogin");
          return;
        }

        // Get authenticated user and verify actual role
        const user = await base44.auth.me();
        
        // Pull the role card the user selected (just a hint, not authorization)
        const roleHint = sessionStorage.getItem("nups_role_hint");
        sessionStorage.removeItem("nups_destination");
        sessionStorage.removeItem("nups_role_hint");

        // Route based on ACTUAL Base44 role, not what they selected on login card
        const destination = getAuthorizedDestination(user, roleHint);
        window.location.href = createPageUrl(destination);
      } catch (err) {
        setError("Authentication failed. Please try signing in again.");
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-xs">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-white font-bold">Something went wrong</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <Button onClick={() => { window.location.href = createPageUrl("NUPSLogin"); }}
            className="w-full bg-violet-600 hover:bg-violet-500">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 text-purple-400 mx-auto animate-spin" />
        <p className="text-white/50 text-sm">Routing to your dashboard…</p>
      </div>
    </div>
  );
}