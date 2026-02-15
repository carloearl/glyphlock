import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Shield, LogIn, Loader2, CheckCircle2, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const CLICKWRAP_TERMS = [
  "I understand this system contains confidential business information.",
  "I agree to the company's data privacy and security policies.",
  "I will not share my login credentials with unauthorized individuals.",
  "I acknowledge that all actions are logged and audited.",
  "I agree to the Independent Contractor Agreement terms (if applicable).",
  "I understand misuse of this system may result in termination and legal action."
];

export default function NUPSLogin() {
  const [checking, setChecking] = useState(true);
  const [showClickwrap, setShowClickwrap] = useState(false);
  const [acks, setAcks] = useState(CLICKWRAP_TERMS.map(() => false));
  const allAcked = acks.every(Boolean);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          if (user.role === "admin") {
            window.location.href = createPageUrl("NUPSOwner");
          } else {
            window.location.href = createPageUrl("NUPSStaff");
          }
          return;
        }
      } catch (err) {}
      setChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
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
              <div className="space-y-3 mb-6">
                <Button
                  onClick={() => setShowClickwrap(true)}
                  className="w-full h-14 text-lg bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] hover:from-[#6D28D9] hover:to-[#2563EB] rounded-xl"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Admin / Owner Login
                </Button>

                <Button
                  onClick={() => setShowClickwrap(true)}
                  variant="outline"
                  className="w-full h-14 text-lg border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 rounded-xl"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Staff Login
                </Button>

                <Button
                  onClick={() => setShowClickwrap(true)}
                  variant="outline"
                  className="w-full h-14 text-lg border-pink-500/50 text-pink-400 hover:bg-pink-500/10 rounded-xl"
                >
                  <FileSignature className="w-5 h-5 mr-2" />
                  Entertainer Login
                </Button>
              </div>

              <div className="pt-4 border-t border-[#3B82F6]/30">
                <div className="text-xs text-white/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Staff Access:</span>
                    <span className="text-[#3B82F6]">POS, Time Clock, Sales</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Owner Access:</span>
                    <span className="text-[#8B5CF6]">Full Admin + Live View + Reports</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Entertainer:</span>
                    <span className="text-pink-400">Check-In, Floor Status</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}