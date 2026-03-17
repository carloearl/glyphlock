import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NUPSLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Enter") navigate("/NUPSLogin");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d2e] via-black to-[#0d1a30] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-900/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-900/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)]">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-[0.3em] text-violet-400 uppercase">GlyphLock</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">N.U.P.S.</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase font-medium">
              Nexus Unified Portal System
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6">
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            N.U.P.S. is the operational backbone for entertainment venue management — 
            powering point-of-sale, entertainer payroll, GlyphBucks & GlyphCoin currency, 
            VIP contract workflows, staff scheduling, and financial reporting.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["POS", "Payroll", "Contracts", "GlyphBucks", "GlyphCoin", "Staff Clock-In", "VIP Management"].map(tag => (
              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Security notice */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-400/80 flex items-start gap-2">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>Access is restricted to authorized personnel only. All sessions are logged and audited. Unauthorized access attempts are recorded.</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/NUPSLogin")}
            className="h-14 px-8 text-lg font-black bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.4)] active:scale-95 transition-all"
          >
            Enter N.U.P.S.
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/DreamDollarHub")}
            className="h-14 px-6 text-sm font-semibold border-white/10 text-gray-400 hover:text-white hover:border-white/20 rounded-xl"
          >
            <Info className="w-4 h-4 mr-2" />
            What is NUPS?
          </Button>
        </div>

        <p className="text-[10px] text-gray-700">
          Secured by GlyphLock Financial LLC · All access requires valid credentials · v3.0
        </p>
      </div>
    </div>
  );
}