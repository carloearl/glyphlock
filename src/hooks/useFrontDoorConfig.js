import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { writeEntity } from "@/lib/nups/writeEntity";

// ─── Default tabs — fallback when no FrontDoorConfig exists yet ──────────────
export const DEFAULT_FRONT_DOOR_TABS = [
  { id: "guests",  label: "Guests",  enabled: true, order: 0 },
  { id: "dancers", label: "Dancers", enabled: true, order: 1 },
  { id: "drivers", label: "Drivers", enabled: true, order: 2 },
  { id: "staff",   label: "Staff",   enabled: true, order: 3 },
];

export const DEFAULT_FRONT_DOOR_CONFIG = {
  tabs: DEFAULT_FRONT_DOOR_TABS,
  show_stats: true,
  show_settlement_ticker: true,
};

// Merge stored tabs with defaults so newly-added tab types are auto-included
function reconcileTabs(stored = []) {
  const byId = new Map(stored.map(t => [t.id, t]));
  const merged = DEFAULT_FRONT_DOOR_TABS.map(def => byId.get(def.id) || def);
  return merged.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export function useFrontDoorConfig(venueId) {
  const qc = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["front-door-config", venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const rows = await base44.entities.FrontDoorConfig.filter({ venue_id: venueId }, null, 1);
      const row = rows[0];
      if (!row) return { ...DEFAULT_FRONT_DOOR_CONFIG, venue_id: venueId, _new: true };
      return {
        ...row,
        tabs: reconcileTabs(row.tabs || []),
        show_stats: row.show_stats !== false,
        show_settlement_ticker: row.show_settlement_ticker !== false,
      };
    },
    enabled: !!venueId,
    staleTime: 30000,
  });

  const save = useMutation({
    mutationFn: async (next) => {
      const payload = {
        venue_id: venueId,
        tabs: next.tabs,
        show_stats: !!next.show_stats,
        show_settlement_ticker: !!next.show_settlement_ticker,
        notes: next.notes || "",
        last_updated_by: next.last_updated_by || "",
      };
      if (!venueId) throw new Error("Select an active venue before saving front-door configuration.");
      const me = await base44.auth.me();
      const result = await writeEntity({
        entity: "FrontDoorConfig",
        operation: config?.id ? "update" : "create",
        id: config?.id,
        data: payload,
        actor: { email: me?.email, id: me?.id, role: me?._highestRole || me?.role || "External" },
        venue_id: venueId,
        intent: config?.id ? "FRONT_DOOR_CONFIG_UPDATE" : "FRONT_DOOR_CONFIG_CREATE",
      });
      if (!result?.ok) throw new Error(result?.block_reason || "Front-door configuration write was rejected.");
      return result.value;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["front-door-config", venueId] }),
  });

  return { config, isLoading, save };
}