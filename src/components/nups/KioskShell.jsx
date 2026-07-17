import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import KioskExitModal from "@/components/nups/KioskExitModal";
import { enterKioskMode, exitKioskMode, isKioskMode } from "@/lib/nups/kioskMode";

/**
 * KioskShell
 *
 * Wraps every NUPS page (including the public NUPS Landing). Entering ANY
 * NUPS route auto-locks the session into kiosk mode so the GlyphLock
 * marketing navbar/footer never appear next to NUPS surfaces. Exiting kiosk
 * mode requires Manager PIN (admin override available inside
 * ManagerPINVerifier for Carlo / AI / platform admins).
 */
export default function KioskShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExit, setShowExit] = useState(false);
  const [kiosk, setKiosk] = useState(isKioskMode());

  // Navigation lives in each page's own chrome (AppShell home button, role
  // workspace headers). The kiosk strip carries NO back button — a global
  // "Back" that ignored role silos sent staff to admin surfaces and stacked
  // a second back button on operator pages (nav audit 2026-07-17).
  void location;

  // Force the entire NUPS system into kiosk mode on entry.
  useEffect(() => {
    if (!isKioskMode()) {
      enterKioskMode();
      setKiosk(true);
    }
  }, []);

  const handleVerified = () => {
    exitKioskMode();
    setKiosk(false);
    setShowExit(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {kiosk && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 border-b border-cyan-500/20 backdrop-blur">
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
            <KioskExitModal
              onUnlock={handleVerified}
              onCancel={() => setShowExit(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}