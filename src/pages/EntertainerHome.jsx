/**
 * EntertainerHome — dedicated landing for the ENTERTAINER role class (DACO 003 §2).
 *
 * Wraps the existing EntertainerCheckIn kiosk component — one screen, one
 * task. Every other NUPS surface is hidden. Route guarded to
 * ENTERTAINER + MANAGER + ADMIN.
 */
import React from "react";
import { base44 } from "@/api/base44Client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import EntertainerCheckIn from "@/components/nups/EntertainerCheckIn";

export default function EntertainerHome() {
  return (
    <div className="min-h-screen bg-[#05070d] text-white flex flex-col">
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="leading-tight">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">NUPS · Entertainer</div>
            <div className="font-black text-white text-base">Check In</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => { await base44.auth.logout("/NUPSLanding"); }}
            className="text-slate-400 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <EntertainerCheckIn />
      </main>
    </div>
  );
}