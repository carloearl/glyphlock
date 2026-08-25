import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleStop,
  Keyboard,
  Play,
  Radio,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
  Waves,
} from "lucide-react";
import { toast } from "sonner";
import { useDJSession } from "@/components/mixer/session/DJSessionProvider";

const DB_NAME = "glyphlock-dj-soundboard";
const STORE_NAME = "samples";
const DB_VERSION = 1;

const ORIGINAL_PADS = [
  { id: "gl-air-horn", name: "Air Horn", category: "DJ / Hype", generator: "airHorn", shortcut: "1", color: "from-fuchsia-600 to-violet-700" },
  { id: "gl-siren", name: "Club Siren", category: "DJ / Hype", generator: "siren", shortcut: "2", color: "from-red-600 to-rose-800" },
  { id: "gl-riser", name: "Riser", category: "DJ / Hype", generator: "riser", shortcut: "3", color: "from-cyan-600 to-blue-800" },
  { id: "gl-scratch", name: "Scratch Hit", category: "DJ / Hype", generator: "scratch", shortcut: "4", color: "from-violet-600 to-indigo-800" },
  { id: "gl-buzzer", name: "Buzzer", category: "Comedy", generator: "buzzer", shortcut: "5", color: "from-amber-600 to-orange-800" },
  { id: "gl-impact", name: "Impact", category: "Action", generator: "impact", shortcut: "6", color: "from-slate-600 to-slate-900" },
  { id: "gl-party", name: "Party Horn", category: "Events", generator: "party", shortcut: "7", color: "from-emerald-600 to-teal-800" },
  { id: "gl-firework", name: "Firework", category: "Events", generator: "firework", shortcut: "8", color: "from-pink-600 to-purple-800" },
];

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("scopeKey", "scopeKey", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readUploadedSamples(scopeKey) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).index("scopeKey").getAll(scopeKey);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function saveUploadedSample(sample) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(sample);
    tx.oncomplete = () => { db.close(); resolve(sample); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function deleteUploadedSample(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

function createNoise(ctx, seconds = 1) {
  const frameCount = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i += 1) channel[i] = (Math.random() * 2) - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
}

function scheduleGain(gain, now, peak, attack, releaseAt, endAt) {
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
  gain.gain.setValueAtTime(Math.max(0.0002, peak), now + releaseAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + endAt);
}

function playGeneratedSample(ctx, kind, volume = 0.8) {
  const now = ctx.currentTime;
  const output = ctx.createGain();
  output.gain.value = Math.max(0, Math.min(1, volume));
  output.connect(ctx.destination);
  const nodes = [output];

  const oscillator = (type, startHz, endHz, seconds, level = 0.45, delay = 0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startHz, now + delay);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), now + delay + seconds);
    scheduleGain(gain, now + delay, level, 0.015, Math.max(0.03, seconds - 0.12), seconds);
    osc.connect(gain).connect(output);
    osc.start(now + delay);
    osc.stop(now + delay + seconds + 0.03);
    nodes.push(osc, gain);
  };

  const noise = (seconds, level = 0.35, filterHz = 3000, delay = 0) => {
    const source = createNoise(ctx, seconds);
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterHz, now + delay);
    scheduleGain(gain, now + delay, level, 0.005, Math.max(0.02, seconds - 0.16), seconds);
    source.connect(filter).connect(gain).connect(output);
    source.start(now + delay);
    source.stop(now + delay + seconds + 0.03);
    nodes.push(source, filter, gain);
  };

  if (kind === "airHorn") {
    [0, 0.035, 0.07].forEach((delay, index) => oscillator("sawtooth", 175 + (index * 44), 170 + (index * 44), 0.92, 0.22, delay));
  } else if (kind === "siren") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(520, now);
    for (let i = 0; i < 7; i += 1) {
      osc.frequency.linearRampToValueAtTime(i % 2 ? 520 : 880, now + (i + 1) * 0.18);
    }
    scheduleGain(gain, now, 0.36, 0.02, 1.12, 1.28);
    osc.connect(gain).connect(output);
    osc.start(now);
    osc.stop(now + 1.32);
    nodes.push(osc, gain);
  } else if (kind === "riser") {
    oscillator("sawtooth", 90, 1400, 1.4, 0.3);
    noise(1.4, 0.18, 5000);
  } else if (kind === "scratch") {
    oscillator("sawtooth", 1200, 95, 0.28, 0.35);
    noise(0.22, 0.18, 2200);
  } else if (kind === "buzzer") {
    oscillator("square", 165, 145, 0.55, 0.4);
    oscillator("square", 108, 98, 0.55, 0.22, 0.012);
  } else if (kind === "impact") {
    oscillator("sine", 105, 28, 0.8, 0.55);
    noise(0.48, 0.42, 900);
  } else if (kind === "party") {
    [0, 0.18, 0.36].forEach((delay, index) => oscillator("square", 380 + index * 110, 760 + index * 140, 0.22, 0.23, delay));
  } else if (kind === "firework") {
    oscillator("sine", 180, 1100, 0.58, 0.2);
    noise(0.72, 0.5, 4200, 0.58);
  }

  return {
    stop: () => {
      nodes.forEach((node) => {
        try { node.stop?.(); } catch { /* already stopped */ }
        try { node.disconnect?.(); } catch { /* disconnected */ }
      });
    },
  };
}

export default function DJSoundboard() {
  const { scope } = useDJSession();
  const scopeKey = useMemo(
    () => `${scope?.venueId || "no-venue"}:${scope?.operatorId || "anonymous"}:${scope?.deviceId || "default"}`,
    [scope?.venueId, scope?.operatorId, scope?.deviceId],
  );
  const [uploads, setUploads] = useState([]);
  const [category, setCategory] = useState("All");
  const [masterVolume, setMasterVolume] = useState(80);
  const [activePad, setActivePad] = useState("");
  const contextRef = useRef(null);
  const activeRef = useRef([]);
  const audioRef = useRef([]);
  const urlsRef = useRef(new Map());

  const ensureContext = useCallback(() => {
    if (!contextRef.current || contextRef.current.state === "closed") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      contextRef.current = new AudioContextClass();
    }
    if (contextRef.current.state === "suspended") contextRef.current.resume().catch(() => undefined);
    return contextRef.current;
  }, []);

  const reloadUploads = useCallback(async () => {
    try {
      const rows = await readUploadedSamples(scopeKey);
      setUploads(rows);
    } catch {
      toast.error("Soundboard storage could not be opened on this device.");
    }
  }, [scopeKey]);

  useEffect(() => { reloadUploads(); }, [reloadUploads]);

  useEffect(() => () => {
    urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    activeRef.current.forEach((handle) => handle.stop?.());
    audioRef.current.forEach((audio) => { audio.pause(); audio.src = ""; });
  }, []);

  const pads = useMemo(() => [...ORIGINAL_PADS, ...uploads.map((sample, index) => ({
    ...sample,
    uploaded: true,
    shortcut: sample.shortcut || String(((index + ORIGINAL_PADS.length) % 9) + 1),
    color: sample.color || "from-slate-600 to-slate-800",
  }))], [uploads]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(pads.map((pad) => pad.category))).sort()],
    [pads],
  );
  const visiblePads = category === "All" ? pads : pads.filter((pad) => pad.category === category);

  const stopAll = useCallback(() => {
    activeRef.current.forEach((handle) => handle.stop?.());
    activeRef.current = [];
    audioRef.current.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
    audioRef.current = [];
    setActivePad("");
  }, []);

  const triggerPad = useCallback((pad) => {
    if (!pad) return;
    setActivePad(pad.id);
    window.setTimeout(() => setActivePad((current) => current === pad.id ? "" : current), 420);
    const volume = masterVolume / 100;

    if (pad.generator) {
      const ctx = ensureContext();
      if (!ctx) return toast.error("Web Audio is not available in this browser.");
      const handle = playGeneratedSample(ctx, pad.generator, volume);
      activeRef.current.push(handle);
      return;
    }

    const record = uploads.find((sample) => sample.id === pad.id);
    if (!record?.blob) return toast.error("This uploaded sample is unavailable.");
    let url = urlsRef.current.get(record.id);
    if (!url) {
      url = URL.createObjectURL(record.blob);
      urlsRef.current.set(record.id, url);
    }
    const audio = new Audio(url);
    audio.volume = Math.max(0, Math.min(1, volume * Number(record.volume ?? 1)));
    audio.onended = () => { audioRef.current = audioRef.current.filter((item) => item !== audio); };
    audioRef.current.push(audio);
    audio.play().catch(() => toast.error("The browser blocked this sample. Tap the pad again."));
  }, [ensureContext, masterVolume, uploads]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || event.target?.isContentEditable) return;
      const pad = pads.find((item) => item.shortcut === event.key);
      if (pad) {
        event.preventDefault();
        triggerPad(pad);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pads, triggerPad]);

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("audio/"));
    if (!files.length) return;
    const categoryName = category === "All" ? "Uploaded Sounds" : category;
    try {
      for (const file of files) {
        const sample = {
          id: `upload-${scopeKey}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          scopeKey,
          name: file.name.replace(/\.[^.]+$/, "").slice(0, 42) || "Uploaded Sample",
          category: categoryName,
          blob: file,
          mimeType: file.type,
          volume: 1,
          createdAt: new Date().toISOString(),
        };
        await saveUploadedSample(sample);
      }
      await reloadUploads();
      toast.success(`${files.length} sound${files.length > 1 ? "s" : ""} added to this booth.`);
    } catch {
      toast.error("The upload could not be saved on this device.");
    } finally {
      event.target.value = "";
    }
  };

  const removeSample = async (sample) => {
    if (!sample.uploaded) return;
    try {
      const url = urlsRef.current.get(sample.id);
      if (url) URL.revokeObjectURL(url);
      urlsRef.current.delete(sample.id);
      await deleteUploadedSample(sample.id);
      setUploads((current) => current.filter((item) => item.id !== sample.id));
      toast.success("Uploaded sound removed.");
    } catch {
      toast.error("The uploaded sound could not be removed.");
    }
  };

  return (
    <section className="space-y-4" aria-label="DJ soundboard">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-fuchsia-300" />
          <div>
            <h3 className="text-sm font-black text-white">DJ Soundboard</h3>
            <p className="text-[10px] text-slate-500">Original procedural pads + booth uploads</p>
          </div>
        </div>
        <label className="ml-auto inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/15">
          <Upload className="h-4 w-4" />
          Upload sounds
          <input type="file" accept="audio/*" multiple className="sr-only" onChange={handleUpload} />
        </label>
        <button type="button" onClick={stopAll} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-xs font-bold text-red-200 hover:bg-red-500/10">
          <CircleStop className="h-4 w-4" />
          Stop all
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`min-h-9 rounded-lg border px-3 text-[11px] font-bold transition ${
              category === item
                ? "border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200"
                : "border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {item}
          </button>
        ))}
        <label className="ml-auto flex min-h-9 items-center gap-2 text-[10px] font-bold text-slate-400">
          <Volume2 className="h-4 w-4" />
          Master
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(event) => setMasterVolume(Number(event.target.value))}
            className="w-24 accent-fuchsia-500"
          />
          <span className="w-8 text-right text-slate-200">{masterVolume}%</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {visiblePads.map((pad) => (
          <article
            key={pad.id}
            className={`group relative overflow-hidden rounded-xl border transition ${
              activePad === pad.id
                ? "scale-[0.98] border-white/70 shadow-[0_0_24px_rgba(217,70,239,0.35)]"
                : "border-white/10 hover:border-white/30"
            }`}
          >
            <button
              type="button"
              onClick={() => triggerPad(pad)}
              className={`flex min-h-24 w-full flex-col justify-between bg-gradient-to-br ${pad.color} p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`}
              title={`Trigger ${pad.name}`}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <Waves className="h-4 w-4 text-white/80" />
                {pad.shortcut && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/30 px-1.5 py-0.5 text-[9px] font-black text-white/80">
                    <Keyboard className="h-3 w-3" /> {pad.shortcut}
                  </span>
                )}
              </div>
              <div>
                <span className="block text-sm font-black text-white">{pad.name}</span>
                <span className="block text-[10px] text-white/65">{pad.category}</span>
              </div>
            </button>
            {pad.uploaded && (
              <button
                type="button"
                onClick={() => removeSample(pad)}
                className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-black/45 text-white/65 opacity-100 transition hover:bg-red-600 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Delete ${pad.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </article>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-[11px] leading-5 text-slate-400">
        <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
        Starter pads are generated in the browser from original synthesized tones and noise. No Nintendo,
        Mario, movie, television or other third-party copyrighted clips are bundled. Authorized operators
        may upload sounds they have the right to use.
      </div>
    </section>
  );
}
