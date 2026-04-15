/**
 * 🜂 OMEGA PHASE 2 — HOLDER MODULE REBUILD CHECKLIST
 * 
 * Date: 2025-12-06
 * Status: READY FOR EXECUTION
 * Risk Level: HIGH (massive refactoring)
 * Estimated Time: 2-3 hours systematic work
 * 
 * ⚠️ CRITICAL: This is a complete architectural refactor
 * Each step must be verified before proceeding to next
 */

export const OMEGA_PHASE_2_CHECKLIST = {
  metadata: {
    phase: 2,
    title: 'Holder Module Rebuild',
    objective: 'Consolidate all bot code into components/glyphlock/bot/',
    constraints: [
      '✅ Base44 uses .js/.jsx (NOT TypeScript .ts/.tsx)',
      '✅ Root path: components/glyphlock/bot/ (NOT src/)',
      '⚠️ Touches 15+ components, 3 hooks, 8 backend wrappers',
      '⚠️ Could break app if not done atomically',
      '✅ Must preserve ALL existing functionality',
      '✅ Testing checkpoint after each major step'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 1: CREATE HOLDER DIRECTORY STRUCTURE
  // ═══════════════════════════════════════════════════════════
  step1_createStructure: {
    title: '📁 Create Holder Directory Structure',
    status: '⬜ NOT STARTED',
    estimatedTime: '5 minutes',
    actions: [
      {
        action: 'Create components/glyphlock/bot/index.js',
        description: 'Master export barrel - empty for now',
        verification: 'File exists and imports without error'
      },
      {
        action: 'Create components/glyphlock/bot/ui/index.js',
        description: 'UI layer export barrel',
        verification: 'File exists'
      },
      {
        action: 'Create components/glyphlock/bot/logic/index.js',
        description: 'Logic layer export barrel',
        verification: 'File exists'
      },
      {
        action: 'Create components/glyphlock/bot/services/index.js',
        description: 'Services layer export barrel',
        verification: 'File exists'
      },
      {
        action: 'Create components/glyphlock/bot/config/index.js',
        description: 'Config layer export barrel',
        verification: 'File exists'
      },
      {
        action: 'Create components/glyphlock/bot/types/index.js',
        description: 'Types layer export barrel',
        verification: 'File exists'
      }
    ],
    deliverable: 'Empty Holder structure with 6 directories',
    rollbackPlan: 'Delete components/glyphlock/ directory',
    testCommand: 'Import from @/glyphlock/bot/index should not error'
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 2: MIGRATE CONFIG LAYER (SAFEST FIRST)
  // ═══════════════════════════════════════════════════════════
  step2_migrateConfig: {
    title: '⚙️ Migrate Config Layer',
    status: '⬜ NOT STARTED',
    estimatedTime: '15 minutes',
    rationale: 'Config has no dependencies - safest to migrate first',
    actions: [
      {
        action: 'Copy components/glyphbot/personas.js → components/glyphlock/bot/config/personas.js',
        verification: 'PERSONAS export intact, all 9 personas present',
        note: 'Keep original file until Phase 2 complete'
      },
      {
        action: 'Extract TTS_PROVIDERS from components/utils/ttsEngine.js → components/glyphlock/bot/config/ttsProviders.js',
        verification: 'All 6 TTS providers defined with voice lists',
        note: 'Create new file with just TTS_PROVIDERS constant'
      },
      {
        action: 'Extract VOICE_PROFILES from components/glyphbot/useTTS.jsx → components/glyphlock/bot/config/voiceProfiles.js',
        verification: 'OpenAI voice mappings present',
        note: 'Create new file with inline voice profiles'
      },
      {
        action: 'Extract EMOTION_PRESETS from components/glyphbot/useTTS.jsx → components/glyphlock/bot/config/emotionPresets.js',
        verification: 'All emotion presets defined',
        note: 'Create new file with inline emotion presets'
      },
      {
        action: 'Extract MODEL_OPTIONS from components/glyphbot/ControlBar.jsx → components/glyphlock/bot/config/modelOptions.js',
        verification: 'All 6 model options defined',
        note: 'Create new file with inline model options'
      },
      {
        action: 'Create components/glyphlock/bot/config/constants.js',
        contents: [
          'STORAGE_KEYS (glyphbot_messages, glyphbot_settings, etc.)',
          'LIMITS (MAX_MESSAGES: 10, SAVE_SETTINGS_THRESHOLD: 20)',
          'PROVIDER_PRIORITY array',
          'WELCOME_MESSAGE object'
        ],
        verification: 'All constants exported'
      },
      {
        action: 'Create components/glyphlock/bot/config/defaults.js',
        contents: [
          'DEFAULT_PERSONA: "GENERAL"',
          'DEFAULT_PROVIDER: "AUTO"',
          'DEFAULT_VOICE_SETTINGS object',
          'DEFAULT_MODES object',
          'DEFAULT_AUDIT_MODE: "SURFACE"'
        ],
        verification: 'All defaults exported'
      },
      {
        action: 'Update components/glyphlock/bot/config/index.js',
        exports: [
          'export * from "./personas"',
          'export * from "./ttsProviders"',
          'export * from "./voiceProfiles"',
          'export * from "./emotionPresets"',
          'export * from "./modelOptions"',
          'export * from "./constants"',
          'export * from "./defaults"'
        ],
        verification: 'All config exports available'
      }
    ],
    deliverable: 'Complete config/ directory with 7 files + index',
    testing: [
      'Import { PERSONAS } from "@/glyphlock/bot/config"',
      'Import { TTS_PROVIDERS } from "@/glyphlock/bot/config"',
      'Verify no circular dependencies'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 3: CREATE TYPES LAYER
  // ═══════════════════════════════════════════════════════════
  step3_createTypes: {
    title: '📝 Create Types Layer',
    status: '⬜ NOT STARTED',
    estimatedTime: '20 minutes',
    rationale: 'JSDoc types provide IntelliSense without TypeScript',
    actions: [
      {
        action: 'Create components/glyphlock/bot/types/message.js',
        contents: `
/**
 * @typedef {Object} GlyphBotMessage
 * @property {string} id - Unique message ID
 * @property {'user'|'assistant'|'system'} role - Message role
 * @property {string} content - Message text
 * @property {Object|null} [audit] - Audit data if audit mode
 * @property {string} [providerId] - LLM provider used
 * @property {number} [latencyMs] - Response latency
 * @property {Object|null} [ttsMetadata] - TTS settings used
 */
        `,
        verification: 'JSDoc typedef compiles'
      },
      {
        action: 'Create components/glyphlock/bot/types/settings.js',
        contents: 'GlyphBotSettings, VoiceSettings, ModeSettings typedefs',
        verification: 'All settings types defined'
      },
      {
        action: 'Create components/glyphlock/bot/types/provider.js',
        contents: 'ProviderMeta, ProviderStats, ProviderConfig typedefs',
        verification: 'All provider types defined'
      },
      {
        action: 'Create components/glyphlock/bot/types/audit.js',
        contents: 'AuditConfig, AuditResult, AuditFindings typedefs',
        verification: 'All audit types defined'
      },
      {
        action: 'Create components/glyphlock/bot/types/tts.js',
        contents: 'TTSRequest, TTSResponse, TTSSettings typedefs',
        verification: 'All TTS types defined'
      },
      {
        action: 'Update components/glyphlock/bot/types/index.js',
        exports: 'Re-export all type definitions',
        verification: 'Can import all types from single path'
      }
    ],
    deliverable: 'Complete types/ directory with JSDoc typedefs',
    testing: [
      'Import types in VSCode',
      'Verify IntelliSense works',
      'Check for type conflicts'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 4: CREATE SERVICES LAYER (BACKEND WRAPPERS)
  // ═══════════════════════════════════════════════════════════
  step4_createServices: {
    title: '🔌 Create Services Layer',
    status: '⬜ NOT STARTED',
    estimatedTime: '30 minutes',
    rationale: 'Typed wrappers around backend functions',
    actions: [
      {
        action: 'Create components/glyphlock/bot/services/tts.js',
        purpose: 'Wrapper around textToSpeechAdvanced',
        methods: [
          'generate(text, settings) - Generate TTS audio',
          'getProviders() - Get available TTS providers',
          'testProvider(provider, voice) - Test TTS provider'
        ],
        verification: 'Calls base44.functions.invoke("textToSpeechAdvanced")'
      },
      {
        action: 'Create components/glyphlock/bot/services/llm.js',
        purpose: 'Wrapper around glyphbotLLM and puterLLM',
        methods: [
          'sendMessage(messages, options) - Send to LLM chain',
          'ping() - Health check',
          'getProviderStats() - Get provider metadata',
          'callPuter(messages) - Direct Puter call'
        ],
        verification: 'Calls base44.functions.invoke("glyphbotLLM")'
      },
      {
        action: 'Create components/glyphlock/bot/services/search.js',
        purpose: 'Wrapper around glyphbotWebSearch',
        methods: [
          'search(query, maxResults) - Web search',
          'getSummary(query) - Get formatted summary'
        ],
        verification: 'Calls base44.functions.invoke("glyphbotWebSearch")'
      },
      {
        action: 'Create components/glyphlock/bot/services/upload.js',
        purpose: 'Wrapper around glyphbotFileUpload and uploadMedia',
        methods: [
          'uploadFile(file) - Upload to Anthropic',
          'analyzeFile(fileId, prompt, type) - Analyze uploaded file',
          'uploadMedia(file) - Upload to storage'
        ],
        verification: 'Calls base44.functions.invoke("glyphbotFileUpload")'
      },
      {
        action: 'Create components/glyphlock/bot/services/audit.js',
        purpose: 'Audit service wrapper',
        methods: [
          'runSecurityAudit(config) - Execute audit',
          'getAuditPrompt(config) - Build audit prompt',
          'parseAuditResults(response) - Parse JSON results'
        ],
        verification: 'Integrates with useGlyphBotAudit logic'
      },
      {
        action: 'Create components/glyphlock/bot/services/qr.js',
        purpose: 'QR intelligence wrapper',
        methods: [
          'generate(data) - Generate QR',
          'evaluateRisk(code) - Risk scoring',
          'verifyTamper(code) - Integrity check'
        ],
        verification: 'Calls QR-related backend functions'
      },
      {
        action: 'Create components/glyphlock/bot/services/stego.js',
        purpose: 'Steganography wrapper',
        methods: [
          'encode(image, payload) - Hide data',
          'decode(image) - Extract data'
        ],
        verification: 'Calls stego backend functions'
      },
      {
        action: 'Update components/glyphlock/bot/services/index.js',
        exports: 'Re-export all service modules',
        verification: 'Can import Services from @/glyphlock/bot'
      }
    ],
    deliverable: 'Complete services/ directory with 7 wrappers + index',
    testing: [
      'Test each service wrapper independently',
      'Verify error handling',
      'Check response format consistency'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 5: MIGRATE LOGIC LAYER (HOOKS)
  // ═══════════════════════════════════════════════════════════
  step5_migrateLogic: {
    title: '🧠 Migrate Logic Layer',
    status: '⬜ NOT STARTED',
    estimatedTime: '25 minutes',
    actions: [
      {
        action: 'Copy components/glyphbot/useGlyphBotPersistence.js → components/glyphlock/bot/logic/useGlyphBotPersistence.js',
        imports: ['Update config imports to use @/glyphlock/bot/config'],
        verification: 'Hook functions correctly, GlyphBotChat entity accessible',
        note: 'Keep original until verified'
      },
      {
        action: 'Copy components/glyphbot/useGlyphBotAudit.js → components/glyphlock/bot/logic/useGlyphBotAudit.js',
        imports: ['Update to use services/audit wrapper'],
        verification: 'Hook functions correctly, GlyphBotAudit entity accessible',
        note: 'Keep original until verified'
      },
      {
        action: 'Copy components/glyphbot/useTTS.jsx → components/glyphlock/bot/logic/useTTS.js',
        imports: [
          'Import VOICE_PROFILES from config',
          'Import EMOTION_PRESETS from config',
          'Update to use services/tts wrapper'
        ],
        verification: 'TTS playback works, OpenAI and fallback functional',
        note: 'Remove voice profiles inline data'
      },
      {
        action: 'Copy components/glyphbot/glyphbotClient.js → components/glyphlock/bot/logic/glyphbotClient.js',
        imports: ['Update to use services/llm and services/search'],
        verification: 'sendMessage method works, personas accessible',
        note: 'Keep original until verified'
      },
      {
        action: 'Copy components/provider/GlyphProviderChain.jsx → components/glyphlock/bot/logic/GlyphProviderChain.js',
        imports: ['Update config imports'],
        verification: 'Component renders, provider chain displays',
        note: 'Keep original until verified'
      },
      {
        action: 'Update components/glyphlock/bot/logic/index.js',
        exports: [
          'export { useGlyphBotPersistence }',
          'export { useGlyphBotAudit }',
          'export { useTTS }',
          'export { default as glyphbotClient }',
          'export { default as GlyphProviderChain }'
        ],
        verification: 'All logic exports available'
      }
    ],
    deliverable: 'Complete logic/ directory with 5 files + index',
    testing: [
      'Test useGlyphBotPersistence in isolation',
      'Test useGlyphBotAudit in isolation',
      'Test useTTS playback',
      'Verify glyphbotClient.sendMessage()',
      'Check GlyphProviderChain rendering'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 6: MIGRATE UI LAYER (COMPONENTS)
  // ═══════════════════════════════════════════════════════════
  step6_migrateUI: {
    title: '🎨 Migrate UI Layer',
    status: '⬜ NOT STARTED',
    estimatedTime: '40 minutes',
    actions: [
      {
        action: 'Copy components/glyphbot/ChatMessage.jsx → components/glyphlock/bot/ui/ChatMessage.js',
        imports: ['No dependencies - standalone'],
        verification: 'Component renders messages correctly'
      },
      {
        action: 'Copy components/glyphbot/ChatInput.jsx → components/glyphlock/bot/ui/ChatInput.js',
        imports: ['Lucide icons already installed'],
        verification: 'Input works, voice recognition functional'
      },
      {
        action: 'Copy components/glyphbot/ControlBar.jsx → components/glyphlock/bot/ui/ControlBar.js',
        imports: [
          'Import PERSONAS from @/glyphlock/bot/config',
          'Import MODEL_OPTIONS from @/glyphlock/bot/config',
          'Import VoiceSettings from ./VoiceSettings'
        ],
        verification: 'Dropdowns populate, mode toggles work'
      },
      {
        action: 'Copy components/glyphbot/VoiceSettings.jsx → components/glyphlock/bot/ui/VoiceSettings.js',
        imports: ['Web Speech API (no imports needed)'],
        verification: 'Voice selection works, EQ sliders functional'
      },
      {
        action: 'Copy components/chat/VoiceSettingsPanel.jsx → components/glyphlock/bot/ui/VoiceSettingsPanel.js',
        imports: [
          'Import TTS_PROVIDERS from @/glyphlock/bot/config',
          'Import services/tts'
        ],
        verification: 'Provider selection works, preview button functional'
      },
      {
        action: 'Copy components/glyphbot/ChatHistoryPanel.jsx → components/glyphlock/bot/ui/ChatHistoryPanel.js',
        imports: ['Uses useGlyphBotPersistence from logic/'],
        verification: 'Save, load, archive, delete actions work'
      },
      {
        action: 'Copy components/glyphbot/AuditPanel.jsx → components/glyphlock/bot/ui/AuditPanel.js',
        imports: ['Uses useGlyphBotAudit from logic/'],
        verification: 'Form submission works, file upload functional'
      },
      {
        action: 'Copy components/glyphbot/AuditHistoryPanel.jsx → components/glyphlock/bot/ui/AuditHistoryPanel.js',
        imports: ['Uses useGlyphBotAudit from logic/'],
        verification: 'Audit list renders, filtering works'
      },
      {
        action: 'Copy components/glyphbot/AuditReportView.jsx → components/glyphlock/bot/ui/AuditReportView.js',
        imports: ['No external dependencies'],
        verification: 'Report modal displays, download works'
      },
      {
        action: 'Copy components/glyphbot/ProviderStatusPanel.jsx → components/glyphlock/bot/ui/ProviderStatusPanel.js',
        imports: ['Uses GlyphProviderChain from logic/'],
        verification: 'Provider status displays, selection works'
      },
      {
        action: 'Copy components/GlyphBotJr.jsx → components/glyphlock/bot/ui/GlyphBotJr.js',
        imports: [
          'Import PERSONAS from @/glyphlock/bot/config',
          'Import services/tts'
        ],
        verification: 'FAB displays, knowledge base integration works'
      },
      {
        action: 'Update components/glyphlock/bot/ui/index.js',
        exports: [
          'export { default as ChatMessage }',
          'export { default as ChatInput }',
          'export { default as ControlBar }',
          'export { default as VoiceSettings }',
          'export { default as VoiceSettingsPanel }',
          'export { default as ChatHistoryPanel }',
          'export { default as AuditPanel }',
          'export { default as AuditHistoryPanel }',
          'export { default as AuditReportView }',
          'export { default as ProviderStatusPanel }',
          'export { default as GlyphBotJr }'
        ],
        verification: 'All UI exports available'
      }
    ],
    deliverable: 'Complete ui/ directory with 11 components + index',
    testing: [
      'Render each component in isolation',
      'Test ChatMessage with sample message',
      'Test ChatInput send action',
      'Test ControlBar dropdowns',
      'Test all panels'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 7: BUILD MASTER INDEX BARREL
  // ═══════════════════════════════════════════════════════════
  step7_buildMasterIndex: {
    title: '🧬 Build Master Index Barrel',
    status: '⬜ NOT STARTED',
    estimatedTime: '10 minutes',
    actions: [
      {
        action: 'Update components/glyphlock/bot/index.js',
        contents: `
// Master GlyphBot Holder Export
// Single import point for entire bot system

export * as UI from './ui';
export * as Logic from './logic';
export * as Services from './services';
export * as Config from './config';
export * as Types from './types';

// Convenience re-exports for common items
export { PERSONAS, TTS_PROVIDERS, MODEL_OPTIONS, CONSTANTS } from './config';
export { useGlyphBotPersistence, useGlyphBotAudit, useTTS } from './logic';
        `,
        verification: 'Can import { UI, Logic, Services, Config } from "@/glyphlock/bot"'
      }
    ],
    deliverable: 'Unified import path for entire bot system',
    testing: [
      'Import in test file',
      'Destructure UI, Logic, Services',
      'Verify no undefined exports'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 8: UPDATE GLYPHBOT PAGE (MAIN BOT INTERFACE)
  // ═══════════════════════════════════════════════════════════
  step8_updateGlyphBotPage: {
    title: '🔄 Update GlyphBot Page Imports',
    status: '⬜ NOT STARTED',
    estimatedTime: '20 minutes',
    critical: true,
    actions: [
      {
        action: 'Update pages/GlyphBot.jsx imports',
        before: [
          'import ChatMessage from "@/components/glyphbot/ChatMessage"',
          'import ChatInput from "@/components/glyphbot/ChatInput"',
          'import ControlBar from "@/components/glyphbot/ControlBar"',
          'import { useGlyphBotPersistence } from "@/components/glyphbot/useGlyphBotPersistence"',
          'import { useGlyphBotAudit } from "@/components/glyphbot/useGlyphBotAudit"',
          'import useTTS from "@/components/glyphbot/useTTS"',
          'import glyphbotClient from "@/components/glyphbot/glyphbotClient"',
          '...12 more imports'
        ],
        after: [
          'import { UI, Logic, Config, Services } from "@/glyphlock/bot"',
          '',
          'const { ChatMessage, ChatInput, ControlBar, ChatHistoryPanel, AuditPanel, AuditHistoryPanel, AuditReportView, ProviderStatusPanel } = UI;',
          'const { useGlyphBotPersistence, useGlyphBotAudit, useTTS, glyphbotClient, GlyphProviderChain } = Logic;',
          'const { WELCOME_MESSAGE, STORAGE_KEYS, MAX_MESSAGES } = Config;'
        ],
        verification: 'Page compiles, all components render'
      },
      {
        action: 'Update glyphbotClient calls to use Services',
        before: 'glyphbotClient.sendMessage(...)',
        after: 'Services.llm.sendMessage(...)',
        verification: 'Chat still sends messages correctly'
      }
    ],
    deliverable: 'GlyphBot page using Holder exclusively',
    testing: [
      'Open /glyphbot page',
      'Send test message',
      'Toggle voice mode',
      'Save chat',
      'Start audit',
      'Verify all features work'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 9: UPDATE GLYPHBOTJR
  // ═══════════════════════════════════════════════════════════
  step9_updateGlyphBotJr: {
    title: '🤖 Update GlyphBotJr Imports',
    status: '⬜ NOT STARTED',
    estimatedTime: '10 minutes',
    actions: [
      {
        action: 'Update Layout.js GlyphBotJr import',
        before: 'import GlyphBotJr from "@/components/GlyphBotJr"',
        after: 'import { UI } from "@/glyphlock/bot"; const { GlyphBotJr } = UI;',
        verification: 'FAB renders on all pages'
      },
      {
        action: 'Update GlyphBotJr.js internal imports',
        before: [
          'import { PERSONAS } from "@/components/glyphbot/personas"',
          'import { generateAudio } from "@/components/utils/ttsEngine"'
        ],
        after: [
          'import { Config, Services } from "@/glyphlock/bot"',
          'const { PERSONAS } = Config;',
          'Use Services.tts.generate() instead of generateAudio'
        ],
        verification: 'GlyphBotJr still plays voice, responds correctly'
      }
    ],
    deliverable: 'GlyphBotJr using Holder',
    testing: [
      'Open FAB on any page',
      'Send test message',
      'Verify voice playback',
      'Check knowledge base responses'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 10: UPDATE PROVIDER CONSOLE PAGE
  // ═══════════════════════════════════════════════════════════
  step10_updateProviderConsole: {
    title: '📊 Update Provider Console',
    status: '⬜ NOT STARTED',
    estimatedTime: '10 minutes',
    actions: [
      {
        action: 'Update pages/ProviderConsole.jsx imports',
        before: [
          'import GlyphProviderChain from "@/components/provider/GlyphProviderChain"',
          'import ProviderStatusPanel from "@/components/glyphbot/ProviderStatusPanel"'
        ],
        after: [
          'import { UI, Logic } from "@/glyphlock/bot"',
          'const { ProviderStatusPanel } = UI;',
          'const { GlyphProviderChain } = Logic;'
        ],
        verification: 'Console page renders, provider stats display'
      }
    ],
    deliverable: 'ProviderConsole using Holder',
    testing: [
      'Open /provider-console',
      'Verify provider chain visualization',
      'Check stats accuracy'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 11: UPDATE ALL OTHER PAGES USING BOT COMPONENTS
  // ═══════════════════════════════════════════════════════════
  step11_updateOtherPages: {
    title: '🔍 Scan & Update All Other Bot References',
    status: '⬜ NOT STARTED',
    estimatedTime: '20 minutes',
    actions: [
      {
        action: 'Search codebase for imports from @/components/glyphbot/',
        command: 'Grep for "from \\"@/components/glyphbot/"',
        expectedMatches: ['pages/GlyphBot.jsx', 'Layout.js (GlyphBotJr)', 'pages/ProviderConsole.jsx'],
        verification: 'No other files import old glyphbot paths'
      },
      {
        action: 'Search for imports from @/components/utils/ttsEngine',
        expectedMatches: ['GlyphBotJr', 'VoiceSettingsPanel'],
        action_required: 'Update to use Services.tts'
      },
      {
        action: 'Search for imports from @/components/utils/llmClient',
        expectedMatches: ['Should be none or minimal'],
        action_required: 'Update to use Services.llm'
      },
      {
        action: 'Search for imports from @/components/provider/GlyphProviderChain',
        expectedMatches: ['pages/ProviderConsole.jsx'],
        action_required: 'Already handled in Step 10'
      }
    ],
    deliverable: 'Zero imports of old bot paths outside Holder',
    testing: 'Build app, verify no import errors'
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 12: VERIFICATION & TESTING
  // ═══════════════════════════════════════════════════════════
  step12_verification: {
    title: '✅ Full System Verification',
    status: '⬜ NOT STARTED',
    estimatedTime: '30 minutes',
    tests: [
      {
        test: 'Chat Flow Test',
        steps: [
          '1. Open /glyphbot',
          '2. Send message: "Hello GlyphBot"',
          '3. Verify response appears',
          '4. Check provider used (should be Puter or Gemini)',
          '5. Verify latency displayed'
        ],
        expectedResult: 'Message sent, response received, no errors'
      },
      {
        test: 'Voice Mode Test',
        steps: [
          '1. Toggle voice mode ON',
          '2. Send message: "Test voice"',
          '3. Verify audio plays',
          '4. Open voice settings popover',
          '5. Adjust pitch/speed',
          '6. Send another message',
          '7. Verify new settings applied'
        ],
        expectedResult: 'Voice playback works with custom settings'
      },
      {
        test: 'Live Mode Test',
        steps: [
          '1. Toggle live mode ON',
          '2. Ask: "What is the weather in New York today?"',
          '3. Verify web search triggered',
          '4. Verify response includes real-time data'
        ],
        expectedResult: 'Web search works, fresh data returned'
      },
      {
        test: 'Audit Mode Test',
        steps: [
          '1. Open audit panel',
          '2. Select target type: business',
          '3. Enter URL: https://stripe.com',
          '4. Select mode: MEDIUM',
          '5. Start audit',
          '6. Verify audit completes',
          '7. Check findings in audit history',
          '8. View full report'
        ],
        expectedResult: 'Audit runs, results saved, report viewable'
      },
      {
        test: 'Chat Persistence Test',
        steps: [
          '1. Send 3 messages',
          '2. Click "Save Chat"',
          '3. Open history panel',
          '4. Verify chat saved',
          '5. Start new chat',
          '6. Load saved chat',
          '7. Verify messages restored'
        ],
        expectedResult: 'Chat save/load works, history intact'
      },
      {
        test: 'Provider Chain Test',
        steps: [
          '1. Open provider console',
          '2. Verify chain visualization',
          '3. Check provider stats',
          '4. Return to chat',
          '5. Send message',
          '6. Verify provider used matches chain priority'
        ],
        expectedResult: 'Provider chain logic works correctly'
      },
      {
        test: 'GlyphBotJr Test',
        steps: [
          '1. Click FAB on any page',
          '2. Ask: "What is QR Studio?"',
          '3. Verify knowledge base response',
          '4. Verify voice auto-plays'
        ],
        expectedResult: 'Junior bot responds with knowledge base data'
      },
      {
        test: 'File Upload Test',
        steps: [
          '1. Click file attachment icon',
          '2. Upload PDF/image',
          '3. Verify upload completes',
          '4. Send message asking about file',
          '5. Verify Claude file analysis works'
        ],
        expectedResult: 'File upload and analysis functional'
      }
    ],
    deliverable: 'All features verified working',
    rollbackPlan: 'If any test fails, revert to old import paths'
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 13: CLEANUP OLD FILES (ONLY IF ALL TESTS PASS)
  // ═══════════════════════════════════════════════════════════
  step13_cleanup: {
    title: '🧹 Remove Old Scattered Files',
    status: '⬜ NOT STARTED',
    estimatedTime: '10 minutes',
    warning: '⚠️ ONLY DO THIS AFTER ALL TESTS PASS',
    actions: [
      {
        action: 'Delete components/glyphbot/ directory',
        note: 'All files migrated to components/glyphlock/bot/ui/ and logic/',
        verification: 'No imports reference old path'
      },
      {
        action: 'Delete components/chat/VoiceSettingsPanel.jsx',
        note: 'Migrated to ui/VoiceSettingsPanel.js',
        verification: 'No imports reference old path'
      },
      {
        action: 'Delete components/provider/GlyphProviderChain.jsx',
        note: 'Migrated to logic/GlyphProviderChain.js',
        verification: 'No imports reference old path'
      },
      {
        action: 'Update components/utils/ttsEngine.js',
        change: 'Remove TTS_PROVIDERS (now in config/ttsProviders.js)',
        note: 'Keep generateAudio and applyAudioEffects functions for backward compat',
        verification: 'Existing code using ttsEngine still works'
      },
      {
        action: 'Update components/utils/llmClient.js',
        change: 'Add deprecation comment, point to Services.llm',
        note: 'Keep file for backward compatibility',
        verification: 'No breaking changes'
      }
    ],
    deliverable: 'Clean codebase with no duplicates',
    rollbackPlan: 'Git restore if anything breaks'
  },

  // ═══════════════════════════════════════════════════════════
  // STEP 14: DOCUMENTATION & FINALIZATION
  // ═══════════════════════════════════════════════════════════
  step14_documentation: {
    title: '📚 Create Holder Documentation',
    status: '⬜ NOT STARTED',
    estimatedTime: '15 minutes',
    actions: [
      {
        action: 'Create components/glyphlock/bot/README.md',
        contents: `
# GlyphBot Holder Module

Single import point for entire GlyphBot system.

## Usage

\`\`\`javascript
import { UI, Logic, Services, Config } from '@/glyphlock/bot';

// Use UI components
const { ChatMessage, ChatInput, ControlBar } = UI;

// Use hooks
const { useGlyphBotPersistence, useTTS } = Logic;

// Use backend services
await Services.llm.sendMessage(messages, options);
await Services.tts.generate(text, settings);

// Use config
const { PERSONAS, TTS_PROVIDERS } = Config;
\`\`\`

## Directory Structure

- \`ui/\` - All React components
- \`logic/\` - Hooks and state management
- \`services/\` - Backend function wrappers
- \`config/\` - Configuration and constants
- \`types/\` - JSDoc type definitions

## Migration Guide

Old: \`import ChatMessage from '@/components/glyphbot/ChatMessage'\`
New: \`import { UI } from '@/glyphlock/bot'; const { ChatMessage } = UI;\`
        `,
        verification: 'README.md exists and is accurate'
      },
      {
        action: 'Update OMEGA_BOT_INDEX.js with Phase 2 completion status',
        change: 'Set phase2.status = "COMPLETE"',
        verification: 'Index reflects current state'
      }
    ],
    deliverable: 'Complete documentation for Holder module'
  },

  // ═══════════════════════════════════════════════════════════
  // EXECUTION PLAN SUMMARY
  // ═══════════════════════════════════════════════════════════
  executionPlan: {
    approach: 'INCREMENTAL WITH TESTING',
    totalSteps: 14,
    estimatedDuration: '3-4 hours',
    riskMitigation: [
      '✅ Keep original files until verified',
      '✅ Test after each major step',
      '✅ Build verification tests before cleanup',
      '✅ Maintain backward compatibility during transition',
      '✅ Rollback plan for each step'
    ],
    
    phaseBreakdown: {
      preparation: {
        steps: [1, 2, 3],
        description: 'Create structure, migrate config, create types',
        duration: '40 minutes',
        risk: 'LOW - no breaking changes'
      },
      coreLogic: {
        steps: [4, 5],
        description: 'Create services, migrate hooks',
        duration: '55 minutes',
        risk: 'MEDIUM - logic changes'
      },
      uiMigration: {
        steps: [6, 7],
        description: 'Migrate UI components, build index',
        duration: '50 minutes',
        risk: 'MEDIUM - import path changes'
      },
      integration: {
        steps: [8, 9, 10, 11],
        description: 'Update all pages to use Holder',
        duration: '60 minutes',
        risk: 'HIGH - app-wide changes'
      },
      verification: {
        steps: [12],
        description: 'Full system testing',
        duration: '30 minutes',
        risk: 'LOW - testing only'
      },
      finalization: {
        steps: [13, 14],
        description: 'Cleanup and documentation',
        duration: '25 minutes',
        risk: 'LOW - cleanup only'
      }
    },

    criticalCheckpoints: [
      {
        checkpoint: 'After Step 3 (Types created)',
        test: 'Import types, verify no errors',
        decision: 'PROCEED if types import cleanly, STOP if errors'
      },
      {
        checkpoint: 'After Step 5 (Logic migrated)',
        test: 'Test all 3 hooks in isolation',
        decision: 'PROCEED if hooks work, ROLLBACK if broken'
      },
      {
        checkpoint: 'After Step 7 (Master index built)',
        test: 'Import { UI, Logic, Services, Config } in test file',
        decision: 'PROCEED if no undefined exports, STOP if missing exports'
      },
      {
        checkpoint: 'After Step 8 (GlyphBot page updated)',
        test: 'Full chat flow test (send message, get response)',
        decision: 'PROCEED if chat works, ROLLBACK if broken'
      },
      {
        checkpoint: 'After Step 12 (Full verification)',
        test: 'All 8 feature tests pass',
        decision: 'PROCEED to cleanup if 100% pass, FIX if any failures'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // QUICK REFERENCE: FILE MIGRATION MAP
  // ═══════════════════════════════════════════════════════════
  migrationMap: {
    config: [
      'components/glyphbot/personas.js → components/glyphlock/bot/config/personas.js',
      'Extract from components/utils/ttsEngine.js → components/glyphlock/bot/config/ttsProviders.js',
      'Extract from components/glyphbot/useTTS.jsx → components/glyphlock/bot/config/voiceProfiles.js',
      'Extract from components/glyphbot/useTTS.jsx → components/glyphlock/bot/config/emotionPresets.js',
      'Extract from components/glyphbot/ControlBar.jsx → components/glyphlock/bot/config/modelOptions.js',
      'NEW FILE → components/glyphlock/bot/config/constants.js',
      'NEW FILE → components/glyphlock/bot/config/defaults.js'
    ],
    
    logic: [
      'components/glyphbot/useGlyphBotPersistence.js → components/glyphlock/bot/logic/useGlyphBotPersistence.js',
      'components/glyphbot/useGlyphBotAudit.js → components/glyphlock/bot/logic/useGlyphBotAudit.js',
      'components/glyphbot/useTTS.jsx → components/glyphlock/bot/logic/useTTS.js',
      'components/glyphbot/glyphbotClient.js → components/glyphlock/bot/logic/glyphbotClient.js',
      'components/provider/GlyphProviderChain.jsx → components/glyphlock/bot/logic/GlyphProviderChain.js'
    ],

    ui: [
      'components/glyphbot/ChatMessage.jsx → components/glyphlock/bot/ui/ChatMessage.js',
      'components/glyphbot/ChatInput.jsx → components/glyphlock/bot/ui/ChatInput.js',
      'components/glyphbot/ControlBar.jsx → components/glyphlock/bot/ui/ControlBar.js',
      'components/glyphbot/VoiceSettings.jsx → components/glyphlock/bot/ui/VoiceSettings.js',
      'components/chat/VoiceSettingsPanel.jsx → components/glyphlock/bot/ui/VoiceSettingsPanel.js',
      'components/glyphbot/ChatHistoryPanel.jsx → components/glyphlock/bot/ui/ChatHistoryPanel.js',
      'components/glyphbot/AuditPanel.jsx → components/glyphlock/bot/ui/AuditPanel.js',
      'components/glyphbot/AuditHistoryPanel.jsx → components/glyphlock/bot/ui/AuditHistoryPanel.js',
      'components/glyphbot/AuditReportView.jsx → components/glyphlock/bot/ui/AuditReportView.js',
      'components/glyphbot/ProviderStatusPanel.jsx → components/glyphlock/bot/ui/ProviderStatusPanel.js',
      'components/GlyphBotJr.jsx → components/glyphlock/bot/ui/GlyphBotJr.js'
    ],

    services: [
      'NEW FILE → components/glyphlock/bot/services/tts.js (wraps textToSpeechAdvanced)',
      'NEW FILE → components/glyphlock/bot/services/llm.js (wraps glyphbotLLM)',
      'NEW FILE → components/glyphlock/bot/services/search.js (wraps glyphbotWebSearch)',
      'NEW FILE → components/glyphlock/bot/services/upload.js (wraps glyphbotFileUpload)',
      'NEW FILE → components/glyphlock/bot/services/audit.js (audit logic)',
      'NEW FILE → components/glyphlock/bot/services/qr.js (wraps QR functions)',
      'NEW FILE → components/glyphlock/bot/services/stego.js (wraps stego functions)'
    ],

    types: [
      'NEW FILE → components/glyphlock/bot/types/message.js (GlyphBotMessage)',
      'NEW FILE → components/glyphlock/bot/types/settings.js (GlyphBotSettings, VoiceSettings)',
      'NEW FILE → components/glyphlock/bot/types/provider.js (ProviderMeta, ProviderStats)',
      'NEW FILE → components/glyphlock/bot/types/audit.js (AuditConfig, AuditResult)',
      'NEW FILE → components/glyphlock/bot/types/tts.js (TTSRequest, TTSResponse)'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SUCCESS CRITERIA
  // ═══════════════════════════════════════════════════════════
  successCriteria: {
    mustHave: [
      '✅ ALL bot pages import from @/glyphlock/bot ONLY',
      '✅ ZERO imports from old paths (@/components/glyphbot/, @/components/chat/, @/components/provider/)',
      '✅ ALL 8 verification tests pass',
      '✅ Chat sends messages and receives responses',
      '✅ Voice mode plays audio',
      '✅ Audit mode creates and saves audits',
      '✅ Chat persistence saves and loads correctly',
      '✅ Provider chain displays and functions',
      '✅ GlyphBotJr FAB works on all pages',
      '✅ No console errors on any page'
    ],
    niceToHave: [
      '⬜ Provider switching works smoothly',
      '⬜ All TTS providers tested',
      '⬜ File upload analyzed by Claude',
      '⬜ Web search returns accurate results'
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // EXECUTION RECOMMENDATION
  // ═══════════════════════════════════════════════════════════
  recommendation: {
    approach: 'INCREMENTAL SUB-PHASES',
    reasoning: [
      'Reduces risk of catastrophic breakage',
      'Allows testing at each checkpoint',
      'Easier to debug issues',
      'Can pause/resume safely',
      'Maintains app stability throughout'
    ],
    
    subPhases: {
      '2A': {
        title: 'Foundation (Steps 1-3)',
        scope: 'Create structure, migrate config, create types',
        duration: '40 min',
        risk: 'LOW',
        deliverable: 'config/ and types/ complete'
      },
      '2B': {
        title: 'Services & Logic (Steps 4-5)',
        scope: 'Create service wrappers, migrate hooks',
        duration: '55 min',
        risk: 'MEDIUM',
        deliverable: 'services/ and logic/ complete'
      },
      '2C': {
        title: 'UI Migration (Steps 6-7)',
        scope: 'Migrate all UI components, build master index',
        duration: '50 min',
        risk: 'MEDIUM',
        deliverable: 'ui/ complete, index.js built'
      },
      '2D': {
        title: 'Integration (Steps 8-11)',
        scope: 'Update all pages to use Holder',
        duration: '60 min',
        risk: 'HIGH',
        deliverable: 'All pages using @/glyphlock/bot'
      },
      '2E': {
        title: 'Verification & Cleanup (Steps 12-14)',
        scope: 'Test everything, remove old files, document',
        duration: '55 min',
        risk: 'LOW',
        deliverable: 'Clean, tested, documented bot system'
      }
    }
  }
};

export default OMEGA_PHASE_2_CHECKLIST;