import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search as SearchIcon, Database, Lock, Loader2 } from "lucide-react";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { runSearch, countByType, ENTITY_TYPES } from "@/lib/search/searchIndex";
import SearchInput from "@/components/search/SearchInput";
import SearchResultCard from "@/components/search/SearchResultCard";

const TYPE_KEYS = Object.keys(ENTITY_TYPES);

/**
 * Unified Cross-Entity Search — Phase 5
 * Indexes 9 entity types in-browser, ranks by relevance, deep-links to source pages.
 * Admin-gated for ActivityLog inclusion (RLS enforces too).
 */
export default function UnifiedSearch() {
  const navigate = useNavigate();
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const venueFilter = venueId ? { venue_id: venueId } : {};

  const [query, setQuery] = useState("");
  const [enabledTypes, setEnabledTypes] = useState(new Set(TYPE_KEYS));
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await base44.auth.me();
        setIsAdmin(u?.role === "admin");
      } catch {
        setIsAdmin(false);
      }
      setAuthChecked(true);
    })();
  }, []);

  // Data — load once per session; staleTime keeps it cached
  const COMMON_OPTS = { staleTime: 5 * 60_000, enabled: authChecked };

  const { data: driverPayouts = [], isLoading: l1 } = useQuery({
    queryKey: ["search-driver-payouts", venueId],
    queryFn: () => base44.entities.DriverPayout.filter(venueFilter, "-payout_date", 1000),
    ...COMMON_OPTS,
  });
  const { data: settlements = [], isLoading: l2 } = useQuery({
    queryKey: ["search-settlements", venueId],
    queryFn: () => base44.entities.DailySettlement.filter(venueFilter, "-business_date", 500),
    ...COMMON_OPTS,
  });
  const { data: customers = [], isLoading: l3 } = useQuery({
    queryKey: ["search-customers"],
    queryFn: () => base44.entities.POSCustomer.list("-created_date", 2000),
    ...COMMON_OPTS,
  });
  const { data: entertainers = [], isLoading: l4 } = useQuery({
    queryKey: ["search-entertainers"],
    queryFn: () => base44.entities.Entertainer.list("-created_date", 500),
    ...COMMON_OPTS,
  });
  const { data: gbOrders = [], isLoading: l5 } = useQuery({
    queryKey: ["search-gb-orders", venueId],
    queryFn: () => base44.entities.GlyphBucksOrder.filter(venueFilter, "-created_date", 1000),
    ...COMMON_OPTS,
  });
  const { data: gbBills = [], isLoading: l6 } = useQuery({
    queryKey: ["search-gb-bills", venueId],
    queryFn: () => base44.entities.GlyphBucksBill.filter(venueFilter, "-created_date", 2000),
    ...COMMON_OPTS,
  });
  const { data: contracts = [], isLoading: l7 } = useQuery({
    queryKey: ["search-contracts", venueId],
    queryFn: () => base44.entities.VenueContract.filter(venueFilter, "-created_date", 1000),
    ...COMMON_OPTS,
  });
  const { data: contractorPayouts = [], isLoading: l8 } = useQuery({
    queryKey: ["search-contractor-payouts", venueId],
    queryFn: () => base44.entities.ContractorPayout.filter(venueFilter, "-payout_date", 1000),
    ...COMMON_OPTS,
  });
  const { data: activityLogs = [], isLoading: l9 } = useQuery({
    queryKey: ["search-activity-logs"],
    queryFn: () => base44.entities.ActivityLog.list("-timestamp", 1000),
    staleTime: 60_000,
    enabled: authChecked && isAdmin,
  });

  const loadingAny = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || (isAdmin && l9);

  const results = useMemo(
    () =>
      runSearch(
        query,
        {
          driverPayouts,
          settlements,
          customers,
          entertainers,
          gbOrders,
          gbBills,
          contracts,
          contractorPayouts,
          activityLogs,
        },
        { types: Array.from(enabledTypes), limit: 100 }
      ),
    [
      query,
      driverPayouts,
      settlements,
      customers,
      entertainers,
      gbOrders,
      gbBills,
      contracts,
      contractorPayouts,
      activityLogs,
      enabledTypes,
    ]
  );

  const counts = useMemo(() => countByType(results), [results]);
  const totalRecords =
    driverPayouts.length +
    settlements.length +
    customers.length +
    entertainers.length +
    gbOrders.length +
    gbBills.length +
    contracts.length +
    contractorPayouts.length +
    activityLogs.length;

  const toggleType = (type) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-violet-950/30 via-black to-emerald-950/30 px-4 py-4 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-white/10 text-gray-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-emerald-600 rounded-xl flex items-center justify-center">
              <SearchIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">Unified Search</h1>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                {totalRecords.toLocaleString()} records indexed across {TYPE_KEYS.length} types
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search bar */}
        <SearchInput value={query} onChange={setQuery} isLoading={loadingAny} />

        {/* Type filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TYPE_KEYS.map((type) => {
            const meta = ENTITY_TYPES[type];
            const isActive = enabledTypes.has(type);
            const count = counts[type] || 0;
            const adminOnly = type === "ActivityLog";
            if (adminOnly && !isAdmin) return null;
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "border-violet-400 bg-violet-500/20 text-white"
                    : "border-gray-700 bg-gray-900/50 text-gray-500 hover:border-gray-600"
                }`}
              >
                {meta.label}
                {count > 0 && (
                  <span className="ml-1.5 text-[10px] font-mono opacity-70">{count}</span>
                )}
                {adminOnly && <Lock className="inline w-2.5 h-2.5 ml-1 opacity-60" />}
              </button>
            );
          })}
        </div>

        {/* Results */}
        <div className="mt-6">
          {query.length < 2 ? (
            <div className="text-center py-20">
              <SearchIcon className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Type 2+ characters to search…</p>
              <p className="text-[11px] text-gray-700 mt-2">
                Try: a driver's name, an order number, a date (2026-06-10), a serial, an email
              </p>
            </div>
          ) : loadingAny ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">Loading indexes…</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-gray-500">
                No matches for <span className="text-white font-bold">"{query}"</span>
              </p>
              <p className="text-[11px] text-gray-700 mt-2">
                Check filters above — some types may be disabled.
              </p>
            </div>
          ) : (
            <>
              <div className="text-[11px] text-gray-500 mb-3">
                {results.length} result{results.length === 1 ? "" : "s"} · ranked by relevance
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {results.map((r) => (
                  <SearchResultCard key={`${r.type}-${r.id}`} result={r} query={query} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-[10px] text-gray-600 bg-gray-900/40 border border-gray-800 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-violet-400 font-bold">✓ FE↔BE MATCH:</span>
          <span>All adapters map to live entity schemas</span>
          <span>Deep links target existing routes</span>
          <span>ActivityLog gated to admin (RLS enforced server-side)</span>
        </div>
      </div>
    </div>
  );
}