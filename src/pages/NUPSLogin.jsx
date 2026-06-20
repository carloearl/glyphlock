import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Shield, LogIn, Eye, EyeOff, Loader2, AlertCircle, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { GLYPHLOCK_DISCLAIMER_SHORT } from '@/constants/legalDisclaimer';
import { saveActiveVenue } from '@/hooks/useActiveVenue';

// Role → destination page mapping
// Every operator lands on NUPSHub — the new unified operator dashboard.
// From there the persistent sidebar takes them to Register, Receipts,
// Driver Payouts, Accounting, Contracts, etc. The legacy NUPSOwner /
// NUPSStaff pages are no longer the primary entry points.
const ROLE_DESTINATIONS = {
  PLATFORM_ADMIN: "NUPSHub",
  VENUE_OWNER:    "NUPSHub",
  VENUE_MANAGER:  "NUPSHub",
  FLOOR_HOST:     "NUPSHub",
  DOOR_GIRL:      "NUPSHub",
  DOORMAN:        "NUPSHub",
  BARTENDER:      "NUPSHub",
  SECURITY:       "NUPSHub",
  DJ:             "NUPSHub",
  KIOSK:          "NUPSHub",
  SOVEREIGN:      "NUPSHub",
  PERFORMER:      "EntertainerCheckIn",
};

export default function NUPSLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [pin, setPin]           = useState("");
  const [showPin, setShowPin]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Store authenticated NUPS session in sessionStorage
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await base44.functions.invoke("nupsAuthenticate", { username, pin });
      const { success, user, error: serverError } = response.data;

      if (!success || serverError) {
        setError(serverError || "Invalid credentials.");
        setLoading(false);
        return;
      }

      // Store NUPS session (not the platform session)
      sessionStorage.setItem("nups_session", JSON.stringify(user));

      // TASK 2 — Activate venue after authenticated login
      try {
        const venues = await base44.entities.Venue.filter({ status: 'active' }, '-created_date', 1);
        const venue = venues?.[0];
        if (venue) { saveActiveVenue(venue); }
      } catch { /* non-blocking */ }

      // Demo accounts always go to sandbox
      if (user.is_demo || user.role === "DEMO") {
        navigate("/NUPSSandbox");
        return;
      }

      // Route based on role
      const dest = ROLE_DESTINATIONS[user.role] || "NUPSStaff";
      navigate(`/${dest}`);

    } catch (err) {
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      <SEOHead
        title="N.U.P.S. Login | Secure Staff Authentication"
        description="Secure login portal for NUPS point-of-sale staff and entertainers."
        noIndex={true}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/20 via-[#7C3AED]/10 to-[#3B82F6]/20 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">N.U.P.S.</span>
          </h1>
          <p className="text-white/50 mt-1 text-sm">Nexus Universal Point-of-Sale</p>
          <p className="text-white/30 text-xs mt-1">Enter your credentials to access your workspace</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.username"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode="text"
                  style={{ fontSize: '16px' }}
                  className="w-full bg-black/50 border border-gray-700 focus:border-violet-500 rounded-xl pl-10 pr-4 py-3 min-h-[48px] text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>
            </div>

            {/* PIN */}
            <div>
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1.5 block">
                PIN / Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  required
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  inputMode={showPin ? "text" : "numeric"}
                  style={{ fontSize: '16px' }}
                  className="w-full bg-black/50 border border-gray-700 focus:border-violet-500 rounded-xl pl-10 pr-14 py-3 min-h-[48px] text-white placeholder-gray-600 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(p => !p)}
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors w-11 h-11 flex items-center justify-center rounded-lg"
                  style={{ touchAction: 'manipulation' }}
                >
                  {showPin ? <EyeOff className="w-5 h-5 pointer-events-none" /> : <Eye className="w-5 h-5 pointer-events-none" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !username || !pin}
              style={{ touchAction: 'manipulation' }}
              className="w-full min-h-[52px] h-13 bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] rounded-xl font-bold text-base disabled:opacity-40 mt-2 active:scale-[0.98] transition-transform"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {loading ? "Verifying..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-[10px] text-gray-700 mt-5">
            Credentials are issued by system administrators only.<br />
            All access is logged and audited.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/NUPSLanding")}
          style={{ touchAction: 'manipulation' }}
          className="block mx-auto mt-4 px-4 py-3 min-h-[44px] text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ← Back to NUPS Home
        </button>

        <div className="text-center text-[10px] text-gray-700 mt-6 max-w-md mx-auto">
          {GLYPHLOCK_DISCLAIMER_SHORT}
        </div>
      </div>
    </div>
  );
}