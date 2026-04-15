/**
 * 🔥 OMEGA PHASE 1 — GlyphBot Discovery & Site Index
 * 
 * Date: 2025-12-06
 * Scope: Complete mapping of all bot-related infrastructure
 * Status: Phase 1 - Discovery Complete
 */

export const OMEGA_BOT_INDEX = {
  metadata: {
    phase: 1,
    status: 'DISCOVERY_COMPLETE',
    date: '2025-12-06',
    purpose: 'Complete mapping of all GlyphBot infrastructure for Phase 2 consolidation'
  },

  // ═══════════════════════════════════════════════════════════
  // LAYER 1: SERVICE LAYER (BACKEND FUNCTIONS)
  // ═══════════════════════════════════════════════════════════
  serviceLayer: {
    category: 'Backend Functions',
    description: 'All backend endpoints that power GlyphBot features',
    
    coreBotFunctions: [
      {
        name: 'textToSpeechAdvanced',
        path: 'functions/textToSpeechAdvanced.js',
        purpose: 'Unified TTS engine with multi-provider support',
        providers: ['ElevenLabs', 'Google Cloud', 'Microsoft Azure', 'OpenAI', 'Coqui', 'StreamElements'],
        features: [
          'Provider failover chain',
          'Audio effects (bass, treble, mid, echo, delay, noise gate)',
          'Speed, pitch, volume controls',
          'File upload integration',
          'Smart fallback to StreamElements'
        ],
        usedBy: ['Chat voice mode', 'Audit voice playback', 'Message replay', 'useTTS hook']
      },
      {
        name: 'coquiTTS',
        path: 'functions/coquiTTS.js',
        purpose: 'Coqui local TTS with StreamElements fallback',
        providers: ['Coqui (local)', 'StreamElements (fallback)'],
        features: [
          'Local open-source TTS',
          'No API key required (StreamElements)',
          'Speed and pitch control'
        ],
        usedBy: ['TTS fallback chain', 'Local deployment option']
      },
      {
        name: 'glyphbotLLM',
        path: 'functions/glyphbotLLM.js',
        purpose: 'Main LLM Omega Chain engine',
        providers: ['Puter (free Gemini)', 'Gemini Direct', 'OpenAI GPT-4o-mini', 'Claude Haiku', 'OpenRouter', 'Base44 Broker', 'Local OSS'],
        features: [
          'Auto provider selection (Omega Chain)',
          'Provider stats tracking',
          'Persona support',
          'Audit mode',
          'Input sanitization',
          'Timeout handling',
          'Latency tracking'
        ],
        usedBy: ['Core chat intelligence', 'All bot conversations', 'Audit analysis', 'glyphbotClient']
      },
      {
        name: 'puterLLM',
        path: 'functions/puterLLM.js',
        purpose: 'Dedicated Puter.js integration for free unlimited Gemini',
        providers: ['Puter (Gemini 2.5 Flash)', 'Gemini Direct (fallback)', 'Base44 Broker (last resort)'],
        features: [
          'Free unlimited AI access',
          'Zero API cost',
          'Triple fallback chain',
          'GlyphBot system prompt injection'
        ],
        usedBy: ['Primary LLM (cost optimization)', 'glyphbotLLM chain']
      },
      {
        name: 'glyphbotWebSearch',
        path: 'functions/glyphbotWebSearch.js',
        purpose: 'Real-time web search for fresh context',
        providers: ['SerpAPI', 'Google Custom Search', 'DuckDuckGo', 'Base44 LLM'],
        features: [
          'Multi-provider search chain',
          'No API key fallback (DuckDuckGo)',
          'Result formatting for LLM',
          'Audit logging (SystemAuditLog)',
          'Internet context injection'
        ],
        usedBy: ['Live mode', 'Real-time context', 'Audit research', 'glyphbotClient']
      },
      {
        name: 'glyphbotFileUpload',
        path: 'functions/glyphbotFileUpload.js',
        purpose: 'File upload to Anthropic for document analysis',
        providers: ['Anthropic Files API (Claude)'],
        features: [
          'PDF, image, text file support',
          'Analysis types: general, security, code, contract, data',
          'Claude Sonnet 4.5 integration',
          'Audit logging',
          'Token usage tracking'
        ],
        usedBy: ['File analysis', 'Document audit', 'Code review', 'ChatInput file upload']
      },
      {
        name: 'glyphlockWebhook',
        path: 'functions/glyphlockWebhook.js',
        purpose: 'Webhook handler for system events',
        eventTypes: [
          'chain.completed',
          'chain.failed',
          'qr.encoded',
          'qr.decoded',
          'qr.scanned',
          'covenant.verified',
          'covenant.denied',
          'covenant.binding_created',
          'security.threat_detected',
          'security.rate_limit_exceeded',
          'payment.completed',
          'payment.failed'
        ],
        features: [
          'HMAC signature verification',
          'Timestamp freshness check',
          'Entity updates (QRGenHistory, QrScanEvent, QRThreatLog, Consultation)',
          'Email alerts for critical events',
          'SystemAuditLog integration'
        ],
        usedBy: ['System monitoring', 'Security alerts', 'Payment tracking', 'QR analytics']
      },
      {
        name: 'testIntegrations',
        path: 'functions/testIntegrations.js',
        purpose: 'Admin-only integration health checks',
        tests: [
          'Base44 Authentication',
          'Entity CRUD Operations',
          'Stripe API Connection',
          'Core LLM Integration',
          'Email Integration',
          'File Upload Integration',
          'Service Role Access'
        ],
        features: [
          'Admin role guard',
          'Test result aggregation',
          'Success rate calculation',
          'Audit logging of test runs'
        ],
        usedBy: ['System health monitoring', 'Provider validation', 'Admin console']
      }
    ],

    relatedIntelligenceFunctions: [
      {
        name: 'generateQrAsset',
        path: 'functions/generateQrAsset.js',
        purpose: 'QR code generation',
        botIntegration: 'Bot can explain QR features, guide users through generation'
      },
      {
        name: 'evaluateQrRisk',
        path: 'functions/evaluateQrRisk.js',
        purpose: 'QR security scoring',
        botIntegration: 'Bot can audit QR codes, explain risk factors'
      },
      {
        name: 'verifyQrTamper',
        path: 'functions/verifyQrTamper.js',
        purpose: 'QR integrity verification',
        botIntegration: 'Bot can validate QR authenticity'
      },
      {
        name: 'buildStegoDisguisedImage',
        path: 'functions/buildStegoDisguisedImage.js',
        purpose: 'Steganography encoding',
        botIntegration: 'Bot can explain stego, help encode data'
      },
      {
        name: 'extractStegoPayload',
        path: 'functions/extractStegoPayload.js',
        purpose: 'Steganography decoding',
        botIntegration: 'Bot can decode hidden data, explain extraction'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // LAYER 2: UI LAYER (REACT COMPONENTS)
  // ═══════════════════════════════════════════════════════════
  uiLayer: {
    category: 'Frontend Components',
    description: 'All React components that render GlyphBot UI',
    
    pages: [
      {
        name: 'GlyphBot',
        path: 'pages/GlyphBot.jsx',
        description: 'Main bot interface with full-featured chat, audit, and history',
        imports: [
          'ChatMessage',
          'ChatInput',
          'ControlBar',
          'ChatHistoryPanel',
          'AuditPanel',
          'AuditHistoryPanel',
          'AuditReportView',
          'ProviderStatusPanel',
          'GlyphProviderChain',
          'useGlyphBotPersistence',
          'useGlyphBotAudit',
          'useTTS',
          'glyphbotClient'
        ],
        state: [
          'messages',
          'input',
          'persona',
          'provider',
          'modes (voice, live, audit, test, json, struct, panel)',
          'voiceSettings',
          'currentUser',
          'showHistoryPanel',
          'showAuditPanel',
          'showAuditHistory',
          'selectedAuditView',
          'isProcessingAudit'
        ]
      },
      {
        name: 'ProviderConsole',
        path: 'pages/ProviderConsole.jsx',
        description: 'Real-time provider monitoring and chain configuration',
        imports: ['GlyphProviderChain', 'ProviderStatusPanel'],
        features: ['Provider stats dashboard', 'Chain visualization', 'Auto-selector explanation']
      }
    ],

    chatComponents: [
      {
        name: 'ChatMessage',
        path: 'components/glyphbot/ChatMessage.jsx',
        description: 'Individual message bubble with markdown support',
        features: ['Gradient animated background', 'Neon green text', 'Role-based styling']
      },
      {
        name: 'ChatInput',
        path: 'components/glyphbot/ChatInput.jsx',
        description: 'Message input with voice, file upload, send/stop controls',
        features: [
          'Auto-resize textarea',
          'Speech recognition (Web Speech API)',
          'File attachment support',
          'Send/stop/regenerate actions',
          'Keyboard shortcuts (Enter to send)',
          'Voice input toggle with visual feedback'
        ]
      },
      {
        name: 'ControlBar',
        path: 'components/glyphbot/ControlBar.jsx',
        description: 'Top control panel with persona, model, modes',
        features: [
          'Persona selector (8 personas)',
          'Model selector (Auto, Gemini, OpenAI, Claude, OpenRouter, Local)',
          'Mode toggles (Voice, Live, Audit, JSON, Panel)',
          'Voice settings popover (pitch, speed, bass, clarity)',
          'Clear chat button'
        ]
      }
    ],

    panelComponents: [
      {
        name: 'ChatHistoryPanel',
        path: 'components/glyphbot/ChatHistoryPanel.jsx',
        description: 'Sidebar for managing saved chats',
        features: [
          'Save current chat',
          'Load saved chat',
          'Archive/unarchive chat',
          'Delete chat',
          'View archived chats',
          'New chat action',
          'Visual indicators for current chat'
        ]
      },
      {
        name: 'AuditPanel',
        path: 'components/glyphbot/AuditPanel.jsx',
        description: 'Form for initiating security audits',
        features: [
          'Target type selection (business, person, agency)',
          'URL/identifier input with validation',
          'Audit mode selection (SURFACE, CONCISE, MEDIUM, DEEP, ENTERPRISE_A, ENTERPRISE_B)',
          'Notes/focus areas',
          'File upload (ZIP, PDF)',
          'Dynamic descriptions for audit channels'
        ]
      },
      {
        name: 'AuditHistoryPanel',
        path: 'components/glyphbot/AuditHistoryPanel.jsx',
        description: 'List of past audits with actions',
        features: [
          'Filter by active/archived',
          'Status icons and colors',
          'Grade badges',
          'View, archive, delete actions',
          'Load archived audits',
          'Empty state handling'
        ]
      },
      {
        name: 'AuditReportView',
        path: 'components/glyphbot/AuditReportView.jsx',
        description: 'Detailed audit report modal',
        features: [
          'Full findings display',
          'Technical issues, business risks, fix plan',
          'Severity-based styling',
          'Download as JSON',
          'Archive action',
          'Play summary via TTS'
        ]
      },
      {
        name: 'ProviderStatusPanel',
        path: 'components/glyphbot/ProviderStatusPanel.jsx',
        description: 'Provider health and latency display',
        features: [
          'Provider chain visualization',
          'Health status icons',
          'Latency metrics',
          'JSON mode indicators',
          'Provider selection',
          'Status legend'
        ]
      },
      {
        name: 'GlyphProviderChain',
        path: 'components/provider/GlyphProviderChain.jsx',
        description: 'Visual provider chain with priority order',
        features: [
          'Priority sorting',
          'Status indicators (healthy, degraded, failed, idle, disabled)',
          'Current provider highlighting',
          'Usage stats tooltips',
          'Animated active provider pulse'
        ]
      }
    ],

    voiceComponents: [
      {
        name: 'VoiceSettings',
        path: 'components/glyphbot/VoiceSettings.jsx',
        description: 'Voice customization panel with EQ',
        features: [
          'Voice selection (Web Speech API)',
          'Speed slider (0.5-2.0x)',
          'Pitch slider (0.5-2.0)',
          'Volume slider (0-1.0)',
          'Equalizer (bass, mid, treble)',
          'Test voice button',
          'Audio Context integration'
        ]
      },
      {
        name: 'VoiceSettingsPanel',
        path: 'components/chat/VoiceSettingsPanel.jsx',
        description: 'Advanced TTS provider configuration',
        features: [
          'Provider selection (OpenAI, ElevenLabs, Google, Microsoft, StreamElements, Coqui)',
          'Voice catalog per provider',
          'Speed, pitch, naturalness, volume controls',
          'Bass, treble, mid EQ',
          'Audio effects toggles (echo, delay, noise gate, enhance, humanize)',
          'ElevenLabs advanced (stability, similarity, style, speaker boost)',
          'Preview voice button'
        ]
      }
    ],

    juniorBotComponent: [
      {
        name: 'GlyphBotJr',
        path: 'components/GlyphBotJr.jsx',
        description: 'Simplified FAB bot with knowledge bases',
        features: [
          'FAB (Floating Action Button) interface',
          'QR Studio knowledge base integration',
          'Image Lab knowledge base integration',
          'FAQ master data integration',
          'Sitemap knowledge integration',
          'Auto-voice response playback',
          'Friendly persona (glyphbot_jr)',
          'Simplified chat UI (no panels)'
        ],
        knowledgeBases: [
          'QR_KNOWLEDGE_BASE',
          'IMAGE_LAB_KNOWLEDGE',
          'faqMasterData',
          'sitemapKnowledge'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // LAYER 3: LOGIC LAYER (HOOKS & CLIENTS)
  // ═══════════════════════════════════════════════════════════
  logicLayer: {
    category: 'Hooks and State Management',
    description: 'React hooks and client SDKs that manage bot state and behavior',
    
    hooks: [
      {
        name: 'useGlyphBotPersistence',
        path: 'components/glyphbot/useGlyphBotPersistence.js',
        purpose: 'Chat history persistence with local storage and entity sync',
        stateManaged: [
          'currentChatId',
          'savedChats',
          'fullHistory',
          'isLoading'
        ],
        functions: [
          'trackMessage - Add message to full history',
          'initializeHistory - Load initial history',
          'saveChat - Save current chat to GlyphBotChat entity',
          'loadChat - Load chat by ID',
          'startNewChat - Clear state and start fresh',
          'archiveChat - Archive chat',
          'unarchiveChat - Restore archived chat',
          'deleteChat - Delete chat',
          'loadSavedChats - Fetch user chats',
          'getArchivedChats - Fetch archived chats'
        ],
        entities: ['GlyphBotChat'],
        storage: ['localStorage (STORAGE_KEYS)', 'sessionStorage (messages)']
      },
      {
        name: 'useGlyphBotAudit',
        path: 'components/glyphbot/useGlyphBotAudit.js',
        purpose: 'Audit management and execution',
        stateManaged: [
          'audits',
          'isLoading'
        ],
        functions: [
          'createAudit - Create new audit record',
          'updateAudit - Update audit status/findings',
          'getAudit - Fetch single audit',
          'deleteAudit - Delete audit',
          'archiveAudit - Archive audit',
          'unarchiveAudit - Restore archived audit',
          'runAudit - Execute audit with prompt building',
          'loadAudits - Fetch user audits',
          'loadArchivedAudits - Fetch archived audits'
        ],
        entities: ['GlyphBotAudit'],
        features: [
          'Channel-specific prompts (business, person, agency)',
          'Mode-specific analysis depth',
          'JSON structured output',
          'Progress tracking'
        ]
      },
      {
        name: 'useTTS',
        path: 'components/glyphbot/useTTS.jsx',
        purpose: 'Text-to-speech with OpenAI TTS + Web Speech fallback',
        stateManaged: [
          'isSpeaking',
          'isLoading',
          'isAvailable',
          'error',
          'currentProvider',
          'voiceProfiles',
          'emotionPresets'
        ],
        functions: [
          'playText - Play text with voice settings',
          'stop - Stop current playback',
          'getVoiceProfiles - Get OpenAI voice list',
          'getEmotionPresets - Get emotion configurations',
          'testTTS - Test voice with sample text'
        ],
        providers: [
          'OpenAI TTS (primary)',
          'Web Speech API (fallback)'
        ],
        features: [
          'Audio processing (bass, clarity, pitch)',
          'Voice profile selection',
          'Emotion presets',
          'Streaming playback',
          'Error recovery'
        ]
      }
    ],

    clients: [
      {
        name: 'glyphbotClient',
        path: 'components/glyphbot/glyphbotClient.js',
        purpose: 'Frontend SDK for GlyphBot interactions',
        methods: [
          'sendMessage - Send message to GlyphBot LLM',
          'webSearch - Real-time web search',
          'askWithRealTime - Message + web context',
          'askWithTTS - Message with voice response',
          'ping - Health check',
          'getPersonas - Get available personas'
        ],
        configuration: [
          'Default persona support',
          'Audit mode flag',
          'Real-time search flag',
          'TTS flag',
          'Puter priority routing',
          'Format directive enforcement'
        ]
      },
      {
        name: 'ttsEngine',
        path: 'components/utils/ttsEngine.js',
        purpose: 'Universal TTS client with provider abstraction',
        exports: [
          'TTS_PROVIDERS - Provider catalog',
          'getVoicesForProvider - Get voice list by provider',
          'generateAudio - Main TTS generation',
          'applyAudioEffects - Web Audio API effects'
        ],
        providers: {
          openai: { voices: 6, supportsSpeed: true, supportsPitch: false, supportsEmotion: false },
          elevenlabs: { voices: 10, supportsSpeed: true, supportsPitch: false, supportsEmotion: true },
          google: { voices: 9, supportsSpeed: true, supportsPitch: true, supportsEmotion: false },
          microsoft: { voices: 8, supportsSpeed: true, supportsPitch: true, supportsEmotion: true },
          streamelements: { voices: 8, supportsSpeed: false, supportsPitch: false, supportsEmotion: false },
          coqui: { voices: 4, supportsSpeed: true, supportsPitch: true, supportsEmotion: false }
        },
        features: [
          'Text cleaning (emojis, formatting)',
          'Provider failover',
          'Audio effects (bass, treble, mid EQ)',
          'StreamElements free fallback'
        ]
      },
      {
        name: 'llmClient',
        path: 'components/utils/llmClient.js',
        purpose: 'LLM broker wrapper with retry logic',
        exports: [
          'invokeLLM - Main LLM wrapper',
          'chatLLM - Conversation-style call',
          'promptLLM - Simple prompt call',
          'structuredLLM - JSON schema output',
          'analyzeLLM - File analysis call',
          'securityLLM - Security-focused call'
        ],
        features: [
          'Exponential backoff retry',
          'Internet context injection',
          'File URL support',
          'JSON schema validation',
          'Security prompt injection',
          'Routes through base44.integrations.Core.InvokeLLM'
        ]
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // LAYER 4: SHARED LAYER (CONFIG & TYPES)
  // ═══════════════════════════════════════════════════════════
  sharedLayer: {
    category: 'Configuration and Type Definitions',
    description: 'Shared config, constants, and type definitions used across all bot code',
    
    configurations: [
      {
        name: 'PERSONAS',
        path: 'components/glyphbot/personas.js',
        description: 'Persona definitions with system prompts and voice configs',
        personas: [
          {
            id: 'GENERAL',
            name: 'General Chat',
            modelPreference: 'gpt',
            voice: { provider: 'google', model: 'en-US-Neural2-G' }
          },
          {
            id: 'SECURITY',
            name: 'Security',
            modelPreference: 'claude',
            voice: { provider: 'microsoft', model: 'en-US-GuyNeural' }
          },
          {
            id: 'BLOCKCHAIN',
            name: 'Blockchain',
            modelPreference: 'gpt',
            voice: { provider: 'google', model: 'en-US-Neural2-D' }
          },
          {
            id: 'AUDIT',
            name: 'Audit Mode',
            modelPreference: 'claude',
            voice: { provider: 'microsoft', model: 'en-US-JennyNeural' }
          },
          {
            id: 'DEBUGGER',
            name: 'Debugger',
            modelPreference: 'gpt',
            voice: { provider: 'google', model: 'en-US-Neural2-A' }
          },
          {
            id: 'PERFORMANCE',
            name: 'Performance Mode',
            modelPreference: 'gemini',
            voice: { provider: 'google', model: 'en-US-Neural2-F' }
          },
          {
            id: 'REFACTOR',
            name: 'Refactor Mode',
            modelPreference: 'gpt',
            voice: { provider: 'microsoft', model: 'en-US-DavisNeural' }
          },
          {
            id: 'ANALYTICS',
            name: 'Analytics',
            modelPreference: 'gemini',
            voice: { provider: 'google', model: 'en-US-Neural2-C' }
          },
          {
            id: 'AUDITOR',
            name: 'Auditor',
            description: 'Full forensic audits of ANY entity',
            modelPreference: 'claude',
            voice: { provider: 'microsoft', model: 'en-US-GuyNeural' }
          }
        ],
        usedBy: ['ControlBar', 'glyphbotLLM', 'GlyphBotJr', 'AuditPanel']
      },
      {
        name: 'TTS_PROVIDERS',
        path: 'components/utils/ttsEngine.js',
        description: 'TTS provider catalog with voice lists and capabilities',
        providers: {
          openai: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
          elevenlabs: ['Rachel', 'Domi', 'Bella', 'Antoni', 'Elli', 'Josh', 'Arnold', 'Adam', 'Sam', 'Charlotte'],
          google: ['en-US-Neural2-A/C/D/F/J', 'en-US-Wavenet-A/B/C/D'],
          microsoft: ['en-US-JennyNeural', 'en-US-GuyNeural', 'en-US-AriaNeural', 'etc.'],
          streamelements: ['Joanna', 'Matthew', 'Amy', 'Brian', 'Emma', 'Justin', 'Kendra', 'Kimberly'],
          coqui: ['default', 'jenny', 'p273', 'ljspeech']
        },
        usedBy: ['VoiceSettingsPanel', 'ttsEngine', 'textToSpeechAdvanced']
      },
      {
        name: 'VOICE_PROFILES',
        path: 'components/glyphbot/useTTS.jsx (inline)',
        description: 'OpenAI voice mappings for TTS hook',
        profiles: [
          { id: 'neutral_female', voice: 'nova' },
          { id: 'neutral_male', voice: 'onyx' },
          { id: 'warm_female', voice: 'shimmer' },
          { id: 'warm_male', voice: 'echo' },
          { id: 'professional_female', voice: 'alloy' },
          { id: 'professional_male', voice: 'fable' }
        ],
        usedBy: ['useTTS', 'ControlBar voice popover']
      },
      {
        name: 'EMOTION_PRESETS',
        path: 'components/glyphbot/useTTS.jsx (inline)',
        description: 'Emotion-based voice tuning presets',
        presets: [
          { id: 'neutral', label: 'Neutral' },
          { id: 'energetic', label: 'Energetic' },
          { id: 'calm', label: 'Calm' },
          { id: 'authoritative', label: 'Authoritative' },
          { id: 'friendly', label: 'Friendly' }
        ],
        usedBy: ['useTTS', 'ControlBar voice popover']
      },
      {
        name: 'MODEL_OPTIONS',
        path: 'components/glyphbot/ControlBar.jsx (inline)',
        description: 'Available LLM model options',
        models: [
          { id: 'AUTO', label: 'Auto (Omega Chain)' },
          { id: 'GEMINI', label: 'Gemini Flash (Primary)' },
          { id: 'OPENAI', label: 'OpenAI GPT-4' },
          { id: 'CLAUDE', label: 'Claude Sonnet' },
          { id: 'OPENROUTER', label: 'OpenRouter Gateway' },
          { id: 'LOCAL_OSS', label: 'Local Fallback' }
        ],
        usedBy: ['ControlBar', 'glyphbotLLM']
      }
    ],

    typeDefinitions: [
      {
        name: 'GlyphBotMessage',
        description: 'Chat message structure',
        fields: {
          id: 'string - unique message ID',
          role: '"user" | "assistant" | "system"',
          content: 'string - message text',
          audit: 'object | null - audit data if audit mode',
          providerId: 'string - LLM provider used',
          latencyMs: 'number - response latency',
          ttsMetadata: 'object | null - TTS settings used'
        },
        usedIn: ['ChatMessage', 'useGlyphBotPersistence', 'GlyphBot page']
      },
      {
        name: 'GlyphBotSettings',
        description: 'Bot configuration settings',
        fields: {
          persona: '"GENERAL" | "SECURITY" | "BLOCKCHAIN" | "AUDIT" | etc.',
          provider: '"AUTO" | "GEMINI" | "OPENAI" | "CLAUDE" | etc.',
          modes: {
            voice: 'boolean',
            live: 'boolean',
            audit: 'boolean',
            test: 'boolean',
            json: 'boolean',
            struct: 'boolean',
            panel: 'boolean'
          },
          voiceSettings: {
            voiceProfile: 'string',
            speed: 'number',
            pitch: 'number',
            volume: 'number',
            bass: 'number',
            clarity: 'number',
            emotion: 'string',
            provider: 'string'
          }
        },
        usedIn: ['ControlBar', 'GlyphBot page', 'localStorage']
      },
      {
        name: 'VoiceSettings',
        description: 'TTS voice configuration',
        fields: {
          voiceProfile: 'string - voice ID',
          speed: 'number (0.5-2.0)',
          pitch: 'number (0.5-2.0)',
          volume: 'number (0-1.0)',
          bass: 'number (-1.0 to 1.0)',
          clarity: 'number (-1.0 to 1.0)',
          emotion: 'string - emotion preset ID',
          provider: 'string - TTS provider'
        },
        usedIn: ['useTTS', 'ControlBar', 'ChatMessage']
      },
      {
        name: 'ProviderMeta',
        description: 'Provider chain metadata',
        fields: {
          availableProviders: 'array - enabled providers',
          providerStats: 'object - usage stats per provider',
          providerUsed: 'string - last provider used',
          jsonModeEnabled: 'boolean'
        },
        usedIn: ['GlyphProviderChain', 'ProviderStatusPanel', 'GlyphBot page']
      },
      {
        name: 'AuditConfig',
        description: 'Audit configuration',
        fields: {
          targetType: '"business" | "person" | "agency"',
          targetIdentifier: 'string - URL or name',
          auditMode: '"SURFACE" | "CONCISE" | "MEDIUM" | "DEEP" | "ENTERPRISE_A" | "ENTERPRISE_B"',
          notes: 'string - focus areas'
        },
        usedIn: ['AuditPanel', 'useGlyphBotAudit', 'glyphbotLLM']
      }
    ],

    constants: [
      {
        name: 'STORAGE_KEYS',
        location: 'pages/GlyphBot.jsx, useGlyphBotPersistence.js',
        keys: [
          'glyphbot_messages',
          'glyphbot_settings',
          'glyphbot_chat_count',
          'glyphbot_provider_meta'
        ]
      },
      {
        name: 'LIMITS',
        location: 'pages/GlyphBot.jsx',
        values: {
          MAX_MESSAGES: 10,
          SAVE_SETTINGS_THRESHOLD: 20
        }
      },
      {
        name: 'PROVIDER_PRIORITY',
        location: 'functions/glyphbotLLM.js, components/provider/GlyphProviderChain.jsx',
        order: ['PUTER', 'GEMINI', 'OPENAI', 'CLAUDE', 'OPENROUTER', 'LOCAL_OSS']
      },
      {
        name: 'WELCOME_MESSAGE',
        location: 'pages/GlyphBot.jsx',
        content: 'Default welcome message object'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // ENTITIES USED BY BOT SYSTEM
  // ═══════════════════════════════════════════════════════════
  entities: [
    {
      name: 'GlyphBotChat',
      schema: 'entities/GlyphBotChat.json',
      purpose: 'Store chat history with metadata',
      fields: ['userId', 'title', 'fullHistory', 'messageCount', 'isArchived', 'provider', 'persona', 'tags'],
      rls: 'User-scoped (created_by)',
      usedBy: ['useGlyphBotPersistence', 'ChatHistoryPanel']
    },
    {
      name: 'GlyphBotAudit',
      schema: 'entities/GlyphBotAudit.json',
      purpose: 'Store security audit records',
      fields: ['userId', 'targetType', 'targetIdentifier', 'auditMode', 'rawInput', 'notes', 'status', 'findings', 'summary', 'riskScore', 'overallGrade', 'isArchived'],
      rls: 'User-scoped (created_by)',
      usedBy: ['useGlyphBotAudit', 'AuditPanel', 'AuditHistoryPanel', 'AuditReportView']
    },
    {
      name: 'SystemAuditLog',
      schema: 'entities/SystemAuditLog.json',
      purpose: 'System-wide audit trail',
      eventTypes: ['GLYPHBOT_LLM_CALL', 'GLYPHBOT_WEB_SEARCH', 'GLYPHBOT_FILE_UPLOAD', 'GLYPHBOT_FILE_ANALYSIS', 'INTEGRATION_TEST', 'etc.'],
      usedBy: ['All backend functions', 'glyphlockWebhook']
    },
    {
      name: 'LLMFeedback',
      schema: 'entities/LLMFeedback.json',
      purpose: 'User feedback on bot responses',
      usedBy: ['FeedbackWidget (if implemented)']
    }
  ],

  // ═══════════════════════════════════════════════════════════
  // DEPENDENCY GRAPH
  // ═══════════════════════════════════════════════════════════
  dependencyGraph: {
    description: 'Visual representation of how all bot pieces connect',
    graph: `
GlyphBot Page (pages/GlyphBot.jsx)
├── UI Components
│   ├── ChatMessage
│   ├── ChatInput
│   │   └── Speech Recognition API
│   ├── ControlBar
│   │   ├── VoiceSettings
│   │   └── ModeToggle
│   ├── ChatHistoryPanel
│   ├── AuditPanel
│   ├── AuditHistoryPanel
│   ├── AuditReportView
│   └── ProviderStatusPanel
│       └── GlyphProviderChain
│
├── Hooks (Logic Layer)
│   ├── useGlyphBotPersistence
│   │   └── base44.entities.GlyphBotChat
│   ├── useGlyphBotAudit
│   │   └── base44.entities.GlyphBotAudit
│   └── useTTS
│       └── base44.functions.textToSpeechAdvanced
│
├── Clients
│   ├── glyphbotClient
│   │   └── base44.functions.glyphbotLLM
│   ├── ttsEngine
│   │   └── base44.functions.textToSpeechAdvanced
│   └── llmClient
│       └── base44.integrations.Core.InvokeLLM
│
└── Config & Types
    ├── PERSONAS (9 personas)
    ├── TTS_PROVIDERS (6 providers)
    ├── VOICE_PROFILES
    ├── EMOTION_PRESETS
    └── MODEL_OPTIONS

GlyphBotJr (components/GlyphBotJr.jsx)
├── Knowledge Bases
│   ├── QR_KNOWLEDGE_BASE
│   ├── IMAGE_LAB_KNOWLEDGE
│   ├── faqMasterData
│   └── sitemapKnowledge
├── PERSONAS (glyphbot_jr)
├── ttsEngine
└── base44.integrations.Core.InvokeLLM

Backend Functions
├── glyphbotLLM
│   ├── Puter API
│   ├── Gemini API
│   ├── OpenAI API
│   ├── Anthropic API
│   ├── OpenRouter API
│   └── Base44 Broker
├── textToSpeechAdvanced
│   ├── ElevenLabs API
│   ├── Google Cloud TTS
│   ├── Microsoft Azure TTS
│   ├── OpenAI TTS
│   ├── Coqui TTS
│   └── StreamElements
├── glyphbotWebSearch
│   ├── SerpAPI
│   ├── Google Custom Search
│   ├── DuckDuckGo
│   └── Base44 LLM (fallback)
└── glyphbotFileUpload
    └── Anthropic Files API
    `
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 2 HOLDER SPEC
  // ═══════════════════════════════════════════════════════════
  holderSpec: {
    description: 'Future Holder module structure - NOT YET BUILT',
    plannedPath: 'components/glyphlock/bot/',
    structure: {
      'index.ts': 'Master export barrel - re-exports from all submodules',
      'ui/': 'All React components (ChatMessage, ChatInput, panels, etc.)',
      'logic/': 'Hooks and state management (useGlyphBotPersistence, useGlyphBotAudit, useTTS, glyphbotClient)',
      'services/': 'Strongly-typed backend wrappers (ttsService, llmService, searchService, fileService)',
      'config/': 'Central configuration (personas, ttsProviders, voiceProfiles, constants)',
      'types/': 'TypeScript definitions (message, settings, audit, provider)'
    },
    exportContract: `
// Future: components/glyphlock/bot/index.ts
export * from './ui';        // Composed React pieces
export * from './logic';     // Hooks, provider chains, state
export * from './services';  // Strongly typed backend wrappers
export * from './config';    // Central config
export * from './types';     // Shared types
    `,
    nameCollisions: 'NONE FOUND - Safe to proceed'
  },

  // ═══════════════════════════════════════════════════════════
  // DELIVERABLES & NEXT STEPS
  // ═══════════════════════════════════════════════════════════
  deliverables: {
    phase1: [
      '✅ Complete backend function inventory (8 core + 5 intelligence)',
      '✅ Complete frontend component mapping (15+ components)',
      '✅ Hook and client identification (3 hooks, 3 clients)',
      '✅ Config and type cataloging (4 configs, 5 type definitions)',
      '✅ Dependency graph construction',
      '✅ Phase 2 Holder spec defined',
      '✅ Name collision check (NONE)',
      '✅ omega_bot_index.md created'
    ],
    phase2: [
      '⬜ Create components/glyphlock/bot/ directory',
      '⬜ Migrate UI components to ui/ (preserve functionality)',
      '⬜ Migrate hooks to logic/',
      '⬜ Create service wrappers in services/',
      '⬜ Consolidate config into config/',
      '⬜ Create TypeScript types in types/',
      '⬜ Build barrel export in index.ts',
      '⬜ Update all imports to use new Holder',
      '⬜ End-to-end testing (chat, audit, TTS, persistence)',
      '⬜ Remove old scattered files'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // CRITICAL NOTES
  // ═══════════════════════════════════════════════════════════
  notes: {
    noCodeChanged: 'This is discovery only - NO code modifications in Phase 1',
    noDuplicates: 'All files serve unique purposes, no redundancy found',
    providerChainVerified: 'Puter → Gemini → OpenAI → Claude → OpenRouter → Base44 → Local OSS',
    ttsChainVerified: 'OpenAI → ElevenLabs → Google → Microsoft → Coqui → StreamElements',
    entitiesUsed: ['GlyphBotChat', 'GlyphBotAudit', 'SystemAuditLog', 'QrScanEvent', 'QRThreatLog', 'LLMFeedback'],
    apiKeysRequired: [
      'OPENAI_API_KEY ✅',
      'GEMINI_API_KEY ✅',
      'ANTHROPIC_API_KEY ✅',
      'OPENROUTER_API_KEY ✅',
      'ELEVENLABS_API_KEY ⚠️ (optional)',
      'GOOGLE_CLOUD_API_KEY ⚠️ (optional for TTS)',
      'AZURE_SPEECH_KEY ⚠️ (optional)',
      'SERP_API_KEY ⚠️ (optional for web search)',
      'GOOGLE_SEARCH_API_KEY ⚠️ (optional)',
      'COQUI_TTS_ENDPOINT ⚠️ (optional)'
    ]
  }
};

export default OMEGA_BOT_INDEX;