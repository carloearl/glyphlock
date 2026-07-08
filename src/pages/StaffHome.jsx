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
import { base44 } from "@/api/base44Client";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffShiftFlow from "@/components/nups/flows/StaffShiftFlow";
import StaffQuickActions from "@/components/nups/staff/StaffQuickActions";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function StaffHome() {
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Step 1 — §3 linear flow: clock in/out is always the largest element */}
        <section aria-label="Your shift">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Step 1 · Clock In</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {user && (
            <StaffShiftFlow
              user={user}
              venueId={venue?.venue_id || venue?.id}
              station="door"
            />
          )}
        </section>

        {/* Step 2 — W3-012B Cycle 1: big station tiles so a first-shift
            employee can find Front Door, Check-In, Register, Driver
            Payouts, and Receipts without hunting. Navigation only —
            each destination keeps its own route guard. */}
        <StaffQuickActions />
      </main>
    </div>
  );
}