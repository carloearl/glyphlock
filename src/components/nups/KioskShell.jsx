import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import ManagerPINVerifier from "@/components/nups/ManagerPINVerifier";
import { exitKioskMode, isKioskMode } from "@/lib/nups/kioskMode";

/**
 * KioskShell
 *
 * Wraps every post-login NUPS page. While kiosk mode is active, the GlyphLock
 * marketing navbar/footer are NOT rendered (those pages are listed as fullscreen
 * in App.jsx). This shell adds a thin top bar with a single "Exit" button —
 * exiting requires Manager PIN verification (admin override available inside
 * ManagerPINVerifier for Carlo / AI / platform admins).
 */
export default function KioskShell({ children }) {
  const navigate = useNavigate();
  const [showExit, setShowExit] = useState(false);
  const kiosk = isKioskMode();

  const handleVerified = () => {
    exitKioskMode();
    setShowExit(false);
    navigate("/NUPSLanding");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {kiosk && (
        <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 border-b border-cyan-500/20 backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-cyan-300/80 uppercase">
            <Shield className="w-3.5 h-3.5" />
            NUPS · Kiosk Mode
          </div>
          <button
            onClick={() => setShowExit(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600/15 border border-red-500/40 text-red-300 text-xs font-bold hover:bg-red-600/25 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Exit (Manager PIN)
          </button>
        </div>
      )}

      {children}

      {showExit && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ManagerPINVerifier
              purpose="exit kiosk mode"
              onVerified={handleVerified}
              onCancel={() => setShowExit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}