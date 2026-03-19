import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  Shield, Crown, Users, UserCheck, Music, FlaskConical,
  ChevronRight, Lock, AlertTriangle, Loader2, LogOut, ArrowLeft,
  Zap, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROLE_CARDS = [
  {
    key: "owner",
    label: "Owner / System Administrator",
    sub: "Full system access · Reports · Payroll · Admin tools",
    icon: Crown,
    gradient: "from-violet-600/20 to-purple-600/20",
    border: "border-violet-500/30 hover:border-violet-400/60",
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    requiredRoles: ["PLATFORM_ADMIN", "VENUE_OWNER"],
    destination: "NUPSOwner",
    requiresAuth: true,
  },
  {
    key: "manager",
    label: "Manager Access",
    sub: "Floor ops · Staff oversight · Approval workflows",
    icon: Users,
    gradient: "from-blue-600/20 to-cyan-600/20",
    border: "border-blue-500/30 hover:border-blue-400/60",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
    requiredRoles: ["VENUE_MANAGER"],
    destination: "NUPSOwner",
    requiresAuth: true,
  },
  {
    key: "staff",
    label: "Staff Login",
    sub: "Register · Timeclock · Batches · My sales",
    icon: UserCheck,
    gradient: "from-cyan-600/20 to-teal-600/20",
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    requiredRoles: ["BARTENDER", "DJ", "SECURITY", "KIOSK"],
    destination: "NUPSStaff",
    requiresAuth: true,
  },
  {
    key: "entertainer",
    label: "Entertainer Check-In",
    sub: "Clock in · Contract · Earnings · Profile",
    icon: Music,
    gradient: "from-pink-600/20 to-rose-600/20",
    border: "border-pink-500/30 hover:border-pink-400/60",
    iconColor: "text-pink-400",
    iconBg: "bg-pink-500/10",
    requiredRoles: ["PERFORMER"],
    destination: "EntertainerCheckIn",
    requiresAuth: true,
  },
  {
    key: "sandbox",
    label: "Sandbox Demonstration",
    sub: "Demo mode · Mock data · Full workflow preview",
    icon: FlaskConical,
    gradient: "from-emerald-600/20 to-green-600/20",
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    requiredRoles: [],
    destination: "NUPSSandbox",
    requiresAuth: false,
  },
];

const OWNER_EMAIL = 'carloearl@glyphlock.com';

export default function NUPSGateway() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedCard, setDeniedCard] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const u = await base44.auth.me();
          // Lock gateway to owner only
          if (u?.email?.toLowerCase() !== OWNER_EMAIL) {
            navigate('/NUPSLanding');
            return;
          }
          setUser(u);
          try {
            const res = await base44.functions.invoke("getUserPermissions", {});
            setUserPermissions(res.data);
          } catch {
            // RBAC unavailable — fall back to base role
            setUserPermissions({ base44_role: u.role, venue_access: [] });
          }
        } else {
          navigate('/NUPSLanding');
          return;
        }
      } catch {
        navigate('/NUPSLanding');
        return;
      }
      setLoading(false);
    })();
  }, []);

  const hasOperationalRole = (card) => {
    if (!card.requiresAuth) return true;
    if (!user) return false;

    // Platform admin gets everything
    if (user.role === "admin") return true;

    // Check RBAC venue_access roles
    const assignedRoles = userPermissions?.venue_access?.map(va => va.role_key) || [];
    const OWNER_TIER = ["PLATFORM_ADMIN", "VENUE_OWNER", "VENUE_MANAGER"];

    // Owner/Manager cards — check owner tier roles
    if (card.key === "owner" || card.key === "manager") {
      return assignedRoles.some(r => OWNER_TIER.includes(r));
    }

    // Other cards — check specific roles
    return card.requiredRoles.length === 0 || card.requiredRoles.some(r => assignedRoles.includes(r));
  };

  const handleCardClick = (card) => {
    // Sandbox — always accessible
    if (card.key === "sandbox") {
      navigate("/NUPSSandbox");
      return;
    }

    // Not authenticated — send to NUPS credential login
    if (!user) {
      navigate("/NUPSLogin");
      return;
    }

    // Authenticated — check operational role
    if (!hasOperationalRole(card)) {
      setDeniedCard(card);
      setAccessDenied(true);
      return;
    }

    navigate(`/${card.destination}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
      </div>
    );
  }

  // Access Denied overlay
  if (accessDenied && deniedCard) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900/80 border border-red-500/30 rounded-2xl p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-sm">
              Your account does not have the required operational role to access{" "}
              <span className="text-white font-semibold">{deniedCard.label}</span>.
            </p>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-left text-xs text-gray-400 space-y-1">
            <p className="font-bold text-red-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Required roles:</p>
            {deniedCard.requiredRoles.map(r => (
              <p key={r} className="font-mono text-gray-500">• {r}</p>
            ))}
            <p className="mt-2 text-gray-600">Contact a system administrator to request access.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setAccessDenied(false); setDeniedCard(null); }}
              className="flex-1 border-white/10 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button
              onClick={() => base44.auth.logout("/NUPSLanding")}
              className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d2e] via-black to-[#0a0a1e] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 md:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <button
            onClick={() => navigate("/NUPSLanding")}
            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-3 h-3" /> Back to NUPS Home
          </button>
          <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black">Access Gateway</h1>
          <p className="text-gray-500 text-sm mt-2">Select your role to authenticate and access your workspace</p>
          {user && (
            <div className="inline-flex items-center gap-2 mt-3 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-gray-400">Signed in as <span className="text-white font-medium">{user.email}</span></span>
              <button onClick={() => base44.auth.logout("/NUPSLanding")} className="text-[10px] text-red-400 hover:text-red-300 ml-1">
                Sign out
              </button>
            </div>
          )}
        </div>

        {/* Role Cards */}
        <div className="space-y-3">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            const canAccess = hasOperationalRole(card);
            const isLocked = card.requiresAuth && !user;

            return (
              <button
                key={card.key}
                onClick={() => handleCardClick(card)}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r ${card.gradient} border ${card.border} transition-all duration-200 active:scale-[0.98] text-left group`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base">{card.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{card.sub}</div>
                </div>
                <div className="flex-shrink-0">
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-gray-600" />
                  ) : !canAccess && user ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-red-400/60" />
                    </div>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-gray-700 mt-8">
          All access attempts are logged · Unauthorized access is prohibited · GlyphLock Financial LLC
        </p>
      </div>
    </div>
  );
}