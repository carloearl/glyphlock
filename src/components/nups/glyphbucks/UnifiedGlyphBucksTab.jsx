/**
 * UnifiedGlyphBucksTab — single cohesive GlyphBucks system for NUPSOwner.
 * Merges: Sales, Redemption, Press, Ledger, Inventory, Contract, Search, Fraud.
 * Replaces the old fragmented sections and the separate /GlyphBucksHub page.
 */
import React, { useState } from "react";
import {
  Coins, Scan, Printer, BookOpen, Package, FileText, Search, Shield,
} from "lucide-react";

import UnifiedGlyphBucksHub from "@/components/nups/UnifiedGlyphBucksHub";
import BillRedemptionScanner from "@/components/nups/glyphbucks/BillRedemptionScanner";
import ClubCurrencyPressView from "@/components/nups/press/ClubCurrencyPressView";
import GlyphBucksLedger from "@/components/nups/GlyphBucksLedger";
import GlyphBuckInventory from "@/components/nups/GlyphBuckInventory";
import GlyphBucksContract from "@/components/nups/GlyphBucksContract";
import TransactionSearch from "@/components/nups/glyphbucks/TransactionSearch";
import FraudAnalyticsDashboard from "@/components/nups/FraudAnalyticsDashboard";

const SUB_TABS = [
  { key: "sales",       label: "Sales",      icon: Coins,    color: "text-cyan-300 border-cyan-500/50 bg-cyan-500/10" },
  { key: "redemption",  label: "Redeem",     icon: Scan,     color: "text-green-300 border-green-500/50 bg-green-500/10" },
  { key: "press",       label: "Press",      icon: Printer,  color: "text-yellow-300 border-yellow-500/50 bg-yellow-500/10" },
  { key: "ledger",      label: "Ledger",     icon: BookOpen, color: "text-purple-300 border-purple-500/50 bg-purple-500/10" },
  { key: "inventory",   label: "Inventory",  icon: Package,  color: "text-emerald-300 border-emerald-500/50 bg-emerald-500/10" },
  { key: "contract",    label: "Contract",   icon: FileText, color: "text-blue-300 border-blue-500/50 bg-blue-500/10" },
  { key: "search",      label: "Search",     icon: Search,   color: "text-pink-300 border-pink-500/50 bg-pink-500/10" },
  { key: "fraud",       label: "Fraud",      icon: Shield,   color: "text-red-300 border-red-500/50 bg-red-500/10" },
];

function initialTab() {
  if (typeof window === "undefined") return "sales";
  const t = new URLSearchParams(window.location.search).get("tab");
  return SUB_TABS.some((s) => s.key === t) ? t : "sales";
}

export default function UnifiedGlyphBucksTab({ user, venueId, entertainers = [], isAdmin = false }) {
  const [active, setActive] = useState(initialTab);

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-3 overflow-x-auto">
        {SUB_TABS.map(({ key, label, icon: Icon, color }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border min-h-[40px] ${
                isActive
                  ? color
                  : "text-gray-400 hover:text-white hover:bg-slate-800/50 border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Panels — one active at a time, no overlays */}
      <div className="min-h-[400px]">
        {active === "sales"      && <UnifiedGlyphBucksHub venue_id={venueId} user={user} />}
        {active === "redemption" && (
          <div className="space-y-3">
            {entertainers.length > 0 ? (
              entertainers.slice(0, 10).map((ent) => (
                <BillRedemptionScanner key={ent.id} venue_id={venueId} contractor={ent} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Scan className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active entertainers to redeem against.</p>
              </div>
            )}
          </div>
        )}
        {active === "press"     && isAdmin && <ClubCurrencyPressView />}
        {active === "press"     && !isAdmin && (
          <div className="text-center py-12 text-gray-500">
            <Printer className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Press requires Admin / Owner access.</p>
          </div>
        )}
        {active === "ledger"    && <GlyphBucksLedger user={user} venue_id={venueId} />}
        {active === "inventory" && <GlyphBuckInventory />}
        {active === "contract"  && <GlyphBucksContract />}
        {active === "search"    && <TransactionSearch venue_id={venueId} />}
        {active === "fraud"     && <FraudAnalyticsDashboard venue_id={venueId} />}
      </div>
    </div>
  );
}