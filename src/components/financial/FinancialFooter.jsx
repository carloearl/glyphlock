import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, FileSignature, Scale } from "lucide-react";

export default function FinancialFooter() {
  return (
    <section className="py-16 px-4 border-t border-green-500/10">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* LLC Info */}
          <div>
            <h4 className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Legal Entity
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              GlyphLock Financial, LLC is a separate limited liability company operating within the GlyphLock ecosystem.
              All POS transactions, currency issuance, blockchain operations, and entertainment services fall under this entity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Quick Access</h4>
            <div className="space-y-2">
              {[
                { label: "N.U.P.S. POS System", page: "NUPSLogin" },
                { label: "Blockchain Suite", page: "Blockchain" },
                { label: "Club Currency Press", page: "ClubCurrencyPress" },
                { label: "DJ Pro Mixer", page: "GlyphBotMixer" },
                { label: "Contract Archive", page: "ContractArchive" },
              ].map((link, i) => (
                <Link key={i} to={createPageUrl(link.page)} className="block text-xs text-gray-400 hover:text-green-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" /> Compliance
            </h4>
            <div className="space-y-2 text-xs text-gray-500">
              <p>• PCI DSS compliant payment processing</p>
              <p>• SHA-256 cryptographic verification</p>
              <p>• Digital contract audit trail</p>
              <p>• Club currency licensing compliance</p>
              <p>• Arizona state business registration</p>
            </div>
          </div>
        </div>

        <div className="text-center pt-6 border-t border-gray-800">
          <p className="text-[10px] text-gray-600">
            © {new Date().getFullYear()} GlyphLock Financial, LLC. All rights reserved. 
            A subsidiary of the GlyphLock ecosystem. Not affiliated with any government financial institution.
            Club Currency (Dream Dollars) are not legal tender and are valid only at participating establishments.
          </p>
        </div>
      </div>
    </section>
  );
}