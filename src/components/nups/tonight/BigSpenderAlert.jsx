import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, AlertOctagon, ChevronRight } from "lucide-react";

const BIG_SPENDER_THRESHOLD = 10000;

/**
 * Big Spender Alert — surfaces from the Tonight dashboard when a guest's
 * tonight spend crosses $10,000. Triggers the Contracts Hub workflow
 * (Letter of Intent + Dancer Questionnaire).
 */
export default function BigSpenderAlert({ venueId }) {
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);

  // Aggregate POSTransaction totals per VIP guest for tonight only
  const { data: vipGuests = [] } = useQuery({
    queryKey: ["bigspender-vip", venueId],
    queryFn: () => base44.entities.VIPGuest.list("-check_in_time", 100),
    staleTime: 30_000,
  });

  // Roll up tonight's spend - prefer VIPGuest.total_spent_tonight (already aggregated),
  // fall back to POSTransaction sum where available
  const bigSpenders = useMemo(() => {
    const tonightActive = vipGuests.filter((g) => {
      if (!g.check_in_time) return false;
      return g.check_in_time.slice(0, 10) === today;
    });
    return tonightActive
      .map((g) => ({
        id: g.id,
        name: g.guest_name,
        spend: Number(g.total_spent_tonight || 0),
        membership: g.membership_number,
      }))
      .filter((g) => g.spend >= BIG_SPENDER_THRESHOLD)
      .sort((a, b) => b.spend - a.spend);
  }, [vipGuests, today]);

  if (bigSpenders.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-2 border-amber-500/50 rounded-xl p-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Crown className="w-6 h-6 text-amber-300" />
            <AlertOctagon className="w-3 h-3 text-rose-400 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-200">Big Spender Protocol Active</h3>
            <p className="text-[10px] text-amber-300/70">
              {bigSpenders.length} guest{bigSpenders.length !== 1 ? "s" : ""} crossed the ${BIG_SPENDER_THRESHOLD.toLocaleString()} threshold — file Letter of Intent + Questionnaire.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("/Contracts?tab=bigspender")}
          className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold h-8"
        >
          Open Hub <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-1.5">
        {bigSpenders.map((g) => (
          <div
            key={g.id}
            className="flex items-center justify-between p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span className="text-white font-bold truncate">{g.name || "—"}</span>
              {g.membership && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-[9px] font-mono">
                  {g.membership}
                </Badge>
              )}
            </div>
            <span className="font-mono font-bold text-amber-200">${g.spend.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}