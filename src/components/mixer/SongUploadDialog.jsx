/**
 * SongUploadDialog — Upload local audio files as songs
 * Stores uploaded file as object URL and creates a song entry.
 */
import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Music, FileAudio } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function SongUploadDialog({ isOpen, onClose, onSongCreated }) {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (f) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      toast.error("Only audio files accepted (mp3, wav, ogg, etc.)");
      return;
    }
    setFile(f);
    // Auto-fill title from filename
    if (!title) {
      const name = f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      setTitle(name);
    }
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) return;
    setUploading(true);
    try {
      // Upload to Base44 file storage
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onSongCreated({
        title: title.trim(),
        artist: artist.trim() || "Unknown Artist",
        uploadUrl: file_url,
        youtubeUrl: "", // no YouTube for uploads
      });
      toast.success(`Uploaded "${title.trim()}"`);
      // Reset
      setFile(null);
      setTitle("");
      setArtist("");
      onClose();
    } catch (err) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            Upload Song
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-cyan-500/50 transition-colors"
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-cyan-500/50', 'bg-cyan-500/5'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-cyan-500/50', 'bg-cyan-500/5'); }}
            onDrop={(e) => { e.currentTarget.classList.remove('border-cyan-500/50', 'bg-cyan-500/5'); handleDrop(e); }}
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center gap-3 justify-center">
                <FileAudio className="w-8 h-8 text-cyan-400" />
                <div className="text-left">
                  <p className="text-sm text-white">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Music className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">Drop audio file here or click to browse</p>
                <p className="text-[10px] text-slate-600">MP3, WAV, OGG, FLAC</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />

          {/* Metadata */}
          <div>
            <Label className="text-xs text-slate-300">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-300">Artist</Label>
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={handleUpload}
              disabled={!file || !title.trim() || uploading}
              className="bg-gradient-to-r from-cyan-600 to-blue-600"
            >
              {uploading ? "Uploading…" : "Upload & Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}