import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AlignmentTiers() {
  const tiers = [
    {
      tier: 'Tier I',
      name: 'Structured',
      description: 'Documented and governance-aligned operational posture.',
      color: 'from-green-500 to-emerald-600',
      badge: 'bg-green-500/20 text-green-300 border-green-500/40'
    },
    {
      tier: 'Tier II',
      name: 'Partial Alignment',
      description: 'Defined controls present but remediation required.',
      color: 'from-yellow-500 to-amber-600',
      badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
    },
    {
      tier: 'Tier III',
      name: 'Structural Gaps Identified',
      description: 'Material governance deficiencies limit eligibility.',
      color: 'from-red-500 to-rose-600',
      badge: 'bg-red-500/20 text-red-300 border-red-500/40'
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white text-center">Section V — Alignment Tiers</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => (
          <Card key={tier.tier} className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <Badge className={tier.badge}>
                {tier.tier}
              </Badge>
              <CardTitle className="text-xl text-white mt-2">{tier.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 leading-relaxed">{tier.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}