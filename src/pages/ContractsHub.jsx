import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  Coins,
  ShieldAlert,
  Building2,
  ScrollText,
  ClipboardCheck,
} from "lucide-react";
import { GLYPHLOCK_DISCLAIMER } from "@/constants/legalDisclaimer";

import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import GlyphBucksContract from "@/components/nups/GlyphBucksContract";
import EntertainerContract from "@/components/nups/EntertainerContract";
import ContractLookup from "@/pages/ContractLookup";
import BigSpenderQuestionnaire from "@/components/nups/contracts/BigSpenderQuestionnaire";
import BigSpenderLetter from "@/components/nups/contracts/BigSpenderLetter";
import VIPRoomBoard from "@/components/nups/VIPRoomBoard";
import VIPContractLifecycle from "@/components/nups/VIPContractLifecycle";

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
const TAB_ALIASES = {
  bigspender: "big_spender",
  "big-spender": "big_spender",
  big_spender: "big_spender",
  glyphbucks: "glyphbucks",
  vip: "vip",
  entertainer: "entertainer",
  venue: "venue",
  lookup: "lookup",
};

const TAB_TITLES = {
  glyphbucks: "Contracts · GlyphBucks",
  vip: "VIP Shows · Rooms · GlyphBucks · Contracts",
  big_spender: "Contracts · Big Spender Protocol",
  entertainer: "Contracts · Entertainer",
  venue: "Contracts · Venue Terms",
  lookup: "Contracts · Lookup",
};

export default function ContractsHub() {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get("tab");
  const initial = queryTab && TAB_ALIASES[queryTab.toLowerCase()] ? TAB_ALIASES[queryTab.toLowerCase()] : "glyphbucks";

  const [activeTab, setActiveTab] = useState(initial);
  const [bigSpenderView, setBigSpenderView] = useState("letter");

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
        {activeTab === "glyphbucks" && (
          <Card className="bg-white/[0.02] border-pink-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-bold">GlyphBucks Purchase Contract</h2>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">Club Currency</Badge>
              </div>
              <GlyphBucksContract />
            </CardContent>
          </Card>
        )}

        {activeTab === "vip" && (
          <div className="space-y-6">
            {/* Live room board — open/close rooms, assign guests & entertainers */}
            <Card className="bg-white/[0.02] border-purple-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold">VIP Room Board</h2>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">Live</Badge>
                </div>
                <VIPRoomBoard />
              </CardContent>
            </Card>

            {/* GlyphBucks section — sits here under VIP Shows, not separate */}
            <Card className="bg-white/[0.02] border-pink-500/20">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-pink-400" />
                  <h2 className="text-lg font-bold">GlyphBucks Purchase</h2>
                  <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">Club Currency</Badge>
                </div>
                <GlyphBucksContract />
              </CardContent>
            </Card>

            {/* Entertainer payout contracts for VIP shows */}
            <Card className="bg-white/[0.02] border-blue-500/20">
              <CardContent className="p-4 sm:p-6">
                <VIPContractLifecycle />
              </CardContent>
            </Card>
          </div>
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

        {activeTab === "venue" && (
          <Card className="bg-white/[0.02] border-cyan-500/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold">Venue General Terms</h2>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-xs">Reference</Badge>
              </div>
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                <p>
                  Venue general terms are embedded in every signed contract (GlyphBucks, VIP, Entertainer).
                  Master text is maintained per-venue in the{" "}
                  <span className="text-cyan-300 font-semibold">Venue Admin Settings → Contract Terms</span>{" "}
                  panel and version-stamped on every save.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "lookup" && (
          <Card className="bg-white/[0.02] border-emerald-500/20">
            <CardContent className="p-0">
              <ContractLookup />
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