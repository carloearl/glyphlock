// DACO DIRECTIVE 006 §4 — minimum viable, read-only feedback analytics.
// Admin-only. REAL mode only by default (F-2 guard — DEMO/SANDBOX excluded).
// Phase 1 scope: feedback metrics only. Telemetry sections arrive in Phase 2.

import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, ShieldAlert, Loader2, Bot } from 'lucide-react';
import { FEEDBACK_CONFIG } from '@/lib/glyphbot/feedbackConfig';

export default function BotAnalytics() {
  const [authorized, setAuthorized] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        // §4 — manager role or above; platform admin qualifies
        const ok = user && (user.role === 'admin');
        setAuthorized(!!ok);
        if (ok) {
          // F-2 guard: REAL mode only by default
          const data = await base44.entities.BotFeedback.filter(
            { mode: FEEDBACK_CONFIG.ANALYTICS_DEFAULT_MODE }, '-created_date', 500
          );
          setRows(data || []);
        }
      } catch {
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading feedback analytics…
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-3">
        <ShieldAlert className="w-10 h-10 text-rose-400" />
        <p className="text-sm">Admin access required for GlyphBot analytics.</p>
      </div>
    );
  }

  const total = rows.length;
  const ups = rows.filter((r) => r.rating === 'up').length;
  const upPct = total ? Math.round((ups / total) * 100) : 0;

  const byPersona = {};
  for (const r of rows) {
    const p = r.persona_id || 'unknown';
    byPersona[p] = byPersona[p] || { up: 0, down: 0 };
    byPersona[p][r.rating === 'up' ? 'up' : 'down'] += 1;
  }

  const downComments = rows.filter((r) => r.rating === 'down' && r.feedback_text);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="w-6 h-6 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-white">GlyphBot Feedback Analytics</h1>
          <p className="text-xs text-slate-400">
            DACO 006 §4 — REAL mode only (DEMO/SANDBOX excluded per F-2) · {total} ratings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 uppercase">Total Ratings</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{total}</div></CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 uppercase">Positive</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400 flex items-center gap-2">
              {upPct}% <ThumbsUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-xs text-slate-400 uppercase">Negative</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-rose-400 flex items-center gap-2">
              {total - ups} <ThumbsDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-sm text-white">Per-Persona Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {Object.keys(byPersona).length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}
          {Object.entries(byPersona).map(([p, c]) => (
            <div key={p} className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
              <span className="text-slate-200 font-mono">{p}</span>
              <div className="flex gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">▲ {c.up}</Badge>
                <Badge className="bg-rose-500/20 text-rose-300 border-rose-400/30">▼ {c.down}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-sm text-white">Down-Vote Comments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {downComments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
          {downComments.map((r) => (
            <div key={r.id} className="text-sm border border-white/10 rounded-lg p-3 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-slate-400 text-[10px]">{r.persona_id}</Badge>
                <span className="text-[10px] text-slate-500">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</span>
              </div>
              <p className="text-rose-200">{r.feedback_text}</p>
              {r.response_preview && (
                <p className="text-[11px] text-slate-500 mt-1 italic line-clamp-2">Response: {r.response_preview}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}