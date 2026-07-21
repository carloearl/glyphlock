/**
 * HostessHome — dedicated landing for the VIP Hostess (STAFF class).
 *
 * A hostess sees only what she works:
 *   1. Her punch clock (StaffShiftFlow — station "vip")
 *   2. Her stations (VIP Sale Desk, Entertainer Check-In, Receipts)
 *
 * No door, register, driver, admin, or manager surfaces. Route guarded to
 * HOSTESS/FLOOR_HOST plus MANAGER + ADMIN for support.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffShiftFlow from "@/components/nups/flows/StaffShiftFlow";
import StaffQuickActions from "@/components/nups/staff/StaffQuickActions";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function HostessHome() {
  const [user, setUser] = useState(null);
  const venue = useActiveVenue();

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
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
      <header className="border-b border-white/5 bg-black/40 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-purple-300" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">NUPS · VIP Hostess</div>
              <div className="font-black text-white text-base">
                {firstName ? `Hi, ${firstName}` : "Welcome"}
              </div>
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
        <section aria-label="Your shift">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Step 1 · Clock In</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          {user && (
            <StaffShiftFlow
              user={user}
              venueId={venue?.venue_id || venue?.id}
              station="vip"
            />
          )}
        </section>

        <StaffQuickActions role={user?.role || "HOSTESS"} />
      </main>
    </div>
  );
}