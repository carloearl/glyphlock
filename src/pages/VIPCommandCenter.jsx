import React, { useState, useEffect, useCallback } from 'react';
import { vip } from '@/components/vip2/vipApi';
import RoomManager from '@/components/vip2/RoomManager';
import PeoplePanel from '@/components/vip2/PeoplePanel';
import ContractDesk from '@/components/vip2/ContractDesk';
import ContractSearch from '@/components/vip2/ContractSearch';
import VIPLiveBoard from '@/components/vip2/VIPLiveBoard';
import VIPUnifiedView from '@/components/vip2/VIPUnifiedView';
import CommandCenterMenu from '@/components/vip2/CommandCenterMenu';
import UnifiedGlyphBucksTab from '@/components/nups/glyphbucks/UnifiedGlyphBucksTab';
import UltimateVIPContract from '@/components/nups/vip/UltimateVIPContract';
import { useAdminOverride } from '@/lib/nups/adminView';
import { base44 } from '@/api/base44Client';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { isOwnerEmail } from '@/lib/nups/ownerEmails';
import { seedDemoContracts, frontendGetState } from '@/lib/nups/frontendDemoSeeder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, ArrowLeft, FlaskConical } from 'lucide-react';

/**
 * VIP Command Center — glass card-grid home screen (owner directive 2026-07-20).
 * The tab bar is replaced by glassmorphic launcher cards; "New Contract" and
 * "GlyphBucks" are merged into one "Contracts & GlyphBucks" card.
 */
const VIEW_TITLES = {
  Unified: 'VIP — All in One',
  Desk: 'Active Sessions',
  Rooms: 'Rooms & Floor',
  People: 'People',
  Search: 'Contract Search',
  GlyphBucks: 'GlyphBucks',
  Contracts: 'VIP Contracts',
};
// VIP Command is live-ops only — no config-gated CREATION views remain here.
const CONFIG_GATED = [];
// Unified VIP workspace: VIP Floor · Sessions · People (staff) · Contracts all
// bind to this ONE page (owner directive 2026-07-21). Legacy /Contracts?tab=…
// deep-links resolve to the internal Contracts view here so there is a single
// VIP link that views and binds them all.
const LEGACY_TAB_MAP = {
  Unified: 'Unified', unified: 'Unified',
  Desk: 'Desk', Rooms: 'Rooms', People: 'People', Search: 'Search',
  GlyphBucks: 'GlyphBucks', Contracts: 'Contracts',
  vip: 'Contracts', contracts: 'Contracts',
};

export default function VIPCommandCenter() {
  const [state, setState] = useState(null);
  const [user, setUser] = useState(null);
  const activeVenue = useActiveVenue();
  const adminOverride = useAdminOverride();
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  // Default to the single unified "everything in one place" view. null = card-grid home.
  const [view, setView] = useState(LEGACY_TAB_MAP[urlTab] || LEGACY_TAB_MAP[(urlTab || '').toLowerCase()] || 'Unified');
  const [loading, setLoading] = useState(true);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  const refresh = useCallback(async () => {
    const s = await vip('getState');
    if (s.error) {
      // Backend unavailable (402 on non-Builder+ plans) — fall back to
      // direct entity reads so the VIP Command Center still renders.
      const fallback = await frontendGetState();
      setState(fallback);
    } else {
      setState(s);
    }
    setLoading(false);
    return s;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const seedConfig = async () => {
    setLoading(true);
    await vip('seedConfig');
    await refresh();
  };

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const seedDemoData = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const me = await base44.auth.me();
      if (!isOwnerEmail(me?.email)) {
        setSeedResult({ error: 'Access denied — demo seeding is restricted to the venue owner.' });
        return;
      }
      const results = await seedDemoContracts(me.email);
      setSeedResult({ success: true, results });
      await refresh();
    } catch (e) {
      setSeedResult({ error: e.message || 'Seeding failed.' });
    } finally {
      setSeeding(false);
    }
  };

  if (loading && !state) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const configMissing = !state?.config;
  // Panels read state.contracts / .entertainers / .guests / .sessions directly.
  // When getState errors (no config, session not validated) state is null —
  // pass a safe empty shape so the live-ops panels render instead of crashing.
  const safeState = state || { contracts: [], entertainers: [], guests: [], sessions: [], rooms: [] };
  const isAdmin = ['admin', 'PLATFORM_ADMIN', 'VENUE_OWNER'].includes(user?.role);
  const venueId = state?.config?.venue_id || activeVenue?.venue_id || activeVenue?.id || 'dream_palace';
  const isOwner = isOwnerEmail(user?.email);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-purple-900/50 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center gap-3">
        {view && (
          <button onClick={() => setView(null)} aria-label="Back to menu"
            className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.05] backdrop-blur px-3 py-2 text-sm text-slate-300 hover:text-white hover:border-white/30 min-h-[44px]">
            <ArrowLeft className="w-4 h-4" /> Menu
          </button>
        )}
        <Crown className="w-6 h-6 text-purple-400" />
        <h1 className="text-lg font-bold">{view ? VIEW_TITLES[view] : 'VIP Command Center — Dream Palace'}</h1>
        {state?.config?.live_enabled ? (
          <Badge className="bg-emerald-600 text-white">LIVE</Badge>
        ) : (
          <Badge className="bg-amber-600 text-white">TEST MODE — live launch not authorized</Badge>
        )}
        <div className="ml-auto flex gap-2 flex-wrap">
          {isOwner && (
            <Button
              size="sm"
              onClick={seedDemoData}
              disabled={seeding}
              className="bg-cyan-700 hover:bg-cyan-600 min-h-[44px] flex items-center gap-1.5"
              title="Seed all demo contract data (owner only)"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
              {seeding ? 'Seeding…' : 'Seed Demo Data'}
            </Button>
          )}
          {configMissing && <Button size="sm" onClick={seedConfig} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Initialize VIP Config</Button>}
          <Button size="sm" variant="outline" onClick={refresh} className="border-purple-700 text-purple-300 min-h-[44px]">Refresh</Button>
        </div>
      </header>

      {seedResult && (
        <div className={`mx-4 mt-3 rounded-xl border p-4 text-sm ${seedResult.error ? 'border-red-700 bg-red-950/40 text-red-300' : 'border-emerald-700 bg-emerald-950/40 text-emerald-300'}`}>
          {seedResult.error ? (
            <p>{seedResult.error}</p>
          ) : (
            <div>
              <p className="font-semibold mb-2">Demo data seeded successfully:</p>
              <ul className="space-y-0.5 text-xs">
                {Object.entries(seedResult.results).map(([entity, count]) => (
                  <li key={entity}><span className="text-emerald-400">●</span> {entity}: {String(count)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <main className="p-4">
        {!view ? (
          <CommandCenterMenu onSelect={setView} />
        ) : configMissing && CONFIG_GATED.includes(view) ? (
          <div className="p-10 text-center text-slate-400">
            No VIP configuration exists for Dream Palace. Contract creation is blocked until the venue configuration is initialized.
          </div>
        ) : (
          <>
            {/* THE unified surface — Floor + Active Sessions + People (staff)
                + Contracts stacked in one scroll so everything about a VIP is
                managed in one place (owner directive 2026-07-21). */}
            {view === 'Unified' && <VIPUnifiedView state={safeState} refresh={refresh} canEdit={adminOverride} />}
            {view === 'Desk' && <ContractDesk state={safeState} refresh={refresh} />}
            {view === 'GlyphBucks' && (
              <UnifiedGlyphBucksTab
                user={user}
                venueId={venueId}
                entertainers={safeState.entertainers}
                isAdmin={isAdmin}
              />
            )}
            {/* Contracts bound INTO the VIP Command Center — one link now views
                VIP Floor, Sessions, People (staff) AND Contracts together
                (owner directive 2026-07-21). Renders the same UltimateVIPContract
                the standalone Contracts page used — no duplicate logic. */}
            {view === 'Contracts' && <UltimateVIPContract canEdit={adminOverride} />}
            {view === 'Rooms' && (
              <div className="space-y-6">
                <div className="mb-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">VIP Floor</h2>
                  <p className="text-xs text-slate-500">Tap a room card to edit session timing &amp; status (managers)</p>
                </div>
                <VIPLiveBoard />
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300 select-none list-none inline-flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">›</span> Room setup &amp; maintenance
                  </summary>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
                    <RoomManager state={state || { rooms: [] }} refresh={refresh} />
                  </div>
                </details>
              </div>
            )}
            {view === 'People' && <PeoplePanel state={safeState} refresh={refresh} />}
            {view === 'Search' && <ContractSearch />}
          </>
        )}
      </main>
    </div>
  );
}