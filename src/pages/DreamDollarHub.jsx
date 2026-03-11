import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Scan, Search, Shield, FileText, Settings } from 'lucide-react';

import DreamDollarPOS from '@/components/nups/dreamdollar/DreamDollarPOS';
import BillRedemptionScanner from '@/components/nups/dreamdollar/BillRedemptionScanner';
import TransactionSearch from '@/components/nups/dreamdollar/TransactionSearch';
import DreamDollarReceiptEngine from '@/components/nups/pos/DreamDollarReceiptEngine';
import DemoModeController from '@/components/nups/pos/DemoModeController';
import FraudAnalyticsDashboard from '@/components/nups/FraudAnalyticsDashboard';
import IDScannerCamera from '@/components/nups/IDScannerCamera';
import VerificationCameraCapture from '@/components/nups/VerificationCameraCapture';

/**
 * Dream Dollar Hub - Unified transaction, verification, and compliance module.
 * Integrates into existing NUPS platform.
 */
export default function DreamDollarHub() {
  const [user, setUser] = useState(null);
  const [venueId, setVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Get venue from user metadata or assignments
        // TODO: Implement venue selection logic
        setVenueId('default_venue');
      } catch (err) {
        console.error('Auth error:', err);
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch entertainers for redemption
  const { data: entertainers = [] } = useQuery({
    queryKey: ['entertainers', venueId],
    queryFn: async () => {
      if (!venueId) return [];
      return await base44.entities.Entertainer.filter({ venue_id: venueId, status: 'active' });
    },
    enabled: !!venueId
  });

  const handleSaleComplete = (saleData) => {
    setSelectedTransaction(saleData.batch?.transaction_id);
    setSelectedBatch(saleData.batch);
    setActiveTab('receipt');
  };

  const handleDemoModeChange = (enabled) => {
    setDemoMode(enabled);
    if (enabled) {
      alert('⚠️ DEMO MODE ENABLED\n\nAll transactions will be watermarked and isolated from production data.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Loading Dream Dollar Hub...</div>
          <div className="text-gray-400">Initializing secure environment</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <div className="text-2xl font-bold mb-2">Authentication Required</div>
          <div className="text-gray-400">Please log in to access Dream Dollar operations</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'transparent' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-cyan-400" />
              Dream Dollar Hub
            </h1>
            <p className="text-gray-400 mt-1">
              Transaction Management & Compliance Module
            </p>
          </div>
          {demoMode && (
            <div className="px-4 py-2 bg-yellow-900/30 border border-yellow-500/50 rounded-lg">
              <div className="text-yellow-400 font-bold text-sm">⚠️ DEMO MODE</div>
            </div>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Sales</span>
            </TabsTrigger>
            <TabsTrigger value="receipt" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Receipt</span>
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

          {/* Sales Tab */}
          <TabsContent value="sales" className="space-y-4">
            <DreamDollarPOS
              venue_id={venueId}
              onSaleComplete={handleSaleComplete}
            />
          </TabsContent>

          {/* Receipt Tab */}
          <TabsContent value="receipt">
            {selectedTransaction && selectedBatch ? (
              <DreamDollarReceiptEngine
                transaction={{ order_number: selectedBatch.batch_id, ...selectedBatch }}
                batch={selectedBatch}
                onPrint={() => console.log('Receipt printed')}
              />
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No transaction selected</p>
                <p className="text-sm mt-2">Complete a sale to generate receipt</p>
              </div>
            )}
          </TabsContent>

          {/* ID Scanner Tab */}
          <TabsContent value="id-scan">
            <IDScannerCamera
              venue_id={venueId}
              onDataExtracted={(data) => {
                console.log('ID data extracted:', data);
                alert('✅ Customer data captured. Use this data to autofill contract forms.');
              }}
            />
          </TabsContent>

          {/* Verification Capture Tab */}
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

          {/* Redemption Tab */}
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

          {/* Search Tab */}
          <TabsContent value="search">
            <TransactionSearch venue_id={venueId} />
          </TabsContent>

          {/* Fraud Analytics Tab */}
          <TabsContent value="fraud">
            <FraudAnalyticsDashboard venue_id={venueId} />
          </TabsContent>
        </Tabs>

        {/* Demo Mode Control (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="mt-8">
            <DemoModeController onModeChange={handleDemoModeChange} />
          </div>
        )}
      </div>
    </div>
  );
}