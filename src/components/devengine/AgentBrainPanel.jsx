import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BrainCircuit, Send, Loader2, CheckCircle2, AlertCircle, Clock, Zap, Paperclip, X, Image as ImageIcon, FileText, Upload, Save, FolderOpen, Trash2, Star, Play, Code, FileCode, Terminal, Copy } from 'lucide-react';
import HoverTooltip from '@/components/ui/HoverTooltip';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AgentBrainPanel() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [mode, setMode] = useState('build');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [plan, setPlan] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [savedConversations, setSavedConversations] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [savingConversation, setSavingConversation] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionPlan, setExecutionPlan] = useState(null);
  const [activeChangeSetId, setActiveChangeSetId] = useState(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  // Safety guards - ensure arrays are always valid
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safePlan = Array.isArray(plan) ? plan : [];

  useEffect(() => {
    loadSavedConversations();
  }, []);

  async function loadSavedConversations() {
    setSavedConversations([]);
  }

  async function saveConversation() {
    if (!conversation) return;
    
    const title = prompt('Enter conversation title:', `Agent Brain - ${new Date().toLocaleString()}`);
    if (!title) return;

    setSavingConversation(true);
    try {
      const { data } = await base44.functions.invoke('conversationSave', {
        conversation_id: conversation.id,
        title,
        agent_name: 'siteBuilder',
        mode: 'brain',
        mode_subtype: mode,
        messages: safeMessages,
        metadata: { mode }
      });
      
      if (data.success) {
        toast.success('Conversation saved!');
        await loadSavedConversations();
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save conversation');
    } finally {
      setSavingConversation(false);
    }
  }

  async function loadConversation(storageId) {
    try {
      const { data } = await base44.functions.invoke('conversationLoad', { storage_id: storageId });
      if (data.success && data.conversation) {
        setMessages(data.conversation.messages || []);
        setMode(data.conversation.mode_subtype || 'build');
        setShowSaved(false);
        toast.success('Conversation loaded!');
      }
    } catch (error) {
      console.error('Load failed:', error);
      toast.error('Failed to load conversation');
    }
  }

  async function deleteConversation(storageId) {
    if (!confirm('Delete this conversation?')) return;
    
    try {
      const { data } = await base44.functions.invoke('conversationDelete', { storage_id: storageId });
      if (data.success) {
        toast.success('Conversation deleted');
        await loadSavedConversations();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete conversation');
    }
  }

  useEffect(() => {
    // Auto-scroll to bottom when messages update
    const scrollToBottom = () => {
      if (scrollRef.current) {
        const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    };
    
    // Immediate scroll
    scrollToBottom();
    
    // Delayed scroll for content that loads async (images, markdown rendering)
    const timer = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timer);
  }, [safeMessages, sending]);

  useEffect(() => {
    // Extract plan from latest assistant message
    if (!Array.isArray(messages) || messages.length === 0) return;
    
    const lastAssistant = [...messages].reverse().find(m => m && m.role === 'assistant');
    if (lastAssistant && lastAssistant.content) {
      const steps = extractPlanSteps(lastAssistant.content);
      if (Array.isArray(steps) && steps.length > 0) {
        setPlan(steps);
      }
    }
  }, [messages]);

  const initConversation = async () => {
    try {
      const conv = await base44.agents.createConversation({
        agent_name: 'siteBuilder',
        metadata: {
          name: 'Agent Brain Session',
          description: 'GlyphLock Site Builder Agent Brain'
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
      console.error('Failed to init agent:', error);
      toast.error('Failed to initialize Agent Brain');
      setMessages([]);
    }
  };

  const extractPlanSteps = (content) => {
    const lines = content.split('\n');
    const steps = [];
    let stepNumber = 1;
    
    for (const line of lines) {
      // Match numbered lists: 1. or 1) or - or * 
      if (/^\s*(\d+[.)]\s+|-\s+|\*\s+)/.test(line)) {
        const cleanLine = line.replace(/^\s*(\d+[.)]\s+|-\s+|\*\s+)/, '').trim();
        if (cleanLine.length > 0) {
          steps.push({
            id: stepNumber++,
            label: cleanLine.slice(0, 80),
            status: 'pending'
          });
        }
      }
    }
    
    return steps;
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];

    try {
      for (const file of files) {
        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          const fileUrl = result?.file_url || result?.data?.file_url;
          
          if (fileUrl) {
            uploaded.push({
              name: file.name,
              url: fileUrl,
              type: file.type
            });
            toast.success(`✓ ${file.name}`);
          } else {
            throw new Error('No file URL returned');
          }
        } catch (error) {
          console.error('Upload failed:', error);
          toast.error(`✗ ${file.name}`);
        }
      }

      setUploadedFiles(prev => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = null;
    }
  };

  const removeFile = (fileUrl) => {
    setUploadedFiles(prev => prev.filter(f => f.url !== fileUrl));
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    let activeConversation = conversation;
    if (!activeConversation) {
      await initConversation();
      activeConversation = conversation;
    }

    if (!activeConversation) return;

    const userInput = input.trim();
    const fileUrls = uploadedFiles.map(f => f.url);
    
    const userMessage = {
      role: 'user',
      content: userInput,
      ...(fileUrls.length > 0 && { file_urls: fileUrls })
    };

    const prevMessages = Array.isArray(messages) ? messages : [];
    setMessages([...prevMessages, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setSending(true);

    try {
      // All modes route to the live agent. The agent's own instructions
      // enforce its scope (scan / read / report — no code mutation), so the
      // mode prefix is only a context hint, not a trust boundary.
      const modePrefix = `[${mode.toUpperCase()} MODE] `;
      const agentMessage = {
        role: 'user',
        content: modePrefix + userInput,
        ...(fileUrls.length > 0 && { file_urls: fileUrls })
      };

      await base44.agents.addMessage(activeConversation, agentMessage);
    } catch (error) {
      console.error('Send error:', error);
      toast.error('Failed to send message');
      setMessages(prev => [...prev, {
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

  const getModeConfig = () => {
    const configs = {
      explain: { color: 'bg-cyan-500', label: 'Explain', icon: '💡', desc: 'Analysis & answers' },
      build: { color: 'bg-blue-500', label: 'Build', icon: '🔨', desc: 'Plan & generate' },
      refactor: { color: 'bg-indigo-500', label: 'Refactor', icon: '♻️', desc: 'Restructure plan' },
      debug: { color: 'bg-red-500', label: 'Debug', icon: '🐛', desc: 'Diagnose issues' }
    };
    return configs[mode] || configs.build;
  };

  const modeConfig = getModeConfig();

  return (
    <div className="h-full flex flex-col md:flex-row gap-3 md:gap-4 p-3 md:p-4 overflow-hidden">
      {/* Left: Mode Selector & Plan */}
      <div className="w-full md:w-80 flex flex-col gap-3 md:gap-4 flex-shrink-0">
        {/* Mode Selector */}
        <Card className="bg-white/5 border-blue-500/20">
          <CardHeader className="pb-3 border-b border-blue-500/20">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
              Agent Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-1 gap-2 pt-3">
            {['explain', 'build', 'refactor', 'debug'].map(m => {
              const config = {
                explain: { color: 'bg-cyan-500', icon: '💡', tooltip: 'Ask questions and get analysis' },
                build: { color: 'bg-blue-500', icon: '🔨', tooltip: 'Plan builds and generate code suggestions' },
                refactor: { color: 'bg-indigo-500', icon: '♻️', tooltip: 'Plan refactors and restructure code' },
                debug: { color: 'bg-red-500', icon: '🐛', tooltip: 'Diagnose errors and suggest fixes' }
              }[m];
              return (
                <HoverTooltip key={m} content={config.tooltip} side="right">
                  <button
                    onClick={() => setMode(m)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all min-h-[48px] ${
                      mode === m
                        ? `${config.color} text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]`
                        : 'bg-white/5 text-blue-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-2">{config.icon}</span>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                </HoverTooltip>
              );
            })}
          </CardContent>
        </Card>

        {/* Plan Steps */}
        {safePlan.length > 0 && (
          <Card className="bg-white/5 border-indigo-500/20 flex-1 hidden md:flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-indigo-500/20 flex-shrink-0">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <span className="text-lg">📋</span>
                Agent Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-2 pr-3">
                  {safePlan.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {step.status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                        {step.status === 'active' && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                        {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-white/90 leading-relaxed">
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right: Chat Interface */}
      <Card className="flex-1 bg-white/5 border-blue-500/20 flex flex-col overflow-hidden">
        <CardHeader className="border-b border-blue-500/20 flex-shrink-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 md:gap-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${modeConfig.color}/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]`}>
                  <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold">Agent Brain</div>
                  <div className="text-xs text-blue-300 font-normal">
                    {modeConfig.icon} {modeConfig.label} Mode
                  </div>
                </div>
              </CardTitle>
              <div className="flex items-center gap-2">
                <HoverTooltip content="Save this conversation for later">
                  <Button
                    onClick={saveConversation}
                    disabled={savingConversation || safeMessages.length === 0}
                    size="sm"
                    variant="outline"
                    className="border-green-500/50 text-green-400 hover:bg-green-500/10 min-h-[40px] min-w-[40px]"
                  >
                    {savingConversation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </HoverTooltip>
                <HoverTooltip content="Load a saved conversation">
                  <Button
                    onClick={() => setShowSaved(!showSaved)}
                    size="sm"
                    variant="outline"
                    className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 min-h-[40px] min-w-[40px]"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </Button>
                </HoverTooltip>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
          {/* Saved Conversations Panel */}
          {showSaved && (
            <div className="border-b border-blue-500/20 bg-white/5 p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Saved Conversations ({savedConversations.length})
              </h3>
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-3">
                  {savedConversations.map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-blue-500/20 hover:bg-white/10 transition-colors">
                      <button
                        onClick={() => loadConversation(conv.id)}
                        className="flex-1 text-left"
                      >
                        <div className="text-sm text-white font-semibold">{conv.title}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(conv.last_message_at).toLocaleString()} • {conv.mode_subtype}
                        </div>
                      </button>
                      <HoverTooltip content="Delete conversation">
                        <Button
                          onClick={() => deleteConversation(conv.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </HoverTooltip>
                    </div>
                  ))}
                  {savedConversations.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No saved conversations</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="p-3 md:p-4 space-y-3 md:space-y-4 min-h-full">
              {safeMessages.length === 0 ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center px-4 max-w-2xl">
                  <BrainCircuit className="w-12 h-12 md:w-16 md:h-16 text-blue-400 mx-auto mb-4 opacity-50 animate-pulse" />
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">🚀 Agent Brain Ready</h3>
                  <p className="text-sm md:text-base text-blue-300/80 mb-2">
                    Mode: <span className="font-bold">{modeConfig.label}</span> {modeConfig.icon}
                  </p>
                  <p className="text-xs text-green-400/80 mb-2">
                    ✅ Connected to the Site Builder agent
                  </p>
                  <p className="text-xs text-blue-300/60 mb-6">
                    The agent scans, reads, and reports — code changes still need your approval
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors">
                  <div className="text-sm text-white font-semibold mb-1">💡 Explain</div>
                  <p className="text-xs text-cyan-300">
                    Ask questions • Get analysis
                  </p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors">
                  <div className="text-sm text-white font-semibold mb-1">🔨 Build</div>
                  <p className="text-xs text-blue-300">
                    Plan builds • Generate suggestions
                  </p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 transition-colors">
                  <div className="text-sm text-white font-semibold mb-1">♻️ Refactor</div>
                  <p className="text-xs text-indigo-300">
                    Plan refactors • Restructure code
                  </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/15 transition-colors">
                  <div className="text-sm text-white font-semibold mb-1">🐛 Debug</div>
                  <p className="text-xs text-red-300">
                    Diagnose errors • Suggest fixes
                  </p>
                  </div>
                  </div>
                  </div>
                </div>
              ) : (
                safeMessages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} />
                ))
              )}
              {(sending || isExecuting) && (
                <div className="flex items-center gap-2 text-blue-400 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {isExecuting ? '⚠️ Reporting only...' : 'Agent processing...'}
                  </span>
                </div>
              )}
              
              {/* Generated Code / Patch Bundle */}
              {generatedCode && (
                <div className="p-4 rounded-xl bg-green-500/10 border-2 border-green-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-green-400" />
                      <span className="text-sm font-bold text-green-300">
                        {generatedCode.filePath === 'PATCH_BUNDLE' ? '📦 Deployment Package Ready' : `Generated: ${generatedCode.filePath}`}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode.code);
                        toast.success(generatedCode.filePath === 'PATCH_BUNDLE' 
                          ? '📦 Patch bundle copied! Paste to Base44 AI and say "apply these changes"' 
                          : 'Copied! Paste to Base44 AI chat to deploy.');
                      }}
                      size="sm"
                      className="bg-green-500/20 text-green-300 hover:bg-green-500/30"
                    >
                      <Copy className="w-4 h-4 mr-1" /> Copy All
                    </Button>
                  </div>
                  <ScrollArea className="max-h-96 bg-black/40 rounded-lg">
                    <pre className="text-xs text-green-400 p-3">
                      {generatedCode.code}
                    </pre>
                  </ScrollArea>
                  <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-blue-300 font-semibold mb-1">📋 Next Steps:</p>
                    <ol className="text-xs text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Click "Copy All" button above</li>
                      <li>Go to main Base44 AI chat (bottom right)</li>
                      <li>Paste the entire bundle</li>
                      <li>Say "apply these changes"</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-blue-500/20 p-3 md:p-4 bg-white/5 backdrop-blur-sm flex-shrink-0">
            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 border border-blue-500/20 min-h-[44px]">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className="text-xs text-white truncate max-w-[120px]">{file.name}</span>
                    <button
                      onClick={() => removeFile(file.url)}
                      className="text-red-400 hover:text-red-300 p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.js,.jsx,.json,.css,.ts,.tsx"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <HoverTooltip content="Upload images, code files, or documents to attach to your message">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  variant="outline"
                  className="bg-white/5 border-blue-500/20 hover:bg-white/10 min-h-[48px] min-w-[48px]"
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
                placeholder={`${modeConfig.icon} ${modeConfig.label}...`}
                className="flex-1 bg-white/5 border-blue-500/20 text-white placeholder:text-blue-300/40 resize-none min-h-[80px] md:min-h-[60px] text-sm md:text-base"
                disabled={sending}
              />
              <HoverTooltip content="Send message to Agent Brain (Enter to send, Shift+Enter for new line)">
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-[0_0_20px_rgba(59,130,246,0.3)] min-w-[48px] min-h-[48px] px-4 md:px-6"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </HoverTooltip>
            </div>
            <p className="text-xs text-blue-300/50 mt-2">
              <span className="hidden md:inline">📎 Attach files • Manual-only mode • no auto-fix execution</span>
              <span className="md:hidden">📎 Attach • Manual-only</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MessageBubble({ message }) {
  if (!message) return null;
  
  const isUser = message.role === 'user';
  const hasToolCalls = message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0;

  return (
    <div className={`flex gap-2 md:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Zap className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] md:max-w-[75%] rounded-xl p-3 md:p-4 ${
        isUser 
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
          : 'bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-lg'
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

        <div className={`flex items-center gap-1 mt-2 text-xs ${isUser ? 'opacity-60' : 'opacity-40'}`}>
          <Clock className="w-3 h-3" />
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
          <span className="text-sm">👤</span>
        </div>
      )}
    </div>
  );
}

function ToolCallCard({ toolCall }) {
  if (!toolCall) return null;
  
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

  const getStatusColor = () => {
    switch (toolCall.status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/10';
      case 'failed':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  return (
    <div className={`rounded-lg p-3 border ${getStatusColor()} transition-colors`}>
      <div className="flex items-center gap-2 mb-2">
        {getStatusIcon()}
        <span className="text-xs font-mono text-blue-300 font-semibold">{toolCall.name}</span>
      </div>
      {toolCall.results && (
        <div className="text-xs text-green-400/90 font-mono mt-2 bg-black/30 rounded p-2 overflow-x-auto">
          <pre className="whitespace-pre-wrap break-words">
            {typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}