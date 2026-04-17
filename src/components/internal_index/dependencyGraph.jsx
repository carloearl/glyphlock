{
  "generatedAt": "2025-12-04",
  "version": "1.0.0",
  "routeToPage": {
    "Home": "pages/Home.jsx",
    "About": "pages/About.jsx",
    "Contact": "pages/Contact.jsx",
    "Pricing": "pages/Pricing.jsx",
    "GlyphBot": "pages/GlyphBot.jsx",
    "GlyphBotJunior": "pages/GlyphBotJunior.jsx",
    "Dashboard": "pages/Dashboard.jsx",
    "CommandCenter": "pages/CommandCenter.jsx",
    "QrGenerator": "pages/QrGenerator.jsx",
    "Steganography": "pages/Steganography.jsx",
    "HotzoneMapper": "pages/HotzoneMapper.jsx",
    "ImageLab": "pages/ImageLab.jsx",
    "Partners": "pages/Partners.jsx",
    "SecurityTools": "pages/SecurityTools.jsx",
    "NUPSLogin": "pages/NUPSLogin.jsx",
    "MasterCovenant": "pages/MasterCovenant.jsx",
    "VisualCryptography": "pages/VisualCryptography.jsx",
    "Blockchain": "pages/Blockchain.jsx",
    "ProviderConsole": "pages/ProviderConsole.jsx",
    "DreamTeam": "pages/DreamTeam.jsx",
    "Consultation": "pages/Consultation.jsx",
    "SecurityDocs": "pages/SecurityDocs.jsx",
    "SDKDocs": "pages/SDKDocs.jsx"
  },
  "pageToComponents": {
    "pages/Home.jsx": [
      "components/home/HeroSection.jsx",
      "components/home/HeroContent.jsx",
      "components/home/ServicesGrid.jsx",
      "components/home/DreamTeamHero.jsx",
      "components/home/NebulaBackground.jsx",
      "components/home/CTASection.jsx",
      "components/TechnologyMarquee.jsx",
      "components/SEOHead.jsx"
    ],
    "pages/GlyphBot.jsx": [
      "components/glyphbot/glyphbotClient.js",
      "components/glyphbot/ChatMessage.jsx",
      "components/glyphbot/ChatInput.jsx",
      "components/glyphbot/ControlBar.jsx",
      "components/glyphbot/useTTS.js",
      "components/glyphbot/ProviderStatusPanel.jsx",
      "components/provider/GlyphProviderChain.jsx",
      "components/SEOHead.jsx"
    ],
    "pages/GlyphBotJunior.jsx": [
      "components/glyphbot/personas.js",
      "components/qr/QrKnowledgeBase.js",
      "components/imageLab/ImageLabKnowledge.js",
      "components/content/faqMasterData.js",
      "components/content/sitemapKnowledge.js",
      "components/SEOHead.jsx"
    ],
    "pages/NUPSLogin.jsx": [
      "components/ui/GlyphForm.jsx"
    ],
    "pages/Contact.jsx": [
      "components/ui/GlyphForm.jsx",
      "components/SEOHead.jsx"
    ],
    "pages/HotzoneMapper.jsx": [
      "components/SEOHead.jsx"
    ],
    "pages/Partners.jsx": [
      "components/SEOHead.jsx"
    ]
  },
  "componentDependencies": {
    "components/glyphbot/glyphbotClient.js": ["@/api/base44Client"],
    "components/glyphbot/ChatMessage.jsx": ["react-markdown"],
    "components/glyphbot/useTTS.js": ["react"],
    "components/glyphbot/ControlBar.jsx": [
      "components/glyphbot/VoiceSettings.jsx",
      "@/components/ui/select",
      "@/components/ui/button"
    ],
    "components/ui/GlyphForm.jsx": ["react"],
    "components/Navbar.jsx": [
      "components/NavigationConfig.jsx",
      "@/components/ui/dropdown-menu",
      "@/components/ui/button",
      "framer-motion"
    ],
    "components/Footer.jsx": [
      "components/NavigationConfig.jsx"
    ],
    "components/GlyphBotJr.jsx": [
      "components/glyphbot/personas.js",
      "components/utils/ttsEngine.js",
      "react-markdown"
    ]
  },
  "navigationConfig": {
    "file": "components/NavigationConfig.jsx",
    "exports": ["NAV", "NAV_SECTIONS", "FOOTER_LINKS"],
    "consumers": ["components/Navbar.jsx", "components/Footer.jsx"]
  },
  "botComponents": {
    "canonical": {
      "page": "pages/GlyphBot.jsx",
      "purpose": "Full-featured AI security assistant page"
    },
    "junior": {
      "page": "pages/GlyphBotJunior.jsx",
      "purpose": "Kid-friendly/beginner AI helper page"
    },
    "widget": {
      "component": "components/GlyphBotJr.jsx",
      "purpose": "Floating chat widget (used in Layout)"
    }
  }
}