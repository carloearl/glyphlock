/**
 * ProfilePanel - Dancer profile list and management
 */
import React, { useState } from "react";
import { Plus, Trash2, Pencil, Copy, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";

export default function ProfilePanel({
  profiles,
  activeProfileId,
  songs,
  onSwitchProfile,
  onOpenProfileManager,
  onDeleteProfile,
  onDuplicateProfile,
  onFocusZone,
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const handleClick = (profile) => {
    const prev = activeProfileId;
    onSwitchProfile(profile.id);
    emitTelemetry("PROFILE_SWITCH", {
      fromProfileId: prev || "none",
      toProfileId: profile.id,
      songCount: profile.songIds?.length || 0,
    });
  };

  return (
    <div
      className="h-full flex flex-col bg-slate-900/60 border-r border-slate-700/50"
      onClick={() => onFocusZone("profile")}
      tabIndex={-1}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-purple-400" />
          Dancers
        </h3>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onOpenProfileManager(null)} title="New dancer (N)">
          <Plus className="w-4 h-4 text-cyan-400" />
        </Button>
      </div>

      {/* Profile list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {profiles.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs">
            No dancers yet.<br />Click + to create one.
          </div>
        )}
        {profiles.map((profile, idx) => {
          const isActive = profile.id === activeProfileId;
          const songCount = profile.songIds?.filter((sid) => songs.find((s) => s.id === sid && !s.archivedFlag)).length || 0;

          return (
            <div
              key={profile.id}
              className={`group rounded-lg px-3 py-2.5 cursor-pointer transition-all border ${
                isActive
                  ? "border-purple-500/40 bg-purple-500/10"
                  : selectedIdx === idx
                  ? "border-slate-600 bg-slate-800/50"
                  : "border-transparent hover:bg-slate-800/40"
              }`}
              onClick={() => handleClick(profile)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-offset-slate-900"
                  style={{ backgroundColor: profile.colorTheme, ringColor: profile.colorTheme }}
                />
                <span className="text-sm font-medium text-white truncate flex-1">{profile.name}</span>
                <span className="text-[10px] text-slate-500">{songCount}</span>
              </div>

              {/* Actions on hover */}
              <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onOpenProfileManager(profile); }}>
                  <Pencil className="w-3 h-3 text-slate-400" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDuplicateProfile(profile.id); }}>
                  <Copy className="w-3 h-3 text-slate-400" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete "${profile.name}"? This cannot be undone.`)) onDeleteProfile(profile.id);
                }}>
                  <Trash2 className="w-3 h-3 text-red-400" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}