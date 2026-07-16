import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Volume2, Bot, User } from 'lucide-react';
import FeedbackButtons from './FeedbackButtons';

const ChatMessage = React.memo(function ChatMessage({ msg, isAssistant, onReplay }) {
  if (!msg || !msg.content) return null;

  return (
    <div className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/30 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-cyan-300" />
        </div>
      )}

      <div
        className={`relative max-w-[80%] rounded-2xl px-5 py-4 ${
          isAssistant
            ? 'bg-white/[0.04] backdrop-blur-md border border-white/10'
            : 'bg-gradient-to-br from-blue-600/40 to-purple-600/40 border border-blue-400/30'
        }`}
      >
        {isAssistant ? (
          <ReactMarkdown
            className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none
              [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
              [&_p]:my-1.5 [&_p]:text-slate-200
              [&_strong]:text-cyan-300 [&_strong]:font-bold
              [&_em]:text-purple-300
              [&_ul]:my-2 [&_ul]:ml-4 [&_ul]:list-disc [&_ul]:text-slate-300
              [&_ol]:my-2 [&_ol]:ml-4 [&_ol]:list-decimal [&_ol]:text-slate-300
              [&_li]:my-0.5 [&_li]:text-slate-300
              [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-cyan-300 [&_code]:text-xs
              [&_pre]:bg-slate-900/80 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-white/10
              [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2
              [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-3 [&_h1]:mb-2
              [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5
              [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-2 [&_h3]:mb-1
              [&_blockquote]:border-l-2 [&_blockquote]:border-cyan-400/50 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-slate-400 [&_blockquote]:italic"
            components={{
              a: ({ children, ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
              ),
            }}
          >
            {msg.content}
          </ReactMarkdown>
        ) : (
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap break-words">
            {msg.content}
          </p>
        )}

        {/* TTS replay button */}
        {isAssistant && onReplay && msg.ttsMetadata && (
          <button
            onClick={() => onReplay(msg.id, msg.ttsMetadata)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30 transition-all"
            style={{ minWidth: '32px', minHeight: '32px' }}
            title="Replay with voice"
          >
            <Volume2 className="w-3 h-3" />
          </button>
        )}

        {/* DACO 006 P1 — per-response feedback */}
        {isAssistant && (
          <FeedbackButtons
            messageId={msg.id}
            personaId="glyphbot"
            responseText={msg.content}
          />
        )}

        {/* Provider badge for assistant messages */}
        {isAssistant && msg.providerId && msg.providerId !== 'unknown' && (
          <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-2">
            <span className="text-[9px] text-slate-500 font-mono">{msg.providerId}</span>
            {msg.latencyMs && (
              <span className="text-[9px] text-slate-600 font-mono">{msg.latencyMs}ms</span>
            )}
          </div>
        )}
      </div>

      {!isAssistant && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-purple-400/40 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-purple-300" />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.msg.id === nextProps.msg.id &&
    prevProps.msg.content === nextProps.msg.content &&
    prevProps.isAssistant === nextProps.isAssistant
  );
});

export default ChatMessage;