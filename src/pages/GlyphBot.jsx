import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UI, Logic, Config } from '@/components/glyphlock/bot';
import ChatMessageMemo from '@/components/glyphlock/bot/ui/ChatMessageMemo';
import ChatErrorBoundary from '@/components/glyphlock/bot/ui/ChatErrorBoundary';
import SEOHead from '@/components/SEOHead';
import { base44 } from '@/api/base44Client';
import { Activity, Shield, Bot, AlertTriangle, X, PanelRightOpen, PanelRightClose, Menu, ChevronDown } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { injectSoftwareSchema } from '@/components/utils/seoHelpers';
import HelpPanel from '@/components/global/HelpPanel';
import useTTSClean from '@/components/glyphlock/bot/logic/useTTSClean';

const { 
  useGlyphBotPersistence, 
  useGlyphBotAudit, 
  glyphbotClient, 
  GlyphProviderChain 
} = Logic;

const { 
  STORAGE_KEYS, 
  LIMITS, 
  WELCOME_MESSAGE 
} = Config;

const MAX_MESSAGES = LIMITS.MAX_MESSAGES;
const SAVE_SETTINGS_THRESHOLD = LIMITS.SAVE_SETTINGS_THRESHOLD;

export default function GlyphBotPage() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [persona, setPersona] = useState('GENERAL');
  const [provider, setProvider] = useState('AUTO');
  const [isSending, setIsSending] = useState(false);
  const [chatCount, setChatCount] = useState(0);
  const [showTrimWarning, setShowTrimWarning] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAuditHistory, setShowAuditHistory] = useState(false);
  const [selectedAuditView, setSelectedAuditView] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isProcessingAudit, setIsProcessingAudit] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('none');
  const [showLiveFeed, setShowLiveFeed] = useState(false);

  const [modes, setModes] = useState({
    voice: false,
    live: false,
    audit: false,
    test: false,
    json: false,
    struct: false,
    panel: false
  });

  const [lastMeta, setLastMeta] = useState(null);
  const [providerMeta, setProviderMeta] = useState(null);
  const chatContainerRef = useRef(null);
  
  // Phase 7: TTS settings state with ENHANCED CONTROLS
  const [voiceSettings, setVoiceSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('glyphbot_voice_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load voice settings:', e);
    }
    return {
      voiceProfile: 'neutral_female',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      bass: 0,
      clarity: 0,
      emotion: 'neutral',
      provider: 'auto'
    };
  });

  // GLYPHLOCK: Canonical TTS Hook (rebuilt 2026-02-14)
  const { 
    playText, 
    stop: stopTTS, 
    isSpeaking, 
    isLoading: ttsLoading,
    lastError: ttsError,
    settings: ttsSettings,
    updateSettings: updateTTSSettings,
    testTTS
  } = useTTSClean(voiceSettings);

  // Phase 7C: Voice profiles and emotions (static defaults)
  const voiceProfiles = [
    { id: 'neutral_female', label: 'Nova (Neutral Female)' },
    { id: 'neutral_male', label: 'Onyx (Neutral Male)' },
    { id: 'warm_female', label: 'Shimmer (Warm Female)' },
    { id: 'warm_male', label: 'Echo (Warm Male)' },
    { id: 'professional_female', label: 'Alloy (Professional)' },
    { id: 'professional_male', label: 'Fable (Storyteller)' }
  ];
  const emotionPresets = [
    { id: 'neutral', label: 'Neutral' },
    { id: 'excited', label: 'Excited' },
    { id: 'calm', label: 'Calm' },
    { id: 'confident', label: 'Confident' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'professional', label: 'Professional' },
    { id: 'empathetic', label: 'Empathetic' },
    { id: 'energetic', label: 'Energetic' },
    { id: 'authoritative', label: 'Authoritative' },
    { id: 'whisper', label: 'Whisper' },
    { id: 'intense', label: 'Intense' }
  ];

  // Persistence hook - Phase 5
  const {
    currentChatId,
    savedChats,
    isLoading: persistenceLoading,
    fullHistory,
    trackMessage,
    initializeHistory,
    saveChat,
    archiveChat,
    loadChat,
    startNewChat,
    loadSavedChats,
    getArchivedChats,
    unarchiveChat,
    deleteChat
  } = useGlyphBotPersistence(currentUser);

  // Phase 6: Audit hook
  const {
    audits,
    isLoading: auditsLoading,
    createAudit,
    updateAudit,
    getAudit,
    deleteAudit,
    archiveAudit,
    unarchiveAudit,
    runAudit,
    loadAudits,
    loadArchivedAudits
  } = useGlyphBotAudit(currentUser);

  // Load current user
  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          console.log('[GlyphBot] Current user loaded:', user?.email || 'no email');
          setCurrentUser(user);
        } else {
          console.warn('[GlyphBot] User not authenticated');
        }
      } catch (e) {
        console.error('[GlyphBot] Auth check failed:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const cleanup = injectSoftwareSchema(
      'GlyphBot AI Security Assistant',
      '24/7 AI assistant for cybersecurity analysis, threat detection, code auditing, and real-time security monitoring',
      '/glyphbot',
      [
        'AI Security Analysis',
        'Code Auditing',
        'Threat Detection',
        'Real-Time Web Search',
        'File Analysis',
        'Security Reporting',
        'Voice Synthesis',
        'Multi-Provider LLM Chain'
      ]
    );
    return cleanup;
  }, []);

  // Only load chat if user explicitly selects one from history
  // Don't auto-load - always start fresh



  // Auto-trim messages when exceeding MAX_MESSAGES
  useEffect(() => {
    if (messages.length > MAX_MESSAGES + 1 && !isSending) { // +1 for welcome message
      const trimmedMessages = [
        WELCOME_MESSAGE,
        ...messages.slice(-MAX_MESSAGES)
      ];
      setMessages(trimmedMessages);
      setShowTrimWarning(true);
      setTimeout(() => setShowTrimWarning(false), 4000);
    }
  }, [messages, isSending]);

  // Save settings after SAVE_SETTINGS_THRESHOLD chats
  useEffect(() => {
    if (chatCount > 0 && chatCount % SAVE_SETTINGS_THRESHOLD === 0) {
      try {
        const settingsToSave = {
          persona,
          provider,
          modes: { voice: modes.voice, live: modes.live, audit: modes.audit },
          voiceSettings: {
          speed: voiceSettings.speed,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume,
          bass: voiceSettings.bass,
          clarity: voiceSettings.clarity
          }
        };
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settingsToSave));
        localStorage.setItem(STORAGE_KEYS.CHAT_COUNT, chatCount.toString());
        console.log(`[GlyphBot] Settings saved after ${chatCount} chats`);
      } catch (e) {
        console.warn('Failed to save settings:', e);
      }
    }
  }, [chatCount, persona, provider, modes, voiceSettings]);

  // Auto-scroll chat
  useEffect(() => {
    const el = chatContainerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages, isSending]);

  const handleSend = useCallback(async (files = []) => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const newUserMsg = { 
      id: `user-${Date.now()}`, 
      role: 'user', 
      content: trimmed,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsSending(true);
    
    // Track user message for full history persistence
    trackMessage(newUserMsg);

    try {
      const response = await glyphbotClient.sendMessage(updatedMessages, {
        persona,
        auditMode: modes.audit,
        oneTestMode: modes.test,
        realTime: modes.live,
        tts: modes.voice,
        enforceGlyphFormat: true,
        formatOverride: true,
        systemFirst: true,
        provider: provider === 'AUTO' ? null : provider,
        autoProvider: provider === 'AUTO',
        jsonModeForced: modes.json,
        structuredMode: modes.struct
      });

      // Extract text from response (handle both data object and direct string)
      let botText = '';
      if (response.text) {
        botText = response.text;
      } else if (response.data?.text) {
        botText = response.data.text;
      } else if (typeof response.data === 'string') {
        botText = response.data;
      } else if (typeof response === 'string') {
        botText = response;
      }
      
      if (!botText) {
        botText = '[No response received - check console for details]';
        console.error('[GlyphBot] Empty response:', response);
      }
      
      console.log('[GlyphBot] Response received:', { botText, fullResponse: response });

      const botMsg = { 
        id: `bot-${Date.now()}`,
        role: 'assistant', 
        content: botText,
        audit: response.audit || response.data?.audit || null,
        providerId: response.providerUsed || response.data?.providerUsed || 'unknown',
        latencyMs: response.meta?.providerStats?.[response.providerUsed]?.lastLatencyMs || response.data?.latencyMs,
        ttsMetadata: modes.voice ? {
          voiceProfile: voiceSettings.voiceProfile,
          pitch: voiceSettings.pitch,
          speed: voiceSettings.speed,
          bass: voiceSettings.bass,
          clarity: voiceSettings.clarity,
          volume: voiceSettings.volume,
          emotion: voiceSettings.emotion
        } : null
      };
      
      setMessages(prev => [...prev, botMsg]);
      trackMessage(botMsg);

      setChatCount(prev => {
        const newCount = prev + 1;
        localStorage.setItem(STORAGE_KEYS.CHAT_COUNT, newCount.toString());
        return newCount;
      });

      // CRITICAL: Extract actual provider from response
      const actualProvider = response.providerUsed || response.data?.providerUsed || response.meta?.providerUsed || 'unknown';
      const actualProviderLabel = response.providerLabel || response.data?.providerLabel || response.meta?.providerLabel || actualProvider;
      
      console.log('[GlyphBot] Provider used:', actualProvider, actualProviderLabel);
      
      setLastMeta({
        model: response.model || actualProviderLabel,
        providerUsed: actualProvider,
        providerLabel: actualProviderLabel,
        realTimeUsed: response.realTimeUsed,
        shouldSpeak: response.shouldSpeak
      });

      if (modes.voice && botText) {
        // CRITICAL: Stop any previous audio before auto-speaking new response
        stopTTS();
        // Read latest voiceSettings from localStorage to avoid stale closure
        let latestVoiceSettings = voiceSettings;
        try {
          const saved = localStorage.getItem('glyphbot_voice_settings');
          if (saved) latestVoiceSettings = JSON.parse(saved);
        } catch (e) { /* use state value */ }
        console.log('[GlyphBot] Auto-speaking with voice settings:', latestVoiceSettings);
        playText(botText, latestVoiceSettings).catch(e => {
          console.warn('[TTS Auto-speak]', e);
        });
      }

      if (response.meta) {
        // Update providerMeta with actual provider info
        const updatedMeta = {
          ...response.meta,
          providerUsed: actualProvider,
          providerLabel: actualProviderLabel
        };
        setProviderMeta(updatedMeta);
        sessionStorage.setItem('glyphbot_provider_meta', JSON.stringify(updatedMeta));
      }

    } catch (err) {
      const errorMsg = { 
        id: `err-${Date.now()}`, 
        role: 'assistant', 
        content: `⚠️ **Error**: ${err?.message || 'Connection failed'}\n\nPlease try again or check the Provider Console for details.`,
        audit: null,
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
      trackMessage(errorMsg);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, messages, persona, provider, modes, playText, trackMessage, voiceSettings]);

  const handleStop = () => setIsSending(false);

  const handleRegenerate = () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) setInput(lastUserMsg.content);
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
    setLastMeta(null);
    startNewChat();
  };

  const handleSaveChat = useCallback(async () => {
    try {
      const result = await saveChat(messages, { provider, persona });
      toast.success('Chat saved');
      return result;
    } catch (err) {
      toast.error(err.message || 'Save failed');
      return null;
    }
  }, [messages, saveChat, provider, persona]);

  // Handle load chat from history
  const handleLoadChat = useCallback(async (chatId) => {
    const result = await loadChat(chatId);
    if (result?.messages) {
      // Use visibleMessages for UI, full messages stored in fullHistory
      const messagesToDisplay = result.visibleMessages || result.messages.slice(-10);
      setMessages([WELCOME_MESSAGE, ...messagesToDisplay.filter(m => m.id !== 'welcome-1')]);
      if (result.persona) setPersona(result.persona);
      if (result.provider) setProvider(result.provider);
    }
  }, [loadChat]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    handleClear();
  }, []);

  // Handle import chat
  const handleImportChat = useCallback(async (importedMessages) => {
    if (!importedMessages || importedMessages.length === 0) {
      toast.error('No messages in imported file');
      return;
    }
    
    setMessages([WELCOME_MESSAGE, ...importedMessages]);
    toast.success(`Imported ${importedMessages.length} messages`);
  }, []);

  // Phase 6: Handle audit start
  const handleStartAudit = useCallback(async (auditData) => {
    setIsProcessingAudit(true);
    
    console.log('[GlyphBot] Starting audit:', auditData);

    try {
      // Create audit record
      const audit = await createAudit(auditData);
      if (!audit) {
        toast.error('Failed to create audit');
        setIsProcessingAudit(false);
        return;
      }

      const auditId = audit.id || audit._id || audit.entity_id;

      // Channel-specific message
      const channelLabel = auditData.targetType === 'business' 
        ? 'Business Security' 
        : auditData.targetType === 'person' 
          ? 'People Background' 
          : 'Government Agency';

      // Add initial message to chat
      const startMsg = {
        id: `audit-start-${Date.now()}`,
        role: 'assistant',
        content: `🔍 Starting ${auditData.auditMode} ${channelLabel} Audit for **${auditData.targetIdentifier}**...\n\nAudit ID: ${auditId}\n${auditData.notes ? `\nFocus: ${auditData.notes}\n` : ''}\nSearching web, scraping public data, analyzing patterns...`,
        audit: null
      };
      setMessages(prev => [...prev, startMsg]);
      trackMessage(startMsg);

      // Update audit status
      await updateAudit(auditId, { status: 'IN_PROGRESS' });

      // Build channel-specific audit prompt using web search
      const auditPrompt = await runAudit(auditId, auditData);
      
      if (!auditPrompt) {
        throw new Error('Failed to build audit prompt');
      }

      console.log('[GlyphBot] Audit prompt built, sending to LLM...');

      // Send placeholder message and prepare for structured JSON response
      const auditRequestMsg = {
        id: `audit-req-${Date.now()}`,
        role: 'user',
        content: auditPrompt
      };

      // Send to LLM with REAL-TIME WEB SEARCH enabled
      // usePuter: false forces main chain with real web search capability
      const response = await glyphbotClient.sendMessage([...messages, startMsg, auditRequestMsg], {
        persona: 'SECURITY',
        auditMode: true,
        realTime: true,
        usePuter: false,
        jsonModeForced: true,
        structuredMode: true,
        provider: provider === 'AUTO' ? null : provider
      });
      
      console.log('[GlyphBot] LLM response received:', response);

      let auditResults = {};
      try {
        auditResults = typeof response.text === 'string' 
          ? JSON.parse(response.text)
          : response.text;
      } catch {
        auditResults = {
          target: auditData.targetIdentifier,
          targetType: auditData.targetType,
          auditMode: auditData.auditMode,
          overallGrade: 'N/A',
          riskScore: 0,
          summary: response.text || 'Audit completed but results format was unexpected.',
          technicalFindings: [],
          businessRisks: [],
          fixPlan: []
        };
      }

      // Update audit with results
      await updateAudit(auditId, {
        status: 'COMPLETE',
        findings: JSON.stringify(auditResults),
        summary: auditResults.summary || 'Audit completed',
        riskScore: auditResults.riskScore || auditResults.severityScore || 0,
        overallGrade: auditResults.overallGrade || 'N/A'
      });

      // Add completion message
      const completeMsg = {
        id: `audit-complete-${Date.now()}`,
        role: 'assistant',
        content: `✅ **${channelLabel} Audit Complete**\n\n**Target:** ${auditData.targetIdentifier}\n**Channel:** ${auditData.targetType.toUpperCase()}\n**Mode:** ${auditData.auditMode}\n**Grade:** ${auditResults.overallGrade}\n**Risk Score:** ${auditResults.riskScore || 0}/100\n\n**Summary:** ${auditResults.summary}\n\n**Findings:** ${auditResults.technicalFindings?.length || 0} issues identified\n**Business Risks:** ${auditResults.businessRisks?.length || 0} risks flagged\n**Fix Plan:** ${auditResults.fixPlan?.length || 0} action items\n\n_View full report in Audit History panel._`,
        audit: null
      };
      setMessages(prev => [...prev, completeMsg]);
      trackMessage(completeMsg);

      // Phase 7C: Auto-speak if voice mode is on
      if (modes.voice) {
        const voiceSummary = `${channelLabel} audit complete for ${auditData.targetIdentifier}. Overall grade ${auditResults.overallGrade}. Risk score ${auditResults.riskScore || 0} out of 100. ${auditResults.summary}`;
        playText(voiceSummary);
      }

      // Refresh audit list
      await loadAudits();

      console.log('[GlyphBot Phase6] Audit completed:', auditId);
    } catch (err) {
      console.error('[GlyphBot Phase6] Audit failed:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `audit-err-${Date.now()}`,
          role: 'assistant',
          content: '❌ Audit failed due to an error. Please try again.',
          audit: null
        }
      ]);
    } finally {
      setIsProcessingAudit(false);
    }
  }, [createAudit, updateAudit, messages, trackMessage, glyphbotClient, provider, modes.voice, playText, loadAudits]);

  // Phase 6: View audit from history
  const handleViewAudit = useCallback((audit) => {
    setSelectedAuditView(audit);
  }, []);

  // Phase 6/7C: Play audit summary via TTS
  const handlePlayAuditSummary = useCallback(() => {
    if (selectedAuditView?.summary) {
      const channelLabel = selectedAuditView.targetType === 'business' 
        ? 'Business security' 
        : selectedAuditView.targetType === 'person' 
          ? 'People background' 
          : 'Government agency';
      const voiceText = `${channelLabel} audit for ${selectedAuditView.targetIdentifier || selectedAuditView.targetUrl}. Overall grade ${selectedAuditView.overallGrade}. ${selectedAuditView.summary}`;
      playText(voiceText);
    }
  }, [selectedAuditView, playText]);

  // Phase 6: Archive audit from report view
  const handleArchiveAudit = useCallback(async (auditId) => {
    const success = await archiveAudit(auditId);
    if (success) {
      toast.success('Audit archived');
      setSelectedAuditView(null);
    } else {
      toast.error('Failed to archive audit');
    }
  }, [archiveAudit]);

  // Phase 6: Download audit report (JSON fallback)
  const handleDownloadAudit = useCallback((audit) => {
    const dataStr = JSON.stringify(audit, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `glyphbot_audit_${audit.targetIdentifier?.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON audit report downloaded');
  }, []);

  const handleToggleMode = (key) => {
    if (key === 'voice' && modes.voice) {
      try {
        stopTTS();
      } catch (e) {
        console.warn('[TTS Stop]', e);
      }
    }
    if (key === 'live') {
      setShowLiveFeed(prev => !prev);
    }
    setModes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReplayWithSettings = useCallback((messageId, ttsSettings) => {
    if (!messageId) return;
    const msg = messages.find(m => m && m.id === messageId);
    if (msg?.content) {
      try {
        playText(msg.content, ttsSettings || voiceSettings);
      } catch (e) {
        console.warn('[TTS Replay]', e);
      }
    }
  }, [messages, playText, voiceSettings]);

  // Build providers for display
  const providers = providerMeta?.availableProviders?.map(p => ({
    id: p.id,
    label: p.label,
    active: p.enabled,
    error: p.stats?.failureCount > 0 && p.stats?.successCount === 0
  })) || [];

  // CRITICAL: Use actual lastMeta.providerLabel if available, otherwise fallback
  const currentProviderLabel = lastMeta?.providerLabel || providers.find(p => p.id === (lastMeta?.providerUsed || provider))?.label || 'Awaiting Response...';

  return (
    <>
    <HelpPanel
      title="GlyphBot Guide"
      autoPopup={true}
      sections={[
        {
          title: 'Overview',
          content: [
            { heading: 'What GlyphBot Does', text: 'AI assistant for cybersecurity analysis, code auditing, threat detection, and general technical questions. Can search the web in real-time and analyze files.' },
            { heading: 'How to Use', text: 'Type your question or request in the input field. GlyphBot responds using AI models. Enable voice mode for audio responses. Enable live mode for real-time web search.' },
            { heading: 'Persona Modes', text: 'GENERAL (all topics), SECURITY (cybersecurity focus), CODER (code analysis), CASUAL (friendly tone). Select based on your needs.' }
          ]
        },
        {
          title: 'Features',
          content: [
            { heading: 'Voice Mode', text: 'Toggle voice icon to enable text-to-speech. Adjust speed, pitch, emotion, and voice profile in settings. GlyphBot reads responses aloud.' },
            { heading: 'Live Mode', text: 'Enable real-time web search for current information. GlyphBot searches Google, analyzes sources, and provides up-to-date answers.' },
            { heading: 'Audit Mode', text: 'Run comprehensive security audits on websites, businesses, or individuals. Open audit panel to configure and start audits. Results saved to history.' },
            { heading: 'Provider Selection', text: 'AUTO (recommended): chains multiple AI providers for best results. Manual: select specific provider (Gemini, OpenAI, etc.).' }
          ]
        },
        {
          title: 'Saving & History',
          content: [
            { heading: 'Auto-Save', text: 'Settings and preferences save automatically every 5 chats. Chat history persists in browser storage.' },
            { heading: 'Manual Save', text: 'Click History panel > Save Chat to store conversation permanently. Name your chats for easy retrieval.' },
            { heading: 'Load Chat', text: 'Open History panel. Click any saved chat to restore it. Archived chats available in separate tab.' }
          ]
        }
      ]}
    />
    <div className="min-h-screen text-white flex flex-col pt-16 pb-0 relative" style={{ color: '#ffffff', background: 'transparent', zIndex: 200, position: 'relative', pointerEvents: 'auto' }}>
      <SEOHead 
        title="GlyphBot - AI Security Assistant | GlyphLock"
        description="Chat with GlyphBot, your AI security assistant for code auditing, blockchain analysis, threat detection, and debugging."
        url="/glyphbot"
      />
      
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Main Console Container */}
        <div className="flex-1 flex flex-col bg-transparent border-x border-white/5 overflow-hidden" style={{ position: 'relative', zIndex: 300, pointerEvents: 'auto' }}>
          
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-transparent backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-300" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">GlyphBot</h1>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="text-emerald-400">Online</span>
                  {lastMeta?.providerLabel && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span>{lastMeta.providerLabel}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentUser && (
                <>
                  <button
                    onClick={() => setShowAuditPanel(!showAuditPanel)}
                    style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      showAuditPanel 
                        ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Audit</span>
                  </button>
                  <button
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      showHistoryPanel
                        ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {showHistoryPanel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">History</span>
                  </button>
                </>
              )}
              <Link
                to={createPageUrl('ProviderConsole')}
                style={{ touchAction: 'manipulation', minHeight: '40px', minWidth: '40px' }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Console</span>
              </Link>
            </div>
          </header>

          {/* Control Bar */}
          <UI.ControlBar
              persona={persona}
              setPersona={setPersona}
              provider={provider}
              setProvider={setProvider}
              modes={modes}
              onToggleMode={handleToggleMode}
              onClear={handleClear}
              onVoiceSettingsChange={{
                playText: (text, settings) => {
                  // CRITICAL: Always read FRESHEST voiceSettings from localStorage
                  // to avoid stale React closure capturing old state
                  let freshSettings = settings || voiceSettings;
                  try {
                    const saved = localStorage.getItem('glyphbot_voice_settings');
                    if (saved) {
                      const parsed = JSON.parse(saved);
                      freshSettings = { ...parsed, ...(settings || {}) };
                    }
                  } catch (e) { /* use passed settings */ }
                  
                  console.log('[GlyphBot] Test voice — voiceProfile:', freshSettings.voiceProfile, 'emotion:', freshSettings.emotion);
                  stopTTS(); // Kill any currently playing audio first
                  playText(text, freshSettings);
                },
                setVoiceSettings: (updater) => {
                  setVoiceSettings(prev => {
                    const updated = typeof updater === 'function' ? updater(prev) : updater;
                    console.log('[GlyphBot] Voice settings updated:', JSON.stringify(updated, null, 2));
                    // Save immediately to localStorage
                    try {
                      localStorage.setItem('glyphbot_voice_settings', JSON.stringify(updated));
                    } catch (e) {
                      console.warn('[GlyphBot] Failed to save voice settings:', e);
                    }
                    return updated;
                  });
                }
              }}
              voiceSettings={voiceSettings}
              voiceProfiles={voiceProfiles}
              emotionPresets={emotionPresets}
            />

          {/* Provider panels — only visible when Panel mode toggled */}
          {modes.panel && (
            <div className="px-4 py-2 border-b border-slate-800/50 bg-slate-950/40 space-y-2">
              {providerMeta && (
                <Logic.GlyphProviderChain
                  availableProviders={providerMeta.availableProviders}
                  providerStats={providerMeta.providerStats}
                  providerUsed={lastMeta?.providerUsed || provider}
                />
              )}
              <UI.ProviderDebugPanel
                providerMeta={providerMeta}
                lastMeta={lastMeta}
              />
              {providerMeta && (
                <UI.ProviderStatusPanel
                  availableProviders={providerMeta.availableProviders}
                  providerStats={providerMeta.providerStats}
                  providerUsed={lastMeta?.providerUsed || provider}
                  jsonModeEnabled={modes.json || modes.struct || modes.audit}
                  onProviderSelect={(id) => setProvider(id)}
                />
              )}
            </div>
          )}

          {/* Trim Warning */}
          {showTrimWarning && (
            <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <span className="text-xs text-amber-300">Older messages trimmed (keeping last {MAX_MESSAGES})</span>
              <button onClick={() => setShowTrimWarning(false)} className="text-amber-400 hover:text-amber-200 p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Audit Panel */}
            {showAuditPanel && currentUser && (
              <aside className="w-80 flex flex-col border-r border-white/5 bg-slate-950/50 overflow-hidden" style={{ zIndex: 50, order: -1 }}>
                <div className="p-3 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Audits</span>
                  </div>
                  <button
                    onClick={() => setShowAuditHistory(!showAuditHistory)}
                    style={{ touchAction: 'manipulation', minHeight: '32px' }}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                      showAuditHistory ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    History
                  </button>
                </div>

                {showAuditHistory ? (
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Metrics Dashboard */}
                    <div className="p-3 border-b border-slate-800/50 max-h-[40%] overflow-y-auto">
                      <UI.AuditMetricsDashboard audits={audits} />
                    </div>
                    <UI.AuditHistoryPanel
                      audits={audits}
                      isLoading={auditsLoading}
                      onViewAudit={handleViewAudit}
                      onDeleteAudit={deleteAudit}
                      onArchiveAudit={archiveAudit}
                      onLoadArchivedAudits={loadArchivedAudits}
                    />
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-4">
                    <UI.AuditPanel
                      onStartAudit={handleStartAudit}
                      isProcessing={isProcessingAudit}
                    />
                  </div>
                )}
              </aside>
            )}

            {/* Messages */}
            <div 
                    ref={chatContainerRef}
                    className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-4"
                  >
                    {messages.filter(msg => msg && msg.content).map((msg, idx) => {
                      const msgId = msg.id || `msg-${idx}`;
                      return (
                        <ChatMessageMemo 
                          key={msgId}
                          msg={msg}
                          isAssistant={msg.role === 'assistant'}
                          onReplay={handleReplayWithSettings}
                        />
                      );
                    })}

              {isSending && (
                <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              )}
            </div>

            {/* Live Feed Panel */}
            {showLiveFeed && (
              <UI.LiveFeedPanel
                isOpen={showLiveFeed}
                onClose={() => {
                  setShowLiveFeed(false);
                  setModes(prev => ({ ...prev, live: false }));
                }}
              />
            )}

            {/* Chat History Panel */}
            {showHistoryPanel && currentUser && (
              <aside className="w-64 flex-col border-l border-white/5 bg-slate-950/50 overflow-hidden hidden md:flex relative" style={{ zIndex: 30 }}>
                <UI.ChatHistoryPanel
                  currentChatId={currentChatId}
                  savedChats={savedChats}
                  isLoading={persistenceLoading}
                  onSave={handleSaveChat}
                  onArchive={() => currentChatId ? archiveChat(currentChatId) : toast.error('No active chat to archive')}
                  onLoadChat={handleLoadChat}
                  onNewChat={handleNewChat}
                  onGetArchived={getArchivedChats}
                  onUnarchive={unarchiveChat}
                  onDelete={deleteChat}
                  hasMessages={messages.length > 1}
                  messages={messages}
                  onImportChat={handleImportChat}
                />
              </aside>
            )}

            {/* Telemetry Sidebar — only on xl screens, compact */}
            {modes.panel && (
              <aside className="hidden xl:flex w-64 flex-col border-l border-white/5 bg-slate-950/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Session</span>
                </div>
                <div className="flex-1 chat-scroll-container p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-cyan-300">{messages.length - 1}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Messages</div>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-purple-300">{chatCount}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Total</div>
                    </div>
                  </div>

                  {lastMeta && (
                    <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
                      <div className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold mb-2">Last Response</div>
                      <div className="space-y-1 text-[10px] text-slate-400">
                        <div className="text-cyan-200 font-medium">{lastMeta.providerLabel || lastMeta.model}</div>
                        {lastMeta.realTimeUsed && <div className="text-emerald-400">✓ Web search</div>}
                        {lastMeta.shouldSpeak && <div className="text-purple-400">✓ Voice</div>}
                      </div>
                    </div>
                  )}

                  {modes.voice && (
                    <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5">
                      <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold mb-2">Voice</div>
                      <div className="space-y-0.5 text-[10px] text-slate-400">
                        <div>{voiceSettings.voiceProfile} · {voiceSettings.speed}x</div>
                        <div>{voiceSettings.emotion}</div>
                      </div>
                    </div>
                  )}

                  {/* Recent messages feed */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="text-[9px] text-slate-500 uppercase tracking-wider">Recent</div>
                    {messages.slice(-4).reverse().filter(m => m?.content && m.role !== 'system').map((m, idx) => (
                      <div key={m.id || `telem-${idx}`} className="bg-white/[0.02] border border-white/5 rounded-lg p-2">
                        <span className={`text-[8px] uppercase tracking-wider font-bold ${m.role === 'assistant' ? 'text-cyan-400' : 'text-purple-400'}`}>
                          {m.role === 'assistant' ? 'Bot' : 'You'}
                        </span>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>

          {/* Input Bar */}
          <ChatErrorBoundary>
            <UI.ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onStop={handleStop}
              onRegenerate={handleRegenerate}
              isSending={isSending}
              disabled={isSending}
              selectedAgent={selectedAgent}
              onAgentChange={setSelectedAgent}
            />
          </ChatErrorBoundary>
        </div>
      </div>

      {/* GLYPHLOCK: Audit Report Modal - HIGHEST Z-INDEX */}
      {selectedAuditView && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999999, pointerEvents: 'auto' }}>
          <UI.AuditReportView
            audit={selectedAuditView}
            onClose={() => setSelectedAuditView(null)}
            onPlaySummary={handlePlayAuditSummary}
            onArchive={handleArchiveAudit}
            onDownload={handleDownloadAudit}
          />
        </div>
      )}
    </div>
    </>
  );
}