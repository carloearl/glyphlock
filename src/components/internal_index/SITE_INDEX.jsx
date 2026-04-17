{
  "version": "1.0.0",
  "lastUpdated": "2025-01-15T14:30:00Z",
  "auditor": "Claude AI Phase 1",
  
  "pages": {
    "public": [
      {"name": "Home", "route": "/", "status": "active", "seo": true},
      {"name": "About", "route": "/about", "status": "active", "seo": true},
      {"name": "Contact", "route": "/contact", "status": "active", "seo": true},
      {"name": "Partners", "route": "/partners", "status": "active", "seo": true},
      {"name": "Roadmap", "route": "/roadmap", "status": "active", "seo": true},
      {"name": "DreamTeam", "route": "/dream-team", "status": "active", "seo": true},
      {"name": "Pricing", "route": "/pricing", "status": "active", "seo": true},
      {"name": "Consultation", "route": "/consultation", "status": "active", "seo": true},
      {"name": "ConsultationSuccess", "route": "/consultation-success", "status": "active", "seo": false},
      {"name": "FAQ", "route": "/faq", "status": "active", "seo": true},
      {"name": "Services", "route": "/services", "status": "active", "seo": true},
      {"name": "Solutions", "route": "/solutions", "status": "active", "seo": true}
    ],
    "products": [
      {"name": "Qr", "route": "/qr", "status": "active", "seo": true, "tabs": ["create", "preview", "customize", "hotzones", "stego", "security", "analytics", "bulk"]},
      {"name": "ImageLab", "route": "/image-lab", "status": "active", "seo": true, "paywall": true},
      {"name": "GlyphBot", "route": "/glyphbot", "status": "active", "seo": true},
      {"name": "GlyphBotJunior", "route": "/glyphbot-junior", "status": "active", "seo": false},
      {"name": "Blockchain", "route": "/blockchain", "status": "active", "seo": false, "freeTrialGuard": true},
      {"name": "SecurityTools", "route": "/security-tools", "status": "active", "seo": false},
      {"name": "SecurityOperationsCenter", "route": "/security-operations-center", "status": "active", "seo": false},
      {"name": "HotzoneMapper", "route": "/hotzone-mapper", "status": "active", "seo": true, "comingSoon": true},
      {"name": "ContentGenerator", "route": "/content-generator", "status": "active", "seo": false, "freeTrialGuard": true},
      {"name": "InteractiveImageStudio", "route": "/interactive-image-studio", "status": "active", "seo": true, "authRequired": true}
    ],
    "pos": [
      {"name": "NUPSLogin", "route": "/nups-login", "status": "active", "seo": false},
      {"name": "NUPSStaff", "route": "/nups-staff", "status": "active", "seo": false, "authRequired": true},
      {"name": "NUPSOwner", "route": "/nups-owner", "status": "active", "seo": false, "authRequired": true, "roleRequired": "admin"}
    ],
    "dashboard": [
      {"name": "Dashboard", "route": "/dashboard", "status": "active", "seo": false, "authRequired": true},
      {"name": "CommandCenter", "route": "/command-center", "status": "active", "seo": true, "authRequired": true},
      {"name": "ProviderConsole", "route": "/provider-console", "status": "active", "seo": false}
    ],
    "legal": [
      {"name": "Privacy", "route": "/privacy", "status": "active", "seo": true},
      {"name": "Terms", "route": "/terms", "status": "active", "seo": true},
      {"name": "Cookies", "route": "/cookies", "status": "active", "seo": true},
      {"name": "Accessibility", "route": "/accessibility", "status": "active", "seo": true}
    ],
    "governance": [
      {"name": "GovernanceHub", "route": "/governance-hub", "status": "active", "seo": true},
      {"name": "MasterCovenant", "route": "/master-covenant", "status": "redirect", "redirectTo": "GovernanceHub"}
    ],
    "payment": [
      {"name": "PaymentSuccess", "route": "/payment-success", "status": "active", "seo": false, "issues": ["DeveloperConsole link broken"]},
      {"name": "PaymentCancel", "route": "/payment-cancel", "status": "active", "seo": false},
      {"name": "ManageSubscription", "route": "/manage-subscription", "status": "active", "seo": false},
      {"name": "BillingAndPayments", "route": "/billing-and-payments", "status": "active", "seo": false}
    ],
    "seo_sitemaps": [
      {"name": "Sitemap", "route": "/sitemap", "status": "active", "seo": true},
      {"name": "SitemapXml", "route": "/sitemap-xml", "status": "active", "seo": false},
      {"name": "SitemapApp", "route": "/sitemap-app", "status": "active", "seo": false},
      {"name": "SitemapQr", "route": "/sitemap-qr", "status": "active", "seo": false},
      {"name": "SitemapImages", "route": "/sitemap-images", "status": "active", "seo": false},
      {"name": "SitemapInteractive", "route": "/sitemap-interactive", "status": "active", "seo": false},
      {"name": "SitemapDynamic", "route": "/sitemap-dynamic", "status": "active", "seo": false},
      {"name": "Robots", "route": "/robots", "status": "active", "seo": false}
    ],
    "docs": [
      {"name": "SecurityDocs", "route": "/security-docs", "status": "active", "seo": true},
      {"name": "SDKDocs", "route": "/sdk-docs", "status": "active", "seo": true}
    ],
    "admin": [
      {"name": "IntegrationTests", "route": "/integration-tests", "status": "active", "seo": false, "roleRequired": "admin"}
    ],
    "special": [
      {"name": "EntertainerCheckIn", "route": "/entertainer-check-in", "status": "active", "seo": false},
      {"name": "VIPContract", "route": "/vip-contract", "status": "active", "seo": false},
      {"name": "HSSS", "route": "/hsss", "status": "active", "seo": false},
      {"name": "ImageGenerator", "route": "/image-generator", "status": "deprecated", "note": "Replaced by ImageLab"}
    ],
    "errors": [
      {"name": "NotFound", "route": "/404", "status": "active", "seo": false}
    ]
  },
  
  "navigation": {
    "navbar": {
      "sections": ["Company", "Products", "Resources"],
      "company": ["About", "Partners", "Contact", "Accessibility"],
      "products": ["Qr", "ImageLab", "GlyphBot", "NUPSLogin", "SecurityTools"],
      "resources": ["SecurityDocs", "SDKDocs", "DreamTeam", "Pricing", "Consultation"]
    },
    "footer": {
      "company": ["About", "Partners", "Contact", "Accessibility"],
      "products": ["Qr", "ImageLab", "GlyphBot", "NUPSLogin", "SecurityTools"],
      "resources": ["SecurityDocs", "SDKDocs", "DreamTeam", "Pricing", "FAQ", "Roadmap"],
      "legal": ["Privacy", "Terms", "Cookies"]
    }
  },
  
  "deadLinks": [
    {
      "location": "PaymentSuccess.jsx line 134",
      "target": "DeveloperConsole",
      "expected": "CommandCenter",
      "severity": "medium"
    },
    {
      "location": "SecurityTools.jsx line 14-15",
      "target": "VisualCryptography",
      "expected": "Qr or SecurityTools",
      "severity": "high",
      "note": "VisualCryptography page does not exist"
    },
    {
      "location": "SecurityTools.jsx line 165",
      "target": "VisualCryptography",
      "expected": "Qr",
      "severity": "high"
    },
    {
      "location": "Services.jsx line 93",
      "target": "SecurityOperations",
      "expected": "SecurityOperationsCenter",
      "severity": "medium"
    }
  ],
  
  "orphanPages": [
    {
      "name": "ImageGenerator",
      "reason": "Deprecated - replaced by ImageLab, no navigation links"
    },
    {
      "name": "HSSS",
      "reason": "No navigation links found"
    },
    {
      "name": "EntertainerCheckIn",
      "reason": "No public navigation, accessed from NUPS only"
    },
    {
      "name": "VIPContract",
      "reason": "No public navigation, accessed from NUPS only"
    },
    {
      "name": "IntegrationTests",
      "reason": "Admin-only testing page, no public navigation"
    },
    {
      "name": "BillingAndPayments",
      "reason": "Accessed from CommandCenter only"
    },
    {
      "name": "ProviderConsole",
      "reason": "Accessed from GlyphBot only"
    }
  ],
  
  "redirects": [
    {
      "from": "MasterCovenant",
      "to": "GovernanceHub",
      "type": "programmatic"
    }
  ],
  
  "missingInNavigation": [
    "FAQ (missing from Navbar Resources, present in Footer)",
    "Roadmap (missing from Navbar Resources, present in Footer)",
    "Consultation (missing from Footer Resources)"
  ],
  
  "routingIssues": {
    "fixed": [
      {
        "file": "components/Navbar.jsx",
        "issue": "Mobile menu linked to QrGenerator instead of Qr",
        "fix": "Changed to Qr",
        "status": "FIXED"
      },
      {
        "file": "pages/SitemapQr.jsx",
        "issue": "All routes used /qr-generator instead of /qr",
        "fix": "Changed all routes to /qr",
        "status": "FIXED"
      },
      {
        "file": "pages/SitemapQr.jsx",
        "issue": "CTA link used QrGenerator instead of Qr",
        "fix": "Changed to Qr",
        "status": "FIXED"
      }
    ],
    "pending": [
      {
        "file": "pages/PaymentSuccess.jsx",
        "issue": "Links to DeveloperConsole which doesn't exist",
        "fix": "Should be CommandCenter",
        "priority": "medium"
      },
      {
        "file": "pages/SecurityTools.jsx",
        "issue": "Links to VisualCryptography which doesn't exist",
        "fix": "Should be Qr or removed",
        "priority": "high"
      },
      {
        "file": "pages/Services.jsx",
        "issue": "Links to SecurityOperations instead of SecurityOperationsCenter",
        "fix": "Update to SecurityOperationsCenter",
        "priority": "medium"
      }
    ]
  },
  
  "entities": {
    "qr": ["QRGenHistory", "QRAIScore", "QRThreatLog", "QrScanEvent", "QrAsset"],
    "pos": ["POSProduct", "POSTransaction", "POSBatch", "POSCustomer", "POSCampaign", "POSLocation", "POSInventoryBatch", "POSZReport"],
    "entertainers": ["Entertainer", "EntertainerShift", "VIPRoom", "VIPGuest"],
    "media": ["InteractiveImage", "ImageHotspot", "ImageHashLog"],
    "system": ["Consultation", "ServiceUsage", "APIKey", "SystemAuditLog", "UserPreferences", "LLMFeedback", "Conversation"]
  },
  
  "functions": {
    "qr": ["generateSecureQR", "qrRedirect", "generateQrAsset", "evaluateQrRisk", "verifyQrTamper"],
    "stego": ["buildStegoDisguisedImage", "extractStegoPayload", "encodeImageData", "decodeImageData"],
    "stripe": ["stripeCreateCheckout", "stripeWebhook", "stripeCheckout", "stripePoll", "getSubscriptionDetails", "cancelSubscription"],
    "ai": ["glyphbotLLM", "glyphbotWebSearch", "glyphbotFileUpload", "puterLLM", "textToSpeech", "textToSpeechAdvanced", "coquiTTS"],
    "security": ["detectThreat", "generateSecurityReport", "alertManagement", "botDetection", "botSecurityCheck", "securityHeaders", "honeypot", "rateLimiter", "trafficMonitor"],
    "sitemap": ["sitemap", "sitemapIndex", "sitemapApp", "sitemapQr", "sitemapImages", "sitemapInteractive", "sitemapDynamic", "robotsTxt"],
    "pos": ["entertainerCheckIn", "vipContractGenerate", "vipContractSign"],
    "console": ["generateAPIKey", "rotateAPIKey", "downloadSDK", "keysList", "usageSummary", "logsList", "securityGetPolicies", "securitySetPolicy", "notificationsList"],
    "studio": ["saveImageHotspots", "finalizeInteractiveImage", "getImageHashLog"],
    "system": ["health", "testIntegrations", "generateAnalytics", "glyphlockWebhook", "supabaseProxy"]
  },
  
  "seoStatus": {
    "pagesWithSEOHead": 28,
    "pagesWithoutSEOHead": 14,
    "structuredDataPages": ["Home", "Qr", "FAQ", "GovernanceHub", "About", "SDKDocs"]
  }
}