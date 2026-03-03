import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, LogIn, Loader2, CheckCircle2, FileSignature, Music } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLICKWRAP_TERMS = [
  "I understand this system contains confidential business information.",
  "I agree to the company's data privacy and security policies.",
  "I will not share my login credentials with unauthorized individuals.",
  "I acknowledge that all actions are logged and audited.",
  "I agree to the Independent Contractor Agreement terms (if applicable).",
  "I understand misuse of this system may result in termination and legal action."
];

// §9.2 RBAC role → dashboard route mapping
const OWNER_TIER_ROLES = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];
const PERFORMER_ROLES = ["PERFORMER"];
const STAFF_ROLES = ["BARTENDER", "FLOOR_HOST", "SECURITY", "DJ", "KIOSK"];

// Role card → forced route override (if set, skips RBAC routing)
const ROLE_CARD_ROUTES = {
  Admin: null,        // resolved via RBAC
  Staff: "NUPSStaff",
  Entertainer: "EntertainerCheckIn",
};

function resolveNUPSDashboard(permissionsData, base44Role, selectedRoleCard) {
  // If user picked Staff or Entertainer card explicitly, honour that choice
  if (selectedRoleCard && ROLE_CARD_ROUTES[selectedRoleCard]) {
    return ROLE_CARD_ROUTES[selectedRoleCard];
  }

  if (!permissionsData || !permissionsData.venue_access) {
    return base44Role === "admin" ? "NUPSOwner" : "NUPSStaff";
  }
  const roleKeys = permissionsData.venue_access.map(va => va.role_key);
  if (roleKeys.some(rk => OWNER_TIER_ROLES.includes(rk))) return "NUPSOwner";
  if (roleKeys.some(rk => PERFORMER_ROLES.includes(rk))) return "EntertainerCheckIn";
  if (roleKeys.some(rk => STAFF_ROLES.includes(rk))) return "NUPSStaff";
  return base44Role === "admin" ? "NUPSOwner" : "NUPSStaff";
}

export default function NUPSLogin() {
  const [checking, setChecking] = useState(true);
  const [showClickwrap, setShowClickwrap] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // 'Admin' | 'Staff' | 'Entertainer'
  const [acks, setAcks] = useState(CLICKWRAP_TERMS.map(() => false));
  const [accessDenied, setAccessDenied] = useState(false);
  const allAcked = acks.every(Boolean);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          // Consume role hint stored before redirect
          const roleHint = sessionStorage.getItem("nups_role_hint");
          sessionStorage.removeItem("nups_role_hint");

          let permissionsData = null;
          try {
            const res = await base44.functions.invoke('getUserPermissions', {});
            permissionsData = res.data;
          } catch (e) {
            console.warn("RBAC payload unavailable — using base44 fallback");
          }
          const user = await base44.auth.me();
          const target = resolveNUPSDashboard(permissionsData, user.role, roleHint);
          window.location.href = createPageUrl(target);
          return;
        }
      } catch (err) {}

      // Layer 1: Verify access token set by authorized entry points
      const accessToken = sessionStorage.getItem("nups_access_token");
      if (!accessToken) {
        setAccessDenied(true);
        setChecking(false);
        return;
      }
      // One-time use — consume immediately
      sessionStorage.removeItem("nups_access_token");

      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    // Store selected role so post-login redirect can use it
    if (selectedRole) sessionStorage.setItem("nups_role_hint", selectedRole);
    base44.auth.redirectToLogin(createPageUrl("NUPSLogin"));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500/60 mx-auto mb-4" />
          <p className="text-red-400 font-bold text-lg">Access Restricted</p>
          <p className="text-gray-600 text-sm mt-2">This system is not publicly accessible.</p>
          <button
            onClick={() => window.location.href = createPageUrl("Home")}
            className="mt-6 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/20 via-[#7C3AED]/10 to-[#3B82F6]/20" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">N.U.P.S.</span>{" "}
              <span className="text-white">POS</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm">Nexus Universal Point-of-Sale</p>
          </div>

          {/* Clickwrap Agreement */}
          {showClickwrap ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <FileSignature className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-amber-400">Staff / Entertainer Agreement</h3>
              </div>

              <div className="bg-black/50 border border-gray-700 rounded-lg p-3 max-h-48 overflow-y-auto space-y-3">
                {CLICKWRAP_TERMS.map((term, i) => (
                  <div key={i} className="flex items-start gap-3 cursor-pointer" onClick={() => setAcks(p => { const n = [...p]; n[i] = !n[i]; return n; })}>
                    <div className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 ${acks[i] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                      {acks[i] && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{term}</p>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleLogin}
                disabled={!allAcked}
                className="w-full h-14 text-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] rounded-xl disabled:opacity-40"
              >
                <LogIn className="w-5 h-5 mr-2" />
                I Agree — Sign In
              </Button>

              <button onClick={() => setShowClickwrap(false)} className="w-full text-xs text-gray-500 hover:text-gray-400 mt-1">
                ← Back
              </button>
            </div>
          ) : (
            <>
              {/* Role Selector Cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  {
                    icon: <Shield className="w-7 h-7" />,
                    label: "Admin",
                    sub: "Owner / Manager",
                    color: "from-violet-600/20 to-indigo-600/20",
                    border: "border-violet-500/40 hover:border-violet-400/70",
                    iconColor: "text-violet-400",
                    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]",
                  },
                  {
                    icon: <LogIn className="w-7 h-7" />,
                    label: "Staff",
                    sub: "POS · Time Clock",
                    color: "from-cyan-600/20 to-blue-600/20",
                    border: "border-cyan-500/40 hover:border-cyan-400/70",
                    iconColor: "text-cyan-400",
                    glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]",
                  },
                  {
                    icon: <Music className="w-7 h-7" />,
                    label: "Entertainer",
                    sub: "Check-In · Floor",
                    color: "from-pink-600/20 to-rose-600/20",
                    border: "border-pink-500/40 hover:border-pink-400/70",
                    iconColor: "text-pink-400",
                    glow: "hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]",
                  },
                ].map((role) => (
                  <button
                    key={role.label}
                    onClick={() => { setSelectedRole(role.label); setShowClickwrap(true); }}
                    className={`group flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${role.color} border ${role.border} ${role.glow} transition-all duration-200 active:scale-95 text-center`}
                  >
                    <span className={`${role.iconColor} transition-transform group-hover:scale-110 duration-200`}>
                      {role.icon}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{role.label}</div>
                      <div className="text-[10px] text-white/50 leading-tight mt-0.5">{role.sub}</div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-[11px] text-white/30">Select your role to continue</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}