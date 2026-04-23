/**
 * ClubBroadcastChannel — Mirrors the DJ mixer state to external TV windows
 * via BroadcastChannel (same-origin tabs/windows).
 *
 * Sender: the DJ mixer publishes { deckA, deckB, crossfade, ts }
 * Receiver: the ClubTV page subscribes and renders the active deck as a
 *           fullscreen video. Cast/duplicate via browser "Cast to device".
 */

const CHANNEL_NAME = "nups-clubtv-v1";

function makeChannel() {
  if (typeof window === "undefined") return null;
  if (typeof window.BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

// Shared singleton per tab
let sharedSender = null;

export function getClubTVSender() {
  if (!sharedSender) sharedSender = makeChannel();
  return {
    publish(state) {
      try {
        sharedSender?.postMessage({ ...state, ts: Date.now() });
      } catch (_) { /* noop */ }
    },
    close() {
      try { sharedSender?.close(); } catch (_) { /* noop */ }
      sharedSender = null;
    },
  };
}

export function subscribeClubTV(handler) {
  const ch = makeChannel();
  if (!ch) return () => {};
  const listener = (ev) => handler(ev.data);
  ch.addEventListener("message", listener);
  return () => {
    ch.removeEventListener("message", listener);
    try { ch.close(); } catch (_) { /* noop */ }
  };
}

export function openClubTVWindow() {
  if (typeof window === "undefined") return null;
  const w = window.open(
    "/ClubTV",
    "nups-club-tv",
    "width=1280,height=720,menubar=no,toolbar=no,location=no"
  );
  return w;
}