import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileSignature,
  Crown,
  Coins,
  ShieldAlert,
  Building2,
  ScrollText,
  Search,
  ClipboardCheck,
} from "lucide-react";
import { GLYPHLOCK_DISCLAIMER } from "@/constants/legalDisclaimer";

import GlyphBucksContract from "@/components/nups/GlyphBucksContract";
import EntertainerContract from "@/components/nups/EntertainerContract";
import ContractLookup from "@/pages/ContractLookup";
import BigSpenderQuestionnaire from "@/components/nups/contracts/BigSpenderQuestionnaire";
import BigSpenderLetter from "@/components/nups/contracts/BigSpenderLetter";

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
export default function ContractsHub() {
  const [activeTab, setActiveTab] = useState("glyphbucks");
  const [bigSpenderView, setBigSpenderView] = useState("letter"); // 'letter' | 'questionnaire'

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FileSignature className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold">Master Covenant & Contracts</h1>
          </div>
          <p className="text-sm text-gray-400">
            Every venue contract — under one tab, one button.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 bg-gray-900/60 border border-gray-700 h-auto p-1">
            <TabsTrigger
              value="glyphbucks"
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-300 flex flex-col items-center gap-1 py-2.5"
            >
              <Coins className="w-4 h-4" />
              <span className="text-xs">GlyphBucks</span>
            </TabsTrigger>
            <TabsTrigger
              value="vip"
              className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 flex flex-col items-center gap-1 py-2.5"
            >
              <Crown className="w-4 h-4" />
              <span className="text-xs">VIP Extended</span>
            </TabsTrigger>
            <TabsTrigger
              value="big_spender"
              className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300 flex flex-col items-center gap-1 py-2.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="text-xs">Big Spender</span>
            </TabsTrigger>
            <TabsTrigger
              value="entertainer"
              className="data-[state=active]:bg-fuchsia-500/20 data-[state=active]:text-fuchsia-300 flex flex-col items-center gap-1 py-2.5"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="text-xs">Entertainer</span>
            </TabsTrigger>
            <TabsTrigger
              value="venue"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300 flex flex-col items-center gap-1 py-2.5"
            >
              <Building2 className="w-4 h-4" />
              <span className="text-xs">Venue</span>
            </TabsTrigger>
            <TabsTrigger
              value="lookup"
              className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300 flex flex-col items-center gap-1 py-2.5"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Lookup</span>
            </TabsTrigger>
          </TabsList>

          {/* GLYPHBUCKS */}
          <TabsContent value="glyphbucks" className="mt-6">
            <Card className="bg-gray-900/40 border-pink-500/30">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Coins className="w-5 h-5 text-pink-400" />
                  <h2 className="text-lg font-bold">GlyphBucks Purchase Contract</h2>
                  <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/40 text-xs">Club Currency</Badge>
                </div>
                <GlyphBucksContract />
              </CardContent>
            </Card>
          </TabsContent>

          {/* VIP EXTENDED */}
          <TabsContent value="vip" className="mt-6">
            <Card className="bg-gray-900/40 border-purple-500/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-bold">VIP Extended Contract</h2>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 text-xs">
                    Biometric + 3 Signatures
                  </Badge>
                </div>
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 text-sm text-gray-300 space-y-2">
                  <p>
                    The full VIP Extended Contract requires a one-time secure token issued from the VIP Room
                    Board. It walks the guest through 5 steps:
                  </p>
                  <ol className="list-decimal ml-5 text-xs text-gray-400 space-y-1">
                    <li>Identity capture (name, DOB, gov ID, card)</li>
                    <li>Biometrics — thumbprint, face photo, ID front/back</li>
                    <li>Full 10-section contract review</li>
                    <li>Guest digital signature</li>
                    <li>Host + Manager approval signatures</li>
                  </ol>
                  <p className="text-xs text-purple-300 pt-2 border-t border-purple-500/20">
                    Open the VIP Room Board → select a guest → "Generate VIP Contract" to issue a single-use
                    signing link.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BIG SPENDER PROTOCOL */}
          <TabsContent value="big_spender" className="mt-6 space-y-4">
            <Card className="bg-gray-900/40 border-amber-500/30">
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
                        : "bg-gray-800/50 text-gray-400 border-2 border-transparent hover:border-amber-500/20"
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
                        : "bg-gray-800/50 text-gray-400 border-2 border-transparent hover:border-amber-500/20"
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
          </TabsContent>

          {/* ENTERTAINER */}
          <TabsContent value="entertainer" className="mt-6">
            <Card className="bg-gray-900/40 border-fuchsia-500/30">
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
          </TabsContent>

          {/* VENUE GENERAL */}
          <TabsContent value="venue" className="mt-6">
            <Card className="bg-gray-900/40 border-cyan-500/30">
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
                  <p className="text-xs text-gray-500 pt-2 border-t border-cyan-500/20">
                    To edit the master venue terms, an admin should open Venue Settings. The terms apply to
                    every contract executed from this hub.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LOOKUP / VAULT */}
          <TabsContent value="lookup" className="mt-6">
            <Card className="bg-gray-900/40 border-emerald-500/30">
              <CardContent className="p-0">
                <ContractLookup />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-gray-600 pt-6 border-t border-gray-800">
          {GLYPHLOCK_DISCLAIMER}
        </div>
      </div>
    </div>
  );
}