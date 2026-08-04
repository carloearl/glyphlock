import React from "react";
import { Printer } from "lucide-react";
import DanceDollarsAgreement from "@/components/nups/contracts/DanceDollarsAgreement";

export default function DanceDollarsContract() {
  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-[8.5in] mx-auto mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-white font-bold text-lg">Dance Dollars Agreement / Invoice</h1>
          <p className="text-slate-500 text-xs">
            Legacy Dream Palace form — separate instrument from the GlyphBucks agreement.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-cyan-600 text-white font-bold"
        >
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>
      <DanceDollarsAgreement />
    </div>
  );
}