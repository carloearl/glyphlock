export const YOUTUBE_STATES = Object.freeze({
  [-1]: "UNSTARTED",
  0: "ENDED",
  1: "PLAYING",
  2: "PAUSED",
  3: "BUFFERING",
  5: "CUED",
});

const ERRORS = {
  2: { message: "Invalid YouTube video id or request.", retryable: false },
  5: { message: "YouTube HTML5 player could not start this media.", retryable: true },
  100: { message: "YouTube video is unavailable or private.", retryable: false },
  101: { message: "The content owner does not allow embedded playback.", retryable: false },
  150: { message: "The content owner does not allow embedded playback.", retryable: false },
  153: { message: "YouTube rejected playback because client identity or Referer information is missing.", retryable: false },
};

export function classifyYouTubeError(code) {
  return { code: Number(code), source: "youtube", ...(ERRORS[Number(code)] || { message: `YouTube playback error ${code}`, retryable: false }) };
}

export function createYouTubeCommandGate({ volumeCadenceMs = 100, volumeDelta = 1 } = {}) {
  let lastVolume = null;
  let lastVolumeAt = -Infinity;
  let lastMuted = Symbol("unset");
  return {
    shouldApplyVolume(next, now = performance.now()) {
      const value = Math.max(0, Math.min(100, Math.round(Number(next) || 0)));
      if (lastVolume !== null && Math.abs(value - lastVolume) < volumeDelta) return false;
      if (now - lastVolumeAt < volumeCadenceMs) return false;
      lastVolume = value;
      lastVolumeAt = now;
      return true;
    },
    shouldApplyMute(next) {
      const value = Boolean(next);
      if (lastMuted === value) return false;
      lastMuted = value;
      return true;
    },
    reset() {
      lastVolume = null;
      lastVolumeAt = -Infinity;
      lastMuted = Symbol("unset");
    },
  };
}

export function createYouTubeWatchdogState() {
  return { lastPosition: null, lastProgressAt: null, retryCount: 0, action: "none" };
}

export function advanceYouTubeWatchdog(previous, { now, position, state, stallMs = 8000 }) {
  const next = { ...previous, action: state === "BUFFERING" ? "buffering" : "none" };
  if (state !== "PLAYING") return next;
  if (previous.lastPosition === null || Math.abs(Number(position) - Number(previous.lastPosition)) >= 0.25) {
    return { ...next, lastPosition: Number(position), lastProgressAt: Number(now) };
  }
  const stalledFor = Number(now) - Number(previous.lastProgressAt ?? now);
  if (stalledFor < stallMs) return next;
  if (previous.retryCount < 1) {
    return { ...next, retryCount: 1, action: "retry", lastProgressAt: Number(now) };
  }
  return { ...next, action: "operator", lastProgressAt: Number(now) };
}
