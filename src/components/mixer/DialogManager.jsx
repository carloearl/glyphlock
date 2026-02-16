/**
 * DialogManager - Modal controller for all mixer dialogs
 * Handles addSong, editSong, profileManager, archive, filter
 */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { TrackVibe, VIBE_META, createSongEntry, createDancerProfile } from "@/components/mixer/types/mixerTypes";
import { validateSong, validateProfile, parseYoutubeUrl } from "@/components/mixer/services/validation";
import { classifySong } from "@/components/mixer/services/aiMixerAssistant";
import { Sparkles, Loader2, Archive, RotateCcw } from "lucide-react";

// ─── Song Form (shared for add/edit) ───
function SongForm({ song, onChange, errors, onClassify, classifying }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-300">Title *</Label>
        <Input value={song.title} onChange={(e) => onChange({ ...song, title: e.target.value })} placeholder="Song title" className="mt-1" />
        {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
      </div>
      <div>
        <Label className="text-xs text-slate-300">Artist *</Label>
        <Input value={song.artist} onChange={(e) => onChange({ ...song, artist: e.target.value })} placeholder="Artist name" className="mt-1" />
        {errors.artist && <p className="text-xs text-red-400 mt-1">{errors.artist}</p>}
      </div>
      <div>
        <Label className="text-xs text-slate-300">YouTube URL</Label>
        <Input value={song.youtubeUrl} onChange={(e) => onChange({ ...song, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." className="mt-1" />
        {errors.youtubeUrl && <p className="text-xs text-red-400 mt-1">{errors.youtubeUrl}</p>}
      </div>
      <div>
        <Label className="text-xs text-slate-300">Direct Audio URL</Label>
        <Input value={song.uploadUrl || ""} onChange={(e) => onChange({ ...song, uploadUrl: e.target.value })} placeholder="https://example.com/song.mp3" className="mt-1" />
        <p className="text-[10px] text-slate-600 mt-0.5">MP3/WAV URL — or use Upload button for local files</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-slate-300">Vibe *</Label>
          <Select value={song.vibeTag} onValueChange={(v) => onChange({ ...song, vibeTag: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(VIBE_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}><span style={{ color: meta.color }}>{meta.label}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vibeTag && <p className="text-xs text-red-400 mt-1">{errors.vibeTag}</p>}
        </div>
        <div>
          <Label className="text-xs text-slate-300">Energy: {song.energyLevel}</Label>
          <Slider
            value={[song.energyLevel]}
            onValueChange={([v]) => onChange({ ...song, energyLevel: v })}
            min={1} max={10} step={1}
            className="mt-2"
          />
          {errors.energyLevel && <p className="text-xs text-red-400 mt-1">{errors.energyLevel}</p>}
        </div>
      </div>
      <div>
        <Label className="text-xs text-slate-300">Notes</Label>
        <Input value={song.notes || ""} onChange={(e) => onChange({ ...song, notes: e.target.value })} placeholder="Optional notes" className="mt-1" />
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5 border-purple-500/40 text-purple-300" onClick={onClassify} disabled={classifying || !song.title || !song.artist}>
        {classifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        AI Classify
      </Button>
    </div>
  );
}

// ─── Profile Form ───
function ProfileForm({ profile, onChange, errors }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-300">Name *</Label>
        <Input value={profile.name} onChange={(e) => onChange({ ...profile, name: e.target.value })} placeholder="Dancer name" className="mt-1" />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>
      <div>
        <Label className="text-xs text-slate-300">Color Theme</Label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="color"
            value={profile.colorTheme}
            onChange={(e) => onChange({ ...profile, colorTheme: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer border border-slate-700"
          />
          <Input value={profile.colorTheme} onChange={(e) => onChange({ ...profile, colorTheme: e.target.value })} className="flex-1" />
        </div>
        {errors.colorTheme && <p className="text-xs text-red-400 mt-1">{errors.colorTheme}</p>}
      </div>
    </div>
  );
}

export default function DialogManager({
  mode,
  onClose,
  // Song operations
  editingSong,
  allSongs,
  onSaveSong,
  // Profile operations
  editingProfile,
  allProfiles,
  onSaveProfile,
  // Archive
  archivedSongs,
  onUnarchive,
  onBulkUnarchive,
}) {
  const [songDraft, setSongDraft] = useState(createSongEntry());
  const [profileDraft, setProfileDraft] = useState(createDancerProfile());
  const [errors, setErrors] = useState({});
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    if (mode === "editSong" && editingSong) {
      setSongDraft({ ...editingSong });
    } else if (mode === "addSong") {
      setSongDraft(createSongEntry());
    } else if (mode === "profileManager") {
      setProfileDraft(editingProfile ? { ...editingProfile } : createDancerProfile());
    }
    setErrors({});
  }, [mode, editingSong, editingProfile]);

  const handleSongSubmit = () => {
    // Normalize YouTube URL
    const parsed = parseYoutubeUrl(songDraft.youtubeUrl);
    const normalized = { ...songDraft, youtubeUrl: parsed ? parsed.canonical : songDraft.youtubeUrl, energyLevel: parseInt(songDraft.energyLevel) || 5 };
    const { valid, errors: errs } = validateSong(normalized, allSongs);
    if (!valid) { setErrors(errs); return; }
    onSaveSong(normalized, mode === "editSong");
    onClose();
    toast.success(mode === "editSong" ? "Song updated" : "Song added");
  };

  const handleProfileSubmit = () => {
    const { valid, errors: errs } = validateProfile(profileDraft, allProfiles);
    if (!valid) { setErrors(errs); return; }
    onSaveProfile(profileDraft, !!editingProfile);
    onClose();
    toast.success(editingProfile ? "Profile updated" : "Profile created");
  };

  const handleClassify = async () => {
    setClassifying(true);
    const res = await classifySong({ title: songDraft.title, artist: songDraft.artist, notes: songDraft.notes });
    setClassifying(false);
    if (res.success) {
      setSongDraft((d) => ({ ...d, vibeTag: res.data.vibeTag, energyLevel: res.data.energyLevel }));
      toast.success(`AI suggests: ${VIBE_META[res.data.vibeTag]?.label}, Energy ${res.data.energyLevel}`);
    } else {
      toast.error(res.error || "Classification failed");
    }
  };

  const isOpen = !!mode;
  const titles = {
    addSong: "Add Song",
    editSong: "Edit Song",
    profileManager: editingProfile ? "Edit Profile" : "New Profile",
    archive: "Archived Songs",
    filter: "Advanced Filters",
    shortcuts: "Shortcuts",
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{titles[mode] || "Dialog"}</DialogTitle>
        </DialogHeader>

        {/* Add / Edit Song */}
        {(mode === "addSong" || mode === "editSong") && (
          <div className="space-y-4">
            <SongForm song={songDraft} onChange={setSongDraft} errors={errors} onClassify={handleClassify} classifying={classifying} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSongSubmit} className="bg-gradient-to-r from-cyan-600 to-blue-600">
                {mode === "editSong" ? "Save Changes" : "Add Song"}
              </Button>
            </div>
          </div>
        )}

        {/* Profile Manager */}
        {mode === "profileManager" && (
          <div className="space-y-4">
            <ProfileForm profile={profileDraft} onChange={setProfileDraft} errors={errors} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleProfileSubmit} className="bg-gradient-to-r from-purple-600 to-pink-600">
                {editingProfile ? "Save Changes" : "Create Profile"}
              </Button>
            </div>
          </div>
        )}

        {/* Archive */}
        {mode === "archive" && (
          <div className="space-y-3">
            {archivedSongs?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No archived songs</p>
            ) : (
              <>
                <Button size="sm" variant="outline" className="gap-1.5 border-slate-700" onClick={onBulkUnarchive}>
                  <RotateCcw className="w-3 h-3" /> Unarchive All
                </Button>
                <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                  {archivedSongs?.map((song) => (
                    <div key={song.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 border border-slate-700/30">
                      <div>
                        <span className="text-sm text-white">{song.title}</span>
                        <span className="text-xs text-slate-500 ml-2">{song.artist}</span>
                      </div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => onUnarchive(song.id)}>
                        <RotateCcw className="w-3 h-3" /> Restore
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}