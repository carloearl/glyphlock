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
          zIndex: -1, 
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
          zIndex: -1, 
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
          boxSizing: 'border-box',
          isolation: 'isolate',
          zIndex: 1,
          position: 'relative'
        }}
      >
        <SecurityMonitor />



        {/* Navbar */}
        <div style={{ position: 'relative', zIndex: 9998, pointerEvents: 'auto', touchAction: 'manipulation' }}>
          <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
        </div>

        {/* Main content */}
        <main className="flex-1 relative pt-4 w-full" style={{ background: 'transparent', zIndex: 10, width: '100%', maxWidth: '100vw', boxSizing: 'border-box', pointerEvents: 'auto', touchAction: 'manipulation' }}>
          {children}
        </main>

        {/* Global Help System */}
        <HelpPanel 
          title="Quick Help Guide"
          sections={[
            {
              title: 'Getting Started',
              content: [
                { 
                  heading: 'First Login & Account Setup', 
                  text: 'Step 1: Sign up or sign in using the button in the top-right corner. Step 2: Verify your email (check spam if not received). Step 3: Complete your profile by clicking your avatar > Account Settings. Step 4: Enable Multi-Factor Authentication immediately for security (Account Security page). Step 5: Explore the Command Center to see your dashboard and usage stats.',
                  tip: 'Save your MFA recovery codes in a password manager immediately after setup—you\'ll need them if you lose your device.',
                  action: 'Click the profile icon (top-right) → Account Security → Enable MFA now.'
                },
                { 
                  heading: 'Navigate the Interface', 
                  text: 'Top Navigation Bar: Click any menu item to see available tools. Hover over "Modules" or "Protocols" to view dropdown menus. Mobile: Tap the hamburger menu icon (three lines) in top-right for full navigation. Command Center: Click your profile picture → Command Center for account settings, API keys, and billing. GlyphBot Jr: The chat icon on the right side provides instant AI assistance—ask it anything. Help: Press the ? key anytime (or click Help icon bottom-right) to reopen this guide.',
                  tip: 'Use keyboard shortcuts: ? for help, Esc to close modals, Tab to navigate forms.',
                  action: 'Try it now: Press Esc to close this panel, then press ? to reopen it.'
                },
                { 
                  heading: 'Common Issues & Fixes', 
                  text: 'Can\'t sign in? Clear browser cache and try again, or click "Forgot Password" on login screen. Page not loading? Refresh with Ctrl+Shift+R (hard refresh) to clear cached resources. Feature not working? Check if you\'re logged in—some tools require authentication. Mobile layout broken? Rotate device or zoom out—try landscape mode for complex tools. GlyphBot not responding? Close chat, wait 5 seconds, reopen, and try a simpler question. API key not working? Rotate it from Command Center → API Keys → click Rotate icon.',
                  tip: 'If you see "Unauthorized" errors, your session expired—just log out and log back in to refresh your token.',
                  action: 'Still stuck? Open GlyphBot Jr (right sidebar) and describe your issue—it has access to your account and can diagnose problems.'
                },
                { 
                  heading: 'Secure Your Account', 
                  text: 'How to enable MFA: Go to profile icon → Account Security → click "Enable MFA" → scan QR code with Google Authenticator or Authy → enter the 6-digit code → save recovery codes to password manager. How to create API keys: Command Center → API Keys tab → click "Generate New Key" → name it → set permissions → copy secret immediately (shown once only). How to rotate keys: API Keys page → find key → click rotate icon → confirm → update apps with new secret. How to manage trusted devices: Account Security → Trusted Devices → revoke any unfamiliar device → verify login history.',
                  tip: 'Recovery codes are your backup if you lose your phone. Store them offline in a password manager, NOT in email or notes apps.',
                  action: 'Enable MFA now: Profile icon → Account Security → Enable MFA button → follow prompts.'
                }
              ]
            },
            {
              title: 'QR Studio',
              content: [
                { 
                  heading: 'Create Your First QR Code', 
                  text: 'Step 1: Navigate to Tools → QR Verification (or top menu → Security Tools → QR Module). Step 2: Click "New QR Code" or "Generate" button. Step 3: Select payload type: URL (website link), vCard (contact info), WiFi (network credentials), Text (plain message), or other options. Step 4: Enter your data (e.g., paste a URL). Step 5: Click "Generate QR Code" and wait 2-5 seconds. Step 6: Preview appears—test by scanning with your phone camera. Step 7: Download as PNG or SVG using the download buttons. Done!',
                  tip: 'For business cards: Choose vCard type → fill in name, phone, email → generate → download → print on your cards.',
                  action: 'Try now: Navigate to QR Verification page → click Generate → select URL → paste glyphlock.com → generate → scan with phone.'
                },
                { 
                  heading: 'Customize QR Code Design', 
                  text: 'How to change colors: After generating QR code → click "Design" or "Customize" tab → select Foreground Color (dark squares) → select Background Color (light areas) → preview updates in real-time. How to add your logo: Click "Upload Logo" button → select PNG/SVG file (max 200KB) → position preview shows logo placement → adjust Error Correction to "High" for best scannability. How to adjust size: Use the Size slider (Small/Medium/Large) → larger codes scan faster from distance. How to change style: Choose preset: Classic (square), Modern (rounded), Dots (circular) → apply style → preview updates instantly.',
                  tip: 'Always use Error Correction "H" (highest) when adding logos—it reserves 30% of the code for damage tolerance.',
                  action: 'Experiment: Generate any QR code → click Design tab → try different foreground/background colors → upload a logo → see live preview.'
                },
                { 
                  heading: 'Download & Share QR Codes', 
                  text: 'How to download: After generating → click "Download PNG" for images or "Download SVG" for vector graphics → file saves to Downloads folder → open and verify it scans properly. How to get shareable link: Click "Share" button → copy the glyphlock.com/share/xyz URL → send to others → they scan the QR code from the shared page (no download needed). How to track scans: After creating QR code → go to QR Vault (in QR Studio) → find your code → click Analytics → see total scans, devices, locations, and timestamps. How to revoke: QR Vault → find code → click "Revoke" → code stops working immediately (scans show "expired" message).',
                  tip: 'Always test QR codes on multiple devices (iPhone, Android, different apps) before printing thousands of copies.',
                  action: 'Test workflow: Generate QR code → download PNG → open file → scan with phone camera → verify it opens correct URL.'
                },
                { 
                  heading: 'QR Code Troubleshooting', 
                  text: 'QR code won\'t scan? Increase Error Correction level (Design tab → Error Correction → High). Ensure sufficient contrast—dark foreground, light background. Remove logos if scanning fails. Print size too small? QR codes need minimum 2cm × 2cm to scan reliably. Export at higher resolution or use SVG for print. Upload failed? File must be under 5MB. Compress images at tinypng.com before uploading logos. Can\'t find my QR codes? Navigate to QR Vault (QR Studio page → Vault tab) → all your codes listed there. Use search to find by name. Colors not showing? Some QR scanners ignore color. Always test with multiple scanner apps (default camera, QR scanner apps) before finalizing design.',
                  tip: 'For outdoor/printed QR codes: Use high error correction (H level), avoid gradients, keep colors simple, and test in different lighting conditions.',
                  action: 'If code won\'t scan: Regenerate with Error Correction H → remove logo → use black foreground + white background → test again.'
                }
              ]
            },
            {
              title: 'Image Lab',
              content: [
                { 
                  heading: 'Generate AI Images', 
                  text: 'Step 1: Navigate to Modules → Image Processing (Image Lab page). Step 2: Click the "Generate" tab. Step 3: Type your prompt in the text box (e.g., "sunset over mountains"). Step 4: Click "Generate Image" and wait 10-30 seconds. Step 5: Image appears in preview panel—right-click to download, or click Save to gallery. How to improve results: Be specific—describe lighting, style, mood, and details. Use descriptive words: "photorealistic sunset with golden hour lighting and wispy clouds" beats "sunset". Adjust creativity slider: Low (0.3) = strict to prompt, High (0.9) = artistic interpretation.',
                  tip: 'Getting weird results? Simplify your prompt. Instead of "epic cinematic dramatic sunset", try "peaceful sunset with warm colors".',
                  action: 'Try now: Go to Image Lab → Generate tab → type "mountain landscape at sunrise" → click Generate → wait for result.'
                },
                { 
                  heading: 'Add Interactive Hotspots', 
                  text: 'Step 1: Go to Image Lab → Interactive tab. Step 2: Upload an image or select one from gallery. Step 3: Click anywhere on the image where you want a hotspot. Step 4: AI detects what you clicked and suggests a label (edit if needed). Step 5: Configure action: Choose "Open URL" → paste link → or choose "Show Text" → type message. Step 6: Click "Save Hotspot" → repeat for more hotspots. Step 7: Click "Finalize" to publish. Step 8: Share link or download interactive image + data file. How to edit hotspots: Click existing hotspot → edit panel appears → change label/action → save. How to delete: Right-click hotspot → delete.',
                  tip: 'Hotspots must be at least 40×40 pixels for reliable mobile tapping. Avoid tiny clickable areas.',
                  action: 'Try: Upload product photo → click product → set action "Open URL" → paste buy link → save → test clicking hotspot.'
                },
                { 
                  heading: 'Image Lab Troubleshooting', 
                  text: 'Generation failed? Your prompt might be too vague—add more details (lighting, style, camera angle). If it says "inappropriate content", rephrase to remove flagged words. Try again with simpler language. Image looks weird? Regenerate with different seed (Advanced settings → change Seed number → generate again). Lower creativity slider if results are too abstract. Hands look wrong? Add "hands behind back" or "hands out of frame" to prompt—AI struggles with hand anatomy. Upload failed? Images must be under 10MB. Compress at tinypng.com before uploading. Can\'t find saved images? Go to Gallery tab in Image Lab—all generated images saved there automatically. Hotspots not clickable? Make sure you clicked "Finalize" after adding hotspots—unfinalizedimages don\'t activate interactions.',
                  tip: 'If generation keeps failing, contact support via GlyphBot Jr and describe your prompt—it can suggest fixes.',
                  action: 'Failed generation? Click "Regenerate" button → adjust creativity slider to 0.5 → change seed value → try again.'
                }
              ]
            },
            {
              title: 'GlyphBot AI',
              content: [
                { 
                  heading: 'Ask GlyphBot Anything', 
                  text: 'How to use GlyphBot: Click "GlyphBot" in top menu → type your question in the chat box → press Enter → wait 3-10 seconds for response. What to ask: "How do I create a QR code?", "Audit my website for vulnerabilities", "Explain this error message", "Help me debug this code", "What are the security risks of X?". GlyphBot Jr (right sidebar): Quick version for simple questions. Click chat icon → ask question → get instant answer. Both bots remember your conversation, so you can ask follow-up questions. How to upload files: Click paperclip icon → select file (image, PDF, code) → GlyphBot analyzes it → ask questions about the file.',
                  tip: 'GlyphBot understands context from your account. Ask "Why did my last QR generation fail?" and it checks your recent activity automatically.',
                  action: 'Test: Open GlyphBot Jr (right sidebar) → type "How do I enable MFA?" → get instant step-by-step answer.'
                },
                { 
                  heading: 'Run Security Audits', 
                  text: 'How to audit a website: Go to GlyphBot page → select "Site Auditor" mode → type or paste website URL (e.g., "audit https://example.com") → press Enter → wait 2-5 minutes for comprehensive scan. What you get: Security vulnerabilities (SSL issues, exposed credentials, outdated software), Performance analysis (load time, resource size, optimization tips), SEO check (meta tags, mobile-friendliness, structured data), Accessibility report (WCAG compliance, screen reader support). How to download report: After audit completes → click "Download PDF" → save for compliance records or client presentations. How to save audits: Results auto-save to your account → view past audits in Audit History panel.',
                  tip: 'Run audits monthly on production sites. Export PDFs for compliance documentation required by insurance or regulators.',
                  action: 'Try now: Go to GlyphBot → type "audit https://glyphlock.com" → wait for results → review findings → download PDF report.'
                },
                { 
                  heading: 'GlyphBot Tips & Tricks', 
                  text: 'Ask GlyphBot to "explain X in simple terms" for beginner-friendly answers. Upload screenshots of errors—GlyphBot reads text from images and diagnoses issues. Use voice input (click microphone icon) for hands-free operation while working. Save important conversations: Click "Save Chat" → name it → access later from History panel. Clear chat to start fresh: Click three-dot menu → Clear Conversation → confirm. GlyphBot not answering? Wait 10 seconds—might be processing large request. If still stuck, refresh page and ask again with simpler phrasing. Enable TTS (text-to-speech): Settings icon → toggle "Speak Responses" → choose voice → responses read aloud automatically.',
                  tip: 'For complex questions, break them into smaller parts. Ask "How do I set up MFA?" first, then "What if I lose my device?" separately.',
                  action: 'Test voice: Open GlyphBot → click microphone icon → say "What is GlyphLock?" → watch it transcribe and answer.'
                }
              ]
            },
            {
              title: 'Account & Billing',
              content: [
                { 
                  heading: 'Manage Subscription', 
                  text: 'How to upgrade: Profile icon → Command Center → Billing tab → click "Upgrade Plan" → choose Professional ($49/mo) or Enterprise ($199/mo) → enter payment details → confirm. Current plan shows at top of billing page. How to cancel: Billing tab → scroll to bottom → click "Cancel Subscription" → confirm → access continues until period ends. How to update payment: Billing tab → Payment Methods → click "Update Card" → enter new details → save. How to view invoices: Billing tab → Invoice History → click any invoice to download PDF. Billing issues? Email glyphlock@gmail.com with your account email.',
                  tip: 'Subscription renews automatically. Cancel at least 24 hours before renewal date to avoid next charge.',
                  action: 'Check current plan: Profile icon → Command Center → Billing tab → see plan name at top.'
                },
                { 
                  heading: 'API Keys & Integration', 
                  text: 'How to create API key: Command Center → API Keys tab → click "Generate New Key" → name it (e.g., "mobile-app") → set permissions (read-only or read-write) → click Generate → COPY SECRET IMMEDIATELY (shown only once) → save to password manager. How to use key: Add to request headers: Authorization: Bearer YOUR_SECRET_KEY. Test with curl: curl -H "Authorization: Bearer YOUR_KEY" https://api.glyphlock.com/v1/qr/list. How to rotate key: API Keys tab → find key → click rotate icon → old key stops working, new one issued → update apps with new secret within 24 hours. How to revoke: Click trash icon → confirm → key invalidated immediately.',
                  tip: 'Never commit API keys to Git repos. Use environment variables: process.env.GLYPHLOCK_API_KEY in your code.',
                  action: 'Create test key: Command Center → API Keys → Generate → name it "test-key" → copy secret → test with curl command.'
                },
                { 
                  heading: 'Usage Limits & Quotas', 
                  text: 'How to check usage: Command Center → Dashboard → see real-time counters for QR generations, image generations, API calls, storage used. Free tier limits: 50 QR codes/month, 20 AI images/month, 1,000 API calls/month, 1GB storage. Pro tier limits: 1,000 QR codes/month, 500 images/month, 100k API calls/month, 50GB storage. Enterprise: Unlimited everything. What happens at limit? Free users see upgrade prompt. Pro users can purchase add-ons. Enterprise never hits limits. How to buy add-ons: Billing tab → Add-Ons → select what you need (e.g., +100 QR codes for $10) → pay → quota increases immediately.',
                  tip: 'Usage resets on your billing cycle date (shown in Billing tab). Plan ahead if you\'re close to limits.',
                  action: 'Monitor usage: Command Center → Dashboard → check gauges showing % of monthly quota used.'
                },
                { 
                  heading: 'Data Export & Backup', 
                  text: 'How to export all data: Command Center → Settings → scroll to "Data Export" → click "Export All Data" → wait 5-15 minutes → download ZIP file with all QR codes, images, hotspots, analytics in JSON format. How to backup specific items: QR Vault → select codes → click "Export Selected" → download JSON. Image Gallery → select images → click "Download Batch" → gets ZIP of images + metadata. How to delete account: Command Center → Settings → scroll to bottom → click "Delete Account" → verify email → confirm (WARNING: irreversible, deletes all data after 7 days). How to restore: Within 7-day grace period, contact support to cancel deletion.',
                  tip: 'Export data before canceling subscription—you lose access immediately upon cancellation, but data persists for 30 days for exports.',
                  action: 'Backup now: Command Center → Settings → Export All Data → wait for email with download link (arrives within 1 hour).'
                }
              ]
            },
            {
              title: 'Security Tools',
              content: [
                { 
                  heading: 'Hash Generator', 
                  text: 'How to create hash: Navigate to Security Tools → Blockchain tab → find "Hash Generator" section → paste or type your text → select algorithm (SHA-256 recommended) → click "Generate Hash" → hash appears instantly → click "Copy" icon to clipboard. Use cases: Verify file integrity (hash file before/after transfer—if hashes match, file unmodified), Password hashing (never store plain passwords), Digital signatures, Data verification. Supported algorithms: SHA-256 (most secure), SHA-512, MD5 (legacy only), SHA-1 (legacy only).',
                  tip: 'SHA-256 is quantum-resistant and industry standard. Avoid MD5/SHA-1 for new projects—they\'re crackable.',
                  action: 'Try: Blockchain page → Hash Generator → type "hello world" → generate SHA-256 hash → copy result.'
                },
                { 
                  heading: 'Blockchain Verification', 
                  text: 'How to create proof: Blockchain page → "Create Proof" button → enter data to verify (text, file hash, transaction ID) → click "Generate Proof" → blockchain record created with timestamp → download proof bundle (JSON file). How to verify proof: Blockchain page → "Verify Proof" tab → upload proof bundle JSON → click "Verify" → see result (Valid/Invalid/Tampered) with original data and timestamp. Use cases: Prove document existed at specific time (legal evidence), Verify contract wasn\'t altered after signing, Timestamping intellectual property before public disclosure.',
                  tip: 'Blockchain proofs are immutable. Once created, they\'re permanent evidence of data state at creation time.',
                  action: 'Create proof: Blockchain page → Create tab → paste "Important document hash: abc123" → generate → download proof.json → share with recipient.'
                },
                { 
                  heading: 'Security Operations Center', 
                  text: 'How to access: Navigate to Modules → Security Operations (or Security Tools → SOC Module). What it shows: Real-time threat monitor (live alerts for suspicious activity on your account), Security alerts (failed login attempts, API key misuse, unusual scan patterns), Compliance dashboard (GDPR/HIPAA/SOC2 status), Audit logs (all account actions timestamped). How to set alerts: SOC page → Alert Settings → define rules (e.g., "Alert if >100 API calls/minute") → save → get email when triggered. How to respond to alerts: Click alert → see details → click "Investigate" → GlyphBot provides remediation steps.',
                  tip: 'Enable email alerts for critical events so you\'re notified immediately of security incidents, even when not logged in.',
                  action: 'Check security status: Navigate to Security Operations Center → view live threat monitor → review recent alerts → acknowledge any warnings.'
                }
              ]
            },
            {
              title: 'Mobile Usage',
              content: [
                { 
                  heading: 'Mobile Navigation', 
                  text: 'How to open menu: Tap hamburger icon (three horizontal lines) in top-right corner → full menu slides in → tap any section to expand → tap item to navigate → menu auto-closes. How to scroll long pages: Use finger swipe up/down → pages optimized for touch scrolling → snap scroll disabled for smooth control. How to zoom: Pinch to zoom works on images and previews (not forms—prevents accidental zoom when typing). How to go back: Use browser back button or swipe from left edge on iOS/Android. Bottom navigation: Some tools show tabs at bottom for easy thumb reach.',
                  tip: 'Rotate to landscape mode for tools with complex interfaces (Image Lab, QR Studio) for more screen space.',
                  action: 'Test: Tap menu icon → expand Modules section → tap QR Verification → page loads → menu closes automatically.'
                },
                { 
                  heading: 'Mobile Performance', 
                  text: 'Slow loading? Switch to WiFi from cellular data—some features like AI generation require faster connection. Close other browser tabs to free memory. Images not loading? Scroll past them then scroll back—lazy loading triggers on second pass. Force refresh: Pull down from top of page → release → page reloads. App feels laggy? Close browser completely → clear cache (browser settings → clear data) → reopen → speed improves. Animations stuttering? Disable animations in device settings (iOS: Settings → Accessibility → Motion → Reduce Motion ON. Android: Settings → Accessibility → Remove Animations).',
                  tip: 'For best mobile experience: Use Chrome or Safari (latest version), enable JavaScript, allow cookies, update OS to latest version.',
                  action: 'Speed up mobile: Device settings → clear browser cache → restart browser → reload GlyphLock → performance improved.'
                }
              ]
            },
            {
              title: 'Contact & Support',
              content: [
                { 
                  heading: 'Get Help Fast', 
                  text: 'GlyphBot Jr (right sidebar): Fastest way to get answers. Click chat icon → type question → instant response. Knows your account context. Email Support: glyphlock@gmail.com for billing, technical issues, or partnership inquiries. Response within 24 hours (usually faster). Phone: +1-424-246-6499 for urgent issues (enterprise customers only). Knowledge Base: Press ? key anytime to open this guide. Search sections on left sidebar. Community: Check FAQ page (footer → FAQ) for common questions and troubleshooting guides.',
                  tip: 'Before contacting support: Try GlyphBot Jr first—it resolves 80% of issues instantly and has access to your account data.',
                  action: 'Need help right now? Click GlyphBot Jr icon (right side) → describe your issue → get immediate assistance with account context.'
                },
                { 
                  heading: 'Report Bugs & Feedback', 
                  text: 'How to report bug: Describe issue to GlyphBot Jr with screenshot → or email glyphlock@gmail.com with: (1) What you tried to do, (2) What happened instead, (3) Browser/device info, (4) Screenshot if possible. How to request features: GlyphBot Jr → say "I want feature X" → it logs request → or email glyphlock@gmail.com with "Feature Request: [your idea]". How to give feedback: After using any tool → look for feedback button/icon → rate experience → add comment → submit. Your input shapes roadmap!',
                  tip: 'Include your browser (Chrome/Safari/Firefox) and device (iPhone/Android/Desktop) when reporting bugs for faster diagnosis.',
                  action: 'Found a bug? Open GlyphBot Jr → say "I found a bug with [feature]" → describe what happened → it logs issue and may provide immediate fix.'
                }
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