// GLYPHLOCK VOICE SYSTEM - CANONICAL FRONTEND HOOK
// Single audio pipeline: useTTS → Base44 invoke → OpenAI → HTMLAudio playback
// NO WEB SPEECH API | NO FALLBACKS | FAIL LOUDLY

import { useState, useCallback, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useTTSClean(defaultSettings = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const audioRef = useRef(null);
  const defaultSettingsRef = useRef(defaultSettings);

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('glyphbot_voice_settings');
      if (saved) {
        return { ...JSON.parse(saved), ...defaultSettings };
      }
    } catch (e) {
      console.warn('Failed to load voice settings:', e);
    }
    return {
      voice: 'nova',
      speed: 1.0,
      ...defaultSettings
    };
  });

  // Keep defaultSettingsRef in sync with parent prop changes - use JSON comparison for object deps
  useEffect(() => {
    defaultSettingsRef.current = defaultSettings;
    console.log('GLYPH VOICE: defaultSettings updated from parent:', { voiceProfile: defaultSettings?.voiceProfile, voice: defaultSettings?.voice, speed: defaultSettings?.speed, emotion: defaultSettings?.emotion });
  }, [JSON.stringify(defaultSettings)]);

  // Save settings to localStorage whenever they change
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
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
    console.log('GLYPH VOICE: stop requested');
    playingRef.current = false;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
        audioRef.current.onerror = null;
        // Revoke blob URL if it exists
        if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
          URL.revokeObjectURL(audioRef.current.src);
        }
      } catch (e) {
        console.warn('GLYPH VOICE: stop cleanup error', e);
      }
      audioRef.current = null;
    }
    // Also kill any browser speechSynthesis (from GlyphBotJr or other components)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const playingRef = useRef(false);

  const playText = useCallback(async (text, customSettings = {}) => {
    // ALWAYS stop previous audio — no race conditions
    stop();
    
    // Small delay to ensure previous audio element is fully cleaned up
    await new Promise(r => setTimeout(r, 50));

    if (!text || typeof text !== 'string') {
      console.error('GLYPH VOICE: invalid input - text is', typeof text);
      return false;
    }

    // Clean markdown only (backend also cleans emojis, so only strip markdown structure here)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 2) {
      console.warn('GLYPH VOICE: text too short or empty after cleaning');
      return false;
    }

    // Merge: customSettings (per-call) > latest defaultSettings from parent > internal settings
    const finalSettings = { ...settings, ...defaultSettingsRef.current, ...customSettings };
    // PHASE 3: Resolve voiceProfile → voice (voiceProfile is the key used by ControlBar/GlyphBot.jsx)
    // Priority chain: explicit per-call > parent defaults > internal state > fallback
    const resolvedVoiceProfile = customSettings?.voiceProfile || defaultSettingsRef.current?.voiceProfile || finalSettings.voiceProfile;
    const resolvedVoice = customSettings?.voice || defaultSettingsRef.current?.voice || finalSettings.voice;
    const voice = resolvedVoiceProfile || resolvedVoice || 'nova';
    const speed = Math.max(0.25, Math.min(4.0, customSettings?.speed ?? defaultSettingsRef.current?.speed ?? finalSettings.speed ?? 1.0));
    const emotion = customSettings?.emotion || defaultSettingsRef.current?.emotion || finalSettings.emotion || 'neutral';
    
    console.log('GLYPH VOICE: resolved voice chain', { 
      customVoiceProfile: customSettings?.voiceProfile, 
      defaultVoiceProfile: defaultSettingsRef.current?.voiceProfile,
      finalVoiceProfile: finalSettings.voiceProfile,
      resolvedVoice: voice, 
      resolvedSpeed: speed, 
      resolvedEmotion: emotion 
    });

    console.log('GLYPH VOICE: request started', { text: cleanText.slice(0, 50), voice, speed, emotion });

    // Cache key: hash of text + voice + speed + emotion
    const cacheKey = `tts_${btoa(unescape(encodeURIComponent(cleanText.slice(0, 200) + voice + speed + emotion))).slice(0, 64)}`;

    // Check sessionStorage cache
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        console.log('GLYPH VOICE: cache HIT', cacheKey.slice(0, 20));
        stop();
        playingRef.current = true;
        setIsLoading(false);
        setIsSpeaking(true);

        const blob = new Blob(
          [Uint8Array.from(atob(cached), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.volume = Math.max(0, Math.min(1, finalSettings.volume ?? 1.0));
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          playingRef.current = false;
          audioRef.current = null;
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          playingRef.current = false;
          audioRef.current = null;
          // Cache corrupted — remove and fall through next time
          sessionStorage.removeItem(cacheKey);
        };

        await audio.play();
        return true;
      }
    } catch (e) {
      console.warn('GLYPH VOICE: cache read failed', e);
    }

    console.log('GLYPH VOICE: cache MISS, calling backend');

    playingRef.current = true;
    setIsLoading(true);
    setLastError(null);

    try {
      console.log('GLYPH VOICE: invoking Base44 function tts');

      // CRITICAL: Use Base44 SDK - NOT direct fetch
      // PHASE 3: Pass emotion for backend prompt engineering
      const response = await base44.functions.invoke('tts', {
        text: cleanText,
        voice,
        speed,
        emotion
      });

      console.log('GLYPH VOICE: Base44 response received', { status: response.status, hasData: !!response.data });

      // Check for HTTP errors
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.data?.error || 'TTS failed'}`);
      }

      const responseData = response.data;

      if (!responseData || !responseData.audio_base64) {
        throw new Error(responseData?.error || 'No audio data received from backend');
      }

      console.log('GLYPH VOICE: base64 audio received', { 
        base64Length: responseData.audio_base64.length,
        bytes: responseData.bytes,
        voice: responseData.voice
      });

      // Cache in sessionStorage (skip if too large — sessionStorage limit ~5MB)
      try {
        if (responseData.audio_base64.length < 500000) {
          sessionStorage.setItem(cacheKey, responseData.audio_base64);
          console.log('GLYPH VOICE: cached audio', cacheKey.slice(0, 20));
        }
      } catch (e) {
        console.warn('GLYPH VOICE: cache write failed (storage full?)', e);
      }

      // Decode base64 to binary
      const binaryStr = atob(responseData.audio_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      console.log('GLYPH VOICE: play attempt', { url: audioUrl });

      // Create and play audio
      const audio = new Audio(audioUrl);
      // PHASE 3: Apply client-side volume from voiceSettings
      audio.volume = Math.max(0, Math.min(1, finalSettings.volume ?? 1.0));
      audioRef.current = audio;

      audio.onended = () => {
        console.log('GLYPH VOICE: play complete');
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        playingRef.current = false;
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('GLYPH VOICE: audio element error', e);
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        playingRef.current = false;
        setLastError('Audio playback failed');
        audioRef.current = null;
      };

      await audio.play();
      
      console.log('GLYPH VOICE: play success');
      
      setIsLoading(false);
      setIsSpeaking(true);

      return true;

    } catch (error) {
      const errorMsg = error?.message || 'Unknown TTS error';
      console.error('GLYPH VOICE: play failed', errorMsg, error);
      setLastError(errorMsg);
      setIsLoading(false);
      setIsSpeaking(false);
      playingRef.current = false;

      return false;
    }
  }, [settings, stop]);

  const testTTS = useCallback(async () => {
    // Read latest settings from localStorage to avoid stale closure
    let latestSettings = {};
    try {
      const saved = localStorage.getItem('glyphbot_voice_settings');
      if (saved) latestSettings = JSON.parse(saved);
    } catch (e) { /* use defaults */ }
    
    console.log('GLYPH VOICE: test voice requested with settings:', latestSettings);
    return playText('Hello! This is GlyphBot, your elite security assistant.', latestSettings);
  }, [playText]);

  return {
    playText,
    speak: playText, // Alias
    stop,
    testTTS,
    isSpeaking,
    isLoading,
    lastError,
    settings,
    updateSettings
  };
}