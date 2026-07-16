// DACO 007 Phase B — GlyphBot main message bubble.
// Navy/gold brand, full markdown (shared MarkdownRenderer), streaming cursor,
// hover/long-press actions (copy, voice replay), existing FeedbackButtons
// integrated as-is, timestamp + provider footer.

import React, { useState } from 'react';
import { Volume2, Bot, User, Copy, Check } from 'lucide-react';
import MarkdownRenderer from './chat/MarkdownRenderer';
import FeedbackButtons from './FeedbackButtons';

const ChatMessage = React.memo(function ChatMessage({ msg, isAssistant, onReplay }) {
  const [copied, setCopied] = useState(false);
  if (!msg || (!msg.content && !msg.streaming)) return null;

  const copyMsg = () => {
    navigator.clipboard.writeText(msg.content || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className={`group flex gap-2 sm:gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-900/60 to-slate-900/60 border border-amber-400/40 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-amber-300" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 ${
          isAssistant
            ? msg.isError
              ? 'bg-rose-950/40 border border-rose-500/30'
              : 'bg-white/[0.04] backdrop-blur-md border border-white/10'
            : 'bg-gradient-to-br from-blue-800/60 to-blue-950/70 border border-blue-400/30'
        }`}
      >
        {isAssistant ? (
          <>
            <MarkdownRenderer>{msg.content || ''}</MarkdownRenderer>
            {msg.streaming && (
              <span className="inline-block w-1.5 h-4 bg-amber-300 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
          </>
        ) : (
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}

        {/* Message actions — hover on desktop, long-press/tap-visible on touch */}
        {!msg.streaming && msg.content && (
          <div className="absolute -top-3 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              onClick={copyMsg}
              title="Copy message"
              style={{ minWidth: '32px', minHeight: '32px', touchAction: 'manipulation' }}
              className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-white/15 text-slate-400 hover:text-amber-300 shadow-lg"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
            {isAssistant && onReplay && msg.ttsMetadata && (
              <button
                onClick={() => onReplay(msg.id, msg.ttsMetadata)}
                title="Replay with voice"
                style={{ minWidth: '32px', minHeight: '32px', touchAction: 'manipulation' }}
                className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-amber-400/30 text-amber-300 hover:bg-amber-500/20 shadow-lg"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* DACO 006 P1 — per-response feedback (existing component, integrated) */}
        {isAssistant && !msg.streaming && msg.content && !msg.isError && (
          <FeedbackButtons
            messageId={msg.id}
            personaId="glyphbot"
            surface="glyphbot_main"
            responseText={msg.content}
          />
        )}

        {/* Footer: timestamp + provider */}
        {(msg.ts || (isAssistant && msg.providerId && msg.providerId !== 'unknown')) && !msg.streaming && (
          <div className="mt-2 pt-1.5 border-t border-white/5 flex items-center gap-2">
            {msg.ts && (
              <span className="text-[9px] text-slate-500">
                {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {isAssistant && msg.providerId && msg.providerId !== 'unknown' && (
              <span className="text-[9px] text-slate-600 font-mono">{msg.providerId}</span>
            )}
            {msg.latencyMs && <span className="text-[9px] text-slate-600 font-mono">{msg.latencyMs}ms</span>}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700/50 to-blue-950/60 border border-blue-400/40 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-blue-300" />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.msg.streaming === nextProps.msg.streaming &&
    prevProps.isAssistant === nextProps.isAssistant
  );
});

export default ChatMessage;