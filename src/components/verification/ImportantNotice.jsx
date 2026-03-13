import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ImportantNotice() {
  return (
    <Card className="bg-amber-900/20 border-amber-500/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <AlertTriangle className="h-5 w-5" />
          Section VI — Important Notice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p className="leading-relaxed">
          Verification does <strong className="text-white">not constitute</strong> regulatory certification, 
          statutory compliance approval, or legal enforcement authority.
        </p>
        <p className="leading-relaxed">
          All determinations are governed by the <span className="text-cyan-400 font-semibold">Master Covenant framework</span> and 
          limited to the defined engagement scope. No representation is made regarding third-party regulatory standing, 
          and organizations remain <strong className="text-white">solely responsible</strong> for their own compliance obligations.
        </p>
      </CardContent>
    </Card>
  );
}