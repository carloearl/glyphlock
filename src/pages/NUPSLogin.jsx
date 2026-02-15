import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, Lock, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NUPSLogin() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.role === 'admin') {
            window.location.href = createPageUrl("NUPSOwner");
          } else {
            window.location.href = createPageUrl("NUPSStaff");
          }
          return;
        }
      } catch (err) {
        // Not authenticated — show login screen
      }
      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    // Use Base44's built-in auth with redirect back to THIS page after login
    base44.auth.redirectToLogin(createPageUrl("NUPSLogin"));
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1E40AF]/20 via-[#7C3AED]/10 to-[#3B82F6]/20" />
      
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(124,58,237,0.3)]">
          <div className="text-center mb-8">
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

          <Button
            onClick={handleLogin}
            className="w-full h-14 text-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] rounded-xl"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In to N.U.P.S.
          </Button>

          <div className="mt-6 pt-4 border-t border-[#3B82F6]/30 w-full">
            <div className="text-xs text-white/60 space-y-2">
              <div className="flex items-center justify-between">
                <span>Staff Access:</span>
                <span className="text-[#3B82F6]">POS, Time Clock, Sales</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Owner Access:</span>
                <span className="text-[#8B5CF6]">Full Admin + Live View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}