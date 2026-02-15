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
    <div className="border-t border-white/10 px-4 py-3" style={{ position: 'relative', zIndex: 9999, background: 'rgba(10, 10, 20, 0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-2 border border-white/10 rounded-xl p-2.5 focus-within:border-cyan-400/50 transition-all bg-white/[0.03]">
          <button
            type="button"
            onClick={toggleVoiceInput}
            style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
            className={`p-2 rounded-lg transition-all ${
              isListening 
                ? 'text-red-400 bg-red-500/20 border border-red-400/50 animate-pulse' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
            title={isListening ? 'Stop voice input' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            disabled={disabled}
            className="flex-1 resize-none bg-transparent text-white placeholder:text-slate-500 focus:outline-none text-sm leading-relaxed max-h-[150px] py-2"
            style={{ fontSize: '16px' }}
          />

          <div className="flex items-center gap-1.5">
            {!isSending && (
              <button
                type="button"
                onClick={onRegenerate}
                className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                title="Regenerate"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            {isSending ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2.5 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 hover:bg-red-500/30 transition-all"
                title="Stop"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!value.trim()}
                style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
                className="p-2.5 rounded-lg bg-cyan-500 text-white hover:bg-cyan-400 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5 px-2 text-[10px] text-slate-600">
          <span>Enter to send · Shift+Enter for new line</span>
          {isSending && <span className="text-cyan-500">Processing...</span>}
        </div>
      </div>
    </div>
  );
}