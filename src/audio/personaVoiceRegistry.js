// DACO DIRECTIVE 005 §4 V-ISO-2 — Persona Voice Registry
// Single source of truth for persona → voice config. No persona voice values
// may be hardcoded in components (MDL-23 precedent).
// voiceProfile keys map server-side to OpenAI voices in textToSpeechOpenAI.

export const PERSONA_VOICES = {
  default:       { voiceProfile: 'neutral_female',      speed: 1.0 },
  none:          { voiceProfile: 'neutral_female',      speed: 1.0 },
  glyphbot:      { voiceProfile: 'neutral_female',      speed: 1.0 },
  glyphbot_jr:   { voiceProfile: 'warm_female',         speed: 1.05 },
  alfred:        { voiceProfile: 'professional_male',   speed: 1.0 },
  siteBuilder:   { voiceProfile: 'neutral_male',        speed: 1.0 },
  sie_architect: { voiceProfile: 'professional_female', speed: 1.0 },
};

export function resolvePersonaVoice(personaId) {
  return PERSONA_VOICES[personaId] || PERSONA_VOICES.default;
}

export default PERSONA_VOICES;