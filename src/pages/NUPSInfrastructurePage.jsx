import React from "react";
import { Link } from "react-router-dom";

export default function NUPSInfrastructurePage() {
  return (
    <div className="min-h-screen bg-[#0d1b2a] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex justify-center">
          <Link
            to="/GlyphLockFinancialPage"
            className="inline-flex items-center rounded-md border border-[#c79a2b] bg-[#13263a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3148]"
          >
            View GlyphLock Financial Page
          </Link>
        </div>
        <img
          src="https://media.base44.com/images/public/697a087fb354faebb72df54b/fbd564aab_GlyphlockFinancialInfastructure5.png"
          alt="NUPS Nexus Unified Portal System infrastructure page"
          className="w-full rounded-md border border-[#31465d] shadow-2xl"
        />
      </div>
    </div>
  );
}