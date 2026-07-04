/**
 * StaffHome — dedicated landing for the STAFF role class (DACO 003 §2).
 *
 * A W-2 employee (Door Girl, Doorman, Bartender, Security, DJ) sees only:
 *   1. Their punch clock (StaffClockInOut — unchanged business logic)
 *   2. One big tile to enter the Front Door register
 *
 * No admin, accounting, owner tabs, or manager consoles are surfaced.
 * Route guarded to STAFF + MANAGER + ADMIN (managers/admins can always
 * see a lesser class's home for support purposes).
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { DoorOpen, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function StaffHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const venue = useActiveVenue();

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        // Enrich with NUPSUser row (role lives there, not on base44 user)
        let nu = null;
        try {
          const matches = await base44.entities.NUPSUser.filter({ created_by: u.email });
          nu = (matches || [])[0] || null;
        } catch { /* silent */ }
        setUser({
          ...u,
          role: nu?.role || u.role,
          full_name: nu?.full_name || u.full_name,
          id: nu?.id || u.id,
        });
      } catch { /* auth guard elsewhere */ }
    })();
  }, []);

  const firstName = (user?.full_name || user?.email || "").split(/[ @]/)[0];

  return (
    <div className="min-h-screen bg-[#05070d] text-white flex flex-col">
      {/* Minimal top bar — no sidebar for STAFF */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="leading-tight">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">NUPS · Staff</div>
            <div className="font-black text-white text-base">
              {firstName ? `Hi, ${firstName}` : "Welcome"}
            </div>
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-5">
        {/* 1 — Clock in / out */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
            Step 1 · My Shift
          </div>
          {user && (
            <StaffClockInOut
              user={user}
              venueId={venue?.venue_id || venue?.id}
              station="door"
            />
          )}
        </div>

        {/* 2 — Front Door Register */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-2 px-1">
            Step 2 · Work the Door
          </div>
          <Card
            role="button"
            tabIndex={0}
            onClick={() => navigate("/FrontDoor")}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("/FrontDoor"); }}
            className="cursor-pointer bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-transparent border-emerald-500/30 hover:border-emerald-400/60 transition-colors"
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <DoorOpen className="w-7 h-7 text-emerald-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-lg">Open Front Door Register</div>
                <div className="text-sm text-slate-400">Ring covers, comps, drivers, and guests.</div>
              </div>
              <div className="hidden sm:block text-emerald-300 font-mono text-xs">GO →</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}