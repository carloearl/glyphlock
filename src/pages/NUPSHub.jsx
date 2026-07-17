/**
 * NUPS Hub — Unified Operator Dashboard
 * ─────────────────────────────────────
 * Clean layout matching the NUPS reference: left sidebar, today's KPIs,
 * top products, hourly sales chart, venue performance, plus a live
 * system overview side panel. Role-aware via NUPSUser lookup.
 */
import React, { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import TodaysSummary from "@/components/hub/TodaysSummary";
import TopProductsTable from "@/components/hub/TopProductsTable";
import HourlySalesChart from "@/components/hub/HourlySalesChart";
import VenuePerformance from "@/components/hub/VenuePerformance";
import OperatorFlowStrip from "@/components/hub/OperatorFlowStrip";
import DailySettlementSummary from "@/components/hub/DailySettlementSummary";
import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import DemoReadinessBanner from "@/components/hub/DemoReadinessBanner";
import StaffClockInOut from "@/components/nups/StaffClockInOut";
import DemoSeedControl from "@/components/nups/DemoSeedControl";
import { seedVenuePerformance, clearVenuePerformance } from "@/lib/nups/demoSeeders";

// Roles that actually punch a clock at the door. Owners / platform admins
// don't see the clock-in card.
const CLOCK_IN_ROLES = new Set([
  "DOOR_GIRL", "DOORMAN", "BARTENDER", "SECURITY", "DJ", "FLOOR_HOST", "PERFORMER",
]);

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function aggregateTransactions(txns = []) {
  const today = todayISO();
  const todays = txns.filter((t) =>
    !t.validation_run && (t.created_date || "").slice(0, 10) === today && t.status === "completed"
  );

  const grossSales   = todays.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const netRevenue   = todays.reduce((s, t) => s + (Number(t.cash_sales) || 0) + (Number(t.card_sales) || 0), 0);
  const transactions = todays.length;
  const cashTotal    = todays.reduce((s, t) => s + (Number(t.cash_sales) || 0), 0);
  const cashPct      = netRevenue > 0 ? Math.round((cashTotal / netRevenue) * 100) : 0;

  // hourly sales bucket (0..23)
  const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, sales: 0 }));
  todays.forEach((t) => {
    const h = new Date(t.created_date).getHours();
    if (!isNaN(h)) hourly[h].sales += Number(t.total) || 0;
  });

  // products
  const productMap = new Map();
  todays.forEach((t) => {
    (t.items || []).forEach((it) => {
      const key = it.product_name || it.product_id || "Unknown";
      const cur = productMap.get(key) || { name: key, qty: 0, sales: 0 };
      cur.qty += Number(it.quantity) || 0;
      cur.sales += Number(it.total) || Number(it.price) * Number(it.quantity) || 0;
      productMap.set(key, cur);
    });
  });
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // Real vs-yesterday deltas — computed from actual data, null when no
  // yesterday baseline exists. No fabricated trend numbers (compliance).
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const ydays = txns.filter((t) =>
    !t.validation_run && (t.created_date || "").slice(0, 10) === yesterday && t.status === "completed"
  );
  const yGross = ydays.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const yNet   = ydays.reduce((s, t) => s + (Number(t.cash_sales) || 0) + (Number(t.card_sales) || 0), 0);
  const yCash  = ydays.reduce((s, t) => s + (Number(t.cash_sales) || 0), 0);
  const yCashPct = yNet > 0 ? Math.round((yCash / yNet) * 100) : 0;
  const pctChange = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);
  const deltas = {
    gross: pctChange(grossSales, yGross),
    net:   pctChange(netRevenue, yNet),
    txns:  pctChange(transactions, ydays.length),
    cash:  yCashPct > 0 ? Math.round((cashPct - yCashPct) * 10) / 10 : null,
  };

  return { grossSales, netRevenue, transactions, cashPct, hourly, topProducts, deltas };
}

export default function NUPSHub() {
  const qc = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: () => base44.auth.me() });
  // NUPSUser schema key is `username` (mapped to email) — not `email`.
  const { data: nupsUsers = [] } = useQuery({
    queryKey: ["nupsuser", user?.email],
    queryFn: () => base44.entities.NUPSUser.filter({ username: user?.email }),
    enabled: !!user?.email,
  });
  const nupsUser = nupsUsers[0];
  const role = nupsUser?.role || (user?.role === "admin" ? "PLATFORM_ADMIN" : "DOOR_GIRL");

  const { data: txns = [] } = useQuery({
    queryKey: ["pos-today"],
    queryFn: () => base44.entities.POSTransaction.list("-created_date", 500),
  });

  const agg = useMemo(() => aggregateTransactions(txns), [txns]);

  const venuePerformance = useMemo(() => {
    const map = new Map();
    txns.forEach((t) => {
      if (t.validation_run || t.status !== "completed") return;
      const key = t.venue_id || "Unassigned";
      map.set(key, (map.get(key) || 0) + (Number(t.total) || 0));
    });
    return Array.from(map.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [txns]);

  return (
    <NUPSAppShell
      title="Dashboard"
      subtitle="One Nexus · Multiple Venues · Every Dollar Accounted For"
      role={role}
    >
      <div className="space-y-5 max-w-[1600px] mx-auto">
        {/* Canonical front-to-back operator sequence — every shift starts here */}
        <OperatorFlowStrip />

        {/* Live integrity strip — Vinnie sees real data flowing at a glance */}
        <DemoReadinessBanner />

        {/* Staff punch-clock — only for on-floor roles */}
        {user && CLOCK_IN_ROLES.has(role) && (
          <StaffClockInOut
            user={{ ...user, role, full_name: nupsUser?.full_name || user.full_name }}
            venueId={nupsUser?.venue_id}
            station="door"
          />
        )}

        {/* Demo seeding is an ADMIN-class tool only — never rendered for
            operational roles (compliance: no demo controls on live surfaces). */}
        {["PLATFORM_ADMIN", "VENUE_OWNER", "SOVEREIGN"].includes(role) && (
          <div className="flex items-center justify-end">
            <DemoSeedControl
              sectionName="Venue Performance"
              onSeed={seedVenuePerformance}
              onClear={clearVenuePerformance}
              onAfter={() => qc.invalidateQueries({ queryKey: ["pos-today"] })}
            />
          </div>
        )}

        <TodaysSummary
          grossSales={agg.grossSales}
          netRevenue={agg.netRevenue}
          transactions={agg.transactions}
          cashPct={agg.cashPct}
          deltas={agg.deltas}
        />

        {/* Cash + card split, driver payouts, and net deposit for today */}
        <DailySettlementSummary />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TopProductsTable products={agg.topProducts} />
          <VenuePerformance venues={venuePerformance} />
        </div>

        <HourlySalesChart data={agg.hourly} />
      </div>
    </NUPSAppShell>
  );
}