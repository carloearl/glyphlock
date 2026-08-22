/**
 * Venue/operator/device/mode-scoped mixer cache.
 *
 * Legacy global v1 keys are deliberately not read automatically because their
 * ownership cannot be proven. They remain untouched for explicit migration.
 */
import { toast } from "sonner";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";
import { getCurrentOperatingMode } from "@/lib/nups/operatingMode";
import { buildMixerStorageKey } from "@/components/mixer/session/mixerStorageScope";
export { buildMixerStorageKey } from "@/components/mixer/session/mixerStorageScope";

const LEGACY_KEYS = Object.freeze([
  "glyphbot_mixer_songs_v1",
  "glyphbot_mixer_profiles_v1",
  "glyphbot_mixer_state_v1",
]);

export function readMixerStorageScope() {
  let venueId = "no-venue";
  let operatorId = "anonymous";
  try {
    const venue = JSON.parse(localStorage.getItem("nups_active_venue") || "{}");
    venueId = venue.id || venue.venue_id || venueId;
  } catch { /* isolated fallback */ }
  try {
    const operator = JSON.parse(sessionStorage.getItem("nups_kiosk_operator") || "{}");
    operatorId = operator.id || operator.user_id || operator.email || operator.name || operatorId;
  } catch { /* isolated fallback */ }
  return {
    venueId,
    operatorId,
    deviceId: localStorage.getItem("nups_dj_device_id") || "default-device",
    mode: getCurrentOperatingMode("LIVE"),
  };
}

function safeRead(kind, fallback, scope = readMixerStorageScope()) {
  try {
    const raw = localStorage.getItem(buildMixerStorageKey(kind, scope));
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    console.warn(`[MixerStorage] Failed to read ${kind}:`, error);
    return fallback;
  }
}

function safeWrite(kind, data, scope = readMixerStorageScope()) {
  try {
    localStorage.setItem(buildMixerStorageKey(kind, scope), JSON.stringify(data));
  } catch (error) {
    console.error(`[MixerStorage] Failed to write ${kind}:`, error);
    emitTelemetry("STORAGE_ERROR", { operation: "write", kind, message: error.message });
    toast.error("Mixer cache could not be saved. Remove old local scratch tracks or check browser storage.");
  }
}

export function hasQuarantinedLegacyMixerCache() {
  try { return LEGACY_KEYS.some((key) => localStorage.getItem(key)); } catch { return false; }
}

export function loadSongs(scope) {
  return safeRead("songs", [], scope);
}

export function saveSongs(songs, scope) {
  safeWrite("songs", songs, scope);
}

export function loadProfiles(scope) {
  return safeRead("profiles", [], scope);
}

export function saveProfiles(profiles, scope) {
  safeWrite("profiles", profiles, scope);
}

export function loadState(scope) {
  return safeRead("state", {
    activeProfileId: undefined,
    viewMode: "list",
    vibeFilter: "all",
    searchQuery: "",
  }, scope);
}

export function saveState(partial, scope) {
  safeWrite("state", { ...loadState(scope), ...partial }, scope);
}
