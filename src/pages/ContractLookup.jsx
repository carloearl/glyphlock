import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search, FileText, Eye, Calendar, User, DollarSign, Shield,
  Loader2, Crown, ShieldAlert
} from 'lucide-react';
import { GLYPHLOCK_DISCLAIMER } from '@/constants/legalDisclaimer';
import { aggregateSpenders, THRESHOLDS } from '@/components/vault/spendAggregator';
import SpenderRow from '@/components/vault/SpenderRow';
import EvidenceDrawer from '@/components/vault/EvidenceDrawer';
import { useActiveVenue } from '@/hooks/useActiveVenue';

export default function ContractLookup() {
  const activeVenue = useActiveVenue();
  const venueId = activeVenue?.id || activeVenue?.venue_id || null;
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('spenders'); // 'spenders' | 'contracts'
  const [flagFilter, setFlagFilter] = useState('all'); // 'all' | 'BIG_SPENDER' | 'MULTI_CONTRACT' | 'MULTI_CARD'
  const [selectedProfile, setSelectedProfile] = useState(null);

  const { data: venueContracts = [] } = useQuery({
    queryKey: ['venue-contracts', venueId],
    queryFn: () => venueId ? base44.entities.VenueContract.filter({ venue_id: venueId }, '-created_date', 300) : Promise.resolve([]),
    enabled: !!venueId,
    initialData: [],
  });
  const { data: vipRecords = [] } = useQuery({
    queryKey: ['vip-contract-records', venueId],
    queryFn: () => venueId ? base44.entities.VIPContractRecord.filter({ venue_id: venueId }, '-created_date', 200) : Promise.resolve([]),
    enabled: !!venueId,
    initialData: [],
  });
  const { data: gbOrders = [] } = useQuery({
    queryKey: ['glyphbucks-orders', venueId],
    queryFn: () => venueId ? base44.entities.GlyphBucksOrder.filter({ venue_id: venueId }, '-created_date', 200) : Promise.resolve([]),
    enabled: !!venueId,
    initialData: [],
  });
  const { data: posTransactions = [] } = useQuery({
    queryKey: ['pos-transactions-vault', venueId],
    queryFn: () => venueId ? base44.entities.POSTransaction.filter({ venue_id: venueId }, '-created_date', 300) : Promise.resolve([]),
    enabled: !!venueId,
    initialData: [],
  });
  const { data: vipRooms = [] } = useQuery({
    queryKey: ['vip-rooms-vault', venueId],
    queryFn: () => venueId ? base44.entities.VIPRoom.filter({ venue_id: venueId }) : Promise.resolve([]),
    enabled: !!venueId,
    initialData: [],
  });

  const isLoading = !venueContracts || !vipRecords;

  const spenderProfiles = useMemo(
    () => aggregateSpenders({ venueContracts, vipRecords, gbOrders, posTransactions }),
    [venueContracts, vipRecords, gbOrders, posTransactions]
  );

  const filteredSpenders = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return spenderProfiles.filter((p) => {
      if (flagFilter !== 'all' && !p.flags.includes(flagFilter)) return false;
      if (!term) return true;
      return (
        p.displayName?.toLowerCase().includes(term) ||
        p.cardsUsed.some((c) => c.includes(term)) ||
        p.contracts.some((c) =>
          c.contract_id?.toLowerCase().includes(term) ||
          c.order_number?.toLowerCase().includes(term) ||
          c.approval_code?.toLowerCase().includes(term)
        )
      );
    });
  }, [spenderProfiles, searchTerm, flagFilter]);

  const allContracts = useMemo(() => [
    ...venueContracts.map((c) => ({ ...c, _source: 'Venue', _id: c.contract_id })),
    ...vipRecords.map((c) => ({ ...c, _source: 'VIP', _id: c.order_number })),
    ...gbOrders.map((o) => ({ ...o, _source: 'GlyphBucks', _id: o.order_number })),
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)), [venueContracts, vipRecords, gbOrders]);

  const filteredContracts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return allContracts;
    return allContracts.filter((r) =>
      r._id?.toLowerCase().includes(term) ||
      r.customer_name?.toLowerCase().includes(term) ||
      r.guest_name?.toLowerCase().includes(term) ||
      r.approval_code?.toLowerCase().includes(term) ||
      r.card_last_four?.includes(term)
    );
  }, [allContracts, searchTerm]);

  const flaggedCount = spenderProfiles.filter((p) => p.flags.length).length;
  const totalVaulted = spenderProfiles.reduce((s, p) => s + p.totalSpend, 0);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            Spend Intelligence & Evidence Vault
          </h1>
          <p className="text-gray-400 text-sm">
            Cross-referenced contracts, payments, and evidence for high-value and high-risk customers
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-gray-900/60 border-purple-500/30">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400">Unique Customers</div>
              <div className="text-2xl font-bold text-purple-300">{spenderProfiles.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-amber-500/30">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400">Flagged Profiles</div>
              <div className="text-2xl font-bold text-amber-300 flex items-center gap-1">
                <Crown className="w-5 h-5" /> {flaggedCount}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400">Total Vaulted Spend</div>
              <div className="text-2xl font-bold text-emerald-300">${totalVaulted.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="text-xs text-gray-400">All Contracts</div>
              <div className="text-2xl font-bold text-cyan-300">{allContracts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search + view toggle + flag filter */}
        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="pt-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, contract ID, approval code, or card last-4..."
                className="pl-10 bg-gray-800 border-gray-700 h-12 text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={view === 'spenders' ? 'default' : 'outline'}
                onClick={() => setView('spenders')}
                className={view === 'spenders' ? 'bg-purple-600 text-white' : 'border-gray-700 text-gray-300'}
              >
                <Crown className="w-4 h-4 mr-1" /> Spenders
              </Button>
              <Button
                size="sm"
                variant={view === 'contracts' ? 'default' : 'outline'}
                onClick={() => setView('contracts')}
                className={view === 'contracts' ? 'bg-purple-600 text-white' : 'border-gray-700 text-gray-300'}
              >
                <FileText className="w-4 h-4 mr-1" /> All Contracts
              </Button>

              {view === 'spenders' && (
                <>
                  <div className="w-px bg-gray-700 mx-1" />
                  {[
                    { k: 'all', label: 'All' },
                    { k: 'BIG_SPENDER', label: `≥ $${THRESHOLDS.BIG_SPENDER_THRESHOLD}` },
                    { k: 'MULTI_CONTRACT', label: `${THRESHOLDS.MULTI_CONTRACT_THRESHOLD}+ Contracts` },
                    { k: 'MULTI_CARD', label: `${THRESHOLDS.MULTI_CARD_THRESHOLD}+ Cards` },
                  ].map((f) => (
                    <Button
                      key={f.k}
                      size="sm"
                      variant={flagFilter === f.k ? 'default' : 'outline'}
                      onClick={() => setFlagFilter(f.k)}
                      className={flagFilter === f.k ? 'bg-amber-600 text-white' : 'border-gray-700 text-gray-300'}
                    >
                      {f.label}
                    </Button>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
          </div>
        ) : view === 'spenders' ? (
          <div className="space-y-3">
            {filteredSpenders.map((p) => (
              <SpenderRow key={p.key} profile={p} onInspect={setSelectedProfile} />
            ))}
            {filteredSpenders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Crown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No spender profiles match the current filter.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContracts.map((record) => (
              <Card key={record.id} className="bg-gray-900/60 border-gray-700 hover:border-purple-500/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="font-mono text-xs bg-purple-500/20 text-purple-400 border-purple-500/40">
                          {record._id || record.id?.slice(0, 10)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                          {record._source}
                        </Badge>
                        {record.status && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                            {record.status}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-gray-500" />
                          {record.customer_name || record.guest_name || '—'}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(record.created_date).toLocaleDateString()}
                        </div>
                        {(record.grand_total || record.contract_amount) && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            ${(record.grand_total || record.contract_amount).toFixed(2)}
                          </div>
                        )}
                        {record.card_last_four && (
                          <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                            <Shield className="w-4 h-4 text-gray-500" />
                            •••• {record.card_last_four}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/40 text-cyan-400"
                      onClick={() => {
                        const match = spenderProfiles.find((p) =>
                          p.displayName?.toLowerCase() === (record.customer_name || record.guest_name || '').toLowerCase()
                        );
                        if (match) setSelectedProfile(match);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredContracts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contracts found</p>
              </div>
            )}
          </div>
        )}

        <EvidenceDrawer
          profile={selectedProfile}
          vipRooms={vipRooms}
          open={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />

        <div className="text-center text-xs text-gray-600 pt-6 border-t border-gray-800">
          {GLYPHLOCK_DISCLAIMER}
        </div>
      </div>
    </div>
  );
}