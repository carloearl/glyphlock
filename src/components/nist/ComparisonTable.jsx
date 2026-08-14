/**
 * Comparison Table Component
 * GlyphLock vs Typical Participants
 */

import React from 'react';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

const COMPARISON_DATA = [
  {
    feature: 'Technical ML Detection',
    typical: true,
    glyphlock: true,
    description: 'Pattern recognition and statistical analysis'
  },
  {
    feature: 'Legal Framework Integration',
    typical: false,
    glyphlock: true,
    description: '71-clause Master Covenant binding AI to standards'
  },
  {
    feature: 'Accountability Tracing',
    typical: false,
    glyphlock: true,
    description: 'Full audit trail linking outputs to framework clauses'
  },
  {
    feature: 'Patent-Pending Methodology',
    typical: false,
    glyphlock: true,
    description: 'IP approach documented; filing details under verification'
  },
  {
    feature: 'Dual-Layer Verification',
    typical: false,
    glyphlock: true,
    description: 'Technical + Legal parallel processing'
  },
  {
    feature: 'Provenance Verification',
    typical: false,
    glyphlock: true,
    description: 'C2PA, blockchain, digital signature validation'
  },
  {
    feature: 'Explainable AI',
    typical: 'Limited',
    glyphlock: true,
    description: 'Covenant-traced decision explanations'
  },
  {
    feature: 'Enterprise Compliance Ready',
    typical: false,
    glyphlock: true,
    description: 'Built for regulatory environments (GDPR, CCPA, etc.)'
  }
];

export default function ComparisonTable() {
  return (
    <section className="py-16 bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0]">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              How GlyphLock Stands Out
            </h2>
            <p className="text-lg text-gray-700">
              First legal-technical hybrid in NIST GenAI Challenge
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg shadow-lg">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gradient-to-r from-[#1e293b] to-[#334155]">
                  <th className="p-4 text-left text-white font-bold text-sm md:text-base">Feature</th>
                  <th className="p-4 text-center text-white font-bold text-sm md:text-base">Typical Participants</th>
                  <th className="p-4 text-center text-white font-bold text-sm md:text-base">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-5 h-5" />
                      <span>GlyphLock</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 border-b-2 border-gray-200">
                      <div>
                        <div className="font-bold text-gray-900 text-sm md:text-base">{row.feature}</div>
                        <div className="text-xs md:text-sm text-gray-700 mt-1 leading-relaxed">{row.description}</div>
                      </div>
                    </td>
                    <td className="p-4 border-b-2 border-gray-200 text-center">
                      <ComparisonCell value={row.typical} />
                    </td>
                    <td className="p-4 border-b-2 border-gray-200 text-center bg-blue-50">
                      <ComparisonCell value={row.glyphlock} highlight />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-6 md:p-8 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-500 rounded-lg shadow-md">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-amber-700 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-3">Unique Value Proposition</h3>
                <p className="text-gray-800 leading-relaxed text-sm md:text-base">
                  GlyphLock is the <strong>only participant</strong> combining technical ML detection 
                  with a patent-pending legal framework. This dual-layer approach provides both 
                  technical accuracy and regulatory compliance—addressing the accountability gap 
                  that traditional AI detection systems cannot solve.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonCell({ value, highlight }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <CheckCircle className={`w-6 h-6 ${highlight ? 'text-green-600' : 'text-green-500'}`} />
      </div>
    );
  } else if (value === false) {
    return (
      <div className="flex items-center justify-center">
        <XCircle className="w-6 h-6 text-gray-300" />
      </div>
    );
  } else {
    return (
      <span className="text-sm text-gray-600 italic">{value}</span>
    );
  }
}