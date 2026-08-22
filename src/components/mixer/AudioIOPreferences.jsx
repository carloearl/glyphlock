import React, { useCallback, useEffect, useState } from "react";
import { AudioLines, X } from "lucide-react";
import {
  applyPreferredOutput,
  getAudioInputId,
  getAudioOutputId,
  saveAudioInputId,
  saveAudioOutputId,
} from "@/components/mixer/audioDevicePreferences";

async function enumerate() {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  return navigator.mediaDevices.enumerateDevices();
}

export default function AudioIOPreferences() {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [input, setInput] = useState(getAudioInputId);
  const [output, setOutput] = useState(getAudioOutputId);
  const [status, setStatus] = useState("Select Test Input before microphone permission is requested.");
  const [testing, setTesting] = useState(false);

  const refreshDevices = useCallback(async () => {
    const available = await enumerate().catch(() => []);
    setDevices(available);
    const inputMissing = input !== "default" && !available.some((device) => device.kind === "audioinput" && device.deviceId === input);
    const outputMissing = output !== "default" && !available.some((device) => device.kind === "audiooutput" && device.deviceId === output);
    if (inputMissing) {
      setInput("default");
      saveAudioInputId("default");
      setStatus("Selected input disconnected. Fallback: system default.");
    }
    if (outputMissing) {
      setOutput("default");
      saveAudioOutputId("default");
      setStatus("Selected output disconnected. Fallback: system default.");
    }
  }, [input, output]);

  useEffect(() => {
    if (!open) return undefined;
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
  }, [open, refreshDevices]);

  const testInput = async () => {
    setTesting(true);
    try {
      const selected = input !== "default" ? { deviceId: { exact: input } } : {};
      const stream = await navigator.mediaDevices.getUserMedia({ audio: selected });
      const label = stream.getAudioTracks()[0]?.label || "selected microphone";
      stream.getTracks().forEach((track) => track.stop());
      await refreshDevices();
      setStatus(`Input ready: ${label}`);
    } catch (error) {
      setStatus(error?.name === "NotAllowedError" ? "Microphone permission denied." : "Selected microphone is unavailable.");
    } finally {
      setTesting(false);
    }
  };

  const testOutput = async () => {
    setTesting(true);
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const context = new AC();
      const destination = context.createMediaStreamDestination();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(destination);
      const audio = new Audio();
      audio.srcObject = destination.stream;
      const routed = await applyPreferredOutput(audio, output);
      await audio.play();
      oscillator.start();
      oscillator.stop(context.currentTime + 0.35);
      window.setTimeout(() => {
        audio.pause();
        audio.srcObject = null;
        context.close().catch(() => undefined);
      }, 500);
      setStatus(routed
        ? "Output test sent to the selected direct-audio device."
        : "This browser cannot select an output device; use the operating-system mixer.");
    } catch {
      setStatus("Output test failed. Check browser and operating-system audio permissions.");
    } finally {
      setTesting(false);
    }
  };

  const inputs = devices.filter((device) => device.kind === "audioinput");
  const outputs = devices.filter((device) => device.kind === "audiooutput" && device.deviceId !== "default");
  const sinkSupported = typeof HTMLMediaElement !== "undefined" && Boolean(HTMLMediaElement.prototype.setSinkId);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-11 items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-950/40 px-4 text-sm font-semibold text-cyan-200" aria-expanded={open} aria-label="DJ audio input and output preferences">
        <AudioLines className="h-4 w-4" /> Audio I/O
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-[130] w-[min(380px,calc(100vw-24px))] rounded-2xl border border-cyan-500/30 bg-slate-950 p-4 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-white">DJ Audio Preferences</h2>
            <button type="button" onClick={() => setOpen(false)} className="h-11 w-11 rounded-lg text-slate-400" aria-label="Close audio preferences"><X className="mx-auto h-4 w-4" /></button>
          </div>

          <label className="block text-xs font-semibold text-slate-300">
            Visualizer microphone
            <select value={input} onChange={(event) => { setInput(event.target.value); saveAudioInputId(event.target.value); setStatus("Input saved. Use Test Input to authorize and verify it."); }} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white">
              <option value="default">System default input</option>
              {inputs.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Input ${index + 1}`}</option>)}
            </select>
          </label>
          <button type="button" disabled={testing} onClick={testInput} className="mt-2 min-h-11 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-200 disabled:opacity-50">
            Test Input / Allow Microphone
          </button>

          <label className="mt-4 block text-xs font-semibold text-slate-300">
            Direct/uploaded deck output
            <select value={output} disabled={!sinkSupported} onChange={(event) => { setOutput(event.target.value); saveAudioOutputId(event.target.value); setStatus("Output saved for direct and uploaded audio."); }} className="mt-2 h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white disabled:opacity-50">
              <option value="default">System default output</option>
              {outputs.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Output ${index + 1}`}</option>)}
            </select>
          </label>
          <button type="button" disabled={testing || !sinkSupported} onClick={testOutput} className="mt-2 min-h-11 w-full rounded-lg border border-violet-500/40 bg-violet-500/10 text-xs font-bold text-violet-200 disabled:opacity-50">
            Test Direct-Audio Output
          </button>

          <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            YouTube iframe audio follows the browser or operating-system output. The deck selector above controls direct and uploaded audio only.
          </p>
          <p className="mt-2 text-xs text-slate-400" role="status">{status}</p>
        </div>
      )}
    </div>
  );
}
