import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * NUPSStaff — LEGACY REDIRECT
 * ─────────────────────────────────
 * This surface was the original staff portal. Every operator function
 * (POS, drivers, entertainer check-in, time clock, transactions) has
 * been merged into RegisterConsole under NUPSAppShell. Anyone landing
 * here is forwarded to the unified Register page so there is exactly
 * one operator front door across the system.
 */
export default function NUPSStaff() {
  const navigate = useNavigate();
  useEffect(() => {
    // Slight delay so the redirect message is visible if the user manually
    // typed the old URL — confirms the merge, then proceeds.
    const t = setTimeout(() => navigate("/RegisterConsole", { replace: true }), 600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="text-center space-y-3 max-w-md">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
        <h1 className="text-white text-lg font-bold">Consolidating to Register Console…</h1>
        <p className="text-slate-400 text-sm">
          The Staff Portal has been merged into the unified Register Console under the NUPS Hub navigation.
        </p>
      </div>
    </div>
  );
}