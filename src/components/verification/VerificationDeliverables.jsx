import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Briefcase, Award, Shield, Map } from 'lucide-react';

export default function VerificationDeliverables() {
  const deliverables = [
    { icon: FileText, title: 'Formal Verification Report', color: 'text-cyan-400' },
    { icon: Briefcase, title: 'Executive Brief', color: 'text-purple-400' },
    { icon: Award, title: 'Alignment Tier Classification', color: 'text-green-400' },
    { icon: Shield, title: 'Credential Eligibility Statement', color: 'text-blue-400' },
    { icon: Map, title: 'Remediation Roadmap', color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">Section IV — Verification Deliverables</h2>
      <p className="text-center text-slate-400">Client receives:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliverables.map((item, idx) => (
          <Card key={idx} className="bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 transition-all">
            <CardContent className="p-6 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-lg bg-slate-900/50 flex items-center justify-center">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-slate-200">{idx + 1}.</div>
                <div className="text-sm text-white font-semibold">{item.title}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}