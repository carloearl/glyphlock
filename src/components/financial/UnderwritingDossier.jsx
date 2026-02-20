import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

const DOSSIER_ITEMS = [
  "Operational Summary Report",
  "Payout Governance Outline",
  "Prepaid Instrument Reporting Records",
  "Contract Documentation Samples",
  "Verification Records"
];

export default function UnderwritingDossier() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'transparent' }}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/60 to-transparent mb-16" />

        <div className="text-center mb-10">
          <p className="text-[11px] uppercase tracking-[6px] text-yellow-600/70 mb-6 font-medium">Section V</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-0" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}>
            Underwriting Documentation Package
          </h2>
        </div>

        {/* Dossier list */}
        <div className="border border-yellow-600/25 max-w-2xl mx-auto mb-14">
          <div className="bg-yellow-600/10 px-6 py-3 border-b border-yellow-600/15">
            <p className="text-[10px] uppercase tracking-[4px] text-yellow-500 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
              Package Contents
            </p>
          </div>
          {DOSSIER_ITEMS.map((item, i) => (
            <div key={i} className={`px-6 py-4 ${i < DOSSIER_ITEMS.length - 1 ? 'border-b border-yellow-600/10' : ''}`} style={{ background: 'rgba(0,0,0,0.7)' }}>
              <div className="flex items-center gap-4">
                <span className="text-[11px] text-yellow-600/60 font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[14px] text-slate-300" style={{ fontFamily: "'Georgia', serif" }}>
                  {item}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Link to={createPageUrl("Consultation")}>
            <Button variant="outline" className="border-yellow-600/40 text-yellow-500 hover:bg-yellow-600/10 px-10 py-5 text-sm font-bold tracking-wider uppercase rounded-none" style={{ fontFamily: "'Cinzel', serif" }}>
              Request Documentation Sample
            </Button>
          </Link>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-600/40 to-transparent mt-16" />
      </div>
    </section>
  );
}