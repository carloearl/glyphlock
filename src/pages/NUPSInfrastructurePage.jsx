import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NUPSUnifiedOverview from "@/components/nups/NUPSUnifiedOverview";

export default function NUPSInfrastructurePage() {
  return (
    <div id="top" className="min-h-screen bg-transparent px-3 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            to="/NUPSLanding"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <NUPSUnifiedOverview />
      </div>
    </div>
  );
}