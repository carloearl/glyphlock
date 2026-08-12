/**
 * MusicSuitePanel — wrapper that exposes the NUPS music-suite sub-tabs
 * inside the DJ Mixer Pro page and the NUPS Staff DJ console.
 * Minimum viable: Tracks, YouTube Search, Personas, Playlist Gen, Crowd, Jukebox.
 */
import React, { useState } from 'react';
import { Music, Search, Disc, Zap, Activity, Radio, Stethoscope } from 'lucide-react';

import TracksTab from './TracksTab';
import MusicSearchTab from './MusicSearchTab';
import PersonasTab from './PersonasTab';
import PlaylistGenTab from './PlaylistGenTab';
import CrowdTab from './CrowdTab';
import JukeboxTab from './JukeboxTab';
import TrackHealthTab from './TrackHealthTab';
import SuiteErrorBoundary from './SuiteErrorBoundary';

const TABS = [
  { key: 'tracks', label: 'Tracks', icon: Music, active: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
  { key: 'search', label: 'YT Search', icon: Search, active: 'bg-red-500/20 text-red-300 border-red-500/50' },
  { key: 'personas', label: 'Personas', icon: Disc, active: 'bg-pink-500/20 text-pink-300 border-pink-500/50' },
  { key: 'playlist', label: 'Playlist', icon: Zap, active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
  { key: 'crowd', label: 'Crowd', icon: Activity, active: 'bg-green-500/20 text-green-300 border-green-500/50' },
  { key: 'jukebox', label: 'Jukebox', icon: Radio, active: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' },
  { key: 'health', label: 'Diagnostics', icon: Stethoscope, active: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
];

export default function MusicSuitePanel() {
  const [active, setActive] = useState('tracks');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-slate-700/50 pb-3">
        {TABS.map(({ key, label, icon: Icon, active: activeCls }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              active === key ? activeCls : 'text-gray-400 hover:text-white hover:bg-slate-800/50 border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <SuiteErrorBoundary key={active}>
          {active === 'tracks' && <TracksTab />}
          {active === 'search' && <MusicSearchTab />}
          {active === 'personas' && <PersonasTab />}
          {active === 'playlist' && <PlaylistGenTab />}
          {active === 'crowd' && <CrowdTab />}
          {active === 'jukebox' && <JukeboxTab />}
          {active === 'health' && <TrackHealthTab />}
        </SuiteErrorBoundary>
      </div>
    </div>
  );
}