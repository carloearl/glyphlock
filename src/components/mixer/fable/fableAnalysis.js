/**
 * fableAnalysis — shared spectrum + beat-grid math for Fable Engine X.
 *
 * Used by both the deck tap (preferred, Serato/VirtualDJ style: the visuals ride
 * the exact audio the deck is playing) and the room-mic fallback. Pure analysis:
 * nothing here connects to an output, so it never changes what the room hears.
 */

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/**
 * Wraps an AnalyserNode and returns a reader producing one frame per call,
 * including a detected BPM and a rolling 4/4 count locked to the audio onsets.
 */
export function createFrameReader(analyser, { onBpm } = {}) {
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.7;

  const freq = new Uint8Array(analyser.frequencyBinCount);
  const wave = new Uint8Array(analyser.frequencyBinCount);
  const history = [];
  const intervals = [];
  let lastBeatAt = 0;
  let beatCount = 0;
  let lastBpm = null;

  const avg = (from, to) => {
    let sum = 0;
    for (let i = from; i < to; i++) sum += freq[i];
    return sum / Math.max(1, to - from) / 255;
  };

  return function read() {
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(wave);

    const bass = avg(1, 10);
    const mid = avg(10, 60);
    const high = avg(60, 180);
    const energy = bass * 0.55 + mid * 0.3 + high * 0.15;

    history.push(bass);
    if (history.length > 60) history.shift();
    const localAvg = history.reduce((a, b) => a + b, 0) / history.length;

    const now = performance.now();
    let beat = false;
    if (bass > 0.06 && bass > localAvg * 1.32 && now - lastBeatAt > 240) {
      if (lastBeatAt) {
        const gap = now - lastBeatAt;
        if (gap < 1400) {
          intervals.push(gap);
          if (intervals.length > 16) intervals.shift();
        }
      }
      lastBeatAt = now;
      beat = true;
      beatCount += 1;

      if (intervals.length >= 4) {
        let detected = 60000 / median(intervals);
        while (detected < 70) detected *= 2;
        while (detected > 180) detected /= 2;
        const rounded = Math.round(detected);
        if (!lastBpm || Math.abs(lastBpm - rounded) >= 2) {
          lastBpm = rounded;
          onBpm?.(rounded);
        }
      }
    }

    const shape = new Array(64);
    const step = Math.floor(wave.length / 64);
    for (let i = 0; i < 64; i++) shape[i] = (wave[i * step] - 128) / 128;

    return {
      bass, mid, high, energy, beat, beatCount,
      beatInBar: (beatCount % 4) + 1,
      barCount: Math.floor(beatCount / 4),
      bands: Array.from(freq.slice(0, 128), (v) => v / 255),
      shape,
    };
  };
}