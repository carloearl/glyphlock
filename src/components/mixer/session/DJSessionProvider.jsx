import React, { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import {
  createDeckCommand,
  createInitialDJSessionState,
  djSessionReducer,
  selectActiveDeckSnapshot,
} from "./djSessionState";

const DJSessionContext = createContext(null);

function readScope() {
  if (typeof window === "undefined") return { venueId: "server", operatorId: "server", deviceId: "server" };
  let venueId = "no-venue";
  let operatorId = "anonymous";
  try {
    const venue = JSON.parse(localStorage.getItem("nups_active_venue") || "{}");
    venueId = venue.id || venue.venue_id || venueId;
  } catch { /* scoped fallback */ }
  try {
    const operator = JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "{}");
    operatorId = operator.id || operator.user_id || operator.email || operator.name || operatorId;
  } catch { /* scoped fallback */ }
  let deviceId = localStorage.getItem("nups_dj_device_id");
  if (!deviceId) {
    deviceId = globalThis.crypto?.randomUUID?.() || `device-${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem("nups_dj_device_id", deviceId); } catch { /* local cache only */ }
  }
  return { venueId, operatorId, deviceId };
}

export function DJSessionProvider({ children }) {
  const [state, dispatch] = useReducer(djSessionReducer, undefined, () => createInitialDJSessionState({ scope: readScope() }));

  const requestDeckLoad = useCallback((input) => {
    const command = createDeckCommand(input);
    dispatch({ type: "DECK_COMMAND_REQUESTED", command });
    return command.requestId;
  }, []);

  const acknowledgeDeckLoad = useCallback((requestId, deck, song) => {
    dispatch({ type: "DECK_LOADED", requestId, deck, songId: song?.id, song });
  }, []);

  const rejectDeckLoad = useCallback((requestId, deck, message) => {
    dispatch({ type: "DECK_COMMAND_ERROR", requestId, deck, message });
  }, []);

  const setDeckSong = useCallback((deck, song) => {
    dispatch({ type: "DECK_LOADED_DIRECT", deck, songId: song?.id || null, song: song || null });
  }, []);

  const setProviderState = useCallback((event) => dispatch({ type: "DECK_PROVIDER_STATE", ...event }), []);
  const recordDiagnostic = useCallback((event) => dispatch({ type: "DIAGNOSTIC", event }), []);

  const value = useMemo(() => ({
    state,
    scope: state.scope,
    activeDeckSnapshot: selectActiveDeckSnapshot(state),
    requestDeckLoad,
    acknowledgeDeckLoad,
    rejectDeckLoad,
    setDeckSong,
    setProviderState,
    recordDiagnostic,
    setView: (view) => dispatch({ type: "VIEW_CHANGED", view }),
    setActiveDeck: (deck) => dispatch({ type: "ACTIVE_DECK_CHANGED", deck }),
    setCrossfade: (value) => dispatch({ type: "CROSSFADER_CHANGED", value }),
    setDeckMuted: (deck, muted) => dispatch({ type: "DECK_MUTE_CHANGED", deck, muted }),
    setDeckVolume: (deck, volume) => dispatch({ type: "DECK_VOLUME_CHANGED", deck, volume }),
    setMaster: (changes) => dispatch({ type: "MASTER_CHANGED", ...changes }),
    setAutoDjArmed: (armed) => dispatch({ type: "AUTO_DJ_ARMED", armed }),
    setQueue: (queue) => dispatch({ type: "QUEUE_REPLACED", queue }),
    emergencySilence: () => dispatch({ type: "EMERGENCY_SILENCE" }),
  }), [state, requestDeckLoad, acknowledgeDeckLoad, rejectDeckLoad, setDeckSong, setProviderState, recordDiagnostic]);

  return <DJSessionContext.Provider value={value}>{children}</DJSessionContext.Provider>;
}

export function useDJSession() {
  const value = useContext(DJSessionContext);
  if (!value) throw new Error("useDJSession must be used inside DJSessionProvider");
  return value;
}

export function useOptionalDJSession() {
  return useContext(DJSessionContext);
}
