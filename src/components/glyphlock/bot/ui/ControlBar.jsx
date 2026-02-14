import React, { useState } from 'react';
import { Volume2, Wifi, FileSearch, Braces, Layout, Trash2, Settings2, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
// Using native HTML inputs for reliability
import { PERSONAS, MODEL_OPTIONS } from '../config';

function ModeToggle({ active, icon: Icon, label, onClick, color = 'cyan' }) {
  const colors = {
    cyan: active 
      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6),inset_0_0_15px_rgba(6,182,212,0.2)]' 
      : 'hover:border-cyan-500/50 hover:text-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]',
    purple: active 
      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.6),inset_0_0_15px_rgba(168,85,247,0.2)]' 
      : 'hover:border-purple-500/50 hover:text-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    amber: active 
      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6),inset_0_0_15px_rgba(245,158,11,0.2)]' 
      : 'hover:border-amber-500/50 hover:text-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    rose: active 
      ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.6),inset_0_0_15px_rgba(244,63,94,0.2)]' 
      : 'hover:border-rose-500/50 hover:text-rose-400 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        isolation: 'isolate',
        position: 'relative',
        zIndex: 9999
      }}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide
        border-2 transition-all duration-300 backdrop-blur-sm min-h-[44px]
        ${active 
          ? colors[color]
          : `bg-slate-900/60 border-slate-700/50 text-slate-400 ${colors[color]}`
        }
      `}
    >
      <Icon className={`w-3.5 h-3.5 ${active ? 'drop-shadow-[0_0_6px_currentColor]' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default function ControlBar({
  persona,
  setPersona,
  provider,
  setProvider,
  modes,
  onToggleMode,
  onClear,
  onVoiceSettingsChange,
  voiceSettings,
  voiceProfiles = [],
  emotionPresets = []
}) {
  const [showVoiceControls, setShowVoiceControls] = useState(false);

  const handleVoiceChange = (key, value) => {
    console.log('[ControlBar] Voice setting changed:', key, '=', value);
    if (onVoiceSettingsChange?.setVoiceSettings) {
      onVoiceSettingsChange.setVoiceSettings(prev => {
        const updated = { ...prev, [key]: value };
        console.log('[ControlBar] Updated voice settings:', updated);
        return updated;
      });
    }
  };

  return (
    <div className="px-4 py-4 border-b border-purple-500/30 bg-transparent backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.25em] text-cyan-400/80 font-bold">Persona</label>
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px' }}
              className="min-w-[140px] text-xs bg-slate-900/80 border-2 border-purple-500/40 rounded-xl px-3 py-2 text-cyan-200 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-[0.25em] text-purple-400/80 font-bold">Model</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px' }}
              className="min-w-[160px] text-xs bg-slate-900/80 border-2 border-cyan-500/40 rounded-xl px-3 py-2 text-purple-200 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <ModeToggle 
            active={modes.voice} 
            icon={Volume2} 
            label="Voice" 
            onClick={() => onToggleMode('voice')}
            color="purple"
          />
          
          {modes.voice && (
            <Popover open={showVoiceControls} onOpenChange={setShowVoiceControls}>
              <PopoverTrigger asChild>
                <button 
                  style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px', minWidth: '44px' }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-all"
                >
                  <Settings2 className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 bg-slate-900 border-purple-500/50 p-4 max-h-[70vh] overflow-y-auto" 
                style={{ zIndex: 99999 }}
                sideOffset={8}
              >
                <div className="space-y-4">
                  <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Voice Controls</div>
                  
                  {/* Emotion Preset - Native Select */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Emotion Preset</span>
                      <span className="text-[9px] text-cyan-400 font-mono">{voiceSettings?.emotion || 'neutral'}</span>
                    </label>
                    <select 
                      value={voiceSettings?.emotion || 'neutral'} 
                      onChange={(e) => {
                        const val = e.target.value;
                        console.log('[ControlBar] Emotion selected:', val);
                        
                        // Find the preset from available presets or use hardcoded values
                        const presetMap = {
                          neutral: { pitch: 1.0, speed: 1.0, bass: 0, clarity: 0, volume: 1.0 },
                          energetic: { pitch: 1.2, speed: 1.2, bass: 0.3, clarity: 0.4, volume: 1.0 },
                          calm: { pitch: 0.88, speed: 0.85, bass: 0.15, clarity: -0.05, volume: 0.9 },
                          authoritative: { pitch: 0.82, speed: 0.92, bass: 0.5, clarity: 0.25, volume: 1.0 },
                          friendly: { pitch: 1.12, speed: 1.08, bass: 0, clarity: 0.15, volume: 1.0 },
                          whisper: { pitch: 0.95, speed: 0.8, bass: -0.2, clarity: -0.3, volume: 0.7 },
                          intense: { pitch: 1.0, speed: 1.25, bass: 0.4, clarity: 0.5, volume: 1.0 }
                        };
                        
                        const preset = emotionPresets?.find(ep => ep.id === val) || presetMap[val];
                        
                        if (onVoiceSettingsChange?.setVoiceSettings) {
                          onVoiceSettingsChange.setVoiceSettings(prev => {
                            const updated = {
                              ...prev,
                              emotion: val,
                              pitch: preset?.pitch ?? prev.pitch,
                              speed: preset?.speed ?? prev.speed,
                              bass: preset?.bass ?? prev.bass,
                              clarity: preset?.clarity ?? prev.clarity,
                              volume: preset?.volume ?? prev.volume
                            };
                            console.log('[ControlBar] Emotion preset applied:', updated);
                            return updated;
                          });
                        }
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation', minHeight: '44px' }}
                    >
                      <option value="neutral">Neutral</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="friendly">Friendly</option>
                      <option value="whisper">Whisper</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>

                  {/* Voice Profile - Native Select */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Voice Profile</span>
                      <span className="text-[9px] text-purple-400 font-mono">{voiceSettings?.voiceProfile || 'neutral_female'}</span>
                    </label>
                    <select 
                      value={voiceSettings?.voiceProfile || 'neutral_female'} 
                      onChange={(e) => {
                        const val = e.target.value;
                        console.log('[ControlBar] Voice profile selected:', val);
                        handleVoiceChange('voiceProfile', val);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation', minHeight: '44px' }}
                    >
                      <option value="neutral_female">Nova (Neutral Female)</option>
                      <option value="neutral_male">Onyx (Neutral Male)</option>
                      <option value="warm_female">Shimmer (Warm Female)</option>
                      <option value="warm_male">Echo (Warm Male)</option>
                      <option value="professional_female">Alloy (Professional)</option>
                      <option value="professional_male">Fable (Storyteller)</option>
                    </select>
                  </div>

                  {/* Pitch - UI Preview Only (OpenAI TTS does not support pitch) */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Pitch <span className="text-[8px] text-slate-600 ml-1">(preview)</span></span>
                      <span className="text-cyan-400 font-mono">{voiceSettings?.pitch?.toFixed(2) || '1.00'}x</span>
                    </label>
                    <input
                      type="range"
                      value={voiceSettings?.pitch || 1.0}
                      onChange={(e) => handleVoiceChange('pitch', parseFloat(e.target.value))}
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                    />
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>Deep</span>
                      <span>High</span>
                    </div>
                  </div>

                  {/* Speed - Native Input Range */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Speed</span>
                      <span className="text-cyan-400 font-mono">{voiceSettings?.speed?.toFixed(2) || '1.00'}x</span>
                    </label>
                    <input
                      type="range"
                      value={voiceSettings?.speed || 1.0}
                      onChange={(e) => handleVoiceChange('speed', parseFloat(e.target.value))}
                      min={0.5}
                      max={2.0}
                      step={0.05}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                    />
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>Slower</span>
                      <span>Faster</span>
                    </div>
                  </div>

                  {/* Volume - Native Input Range */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Volume</span>
                      <span className="text-cyan-400 font-mono">{((voiceSettings?.volume || 1.0) * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      value={voiceSettings?.volume || 1.0}
                      onChange={(e) => handleVoiceChange('volume', parseFloat(e.target.value))}
                      min={0.0}
                      max={1.0}
                      step={0.05}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                    />
                  </div>

                  {/* Bass - UI Preview Only (OpenAI TTS does not support bass) */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Bass <span className="text-[8px] text-slate-600 ml-1">(preview)</span></span>
                      <span className="text-purple-400 font-mono">{((voiceSettings?.bass || 0) * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      value={voiceSettings?.bass || 0}
                      onChange={(e) => handleVoiceChange('bass', parseFloat(e.target.value))}
                      min={-1.0}
                      max={1.0}
                      step={0.1}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                    />
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>Thin</span>
                      <span>Deep</span>
                    </div>
                  </div>

                  {/* Clarity - UI Preview Only (OpenAI TTS does not support clarity) */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 flex items-center justify-between">
                      <span>Clarity <span className="text-[8px] text-slate-600 ml-1">(preview)</span></span>
                      <span className="text-purple-400 font-mono">{((voiceSettings?.clarity || 0) * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      value={voiceSettings?.clarity || 0}
                      onChange={(e) => handleVoiceChange('clarity', parseFloat(e.target.value))}
                      min={-1.0}
                      max={1.0}
                      step={0.1}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
                    />
                    <div className="flex justify-between text-[9px] text-slate-600">
                      <span>Muffled</span>
                      <span>Crisp</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[ControlBar] Test Voice clicked with settings:', voiceSettings);
                        if (onVoiceSettingsChange?.playText) {
                          // Pass the CURRENT voiceSettings explicitly
                          onVoiceSettingsChange.playText(
                            "Hello! This is a test of your current voice settings. The emotion is " + (voiceSettings?.emotion || 'neutral') + " and the profile is " + (voiceSettings?.voiceProfile || 'neutral female') + ".",
                            { ...voiceSettings }
                          );
                        }
                      }}
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px' }}
                      className="flex-1 px-3 py-2.5 rounded-lg text-xs bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Test Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('glyphbot_voice_settings', JSON.stringify(voiceSettings));
                        console.log('[Voice] Settings saved:', voiceSettings);
                      }}
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px' }}
                      className="flex-1 px-3 py-2.5 rounded-lg text-xs bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <ModeToggle 
            active={modes.live} 
            icon={Wifi} 
            label="Live" 
            onClick={() => onToggleMode('live')}
            color="cyan"
          />
          <ModeToggle 
            active={modes.audit} 
            icon={FileSearch} 
            label="Audit" 
            onClick={() => onToggleMode('audit')}
            color="amber"
          />
          <ModeToggle 
            active={modes.json} 
            icon={Braces} 
            label="JSON" 
            onClick={() => onToggleMode('json')}
            color="cyan"
          />
          <ModeToggle 
            active={modes.panel} 
            icon={Layout} 
            label="Panel" 
            onClick={() => onToggleMode('panel')}
            color="purple"
          />
          
          <button
            onClick={onClear}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto', minHeight: '44px' }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide bg-rose-950/40 border-2 border-rose-500/50 text-rose-300 hover:bg-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all duration-300"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}