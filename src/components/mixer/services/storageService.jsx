/**
 * Mixer Storage Service
 * localStorage persistence with atomic writes and quota error handling
 */
import { toast } from "sonner";
import { emitTelemetry } from "../events/mixerTelemetry";

const KEYS = {
  songs: "glyphbot_mixer_songs_v1",
  profiles: "glyphbot_mixer_profiles_v1",
  state: "glyphbot_mixer_state_v1",
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[MixerStorage] Failed to read ${key}:`, e);
    return fallback;
  }
}

function safeWrite(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`[MixerStorage] Quota error writing ${key}:`, e);
    emitTelemetry("STORAGE_ERROR", { operation: "write", message: e.message });
    toast.error("Storage full — changes may not persist. Clear browser data or remove archived songs.");
  }
}

export function loadSongs() {
  return safeRead(KEYS.songs, []);
}

export function saveSongs(songs) {
  safeWrite(KEYS.songs, songs);
}

export function loadProfiles() {
  return safeRead(KEYS.profiles, []);
}

export function saveProfiles(profiles) {
  safeWrite(KEYS.profiles, profiles);
}

export function loadState() {
  return safeRead(KEYS.state, {
    activeProfileId: undefined,
    viewMode: "list",
    vibeFilter: "all",
    searchQuery: "",
  });
}

export function saveState(partial) {
  const current = loadState();
  safeWrite(KEYS.state, { ...current, ...partial });
}