import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, Lock, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GlyphInput, GlyphButton, GlyphFormPanel } from "@/components/ui/GlyphForm";

export default function NUPSLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await base44.auth.me();
        if (user.role === 'admin') {
          window.location.href = createPageUrl("NUPSOwner");
        } else {
          window.location.href = createPageUrl("NUPSStaff");
        }
      } else {
        base44.auth.redirectToLogin(createPageUrl("NUPSLogin"));
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/20 via-[#7C3AED]/10 to-[#3B82F6]/20" />
      
      <div className="relative z-10">
        <GlyphFormPanel title="">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#3B82F6] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(124,58,237,0.5)]">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black">
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text text-transparent">
                N.U.P.S.
              </span>{" "}
              <span className="text-white">POS</span>
            </h1>
            <p className="text-white/60 mt-1 text-sm">Nexus Universal Point-of-Sale</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-500/20 border-red-500/50">
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <GlyphInput
              type="email"
              placeholder="staff@glyphlock.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <GlyphInput
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <GlyphButton type="submit" variant="mixed" className="w-full mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </GlyphButton>
          </form>

          <div className="mt-6 pt-4 border-t border-[#3B82F6]/30 w-full">
            <div className="text-xs text-white/60 space-y-2">
              <div className="flex items-center justify-between">
                <span>Staff Access:</span>
                <span className="text-[#3B82F6]">Basic Operations</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Manager Access:</span>
                <span className="text-[#60A5FA]">Reports & Inventory</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Owner Access:</span>
                <span className="text-[#8B5CF6]">Full Administration</span>
              </div>
            </div>
          </div>
        </GlyphFormPanel>
      </div>
    </div>
  );
}