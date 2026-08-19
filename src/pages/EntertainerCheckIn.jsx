/**
 * EntertainerCheckIn — dedicated entertainer tab station.
 * ──────────────────────────────────────────────────────
 *   Check-In tab   → PIN pad + daily checklist + active roster
 *   Onboarding tab → scan / photo-capture the adult-entertainment license,
 *                    store credentials, flag expiring + expired licenses.
 *
 * Expired or missing licenses cannot check in and cannot take a nightly cash
 * payout — earnings accrue as an IOU until a valid license is on file.
 */
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import RoleClassGuard from "@/components/nups/RoleClassGuard";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Music, IdCard, LogIn } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EntertainerCheckInStation from "@/components/nups/EntertainerCheckIn";
import EntertainerIdOnboardPanel from "@/components/nups/entertainers/EntertainerIdOnboardPanel";
import EntertainerCredentialRoster from "@/components/nups/entertainers/EntertainerCredentialRoster";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { resolveVenueId } from "@/lib/venueDefaults";

export default function EntertainerCheckInPage() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = resolveVenueId(activeVenue?.id || activeVenue?.venue_id);

  const { data: me } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 300000,
  });

  const { data: entertainers = [], refetch } = useQuery({
    queryKey: ["entertainers", venueId],
    queryFn: async () => {
      const rows = await base44.entities.Entertainer.filter({ venue_id: venueId, status: "active" }, "-created_date", 200);
      return rows.filter((e) => e.is_demo !== true);
    },
    enabled: !!venueId,
  });

  return (
    <RoleClassGuard allow={["ENTERTAINER", "STAFF", "MANAGER", "ADMIN"]}>
      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-white/10 px-4 py-3 bg-black/95 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate("/NUPSKiosk")}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              <ArrowLeft className="w-4 h-4" /> Kiosk
            </button>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-pink-400" />
              <div>
                <div className="text-sm font-bold">Entertainers</div>
                <div className="text-[10px] text-pink-400">Check-in · Licensing &amp; onboarding</div>
              </div>
            </div>
            <div className="w-12" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto p-4">
          <Tabs defaultValue="checkin" className="space-y-4">
            <TabsList className="grid grid-cols-2 bg-gray-900 border border-gray-800">
              <TabsTrigger value="checkin" className="data-[state=active]:bg-pink-600/30 text-sm">
                <LogIn className="w-4 h-4 mr-1.5" /> Check-In
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="data-[state=active]:bg-pink-600/30 text-sm">
                <IdCard className="w-4 h-4 mr-1.5" /> Onboarding &amp; Licenses
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checkin">
              <EntertainerCheckInStation user={me} />
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-4">
              <EntertainerIdOnboardPanel
                venueId={venueId}
                user={me}
                existing={entertainers}
                onSaved={() => refetch()}
              />
              <EntertainerCredentialRoster entertainers={entertainers} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </RoleClassGuard>
  );
}