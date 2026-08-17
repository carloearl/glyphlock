import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Handshake, FileSignature, ArrowRight } from 'lucide-react';

const REVIEW_SCOPE = [
  'Documentation intake and gap list',
  'Working session with your technical owners',
  'Written findings report',
  'Short brief for leadership',
  'Prioritized remediation roadmap',
];

const PARTNERSHIP_SCOPE = [
  'Platform or module licensing',
  'White-label and OEM arrangements',
  'Joint delivery or referral partnerships',
  'Custom build and integration work',
];

export default function EngagementOptions() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">How to engage</h2>
        <p className="max-w-3xl text-sm text-slate-400">
          Pricing is not published. Scope, effort and terms differ too much between organizations for a fixed
          number to be honest, so every engagement is quoted in writing after a scoping conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-cyan-500/40">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-cyan-300">
                  <FileSignature className="h-5 w-5" /> Documentation Review
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">Quoted per engagement</p>
              </div>
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40">By scope</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Typically includes:</p>
              {REVIEW_SCOPE.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-400" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <p className="border-t border-cyan-500/20 pt-4 text-xs italic text-slate-400">
              Deliverables are written findings only — not a certification, audit opinion or compliance approval.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/40">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl text-purple-300">
                  <Handshake className="h-5 w-5" /> Partnership &amp; Licensing
                </CardTitle>
                <p className="mt-1 text-sm text-slate-400">Direct conversation</p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40">Contact us</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Available discussions:</p>
              {PARTNERSHIP_SCOPE.map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-400" />
                  <span className="text-sm text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <a
              href="mailto:carloearl@glyphlock.com?subject=Partnership%20or%20Licensing%20Inquiry"
              className="inline-flex items-center gap-2 rounded-xl border border-purple-400/40 bg-purple-500/15 px-4 py-3 text-sm font-bold text-purple-200 transition-colors hover:bg-purple-500/25 hover:text-white"
            >
              Contact for partnership or licensing <ArrowRight className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}