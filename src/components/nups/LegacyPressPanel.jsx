import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Banknote, Printer, ChevronDown, ChevronRight } from "lucide-react";
import DanceDollarsAgreement from "@/components/nups/contracts/DanceDollarsAgreement";
import ClubCurrencyPressView from "@/components/nups/press/ClubCurrencyPressView";

/**
 * LegacyPressPanel — the legacy Dance Dollars agreement + the full
 * GlyphBucks Press, embedded in the Manager Console and VIP Command Center.
 */
export default function LegacyPressPanel() {
  const navigate = useNavigate();
  const [showLegacy, setShowLegacy] = useState(false);

  return (
    <div className="space-y-5">
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" /> Legacy Dance Dollars Agreement
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 min-h-[44px]"
                onClick={() => setShowLegacy((v) => !v)}>
                {showLegacy ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
                {showLegacy ? "Hide" : "View"} Agreement
              </Button>
              <Button size="sm" className="bg-amber-700 hover:bg-amber-600 min-h-[44px]"
                onClick={() => navigate("/Contracts?tab=dance_dollars")}>
                <Printer className="w-4 h-4 mr-1" /> Printable Version
              </Button>
            </div>
          </div>
        </CardHeader>
        {showLegacy && (
          <CardContent>
            <div className="bg-white rounded-xl p-4 text-black overflow-x-auto">
              <DanceDollarsAgreement />
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-green-400" /> GlyphBucks Press
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ClubCurrencyPressView />
        </CardContent>
      </Card>
    </div>
  );
}