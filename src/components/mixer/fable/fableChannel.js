/**
 * Fable Engine X cross-window bus.
 * The control panel (desktop screen) publishes settings, track info and live
 * beat frames; the popped-out stage window (HDMI screen) consumes them.
 */
const CHANNEL = "nups_fable_x";

export function openFableChannel() {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  return new BroadcastChannel(CHANNEL);
}

export function publishFable(channel, message) {
  try { channel?.postMessage(message); } catch { /* window closed */ }
}