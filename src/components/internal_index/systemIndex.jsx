/**
 * GlyphLock Master System Index (MSI)
 * Central registry for routes, modules, and system components
 * Phase 5: Persistence Engine + Master Indexing
 */

export const SYSTEM_INDEX = {
  // Core Platform Routes
  routes: [
    { id: 'home', path: '/', name: 'Home', public: true },
    { id: 'qr', path: '/qr', name: 'QR Studio', public: false },
    { id: 'glyphbot', path: '/glyphbot', name: 'GlyphBot', public: false },
    { id: 'pricing', path: '/pricing', name: 'Pricing', public: true },
    { id: 'about', path: '/about', name: 'About', public: true },
    { id: 'security-tools', path: '/security-tools', name: 'Security Tools', public: false },
    { id: 'command-center', path: '/command-center', name: 'Command Center', public: false },
    { id: 'provider-console', path: '/provider-console', name: 'Provider Console', public: false },
    { id: 'image-lab', path: '/image-lab', name: 'Image Lab', public: false },
    { id: 'interactive-studio', path: '/interactive-image-studio', name: 'Interactive Studio', public: false },
    { id: 'blockchain', path: '/blockchain', name: 'Blockchain', public: false },
    { id: 'hotzone-mapper', path: '/hotzone-mapper', name: 'Hotzone Mapper', public: false },
    { id: 'hsss', path: '/hsss', name: 'HSSS', public: false },
    { id: 'master-covenant', path: '/master-covenant', name: 'Master Covenant', public: true },
    { id: 'soc', path: '/security-operations-center', name: 'Security Operations Center', public: false },
    { id: 'governance', path: '/governance-hub', name: 'Governance Hub', public: false },
    { id: 'consultation', path: '/consultation', name: 'Consultation', public: true },
    { id: 'contact', path: '/contact', name: 'Contact', public: true },
    { id: 'faq', path: '/faq', name: 'FAQ', public: true },
    { id: 'privacy', path: '/privacy', name: 'Privacy Policy', public: true },
    { id: 'terms', path: '/terms', name: 'Terms of Service', public: true },
    { id: 'sitemap', path: '/sitemap', name: 'Sitemap', public: true }
  ],

  // Feature Modules
  modules: {
    qr_studio: {
      id: 'qr_studio',
      name: 'QR Studio',
      version: '4.0',
      entity: 'QrPreview',
      vault_entity: 'QrPreview',
      features: ['generate', 'customize', 'preview', 'stego', 'security', 'analytics', 'bulk', 'vault']
    },
    glyphbot: {
      id: 'glyphbot',
      name: 'GlyphBot',
      version: '5.0',
      entity: 'GlyphBotChat',
      features: ['chat', 'save', 'archive', 'load', 'persistence', 'tts', 'audit', 'providers']
    },
    image_lab: {
      id: 'image_lab',
      name: 'Image Lab',
      version: '3.0',
      entity: 'InteractiveImage',
      features: ['generate', 'interactive', 'gallery', 'hotspots', 'finalize']
    },
    security_ops: {
      id: 'security_ops',
      name: 'Security Operations Center',
      version: '2.0',
      entity: 'QRThreatLog',
      features: ['monitor', 'analyze', 'report', 'alerts']
    },
    blockchain: {
      id: 'blockchain',
      name: 'Blockchain Security',
      version: '1.0',
      features: ['audit', 'verify', 'chain']
    }
  },

  // Entities Registry
  entities: [
    { name: 'GlyphBotChat', module: 'glyphbot', phase: 5 },
    { name: 'QrPreview', module: 'qr_studio', phase: 4 },
    { name: 'QRGenHistory', module: 'qr_studio', phase: 3 },
    { name: 'QRAIScore', module: 'qr_studio', phase: 3 },
    { name: 'QRThreatLog', module: 'security_ops', phase: 3 },
    { name: 'QrScanEvent', module: 'qr_studio', phase: 3 },
    { name: 'InteractiveImage', module: 'image_lab', phase: 3 },
    { name: 'ImageHotspot', module: 'image_lab', phase: 3 },
    { name: 'ImageHashLog', module: 'image_lab', phase: 3 },
    { name: 'Consultation', module: 'consultation', phase: 2 },
    { name: 'POSProduct', module: 'nups', phase: 2 },
    { name: 'POSTransaction', module: 'nups', phase: 2 },
    { name: 'POSCustomer', module: 'nups', phase: 2 },
    { name: 'Entertainer', module: 'nups', phase: 2 },
    { name: 'VIPRoom', module: 'nups', phase: 2 },
    { name: 'ServiceUsage', module: 'platform', phase: 2 },
    { name: 'APIKey', module: 'platform', phase: 1 },
    { name: 'SystemAuditLog', module: 'platform', phase: 1 },
    { name: 'Conversation', module: 'deprecated', phase: 1 },
    { name: 'UserPreferences', module: 'platform', phase: 1 },
    { name: 'LLMFeedback', module: 'glyphbot', phase: 1 }
  ],

  // WYT (Watch Your Tone) - Placeholder for future expansion
  wyt: {
    id: 'wyt',
    name: 'WYT (Watch Your Tone)',
    status: 'planned',
    phase: 6,
    description: 'Future sentiment analysis and communication monitoring system',
    features: ['sentiment_analysis', 'tone_detection', 'communication_metrics']
  },

  // Integration Points
  integrations: {
    stripe: { enabled: true, module: 'billing' },
    google_oauth: { enabled: true, module: 'auth' },
    sendgrid: { enabled: true, module: 'email' },
    openai: { enabled: true, module: 'glyphbot' },
    anthropic: { enabled: true, module: 'glyphbot' },
    gemini: { enabled: true, module: 'glyphbot' },
    openrouter: { enabled: true, module: 'glyphbot' }
  },

  // System Metadata
  metadata: {
    platform: 'GlyphLock Security',
    version: '5.0.0',
    phase: 5,
    last_updated: '2025-01-27',
    description: 'Quantum-resistant cybersecurity platform with AI-powered threat detection'
  }
};

/**
 * Get route by ID
 */
export function getRoute(id) {
  return SYSTEM_INDEX.routes.find(r => r.id === id);
}

/**
 * Get module by ID
 */
export function getModule(id) {
  return SYSTEM_INDEX.modules[id];
}

/**
 * Get entity info
 */
export function getEntity(name) {
  return SYSTEM_INDEX.entities.find(e => e.name === name);
}

/**
 * Get all public routes
 */
export function getPublicRoutes() {
  return SYSTEM_INDEX.routes.filter(r => r.public);
}

/**
 * Get all routes for a module
 */
export function getModuleRoutes(moduleId) {
  const module = getModule(moduleId);
  if (!module) return [];
  return SYSTEM_INDEX.routes.filter(r => r.id.includes(moduleId));
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(moduleId, featureName) {
  const module = getModule(moduleId);
  return module?.features?.includes(featureName) || false;
}

export default SYSTEM_INDEX;