/**
 * DoormanHome — dedicated landing for the Doorman (STAFF class).
 *
 * A doorman sees only what he works:
 *   1. His punch clock (StaffShiftFlow — station "door")
 *   2. His stations (Front Door, ID Scanner, Driver Payouts, Receipts)
 *
 * No register, bar, DJ, admin, or manager surfaces. Route guarded to
 * DOORMAN/SECURITY plus MANAGER + ADMIN for support.
 */
import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import StaffShiftFlow from "@/components/nups/flows/StaffShiftFlow";
import StaffQuickActions from "@/components/nups/staff/StaffQuickActions";
import { useActiveVenue } from "@/hooks/useActiveVenue";

export default function DoormanHome() {
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
            <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-300" />
            </div>
            <div className="leading-tight">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">NUPS · Doorman</div>
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
              station="door"
            />
          )}
        </section>

        <StaffQuickActions role={user?.role || "DOORMAN"} />
      </main>
    </div>
  );
}