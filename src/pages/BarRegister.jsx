import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import POSBarRegister from "@/components/nups/POSBarRegister";
import RegisterStatusHeader from "@/components/nups/register/RegisterStatusHeader";
import NoBatchBanner from "@/components/nups/register/NoBatchBanner";

/**
 * BarRegister — the BARTENDER's dedicated station (owner directive
 * 2026-07-17 rev 3). Bar POS only — no door register, no cross-role tabs.
 * Front Door keeps the door register; this page is strictly the bar.
 */
export default function BarRegister() {
  const [user, setUser] = useState(null);
  const [operator, setOperator] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    try {
      const op = sessionStorage.getItem("nups_kiosk_operator") || sessionStorage.getItem("nups_session");
      if (op) setOperator(JSON.parse(op));
    } catch { /* no operator context */ }
  }, []);

  const { data: batches = [] } = useQuery({
    queryKey: ["active-pos-batch"],
    queryFn: async () => {
      const all = await base44.entities.POSBatch.list("-created_date", 5);
      return all.filter((b) => (b.status || "open").toLowerCase() === "open");
    },
    refetchInterval: 30000,
  });
  const activeBatch = batches[0];

  return (
    <NUPSAppShell
      title="Bar Register"
      subtitle={`${operator?.full_name || user?.full_name || "Bartender"} · Bar POS · Live ring-up`}
      role="BARTENDER"
    >
      <div className="max-w-[1600px] mx-auto space-y-4">
        <RegisterStatusHeader user={user} batch={activeBatch} registerType="Bar" />
        <NoBatchBanner batch={activeBatch} />
        <POSBarRegister user={user} />
      </div>
    </NUPSAppShell>
  );
}