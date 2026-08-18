import React from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function DJMasterAudioControls({ volume, muted, onPlay, onMute, onVolumeChange }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-cyan-500/25 bg-cyan-950/20 px-2 py-1">
      <Button type="button" size="sm" onClick={onPlay} className="h-8 gap-1.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400">
        <Play className="h-3.5 w-3.5" /> Play Live
      </Button>
      <Button type="button" size="icon" variant="ghost" onClick={onMute} className="h-8 w-8" aria-label={muted ? "Unmute master output" : "Mute master output"}>
        {muted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4 text-cyan-300" />}
      </Button>
      <div className="w-24"><Slider value={[muted ? 0 : volume * 100]} onValueChange={([value]) => onVolumeChange(value / 100)} min={0} max={100} step={1} /></div>
      <span className="w-8 text-right font-mono text-[10px] text-slate-300">{Math.round((muted ? 0 : volume) * 100)}</span>
    </div>
  );
}