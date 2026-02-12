import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Volume2, Square, Save, Trash2, History, Star } from 'lucide-react';
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function FunctionDisplay({ toolCall }) {
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    
    const parsedResults = (() => {
        if (!results) return null;
        try {
            return typeof results === 'string' ? JSON.parse(results) : results;
        } catch {
            return results;
        }
    })();
    
    const isError = results && (
        (typeof results === 'string' && /error|failed/i.test(results)) ||
        (parsedResults?.success === false)
    );
    
    const statusConfig = {
        pending: { icon: Clock, color: 'text-blue-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-blue-400', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-blue-400', text: 'Running...', spin: true },
        completed: isError ? 
            { icon: AlertCircle, color: 'text-red-400', text: 'Failed' } : 
            { icon: CheckCircle2, color: 'text-green-400', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-400', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-400', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-400', text: 'Failed' }
    }[status] || { icon: Zap, color: 'text-blue-400', text: '' };
    
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all glass-dark",
                    "hover:bg-blue-500/20",
                    expanded ? "bg-blue-500/20 border-blue-500/50" : "border-blue-500/30"
                )}
            >
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-white">{formattedName}</span>
                {statusConfig.text && (
                    <span className={cn("text-white/70", isError && "text-red-400")}>
                        • {statusConfig.text}
                    </span>
                )}
                {!statusConfig.spin && (toolCall.arguments_string || results) && (
                    <ChevronRight className={cn("h-3 w-3 text-white/70 transition-transform ml-auto", 
                        expanded && "rotate-90")} />
                )}
            </button>
            
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-blue-500/30 space-y-2">
                    {toolCall.arguments_string && (
                        <div>
                            <div className="text-xs text-blue-400 mb-1">Parameters:</div>
                            <pre className="glass-dark rounded-md p-2 text-xs text-white whitespace-pre-wrap">
                                {(() => {
                                    try {
                                        return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2);
                                    } catch {
                                        return toolCall.arguments_string;
                                    }
                                })()}
                            </pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-blue-400 mb-1">Result:</div>
                            <pre className="glass-dark rounded-md p-2 text-xs text-white whitespace-pre-wrap max-h-48 overflow-auto">
                                {typeof parsedResults === 'object' ? 
                                    JSON.stringify(parsedResults, null, 2) : parsedResults}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MessageBubble({ message, autoRead = false }) {
    const isUser = message.role === 'user';
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
    const [pitch, setPitch] = useState(1.0);
    const [volume, setVolume] = useState(1.0);
    const [bass, setBass] = useState(0);
    const [treble, setTreble] = useState(0);
    const [presets, setPresets] = useState([]);
    const [voiceHistory, setVoiceHistory] = useState([]);
    const [presetName, setPresetName] = useState('');
    const [showPresetInput, setShowPresetInput] = useState(false);
    const audioRef = useRef(null);
    const audioContextRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const gainNodeRef = useRef(null);
    const hasAutoPlayed = useRef(false);
    const currentVoiceRef = useRef('Joanna');
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    const voicePersonalities = [
        { id: 'Joanna', name: 'Joanna', icon: '👩‍💼', description: 'Professional & Trustworthy', personality: 'Confident executive voice', category: 'American' },
        { id: 'Matthew', name: 'Matthew', icon: '🎙️', description: 'Deep & Authoritative', personality: 'News anchor presence', category: 'American' },
        { id: 'Joey', name: 'Joey', icon: '😊', description: 'Friendly & Casual', personality: 'Your helpful buddy', category: 'American' },
        { id: 'Salli', name: 'Salli', icon: '💼', description: 'Clear & Articulate', personality: 'Corporate communicator', category: 'American' },
        { id: 'Kendra', name: 'Kendra', icon: '✨', description: 'Warm & Engaging', personality: 'Storyteller voice', category: 'American' },
        { id: 'Kimberly', name: 'Kimberly', icon: '🎭', description: 'Dynamic & Expressive', personality: 'Voice actor energy', category: 'American' },
        { id: 'Ivy', name: 'Ivy', icon: '👧', description: 'Young & Cheerful', personality: 'Energetic assistant', category: 'American' },
        { id: 'Justin', name: 'Justin', icon: '🧒', description: 'Child-like Wonder', personality: 'Curious & innocent', category: 'American' },
        { id: 'Amy', name: 'Amy', icon: '🇬🇧', description: 'British Elegance', personality: 'Refined & sophisticated', category: 'British' },
        { id: 'Brian', name: 'Brian', icon: '🎩', description: 'British Authority', personality: 'BBC documentary host', category: 'British' },
        { id: 'Emma', name: 'Emma', icon: '☕', description: 'British Warmth', personality: 'Cozy & reassuring', category: 'British' },
        { id: 'Russell', name: 'Russell', icon: '🦘', description: 'Aussie Laid-back', personality: 'Down-to-earth mate', category: 'Australian' },
        { id: 'Nicole', name: 'Nicole', icon: '🌊', description: 'Aussie Friendly', personality: 'Bright & approachable', category: 'Australian' },
        { id: 'Raveena', name: 'Raveena', icon: '🪷', description: 'Graceful Indian', personality: 'Elegant & cultured', category: 'International' },
        { id: 'Aditi', name: 'Aditi', icon: '🎨', description: 'Expressive Indian', personality: 'Passionate storyteller', category: 'International' },
        { id: 'Geraint', name: 'Geraint', icon: '🏴󐁧󐁢󐁷󐁬󐁳󐁿', description: 'Welsh Richness', personality: 'Poetic & melodic', category: 'International' },
        { id: 'Gwyneth', name: 'Gwyneth', icon: '🎵', description: 'Welsh Melody', personality: 'Musical & flowing', category: 'International' },
        { id: 'Celine', name: 'Céline', icon: '🇫🇷', description: 'French Charm', personality: 'Romantic & sophisticated', category: 'International' },
        { id: 'Chantal', name: 'Chantal', icon: '🥐', description: 'French Elegance', personality: 'Parisian chic', category: 'International' },
        { id: 'Mizuki', name: 'Mizuki', icon: '🌸', description: 'Japanese Gentle', personality: 'Calm & respectful', category: 'International' }
    ];

    const stopSpeaking = () => {
        try {
            if (sourceNodeRef.current) {
                sourceNodeRef.current.stop();
                sourceNodeRef.current.disconnect();
                sourceNodeRef.current = null;
            }
            if (gainNodeRef.current) {
                gainNodeRef.current.disconnect();
                gainNodeRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
            if (audioRef.current) {
                audioRef.current.pause?.();
                audioRef.current = null;
            }
        } catch (e) {
            console.error('Cleanup error:', e);
        } finally {
            setIsSpeaking(false);
            setIsLoading(false);
        }
    };

    const processTextForSpeech = (text) => {
        return text
            .replace(/[#*`]/g, '')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const chunkText = (text, maxLength = 200) => {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }

        if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    };

    const speakText = async (voiceId, voiceName) => {
        if (isSpeaking) {
            stopSpeaking();
            return;
        }

        if (isLoading) return;

        const text = processTextForSpeech(message.content);
        if (!text || text.length === 0) {
            toast.error('No text to speak');
            return;
        }

        currentVoiceRef.current = voiceId;
        addToHistory(voiceId, voiceName);

        const chunks = chunkText(text);

        try {
            setIsLoading(true);

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;

            const audioBuffers = [];

            // USE GLYPHLOCK OPENAI TTS INSTEAD OF STREAMELEMENTS
            const response = await fetch('/.netlify/functions/textToSpeechOpenAI', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ text, voiceProfile: 'neutral_female', speed: playbackSpeed })
            });

            if (!response.ok) throw new Error(`TTS failed: ${response.status}`);

            const audioBuffer = await response.arrayBuffer();
            const decodedData = await audioContext.decodeAudioData(audioBuffer);
            audioBuffers.push(decodedData);

            if (audioBuffers.length === 0) {
                throw new Error('No audio data received');
            }

            let currentIndex = 0;
            let isPlaying = true;

            const playNextChunk = () => {
                if (!isPlaying || currentIndex >= audioBuffers.length) {
                    setIsSpeaking(false);
                    if (audioContext.state !== 'closed') {
                        audioContext.close().catch(e => console.error('Close error:', e));
                    }
                    return;
                }

                try {
                    const source = audioContext.createBufferSource();
                    source.buffer = audioBuffers[currentIndex];
                    source.playbackRate.value = playbackSpeed * pitch;

                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = volume;
                    gainNodeRef.current = gainNode;

                    const bassFilter = audioContext.createBiquadFilter();
                    bassFilter.type = 'lowshelf';
                    bassFilter.frequency.value = 200;
                    bassFilter.gain.value = bass;

                    const trebleFilter = audioContext.createBiquadFilter();
                    trebleFilter.type = 'highshelf';
                    trebleFilter.frequency.value = 3000;
                    trebleFilter.gain.value = treble;

                    source.connect(bassFilter);
                    bassFilter.connect(trebleFilter);
                    trebleFilter.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    source.onended = () => {
                        if (isPlaying) {
                            currentIndex++;
                            playNextChunk();
                        }
                    };

                    sourceNodeRef.current = source;
                    audioRef.current = { 
                        pause: () => {
                            isPlaying = false;
                            try {
                                source.stop();
                            } catch (e) {}
                            setIsSpeaking(false);
                        }
                    };

                    source.start(0);
                } catch (error) {
                    console.error('Playback error:', error);
                    isPlaying = false;
                    setIsSpeaking(false);
                }
            };

            setIsSpeaking(true);
            setIsLoading(false);
            playNextChunk();

        } catch (error) {
            console.error('TTS Error:', error);
            toast.error(error.message || 'Failed to generate speech');
            setIsLoading(false);
            setIsSpeaking(false);

            if (audioContextRef.current) {
                audioContextRef.current.close().catch(e => console.error('Cleanup error:', e));
                audioContextRef.current = null;
            }
        }
    };

    React.useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('glyphbot-voice-presets');
            const savedHistory = localStorage.getItem('glyphbot-voice-history');
            if (savedPresets) setPresets(JSON.parse(savedPresets));
            if (savedHistory) setVoiceHistory(JSON.parse(savedHistory));
        } catch (error) {
            console.error('Failed to load saved voice settings:', error);
        }

        return () => {
            stopSpeaking();
        };
    }, []);

    React.useEffect(() => {
        if (autoRead && !isUser && message.content && !hasAutoPlayed.current) {
            hasAutoPlayed.current = true;
            speakText('Joanna');
        }
    }, [autoRead, isUser, message.content]);

    const savePreset = () => {
        if (!presetName.trim()) {
            toast.error('Please enter a preset name');
            return;
        }
        try {
            const newPreset = {
                id: Date.now(),
                name: presetName.trim(),
                voice: currentVoiceRef.current,
                speed: playbackSpeed,
                pitch,
                volume,
                bass,
                treble
            };
            const updated = [...presets, newPreset];
            setPresets(updated);
            localStorage.setItem('glyphbot-voice-presets', JSON.stringify(updated));
            setPresetName('');
            setShowPresetInput(false);
            toast.success(`Preset "${newPreset.name}" saved`);
        } catch (error) {
            console.error('Failed to save preset:', error);
            toast.error('Failed to save preset');
        }
    };

    const loadPreset = (preset) => {
        currentVoiceRef.current = preset.voice;
        setPlaybackSpeed(preset.speed);
        setPitch(preset.pitch);
        setVolume(preset.volume);
        setBass(preset.bass);
        setTreble(preset.treble);
    };

    const deletePreset = (presetId) => {
        try {
            const preset = presets.find(p => p.id === presetId);
            const updated = presets.filter(p => p.id !== presetId);
            setPresets(updated);
            localStorage.setItem('glyphbot-voice-presets', JSON.stringify(updated));
            if (preset) {
                toast.success(`Preset "${preset.name}" deleted`);
            }
        } catch (error) {
            console.error('Failed to delete preset:', error);
            toast.error('Failed to delete preset');
        }
    };

    const addToHistory = (voiceId, voiceName) => {
        const historyItem = {
            id: Date.now(),
            voice: voiceId,
            name: voiceName,
            speed: playbackSpeed,
            pitch,
            volume,
            bass,
            treble,
            timestamp: new Date().toISOString()
        };
        const updated = [historyItem, ...voiceHistory.filter(h => h.voice !== voiceId)].slice(0, 10);
        setVoiceHistory(updated);
        localStorage.setItem('glyphbot-voice-history', JSON.stringify(updated));
    };
    
    return (
        <>
            <audio ref={audioRef} className="hidden" />
            <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                {!isUser && (
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mt-0.5 glow-royal">
                        <Zap className="h-4 w-4 text-white" />
                    </div>
                )}
                <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-2.5 group/message relative",
                        isUser ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" : "glass-royal text-white"
                    )}>
                        {!isUser && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={cn(
                                                "h-7 w-7 glass-dark hover:bg-blue-500/20 transition-all",
                                                (isLoading || isSpeaking) && "bg-blue-500/30"
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isLoading}
                                            title={isLoading ? "Loading..." : isSpeaking ? "Stop" : "Play"}
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-3 w-3 text-white animate-spin" />
                                            ) : isSpeaking ? (
                                                <Square className="h-3 w-3 text-white" />
                                            ) : (
                                                <Volume2 className="h-3 w-3 text-white" />
                                            )}
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="glass-dark border-blue-500/30 min-w-[280px] max-h-[500px] overflow-y-auto bg-black/95 backdrop-blur-xl">
                                       {isSpeaking ? (
                                           <DropdownMenuItem onClick={stopSpeaking} className="text-white hover:bg-blue-500/20">
                                               <Square className="h-3 w-3 mr-2" />
                                               Stop Speaking
                                           </DropdownMenuItem>
                                       ) : (
                                           <>
                                               <div className="px-3 py-3 space-y-4 border-b border-blue-500/30">
                                                   <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide">Audio Controls</div>
                                                   <div>
                                                       <label className="text-[10px] text-white/70 block mb-1">Speed: {playbackSpeed}x</label>
                                                       <input 
                                                           type="range" 
                                                           min="0.5" 
                                                           max="2.0" 
                                                           step="0.1" 
                                                           value={playbackSpeed}
                                                           onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                                                           className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                                                           onClick={(e) => e.stopPropagation()}
                                                       />
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] text-white/70 block mb-1">Pitch: {pitch.toFixed(1)}x</label>
                                                       <input 
                                                           type="range" 
                                                           min="0.5" 
                                                           max="1.5" 
                                                           step="0.1" 
                                                           value={pitch}
                                                           onChange={(e) => setPitch(parseFloat(e.target.value))}
                                                           className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                                                           onClick={(e) => e.stopPropagation()}
                                                       />
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] text-white/70 block mb-1">Volume: {Math.round(volume * 100)}%</label>
                                                       <input 
                                                           type="range" 
                                                           min="0" 
                                                           max="2" 
                                                           step="0.1" 
                                                           value={volume}
                                                           onChange={(e) => {
                                                               const newVolume = parseFloat(e.target.value);
                                                               setVolume(newVolume);
                                                               if (gainNodeRef.current) {
                                                                   gainNodeRef.current.gain.value = newVolume;
                                                               }
                                                           }}
                                                           className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                                                           onClick={(e) => e.stopPropagation()}
                                                       />
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] text-white/70 block mb-1">Bass: {bass > 0 ? '+' : ''}{bass} dB</label>
                                                       <input 
                                                           type="range" 
                                                           min="-10" 
                                                           max="10" 
                                                           step="1" 
                                                           value={bass}
                                                           onChange={(e) => setBass(parseFloat(e.target.value))}
                                                           className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                                                           onClick={(e) => e.stopPropagation()}
                                                       />
                                                   </div>
                                                   <div>
                                                       <label className="text-[10px] text-white/70 block mb-1">Treble: {treble > 0 ? '+' : ''}{treble} dB</label>
                                                       <input 
                                                           type="range" 
                                                           min="-10" 
                                                           max="10" 
                                                           step="1" 
                                                           value={treble}
                                                           onChange={(e) => setTreble(parseFloat(e.target.value))}
                                                           className="w-full h-1 bg-blue-500/30 rounded-lg appearance-none cursor-pointer"
                                                           onClick={(e) => e.stopPropagation()}
                                                       />
                                                       </div>
                                                       <div className="flex gap-2">
                                                       {showPresetInput ? (
                                                           <div className="flex gap-1 flex-1">
                                                               <input
                                                                   type="text"
                                                                   placeholder="Preset name..."
                                                                   value={presetName}
                                                                   onChange={(e) => setPresetName(e.target.value)}
                                                                   onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                                                                   className="flex-1 bg-blue-900/30 border border-blue-500/30 rounded px-2 py-1 text-white text-[10px]"
                                                                   onClick={(e) => e.stopPropagation()}
                                                                   autoFocus
                                                               />
                                                               <button
                                                                   onClick={savePreset}
                                                                   className="px-2 py-1 bg-blue-500/30 hover:bg-blue-500/50 rounded text-white"
                                                               >
                                                                   <Save className="w-3 h-3" />
                                                               </button>
                                                           </div>
                                                       ) : (
                                                           <button
                                                               onClick={() => setShowPresetInput(true)}
                                                               className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded text-white text-[10px] flex items-center justify-center gap-1"
                                                           >
                                                               <Save className="w-3 h-3" />
                                                               Save Current as Preset
                                                           </button>
                                                       )}
                                                       </div>
                                                       </div>
                                                       {presets.length > 0 && (
                                                       <>
                                                       <div className="px-2 py-1.5 text-[10px] text-blue-400 font-semibold uppercase tracking-wide flex items-center gap-1">
                                                           <Star className="w-3 h-3" />
                                                           Saved Presets
                                                       </div>
                                                       {presets.map((preset) => (
                                                           <div key={preset.id} className="px-2 py-1">
                                                               <div className="flex items-center justify-between bg-blue-500/10 rounded px-2 py-1.5 hover:bg-blue-500/20">
                                                                   <button
                                                                       onClick={() => {
                                                                           loadPreset(preset);
                                                                           speakText(preset.voice, preset.name);
                                                                       }}
                                                                       className="flex-1 text-left"
                                                                   >
                                                                       <div className="text-white text-[11px] font-medium">{preset.name}</div>
                                                                       <div className="text-white/50 text-[9px]">
                                                                           {voicePersonalities.find(v => v.id === preset.voice)?.name} • {preset.speed}x • P:{preset.pitch.toFixed(1)}
                                                                       </div>
                                                                   </button>
                                                                   <button
                                                                       onClick={(e) => {
                                                                           e.stopPropagation();
                                                                           deletePreset(preset.id);
                                                                       }}
                                                                       className="text-red-400 hover:text-red-300 p-1"
                                                                   >
                                                                       <Trash2 className="w-3 h-3" />
                                                                   </button>
                                                               </div>
                                                           </div>
                                                       ))}
                                                       </>
                                                       )}
                                                       {voiceHistory.length > 0 && (
                                                       <>
                                                       <div className="px-2 py-1.5 text-[10px] text-blue-400 font-semibold uppercase tracking-wide flex items-center gap-1 border-t border-blue-500/30 mt-2 pt-2">
                                                           <History className="w-3 h-3" />
                                                           Recent Voices
                                                       </div>
                                                       {voiceHistory.slice(0, 5).map((item) => (
                                                           <DropdownMenuItem
                                                               key={item.id}
                                                               onClick={() => {
                                                                   loadPreset(item);
                                                                   speakText(item.voice, item.name);
                                                               }}
                                                               className="text-white hover:bg-blue-500/20 focus:bg-blue-500/20 cursor-pointer"
                                                           >
                                                               <div className="flex flex-col gap-0.5 w-full">
                                                                   <div className="flex items-center gap-2">
                                                                       <span className="text-[11px] font-medium">{voicePersonalities.find(v => v.id === item.voice)?.name}</span>
                                                                   </div>
                                                                   <span className="text-[9px] text-white/50">
                                                                       Speed: {item.speed}x • Pitch: {item.pitch.toFixed(1)}x • Vol: {Math.round(item.volume * 100)}%
                                                                   </span>
                                                               </div>
                                                           </DropdownMenuItem>
                                                       ))}
                                                       </>
                                                       )}
                                                       <div className="px-2 py-1.5 text-[10px] text-blue-400 font-semibold uppercase tracking-wide border-t border-blue-500/30 mt-2">Select Voice</div>
                                               {['American', 'British', 'Australian', 'International'].map((category) => {
                                                   const categoryVoices = voicePersonalities.filter(v => v.category === category);
                                                   if (categoryVoices.length === 0) return null;
                                                   return (
                                                       <div key={category}>
                                                           <div className="px-2 py-1 text-[9px] text-white/40 font-semibold uppercase tracking-wide">{category}</div>
                                                           {categoryVoices.map((voice) => (
                                                               <DropdownMenuItem 
                                                                   key={voice.id}
                                                                   onClick={() => speakText(voice.id, voice.name)}
                                                                   disabled={isLoading}
                                                                   className="text-white hover:bg-blue-500/20 focus:bg-blue-500/20 flex flex-col items-start gap-0.5 py-3 cursor-pointer"
                                                               >
                                                                   <div className="flex items-center gap-2 w-full">
                                                                       <span className="text-lg">{voice.icon}</span>
                                                                       <div className="flex flex-col">
                                                                           <span className="font-semibold text-sm">{voice.name}</span>
                                                                           <span className="text-[10px] text-blue-400">{voice.description}</span>
                                                                       </div>
                                                                   </div>
                                                                   <span className="text-[9px] text-white/50 italic ml-8 leading-tight">{voice.personality}</span>
                                                               </DropdownMenuItem>
                                                           ))}
                                                       </div>
                                                   );
                                               })}
                                           </>
                                       )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                        {isUser ? (
                            <p className="text-sm leading-relaxed text-white">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <div className="relative group/code">
                                                <pre className="glass-dark text-white rounded-lg p-3 overflow-x-auto my-2">
                                                    <code className={className} {...props}>{children}</code>
                                                </pre>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 glass-dark hover:bg-blue-500/20"
                                                    onClick={() => {
                                                        copyToClipboard(String(children).replace(/\n$/, ''));
                                                    }}
                                                >
                                                    <Copy className="h-3 w-3 text-white" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <code className="px-1 py-0.5 rounded glass-dark text-blue-400 text-xs">
                                                {children}
                                            </code>
                                        );
                                    },
                                    a: ({ children, ...props }) => (
                                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-200 underline">
                                            {children}
                                        </a>
                                    ),
                                    p: ({ children }) => <p className="my-1 leading-relaxed text-white">{children}</p>,
                                    ul: ({ children }) => <ul className="my-1 ml-4 list-disc text-white">{children}</ul>,
                                    ol: ({ children }) => <ol className="my-1 ml-4 list-decimal text-white">{children}</ol>,
                                    li: ({ children }) => <li className="my-0.5 text-white">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-lg font-semibold my-2 text-white">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-base font-semibold my-2 text-white">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-semibold my-2 text-white">{children}</h3>,
                                    blockquote: ({ children }) => (
                                        <blockquote className="border-l-2 border-blue-400 pl-3 my-2 text-white/80">
                                            {children}
                                        </blockquote>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        )}
                    </div>
                )}
                
                {message.tool_calls && message.tool_calls.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}

                {message.file_urls && message.file_urls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {message.file_urls.map((url, idx) => (
                            <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs glass-dark rounded px-2 py-1 hover:bg-blue-500/20 transition-colors text-white border border-blue-500/30"
                            >
                                📎 File {idx + 1}
                            </a>
                        ))}
                    </div>
                )}
                </div>
            </div>
        </>
    );
}