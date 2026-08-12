import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, ChevronUp, ClipboardCopy, Loader2, RefreshCw, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { buildYouTubeMusicSearchUrl } from "@/lib/youtubeMusic";
import { computeCrowdEnergyScore, generatePlaylist } from "@/lib/playlistEngine";

const nowMs = () => (typeof performance !== "undefined" && performance.now ? performance.now() : Date.now());

function errorMessage(error) {
  const responseData = error?.response?.data;
  const responseMessage = typeof responseData === "string"
    ? responseData
    : responseData?.message || responseData?.error || responseData?.detail;
  const raw = responseMessage || error?.message || String(error || "Unknown error");
  return raw.replace(/\s+/g, " ").trim().slice(0, 180);
}

async function checkTrackLibrary() {
  const rows = await base44.entities.Track.list("-created_date", 500);
  return `${rows.length} live track record${rows.length === 1 ? "" : "s"}`;
}

async function checkYouTube() {
  const response = await fetch(buildYouTubeMusicSearchUrl("test", { maxResults: 1 }));
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} · ${body.slice(0, 120)}`);
  }
  const data = await response.json();
  if (data?.error) throw new Error(`HTTP ${response.status} · ${data.error.message || "YouTube API error"}`);
  const title = data?.items?.[0]?.snippet?.title || "no result title";
  return `HTTP ${response.status} · ${title}`;
}

async function checkJukeboxQueue() {
  const rows = await base44.entities.JukeboxRequest.filter({ status: "pending" }, "-created_date", 500);
  return `${rows.length} pending request${rows.length === 1 ? "" : "s"}`;
}

async function checkPersonas() {
  const rows = await base44.entities.AIDJPersona.list("-created_date", 500);
  return `${rows.length} AI persona${rows.length === 1 ? "" : "s"}`;
}

async function checkPlaylistPermission() {
  let created = null;
  try {
    created = await base44.entities.Playlist.create({
      name: `NUPS diagnostic probe ${new Date().toISOString()}`,
      entertainer_id: "diagnostic-probe",
      ordered_tracks: [],
      crowd_energy_score: 0,
      generation_timestamp: new Date().toISOString(),
      status: "archived",
    });
    if (!created?.id) throw new Error("Playlist.create succeeded but returned no record id");
    await base44.entities.Playlist.delete(created.id);
    created = null;
    return "create + immediate delete permitted";
  } catch (error) {
    if (created?.id) {
      try {
        await base44.entities.Playlist.delete(created.id);
        created = null;
      } catch (cleanupError) {
        throw new Error(`${errorMessage(error)} · cleanup failed: ${errorMessage(cleanupError)}`);
      }
    }
    throw error;
  }
}

async function checkPlaylistEngine() {
  const generated = generatePlaylist({ tracks: [], persona: null, crowd: {}, limit: 20 });
  if (!Array.isArray(generated)) throw new Error("generatePlaylist did not return an array");
  if (generated.length !== 0) throw new Error(`Expected 0 tracks, received ${generated.length}`);
  return "empty-track smoke test returned []";
}

async function checkCrowdScore() {
  const score = computeCrowdEnergyScore({ tips: 0, votes: 0, playthrough: 0, manual: null });
  if (score !== 0) throw new Error(`Expected 0/10, received ${score}/10`);
  return "0/10 with zero inputs (expected)";
}

const CHECKS = [
  { id: "tracks", label: "Track Library", run: checkTrackLibrary },
  { id: "youtube", label: "YouTube API", run: checkYouTube },
  { id: "jukebox", label: "Jukebox Queue", run: checkJukeboxQueue },
  { id: "personas", label: "AI Personas", run: checkPersonas },
  { id: "playlist-permission", label: "Playlist Save", run: checkPlaylistPermission },
  { id: "playlist-engine", label: "Playlist Engine", run: checkPlaylistEngine },
  { id: "crowd-score", label: "Crowd Pulse", run: checkCrowdScore },
];

const makeRows = (status = "running") => CHECKS.map((check) => ({
  id: check.id,
  label: check.label,
  status,
  latency: null,
  detail: status === "running" ? "checking…" : "not run",
}));

function StatusBadge({ status }) {
  if (status === "pass") {
    return <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-black tracking-wide text-emerald-300"><CheckCircle2 className="h-3 w-3" /> PASS</span>;
  }
  if (status === "fail") {
    return <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-[10px] font-black tracking-wide text-rose-300"><XCircle className="h-3 w-3" /> FAIL</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-black tracking-wide text-amber-300"><Loader2 className="h-3 w-3 animate-spin" /> RUNNING</span>;
}

export default function DJDiagnosticsPanel({ open, onOpenChange, runId = 0 }) {
  const [rows, setRows] = useState(() => makeRows("running"));
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    setCopied(false);
    setRows(makeRows("running"));

    const tasks = CHECKS.map(async (check) => {
      const started = nowMs();
      try {
        const detail = await check.run();
        const result = {
          id: check.id,
          label: check.label,
          status: "pass",
          latency: Math.max(0, Math.round(nowMs() - started)),
          detail,
        };
        setRows((current) => current.map((row) => row.id === check.id ? result : row));
        return result;
      } catch (error) {
        const result = {
          id: check.id,
          label: check.label,
          status: "fail",
          latency: Math.max(0, Math.round(nowMs() - started)),
          detail: errorMessage(error),
        };
        setRows((current) => current.map((row) => row.id === check.id ? result : row));
        return result;
      }
    });

    const settled = await Promise.allSettled(tasks);
    const finalRows = settled.map((result, index) => {
      if (result.status === "fulfilled") return result.value;
      return {
        id: CHECKS[index].id,
        label: CHECKS[index].label,
        status: "fail",
        latency: null,
        detail: errorMessage(result.reason),
      };
    });
    setRows(finalRows);
    setLastRun(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    if (open && runId > 0) runDiagnostics();
  }, [open, runId, runDiagnostics]);

  const summary = useMemo(() => {
    const pass = rows.filter((row) => row.status === "pass").length;
    const fail = rows.filter((row) => row.status === "fail").length;
    return { pass, fail };
  }, [rows]);

  const copyLog = useCallback(async () => {
    const stamp = lastRun ? lastRun.toISOString() : new Date().toISOString();
    const text = [
      `NUPS DJ Booth Diagnostics · ${stamp}`,
      `Summary: ${summary.pass} PASS · ${summary.fail} FAIL · ${rows.length} checks`,
      ...rows.map((row) => `${row.label} | ${row.status.toUpperCase()} | ${row.latency ?? "—"} ms | ${row.detail}`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }, [lastRun, rows, summary.fail, summary.pass]);

  if (!open) return null;

  return (
    <section className="border-b border-violet-900/40 bg-slate-950/95 px-4 py-3">
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-900/90 shadow-[0_0_35px_rgba(124,58,237,0.10)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-700/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Activity className="h-4 w-4 text-violet-300" />
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">DJ System Diagnostics</div>
              <div className="text-[10px] text-slate-500">Live module health · parallel checks · operator-safe probe</div>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!running && lastRun && (
              <span className="hidden text-[10px] text-slate-500 md:inline">{summary.pass} pass · {summary.fail} fail · {lastRun.toLocaleTimeString()}</span>
            )}
            <button
              type="button"
              onClick={runDiagnostics}
              disabled={running}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 text-[11px] font-bold text-violet-200 hover:bg-violet-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${running ? "animate-spin" : ""}`} /> Re-run
            </button>
            <button
              type="button"
              onClick={copyLog}
              disabled={running}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 text-[11px] font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
            >
              <ClipboardCopy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy Log"}
            </button>
            <button
              type="button"
              onClick={() => onOpenChange?.(false)}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <ChevronUp className="h-3.5 w-3.5" /> Collapse
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-1 gap-2 px-4 py-2.5 sm:grid-cols-[minmax(140px,1.1fr)_100px_90px_minmax(220px,2fr)] sm:items-center sm:gap-3">
              <div className="truncate text-xs font-semibold text-slate-100">{row.label}</div>
              <StatusBadge status={row.status} />
              <div className="font-mono text-[11px] text-cyan-300">{row.latency === null ? "— ms" : `${row.latency} ms`}</div>
              <div className={`truncate font-mono text-[11px] ${row.status === "fail" ? "text-rose-300" : "text-slate-400"}`} title={row.detail}>
                {row.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
