// GlyphBot legacy TTS hook — DACO DIRECTIVE 005 refactor.
// Thin wrapper over GlobalAudioEngine. All speechSynthesis, AudioContext,
// and OfflineAudioContext usage removed (MDL-V01/V02/V03).
// Public API preserved for existing consumers.

import { useState, useCallback, useEffect } from 'react';
import { VOICE_PROFILES, EMOTION_PRESETS } from '../config';
import GlobalAudioEngine from '@/audio/GlobalAudioEngine';

export default function useTTS(options = {}) {
  const [engineState, setEngineState] = useState(() => GlobalAudioEngine.get().snapshot());

  const [currentSettings, setCurrentSettings] = useState({
    speed: options.speed || 1.0,
    volume: options.volume || 1.0,
    voiceProfile: options.voiceProfile || 'neutral_female',
    emotion: options.emotion || 'neutral'
  });

  useEffect(() => {
    setCurrentSettings((prev) => ({
      ...prev,
      ...(options.speed !== undefined && { speed: options.speed }),
      ...(options.volume !== undefined && { volume: options.volume }),
      ...(options.voiceProfile !== undefined && { voiceProfile: options.voiceProfile }),
      ...(options.emotion !== undefined && { emotion: options.emotion })
    }));
  }, [options.speed, options.volume, options.voiceProfile, options.emotion]);

  useEffect(() => GlobalAudioEngine.get().subscribe(setEngineState), []);

  const stop = useCallback(() => {
    GlobalAudioEngine.get().stop();
  }, []);

  const playText = useCallback(async (text, customSettings = {}) => {
    if (!text || typeof text !== 'string') return false;

    const settings = { ...currentSettings, ...customSettings };
    // Emotion presets map to speed only (server selects voice character)
    if (settings.emotion && EMOTION_PRESETS[settings.emotion]) {
      const preset = EMOTION_PRESETS[settings.emotion];
      if (customSettings.speed === undefined && preset.speed !== undefined) {
        settings.speed = preset.speed;
      }
    }

    return GlobalAudioEngine.get().speak(text, {
      voiceProfile: settings.voiceProfile,
      speed: settings.speed,
      volume: settings.volume
    });
  }, [currentSettings]);

  const testTTS = useCallback(async () => {
    return playText('Hello! This is GlyphBot, your elite security assistant.');
  }, [playText]);

  const getVoiceProfiles = useCallback(() => {
    return Object.keys(VOICE_PROFILES).map((key) => ({
      id: key,
      label: VOICE_PROFILES[key].label,
      voice: VOICE_PROFILES[key].voice
    }));
  }, []);

  const getEmotionPresets = useCallback(() => {
    return Object.keys(EMOTION_PRESETS).map((key) => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      ...EMOTION_PRESETS[key]
    }));
  }, []);

  // Legacy API — Web Speech removed per Directive 005 R2
  const getWebSpeechVoices = useCallback(() => [], []);

  return {
    playText,
    speak: playText,
    stop,
    testTTS,
    getVoiceProfiles,
    getEmotionPresets,
    getWebSpeechVoices,
    isSpeaking: engineState.isSpeaking,
    isLoading: engineState.isLoading,
    ttsAvailable: true,
    lastError: engineState.lastError,
    metadata: { provider: 'openai', activeVoiceConfig: engineState.activeVoiceConfig },
    provider: 'openai',
    currentSettings
  };
}