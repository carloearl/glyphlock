import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, RotateCcw, Mic, MicOff, Paperclip, Bot, ChevronDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const AGENTS = [
  { id: 'none', label: 'No Agent (LLM Direct)', description: 'Direct LLM chat — no agent tools' },
  { id: 'glyphbot', label: 'GlyphBot', description: 'Security analysis, code audit, threat detection' },
  { id: 'glyphbot_jr', label: 'GlyphBot Jr', description: 'Platform guidance & quick answers' },
  { id: 'alfred', label: 'Alfred', description: 'Technical orchestrator — build & ship' },
  { id: 'siteBuilder', label: 'Site Builder', description: 'Autonomous dev agent — create & debug' },
  { id: 'sie_architect', label: 'SIE Architect', description: 'Site integrity monitoring & auto-fix' },
];

const DAILY_LIMIT = 25;

export default function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  onStop, 
  onRegenerate,
  isSending,
  disabled,
  onFileUpload,
  selectedAgent,
  onAgentChange
}) {
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const recognitionTimeoutRef = useRef(null);
  const restartAttemptsRef = useRef(0);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [agentUsage, setAgentUsage] = useState(null);
  const agentPickerRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [value]);

  // Close agent picker on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (agentPickerRef.current && !agentPickerRef.current.contains(e.target)) {
        setShowAgentPicker(false);
      }
    };
    if (showAgentPicker) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAgentPicker]);

  // Check agent usage on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await base44.functions.invoke('browserAgent', { action: 'checkUsage' });
        setAgentUsage(resp.data);
      } catch (e) {
        // Non-critical — just hide usage
      }
    })();
  }, []);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        }
        if (finalTranscript) onChange(value + finalTranscript);
      };
      
      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        if (event.error === 'not-allowed') toast.error('Microphone access denied.');
        else if (event.error === 'no-speech') toast.error('No speech detected.');
        else if (event.error !== 'aborted') toast.error('Voice input failed.');
      };
      
      recognitionRef.current.onend = () => {
        if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
        if (isListening && restartAttemptsRef.current < 3) {
          recognitionTimeoutRef.current = setTimeout(() => {
            try { recognitionRef.current?.start(); restartAttemptsRef.current++; }
            catch { setIsListening(false); restartAttemptsRef.current = 0; }
          }, 500);
        } else { setIsListening(false); restartAttemptsRef.current = 0; }
      };
    }
    return () => {
      if (recognitionTimeoutRef.current) clearTimeout(recognitionTimeoutRef.current);
      try { recognitionRef.current?.stop(); } catch {}
    };
  }, [value, onChange]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) { toast.error('Speech recognition not supported'); return; }
    if (isListening) {
      try { clearTimeout(recognitionTimeoutRef.current); recognitionRef.current.stop(); restartAttemptsRef.current = 0; } catch {}
      setIsListening(false);
    } else {
      try { recognitionRef.current.start(); setIsListening(true); restartAttemptsRef.current = 0; }
      catch (err) {
        if (err.message?.includes('already started')) setIsListening(true);
        else { toast.error('Failed to start voice input'); setIsListening(false); }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending) handleSendWithFiles();
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }
      setAttachedFiles(prev => [...prev, { file, name: file.name, size: file.size, type: file.type }]);
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendWithFiles = () => {
    onSend(attachedFiles.map(f => f.file));
    setAttachedFiles([]);
  };

  const currentAgent = AGENTS.find(a => a.id === (selectedAgent || 'none')) || AGENTS[0];
  const remaining = agentUsage?.remaining ?? null;

  return (
    <div className="border-t border-white/10 px-4 py-3" style={{ position: 'relative', zIndex: 9999, background: 'rgba(10, 10, 20, 0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-4xl mx-auto">

        {/* Attached files preview */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
                <Paperclip className="w-3 h-3 text-slate-500" />
                <span className="max-w-[120px] truncate">{f.name}</span>
                <span className="text-[9px] text-slate-500">{(f.size / 1024).toFixed(0)}KB</span>
                <button onClick={() => removeFile(i)} className="text-slate-500 hover:text-red-400 ml-1 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Agent selector bar */}
        <div className="relative mb-2" ref={agentPickerRef}>
          <button
            type="button"
            onClick={() => setShowAgentPicker(!showAgentPicker)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
            style={{ touchAction: 'manipulation', minHeight: '32px' }}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{currentAgent.label}</span>
            {remaining !== null && selectedAgent && selectedAgent !== 'none' && (
              <span className="text-[9px] text-cyan-400 ml-1">{remaining}/{DAILY_LIMIT} left</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showAgentPicker ? 'rotate-180' : ''}`} />
          </button>

          {showAgentPicker && (
            <div className="absolute bottom-full left-0 mb-1 w-72 bg-slate-900 border border-white/15 rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 100000 }}>
              <div className="px-3 py-2 border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select Agent</div>
              <div className="max-h-64 overflow-y-auto">
                {AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      if (onAgentChange) onAgentChange(agent.id);
                      setShowAgentPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.06] transition-all ${
                      currentAgent.id === agent.id ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'border-l-2 border-transparent'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    <Bot className={`w-4 h-4 mt-0.5 flex-shrink-0 ${currentAgent.id === agent.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-medium ${currentAgent.id === agent.id ? 'text-cyan-300' : 'text-slate-300'}`}>{agent.label}</div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{agent.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              {remaining !== null && (
                <div className="px-3 py-2 border-t border-white/5 text-[10px] text-slate-500">
                  Agent sessions: <span className="text-cyan-400 font-medium">{remaining}</span> remaining today
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="relative flex items-end gap-2 border border-white/10 rounded-xl p-2.5 focus-within:border-cyan-400/50 transition-all bg-white/[0.03]">
          {/* File upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.zip,.txt,.json,.csv,.js,.jsx,.ts,.tsx,.py,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
            title="Attach files"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice */}
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
            placeholder={selectedAgent && selectedAgent !== 'none' ? `Ask ${currentAgent.label}...` : 'Ask anything...'}
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
                onClick={handleSendWithFiles}
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