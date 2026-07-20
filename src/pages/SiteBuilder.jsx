import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2, Send, Code, Hammer, Zap, Terminal, FileCode,
  Database, Layout as LayoutIcon, Sparkles, Shield,
  CheckCircle2, AlertCircle, Clock, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import DevModeLayout from '@/components/devengine/DevModeLayout';
import AgentBrainPanel from '@/components/devengine/AgentBrainPanel';
import DeployPanel from '@/components/devengine/DeployPanel';

export default function SiteBuilder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('chat');
  const [viewMode, setViewMode] = useState('visual');
  const scrollRef = useRef(null);

  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => { loadUser(); }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { toast.error('Please sign in'); window.location.href = '/'; return; }
      const userData = await base44.auth.me();
      const authorizedUsers = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];
      const isAuthorized = userData.role === 'admin' || authorizedUsers.includes(userData.email);
      if (!isAuthorized) { toast.error('Access denied'); window.location.href = '/'; return; }
      setUser(userData);
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user && (user.role === 'admin' || ['carloearl@glyphlock.com', 'carloearl@gmail.com'].includes(user.email));

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'siteBuilder',
        metadata: { name: 'Site Builder Session', description: 'Building GlyphLock site' }
      });
      setConversation(conv);
      setMessages(Array.isArray(conv.messages) ? conv.messages : []);
      base44.agents.subscribeToConversation(conv.id, (data) => {
        if (data?.messages) setMessages(Array.isArray(data.messages) ? data.messages : []);
      });
      return conv;
    } catch (error) {
      toast.error('Failed to initialize agent');
      setMessages([]);
    }
  };

  const ensureConversation = async () => {
    if (conversation) return conversation;
    const conv = await initConversation();
    return conv;
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const modePrefix = mode === 'plan' ? '[PLAN MODE] ' : mode === 'code' ? '[CODE MODE] ' : '';
    const userMessage = { role: 'user', content: modePrefix + input };
    setMessages(prev => [...(Array.isArray(prev) ? prev : []), userMessage]);
    setInput('');
    setSending(true);
    try {
      const activeConversation = await ensureConversation();
      if (!activeConversation) {
        toast.error('Failed to initialize agent');
        return;
      }
      await base44.agents.addMessage(activeConversation, userMessage);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Initializing Site Builder Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-indigo-950/20 to-black">
      {/* Header */}
      <div className="border-b border-blue-500/20 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Hammer className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Site Builder Agent</h1>
                <p className="text-xs text-blue-300">Autonomous Full-Stack Development</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  {[['visual','VISUAL',Sparkles,'bg-blue-500'],['dev','DEV ENGINE',Code,'bg-indigo-500'],['brain','AGENT BRAIN',Zap,'bg-violet-500'],['deploy','DEPLOY',Sparkles,'bg-green-500']].map(([vm, label, Icon, activeCls]) => (
                    <button key={vm} onClick={() => setViewMode(vm)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === vm ? `${activeCls} text-white` : 'text-gray-400 hover:text-white'}`}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>
              )}
              {viewMode === 'visual' && (
                <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                  {[['chat','💬 CHAT'],['plan','📋 PLAN'],['code','⚡ CODE']].map(([m, label]) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === m ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />Active
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* View Routing */}
      {viewMode === 'dev' && isAdmin ? (
        <div className="h-[calc(100vh-120px)]"><DevModeLayout /></div>
      ) : viewMode === 'brain' && isAdmin ? (
        <div className="container mx-auto px-4 pt-6 h-[calc(100vh-140px)]"><AgentBrainPanel /></div>
      ) : viewMode === 'deploy' && isAdmin ? (
        <div className="container mx-auto px-4 pt-6 h-[calc(100vh-140px)]"><DeployPanel /></div>
      ) : (viewMode !== 'visual') && !isAdmin ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
            <p className="text-slate-400">This panel is admin-only.</p>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-6 pb-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              [FileCode, 'border-blue-500/20', 'text-blue-400', 'text-blue-300', 'Site Audits', 'Security · Perf · SEO · UX'],
              [LayoutIcon, 'border-indigo-500/20', 'text-indigo-400', 'text-indigo-300', 'Integrity Scans', 'Nav · Routes · Sitemaps'],
              [Database, 'border-violet-500/20', 'text-violet-400', 'text-violet-300', 'Scan History', 'Trends & Comparisons'],
              [Terminal, 'border-fuchsia-500/20', 'text-fuchsia-400', 'text-fuchsia-300', 'Fix Plans', 'Prioritized by Severity'],
            ].map(([Icon, borderCls, iconCls, titleCls, title, sub]) => (
              <Card key={title} className={`bg-white/5 ${borderCls}`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${iconCls} flex-shrink-0`} />
                  <div>
                    <p className={`text-xs ${titleCls} font-bold`}>{title}</p>
                    <p className="text-xs text-white hidden md:block">{sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chat */}
          <Card className="bg-white/5 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
            <CardHeader className="border-b border-blue-500/20 p-4">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Code className="w-4 h-4 text-blue-400" />
                Development Console — {mode.toUpperCase()} MODE
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea ref={scrollRef} className="h-[450px] p-4 space-y-3">
                {safeMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Site Builder Agent Ready</h3>
                    <p className="text-blue-300 mb-6">Runs real site audits and integrity scans, reads past results, and delivers prioritized fix plans</p>
                    <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                      {[
                        [Code, 'border-blue-500/20 hover:border-blue-500/40', 'text-blue-400', 'text-blue-300', 'Run Site Audit', 'Full AI audit', 'Run a full site audit and give me the top issues by severity'],
                        [Database, 'border-indigo-500/20 hover:border-indigo-500/40', 'text-indigo-400', 'text-indigo-300', 'Integrity Scan', 'Live health check', 'Run a live integrity scan of navigation, routes, and sitemaps'],
                        [Zap, 'border-violet-500/20 hover:border-violet-500/40', 'text-violet-400', 'text-violet-300', 'Latest Findings', 'Nightly Guardian', 'Summarize the latest nightly Site Guardian results and any critical findings'],
                        [RefreshCw, 'border-fuchsia-500/20 hover:border-fuchsia-500/40', 'text-fuchsia-400', 'text-fuchsia-300', 'Fix Plan', 'Prioritized actions', 'Build a prioritized fix plan from the most recent audit findings'],
                      ].map(([Icon, borderCls, iconCls, subCls, title, sub, prompt]) => (
                        <button key={title} onClick={() => setInput(prompt)}
                          className={`p-4 rounded-xl bg-white/5 border ${borderCls} transition-all text-left`}>
                          <Icon className={`w-5 h-5 ${iconCls} mb-2`} />
                          <p className="text-sm text-white font-semibold">{title}</p>
                          <p className={`text-xs ${subCls}`}>{sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  safeMessages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)
                )}
                {sending && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Agent processing...</span>
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-blue-500/20 p-4 bg-white/5">
                <div className="flex gap-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={mode === 'chat' ? 'Ask a question or discuss...' : mode === 'plan' ? 'Describe what to plan...' : 'Describe the code changes to execute...'}
                    className="flex-1 bg-white/5 border-blue-500/20 text-white placeholder:text-blue-300/50 min-h-[60px]"
                    disabled={sending}
                  />
                  <Button onClick={sendMessage} disabled={!input.trim() || sending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white min-w-[48px]">
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </div>
                <p className="text-xs text-blue-300 mt-2">Scans & reports run live • code changes always require your explicit approval</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  if (!message) return null;
  const isUser = message.role === 'user';
  const hasToolCalls = message.tool_calls?.length > 0;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] rounded-2xl p-4 ${isUser ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' : 'bg-white/10 border border-white/10 text-white'}`}>
        {message.content && (
          <ReactMarkdown className="prose prose-invert prose-sm max-w-none"
            components={{
              code: ({ inline, children }) => inline
                ? <code className="px-1.5 py-0.5 rounded bg-black/30 text-cyan-300 text-xs font-mono">{children}</code>
                : <pre className="bg-black/50 rounded-lg p-3 overflow-x-auto text-xs"><code className="text-green-400 font-mono">{children}</code></pre>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
            }}>
            {message.content}
          </ReactMarkdown>
        )}
        {hasToolCalls && (
          <div className="mt-3 space-y-2">
            {message.tool_calls.map((tool, idx) => (
              <div key={idx} className="bg-black/30 rounded-lg p-3 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  {tool.status === 'completed' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : tool.status === 'failed' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                  <span className="text-xs font-mono text-blue-300">{tool.name}</span>
                </div>
                {tool.results && <div className="text-xs text-green-400 font-mono mt-1 overflow-x-auto">{typeof tool.results === 'string' ? tool.results : JSON.stringify(tool.results, null, 2)}</div>}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 mt-2 text-xs opacity-50">
          <Clock className="w-3 h-3" />{new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}