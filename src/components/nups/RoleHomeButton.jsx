import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getOperatorHome } from "@/lib/nups/roleHomes";

/**
 * Role-aware back button — returns the signed-in kiosk operator to THEIR
 * workspace landing (hostess → VIP Sale, door → Front Door, etc.).
 * Renders nothing when there is no operator context (public/anonymous view).
 */
export default function RoleHomeButton({ className = "" }) {
  const navigate = useNavigate();
  const home = getOperatorHome();
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