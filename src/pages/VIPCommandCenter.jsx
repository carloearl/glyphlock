import React, { useState, useEffect, useCallback } from 'react';
import { vip } from '@/components/vip2/vipApi';
import RoomManager from '@/components/vip2/RoomManager';
import PeoplePanel from '@/components/vip2/PeoplePanel';
import ContractDesk from '@/components/vip2/ContractDesk';
import ContractSearch from '@/components/vip2/ContractSearch';
import VIPLiveBoard from '@/components/vip2/VIPLiveBoard';
import CommandCenterMenu from '@/components/vip2/CommandCenterMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, ArrowLeft } from 'lucide-react';

/**
 * VIP Command Center — glass card-grid home screen (owner directive 2026-07-20).
 * The tab bar is replaced by glassmorphic launcher cards; "New Contract" and
 * "GlyphBucks" are merged into one "Contracts & GlyphBucks" card.
 */
const VIEW_TITLES = {
  Desk: 'Active Sessions',
  Rooms: 'Rooms & Floor',
  People: 'People',
  Search: 'Contract Search',
};
// VIP Command is live-ops only — no config-gated CREATION views remain here.
const CONFIG_GATED = [];
// Legacy deep-links: old ?tab=GlyphBucks / ?tab=New Contract / ?tab=Contracts
// now belong on /Contracts — they resolve to the card grid (null) here so the
// operator lands on the menu and taps through to the Contracts workspace.
const LEGACY_TAB_MAP = {
  Desk: 'Desk', Rooms: 'Rooms', People: 'People', Search: 'Search',
};

export default function VIPCommandCenter() {
  const [state, setState] = useState(null);
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  const [view, setView] = useState(LEGACY_TAB_MAP[urlTab] || null); // null = card-grid home
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await vip('getState');
    if (!s.error) setState(s);
    setLoading(false);
    return s;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const seedConfig = async () => {
    setLoading(true);
    await vip('seedConfig');
    await refresh();
  };

  if (loading && !state) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const configMissing = !state?.config;

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
        <div className="ml-auto flex gap-2">
          {configMissing && <Button size="sm" onClick={seedConfig} className="bg-purple-700 hover:bg-purple-600 min-h-[44px]">Initialize VIP Config</Button>}
          <Button size="sm" variant="outline" onClick={refresh} className="border-purple-700 text-purple-300 min-h-[44px]">Refresh</Button>
        </div>
      </header>

      <main className="p-4">
        {!view ? (
          <CommandCenterMenu onSelect={setView} />
        ) : configMissing && CONFIG_GATED.includes(view) ? (
          <div className="p-10 text-center text-slate-400">
            No VIP configuration exists for Dream Palace. Contract creation is blocked until the venue configuration is initialized.
          </div>
        ) : (
          <>
            {view === 'Desk' && <ContractDesk state={state} refresh={refresh} />}
            {/* 'Contracts' view retired — the card now navigates to /Contracts,
                the one home for all contract & GlyphBucks CREATION. No embedded
                duplicate here (owner directive 2026-07-21). */}
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
            {view === 'People' && <PeoplePanel state={state} refresh={refresh} />}
            {view === 'Search' && <ContractSearch />}
          </>
        )}
      </main>
    </div>
  );
}