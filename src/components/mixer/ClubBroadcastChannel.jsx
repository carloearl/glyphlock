/**
 * Same-origin booth → Club TV state bus with snapshot handshake and liveness.
 * Club TV is a visual subscriber only; it never owns audible booth playback.
 */
const CHANNEL_NAME = "nups-clubtv-v2";
const HEARTBEAT_MS = 1000;

function makeChannel() {
  if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") return null;
  return new BroadcastChannel(CHANNEL_NAME);
}

let sharedSender = null;
let latestState = null;
let heartbeatTimer = null;

function ensureSender() {
  if (sharedSender) return sharedSender;
  sharedSender = makeChannel();
  if (!sharedSender) return null;
  sharedSender.addEventListener("message", (event) => {
    if (event.data?.type !== "receiver-ready" || !latestState) return;
    sharedSender.postMessage({ type: "state", payload: latestState, ts: Date.now() });
  });
  heartbeatTimer = window.setInterval(() => {
    if (!latestState) return;
    try {
      sharedSender?.postMessage({
        type: "heartbeat",
        sessionId: latestState.sessionId || null,
        activeDeck: latestState.activeDeck || null,
        hasTrack: Boolean(latestState.deckA || latestState.deckB),
        ts: Date.now(),
      });
    } catch { /* best-effort visual telemetry */ }
  }, HEARTBEAT_MS);
  return sharedSender;
}

export function getClubTVSender() {
  return {
    publish(state) {
      latestState = { ...state, ts: Date.now() };
      try {
        ensureSender()?.postMessage({ type: "state", payload: latestState, ts: latestState.ts });
      } catch { /* best-effort visual telemetry */ }
    },
    snapshot() {
      return latestState;
    },
    close() {
      if (heartbeatTimer) window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
      try { sharedSender?.close(); } catch { /* noop */ }
      sharedSender = null;
      latestState = null;
    },
  };
}

export function subscribeClubTV(handler) {
  const channel = makeChannel();
  if (!channel) {
    handler(null, { type: "unsupported", ts: Date.now() });
    return () => {};
  }
  const listener = (event) => {
    const message = event.data || {};
    if (message.type === "state") {
      handler(message.payload || null, { type: "state", ts: message.ts || Date.now() });
      return;
    }
    if (message.type === "heartbeat") {
      handler(null, { ...message, type: "heartbeat", ts: message.ts || Date.now() });
      return;
    }
    // Compatibility with the v1 direct-state message during a rolling update.
    if (message.deckA !== undefined || message.deckB !== undefined) {
      handler(message, { type: "state", ts: message.ts || Date.now() });
    }
  };
  channel.addEventListener("message", listener);
  channel.postMessage({ type: "receiver-ready", ts: Date.now() });
  return () => {
    channel.removeEventListener("message", listener);
    try { channel.close(); } catch { /* noop */ }
  };
}

export function openClubTVWindow() {
  if (typeof window === "undefined") return null;
  return window.open(
    "/ClubTV",
    "nups-club-tv",
    "width=1280,height=720,menubar=no,toolbar=no,location=no"
  );
}
