/**
 * UNIFIED NAVIGATION CONFIGURATION
 * Single source of truth for Navbar and Footer
 * PHASE 3B VERIFIED - All routes confirmed to glyphlock.io ONLY
 * NO base44.app references permitted
 */

export const NAV = [
  { label: "Home", href: "/", visibility: "public" },
  { label: "Dream Team", href: "/DreamTeam", visibility: "public" },
  { label: "GlyphBot", href: "/GlyphBot", visibility: "public" },
  { label: "Media Hub", href: "/VideoUpload", visibility: "public" },
  { label: "Command Center", href: "/CommandCenter", visibility: "public" }, // Accessible to users, but protected
  { label: "Protocol Verification", href: "/Consultation", visibility: "public" }
];

export const NAV_SECTIONS = [
  {
    label: "Company",
    visibility: "public",
    items: [
      { label: "About Us", page: "About", visibility: "public" },
      { label: "Founder Story", page: "AboutCarlo", visibility: "public" },
      { label: "Partners", page: "Partners", visibility: "public" },
      { label: "Contact", page: "Contact", visibility: "public" },
      { label: "Accessibility", page: "Accessibility", visibility: "public" }
    ]
  },
  {
    label: "Modules",
    visibility: "public",
    items: [
      { label: "QR Verification", page: "Qr", visibility: "public" },
      { label: "Image Processing", page: "ImageLab", visibility: "public" },
      { label: "GlyphBot Intelligence", page: "GlyphBot", visibility: "public" },
      { label: "Site Builder", page: "SiteBuilder", visibility: "admin" },
      { label: "NUPS Transaction Verification", page: "NUPSLogin", visibility: "public" },
      { label: "Security Modules", page: "SecurityTools", visibility: "public" },
      { label: "Media Processing Hub", page: "VideoUpload", visibility: "public" },
      { label: "SDK Documentation", page: "SDKDocs", visibility: "public" },
      { label: "Site Intelligence", page: "Sie", visibility: "admin" }
    ]
  },
  {
    label: "Protocols",
    visibility: "public",
    items: [
      { label: "Master Covenant", page: "GovernanceHub", visibility: "public" },
      { label: "Protocol Verification", page: "Consultation", visibility: "public" },
      { label: "Trust & Security", page: "TrustSecurity", visibility: "public" },
      { label: "NIST Challenge", page: "NISTChallenge", visibility: "public" },
      { label: "Case Studies", page: "CaseStudies", visibility: "public" }
    ]
  },
  {
    label: "Resources",
    visibility: "public",
    items: [
      { label: "Documentation", page: "SecurityDocs", visibility: "public" },
      { label: "Dream Team", page: "DreamTeam", visibility: "public" },
      { label: "FAQ", page: "FAQ", visibility: "public" },
      { label: "Roadmap", page: "Roadmap", visibility: "public" },
      { label: "Site Map", page: "SitemapXml", visibility: "public" }
    ]
  },
  {
    label: "Account",
    visibility: "public",
    items: [
      { label: "Security Settings", page: "AccountSecurity", visibility: "public" },
                  { label: "Command Center", page: "CommandCenter", visibility: "public" },
                  { label: "Project Updates", page: "ProjectUpdates", visibility: "public" }
                ]
              }
            ];

export const FOOTER_LINKS = {
  company: [
    { label: "About Us", page: "About", visibility: "public" },
    { label: "Founder Story", page: "AboutCarlo", visibility: "public" },
    { label: "Partners", page: "Partners", visibility: "public" },
    { label: "Contact", page: "Contact", visibility: "public" },
    { label: "Accessibility", page: "Accessibility", visibility: "public" }
  ],
  modules: [
    { label: "QR Verification", page: "Qr", visibility: "public" },
    { label: "Image Processing", page: "ImageLab", visibility: "public" },
    { label: "GlyphBot Intelligence", page: "GlyphBot", visibility: "public" },
    { label: "NUPS Transaction Verification", page: "NUPSLogin", visibility: "public" },
    { label: "Blockchain Verification", page: "Blockchain", visibility: "public" },
    { label: "Media Processing Hub", page: "VideoUpload", visibility: "public" },
    { label: "SDK Documentation", page: "SDKDocs", visibility: "public" }
  ],
  protocols: [
    { label: "Master Covenant", page: "GovernanceHub", visibility: "public" },
    { label: "Protocol Verification", page: "Consultation", visibility: "public" },
    { label: "Trust & Security", page: "TrustSecurity", visibility: "public" },
    { label: "NIST Challenge", page: "NISTChallenge", visibility: "public" },
    { label: "Case Studies", page: "CaseStudies", visibility: "public" }
  ],
  resources: [
    { label: "Documentation", page: "SecurityDocs", visibility: "public" },
    { label: "Dream Team", page: "DreamTeam", visibility: "public" },
    { label: "FAQ", page: "FAQ", visibility: "public" },
    { label: "Roadmap", page: "Roadmap", visibility: "public" },
    { label: "Site Map", page: "SitemapXml", visibility: "public" }
  ],
  legal: [
    { label: "Privacy Policy", page: "Privacy", visibility: "public" },
    { label: "Terms of Service", page: "Terms", visibility: "public" },
    { label: "Cookie Policy", page: "Cookies", visibility: "public" }
  ],
  account: [
    { label: "Security Settings", page: "AccountSecurity", visibility: "public" },
    { label: "Command Center", page: "CommandCenter", visibility: "public" }
  ]
};

export default { NAV, NAV_SECTIONS, FOOTER_LINKS };