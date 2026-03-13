import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export default function EngagementOptions() {
  const founding_features = [
    'Pre-session documentation intake review',
    'Structured 90-minute moderated verification session',
    'Comprehensive Verification Report',
    'Executive Brief for leadership',
    'Qualification Tier Determination',
    'Remediation Roadmap'
  ];

  const standard_features = [
    'Pre-session structured documentation review',
    'Formal 90-minute verification engagement',
    'Comprehensive written determination report',
    'Executive Brief',
    'Credential eligibility statement',
    'Structured enforcement roadmap'
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Section II — Engagement Options</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subsection A: Founding Cohort */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/40">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl text-purple-300">Founding Cohort Verification</CardTitle>
                <p className="text-sm text-slate-400 mt-1">Limited Enrollment Program</p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">
                Limited
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-300">$6,500</div>
              <p className="text-xs text-slate-400 mt-1">Limited to five organizations</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Includes:</p>
              {founding_features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-purple-500/20">
              <p className="text-xs text-slate-400 italic">
                Upon completion of Founding Cohort enrollment, standard engagement pricing applies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subsection B: Standard Verification */}
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/40">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-300">Standard Verification Engagement</CardTitle>
            <p className="text-sm text-slate-400">For qualified organizations</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">Custom Pricing</div>
              <p className="text-xs text-slate-400 mt-1">Engagement Fee Provided Upon Qualification</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Includes:</p>
              {standard_features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}