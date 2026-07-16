import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Sparkles, Car, Clock } from "lucide-react";

/**
 * FrontDoorStats — live counters for the door operator's at-a-glance bar.
 * Lightweight: 4 parallel queries, refetched every 30s.
 */
export default function FrontDoorStats({ venueId }) {
  const today = new Date().toISOString().split("T")[0];

  const { data: guestCount = 0 } = useQuery({
    queryKey: ["fd-guests", venueId],
    queryFn: async () => {
      const all = await base44.entities.VIPGuest.list("-created_date", 200);
      return all.filter((g) => g.status === "in_building").length;
    },
    refetchInterval: 30000,
  });

  const { data: dancerCount = 0 } = useQuery({
    queryKey: ["fd-dancers", venueId],
    queryFn: async () => {
      const filter = venueId ? { venue_id: venueId } : {};
      const shifts = await base44.entities.EntertainerShift.filter(filter, "-created_date", 200);
      return shifts.filter((s) => !s.check_out_time).length;
    },
    refetchInterval: 30000,
  });

  const { data: driverCount = 0 } = useQuery({
    queryKey: ["fd-drivers", venueId, today],
    queryFn: async () => {
      const filter = venueId ? { venue_id: venueId, payout_date: today } : { payout_date: today };
      const sessions = await base44.entities.DriverPayout.filter(filter);
      return sessions.filter((s) => s.status === "pending").length;
    },
    refetchInterval: 30000,
  });

  const stats = [
    { label: "Guests In", value: guestCount, icon: Users, color: "cyan" },
    { label: "Dancers", value: dancerCount, icon: Sparkles, color: "pink" },
    { label: "Drivers", value: driverCount, icon: Car, color: "yellow" },
    { label: "Tonight", value: today.slice(5), icon: Clock, color: "violet" },
  ];

  const colorMap = {
    cyan: "border-cyan-500/40 text-cyan-400",
    pink: "border-pink-500/40 text-pink-400",
    yellow: "border-yellow-500/40 text-yellow-400",
    violet: "border-violet-500/40 text-violet-400",
  };

  // Compact 2×2 grid — sized for the narrow Live Pulse side rail.
  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div
            key={s.label}
            className={`bg-gray-900/60 border rounded-lg p-2.5 ${colorMap[s.color]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold truncate">
                  {s.label}
                </div>
                <div className="text-lg font-black text-white mt-0.5 tabular-nums">{s.value}</div>
              </div>
              <Icon className="w-4 h-4 opacity-70 shrink-0" />
            </div>
          </div>
        );
      })}
    </div>
  );
}