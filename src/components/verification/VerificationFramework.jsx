import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function VerificationFramework() {
  const phases = [
    {
      number: '01',
      title: 'Authority and Scope Confirmation',
      description: 'Establish engagement boundaries, define documentation requirements, and confirm organizational authority.'
    },
    {
      number: '02',
      title: 'System Architecture Review',
      description: 'Structured evaluation of infrastructure design, data flows, and operational controls against defined governance standards.'
    },
    {
      number: '03',
      title: 'Threat Surface and Exposure Analysis',
      description: 'Documented assessment of attack vectors, vulnerability posture, and exposure points aligned with post-quantum readiness criteria.'
    },
    {
      number: '04',
      title: 'Governance Alignment Assessment',
      description: 'Review of policy documentation, SOC 2 aligned controls, AI governance framework adherence, and NIST post-quantum standards positioning.'
    },
    {
      number: '05',
      title: 'Determination and Roadmap Delivery',
      description: 'Formal qualification tier assignment, credential eligibility statement, and structured remediation roadmap.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Section III — Structured 90-Minute Verification Framework</h2>
        <p className="text-sm text-slate-400">Moderated · Structured · Time-controlled · Documentation-based</p>
      </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <Card key={phase.number} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{phase.number}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{phase.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{phase.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}