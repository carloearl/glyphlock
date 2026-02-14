// GLYPHLOCK VOICE SYSTEM - CANONICAL FRONTEND HOOK
// Single audio pipeline: useTTS → Base44 invoke → OpenAI → HTMLAudio playback
// NO WEB SPEECH API | NO FALLBACKS | FAIL LOUDLY

import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export default function useTTS(defaultSettings = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState(null);
  const audioRef = useRef(null);

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
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const playText = useCallback(async (text, customSettings = {}) => {
    if (!text || typeof text !== 'string') {
      console.error('GLYPH VOICE: invalid input - text is', typeof text);
      return false;
    }

    // Clean markdown and emojis
    const cleanText = text
      .replace(/[#*`🦕💠🦖🌟✨🔒⚡️💡🛡️•]/g, '')
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

    // Merge settings
    const finalSettings = { ...settings, ...customSettings };
    const voice = finalSettings.voice || 'nova';
    const speed = Math.max(0.25, Math.min(4.0, finalSettings.speed || 1.0));

    console.log('GLYPH VOICE: request started', { text: cleanText.slice(0, 50), voice, speed });

    stop(); // Stop any current playback
    setIsLoading(true);
    setLastError(null);

    try {
      console.log('GLYPH VOICE: invoking Base44 function tts');

      // CRITICAL: Use Base44 SDK - NOT direct fetch
      const response = await base44.functions.invoke('tts', {
        text: cleanText,
        voice,
        speed
      });

      console.log('GLYPH VOICE: Base44 response received', { status: response.status, hasData: !!response.data });

      // Check for HTTP errors
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: ${response.data?.error || 'TTS failed'}`);
      }

      // Response.data is the raw audio buffer (ArrayBuffer or Blob)
      const audioData = response.data;

      if (!audioData) {
        throw new Error('No audio data received from backend');
      }

      console.log('GLYPH VOICE: audio bytes received', { 
        type: audioData.constructor.name,
        size: audioData.size || audioData.byteLength || 'unknown'
      });

      // Create audio URL from response
      let audioUrl;
      if (audioData instanceof Blob) {
        audioUrl = URL.createObjectURL(audioData);
      } else if (audioData instanceof ArrayBuffer) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
      } else {
        throw new Error('Unexpected audio data type: ' + typeof audioData);
      }

      console.log('GLYPH VOICE: play attempt', { url: audioUrl });

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log('GLYPH VOICE: play complete');
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error('GLYPH VOICE: audio element error', e);
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        setLastError('Audio playback failed');
        audioRef.current = null;
      };

      await audio.play();
      
      console.log('GLYPH VOICE: play success');
      
      setIsLoading(false);
      setIsSpeaking(true);

      return true;

    } catch (error) {
      const errorMsg = error.message || 'Unknown TTS error';
      console.error('GLYPH VOICE: play failed', errorMsg, error);
      setLastError(errorMsg);
      setIsLoading(false);
      setIsSpeaking(false);
      
      // DO NOT MASK ERROR - throw it
      throw error;
    }
  }, [settings, stop]);

  const testTTS = useCallback(async () => {
    console.log('GLYPH VOICE: test voice requested');
    return playText('Hello! This is GlyphBot, your elite security assistant.');
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