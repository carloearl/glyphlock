import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Download, CheckCircle } from 'lucide-react';
import VerificationIntakeForm from '@/components/verification/VerificationIntakeForm';
import AlignmentTiers from '@/components/verification/AlignmentTiers';
import VerificationFramework from '@/components/verification/VerificationFramework';
import EngagementOptions from '@/components/verification/EngagementOptions';
import VerificationDeliverables from '@/components/verification/VerificationDeliverables';
import ImportantNotice from '@/components/verification/ImportantNotice';
import VerificationIntro from '@/components/verification/VerificationIntro';

export default function GovernanceHub() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">
              Independent Protocol Verification
            </h1>
          </div>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Structured governance alignment review under the Master Covenant framework
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-2 bg-slate-800/50 p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="framework">Framework</TabsTrigger>
            <TabsTrigger value="tiers">Alignment Tiers</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="request">Request</TabsTrigger>
          </TabsList>

          {/* Section I: Overview */}
          <TabsContent value="overview">
            <VerificationIntro />
          </TabsContent>

          {/* Section II: Engagement Options */}
          <TabsContent value="engagement">
            <EngagementOptions />
          </TabsContent>

          {/* Section III: Verification Framework */}
          <TabsContent value="framework">
            <VerificationFramework />
          </TabsContent>

          {/* Section V: Alignment Tiers */}
          <TabsContent value="tiers">
            <AlignmentTiers />
          </TabsContent>

          {/* Section IV: Deliverables */}
          <TabsContent value="deliverables">
            <VerificationDeliverables />
          </TabsContent>

          {/* Request Form */}
          <TabsContent value="request">
            <VerificationIntakeForm />
          </TabsContent>
        </Tabs>

        {/* Section VI: Important Notice */}
        <ImportantNotice />
      </div>
    </div>
  );
}