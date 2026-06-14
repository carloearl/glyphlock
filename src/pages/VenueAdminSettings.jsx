/**
 * VenueAdminSettings — single admin page for editing per-venue runtime config:
 *   • Rates & Fees (VenueRateConfig)
 *   • Daily Compliance Checklist (DailyChecklistConfig)
 *   • Contract Terms (ContractTermsConfig)
 *
 * Restricted to admin / VENUE_OWNER / VENUE_MANAGER / PLATFORM_ADMIN.
 * Per-venue scoped: admin picks venue at top, all three editors retarget.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Settings, ClipboardCheck, FileText, DollarSign, Database } from 'lucide-react';
import { Label } from '@/components/ui/label';
import RateFeeEditor from '@/components/admin/RateFeeEditor';
import DailyChecklistEditor from '@/components/admin/DailyChecklistEditor';
import ContractTermsEditor from '@/components/admin/ContractTermsEditor';

export default function VenueAdminSettings() {
  const [selectedVenue, setSelectedVenue] = useState('');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: venues = [] } = useQuery({
    queryKey: ['venue-configs-list'],
    queryFn: async () => {
      try { return await base44.entities.VenueRateConfig.list('-created_date', 100); }
      catch { return []; }
    },
  });

  useEffect(() => {
    if (!selectedVenue && venues.length > 0) {
      setSelectedVenue(venues[0].venue_id);
    }
  }, [venues, selectedVenue]);

  const isAdmin = user && (
    user.role === 'admin' ||
    ['PLATFORM_ADMIN', 'VENUE_OWNER', 'VENUE_MANAGER'].includes(user._highestRole)
  );

  if (userLoading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-900 border-red-500/30">
          <CardContent className="p-8 text-center space-y-3">
            <Lock className="w-12 h-12 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold">Admin Access Required</h2>
            <p className="text-slate-400 text-sm">Venue settings are restricted to managers and admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            Venue Admin Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Edit the runtime config that drives door math, entertainer check-in, and contract text. Every save is audited.
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <Label className="text-xs text-slate-400 flex items-center gap-1 mb-1">
              <Database className="w-3 h-3" /> Venue
            </Label>
            <Select value={selectedVenue} onValueChange={setSelectedVenue}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue placeholder="Select venue…" />
              </SelectTrigger>
              <SelectContent>
                {venues.length === 0 && <SelectItem value="__none__" disabled>No venues — create a VenueRateConfig first</SelectItem>}
                {venues.map(v => (
                  <SelectItem key={v.id} value={v.venue_id}>{v.venue_name || v.venue_id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedVenue ? (
          <Tabs defaultValue="rates" className="space-y-4">
            <TabsList className="bg-slate-900 border border-slate-800">
              <TabsTrigger value="rates" className="data-[state=active]:bg-slate-800">
                <DollarSign className="w-3 h-3 mr-1" /> Rates & Fees
              </TabsTrigger>
              <TabsTrigger value="checklist" className="data-[state=active]:bg-slate-800">
                <ClipboardCheck className="w-3 h-3 mr-1" /> Daily Checklist
              </TabsTrigger>
              <TabsTrigger value="contracts" className="data-[state=active]:bg-slate-800">
                <FileText className="w-3 h-3 mr-1" /> Contracts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rates">
              <RateFeeEditor venueId={selectedVenue} user={user} />
            </TabsContent>
            <TabsContent value="checklist">
              <DailyChecklistEditor venueId={selectedVenue} user={user} />
            </TabsContent>
            <TabsContent value="contracts">
              <ContractTermsEditor venueId={selectedVenue} user={user} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 text-center text-slate-400 text-sm">
              Select a venue above to edit its settings.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}