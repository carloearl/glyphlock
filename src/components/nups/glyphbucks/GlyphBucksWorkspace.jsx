import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Scan, Search, Shield, Settings, Camera } from 'lucide-react';

import GlyphBucksSaleFlow from '@/components/nups/glyphbucks/GlyphBucksSaleFlow';
import BillRedemptionScanner from '@/components/nups/glyphbucks/BillRedemptionScanner';
import TransactionSearch from '@/components/nups/glyphbucks/TransactionSearch';
import DemoModeController from '@/components/nups/pos/DemoModeController';
import FraudAnalyticsDashboard from '@/components/nups/FraudAnalyticsDashboard';
import IDScannerCamera from '@/components/nups/IDScannerCamera';
import VerificationCameraCapture from '@/components/nups/VerificationCameraCapture';
import ClubCurrencyPressView from '@/components/nups/press/ClubCurrencyPressView';

/**
 * GlyphBucksWorkspace — the full GlyphBucks operations surface
 * (sales, press, ID scan, verify, redeem, search, fraud) extracted from the
 * standalone hub page so it lives INSIDE the VIP Command Center
 * (merge directive 2026-07-17). Access control comes from the host page.
 */
export default function GlyphBucksWorkspace() {
  const [user, setUser] = useState(null);
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || 'dream_palace';
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  // Sealed sale → Press handoff: bill order auto-fills and auto-logs on print.
  const [billOrder, setBillOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try { setUser(await base44.auth.me()); } catch { /* host page guards auth */ }
    })();
  }, []);

  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers', venueId],
    queryFn: async () => {
      if (!venueId) return [];
      return await base44.entities.Entertainer.filter({ venue_id: venueId, status: 'active' });
    },
    enabled: !!venueId
  });

  const handleDemoModeChange = (enabled) => {
    setDemoMode(enabled);
    if (enabled) {
      alert('⚠️ DEMO MODE ENABLED\n\nAll transactions will be watermarked and isolated from production data.');
    }
  };

  return (
    <div className="space-y-6">
      {demoMode && (
        <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg inline-block">
          <div className="text-yellow-400 font-bold text-sm">⚠️ DEMO MODE</div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Sales</span>
          </TabsTrigger>
          <TabsTrigger value="press" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Press</span>
          </TabsTrigger>
          <TabsTrigger value="id-scan" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">ID Scan</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Verify</span>
          </TabsTrigger>
          <TabsTrigger value="redemption" className="flex items-center gap-2">
            <Scan className="w-4 h-4" />
            <span className="hidden sm:inline">Redeem</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Fraud</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Sealed Ed25519 sale flow IS the hub sale. Sealing prints the
              contract-receipt; "Print Bills" hands the order to the Press. */}
          <GlyphBucksSaleFlow
            onSealed={(r) => setSelectedTransaction(r.verify_ref)}
            onPrintBills={(order) => { setBillOrder(order); setActiveTab('press'); }}
          />
        </TabsContent>

        <TabsContent value="press">
          <ClubCurrencyPressView saleOrder={billOrder} />
        </TabsContent>

        <TabsContent value="id-scan">
          <IDScannerCamera
            venue_id={venueId}
            onDataExtracted={(data) => {
              console.log('ID data extracted:', data);
              alert('✅ Customer data captured. Use this data to autofill contract forms.');
            }}
          />
        </TabsContent>

        <TabsContent value="verification">
          {selectedTransaction ? (
            <VerificationCameraCapture
              transaction_id={selectedTransaction}
              venue_id={venueId}
              onCaptureComplete={(media) => {
                alert(`✅ Verification complete. ${media.length} media files uploaded.`);
              }}
            />
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No transaction selected</p>
              <p className="text-sm mt-2">Complete a sale to enable verification capture</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="redemption">
          <div className="space-y-4">
            {entertainers.length > 0 ? (
              <div className="space-y-3">
                {entertainers.slice(0, 5).map(ent => (
                  <BillRedemptionScanner
                    key={ent.id}
                    venue_id={venueId}
                    contractor={ent}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Scan className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No active entertainers found</p>
                <p className="text-sm mt-2">Check entertainer registry</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="search">
          <TransactionSearch venue_id={venueId} />
        </TabsContent>

        <TabsContent value="fraud">
          <FraudAnalyticsDashboard venue_id={venueId} />
        </TabsContent>
      </Tabs>

      {user?.role === 'admin' && (
        <div className="mt-8">
          <DemoModeController onModeChange={handleDemoModeChange} />
        </div>
      )}
    </div>
  );
}