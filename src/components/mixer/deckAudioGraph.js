/**
 * One Web Audio graph per HTMLMediaElement.
 *
 * AudioVisualizer, Fable and deck FX all subscribe to this registry so the
 * browser never receives a second createMediaElementSource() call for a deck.
 */
let sharedContext = null;
const graphs = new WeakMap();

function getContext() {
  if (typeof window === "undefined") return null;
  if (sharedContext && sharedContext.state !== "closed") return sharedContext;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  sharedContext = new AC();
  const resumeOnGesture = () => {
    if (sharedContext?.state === "suspended") sharedContext.resume().catch(() => undefined);
    if (sharedContext?.state === "running") {
      window.removeEventListener("pointerdown", resumeOnGesture);
      window.removeEventListener("keydown", resumeOnGesture);
    }
  };
  window.addEventListener("pointerdown", resumeOnGesture);
  window.addEventListener("keydown", resumeOnGesture);
  return sharedContext;
}

export function resumeDeckAudioContext() {
  const context = getContext();
  if (context?.state === "suspended") context.resume().catch(() => undefined);
  return context;
}

export function getDeckAudioGraph(audioEl) {
  if (!audioEl) return null;
  const existing = graphs.get(audioEl);
  if (existing) return existing;

  const context = resumeDeckAudioContext();
  if (!context) return null;

  try {
    const source = context.createMediaElementSource(audioEl);
    const low = context.createBiquadFilter();
    low.type = "lowshelf";
    low.frequency.value = 180;
    const mid = context.createBiquadFilter();
    mid.type = "peaking";
    mid.frequency.value = 1200;
    mid.Q.value = 0.8;
    const high = context.createBiquadFilter();
    high.type = "highshelf";
    high.frequency.value = 6500;
    const sweep = context.createBiquadFilter();
    sweep.type = "lowpass";
    sweep.frequency.value = 20000;
    sweep.Q.value = 0.7;
    const dry = context.createGain();
    dry.gain.value = 1;
    const delay = context.createDelay(1.5);
    delay.delayTime.value = 0.28;
    const feedback = context.createGain();
    feedback.gain.value = 0;
    const wet = context.createGain();
    wet.gain.value = 0;
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;

    source.connect(low);
    low.connect(mid);
    mid.connect(high);
    high.connect(sweep);
    sweep.connect(dry);
    dry.connect(analyser);
    sweep.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(analyser);
    analyser.connect(context.destination);

    const entry = {
      context,
      source,
      analyser,
      low,
      mid,
      high,
      sweep,
      dry,
      delay,
      feedback,
      wet,
    };
    graphs.set(audioEl, entry);
    return entry;
  } catch {
    return null;
  }
}

export function setDeckAudioFx(audioEl, fx = {}) {
  const entry = getDeckAudioGraph(audioEl);
  if (!entry) return false;
  resumeDeckAudioContext();
  const now = entry.context.currentTime;
  const ramp = (param, value) => {
    try {
      param.cancelScheduledValues(now);
      param.setTargetAtTime(value, now, 0.025);
    } catch {
      param.value = value;
    }
  };

  ramp(entry.low.gain, Number(fx.low ?? 0));
  ramp(entry.mid.gain, Number(fx.mid ?? 0));
  ramp(entry.high.gain, Number(fx.high ?? 0));
  const filterPct = Math.max(0, Math.min(100, Number(fx.filter ?? 100)));
  ramp(entry.sweep.frequency, 180 * Math.pow(20000 / 180, filterPct / 100));
  const echo = Math.max(0, Math.min(100, Number(fx.echo ?? 0))) / 100;
  ramp(entry.wet.gain, echo * 0.7);
  ramp(entry.feedback.gain, echo * 0.62);
  ramp(entry.delay.delayTime, Math.max(0.08, Math.min(0.72, Number(fx.delay ?? 0.28))));
  return true;
}

export function getDeckAudioGraphDiagnostics(audioEl) {
  const entry = audioEl ? graphs.get(audioEl) : null;
  return {
    connected: Boolean(entry),
    contextState: entry?.context?.state || "unavailable",
    analyserFftSize: entry?.analyser?.fftSize || null,
  };
}
