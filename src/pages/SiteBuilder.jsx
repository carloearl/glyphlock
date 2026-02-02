import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Send, 
  Code, 
  Hammer, 
  Zap,
  Terminal,
  FileCode,
  Database,
  Layout as LayoutIcon,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Upload
} from 'lucide-react';
import HoverTooltip from '@/components/ui/HoverTooltip';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';
import ReactMarkdown from 'react-markdown';
import DevModeLayout from '@/components/devengine/DevModeLayout';
import AgentBrainPanel from '@/components/devengine/AgentBrainPanel';
import DeployPanel from '@/components/devengine/DeployPanel';
import HelpPanel from '@/components/global/HelpPanel';

export default function SiteBuilder() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('chat');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState('visual');
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const safeMessages = Array.isArray(messages) ? messages : [];

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadUser = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        toast.error('Please sign in to use Site Builder');
        window.location.href = '/';
        return;
      }
      const userData = await base44.auth.me();
      
      const authorizedUsers = ['carloearl@glyphlock.com', 'carloearl@gmail.com'];
      const isAuthorized = userData.role === 'admin' || authorizedUsers.includes(userData.email);
      
      if (!isAuthorized) {
        toast.error('Site Builder access denied. Contact admin for access.');
        window.location.href = '/';
        return;
      }
      
      setUser(userData);
      await initConversation();
    } catch (error) {
      console.error('Auth error:', error);
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
        metadata: {
          name: 'Site Builder Session',
          description: 'Building GlyphLock site'
        }
      });
      
      setConversation(conv);
      const initialMessages = Array.isArray(conv.messages) ? conv.messages : [];
      setMessages(initialMessages);
      
      const unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        if (data && data.messages) {
          const newMessages = Array.isArray(data.messages) ? data.messages : [];
          setMessages(newMessages);
        }
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Failed to init conversation:', error);
      toast.error('Failed to initialize agent');
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !conversation) return;

    const modePrefix = mode === 'plan' ? '[PLAN MODE] ' : mode === 'code' ? '[CODE MODE] ' : '';
    const userMessage = {
      role: 'user',
      content: modePrefix + input
    };

    const prevMessages = Array.isArray(messages) ? messages : [];
    setMessages([...prevMessages, userMessage]);
    setInput('');
    setSending(true);

    try {
      await base44.agents.addMessage(conversation, userMessage);
      toast.success('Agent responding...');
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
      const currentMessages = Array.isArray(messages) ? messages : [];
      setMessages([...currentMessages, {
        role: 'assistant',
        content: 'Error: ' + error.message
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        let fileType = 'document';
        if (file.type.startsWith('image/')) fileType = 'image';
        if (file.name.match(/\.(js|jsx|ts|tsx|json|css)$/)) fileType = 'code';
        
        formData.append('type', fileType);

        const response = await base44.functions.invoke('siteBuilderUpload', formData);
        uploaded.push(response.data.file);
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setUploadedFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = null;
  };

  const removeFile = (fileUrl) => {
    setUploadedFiles(prev => prev.filter(f => f.url !== fileUrl));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-indigo-950/20 to-black">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white">Initializing Site Builder Agent...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Site Builder Agent | GlyphLock Development Console"
        description="Autonomous AI agent that can build and modify your entire GlyphLock site"
      />
      
      <HelpPanel
        title="Site Builder Guide"
        sections={[
          {
            title: 'Overview',
            content: [
              { heading: 'What This Does', text: 'AI agent that builds and modifies site components, pages, entities, and backend functions. Operates in three modes: Chat (discuss), Plan (architect), Code (execute).' },
              { heading: 'How to Use', text: 'Select a mode. Type your request. Agent responds with analysis or executes changes. Review tool calls to see what was modified.' },
              { heading: 'Admin Only', text: 'Site Builder requires admin privileges. Dev Engine, Agent Brain, and Deploy panels are restricted to authorized emails.' }
            ]
          },
          {
            title: 'Modes',
            content: [
              { heading: 'Chat Mode', text: 'Discuss ideas, get explanations, ask questions. No code changes are executed. Use for learning and planning.' },
              { heading: 'Plan Mode', text: 'Strategic analysis, architecture design, implementation roadmaps. Agent outlines approach without executing changes.' },
              { heading: 'Code Mode', text: 'Execute code changes. Agent creates files, modifies components, updates entities. Changes are applied immediately to codebase.' }
            ]
          },
          {
            title: 'File Uploads',
            content: [
              { heading: 'Attach Files', text: 'Click paperclip icon to upload images, code files, or documents. Agent can analyze uploaded files for context.' },
              { heading: 'Supported Formats', text: 'Images (PNG, JPG), code (JS, JSX, JSON, CSS), documents (PDF, TXT). Max 10MB per file.' }
            ]
          }
        ]}
      />

      <div className="min-h-screen bg-gradient-to-br from-black via-indigo-950/20 to-black">
        <div className="border-b border-blue-500/20 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                  <Hammer className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Site Builder Agent</h1>
                  <p className="text-sm text-blue-300">Autonomous Full-Stack Development Assistant</p>
                </div>
                </div>
                <div className="flex items-center gap-3">
                {isAdmin && (
                  <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('visual')}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'visual'
                          ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      VISUAL
                    </button>
                    <button
                      onClick={() => setViewMode('dev')}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'dev'
                          ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-4 h-4" />
                      DEV ENGINE
                    </button>
                    <button
                      onClick={() => setViewMode('brain')}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'brain'
                          ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      AGENT BRAIN
                    </button>
                    <button
                      onClick={() => setViewMode('deploy')}
                      className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                        viewMode === 'deploy'
                          ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      DEPLOY
                    </button>
                  </div>
                )}
                {viewMode === 'visual' && (
                  <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setMode('chat')}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                      mode === 'chat'
                        ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    💬 CHAT
                  </button>
                  <button
                    onClick={() => setMode('plan')}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                      mode === 'plan'
                        ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📋 PLAN
                  </button>
                  <button
                    onClick={() => setMode('code')}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                      mode === 'code'
                        ? 'bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ⚡ CODE
                  </button>
                </div>
                )}
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
                </div>
            </div>
          </div>
        </div>

        {viewMode === 'dev' && isAdmin ? (
          <div className="h-[calc(100vh-120px)]">
            <DevModeLayout />
          </div>
        ) : viewMode === 'dev' && !isAdmin ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400">Dev Engine is admin-only.</p>
            </div>
          </div>
        ) : viewMode === 'brain' && isAdmin ? (
          <div className="container mx-auto px-4 pt-6 pb-6 h-[calc(100vh-140px)]">
            <AgentBrainPanel />
          </div>
        ) : viewMode === 'deploy' && isAdmin ? (
          <div className="container mx-auto px-4 pt-6 pb-6 h-[calc(100vh-140px)]">
            <DeployPanel />
          </div>
        ) : (viewMode === 'brain' || viewMode === 'deploy') && !isAdmin ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400">Agent Brain is admin-only.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="container mx-auto px-3 md:px-4 pt-4 md:pt-6">
          <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl border-2 transition-all" style={{
            background: mode === 'chat' ? 'rgba(59,130,246,0.1)' : mode === 'plan' ? 'rgba(99,102,241,0.1)' : 'rgba(139,92,246,0.1)',
            borderColor: mode === 'chat' ? 'rgba(59,130,246,0.3)' : mode === 'plan' ? 'rgba(99,102,241,0.3)' : 'rgba(139,92,246,0.3)'
          }}>
            {mode === 'chat' && (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="text-sm md:text-base text-white font-bold">Chat Mode Active</h3>
                  <p className="text-xs md:text-sm text-blue-300">Discuss, explain, and get guidance without executing code changes</p>
                </div>
              </div>
            )}
            {mode === 'plan' && (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="text-sm md:text-base text-white font-bold">Plan Mode Active</h3>
                  <p className="text-xs md:text-sm text-indigo-300">Strategic thinking, architecture analysis, and implementation roadmaps</p>
                </div>
              </div>
            )}
            {mode === 'code' && (
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl md:text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-sm md:text-base text-white font-bold">Code Mode Active</h3>
                  <p className="text-xs md:text-sm text-violet-300">Execute changes, create files, and modify codebase (⚠️ admin only)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="container mx-auto px-3 md:px-4 mb-6">
          <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-white/5 border-indigo-500/30 hover:border-indigo-500/60 transition-all cursor-pointer group" onClick={() => window.location.href = '/SiteAudit'}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
                    <Shield className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Site Intelligence</h3>
                    <p className="text-xs text-indigo-300">SIE • Audit & Security</p>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mb-4">System-wide auditor for structure, performance, security, SEO, and feature readiness.</p>
                <div className="flex items-center text-xs font-bold text-indigo-400 uppercase tracking-wider group-hover:underline">
                  Open Module <span className="ml-1">→</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
            <Card className="bg-white/5 border-blue-500/20">
              <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <FileCode className="w-5 h-5 md:w-5 md:h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-blue-300 font-bold">Components</p>
                  <p className="text-xs md:text-sm text-white hidden md:block">Create & Modify</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-indigo-500/20">
              <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <LayoutIcon className="w-5 h-5 md:w-5 md:h-5 text-indigo-400" />
                <div>
                  <p className="text-xs text-indigo-300 font-bold">Pages</p>
                  <p className="text-xs md:text-sm text-white hidden md:block">Full Page Builder</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-violet-500/20">
              <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <Database className="w-5 h-5 md:w-5 md:h-5 text-violet-400" />
                <div>
                  <p className="text-xs text-violet-300 font-bold">Entities</p>
                  <p className="text-xs md:text-sm text-white hidden md:block">Schema Design</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-fuchsia-500/20">
              <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                <Terminal className="w-5 h-5 md:w-5 md:h-5 text-fuchsia-400" />
                <div>
                  <p className="text-xs text-fuchsia-300 font-bold">Functions</p>
                  <p className="text-xs md:text-sm text-white hidden md:block">Backend APIs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/5 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.2)]">
            <CardHeader className="border-b border-blue-500/20 p-3 md:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-sm md:text-base">
                <Code className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                Development Console
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea 
                ref={scrollRef}
                className="h-[400px] md:h-[500px] p-3 md:p-6 space-y-3 md:space-y-4"
              >
                {safeMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Build</h3>
                    <p className="text-blue-300 mb-6">Tell me what you want to create or modify</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      <button
                        onClick={() => setInput('Create a new dashboard page with analytics cards')}
                        className="p-4 rounded-xl bg-white/5 border border-blue-500/20 hover:border-blue-500/40 transition-all text-left"
                      >
                        <Code className="w-5 h-5 text-blue-400 mb-2" />
                        <p className="text-sm text-white font-semibold">Create Dashboard</p>
                        <p className="text-xs text-blue-300">New analytics page</p>
                      </button>
                      <button
                        onClick={() => setInput('Add a new entity for tracking user sessions')}
                        className="p-4 rounded-xl bg-white/5 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-left"
                      >
                        <Database className="w-5 h-5 text-indigo-400 mb-2" />
                        <p className="text-sm text-white font-semibold">Create Entity</p>
                        <p className="text-xs text-indigo-300">New database schema</p>
                      </button>
                      <button
                        onClick={() => setInput('Fix the mobile navigation menu - buttons not working')}
                        className="p-4 rounded-xl bg-white/5 border border-violet-500/20 hover:border-violet-500/40 transition-all text-left"
                      >
                        <Zap className="w-5 h-5 text-violet-400 mb-2" />
                        <p className="text-sm text-white font-semibold">Fix Bugs</p>
                        <p className="text-xs text-violet-300">Debug and repair</p>
                      </button>
                      <button
                        onClick={() => setInput('Refactor the authentication flow for better security')}
                        className="p-4 rounded-xl bg-white/5 border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all text-left"
                      >
                        <RefreshCw className="w-5 h-5 text-fuchsia-400 mb-2" />
                        <p className="text-sm text-white font-semibold">Refactor Code</p>
                        <p className="text-xs text-fuchsia-300">Improve architecture</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  safeMessages.map((msg, idx) => (
                    <MessageBubble key={idx} message={msg} />
                  ))
                )}
                {sending && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Agent processing...</span>
                  </div>
                )}
              </ScrollArea>

              <div className="border-t border-blue-500/20 p-3 md:p-4 bg-white/5">
                {uploadedFiles.length > 0 && (
                  <div className="mb-2 md:mb-3 flex flex-wrap gap-2">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-blue-500/20 min-h-[44px]">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                        )}
                        <span className="text-xs md:text-sm text-white truncate max-w-[120px] md:max-w-[150px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(file.url)}
                          className="text-red-400 hover:text-red-300 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.txt,.js,.jsx,.json,.css"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="flex gap-2 md:hidden">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || sending}
                      variant="outline"
                      className="flex-1 bg-white/5 border-blue-500/20 hover:bg-white/10 min-h-[48px]"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
                      ) : (
                        <Paperclip className="w-5 h-5 text-blue-400 mr-2" />
                      )}
                      <span className="text-sm">Attach Files</span>
                    </Button>
                  </div>

                  <HoverTooltip content="Upload files to attach to your message">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || sending}
                      variant="outline"
                      className="hidden md:flex bg-white/5 border-blue-500/20 hover:bg-white/10 min-h-[48px] min-w-[48px]"
                    >
                      {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                      ) : (
                        <Upload className="w-5 h-5 text-blue-400" />
                      )}
                    </Button>
                  </HoverTooltip>

                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      mode === 'chat' ? 'Ask a question or discuss the codebase...' :
                      mode === 'plan' ? 'Describe what you want to plan or architect...' :
                      'Describe the code changes to execute...'
                    }
                    className="flex-1 bg-white/5 border-blue-500/20 text-white placeholder:text-blue-300/50 text-base min-h-[80px] md:min-h-[60px] max-h-[200px]"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white min-h-[48px] min-w-[48px] md:px-8"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin md:mr-0" />
                        <span className="ml-2 md:hidden">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 md:mr-0" />
                        <span className="ml-2 md:hidden">Send</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs md:text-xs text-blue-300 mt-2">
                  <span className="hidden md:inline">Press Enter to send • Shift + Enter for new line • </span>
                  Attach images & code files
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}
      </div>
    </>
  );
}

function MessageBubble({ message }) {
  if (!message) return null;
  
  const isUser = message.role === 'user';
  const hasToolCalls = message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl p-4 ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white' 
          : 'bg-white/10 backdrop-blur-md border border-white/10 text-white'
      }`}>
        {message.content && (
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none"
            components={{
              code: ({ inline, children }) => inline ? (
                <code className="px-1.5 py-0.5 rounded bg-black/30 text-cyan-300 text-xs font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-black/50 rounded-lg p-3 overflow-x-auto text-xs">
                  <code className="text-green-400 font-mono">{children}</code>
                </pre>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}

        {hasToolCalls && (
          <div className="mt-3 space-y-2">
            {(message.tool_calls || []).map((tool, idx) => (
              <ToolCallCard key={idx} toolCall={tool} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
          <Clock className="w-3 h-3" />
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

function ToolCallCard({ toolCall }) {
  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
    }
  };

  return (
    <div className="bg-black/30 rounded-lg p-3 border border-blue-500/20">
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="text-xs font-mono text-blue-300">{toolCall.name}</span>
      </div>
      {toolCall.results && (
        <div className="text-xs text-green-400 font-mono mt-2">
          {typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results, null, 2)}
        </div>
      )}
    </div>
  );
}