// DACO 007 Phase A — A3 grounded product knowledge.
// STATUS: DRAFT — PENDING DACO CONTENT APPROVAL (A3-LAW).
// Only public-level, already-published facts drawn from GlyphLock's own site
// content. NO pricing, NO legal terms, NO compliance claims in v1.
// The bot answers GlyphLock questions from THIS source only and says
// "I don't have that detail" rather than inventing.

export const KNOWLEDGE_BASE_STATUS = 'DRAFT_PENDING_DACO_APPROVAL';

export const GLYPHLOCK_KNOWLEDGE = {
  company: {
    name: 'GlyphLock LLC',
    identity: 'GlyphLock LLC is a security technology company. GlyphBot is its AI assistant product, built and operated by GlyphLock.',
  },
  products: [
    {
      name: 'GlyphLock Platform',
      summary: 'Web platform offering secure QR code generation and verification (QR Studio), AI image generation with interactive hotspots (Image Lab), blockchain-based data verification and hashing tools, security audits, and the GlyphBot AI assistant.',
    },
    {
      name: 'GlyphBot',
      summary: 'GlyphLock\'s AI assistant. GlyphBot main offers security-focused personas including audits, debugging, and analysis. GlyphBot Jr is the friendly on-site helper for questions about GlyphLock features, navigation, and troubleshooting.',
    },
    {
      name: 'NUPS',
      summary: 'A venue operating system for hospitality and entertainment businesses — front-of-house registers, staff and entertainer check-in, VIP room management, driver and guest tracking, and settlement/compliance reporting. Public-level overview only.',
    },
    {
      name: 'GlyphBucks',
      summary: 'A secure venue currency concept: cryptographically signed club scrip issued and redeemed inside NUPS venues, with tamper-evident QR verification. Public-level overview only.',
    },
  ],
  services: [
    'Website and business security audits (via GlyphBot Auditor mode)',
    'Secure QR code generation, tracking, and revocation',
    'AI image generation and interactive image studio',
    'Hash generation and blockchain proof verification',
  ],
  contact: {
    email: 'carloearl@glyphlock.com',
    phone: '+1-480-886-5588',
    support: 'GlyphBot Jr (on-site chat) is the fastest support channel; email for billing, technical, or partnership inquiries.',
  },
  explicitly_unknown: [
    'Pricing specifics beyond what is published on the Pricing page — direct users to the Pricing page',
    'Legal terms, contracts, or compliance guarantees — direct users to official GlyphLock channels',
    'NUPS internal operations, financials, or venue-specific data',
  ],
};

/** Render the knowledge base as a compact context block for the model. */
export function renderKnowledgeContext() {
  const kb = GLYPHLOCK_KNOWLEDGE;
  return [
    '[GLYPHLOCK PRODUCT KNOWLEDGE — the ONLY approved source for facts about GlyphLock]',
    `Company: ${kb.company.identity}`,
    'Products:',
    ...kb.products.map((p) => `- ${p.name}: ${p.summary}`),
    'Services offered:',
    ...kb.services.map((s) => `- ${s}`),
    `Contact: ${kb.contact.email} / ${kb.contact.phone}. ${kb.contact.support}`,
    'You do NOT have details on: ' + kb.explicitly_unknown.join('; ') + '.',
    'If asked about GlyphLock facts not listed above, say you don\'t have that detail and offer the contact channels. NEVER invent GlyphLock facts, pricing, or legal claims.',
    '[END GLYPHLOCK PRODUCT KNOWLEDGE]',
  ].join('\n');
}