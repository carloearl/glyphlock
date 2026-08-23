import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, X, Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWriteGateway';
import { cn } from '@/lib/utils';

export default function FeedbackWidget({ 
  messageId, 
  providerId, 
  model, 
  persona,
  latencyMs,
  promptSnippet,
  responseSnippet,
  onFeedbackSubmitted 
}) {
  const [rating, setRating] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRating = async (newRating) => {
    if (submitted) return;
    setRating(newRating);
    
    // If negative, show text input for more context
    if (newRating === 'negative') {
      setShowTextInput(true);
    } else {
      // Positive rating submits immediately
      await submitFeedback(newRating, '');
    }
  };

  const submitFeedback = async (ratingValue, text) => {
    setSubmitting(true);
    try {
      await glyphlockWrite('llm_feedback_submit', {
        feedback: {
          conversation_id: messageId,
          provider_id: providerId || 'unknown',
          model: model || 'unknown',
          persona: persona || 'GENERAL',
          rating: ratingValue,
          feedback_text: text || '',
          response_latency_ms: latencyMs || 0,
        },
        intent: 'submit_llm_feedback_without_prompt_content',
      });
      
      setSubmitted(true);
      setShowTextInput(false);
      onFeedbackSubmitted?.(ratingValue, text);
    } catch (err) {
      console.error('Feedback submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextSubmit = async () => {
    await submitFeedback(rating, feedbackText);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-emerald-400 animate-in fade-in">
        <Check className="w-3.5 h-3.5" />
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Rate response</span>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 rounded-full transition-all",
            rating === 'positive' 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
              : "text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
          )}
          onClick={() => handleRating('positive')}
          disabled={submitting}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-7 p-0 rounded-full transition-all",
            rating === 'negative' 
              ? "bg-red-500/20 text-red-400 border border-red-500/40" 
              : "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          )}
          onClick={() => handleRating('negative')}
          disabled={submitting}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </Button>

        {!showTextInput && rating !== 'positive' && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-slate-500 hover:text-cyan-400"
            onClick={() => setShowTextInput(true)}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Add comment
          </Button>
        )}
      </div>

      {showTextInput && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900/60 border border-slate-800/60 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">What could be better?</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-slate-500 hover:text-slate-300"
              onClick={() => {
                setShowTextInput(false);
                if (rating === 'negative') setRating(null);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          
          <Textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us how we can improve..."
            className="min-h-[60px] text-sm bg-slate-950/50 border-slate-700/50 resize-none"
            maxLength={500}
          />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{feedbackText.length}/500</span>
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-cyan-600 hover:bg-cyan-500"
              onClick={handleTextSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <span className="animate-pulse">Sending...</span>
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}