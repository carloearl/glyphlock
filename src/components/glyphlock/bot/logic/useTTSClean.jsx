// GLYPHLOCK VOICE SYSTEM — CANONICAL FRONTEND HOOK
// DACO DIRECTIVE 005: thin wrapper over GlobalAudioEngine (the sole audio owner).
// NO WEB SPEECH API | NO WEBAUDIO HERE | Single output channel, interrupt-before-play.

import { useState, useCallback, useEffect, useRef } from 'react';
import GlobalAudioEngine from '@/audio/GlobalAudioEngine';

export default function useTTSClean(defaultSettings = {}) {
  const [engineState, setEngineState] = useState(() => GlobalAudioEngine.get().snapshot());
  const defaultSettingsRef = useRef(defaultSettings);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('glyphbot_voice_settings');
      if (saved) return { ...JSON.parse(saved), ...defaultSettings };
    } catch (e) {
      console.warn('Failed to load voice settings:', e);
    }
    return { voiceProfile: 'neutral_female', speed: 1.0, ...defaultSettings };
  });

  useEffect(() => {
    defaultSettingsRef.current = defaultSettings;
  }, [JSON.stringify(defaultSettings)]);

  // Subscribe to the single engine for state
  useEffect(() => GlobalAudioEngine.get().subscribe(setEngineState), []);

  const updateSettings = useCallback((newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('glyphbot_voice_settings', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save voice settings:', e);
      }
      return updated;
    });
  }, []);

  const stop = useCallback(() => {
    GlobalAudioEngine.get().stop();
  }, []);

  const playText = useCallback(async (text, customSettings = {}) => {
    if (!text || typeof text !== 'string') return false;

    // Resolution chain preserved: per-call > parent defaults > internal state
    const merged = { ...settings, ...defaultSettingsRef.current, ...customSettings };
    const voiceProfile =
      customSettings?.voiceProfile ||
      defaultSettingsRef.current?.voiceProfile ||
      merged.voiceProfile ||
      merged.voice ||
      'neutral_female';
    const speed = customSettings?.speed ?? defaultSettingsRef.current?.speed ?? merged.speed ?? 1.0;
    const volume = merged.volume ?? 1.0;

    return GlobalAudioEngine.get().speak(text, { voiceProfile, speed, volume });
  }, [settings]);

  const testTTS = useCallback(async () => {
    let latestSettings = {};
    try {
      const saved = localStorage.getItem('glyphbot_voice_settings');
      if (saved) latestSettings = JSON.parse(saved);
    } catch (e) { /* use defaults */ }
    return playText('Hello! This is GlyphBot, your elite security assistant.', latestSettings);
  }, [playText]);

  return {
    playText,
    speak: playText,
    stop,
    testTTS,
    isSpeaking: engineState.isSpeaking,
    isLoading: engineState.isLoading,
    lastError: engineState.lastError,
    settings,
    updateSettings
  };
}