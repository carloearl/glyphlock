/**
 * Sitemap Knowledge Base for AI Assistants
 * Provides context about GlyphLock's site structure and navigation
 */

export const SITEMAP_KNOWLEDGE = {
  platform: "GlyphLock",
  description: "Open source creation layer for building, owning, and protecting digital ecosystems. Stop getting robbed by locked-box SaaS — GlyphLock gives you full framework access, open source code, and legal protection under the Master Covenant.",
  
  coreNarrative: {
    tagline: "Stop Getting Robbed. Start Creating.",
    problem: "Most tech companies give you a locked box: 'Here's our software. Pay monthly. Can't change it. Trust us.'",
    solution: "GlyphLock gives you THE CREATION LAYER — full framework access, open source code, no vendor lock-in, and legal protection under the Master Covenant.",
    valueProps: [
      "Full framework access — modify anything",
      "Build custom features yourself — no permission needed",
      "Hire ANY developer — it's open source",
      "Extend the platform — your business, your rules",
      "No vendor lock-in — you own the code"
    ],
    proofStatement: "Open source framework proves it works. Master Covenant framework protects your rights.",
    audience: "Creators, businesses, and developers who refuse to rent their own tools. This is what enterprise companies have — now you have it too."
  },

  mainSections: [
    {
      name: "QR Studio",
      path: "/qr-generator",
      description: "Full-access QR code creation engine with steganography, hot zones, anti-quishing protection, and tamper detection. Open source — extend it however you want.",
      features: ["Secure QR generation", "90+ payload types", "Anti-quishing", "Steganography", "Hot zones", "Analytics", "Open source", "No feature paywalls"]
    },
    {
      name: "Image Lab",
      path: "/image-lab",
      description: "AI image generation and interactive hotspot editing with cryptographic verification. Your images, your hotspots, your code — fully modifiable.",
      features: ["AI image generation", "Interactive hotspots", "Cryptographic hashing", "Gallery management", "Full framework access"]
    },
    {
      name: "FAQ",
      path: "/faq",
      description: "Comprehensive frequently asked questions about GlyphLock's open source platform, framework access, pricing, and developer resources.",
      features: ["Searchable questions", "Categorized content", "Pricing information", "Developer resources", "Framework documentation"]
    },
    {
      name: "Pricing",
      path: "/pricing",
      description: "Transparent pricing for the creation layer. Professional ($200/month) and Enterprise ($2,000/month). No hidden fees, no locked features on core tools.",
      features: ["Plan comparison", "Feature details", "Stripe checkout", "Cancel anytime", "No vendor lock-in"]
    },
    {
      name: "Master Covenant",
      path: "/master-covenant",
      description: "The legal framework that protects your rights as a creator. The Master Covenant binds GlyphLock to transparency, open source access, and creator sovereignty.",
      features: ["Creator rights protection", "Open source guarantee", "Governance framework", "Legal binding", "No vendor lock-in clause"]
    }
  ],

  tools: [
    { name: "QR Generator", path: "/qr-generator", category: "Security" },
    { name: "Image Lab", path: "/image-lab", category: "AI Tools" },
    { name: "Steganography", path: "/steganography", category: "Security" },
    { name: "Blockchain Verification", path: "/blockchain", category: "Security" },
    { name: "GlyphBot Assistant", path: "/glyphbot", category: "AI Tools" },
    { name: "NUPS POS System", path: "/nups-login", category: "Services" }
  ],

  company: [
    { name: "About Us", path: "/about" },
    { name: "Dream Team", path: "/dream-team" },
    { name: "Partners", path: "/partners" },
    { name: "Roadmap", path: "/roadmap" },
    { name: "Contact", path: "/contact" }
  ],

  resources: [
    { name: "Documentation", path: "/security-docs" },
    { name: "FAQ", path: "/faq" },
    { name: "Sitemap", path: "/sitemap" },
    { name: "Consultation", path: "/consultation" },
    { name: "Command Center", path: "/command-center" }
  ],

  legal: [
    { name: "Terms of Service", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy" }
  ],

  sitemaps: {
    main: "/sitemap.xml",
    pages: "/sitemap-pages.xml",
    qr: "/sitemap-qr.xml",
    images: "/sitemap-images.xml",
    kb: "/sitemap-kb.xml",
    llmIndex: "/glyphlock-llm-index.json",
    robots: "/robots.txt"
  },

  commonQuestions: [
    {
      q: "What is GlyphLock?",
      a: "GlyphLock is an open source creation layer — a full framework for building, owning, and protecting your digital ecosystem. Unlike locked-box SaaS, you get full access to the code, can modify anything, hire any developer, and own everything you build."
    },
    {
      q: "Why is GlyphLock different from other platforms?",
      a: "Most tech companies give you a locked box — pay monthly, can't change it, trust them. GlyphLock gives you the creation layer: full framework access, open source code, no vendor lock-in, and legal protection under the Master Covenant. This is what enterprise companies have. Now you have it too."
    },
    {
      q: "What is the Master Covenant?",
      a: "The Master Covenant is the legal framework that protects your rights as a creator. It binds GlyphLock to transparency, open source access, and creator sovereignty. Your work stays yours. Visit /master-covenant to read it."
    },
    {
      q: "Where can I find the QR code generator?",
      a: "Visit /qr-generator or navigate to Services > QR Studio in the main menu. Full framework access — modify and extend it however you want."
    },
    {
      q: "How do I access the Image Lab?",
      a: "Go to /image-lab or click Services > Image Lab. Full creation tools with AI generation, interactive hotspots, and cryptographic verification."
    },
    {
      q: "Where is the pricing information?",
      a: "Visit /pricing to see transparent plans. No hidden fees, no locked features on core tools. Cancel anytime, no vendor lock-in."
    },
    {
      q: "Can I modify the code?",
      a: "Yes. GlyphLock is an open source framework. You get full access to modify anything, build custom features, hire any developer, and extend the platform. Your business, your rules."
    },
    {
      q: "What pages are available on GlyphLock?",
      a: "Main pages include: Home (/), QR Studio (/qr-generator), Image Lab (/image-lab), FAQ (/faq), Pricing (/pricing), Master Covenant (/master-covenant), About (/about), Contact (/contact), and more. See /sitemap for the complete list."
    }
  ],

  navigationTips: [
    "Use the main navigation menu at the top to access all major sections",
    "The footer contains links to company info, solutions, and resources",
    "The Sitemap page (/sitemap) provides a comprehensive overview of all available pages",
    "FAQ page (/faq) is searchable and categorized for easy information discovery",
    "Master Covenant (/master-covenant) explains your legal rights and protections",
    "Command Center (/command-center) is for authenticated enterprise users"
  ]
};

export default SITEMAP_KNOWLEDGE;