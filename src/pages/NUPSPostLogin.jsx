import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

// Maps the role card the user selected to the correct dashboard page
const ROLE_CARD_DESTINATIONS = {
  Admin:       "NUPSOwner",
  Manager:     "NUPSOwner",
  Staff:       "NUPSStaff",
  Entertainer: "EntertainerCheckIn",
};

// Maps base44 platform role (admin/user) to a fallback destination
function getFallbackDestination(base44Role) {
  return base44Role === "admin" ? "NUPSOwner" : "NUPSStaff";
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

        // Pull the saved destination (set before redirect to sign-in)
        const savedDest = sessionStorage.getItem("nups_destination");
        const roleHint  = sessionStorage.getItem("nups_role_hint");
        sessionStorage.removeItem("nups_destination");
        sessionStorage.removeItem("nups_role_hint");

        // Prefer the explicit destination the user chose from the login card
        if (savedDest && ROLE_CARD_DESTINATIONS[roleHint]) {
          window.location.href = createPageUrl(ROLE_CARD_DESTINATIONS[roleHint]);
          return;
        }

        // Fallback: derive from base44 platform role
        const user = await base44.auth.me();
        window.location.href = createPageUrl(getFallbackDestination(user.role));
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