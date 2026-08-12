import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Button } from '@/components/ui/button';
import { UploadCloud, Loader2 } from 'lucide-react';

// "Artist - Title.mp3" → { artist, title }; falls back to the bare filename.
function parseName(fileName) {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/_/g, ' ').trim();
  const split = base.split(/\s+-\s+/);
  if (split.length >= 2) return { artist: split[0].trim(), title: split.slice(1).join(' - ').trim() };
  return { artist: '', title: base };
}

function readDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value) => { URL.revokeObjectURL(url); resolve(value); };
    audio.addEventListener('loadedmetadata', () => done(Math.round(audio.duration) || undefined));
    audio.addEventListener('error', () => done(undefined));
    audio.src = url;
  });
}

export default function BulkAudioUpload({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failed, setFailed] = useState([]);

  async function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    setBusy(true);
    setFailed([]);
    setProgress({ done: 0, total: files.length });
    const errors = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const { artist, title } = parseName(file.name);
        const duration = await readDuration(file);
        await invokeDJGateway('createTrack', {
          track: { title, artist: artist || undefined, duration, file_url, source: 'upload', active: true },
        });
      } catch (error) {
        errors.push(`${file.name}: ${error.message || 'upload failed'}`);
      }
      setProgress({ done: index + 1, total: files.length });
    }

    setFailed(errors);
    setBusy(false);
    onImported?.();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
      >
        {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-1" />}
        {busy ? `Uploading ${progress.done}/${progress.total}` : 'Bulk Upload Audio'}
      </Button>
      {!busy && failed.length > 0 && (
        <div className="text-[10px] text-amber-300 max-w-xs text-right">
          {failed.length} file{failed.length > 1 ? 's' : ''} skipped: {failed[0]}
        </div>
      )}
    </div>
  );
}