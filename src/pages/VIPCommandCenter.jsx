import React, { useState, useEffect, useCallback } from 'react';
import { vip } from '@/components/vip2/vipApi';
import RoomManager from '@/components/vip2/RoomManager';
import PeoplePanel from '@/components/vip2/PeoplePanel';
import ContractDesk from '@/components/vip2/ContractDesk';
import UnifiedContractDesk from '@/components/nups/contracts/UnifiedContractDesk';
import ContractSearch from '@/components/vip2/ContractSearch';
import VIPLiveBoard from '@/components/vip2/VIPLiveBoard';
import GlyphBucksWorkspace from '@/components/nups/glyphbucks/GlyphBucksWorkspace';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown } from 'lucide-react';

/**
 * VIP Command Center — MERGED surface (owner directive 2026-07-17).
 * Absorbs the VIP Room Board (formerly duplicated on Contracts?tab=vip):
 * the live board (timers, guest picker, age/contract gates, auto-print)
 * is the primary Rooms view; the vip2 RoomManager remains below it for
 * room creation and status maintenance.
 */
const TABS = ['Desk', 'New Contract', 'Rooms', 'People', 'GlyphBucks', 'Search'];
// Tabs that require an initialized VIPConfig; Rooms/People/Search work without it.
const CONFIG_GATED = ['Desk', 'New Contract'];

export default function VIPCommandCenter() {
  const [state, setState] = useState(null);
  // Deep-link support: /VIPCommand?tab=GlyphBucks (old GlyphBucks Hub redirects here)
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  const [tab, setTab] = useState(TABS.includes(urlTab) ? urlTab : 'Rooms');
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
        <Crown className="w-6 h-6 text-purple-400" />
        <h1 className="text-lg font-bold">VIP Command Center — Dream Palace</h1>
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

      <nav className="flex gap-1 px-4 pt-3 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium min-h-[44px] ${tab === t ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </nav>
      <main className="p-4">
        {configMissing && CONFIG_GATED.includes(tab) ? (
          <div className="p-10 text-center text-slate-400">
            No VIP configuration exists for Dream Palace. Contract creation is blocked until the venue configuration is initialized.
          </div>
        ) : (
          <>
            {tab === 'Desk' && <ContractDesk state={state} refresh={refresh} />}
            {tab === 'New Contract' && <UnifiedContractDesk />}
            {tab === 'Rooms' && (
              <div className="space-y-6">
                <div className="mb-2">
                  <h2 className="text-xl font-semibold text-white tracking-tight">VIP Floor</h2>
                  <p className="text-xs text-slate-500">Who's in VIP right now — visible to DJ, Manager, Hostess & Owner</p>
                </div>
                {/* Read-only live record: room · entertainer · guest · start · time left */}
                <VIPLiveBoard />
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-300 select-none list-none inline-flex items-center gap-1">
                    <span className="transition-transform group-open:rotate-90">›</span> Room setup & maintenance
                  </summary>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4">
                    <RoomManager state={state || { rooms: [] }} refresh={refresh} />
                  </div>
                </details>
              </div>
            )}
            {tab === 'People' && <PeoplePanel state={state} refresh={refresh} />}
            {tab === 'GlyphBucks' && <GlyphBucksWorkspace />}
            {tab === 'Search' && <ContractSearch />}
          </>
        )}
      </main>
    </div>
  );
}