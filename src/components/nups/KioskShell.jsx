import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Expand, LogOut } from "lucide-react";
import KioskExitModal from "@/components/nups/KioskExitModal";
import GlobalBackButton from "@/components/nups/GlobalBackButton";
import { enterKioskMode, exitKioskMode, isKioskMode } from "@/lib/nups/kioskMode";
import {
  exitSecureDisplay,
  isEmbeddedPreview,
  isSecureDisplayActive,
  requestSecureDisplay,
} from "@/lib/nups/secureDisplay";
import { base44 } from "@/api/base44Client";

const PUBLIC_LANDING_PATHS = new Set(["/nupslanding", "/landing"]);

/**
 * KioskShell
 *
 * Operational NUPS routes run in a session-locked shell. Public landing pages
 * remain normal until the user actually enters NUPS. Once an operational
 * session begins, leaving NUPS requires the Manager PIN.
 */
export default function KioskShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isPublicLanding = PUBLIC_LANDING_PATHS.has(location.pathname.toLowerCase());
  const preview = isEmbeddedPreview();

  const [showExit, setShowExit] = useState(false);
  const [kiosk, setKiosk] = useState(isKioskMode());
  const [secureDisplay, setSecureDisplay] = useState(
    preview || isSecureDisplayActive()
  );
  const [resuming, setResuming] = useState(false);

  // A direct visit to the public landing does not enter kiosk mode. If an
  // already-locked operator somehow reaches the landing, the lock remains.
  useEffect(() => {
    if (isPublicLanding && !isKioskMode()) return;
    if (!isKioskMode()) enterKioskMode();
    setKiosk(true);
  }, [isPublicLanding]);

  // Freeze operational data whenever browser fullscreen is left. Managed kiosk
  // and installed standalone displays do not need this browser-level check.
  useEffect(() => {
    if (preview) return undefined;
    const sync = () => setSecureDisplay(isSecureDisplayActive());
    document.addEventListener("fullscreenchange", sync);
    window.addEventListener("focus", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [preview]);

  // Heartbeat keeps an authenticated operator shift alive while NUPS is open.
  useEffect(() => {
    if (!kiosk) return undefined;
    const beat = () => {
      const token = sessionStorage.getItem("nups_kiosk_session");
      if (!token) return;
      base44.functions.invoke("nupsClockIn", {
        action: "heartbeat",
        kiosk_session: token,
      }).catch(() => {});
    };
    beat();
    const id = setInterval(beat, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [kiosk]);

  const resumeSecureDisplay = async () => {
    setResuming(true);
    const ok = await requestSecureDisplay();
    setSecureDisplay(ok || isSecureDisplayActive());
    setResuming(false);
  };

  const handleVerified = async () => {
    exitKioskMode();
    setKiosk(false);
    setShowExit(false);
    await exitSecureDisplay();
    navigate("/");
  };

  const showOperationalChrome = kiosk && !isPublicLanding;
  const displayPaused = showOperationalChrome && !secureDisplay && !preview;

  return (
    <div className="min-h-screen bg-black text-white">
      {showOperationalChrome && (
        <div className="sticky top-0 z-50 flex items-center justify-between gap-2 px-4 py-2 bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 border-b border-cyan-500/20 backdrop-blur">
          <div className="min-w-0">
            <GlobalBackButton inline />
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

      <div className={showOperationalChrome ? "pb-16" : ""}>{children}</div>

      {displayPaused && (
        <div className="fixed inset-0 z-[95] bg-slate-950 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900 p-7 text-center shadow-2xl">
            <Expand className="w-12 h-12 mx-auto text-cyan-300 mb-4" />
            <h2 className="text-2xl font-black">Secure NUPS display paused</h2>
            <p className="mt-3 text-sm text-slate-400">
              Resume fullscreen to continue. Operational information stays hidden until NUPS returns to its secure display.
            </p>
            <button
              onClick={resumeSecureDisplay}
              disabled={resuming}
              className="mt-6 w-full min-h-[52px] rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-slate-950 font-black"
            >
              {resuming ? "Resuming…" : "Resume Secure NUPS"}
            </button>
            <button
              onClick={() => setShowExit(true)}
              className="mt-3 w-full min-h-[48px] rounded-xl border border-red-500/40 bg-red-950/30 text-red-300 font-bold"
            >
              Manager Exit
            </button>
          </div>
        </div>
      )}

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
