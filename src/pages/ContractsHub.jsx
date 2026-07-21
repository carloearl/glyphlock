import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ScrollText, ClipboardCheck, Stamp } from "lucide-react";
import { GLYPHLOCK_DISCLAIMER } from "@/constants/legalDisclaimer";

import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import RoleHomeButton from "@/components/nups/RoleHomeButton";
import EntertainerContract from "@/components/nups/EntertainerContract";
import BigSpenderQuestionnaire from "@/components/nups/contracts/BigSpenderQuestionnaire";
import BigSpenderLetter from "@/components/nups/contracts/BigSpenderLetter";
import UltimateVIPContract from "@/components/nups/vip/UltimateVIPContract";
import DemoContractSeeder from "@/components/nups/contracts/DemoContractSeeder";
import { useAdminOverride } from "@/lib/nups/adminView";

/**
 * Master Covenant & Contracts Hub
 * ────────────────────────────────
 * Single tab, single entry point for every contract surface in NUPS:
 *  • GlyphBucks Purchase
 *  • VIP Extended (linked — uses existing /VIPContract route which is token-gated)
 *  • Big Spender Protocol (Letter of Intent + Dancer Questionnaire)
 *  • Entertainer Independent Contractor
 *  • Venue General Terms
 *  • Spend Vault & Lookup
 */
// All VIP / GlyphBucks / legacy / archive deep-links now resolve to the single
// unified VIP contract surface (owner directive 2026-07-21 — one contract for
// all VIP shows, editable).
const TAB_ALIASES = {
  bigspender: "big_spender",
  "big-spender": "big_spender",
  big_spender: "big_spender",
  glyphbucks: "vip",
  vip: "vip",
  entertainer: "entertainer",
  venue: "vip",
  lookup: "vip",
  sealed: "vip",
  vipshow: "vip",
  archive: "vip",
};

const TABS = [
  { key: "vip", label: "VIP Contract", Icon: Stamp },
  { key: "big_spender", label: "Big Spender", Icon: ShieldAlert },
  { key: "entertainer", label: "Entertainer", Icon: ClipboardCheck },
];

const TAB_TITLES = {
  vip: "Contracts · VIP (One Contract for All Shows)",
  big_spender: "Contracts · Big Spender Protocol",
  entertainer: "Contracts · Entertainer",
};

export default function ContractsHub() {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const initial = queryTab && TAB_ALIASES[queryTab.toLowerCase()] ? TAB_ALIASES[queryTab.toLowerCase()] : "vip";

  const [activeTab, setActiveTab] = useState(initial);
  const [bigSpenderView, setBigSpenderView] = useState("letter");
  const adminOverride = useAdminOverride();

  // Sync with sidebar deep-links
  useEffect(() => {
    if (queryTab && TAB_ALIASES[queryTab.toLowerCase()]) {
      setActiveTab(TAB_ALIASES[queryTab.toLowerCase()]);
    }
  }, [queryTab]);

  return (
    <NUPSAppShell
      title={TAB_TITLES[activeTab] || "Contracts"}
      subtitle="Every venue contract — under one rail."
      role="MANAGER"
    >
      <div className="max-w-[1400px] mx-auto space-y-6">
        <RoleHomeButton />

        {/* Demo seeding is an ADMIN-OVERRIDE control only — never shown in
            the day-to-day staff/manager view (owner directive 2026-07-17). */}
        {adminOverride && <DemoContractSeeder />}

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-lg text-sm font-semibold min-h-[44px] transition-all ${
                activeTab === key
                  ? "bg-purple-500/20 text-purple-200 border-2 border-purple-500/40"
                  : "bg-white/[0.03] text-gray-400 border-2 border-transparent hover:border-purple-500/20"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "vip" && (
          <UltimateVIPContract canEdit={adminOverride} />
        )}

        {activeTab === "big_spender" && (
          <Card className="bg-white/[0.02] border-amber-500/20">
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold">Big Spender Protocol — $10k+ Night</h2>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs">
                  Mandatory Audit
                </Badge>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setBigSpenderView("letter")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    bigSpenderView === "letter"
                      ? "bg-amber-500/20 text-amber-300 border-2 border-amber-500/40"
                      : "bg-white/[0.03] text-gray-400 border-2 border-transparent hover:border-amber-500/20"
                  }`}
                >
                  <ScrollText className="w-4 h-4 inline mr-2" />
                  Letter of Intent
                </button>
                <button
                  onClick={() => setBigSpenderView("questionnaire")}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    bigSpenderView === "questionnaire"
                      ? "bg-amber-500/20 text-amber-300 border-2 border-amber-500/40"
                      : "bg-white/[0.03] text-gray-400 border-2 border-transparent hover:border-amber-500/20"
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4 inline mr-2" />
                  Dancer Questionnaire
                </button>
              </div>

              {bigSpenderView === "letter" && <BigSpenderLetter />}
              {bigSpenderView === "questionnaire" && <BigSpenderQuestionnaire />}
            </CardContent>
          </Card>
        )}

        {activeTab === "entertainer" && (
          <Card className="bg-white/[0.02] border-fuchsia-500/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-lg font-bold">Entertainer Independent Contractor Agreement</h2>
                <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 text-xs">
                  Onboarding
                </Badge>
              </div>
              <p className="text-sm text-gray-400">
                New entertainer onboarding — captures legal info, ID, tax ID, emergency contact, and signed
                contractor agreement.
              </p>
              <EntertainerContract />
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-gray-600 pt-6 border-t border-white/5">
          {GLYPHLOCK_DISCLAIMER}
        </div>
      </div>
    </NUPSAppShell>
  );
}