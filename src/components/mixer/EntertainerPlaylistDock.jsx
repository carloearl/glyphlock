/**
 * EntertainerPlaylistDock — saves the active mixer playlist to a checked-in
 * entertainer's profile and loads it back at the start of their shift.
 */
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CloudUpload, Download, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  loadCheckedInEntertainers,
  loadEntertainerPlaylist,
  saveEntertainerPlaylist,
  playlistToSongData,
} from "@/lib/nups/entertainerPlaylists";

export default function EntertainerPlaylistDock({ activeProfileName, profileSongs = [], onLoadPlaylist }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadCheckedInEntertainers();
      const withPlaylists = await Promise.all(list.map(async (person) => {
        const playlist = await loadEntertainerPlaylist(person.entertainerId);
        return { ...person, trackCount: playlist?.ordered_tracks?.length || 0, playlistName: playlist?.name || "" };
      }));
      setRoster(withPlaylists);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSave = async (person) => {
    if (!profileSongs.length) {
      toast.error("Load tracks into the active playlist first");
      return;
    }
    setBusyId(person.entertainerId);
    try {
      await saveEntertainerPlaylist({
        entertainerId: person.entertainerId,
        name: activeProfileName || `${person.name} playlist`,
        songs: profileSongs,
      });
      toast.success(`Saved ${profileSongs.length} tracks to ${person.name}`);
      await refresh();
    } catch (error) {
      toast.error(`Save failed: ${error?.message || "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  };

  const handleLoad = async (person) => {
    setBusyId(person.entertainerId);
    try {
      const playlist = await loadEntertainerPlaylist(person.entertainerId);
      const songData = playlistToSongData(playlist);
      if (!songData.length) {
        toast.error(`${person.name} has no saved playlist yet`);
        return;
      }
      onLoadPlaylist?.(songData, person.name);
      toast.success(`Loaded ${songData.length} tracks for ${person.name}`);
    } catch (error) {
      toast.error(`Load failed: ${error?.message || "unknown error"}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="border-t border-slate-700/50 bg-slate-900/70 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/40">
        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5" /> Checked-In Playlists
        </span>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={refresh} title="Refresh roster">
          <RefreshCw className={`w-3 h-3 text-slate-400 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="overflow-y-auto max-h-56 p-2 space-y-1">
        {!loading && roster.length === 0 && (
          <p className="text-[11px] text-slate-500 text-center py-4">
            No entertainers checked in.<br />Playlists appear here at check-in.
          </p>
        )}
        {roster.map((person) => (
          <div key={person.entertainerId} className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-2.5 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-white truncate">{person.name}</span>
              <span className="text-[10px] text-slate-500 flex-shrink-0">{person.trackCount} tracks</span>
            </div>
            <div className="flex gap-1 mt-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === person.entertainerId || person.trackCount === 0}
                className="h-6 flex-1 text-[10px] gap-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                onClick={() => handleLoad(person)}
              >
                <Download className="w-3 h-3" /> Load
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === person.entertainerId}
                className="h-6 flex-1 text-[10px] gap-1 border-slate-600 text-slate-300 hover:bg-slate-700/40"
                onClick={() => handleSave(person)}
              >
                <CloudUpload className="w-3 h-3" /> Save
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}