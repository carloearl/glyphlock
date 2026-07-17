import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Role → dedicated workspace landing (destination-based, never history-based).
const ROLE_HOME = {
  HOSTESS: { path: "/VIPSale", label: "VIP Sale" },
  FLOOR_HOST: { path: "/VIPSale", label: "VIP Sale" },
  DJ: { path: "/DJHome", label: "DJ Booth" },
  DOOR_GIRL: { path: "/FrontDoor", label: "Front Door" },
  DOORMAN: { path: "/FrontDoor", label: "Front Door" },
  PERFORMER: { path: "/EntertainerHome", label: "Entertainer Home" },
  BARTENDER: { path: "/StaffHome", label: "Staff Home" },
  SECURITY: { path: "/StaffHome", label: "Staff Home" },
  DRIVER: { path: "/NUPSKiosk", label: "Kiosk" },
  VENUE_MANAGER: { path: "/ManagerConsole", label: "Manager Console" },
  VENUE_OWNER: { path: "/NUPSHub", label: "NUPS Hub" },
  PLATFORM_ADMIN: { path: "/NUPSHub", label: "NUPS Hub" },
  SOVEREIGN: { path: "/NUPSHub", label: "NUPS Hub" },
};

/**
 * Role-aware back button — returns the signed-in kiosk operator to THEIR
 * workspace landing (hostess → VIP Sale, door → Front Door, etc.).
 * Renders nothing when there is no operator context (public/anonymous view).
 */
export default function RoleHomeButton({ className = "" }) {
  const navigate = useNavigate();
  let operator = null;
  try { operator = JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "null"); } catch { /* none */ }
  const home = operator?.role ? ROLE_HOME[operator.role] : null;
  if (!home) return null;

  return (
    <button
      onClick={() => navigate(home.path)}
      className={`flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-600 hover:border-purple-400 text-slate-200 text-sm font-bold px-4 py-2 min-h-[44px] transition-all print:hidden ${className}`}
    >
      <ArrowLeft className="w-4 h-4" /> Back to {home.label}
    </button>
  );
}