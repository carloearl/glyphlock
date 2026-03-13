/**
 * UnifiedDreamDollarHub — Merged Dream Dollar operations
 * Combines: New Sales, Currency Press, Bill Redemption, Transaction Search, Contract Archive, Fraud Analytics
 */
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Printer, Scan, Search, ScrollText, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import DreamPalaceContract from './DreamPalaceContract';
import ClubCurrencyPressView from './press/ClubCurrencyPressView';
import BillRedemptionScanner from './dreamdollar/BillRedemptionScanner';
import TransactionSearch from './dreamdollar/TransactionSearch';
import ContractViewer from './ContractViewer';
import FraudAnalyticsDashboard from './FraudAnalyticsDashboard';

export default function UnifiedDreamDollarHub({ venue_id = "dream_palace" }) {
  const [activeSubTab, setActiveSubTab] = useState("new-sale");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Dream Dollar Operations</h2>
        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
          Unified Hub
        </Badge>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-gray-900/80 border border-gray-800">
          <TabsTrigger value="new-sale" className="min-h-[44px] flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs sm:text-sm">New Sale</span>
          </TabsTrigger>
          <TabsTrigger value="press" className="min-h-[44px] flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Press Bills</span>
          </TabsTrigger>
          <TabsTrigger value="redeem" className="min-h-[44px] flex items-center gap-1.5">
            <Scan className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Redeem</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="min-h-[44px] flex items-center gap-1.5">
            <Search className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Search</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="min-h-[44px] flex items-center gap-1.5">
            <ScrollText className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Archive</span>
          </TabsTrigger>
          <TabsTrigger value="fraud" className="min-h-[44px] flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Fraud</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new-sale" className="mt-4">
          <DreamPalaceContract 
            onComplete={() => {
              setActiveSubTab("archive");
            }}
            onCurrencyPrint={(amount, orderNum) => {
              setActiveSubTab("press");
            }}
          />
        </TabsContent>

        <TabsContent value="press" className="mt-4">
          <ClubCurrencyPressView />
        </TabsContent>

        <TabsContent value="redeem" className="mt-4">
          <BillRedemptionScanner venue_id={venue_id} />
        </TabsContent>

        <TabsContent value="search" className="mt-4">
          <TransactionSearch venue_id={venue_id} />
        </TabsContent>

        <TabsContent value="archive" className="mt-4">
          <ContractViewer />
        </TabsContent>

        <TabsContent value="fraud" className="mt-4">
          <FraudAnalyticsDashboard venue_id={venue_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}