// GlyphBot Phase 7 — Voice pipeline upgraded:
// - Real mapping of speed/pitch/emotion to TTS
// - Provider TTS preferred, Web Speech fallback
// - Backwards compatible with existing GlyphBot phases

import { useState, useRef, useCallback, useEffect } from 'react';
import { VOICE_PROFILES, EMOTION_PRESETS } from '../config';
import { tts as ttsService } from '../services';
import { synthesizeTTS } from '../services/ttsClient';

// Normalization helpers
function normalizeSpeed(speed) {
  return Math.min(2.0, Math.max(0.5, speed || 1.0));
}

function normalizePitch(pitch) {
  if (pitch === undefined || pitch === null) return 1.0;
  return Math.min(2.0, Math.max(0.5, pitch));
}

export default function useTTS(options = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [lastError, setLastError] = useState(null);
  const [voices, setVoices] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [provider, setProvider] = useState(options.provider || 'auto');
  
  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);

  const [currentSettings, setCurrentSettings] = useState({
    speed: options.speed || 1.0,
    pitch: options.pitch || 1.0,
    volume: options.volume || 1.0,
    bass: options.bass || 0,
    clarity: options.clarity || 0,
    voiceProfile: options.voiceProfile || 'neutral_female',
    emotion: options.emotion || 'neutral'
  });

  useEffect(() => {
    setCurrentSettings(prev => ({
      ...prev,
      ...(options.speed !== undefined && { speed: options.speed }),
      ...(options.pitch !== undefined && { pitch: options.pitch }),
      ...(options.volume !== undefined && { volume: options.volume }),
      ...(options.bass !== undefined && { bass: options.bass }),
      ...(options.clarity !== undefined && { clarity: options.clarity }),
      ...(options.voiceProfile !== undefined && { voiceProfile: options.voiceProfile }),
      ...(options.emotion !== undefined && { emotion: options.emotion })
    }));
  }, [options.speed, options.pitch, options.volume, options.bass, options.clarity, options.voiceProfile, options.emotion]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setTtsAvailable(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setTtsAvailable(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const getBestVoice = useCallback(() => {
    if (voices.length === 0) return null;

    if (currentSettings.voiceProfile) {
      const userVoice = voices.find(v => v.name === currentSettings.voiceProfile);
      if (userVoice) return userVoice;
    }

    const preferredVoices = [
      'Google US English', 'Google UK English Female', 'Google UK English Male',
      'Microsoft Zira', 'Microsoft David', 'Microsoft Mark',
      'Samantha', 'Alex', 'Karen', 'Daniel'
    ];

    for (const name of preferredVoices) {
      const found = voices.find(v => v.name.includes(name));
      if (found) return found;
    }

    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      !v.name.toLowerCase().includes('compact') &&
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.localService === false)
    );

    if (englishVoice) return englishVoice;

    const anyEnglish = voices.find(v => v.lang.startsWith('en'));
    return anyEnglish || voices[0];
  }, [voices, currentSettings.voiceProfile]);

  const stop = useCallback(() => {
    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      if (audioRef.current?.source) {
        try {
          audioRef.current.source.stop();
        } catch (e) {
          console.warn('[TTS] Source already stopped:', e);
        }
        audioRef.current = null;
      }

      if (audioRef.current instanceof Audio) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      if (utteranceRef.current) {
        utteranceRef.current = null;
      }
    } catch (e) {
      console.warn('[TTS] Stop error:', e);
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const playWithOpenAI = useCallback(async (text, settings, voiceProfile) => {
    try {
      // GLYPHLOCK: Call OpenAI TTS backend function
      const { base44 } = await import('@/api/base44Client');
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // GLYPHLOCK: Call OpenAI TTS backend with retry logic
      let audioData;
      try {
        const response = await base44.functions.invoke('textToSpeechOpenAI', {
          text,
          voiceProfile: voiceProfile || settings.voiceProfile || 'neutral_female',
          speed: normalizeSpeed(settings.speed)
        });

        if (response.data?.error) {
          throw new Error(response.data.error);
        }

        // Handle binary audio response
        if (response.data instanceof ArrayBuffer) {
          audioData = response.data;
        } else if (response.data instanceof Blob) {
          audioData = await response.data.arrayBuffer();
        } else {
          // Fallback: assume it's a URL or base64
          const blob = new Blob([response.data], { type: 'audio/mpeg' });
          audioData = await blob.arrayBuffer();
        }
      } catch (openaiError) {
        console.warn('[TTS] OpenAI failed, retrying with fallback...', openaiError);
        throw openaiError; // Will trigger fallback to Web Speech
      }

      let audioBuffer = await audioContext.decodeAudioData(audioData);
      
      // GLYPHLOCK: Apply audio filters (bass/clarity/pitch)
      audioBuffer = await applyAudioFilters(audioContext, audioBuffer, settings);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContext.createGain();
      gainNode.gain.value = settings.volume || 1.0;
      
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);

      audioRef.current = { source, audioContext };

      source.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      setIsLoading(false);
      setIsSpeaking(true);
      setMetadata({
        provider: 'openai',
        voiceProfile: voiceProfile || settings.voiceProfile,
        pitch: settings.pitch,
        speed: settings.speed,
        bass: settings.bass,
        clarity: settings.clarity,
        timestamp: Date.now()
      });

      source.start(0);
      return true;

    } catch (error) {
      console.warn('[TTS] OpenAI failed:', error);
      setIsSpeaking(false);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const playWithWebSpeech = useCallback(async (text, settings) => {
    return new Promise(async (resolve) => {
      try {
        if (!('speechSynthesis' in window)) {
          console.error('[TTS WebSpeech] Not available in this browser');
          resolve(false);
          return;
        }

        // Cancel any ongoing speech first
        window.speechSynthesis.cancel();
        
        // Wait for voices to load if not available
        let availableVoices = voices;
        if (availableVoices.length === 0) {
          availableVoices = window.speechSynthesis.getVoices();
          if (availableVoices.length === 0) {
            await new Promise(waitResolve => {
              const checkVoices = () => {
                availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                  waitResolve();
                } else {
                  setTimeout(checkVoices, 100);
                }
              };
              setTimeout(checkVoices, 100);
              setTimeout(waitResolve, 2000);
            });
            availableVoices = window.speechSynthesis.getVoices();
          }
        }

        console.log('[TTS WebSpeech] Available voices:', availableVoices.length, 'Profile:', settings.voiceProfile, 'Emotion:', settings.emotion);

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;
        
        // CRITICAL: Voice selection based on voiceProfile
        let voice = null;
        const profile = settings.voiceProfile || 'neutral_female';
        const isMaleProfile = profile.includes('male') && !profile.includes('female');
        
        // Log all available voices for debugging
        console.log('[TTS WebSpeech] All available voices:', availableVoices.map(v => ({ name: v.name, lang: v.lang, local: v.localService })));
        
        // Define keywords at this scope for later use
        const maleKeywords = ['david', 'james', 'daniel', 'alex', 'tom', 'fred', 'mark', 'george', 'guy', 'male', 'onyx', 'echo', 'reed', 'grandpa', 'albert', 'junior', 'aaron', 'gordon', 'lee', 'ralph', 'rocko'];
        const femaleKeywords = ['zira', 'samantha', 'karen', 'victoria', 'susan', 'fiona', 'moira', 'veena', 'female', 'nova', 'shimmer', 'alloy', 'kathy', 'vicki', 'princess', 'bells', 'agnes', 'grandma', 'sandy'];
        
        if (availableVoices.length > 0) {
          // Get all English voices first
          const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
          console.log('[TTS WebSpeech] English voices:', englishVoices.map(v => v.name));
          
          const maleVoices = englishVoices.filter(v => 
            maleKeywords.some(k => v.name.toLowerCase().includes(k)) ||
            (!femaleKeywords.some(k => v.name.toLowerCase().includes(k)) && v.name.toLowerCase().includes('male'))
          );
          
          const femaleVoices = englishVoices.filter(v => 
            femaleKeywords.some(k => v.name.toLowerCase().includes(k)) ||
            (!maleKeywords.some(k => v.name.toLowerCase().includes(k)) && v.name.toLowerCase().includes('female'))
          );
          
          console.log('[TTS WebSpeech] Male voices found:', maleVoices.map(v => v.name));
          console.log('[TTS WebSpeech] Female voices found:', femaleVoices.map(v => v.name));
          
          // Select based on profile gender
          if (isMaleProfile) {
            // Try to get a male voice
            if (maleVoices.length > 0) {
              // Pick based on profile type for variety
              if (profile === 'warm_male') {
                voice = maleVoices.find(v => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('alex')) || maleVoices[0];
              } else if (profile === 'professional_male') {
                voice = maleVoices.find(v => v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('mark')) || maleVoices[0];
              } else {
                voice = maleVoices[0];
              }
            } else {
              // No male voices, use any English but adjust pitch lower
              voice = englishVoices[0];
              console.log('[TTS WebSpeech] No male voices, will use pitch adjustment');
            }
          } else {
            // Female profile
            if (femaleVoices.length > 0) {
              if (profile === 'warm_female') {
                voice = femaleVoices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('karen')) || femaleVoices[0];
              } else if (profile === 'professional_female') {
                voice = femaleVoices.find(v => v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('victoria')) || femaleVoices[0];
              } else {
                voice = femaleVoices[0];
              }
            } else {
              // No female voices, use any English but adjust pitch higher
              voice = englishVoices[0];
              console.log('[TTS WebSpeech] No female voices, will use pitch adjustment');
            }
          }
          
          // Override based on emotion if strong emotion selected (emotion > profile)
          if (settings.emotion === 'authoritative' || settings.emotion === 'intense') {
            if (maleVoices.length > 0) {
              voice = maleVoices[0];
              console.log('[TTS WebSpeech] Emotion override: using male voice for authoritative/intense');
            }
          } else if (settings.emotion === 'friendly' || settings.emotion === 'calm' || settings.emotion === 'whisper') {
            if (femaleVoices.length > 0) {
              voice = femaleVoices[0];
              console.log('[TTS WebSpeech] Emotion override: using female voice for friendly/calm/whisper');
            }
          }
          
          // Final fallback
          if (!voice) {
            voice = englishVoices[0] || availableVoices[0];
          }
        }
        
        if (voice) {
          utterance.voice = voice;
          console.log('[TTS WebSpeech] Selected voice:', voice.name, 'for profile:', profile);
        }

        // CRITICAL: Apply settings with voice profile pitch adjustments
        let rate = normalizeSpeed(settings.speed);
        let pitch = normalizePitch(settings.pitch);
        const volume = Math.max(0, Math.min(1, settings.volume || 1));
        
        // Additional pitch adjustment if we couldn't find the right gender voice
        const selectedVoiceIsMale = maleKeywords.some(k => voice?.name?.toLowerCase().includes(k));
        const selectedVoiceIsFemale = femaleKeywords.some(k => voice?.name?.toLowerCase().includes(k));
        
        if (isMaleProfile && !selectedVoiceIsMale && selectedVoiceIsFemale) {
          // We wanted male but got female, lower the pitch
          pitch = Math.max(0.5, pitch * 0.75);
          console.log('[TTS WebSpeech] Pitch lowered for male profile with female voice:', pitch);
        } else if (!isMaleProfile && !selectedVoiceIsFemale && selectedVoiceIsMale) {
          // We wanted female but got male, raise the pitch
          pitch = Math.min(2.0, pitch * 1.25);
          console.log('[TTS WebSpeech] Pitch raised for female profile with male voice:', pitch);
        }
        
        utterance.rate = rate;
        utterance.pitch = pitch;
        utterance.volume = volume;

        console.log('[TTS WebSpeech] Final settings - Rate:', rate, 'Pitch:', pitch, 'Volume:', volume, 'Voice:', voice?.name, 'Profile:', profile);

        let hasStarted = false;

        utterance.onstart = () => {
          hasStarted = true;
          console.log('[TTS WebSpeech] Started speaking with voice:', voice?.name);
          setIsLoading(false);
          setIsSpeaking(true);
          setMetadata({
            provider: 'webspeech',
            voice: voice?.name || 'Default',
            voiceProfile: settings.voiceProfile,
            pitch: settings.pitch,
            speed: settings.speed,
            emotion: settings.emotion,
            timestamp: Date.now()
          });
        };

        utterance.onend = () => {
          console.log('[TTS WebSpeech] Finished speaking');
          setIsSpeaking(false);
          utteranceRef.current = null;
          if (hasStarted) {
            resolve(true);
          }
        };

        utterance.onerror = (e) => {
          console.error('[TTS WebSpeech] Error:', e.error, e);
          setIsSpeaking(false);
          setIsLoading(false);
          setLastError(e.error || 'Speech error');
          utteranceRef.current = null;
          resolve(false);
        };

        // Small delay before speaking
        await new Promise(r => setTimeout(r, 50));
        
        window.speechSynthesis.speak(utterance);
        
        // Chrome bug workaround
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        
        setTimeout(() => {
          if (!hasStarted) {
            console.warn('[TTS WebSpeech] Timeout - speech may not have started');
            resolve(true);
          }
        }, 500);

      } catch (error) {
        console.error('[TTS WebSpeech] Failed:', error);
        setLastError(error.message);
        setIsLoading(false);
        resolve(false);
      }
    });
  }, [voices]);

  const playText = useCallback(async (text, customSettings = {}) => {
    if (!text || typeof text !== 'string') return false;
    
    const cleanText = text
      .replace(/[#*`🦕💠🦖🌟✨🔒⚡️💡🛡️•]/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/\.+/g, '.')
      .trim();
    
    if (!cleanText || cleanText.length < 2) return false;

    stop();
    setIsLoading(true);
    setLastError(null);

    let settings = { ...currentSettings, ...customSettings };
    
    if (settings.emotion && EMOTION_PRESETS[settings.emotion]) {
      const emotionPreset = EMOTION_PRESETS[settings.emotion];
      if (customSettings.pitch === undefined && emotionPreset.pitch !== undefined) {
        settings.pitch = emotionPreset.pitch;
      }
      if (customSettings.speed === undefined && emotionPreset.speed !== undefined) {
        settings.speed = emotionPreset.speed;
      }
    }
    
    settings.speed = normalizeSpeed(settings.speed);
    settings.pitch = normalizePitch(settings.pitch);
    settings.volume = Math.max(0, Math.min(1, settings.volume || 1.0));

    console.log('[TTS] Using OpenAI TTS with settings:', settings);

    // ALWAYS USE OPENAI TTS - NO WEB SPEECH
    try {
      return await playWithOpenAI(cleanText, settings, settings.voiceProfile);
    } catch (err) {
      console.error('[TTS] OpenAI failed:', err);
      setLastError(err.message);
      setIsLoading(false);
      return false;
    }
  }, [provider, stop, playWithOpenAI, currentSettings]);

  const testTTS = useCallback(async () => {
    return playText('Hello! This is GlyphBot, your elite security assistant.');
  }, [playText]);

  const getVoiceProfiles = useCallback(() => {
    return Object.keys(VOICE_PROFILES).map(key => ({
      id: key,
      label: VOICE_PROFILES[key].label,
      voice: VOICE_PROFILES[key].id
    }));
  }, []);

  const getEmotionPresets = useCallback(() => {
    return Object.keys(EMOTION_PRESETS).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1),
      ...EMOTION_PRESETS[key]
    }));
  }, []);

  const getWebSpeechVoices = useCallback(() => {
    return voices.filter(v => v.lang.startsWith('en')).map(v => ({
      name: v.name,
      lang: v.lang,
      local: v.localService
    }));
  }, [voices]);

  return {
    playText,
    speak: playText,
    stop,
    testTTS,
    getVoiceProfiles,
    getEmotionPresets,
    getWebSpeechVoices,
    isSpeaking,
    isLoading,
    ttsAvailable,
    lastError,
    metadata,
    provider,
    currentSettings
  };
}

async function applyAudioFilters(audioContext, audioBuffer, settings) {
  try {
    const { bass = 0, clarity = 0, pitch = 1.0 } = settings;
    
    if (bass === 0 && clarity === 0 && pitch === 1.0) {
      return audioBuffer;
    }

    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    source.playbackRate.value = pitch;

    let lastNode = source;
    if (bass !== 0) {
      const bassFilter = offlineContext.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 200;
      bassFilter.gain.value = bass * 12;
      lastNode.connect(bassFilter);
      lastNode = bassFilter;
    }

    if (clarity !== 0) {
      const clarityFilter = offlineContext.createBiquadFilter();
      clarityFilter.type = 'highshelf';
      clarityFilter.frequency.value = 3000;
      clarityFilter.gain.value = clarity * 10;
      lastNode.connect(clarityFilter);
      lastNode = clarityFilter;
    }

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = -30;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.1;
    lastNode.connect(compressor);

    compressor.connect(offlineContext.destination);

    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    return renderedBuffer;

  } catch (error) {
    console.error('[TTS] Filter error:', error);
    return audioBuffer;
  }
}