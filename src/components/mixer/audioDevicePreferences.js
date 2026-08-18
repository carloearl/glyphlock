export const AUDIO_OUTPUT_EVENT = "glyphlock:audio-output-change";
const INPUT_KEY = "nups_dj_audio_input";
const OUTPUT_KEY = "nups_dj_audio_output";

export const getAudioInputId = () => localStorage.getItem(INPUT_KEY) || "default";
export const getAudioOutputId = () => localStorage.getItem(OUTPUT_KEY) || "default";

export function saveAudioInputId(deviceId) {
  localStorage.setItem(INPUT_KEY, deviceId);
}

export function saveAudioOutputId(deviceId) {
  localStorage.setItem(OUTPUT_KEY, deviceId);
  window.dispatchEvent(new CustomEvent(AUDIO_OUTPUT_EVENT, { detail: deviceId }));
}

export async function applyPreferredOutput(audio, deviceId = getAudioOutputId()) {
  if (!audio?.setSinkId) return false;
  try {
    await audio.setSinkId(deviceId || "default");
  } catch {
    localStorage.setItem(OUTPUT_KEY, "default");
    await audio.setSinkId("default");
  }
  return true;
}