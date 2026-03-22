import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * FULL PROJECT EXPORT
 * 
 * Exports the ENTIRE GlyphLock codebase for offline independence.
 * This gives Carlo full ownership of all code without needing Base44 credits.
 * 
 * NOTE: This function reads from Base44's internal file system.
 * It cannot access all files directly, so it exports what's accessible
 * plus provides instructions for manual backup of the rest.
 */

// Known project structure - manually maintained list of key files
const PROJECT_STRUCTURE = {
  pages: [
    'Home', 'About', 'Contact', 'Services', 'Solutions', 'SecurityTools',
    'Qr', 'ImageLab', 'GlyphBot', 'Blockchain', 'HotzoneMapper', 'HSSS',
    'CommandCenter', 'Dashboard', 'Consultation', 'ConsultationSuccess',
    'SDKDocs', 'FAQ', 'Roadmap', 'DreamTeam', 'NISTChallenge', 'MasterCovenant',
    'TrustSecurity', 'CaseStudies', 'Partners', 'PartnerPortal',
    'AccountSecurity', 'BillingAndPayments', 'PaymentSuccess', 'PaymentCancel',
    'ManageSubscription', 'Privacy', 'Terms', 'Cookies', 'Accessibility',
    'SiteBuilder', 'SiteAudit', 'ProviderConsole', 'GovernanceHub',
    'NUPSLogin', 'NUPSStaff', 'NUPSOwner', 'VIPContract', 'EntertainerCheckIn',
    'ContentGenerator', 'ImageGenerator', 'InteractiveImageStudio',
    'Sitemap', 'SitemapXml', 'Robots', 'NotFound', 'FullExport'
  ],
  entities: [
    'VerificationToken', 'BuilderActionLog', 'Partner', 'PartnerLead', 
    'PartnerDocument', 'MarketingAsset', 'ConversationStorage', 'SiteAudit',
    'Consultation', 'POSProduct', 'POSTransaction', 'POSBatch', 'POSCustomer',
    'POSCampaign', 'POSLocation', 'POSInventoryBatch', 'POSZReport',
    'QRGenHistory', 'QRAIScore', 'QRThreatLog', 'QrAsset', 'QrScanEvent', 'QrPreview',
    'InteractiveImage', 'ImageHotspot', 'ImageHashLog',
    'APIKey', 'SystemAuditLog', 'Conversation', 'UserPreferences', 'LLMFeedback',
    'GlyphBotChat', 'GlyphBotAudit', 'AgentChangeSet', 'AgentRuntimeModule',
    'ServiceUsage', 'Entertainer', 'EntertainerShift', 'VIPRoom', 'VIPGuest'
  ],
  components: [
    'Navbar', 'Footer', 'SEOHead', 'GlyphLoader', 'SecurityMonitor', 'ThemeProvider',
    'NavigationConfig', 'StructuredDataOrg', 'GoogleAnalytics', 'TechnologyMarquee',
    'PaywallGuard', 'FreeTrialGuard',
    // Home components
    'home/HeroSection', 'home/HeroContent', 'home/HomeDreamTeamCTA', 
    'home/ServicesGrid', 'home/CTASection', 'home/FeaturesSection',
    // GlyphBot
    'glyphlock/bot/ui/index', 'glyphlock/bot/ui/GlyphBotJr', 
    'glyphlock/bot/ui/ChatMessage', 'glyphlock/bot/ui/ChatInput',
    'glyphlock/bot/logic/useTTS', 'glyphlock/bot/logic/useGlyphBotPersistence',
    // QR
    'qr/QrStudio', 'qr/QrPreviewPanel', 'qr/QrCustomizationPanel',
    // Image Lab  
    'imageLab/tabs/GenerateTab', 'imageLab/tabs/GalleryTab', 'imageLab/tabs/InteractiveTab',
    // Dev Engine
    'devengine/AgentBrainPanel', 'devengine/DeployPanel', 'devengine/DevModeLayout',
    // Console
    'console/BillingAndPayments', 'console/SDKDownloadCenter', 'console/DashboardHome',
    // Global
    'global/NebulaLayer', 'global/CursorOrb',
    // Security
    'security/VerificationGate', 'security/SecurityHeaders', 'security/MFASetupModal'
  ],
  functions: [
    'agentPlan', 'agentGenerate', 'agentApply', 'agentRollback', 'exportProject',
    'fullProjectExport', 'agentExecuteCode',
    'stripeCreateCheckout', 'stripeWebhook', 'stripePoll',
    'glyphbotLLM', 'glyphbotWebSearch', 'glyphbotFileUpload',
    'textToSpeech', 'textToSpeechOpenAI',
    'generateSecureQR', 'evaluateQrRisk', 'verifyQrTamper',
    'encodeImageData', 'decodeImageData', 'finalizeInteractiveImage',
    'mfaSetup', 'mfaVerifySetup', 'mfaVerifyLogin', 'mfaDisable',
    'generateVerificationToken', 'validateVerificationToken',
    'sendTransactionalEmail', 'send2FACode', 'verify2FACode',
    'conversationSave', 'conversationLoad', 'conversationList', 'conversationDelete',
    'saveGlyphBotChat', 'loadGlyphBotChats', 'deleteGlyphBotChat',
    'health', 'usageSummary', 'logsList', 'keysList',
    'robotsTxt', 'sitemap', 'sitemapIndex', 'aiTxt'
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Collect all entities with their schemas
    const entitySchemas = {};
    for (const entityName of PROJECT_STRUCTURE.entities) {
      try {
        const schema = await base44.entities[entityName]?.schema?.();
        if (schema) {
          entitySchemas[entityName] = schema;
        }
      } catch (e) {
        // Entity may not exist or not be accessible
      }
    }

    // Build export structure
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email,
      platform: 'GlyphLock.io on Base44',
      version: '1.0.0',
      
      stats: {
        pages: PROJECT_STRUCTURE.pages.length,
        components: PROJECT_STRUCTURE.components.length,
        entities: Object.keys(entitySchemas).length,
        functions: PROJECT_STRUCTURE.functions.length,
        totalFiles: PROJECT_STRUCTURE.pages.length + 
                   PROJECT_STRUCTURE.components.length + 
                   Object.keys(entitySchemas).length + 
                   PROJECT_STRUCTURE.functions.length + 2 // +2 for layout and globals
      },

      // File lists (paths only - actual content must be copied manually from Base44 editor)
      files: {
        pages: PROJECT_STRUCTURE.pages.map(p => ({
          path: `pages/${p}.jsx`,
          content: `// Export this file manually from Base44 editor\n// Path: pages/${p}.jsx\n// Use Base44 file viewer to copy content`
        })),
        components: PROJECT_STRUCTURE.components.map(c => ({
          path: `components/${c}.jsx`,
          content: `// Export this file manually from Base44 editor\n// Path: components/${c}.jsx`
        })),
        entities: Object.entries(entitySchemas).map(([name, schema]) => ({
          path: `entities/${name}.json`,
          content: JSON.stringify(schema, null, 2)
        })),
        functions: PROJECT_STRUCTURE.functions.map(f => ({
          path: `functions/${f}.js`,
          content: `// Export this file manually from Base44 editor\n// Path: functions/${f}.js`
        })),
        layout: '// Export Layout.js manually from Base44 editor',
        globals: '// Export globals.css manually from Base44 editor'
      },

      readme: `
# GLYPHLOCK CODEBASE EXPORT
================================================================================

## WHAT'S INCLUDED
- ${PROJECT_STRUCTURE.pages.length} Pages
- ${PROJECT_STRUCTURE.components.length} Components  
- ${Object.keys(entitySchemas).length} Entity Schemas (FULL JSON included)
- ${PROJECT_STRUCTURE.functions.length} Backend Functions

## HOW TO USE THIS EXPORT

### Option 1: Manual Copy (Recommended while you have access)
1. Go to Base44 dashboard → Your App → Code
2. For each file listed below, click to open and copy the code
3. Save to your local project with the same folder structure

### Option 2: Local Development Setup
1. Create a new React + Vite project:
   npm create vite@latest glyphlock -- --template react
   cd glyphlock
   npm install

2. Install dependencies:
   npm install tailwindcss @tanstack/react-query framer-motion lucide-react
   npm install date-fns lodash react-markdown recharts
   npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
   
3. Copy all files from this export to your src/ folder

4. Replace Base44 SDK imports with your own API:
   - Create src/api/client.js with fetch calls to your backend
   - Replace: import { base44 } from '@/api/base44Client'
   - With: import { api } from '@/api/client'

### Option 3: Host on Vercel/Netlify
1. Push your local project to GitHub
2. Connect to Vercel: vercel.com → Import Project
3. Deploy automatically on every push

## ENTITY SCHEMAS
These are the ACTUAL database schemas. Use them to recreate your database:

${Object.entries(entitySchemas).map(([name, schema]) => `
### ${name}
\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`
`).join('\n')}

## FILE STRUCTURE
\`\`\`
glyphlock/
├── pages/           # ${PROJECT_STRUCTURE.pages.length} page components
├── components/      # ${PROJECT_STRUCTURE.components.length} reusable components
├── entities/        # ${Object.keys(entitySchemas).length} database schemas
├── functions/       # ${PROJECT_STRUCTURE.functions.length} backend functions
├── Layout.js        # App wrapper
└── globals.css      # Global styles
\`\`\`

## IMPORTANT NOTES
- Entity schemas are COMPLETE and ready to use
- Page/Component/Function content must be copied manually from Base44 editor
- This export gives you the STRUCTURE - copy the CODE while you have access

## SUPPORT
This is YOUR code. You built it. Take it and run it anywhere.

Generated by GlyphLock Export System
${new Date().toISOString()}
`
    };

    return Response.json(exportData);

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});