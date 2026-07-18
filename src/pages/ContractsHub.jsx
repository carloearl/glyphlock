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
  Search,
  Stamp,
} from "lucide-react";
import { GLYPHLOCK_DISCLAIMER } from "@/constants/legalDisclaimer";

import NUPSAppShell from "@/components/nups/shell/NUPSAppShell";
import RoleHomeButton from "@/components/nups/RoleHomeButton";
import GlyphBucksContract from "@/components/nups/GlyphBucksContract";
import EntertainerContract from "@/components/nups/EntertainerContract";
import ContractLookup from "@/pages/ContractLookup";
import BigSpenderQuestionnaire from "@/components/nups/contracts/BigSpenderQuestionnaire";
import BigSpenderLetter from "@/components/nups/contracts/BigSpenderLetter";
import { Link } from "react-router-dom";
import VIPContractLifecycle from "@/components/nups/VIPContractLifecycle";
import VIPShowContracts from "@/pages/VIPShowContracts";
import VIPShowGenerator from "@/components/nups/vip/VIPShowGenerator";
import VIPShowVerifyPanel from "@/components/nups/vip/VIPShowVerifyPanel";
import GlyphBucksSaleFlow from "@/components/nups/glyphbucks/GlyphBucksSaleFlow";
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
const TAB_ALIASES = {
  bigspender: "big_spender",
  "big-spender": "big_spender",
  big_spender: "big_spender",
  glyphbucks: "glyphbucks",
  vip: "vip",
  entertainer: "entertainer",
  venue: "archive",
  lookup: "archive",
  sealed: "vip",
  vipshow: "vip",
  archive: "archive",
};

const TABS = [
  { key: "vip", label: "VIP Contracts", Icon: Stamp },
  { key: "glyphbucks", label: "GlyphBucks", Icon: Coins },
  { key: "big_spender", label: "Big Spender", Icon: ShieldAlert },
  { key: "entertainer", label: "Entertainer", Icon: ClipboardCheck },
  { key: "archive", label: "Archive", Icon: Building2 },
];

const TAB_TITLES = {
  glyphbucks: "Contracts · GlyphBucks",
  vip: "Contracts · VIP (Sealed Records + Rooms)",
  big_spender: "Contracts · Big Spender Protocol",
  entertainer: "Contracts · Entertainer",
  archive: "Contracts · Archive",
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

        {activeTab === "glyphbucks" && (
          <Card className="bg-white/[0.02] border-pink-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Coins className="w-5 h-5 text-pink-400" />
                <h2 className="text-lg font-bold">GlyphBucks™ Stored-Value Sale — Contract-Receipt System</h2>
                <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">
                  Stored Value · Ed25519 Sealed · DEMO
                </Badge>
              </div>
              <GlyphBucksSaleFlow />
            </CardContent>
          </Card>
        )}

        {activeTab === "vip" && (
          <div className="space-y-6">
            {/* UNIFIED VIP CONTRACTS — new sealed evidence system + live room
                board on one tab. Legacy VIP contract lifecycle (duplicate
                surface) lives in Archive. */}
            <Card className="bg-white/[0.02] border-emerald-500/20">
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold">VIP Show Contracts — Sealed Evidence System</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                    Hash-Chained · Bitcoin Anchored
                  </Badge>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  <div className="xl:col-span-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-sm font-bold text-emerald-300 mb-3">Generate Contract</h3>
                    <VIPShowGenerator />
                  </div>
                  <div className="xl:col-span-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <h3 className="text-sm font-bold text-emerald-300 mb-3">QR Verify</h3>
                    <VIPShowVerifyPanel />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 overflow-hidden">
                  <div className="px-4 pt-4">
                    <h3 className="text-sm font-bold text-emerald-300">Search · Membership · Reprint</h3>
                  </div>
                  <VIPShowContracts />
                </div>
              </CardContent>
            </Card>

            {/* Room board MERGED into the VIP Command Center — one home for
                rooms, people, desk, and contracts (owner directive 2026-07-17). */}
            <Link to="/VIPCommand" className="block">
              <Card className="bg-white/[0.02] border-purple-500/20 hover:border-purple-500/50 transition-colors">
                <CardContent className="p-4 sm:p-6 flex items-center gap-3">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <div>
                    <h2 className="text-lg font-bold">VIP Room Board → VIP Command Center</h2>
                    <p className="text-xs text-gray-500">Live rooms, guests, entertainers, and the contract desk now live on one merged surface. Tap to open.</p>
                  </div>
                  <Badge className="ml-auto bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">Merged</Badge>
                </CardContent>
              </Card>
            </Link>
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

        {activeTab === "archive" && (
          <div className="space-y-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-lg p-4 text-sm text-gray-400">
              <span className="font-semibold text-gray-300">Archive</span> — legacy and reference contract
              surfaces. Superseded by the sealed VIP Show Contract and GlyphBucks stored-value systems
              for live operations.
            </div>

            {/* Legacy VIP entertainer payout contracts — superseded by the sealed system */}
            <Card className="bg-white/[0.02] border-blue-500/20">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-blue-400" />
                  <h2 className="text-lg font-bold">Legacy VIP Contract Lifecycle</h2>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">Archived</Badge>
                </div>
                <VIPContractLifecycle />
              </CardContent>
            </Card>

            {/* Legacy GlyphBucks purchase contract — superseded by the sealed stored-value flow */}
            <Card className="bg-white/[0.02] border-pink-500/20">
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-pink-400" />
                  <h2 className="text-lg font-bold">Legacy GlyphBucks Purchase Contract</h2>
                  <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">Archived</Badge>
                </div>
                <GlyphBucksContract />
              </CardContent>
            </Card>

            {/* Legacy contract lookup — superseded by sealed record search */}
            <Card className="bg-white/[0.02] border-emerald-500/20">
              <CardContent className="p-0">
                <div className="px-6 pt-6 flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold">Legacy Contract Lookup</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">Archived</Badge>
                </div>
                <ContractLookup />
              </CardContent>
            </Card>

            {/* Venue general terms — reference only */}
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
          </div>
        )}


        <div className="text-center text-xs text-gray-600 pt-6 border-t border-white/5">
          {GLYPHLOCK_DISCLAIMER}
        </div>
      </div>
    </NUPSAppShell>
  );
}