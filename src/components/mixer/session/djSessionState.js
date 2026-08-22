const MAX_DIAGNOSTICS = 200;
const MAX_ACKS = 100;

function createSessionId() {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `dj-${Date.now()}-${random}`;
}

function boundedDiagnostics(items, event) {
  return [...items, { at: Date.now(), ...event }].slice(-MAX_DIAGNOSTICS);
}

export function createInitialDJSessionState(seed = {}) {
  return {
    sessionId: seed.sessionId || createSessionId(),
    view: "mixer",
    deckA: { songId: null, health: "idle", providerState: "UNSTARTED" },
    deckB: { songId: null, health: "idle", providerState: "UNSTARTED" },
    activeDeck: "A",
    crossfade: 0,
    deckAMuted: false,
    deckBMuted: false,
    deckABaseVolume: 1,
    deckBBaseVolume: 1,
    masterVolume: 1,
    masterMuted: false,
    autoDjArmed: false,
    queue: seed.queue || [],
    pendingCommand: null,
    commandAcks: [],
    diagnostics: [],
    transitionCount: 0,
    ...seed,
  };
}

export function createDeckCommand({ requestId, targetDeck, song, entityTrackId = null }) {
  if (!requestId) throw new Error("A deck command requires requestId");
  if (!["A", "B"].includes(targetDeck)) throw new Error("targetDeck must be A or B");
  if (!song?.id) throw new Error("A deck command requires a normalized song id");
  return {
    type: "LOAD_DECK",
    requestId: String(requestId),
    targetDeck,
    song,
    entityTrackId: entityTrackId || song._entityTrackId || null,
    source: song.source || (song.youtubeUrl ? "youtube" : "direct"),
    createdAt: Date.now(),
  };
}

function acknowledge(state, ack) {
  if (state.commandAcks.some((item) => item.requestId === ack.requestId)) return state;
  return {
    ...state,
    pendingCommand: state.pendingCommand?.requestId === ack.requestId ? null : state.pendingCommand,
    commandAcks: [...state.commandAcks, { at: Date.now(), ...ack }].slice(-MAX_ACKS),
    diagnostics: boundedDiagnostics(state.diagnostics, {
      event: ack.status === "error" ? "deck_command_error" : "deck_command_ack",
      requestId: ack.requestId,
      deck: ack.deck,
      songId: ack.songId || null,
      message: ack.message || null,
    }),
  };
}

export function djSessionReducer(state, action) {
  switch (action.type) {
    case "VIEW_CHANGED":
      return { ...state, view: action.view };
    case "DECK_COMMAND_REQUESTED":
      if (state.commandAcks.some((ack) => ack.requestId === action.command.requestId)) return state;
      return {
        ...state,
        pendingCommand: action.command,
        diagnostics: boundedDiagnostics(state.diagnostics, {
          event: "deck_command_requested",
          requestId: action.command.requestId,
          deck: action.command.targetDeck,
          source: action.command.source,
        }),
      };
    case "DECK_LOADED": {
      const deckKey = action.deck === "B" ? "deckB" : "deckA";
      return acknowledge({
        ...state,
        [deckKey]: { ...state[deckKey], songId: action.songId, song: action.song || state[deckKey].song || null, health: "ready" },
      }, {
        requestId: action.requestId,
        deck: action.deck,
        songId: action.songId,
        status: "ack",
      });
    }
    case "DECK_COMMAND_ERROR":
      return acknowledge(state, {
        requestId: action.requestId,
        deck: action.deck,
        status: "error",
        message: action.message || "Unable to load track",
      });
    case "DECK_LOADED_DIRECT": {
      const deckKey = action.deck === "B" ? "deckB" : "deckA";
      return {
        ...state,
        [deckKey]: { ...state[deckKey], songId: action.songId, song: action.song || null, health: action.songId ? "ready" : "idle" },
      };
    }
    case "DECK_PROVIDER_STATE": {
      const deckKey = action.deck === "B" ? "deckB" : "deckA";
      return {
        ...state,
        [deckKey]: {
          ...state[deckKey],
          providerState: action.providerState,
          health: action.health || state[deckKey].health,
          position: action.position,
          duration: action.duration,
        },
        diagnostics: boundedDiagnostics(state.diagnostics, {
          event: "provider_state",
          deck: action.deck,
          source: action.source,
          sourceId: action.sourceId,
          providerState: action.providerState,
          position: action.position,
          duration: action.duration,
          effectiveVolume: action.effectiveVolume,
          muted: action.muted,
          muteReason: action.muteReason,
          crossfade: state.crossfade,
          visibility: action.visibility,
          retryCount: action.retryCount,
          resolution: action.resolution,
        }),
      };
    }
    case "ACTIVE_DECK_CHANGED":
      return {
        ...state,
        activeDeck: action.deck,
        transitionCount: state.transitionCount + 1,
        diagnostics: boundedDiagnostics(state.diagnostics, { event: "active_deck_changed", deck: action.deck }),
      };
    case "CROSSFADER_CHANGED":
      return { ...state, crossfade: Math.max(0, Math.min(100, Number(action.value) || 0)) };
    case "DECK_MUTE_CHANGED":
      return action.deck === "B"
        ? { ...state, deckBMuted: Boolean(action.muted) }
        : { ...state, deckAMuted: Boolean(action.muted) };
    case "DECK_VOLUME_CHANGED":
      return action.deck === "B"
        ? { ...state, deckBBaseVolume: action.volume }
        : { ...state, deckABaseVolume: action.volume };
    case "MASTER_CHANGED":
      return { ...state, masterVolume: action.volume ?? state.masterVolume, masterMuted: action.muted ?? state.masterMuted };
    case "AUTO_DJ_ARMED":
      return { ...state, autoDjArmed: Boolean(action.armed) };
    case "QUEUE_REPLACED":
      return { ...state, queue: [...(action.queue || [])] };
    case "DIAGNOSTIC":
      return { ...state, diagnostics: boundedDiagnostics(state.diagnostics, action.event || {}) };
    case "EMERGENCY_SILENCE":
      return {
        ...state,
        masterMuted: true,
        autoDjArmed: false,
        diagnostics: boundedDiagnostics(state.diagnostics, { event: "emergency_silence" }),
      };
    default:
      return state;
  }
}

export function selectActiveDeckSnapshot(state) {
  return state.activeDeck === "B" ? state.deckB : state.deckA;
}
