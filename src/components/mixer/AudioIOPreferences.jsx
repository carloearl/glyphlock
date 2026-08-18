import React, { useEffect, useState } from "react";
import { AudioLines, X } from "lucide-react";
import { getAudioInputId, getAudioOutputId, saveAudioInputId, saveAudioOutputId } from "@/components/mixer/audioDevicePreferences";

export default function AudioIOPreferences() {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [input, setInput] = useState(getAudioInputId);
  const [output, setOutput] = useState(getAudioOutputId);

  useEffect(() => {
    if (!open || !navigator.mediaDevices?.enumerateDevices) return;
    let stream;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((next) => {
      stream = next;
      return navigator.mediaDevices.enumerateDevices();
    }).then(setDevices).catch(() => navigator.mediaDevices.enumerateDevices().then(setDevices));
    return () => stream?.getTracks().forEach((track) => track.stop());
  }, [open]);

  const inputs = devices.filter((device) => device.kind === "audioinput");
  const outputs = devices.filter((device) => device.kind === "audiooutput");

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-11 items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-4 text-sm font-semibold text-cyan-200" aria-expanded={open}>
        <AudioLines className="h-4 w-4" /> Audio I/O
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[130] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold text-white">DJ Audio Preferences</h2><button type="button" onClick={() => setOpen(false)} className="h-11 w-11 rounded-lg text-slate-400" aria-label="Close audio preferences"><X className="mx-auto h-4 w-4" /></button></div>
          <label className="block text-xs font-semibold text-slate-300">Audio input<select value={input} onChange={(event) => { setInput(event.target.value); saveAudioInputId(event.target.value); }} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"><option value="default">System default input</option>{inputs.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Input ${index + 1}`}</option>)}</select></label>
          <label className="mt-4 block text-xs font-semibold text-slate-300">Deck output<select value={output} onChange={(event) => { setOutput(event.target.value); saveAudioOutputId(event.target.value); }} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white"><option value="default">System default output</option>{outputs.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Output ${index + 1}`}</option>)}</select></label>
          {!HTMLMediaElement.prototype.setSinkId && <p className="mt-3 text-xs text-amber-300">This browser uses the system output setting.</p>}
        </div>
      )}
    </div>
  );
}