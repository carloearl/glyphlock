/**
 * TrackCsvImport — bulk-import tracks into the DJ library from a CSV file.
 * Expected headers: title, artist, genre, bpm, mood, duration, url
 */
import React, { useRef, useState } from 'react';
import { invokeDJGateway } from '@/components/mixer/automation/djGatewayClient';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const cells = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0) || line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = String(cells[i] ?? '').trim().replace(/^"|"$/g, '').replace(/""/g, '"');
    });
    return row;
  });
}

export default function TrackCsvImport({ onImported }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBusy(true);
    try {
      const rows = parseCsv(await file.text());
      const valid = rows.filter(r => r.title);
      if (valid.length === 0) {
        toast.error('No rows with a "title" column found.');
        return;
      }

      let ok = 0;
      for (const r of valid) {
        try {
          await invokeDJGateway('createTrack', {
            track: {
              title: r.title,
              artist: r.artist || '',
              genre: r.genre || undefined,
              mood: r.mood || undefined,
              bpm: r.bpm ? Number(r.bpm) : undefined,
              duration: r.duration ? Number(r.duration) : undefined,
              youtube_url: r.url || undefined,
              source: 'csv',
              active: true,
            },
          });
          ok += 1;
        } catch (_) { /* skip bad row */ }
      }
      toast.success(`Imported ${ok} of ${valid.length} tracks.`);
      onImported?.();
    } catch (err) {
      toast.error(`CSV import failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        title="Import tracks from CSV (title, artist, genre, bpm, mood, duration, url)"
      >
        {busy
          ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          : <Upload className="w-4 h-4 mr-1" />}
        Import CSV
      </Button>
    </>
  );
}