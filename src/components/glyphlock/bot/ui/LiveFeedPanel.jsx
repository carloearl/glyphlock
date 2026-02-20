import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Shield, Newspaper, TrendingUp, Brain, 
  RefreshCw, ExternalLink, AlertTriangle, Clock, 
  ChevronDown, ChevronUp, X, Loader2 
} from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/40',
  HIGH: 'text-amber-400 bg-amber-500/15 border-amber-500/40',
  MEDIUM: 'text-blue-400 bg-blue-500/15 border-blue-500/40',
  LOW: 'text-slate-400 bg-slate-500/15 border-slate-500/40'
};

function TimeAgo({ ts }) {
  if (!ts) return null;
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return <span>{hrs}h ago</span>;
  return <span>{Math.floor(hrs / 24)}d ago</span>;
}

function FeedSection({ icon: Icon, title, color, children, updatedAt, error, collapsed, onToggle }) {
  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-xs font-bold uppercase tracking-wider text-white">{title}</span>
          {error && <AlertTriangle className="w-3 h-3 text-amber-400" />}
        </div>
        <div className="flex items-center gap-2">
          {updatedAt && (
            <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              <TimeAgo ts={updatedAt} />
            </span>
          )}
          {collapsed ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronUp className="w-3 h-3 text-slate-500" />}
        </div>
      </button>
      {!collapsed && (
        <div className="px-3 py-2 space-y-1.5 bg-white/[0.01]">
          {error ? (
            <div className="text-[10px] text-amber-400/80 py-2 text-center">Feed unavailable — {error}</div>
          ) : children}
        </div>
      )}
    </div>
  );
}

function CVEItem({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2 rounded-md hover:bg-white/[0.03] transition-colors group"
    >
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 mt-0.5 ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.LOW}`}>
        {item.severity}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-cyan-300 mb-0.5">{item.id}</div>
        <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
      </div>
      <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1" />
    </a>
  );
}

function NewsItem({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2 rounded-md hover:bg-white/[0.03] transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-slate-500">{item.source}</span>
          {item.published && (
            <span className="text-[9px] text-slate-600 font-mono">
              <TimeAgo ts={item.published} />
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 mt-1" />
    </a>
  );
}

export default function LiveFeedPanel({ isOpen, onClose }) {
  const [feeds, setFeeds] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [intelLoading, setIntelLoading] = useState(false);
  const [intelQuery, setIntelQuery] = useState('');
  const [collapsed, setCollapsed] = useState({ threat: false, security: false, market: false, intel: false });

  const fetchFeeds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('liveFeed', { action: 'feeds' });
      setFeeds(res.data);
    } catch (e) {
      console.error('[LiveFeed] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIntelligence = useCallback(async (query) => {
    setIntelLoading(true);
    try {
      const res = await base44.functions.invoke('liveFeed', { action: 'intelligence', query: query || undefined });
      setIntelligence(res.data?.intelligence);
    } catch (e) {
      console.error('[LiveFeed] Intel error:', e);
    } finally {
      setIntelLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && !feeds) {
      fetchFeeds();
    }
  }, [isOpen, feeds, fetchFeeds]);

  const toggleSection = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full border-l border-white/5 bg-slate-950/80 backdrop-blur-md w-80 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">Live Feed</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchFeeds}
            disabled={loading}
            className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            style={{ touchAction: 'manipulation' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            style={{ touchAction: 'manipulation' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Feeds */}
      <div className="flex-1 overflow-y-auto chat-scroll-container p-2 space-y-2">
        {loading && !feeds ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
                <div className="h-8 rounded bg-white/[0.03] animate-pulse" />
                <div className="h-8 rounded bg-white/[0.03] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* THREAT INTEL */}
            <FeedSection
              icon={Shield}
              title="Threat Intel"
              color="text-red-400"
              updatedAt={feeds?.threatIntel?.updatedAt}
              error={feeds?.threatIntel?.error}
              collapsed={collapsed.threat}
              onToggle={() => toggleSection('threat')}
            >
              {feeds?.threatIntel?.items?.map((item, i) => (
                <CVEItem key={item.id || i} item={item} />
              ))}
              {feeds?.threatIntel?.items?.length === 0 && (
                <div className="text-[10px] text-slate-500 py-2 text-center">No recent CVEs</div>
              )}
            </FeedSection>

            {/* SECURITY NEWS */}
            <FeedSection
              icon={Newspaper}
              title="Security News"
              color="text-cyan-400"
              updatedAt={feeds?.securityNews?.updatedAt}
              error={feeds?.securityNews?.error}
              collapsed={collapsed.security}
              onToggle={() => toggleSection('security')}
            >
              {feeds?.securityNews?.items?.map((item, i) => (
                <NewsItem key={i} item={item} />
              ))}
              {feeds?.securityNews?.items?.length === 0 && (
                <div className="text-[10px] text-slate-500 py-2 text-center">No recent news</div>
              )}
            </FeedSection>

            {/* MARKET INTEL */}
            <FeedSection
              icon={TrendingUp}
              title="Market Intel"
              color="text-emerald-400"
              updatedAt={feeds?.marketIntel?.updatedAt}
              error={feeds?.marketIntel?.error}
              collapsed={collapsed.market}
              onToggle={() => toggleSection('market')}
            >
              {feeds?.marketIntel?.items?.map((item, i) => (
                <NewsItem key={i} item={item} />
              ))}
              {feeds?.marketIntel?.items?.length === 0 && (
                <div className="text-[10px] text-slate-500 py-2 text-center">No recent market news</div>
              )}
            </FeedSection>

            {/* AI INTELLIGENCE */}
            <FeedSection
              icon={Brain}
              title="Intelligence"
              color="text-purple-400"
              updatedAt={intelligence?.updatedAt}
              error={intelligence?.error}
              collapsed={collapsed.intel}
              onToggle={() => toggleSection('intel')}
            >
              {intelligence?.content ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border border-emerald-500/40 bg-emerald-500/15 text-emerald-400">
                      Live Intelligence
                    </span>
                    <span className="text-[9px] text-slate-500">{intelligence.source}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {intelligence.content}
                  </div>
                  {intelligence.citations?.length > 0 && (
                    <div className="pt-1.5 border-t border-white/5 space-y-1">
                      <span className="text-[8px] text-slate-500 uppercase tracking-wider font-bold">Sources</span>
                      {intelligence.citations.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 truncate"
                        >
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500">
                    Ask a question or get a daily briefing. Free sources checked first, AI used as fallback.
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      value={intelQuery}
                      onChange={e => setIntelQuery(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !intelLoading) fetchIntelligence(intelQuery); }}
                      placeholder="Ask or press briefing..."
                      className="flex-1 text-[10px] px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/10 text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:outline-none"
                      style={{ minHeight: '32px', fontSize: '11px' }}
                    />
                    <button
                      onClick={() => fetchIntelligence(intelQuery)}
                      disabled={intelLoading}
                      className="px-2 py-1.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-semibold hover:bg-purple-500/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                      style={{ touchAction: 'manipulation', minHeight: '32px' }}
                    >
                      {intelLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Brief'}
                    </button>
                  </div>
                </div>
              )}
              {intelligence?.content && (
                <button
                  onClick={() => { setIntelligence(null); setIntelQuery(''); }}
                  className="text-[9px] text-slate-500 hover:text-slate-300 mt-1 transition-colors"
                  style={{ touchAction: 'manipulation' }}
                >
                  Ask another question →
                </button>
              )}
            </FeedSection>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between text-[8px] text-slate-600">
          <span>Sources: NIST NVD · RSS · Perplexity</span>
          <span>Cache: 5m news / 15m intel</span>
        </div>
      </div>
    </div>
  );
}