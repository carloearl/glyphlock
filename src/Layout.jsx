import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SecurityMonitor from "@/components/SecurityMonitor";
import { UI } from "@/components/glyphlock/bot";
import NebulaLayer from "@/components/global/NebulaLayer";
import CursorOrb from "@/components/global/CursorOrb";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GlyphLoader from "@/components/GlyphLoader";
import MobileScalingSystem from "@/components/mobile/mobile-utils";
import HelpPanel from "@/components/global/HelpPanel";

import ThemeProvider from "@/components/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import StructuredDataOrg from "@/components/StructuredDataOrg";
import SecurityHeaders from "@/components/security/SecurityHeaders";
import CrawlerFallback from "@/components/seo/CrawlerFallback";
import PrerenderHints from "@/components/seo/PrerenderHints";

const { GlyphBotJr } = UI;

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (err) {
        console.error("Failed to get user:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      
      if (!isLocal) {
        // 1. Force non-www (canonical domain) to fix CERT_COMMON_NAME_INVALID
        if (host.startsWith('www.')) {
          const target = `https://${host.replace(/^www\./, '')}${window.location.pathname}${window.location.search}`;
          window.location.replace(target);
          return;
        }
        
        // 2. Force HTTPS
        if (window.location.protocol === 'http:') {
          window.location.replace(window.location.href.replace('http:', 'https:'));
          return;
        }
      }

      // Initialize mobile scaling system
      new MobileScalingSystem();
    }
  }, []);

  useEffect(() => {
    // Disable scroll snap on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      document.body.style.scrollSnapType = 'none';
      document.documentElement.style.scrollSnapType = 'none';
    }
    
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  if (loading) return <GlyphLoader text="Initializing Secure Environment..." />;

  const handleLogout = async () => {
    try {
      await base44.auth.logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleLogin = async () => {
    try {
      await base44.auth.redirectToLogin();
    } catch (err) {
      console.error("Login redirect failed:", err);
    }
  };

  return (
    <ThemeProvider>
      {/* GLYPHLOCK: Analytics, SEO & Security */}
      <GoogleAnalytics />
      <StructuredDataOrg />
      <SecurityHeaders />
      <CrawlerFallback />
      <PrerenderHints />
      
      {/* SITE-WIDE NEBULA - Absolute bottom layer */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 0, 
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <NebulaLayer intensity={1.0} />
      </div>

      {/* CURSOR ORB - Desktop only, above nebula */}
      <div 
        className="hidden md:block" 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 1, 
          pointerEvents: 'none',
          touchAction: 'none',
          userSelect: 'none',
          transform: 'translateZ(0)',
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      >
        <CursorOrb />
      </div>

      <div 
        className="min-h-screen text-white flex flex-col relative overflow-x-hidden selection:bg-[#00E4FF] selection:text-black" 
        style={{ 
          background: 'transparent',
          paddingBottom: 'env(safe-area-inset-bottom)',
          width: '100%',
          maxWidth: '100vw',
          minHeight: '100vh',
          height: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <SecurityMonitor />

        {/* Version Badge - Top Right */}
        <div className="fixed top-20 right-4 z-[9997] pointer-events-none hidden md:block">
          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-xs font-bold px-3 py-1.5">
            Beta Version 3.0
          </Badge>
        </div>

        {/* Mobile Version Badge - Bottom Left */}
        <div className="fixed bottom-20 left-4 z-[9997] pointer-events-none md:hidden">
          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-2 border-indigo-400/40 shadow-[0_0_20px_rgba(99,102,241,0.4)] text-[10px] font-bold px-2 py-1">
            v3.0
          </Badge>
        </div>

        {/* Navbar */}
        <div style={{ position: 'relative', zIndex: 9998, pointerEvents: 'auto' }}>
          <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <main className="flex-1 relative pt-4 w-full" style={{ background: 'transparent', zIndex: 10, width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
          {children}
        </main>

        {/* Global Help System */}
        <HelpPanel 
          title="GlyphLock Guide"
          sections={[
            {
              title: 'Getting Started',
              content: [
                { 
                  heading: 'Welcome to GlyphLock', 
                  text: 'GlyphLock is a quantum-resistant cybersecurity platform designed for enterprise-grade protection. The platform integrates AI-powered tools, blockchain verification, and advanced cryptography. Navigate using the top menu where you\'ll find: QR Studio (create secure QR codes), Image Lab (AI image generation with interactive hotspots), GlyphBot AI (security audits & assistance), Site Builder (AI-powered development), and Security Tools (blockchain, hashing, encryption). Each tool is designed to work together as a unified security ecosystem.',
                  tip: 'Start with the Command Center to get an overview of your account, usage stats, and security status before diving into specific tools.'
                },
                { 
                  heading: 'Command Center Access', 
                  text: 'Your Command Center is the mission control hub for your entire GlyphLock account. Click your profile icon in the top-right corner and select "Command Center" to access: Dashboard Home (real-time metrics, activity feed, quick stats), API Keys (create, rotate, and manage programmatic access), Security Settings (MFA setup, trusted devices, session management), Billing & Payments (subscription, invoices, usage tracking), and SDK Downloads (integration libraries for your apps). The dashboard provides a unified view of all your GlyphLock activities with actionable insights.',
                  tip: 'Pin your most-used sections to the Command Center sidebar for instant access. The dashboard refreshes in real-time, so you always see live data.'
                },
                { 
                  heading: 'Keyboard Shortcuts & Quick Actions', 
                  text: 'GlyphLock is optimized for power users with extensive keyboard navigation. Press ? anytime (except when typing in forms) to open this help guide. Use GlyphBot Jr on the right side for instant AI assistance—it understands context and can help debug issues, explain features, or guide you through complex workflows. The bot supports file uploads, voice input, and can even generate code snippets. Use Ctrl+K (Cmd+K on Mac) for global search across all tools. Tab through forms for rapid data entry. Esc closes modals and dialogs.',
                  tip: 'GlyphBot Jr remembers your conversation history during your session, so you can ask follow-up questions without repeating context.',
                  action: 'Try pressing ? right now to see this help guide in action, then click the CHAT tab on the right to test GlyphBot Jr.'
                },
                { 
                  heading: 'Account Security Best Practices', 
                  text: 'Security is paramount at GlyphLock. Enable Multi-Factor Authentication (MFA) immediately by going to Profile → Account Security → Enable MFA. You\'ll scan a QR code with apps like Google Authenticator, Authy, or 1Password. Save your recovery codes in a secure password manager—these are your backup if you lose your device. Manage trusted devices to skip MFA on known computers. Review your session history regularly for suspicious activity. Set up API keys with minimal permissions (principle of least privilege). Rotate API keys quarterly or after team member changes. Never share your secret keys—they grant full account access.',
                  tip: 'Use different authenticator apps for work vs. personal accounts. If your phone is lost, recovery codes are the ONLY way to regain access.',
                  action: 'Navigate to Account Security now and enable MFA if you haven\'t already. It takes 60 seconds and prevents 99.9% of account takeovers.'
                }
              ]
            },
            {
              title: 'QR Studio',
              content: [
                { 
                  heading: 'Create Quantum-Resistant QR Codes', 
                  text: 'QR Studio is our flagship tool for creating next-generation secure QR codes with built-in cryptographic verification. Unlike standard QR codes, GlyphLock QR codes support multi-slot credentialed payloads, meaning different users see different content based on their authentication level. Navigate to Tools → QR Studio to begin. The workflow: (1) Choose your base payload type (URL, vCard, WiFi, text, email, phone, SMS, location, or event). (2) Add multiple slots with different credential requirements (public, authenticated, admin). (3) Customize visual design (colors, logo, error correction). (4) Generate and preview. (5) Download as PNG/SVG or get shareable links. Each QR code is tamper-evident with blockchain anchoring.',
                  tip: 'Start with a simple single-slot public URL to learn the interface, then graduate to multi-slot authenticated payloads for sensitive use cases.',
                  action: 'Create your first QR code: Go to Tools → QR Studio → click "New QR Code" → select "URL" type → enter https://glyphlock.com → click Generate.'
                },
                { 
                  heading: 'Multi-Slot Credentialed Payloads', 
                  text: 'This is GlyphLock\'s killer feature: one QR code, multiple hidden payloads unlocked by user authentication. Add slots with different credential levels: PUBLIC (anyone who scans sees this), AUTHENTICATED (requires logged-in GlyphLock account), ADMIN (requires admin role). Each slot has its own priority, conditions (time range, geofence, device type), and payload data. Use cases: Event tickets (public shows event info, authenticated shows personalized agenda, admin shows backstage access). Product labels (public = marketing site, authenticated = warranty registration, admin = supply chain data). Business cards (public = LinkedIn, authenticated = calendar booking link, admin = private contact). The system automatically resolves the highest-priority slot the user qualifies for.',
                  tip: 'Set slot priorities strategically: higher priority = checked first. Use 100 for critical authenticated content, 50 for general auth, 10 for public fallback.',
                  code: '// Example 3-slot structure\n{\n  slots: [\n    { id: "admin", type: "url", credential_level: "admin", priority: 100, payload_data: { url: "admin.glyphlock.com/backstage" } },\n    { id: "user", type: "vcard", credential_level: "authenticated", priority: 50, payload_data: { name: "John Doe", email: "john@company.com" } },\n    { id: "public", type: "url", credential_level: "public", priority: 10, payload_data: { url: "company.com" } }\n  ],\n  fallback_url: "glyphlock.com/scan-failed"\n}'
                },
                { 
                  heading: 'Advanced Design Customization', 
                  text: 'Make your QR codes beautiful and brand-aligned while maintaining scannability. Color customization: Foreground color (the dark modules), background color (the light areas), gradient overlays (optional). Logo embedding: Upload your brand logo (PNG/SVG), auto-positioned in the center "quiet zone", automatically scaled to maintain QR readability. Error correction levels: L (7% recovery - smallest codes), M (15% recovery - standard), Q (25% recovery - recommended for logos), H (30% recovery - maximum damage tolerance). Style presets: Modern (rounded corners), Classic (sharp squares), Dots (circular modules), Custom (full control). Real-time preview shows exactly what will be generated. The system validates scannability before allowing download.',
                  tip: 'Use error correction level Q or H when adding logos—it reserves space for the logo without breaking the code. Test scans with multiple devices before printing.',
                  action: 'Experiment with the color picker: Click "Design" tab → try gradient backgrounds → upload a logo → adjust error correction to H → preview the result.'
                },
                { 
                  heading: 'Analytics, Tracking & Security Monitoring', 
                  text: 'Every QR code you create gets automatic analytics and security monitoring. Track scans in real-time: Total scans, unique scanners, geographic distribution (country/city), device breakdown (iOS/Android/desktop), timestamp history. Detect anomalies: Sudden scan spikes (possible viral spread or bot attack), geographic anomalies (scans from unexpected countries), velocity checks (too many scans too fast = spam). Security alerts: Tamper detection (QR code modified after generation), unauthorized slot access attempts (user trying to access admin slot), suspicious scan patterns (automated bots). Access the QR Vault panel to view all your codes, search by name/tag, filter by status (active/revoked), and export analytics as CSV/JSON for reporting.',
                  tip: 'Set up email alerts for critical QR codes (like payment links or access badges) so you know immediately if suspicious activity occurs.',
                  code: '// Access analytics via SDK\nconst analytics = await base44.entities.QRScanEvent.filter({ qr_asset_id: "qr_abc123" });\nconsole.log(`Total scans: ${analytics.length}`);\nconsole.log(`Avg scans/day: ${analytics.length / 30}`);\n\n// Detect velocity anomaly\nconst lastHour = analytics.filter(e => new Date(e.created_date) > Date.now() - 3600000);\nif (lastHour.length > 100) alert("Possible bot attack!");'
                },
                { 
                  heading: 'Steganography & Hidden Data', 
                  text: 'GlyphLock QR codes support visual steganography—hiding encrypted data inside the QR code image itself, invisible to scanners but recoverable with GlyphLock tools. Use cases: Proof of authenticity (embed creation timestamp + signature), Ownership tracking (embed creator ID invisibly), Anti-counterfeiting (embed unique serial number), Forensic watermarking (trace leak sources). The hidden data uses LSB (Least Significant Bit) encoding in the PNG—visually identical to original but contains encrypted payload. Only users with the decryption key can extract hidden data. To use: Enable "Steganography" in advanced settings → enter your secret message → optionally encrypt with password → generate QR code. The visible QR code works normally, but the image file contains your hidden payload.',
                  tip: 'Steganography works best with PNG format. JPEG compression destroys hidden data. Always test extraction before deploying to production.'
                },
                {
                  heading: 'Bulk Generation & API Integration',
                  text: 'Generate hundreds of QR codes programmatically using the GlyphLock API. Perfect for: Event ticketing (unique code per attendee), Product serialization (unique code per unit), Access badges (unique code per employee), Marketing campaigns (unique code per channel). Use the API: (1) Get API key from Command Center. (2) POST to /api/qr/generate with payload array. (3) Receive batch ID. (4) Poll /api/qr/batch/{id} for status. (5) Download ZIP of all generated codes. Supports CSV upload for bulk personalization (mail merge for QR codes). Each code gets unique tracking and can be revoked individually. Use webhooks to get notified when codes are scanned.',
                  code: '// Bulk generate via API\nconst response = await fetch("https://api.glyphlock.com/v1/qr/generate", {\n  method: "POST",\n  headers: { "Authorization": "Bearer YOUR_API_KEY", "Content-Type": "application/json" },\n  body: JSON.stringify({\n    batch_name: "Conference 2026 Tickets",\n    template: { type: "url", credential_level: "authenticated", design: { foreground: "#3B82F6" } },\n    data: [\n      { id: "ticket_001", url: "event.com/attendee/001", name: "Alice" },\n      { id: "ticket_002", url: "event.com/attendee/002", name: "Bob" }\n    ]\n  })\n});\nconst { batch_id } = await response.json();\nconsole.log(`Batch created: ${batch_id}`);\n\n// Poll for completion\nconst poll = setInterval(async () => {\n  const status = await fetch(`https://api.glyphlock.com/v1/qr/batch/${batch_id}`);\n  const { state, download_url } = await status.json();\n  if (state === "completed") {\n    clearInterval(poll);\n    console.log(`Download: ${download_url}`);\n  }\n}, 2000);'
                }
              ]
            },
            {
              title: 'Image Lab',
              content: [
                { 
                  heading: 'AI Image Generation Masterclass', 
                  text: 'Image Lab uses state-of-the-art generative AI models (Google Imagen 3, Gemini Vision) to create photorealistic images from text prompts. The workflow: (1) Enter a detailed prompt describing your vision (the more specific, the better). (2) Optionally upload reference images to guide style, composition, or identity. (3) Adjust advanced parameters: Seed (deterministic results for reproducibility), Creativity (0.0-1.0, lower=strict to prompt, higher=artistic freedom), Guidance Scale (how closely AI follows your prompt), Quality Mode (speed vs. detail trade-off). (4) Click Generate and wait 10-30 seconds. The system generates the image, validates quality (face anatomy, hand anatomy, realism scores using Gemini), and presents the result. If validation fails, it auto-retries with adjusted parameters. You can regenerate with different seeds for variations.',
                  tip: 'Describe lighting, camera angle, mood, and technical details for best results. "Portrait of a woman, soft natural window light, 85mm lens, shallow depth of field, warm color grading" produces better results than "woman photo".',
                  code: '// Example advanced prompt structure\nSubject: "Professional headshot of a 30-year-old Asian woman"\nStyle: "Corporate, clean, modern"\nLighting: "Soft key light from left, subtle rim light, light gray background"\nTechnical: "Shot on Canon 5D Mark IV, 85mm f/1.8, ISO 100"\nMood: "Confident, approachable, professional"\nQuality: "8K resolution, sharp focus on eyes, natural skin texture"\n\n// Full prompt:\n"Professional headshot of a 30-year-old Asian woman, corporate style, soft key light from left with subtle rim light, light gray background, shot on Canon 5D Mark IV with 85mm f/1.8 lens at ISO 100, confident and approachable expression, 8K resolution with sharp focus on eyes and natural skin texture"'
                },
                { 
                  heading: 'Interactive Hotspots System', 
                  text: 'Transform static images into interactive experiences by adding clickable hotspots. Use cases: Product demos (click parts to see specs), Virtual tours (click rooms to navigate), Infographics (click sections for details), Educational content (click anatomy parts for explanations), Marketing (click products to purchase). Workflow: (1) Upload an image or use a generated one. (2) Click anywhere on the image to place a hotspot. (3) GlyphBot AI automatically detects what you clicked (using vision AI) and suggests a label. (4) Configure the hotspot: Label (visible text), Description (tooltip on hover), Shape (rectangle/circle/polygon), Action Type (open URL, show modal, play audio, invoke agent, verify access), Action Value (URL, text content, audio file, etc.). (5) Save hotspots—they\'re stored as coordinates + metadata. (6) Share or embed the interactive image.',
                  tip: 'Use polygon hotspots for irregular shapes. Click multiple points to define the boundary, then double-click to complete. The AI helps trace object outlines automatically.',
                  action: 'Try it now: Go to Image Lab → Interactive tab → upload any image → click an object → watch AI detect it → configure the action → test by clicking the hotspot.'
                },
                { 
                  heading: 'Sharing, Embedding & Export', 
                  text: 'Share your interactive images in multiple ways: (1) Hosted Mode: Generate a public glyphlock.com/share/xyz link. Anyone with the link can view the interactive image. Hotspot clicks are tracked in analytics. (2) Downloadable Mode: Download the image + separate hotspot manifest JSON. Host on your own server. Use the GlyphLock SDK to render hotspots client-side. Full control over styling and behavior. (3) Embed Mode: Get an iframe embed code for your website. Responsive and mobile-optimized. (4) API Export: Fetch hotspot data via API for custom integrations. Export formats: PNG (image), JSON (hotspot manifest), SVG (vector hotspots), HTML (standalone viewer). All exports are cryptographically signed to prevent tampering.',
                  tip: 'Use hosted mode for quick sharing and analytics. Use downloadable mode for white-label solutions or offline applications.',
                  code: '// Embed interactive image in your site\n<iframe \n  src="https://glyphlock.com/share/abc123xyz" \n  width="100%" \n  height="600px" \n  frameborder="0" \n  allow="fullscreen"\n  style="border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);"\n></iframe>\n\n// Or use SDK for custom rendering\nimport { GlyphImage } from "@glyphlock/sdk";\n\nconst hotspots = await fetch("https://glyphlock.com/api/image/abc123/hotspots").then(r => r.json());\n\n<GlyphImage \n  src="your-image.png" \n  hotspots={hotspots} \n  onHotspotClick={(hotspot) => console.log("Clicked:", hotspot.label)}\n  theme="dark"\n  enableAnalytics={true}\n/>'
                },
                { 
                  heading: 'Advanced Prompt Engineering', 
                  text: 'The AI Expand feature transforms simple prompts into detailed, professional specifications. How it works: (1) Enter a basic prompt like "sunset beach". (2) Click "AI Expand". (3) GlyphBot analyzes your prompt and expands it with: Subject details (what\'s in the scene), Style directives (artistic style, era, influences), Lighting specs (time of day, quality, direction), Camera settings (lens, aperture, film stock), Mood/atmosphere (emotional tone), Technical quality markers (resolution, sharpness). The expanded prompt produces dramatically better results. You can also upload reference images to extract features: Color palettes (dominant colors extracted), Lighting signatures (direction, quality, contrast), Texture patterns (material types, surface qualities), Composition rules (rule of thirds, golden ratio), Visual mood (extracted via sentiment analysis). These features are blended into your generation as guidance.',
                  tip: 'Combine text prompt expansion with reference image features for maximum control. Use 2-3 reference images with different aspects (one for composition, one for color, one for style).',
                  code: '// Prompt expansion example\n\nInput: "sunset beach"\n\nAI Expanded Output:\n"Breathtaking sunset over a pristine tropical beach at golden hour, warm orange and pink sky with wispy clouds, gentle waves lapping at white sand shore, silhouette of palm trees on the right, soft ambient lighting with sun positioned low on horizon casting long shadows, shot with vintage film camera aesthetic, Kodak Portra 400 film stock, 35mm lens, wide-angle composition following rule of thirds, dreamy and peaceful atmosphere, 8K resolution with subtle film grain, natural color grading with warm tones, professional landscape photography"\n\nValidation Scores After Generation:\n- Composition: 0.94/1.0\n- Lighting Quality: 0.91/1.0\n- Realism: 0.88/1.0\n- Overall: 0.91/1.0 ✅ PASS'
                },
                {
                  heading: 'Reference Image Blending',
                  text: 'Upload up to 5 reference images and blend their features into your generation. Each reference has an adjustable weight (0-100%) controlling its influence. Use cases: Style transfer (apply Monet painting style to your photo), Identity preservation (maintain person\'s face across generations), Composition guidance (use one image\'s layout for another subject), Color grading (apply film stock look to new images). The system extracts: Face embeddings (if faces present), Color histograms, Texture signatures, Composition vectors, Style fingerprints. These are combined with your text prompt to guide generation. Adjust weights in real-time and see preview updates. Higher weight = stronger influence from that reference.',
                  tip: 'Use face references at 80-90% weight for identity preservation. Use style references at 40-60% weight to avoid overpowering the prompt. Test different weight combinations.',
                  code: '// Example reference blend setup\n\nText Prompt: "Professional business portrait"\n\nReferences:\n1. Face Photo (weight 85%) - Preserves person\'s identity\n2. Studio Lighting Example (weight 60%) - Applies lighting style  \n3. Corporate Headshot (weight 45%) - Guides composition\n4. Color Grading Reference (weight 30%) - Applies color palette\n\nResult: New image with person\'s face, studio lighting, corporate composition, and color palette—all combined seamlessly.'
                },
                {
                  heading: 'Validation & Quality Control',
                  text: 'Every generated image undergoes automated quality validation using Gemini Vision Pro. Validation checks: Face Anatomy (0-1 score, checks eyes/nose/mouth alignment, symmetry, natural proportions), Hand Anatomy (detects extra/missing fingers, unnatural poses), Realism Score (overall photorealism vs. AI artifacts), Lighting Consistency (shadows match light sources), Composition Quality (follows photographic principles). Images scoring <0.75 overall trigger automatic retry with adjusted parameters. Failed validations show detailed scores so you can diagnose issues. You can disable auto-retry for artistic/abstract work where traditional rules don\'t apply. Validation history is saved so you can track model performance over time.',
                  tip: 'If hands keep failing validation, try prompting "hands behind back" or crop hands out of frame. AI struggles with hand anatomy—it\'s a known limitation.',
                  code: '// Validation result example\n{\n  "attempt": 3,\n  "validation_scores": {\n    "face_anatomy": 0.92,\n    "hand_anatomy": 0.68,  // Failed - triggered retry\n    "realism": 0.89,\n    "composition": 0.94,\n    "lighting": 0.88,\n    "overall": 0.86\n  },\n  "status": "retry",\n  "retry_reason": "Hand anatomy score below 0.75 threshold",\n  "retry_params": {\n    "seed": 42857,  // Changed seed\n    "guidance_scale": 8.5,  // Increased from 7.5\n    "negative_prompt": "malformed hands, extra fingers, missing fingers"  // Added constraint\n  }\n}'
                }
              ]
            },
            {
              title: 'GlyphBot AI',
              content: [
                { 
                  heading: 'Your AI Security & Development Partner', 
                  text: 'GlyphBot is a multi-modal AI assistant trained specifically for cybersecurity, web development, and technical analysis. Access via Tools → GlyphBot for the full interface, or use GlyphBot Jr (right sidebar) for quick questions. Capabilities: Security auditing (scan websites for vulnerabilities), Code analysis (debug, optimize, refactor), Technical documentation (explain complex concepts), Threat intelligence (CVE lookups, exploit analysis), Architecture review (system design feedback), Compliance checking (GDPR, HIPAA, SOC2), Performance optimization (speed, scalability, cost). GlyphBot uses context from your entire GlyphLock account—it knows your QR codes, images, API usage, and can reference your data to provide personalized answers. Supports file uploads (images, code, PDFs) and multi-turn conversations with full context retention.',
                  tip: 'GlyphBot remembers your conversation history across sessions. Reference previous discussions by saying "as we discussed last week" and it will recall the context.',
                  action: 'Try asking GlyphBot: "Audit glyphlock.com for security vulnerabilities" or "Explain how quantum-resistant cryptography works in simple terms"'
                },
                { 
                  heading: 'Specialized Personas & Expert Modes', 
                  text: 'Switch between expert personas optimized for specific tasks. Each persona has specialized knowledge, vocabulary, and problem-solving approaches: SECURITY ARCHITECT (system hardening, threat modeling, zero-trust design), CODE DEBUGGER (step-by-step troubleshooting, root cause analysis, fix generation), SITE AUDITOR (comprehensive website analysis, performance, SEO, accessibility), COMPLIANCE OFFICER (regulatory requirements, documentation templates, audit prep), API INTEGRATOR (SDK usage, webhook setup, authentication flows), PERFORMANCE ENGINEER (optimization strategies, caching, CDN, database tuning). To switch personas: Click the persona dropdown in GlyphBot UI → select new persona → conversation context adapts automatically. Each persona has different default settings (verbosity, technical depth, code examples).',
                  tip: 'Use Security Architect for strategic planning, Code Debugger for tactical fixes. Switch mid-conversation if needed—context transfers seamlessly.',
                  code: '// Example persona-specific responses to "How do I secure my API?"\n\nSECURITY ARCHITECT:\n"Implement defense-in-depth: (1) API Gateway with rate limiting, (2) OAuth 2.0 + JWT tokens, (3) Input validation + sanitization, (4) HTTPS only with TLS 1.3, (5) CORS policies, (6) SQL injection prevention, (7) Security headers, (8) Audit logging. Threat model: Consider DDoS, injection, MITM, token theft. Reference: OWASP API Security Top 10."\n\nCODE DEBUGGER:\n"Here\'s a production-ready implementation:\n\nconst rateLimit = require(\'express-rate-limit\');\nconst helmet = require(\'helmet\');\nconst jwt = require(\'jsonwebtoken\');\n\napp.use(helmet());\napp.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));\napp.use((req, res, next) => {\n  const token = req.headers.authorization?.split(\' \')[1];\n  if (!token) return res.status(401).json({ error: \'No token\' });\n  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {\n    if (err) return res.status(403).json({ error: \'Invalid token\' });\n    req.user = user;\n    next();\n  });\n});\n\nReady to deploy. Test with: curl -H \'Authorization: Bearer TOKEN\' https://api.example.com"'
                },
                { 
                  heading: 'Website Security Audits', 
                  text: 'Run comprehensive security audits on any website (yours or third-party). GlyphBot performs 50+ security checks: SSL/TLS configuration (cipher strength, certificate validity, HSTS), HTTP security headers (CSP, X-Frame-Options, XSS protection), Vulnerability scanning (known CVEs, outdated libraries), Subdomain enumeration (find forgotten staging servers), Port scanning (open services, misconfigurations), DNS analysis (SPF, DMARC, DKIM records), Third-party scripts (risky dependencies), Cookie security (HttpOnly, Secure, SameSite flags), Authentication mechanisms (password policies, MFA support), Data exposure (sensitive info in HTML/JS). Results include: Severity scores (Critical/High/Medium/Low), Remediation steps (exact fixes with code examples), Compliance mapping (which regulations are affected), Export as PDF report (for stakeholders/auditors). Audits complete in 2-5 minutes.',
                  tip: 'Run audits monthly on production sites and weekly on staging. Export PDF reports for compliance documentation and insurance claims.',
                  action: 'Test it: Type "Audit https://example.com" in GlyphBot and watch it perform a live security scan. Try your own website next.'
                },
                { 
                  heading: 'Voice & Multimodal Interactions', 
                  text: 'GlyphBot supports full voice interaction: Text-to-Speech (TTS): Enable in settings to hear all responses. Choose from 10+ neural voices (male/female, accents, speaking styles). Adjust speed (0.5x-2.0x), pitch (-5 to +5), and emphasis. Great for hands-free use or accessibility. Speech-to-Text (STT): Click microphone icon to speak your query. Supports 40+ languages with auto-detection. Works in noisy environments (noise cancellation built-in). Vision Input: Upload images for analysis (screenshots, diagrams, code, error messages). GlyphBot uses Gemini Vision to understand visual context. Ask "What\'s wrong with this design?" while sharing a mockup. File Analysis: Upload code files, logs, config files for debugging. GlyphBot parses content and provides line-by-line feedback. Supports Python, JavaScript, TypeScript, JSON, YAML, and more.',
                  tip: 'Use voice mode during code reviews—dictate your thoughts while reviewing pull requests. The hands-free flow speeds up feedback by 3x.',
                  code: '// Customize TTS settings\nconst ttsConfig = {\n  provider: "openai",  // or "elevenlabs", "google"\n  voice: "nova",  // shimmer, echo, fable, onyx, nova, alloy\n  speed: 1.2,  // 0.5-2.0\n  pitch: 0,  // -5 to +5\n  emotion: "neutral",  // neutral, excited, calm, professional\n  language: "en-US"\n};\n\n// Enable auto-play on responses\nglyphbot.setTTS(ttsConfig);\nglyphbot.autoPlay = true;  // Plays audio automatically\n\n// Or manual control\nconst audio = await glyphbot.speakText("Your API key has been rotated successfully.");\naudio.play();'
                },
                {
                  heading: 'Context-Aware Assistance',
                  text: 'GlyphBot has deep integration with your GlyphLock account and can reference your data: Account Context (knows your API keys, QR codes, images, usage stats), Session Memory (remembers entire conversation history, even across days), Cross-Tool Awareness (if you just created a QR code, GlyphBot knows and can help debug it), Real-Time Data Access (fetches live data from your entities, not cached). Example queries that use context: "Show me my most-scanned QR code this month" → GlyphBot queries your QR analytics. "Why did my image generation fail?" → GlyphBot checks your recent generations and error logs. "How many API calls did I use today?" → GlyphBot fetches usage metrics. "Debug my latest interactive image" → GlyphBot loads the image + hotspots and analyzes. This eliminates repetitive context-setting—just ask naturally.',
                  tip: 'GlyphBot can also execute actions: "Create a new API key called \'mobile-app\'" or "Rotate my admin API key" work as voice commands.',
                  code: '// Behind the scenes: How GlyphBot accesses your data\n\n// User asks: "What\'s my most popular QR code?"\n\n// GlyphBot executes:\nconst qrCodes = await base44.entities.QrAsset.filter({ created_by: user.email });\nconst scans = await base44.entities.QRScanEvent.list();\n\nconst analytics = qrCodes.map(qr => ({\n  id: qr.id,\n  name: qr.name,\n  scans: scans.filter(s => s.qr_asset_id === qr.id).length\n})).sort((a, b) => b.scans - a.scans);\n\n// GlyphBot responds:\n"Your most popular QR code is \'Conference 2026 Badge\' with 1,247 scans this month. It\'s 340% above your average. The spike started on Feb 8th at 9am—likely when the conference began. Geographic breakdown: 78% from San Francisco, 12% from New York, 10% international. Would you like me to export the full analytics?"'
                },
                {
                  heading: 'Collaborative Problem Solving',
                  text: 'GlyphBot excels at multi-step problem solving with iterative refinement. Workflow: (1) Describe your problem in plain language. (2) GlyphBot asks clarifying questions to narrow scope. (3) Proposes 2-3 solution approaches with pros/cons. (4) You choose an approach. (5) GlyphBot generates implementation (code, configs, step-by-step guide). (6) You test and report results. (7) GlyphBot debugs issues and refines solution. (8) Repeat until solved. Example: You: "My API is slow". Bot: "Is it slow for all endpoints or specific ones? What\'s your current response time?". You: "The /users endpoint takes 3 seconds. Should be <500ms". Bot: "I see you\'re using base44.entities.User.list() without pagination. That loads all 50k users. Solution: (A) Add pagination with limit=50. (B) Add caching with Redis. (C) Database indexing on commonly-queried fields. Recommend starting with A+C. Here\'s the code…"',
                  tip: 'Be specific about constraints: "I can\'t change the database schema" or "Must work on free tier" helps GlyphBot propose realistic solutions.',
                  action: 'Try collaborative debugging: Upload a broken code file and say "This isn\'t working, help me fix it". Follow GlyphBot\'s questions and watch it guide you to the root cause.'
                }
              ]
            },
            {
              title: 'Site Builder & SIE',
              content: [
                { heading: 'AI-Powered Site Building', text: 'Describe your website vision and let AI generate the structure, pages, and components. Access via Tools → Site Builder.' },
                { heading: 'SIE Architecture', text: 'System Intelligence Engine (SIE) scans your entire application architecture, analyzing routes, components, features, and dependencies.' },
                { heading: 'Automated Remediation', text: 'Get AI-generated fixes for detected issues. Review, approve, or modify suggestions before applying changes.' },
                { heading: 'Scan History', text: 'Track all scans, compare results over time, and export detailed audit reports for compliance and documentation.' }
              ]
            },
            {
              title: 'Security & Privacy',
              content: [
                { heading: 'Role-Based Access', text: 'All features respect user roles. Admins have full access, while regular users see only their own data and permitted features.' },
                { heading: 'API Key Management', text: 'Generate API keys from Command Center → API Keys. Each key can have custom permissions and can be rotated or revoked anytime.' },
                { heading: 'MFA Protection', text: 'Enable Multi-Factor Authentication from Account Security. Use authenticator apps like Google Authenticator or Authy for 2FA codes.' },
                { heading: 'Trusted Devices', text: 'Mark devices as trusted to skip MFA prompts. Revoke access to any device from the Account Security panel.' },
                { heading: 'Data Encryption', text: 'All data is encrypted at rest and in transit. Sensitive information like API keys uses additional encryption layers.' }
              ]
            },
            {
              title: 'Blockchain Tools',
              content: [
                { heading: 'Hash Generation', text: 'Create SHA-256, MD5, and other cryptographic hashes. Access via Tools → Blockchain in the navigation.' },
                { heading: 'Merkle Trees', text: 'Build and verify Merkle trees for data integrity. Perfect for audit trails and tamper-proof records.' },
                { heading: 'Proof Export', text: 'Export blockchain proofs as JSON bundles for verification. Share immutable records with stakeholders.' },
                { heading: 'Verification', text: 'Verify blockchain proofs by uploading proof bundles. Instantly validate data integrity and authenticity.' }
              ]
            },
            {
              title: 'Tips & Shortcuts',
              content: [
                { heading: 'Keyboard Shortcuts', text: 'Press ? to open help guide. Use Ctrl/Cmd + K for quick navigation. Tab through forms for faster data entry.' },
                { heading: 'Mobile Access', text: 'GlyphLock is fully responsive. Access all features from mobile devices with optimized touch interfaces.' },
                { heading: 'Save Your Work', text: 'Most tools auto-save your progress. Look for the save icon or status indicator in the top-right of panels.' },
                { heading: 'Export & Share', text: 'Export QR codes, images, audit reports, and blockchain proofs. Generate shareable links for collaboration.' },
                { heading: 'Need Help?', text: 'Use GlyphBot Jr (right sidebar) for instant answers. Contact support from the footer or visit our documentation.' }
              ]
            }
          ]}
        />

        {/* GlyphBot Jr */}
        <div style={{ 
          position: 'fixed', 
          bottom: 0, 
          right: 0, 
          zIndex: 99999, 
          pointerEvents: 'auto !important',
          isolation: 'isolate',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'block !important',
          visibility: 'visible !important'
        }}>
          <GlyphBotJr />
        </div>

        {/* Footer - always rendered */}
        <footer className="relative overflow-hidden" style={{ zIndex: 100, pointerEvents: 'auto', isolation: 'isolate' }}>
          <Footer />
        </footer>
      </div>
    </ThemeProvider>
  );
  }