import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ImportantNotice() {
  return (
    <Card className="bg-amber-900/20 border-amber-500/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          Limitations of this review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="leading-relaxed">
          A GlyphLock review is <strong className="text-white">not</strong> a certification, accreditation, audit opinion,
          legal advice, or approval of any kind. It creates no regulatory standing and no enforceable rights.
        </p>
        <p className="leading-relaxed">
          Findings are opinions based only on the documents and access provided, measured against the
          <span className="text-cyan-400 font-semibold"> Master Covenant</span> — a standard GlyphLock wrote for itself — and limited to the
          scope agreed in writing. Results cannot be presented to regulators, auditors, insurers or customers as
          third-party assurance. You remain <strong className="text-white">solely responsible</strong> for your own legal and compliance obligations.
        </p>
      </CardContent>
    </Card>
  );
}