import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, RotateCcw, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  onStop, 
  onRegenerate,
  isSending,
  disabled,
  onFileUpload 
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);
  const restartAttemptsRef = useRef(0);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [value]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        
        if (finalTranscript) {
          onChange(value + finalTranscript);
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Show user-friendly error messages
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable permissions.');
        } else if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.');
        } else if (event.error !== 'aborted') {
          toast.error('Voice input failed. Please try again.');
        }
      };
      
      recognitionRef.current.onend = () => {
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
        
        // Only auto-restart if user intended to keep listening
        if (isListening && restartAttemptsRef.current < 3) {
          recognitionTimeoutRef.current = setTimeout(() => {
            try {
              recognitionRef.current?.start();
              restartAttemptsRef.current++;
            } catch (err) {
              console.warn('[Voice] Auto-restart failed:', err);
              setIsListening(false);
              restartAttemptsRef.current = 0;
            }
          }, 500);
        } else {
          setIsListening(false);
          restartAttemptsRef.current = 0;
        }
      };
    }
    
    return () => {
      if (recognitionTimeoutRef.current) {
        clearTimeout(recognitionTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [value, onChange]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (isListening) {
      try {
        if (recognitionTimeoutRef.current) {
          clearTimeout(recognitionTimeoutRef.current);
        }
        recognitionRef.current.stop();
        restartAttemptsRef.current = 0;
      } catch (err) {
        console.error('Stop recognition error:', err);
      }
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        restartAttemptsRef.current = 0;
      } catch (err) {
        console.error('Start recognition error:', err);
        if (err.message.includes('already started')) {
          setIsListening(true);
        } else {
          toast.error('Failed to start voice input');
          setIsListening(false);
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t-2 border-purple-500/30 px-4 py-5" style={{ position: 'relative', zIndex: 9999, background: 'rgba(10, 10, 20, 0.9)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 10000 }}>
        <div className="relative flex items-end gap-3 border-2 border-purple-500/40 rounded-2xl p-3 focus-within:border-cyan-400 focus-within:shadow-[0_0_30px_rgba(6,182,212,0.4),inset_0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.2)]" style={{ position: 'relative', zIndex: 10001, background: 'rgba(10, 10, 20, 0.8)' }}>
          <div className="flex items-center gap-1 pb-1">
            <button
              type="button"
              onClick={toggleVoiceInput}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                isListening 
                  ? 'text-red-400 bg-red-500/20 border-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]' 
                  : 'text-purple-400 hover:text-cyan-300 hover:bg-purple-500/20 border-purple-500/30 hover:border-cyan-400/50 shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
              }`}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask GlyphBot about security, code, blockchain..."
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-white placeholder:text-purple-400/60 focus:outline-none text-sm leading-relaxed max-h-[150px] py-2"
            style={{ fontSize: '16px', color: '#ffffff', position: 'relative', zIndex: 10002, fontWeight: '500' }}
          />

          <div className="flex items-center gap-2 pb-1">
            {!isSending && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-2.5 rounded-xl text-purple-400 hover:text-cyan-300 hover:bg-purple-500/20 border border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                title="Regenerate last response"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {isSending ? (
              <button
                type="button"
                onClick={onStop}
                className="p-3 rounded-xl bg-rose-500/30 border-2 border-rose-400 text-rose-300 hover:bg-rose-500/40 transition-all duration-300 shadow-[0_0_25px_rgba(244,63,94,0.5),inset_0_0_10px_rgba(244,63,94,0.2)]"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!value.trim()}
                style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px' }}
                className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white font-bold hover:from-cyan-400 hover:via-blue-400 hover:to-purple-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 shadow-[0_0_25px_rgba(6,182,212,0.6),0_0_50px_rgba(168,85,247,0.3)] disabled:shadow-none hover:shadow-[0_0_35px_rgba(6,182,212,0.8),0_0_60px_rgba(168,85,247,0.5)]"
                title="Send message"
              >
                <Send className="w-4 h-4 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 px-3 text-[11px]">
          <span className="text-purple-400/70">Enter to send · Shift+Enter for new line</span>
          {isSending && (
            <span className="text-cyan-400 font-medium animate-pulse drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">Processing chain response...</span>
          )}
        </div>
      </div>
    </div>
  );
}