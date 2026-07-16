// DACO DIRECTIVE 006 Phase 1 §1.2 — thumbs up/down on every bot message.
// Rating submits on tap (never blocks the user); down-vote shows a
// dismissible one-line "What went wrong?" follow-up. Subtle icon state
// change on submit — no toasts, no chat interruption.

import React, { useState, useRef } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { submitBotFeedback, attachFeedbackComment, getOrCreateConversationId } from '@/lib/glyphbot/submitBotFeedback';

export default function FeedbackButtons({ messageId, personaId = 'glyphbot', responseText = '' }) {
  const [rating, setRating] = useState(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [commentSent, setCommentSent] = useState(false);
  const recordIdRef = useRef(null);

  const rate = (r) => {
    if (rating) return; // one rating per message per session
    setRating(r);
    if (r === 'down') setShowComment(true);
    submitBotFeedback({
      conversationId: getOrCreateConversationId(personaId),
      messageId, personaId, rating: r, responseText,
    }).then((res) => { recordIdRef.current = res?.value?.id || null; })
      .catch(() => { /* feedback must never break chat */ });
  };

  const sendComment = () => {
    const text = comment.trim();
    setShowComment(false);
    setCommentSent(true);
    if (!text) return;
    if (recordIdRef.current) {
      attachFeedbackComment({ recordId: recordIdRef.current, feedbackText: text }).catch(() => {});
    } else {
      submitBotFeedback({
        conversationId: getOrCreateConversationId(personaId),
        messageId, personaId, rating: 'down', feedbackText: text, responseText,
      }).catch(() => {});
    }
  };

  return (
    <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => rate('up')}
        disabled={!!rating}
        title="Helpful"
        style={{ minWidth: '28px', minHeight: '28px', touchAction: 'manipulation' }}
        className={`p-1 rounded-md border transition-all flex items-center justify-center ${
          rating === 'up'
            ? 'bg-emerald-500/25 border-emerald-400/60 text-emerald-300'
            : 'bg-white/5 border-white/10 text-slate-500 hover:text-emerald-300 hover:border-emerald-400/40 disabled:opacity-40'
        }`}
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        onClick={() => rate('down')}
        disabled={!!rating}
        title="Not helpful"
        style={{ minWidth: '28px', minHeight: '28px', touchAction: 'manipulation' }}
        className={`p-1 rounded-md border transition-all flex items-center justify-center ${
          rating === 'down'
            ? 'bg-rose-500/25 border-rose-400/60 text-rose-300'
            : 'bg-white/5 border-white/10 text-slate-500 hover:text-rose-300 hover:border-rose-400/40 disabled:opacity-40'
        }`}
      >
        <ThumbsDown className="w-3 h-3" />
      </button>

      {showComment && !commentSent && (
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendComment()}
            placeholder="What went wrong? (optional)"
            maxLength={1000}
            autoFocus
            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-400/40"
          />
          <button
            onClick={sendComment}
            style={{ minWidth: '28px', minHeight: '28px', touchAction: 'manipulation' }}
            className="p-1 rounded-md text-slate-500 hover:text-white flex items-center justify-center"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}