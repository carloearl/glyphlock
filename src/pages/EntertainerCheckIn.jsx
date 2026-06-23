/**
 * EntertainerCheckIn — Simple door PIN station.
 * ─────────────────────────────────────────────
 * Stripped to one job: an entertainer walks up, taps "Check In", agrees
 * to the daily checklist, punches their PIN, and is on the floor. The
 * tabbed onboarding-hub flow was moved into the Manager Console.
 *
 * Renders the existing <EntertainerCheckIn /> component (PIN pad + daily
 * checklist + active-shift roster) as a fullscreen kiosk surface.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";

export default function EntertainerCheckInPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 bg-black/95 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/NUPSGateway")}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" /> Gateway
          </button>
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-pink-400" />
            <div>
              <div className="text-sm font-bold">Entertainer Check-In</div>
              <div className="text-[10px] text-pink-400">Door station · PIN entry only</div>
            </div>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <EntertainerCheckIn />
      </main>
    </div>
  );
}