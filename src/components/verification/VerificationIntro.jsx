import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileCheck, Lock } from 'lucide-react';

export default function VerificationIntro() {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Shield className="h-6 w-6" />
            Section I — Independent Protocol Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-300">
          <p className="leading-relaxed">
            A structured governance and security alignment review conducted under the 
            <span className="text-cyan-400 font-semibold"> Deterministic Risk Profile</span> and 
            <span className="text-cyan-400 font-semibold"> Master Covenant framework</span>.
          </p>
          <p className="leading-relaxed">
            This engagement evaluates:
          </p>
          <ul className="space-y-2 ml-6">
            <li className="flex items-start gap-2">
              <FileCheck className="h-5 w-5 text-green-400 mt-0.5" />
              <span>System architecture, documentation discipline</span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Threat exposure posture</span>
            </li>
            <li className="flex items-start gap-2">
              <FileCheck className="h-5 w-5 text-green-400 mt-0.5" />
              <span>Enforceability positioning</span>
            </li>
          </ul>
          <p className="text-sm text-slate-400">
            Aligned with enterprise security platform standards and zero-trust architecture principles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}