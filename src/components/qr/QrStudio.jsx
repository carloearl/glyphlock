import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Loader2, Wand2, Layers, Shield, Sparkles, Zap, Lock, Eye, Download, Info, BarChart3, Upload, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { GlyphIcon } from '@/components/icons/GlyphIcons';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GlyphCard, 
  GlyphButton, 
  GlyphTypography, 
  GlyphShadows 
} from './design/GlyphQrDesignSystem';
import { PAYLOAD_TYPES } from './config/PayloadTypesCatalog';
import PayloadTypeSelector from './PayloadTypeSelector';
import QrSecurityBadge from './QrSecurityBadge';
import QrPreviewPanel from './QrPreviewPanel';
import QrCustomizationPanel from './QrCustomizationPanel';
import AnalyticsPanel from './AnalyticsPanel';
import QrBatchUploader from './QrBatchUploader';
import SecurityStatus from './SecurityStatus';
import SteganographicQR from './SteganographicQR';
import CanvasQrRenderer from './CanvasQrRenderer';
import QRTypeForm from '@/components/crypto/QRTypeForm';
import { generateSHA256, performStaticURLChecks } from '@/components/utils/securityUtils';
import { useQrPreviewStorage } from './QrPreviewStorage';
import QrPreviewSidebar from './QrPreviewSidebar';
import QrVaultPanel from './QrVaultPanel';
import QrDiagnosticsPanel from './QrDiagnosticsPanel';


export default function QrStudio({ initialTab = 'create' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentUser, setCurrentUser] = useState(null);
  const [vaultedItems, setVaultedItems] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);

  // Load current user
  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          setCurrentUser(user);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    })();
  }, []);

  // Preview storage hook
  const {
    previews,
    loading: previewsLoading,
    savePreview,
    saveToVault,
    deletePreview,
    loadPreviews,
    loadVaultedItems,
    previewCount,
    maxPreviews
  } = useQrPreviewStorage(currentUser?.email);

  // Load vault items
  const refreshVault = useCallback(async () => {
    if (!currentUser?.email) return;
    setVaultLoading(true);
    const items = await loadVaultedItems();
    setVaultedItems(items);
    setVaultLoading(false);
  }, [currentUser?.email, loadVaultedItems]);

  useEffect(() => {
    refreshVault();
  }, [refreshVault]);

  // Sync activeTab with initialTab prop
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      const validTabs = ['create', 'customize', 'preview', 'stego', 'security', 'analytics', 'bulk'];
      if (validTabs.includes(initialTab)) {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  // Update URL when tab changes
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/qr' || currentPath === '/Qr') {
      if (activeTab && activeTab !== 'create') {
        window.history.replaceState(null, '', `/qr?tab=${activeTab}`);
      } else {
        window.history.replaceState(null, '', '/qr');
      }
    }
  }, [activeTab]);



  // ========== PAYLOAD STATE ==========
  const [payloadType, setPayloadType] = useState('url');
  const [showPayloadSelector, setShowPayloadSelector] = useState(false);
  const [qrAssetDraft, setQrAssetDraft] = useState(null);

  // ========== CUSTOMIZATION STATE ==========
  const [customization, setCustomization] = useState({
    dotStyle: 'square',
    eyeStyle: 'square',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    gradient: {
      enabled: false,
      type: 'linear',
      angle: 0,
      color1: '#000000',
      color2: '#3B82F6',
      color3: '#8B5CF6',
      color4: null,
      color5: null
    },
    eyeColors: {
      topLeft: { inner: '#000000', outer: '#000000' },
      topRight: { inner: '#000000', outer: '#000000' },
      bottomLeft: { inner: '#000000', outer: '#000000' }
    },
    logo: {
      url: null,
      file: null,
      opacity: 100,
      size: 20,
      border: false,
      shape: 'square',
      position: 'center',
      rotation: 0,
      dropShadow: false,
      autoContrast: true
    },
    background: {
            type: 'solid',
            color: '#ffffff',
            gradientColor1: '#ffffff',
      gradientColor2: '#E5E7EB',
      imageUrl: null,
      blur: 0,
      pattern: 'none',
      transparency: 100
    },
    qrShape: {
      type: 'standard',
      margin: 'medium',
      cornerRadius: 0
    }
  });

  // ========== QR GENERATION STATE ==========
  const [qrType, setQrType] = useState("url");
  const [qrData, setQrData] = useState({
    url: "", text: "", email: "", emailSubject: "", emailBody: "",
    phone: "", smsNumber: "", smsMessage: "",
    wifiSSID: "", wifiPassword: "", wifiEncryption: "WPA", wifiHidden: false,
    vcardFirstName: "", vcardLastName: "", vcardOrganization: "", vcardPhone: "", vcardEmail: "", vcardWebsite: "", vcardAddress: "",
    latitude: "", longitude: "",
    eventTitle: "", eventLocation: "", eventStartDate: "", eventStartTime: "", eventEndDate: "", eventEndTime: "", eventDescription: ""
  });
  const [size, setSize] = useState(512);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  const [qrGenerated, setQrGenerated] = useState(false);
  const defaultPayload = 'https://glyphlock.io';
  const [isScanning, setIsScanning] = useState(false);
  const [securityResult, setSecurityResult] = useState(null);
  const [codeId, setCodeId] = useState(null);
  const [scanningStage, setScanningStage] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  // QR Types with security flags
  const qrTypes = [
    { id: "url", name: "URL/Website", needsSecurity: true },
    { id: "text", name: "Plain Text", needsSecurity: false },
    { id: "email", name: "Email", needsSecurity: true },
    { id: "phone", name: "Phone Number", needsSecurity: false },
    { id: "sms", name: "SMS Message", needsSecurity: false },
    { id: "wifi", name: "WiFi Network", needsSecurity: false },
    { id: "vcard", name: "Contact Card", needsSecurity: false },
    { id: "location", name: "GPS Location", needsSecurity: false },
    { id: "event", name: "Calendar Event", needsSecurity: false }
  ];

  const selectedPayloadType = PAYLOAD_TYPES.find(t => t.id === payloadType);
  const currentTypeConfig = qrTypes.find(t => t.id === qrType);

  // ========== BUILD PAYLOAD ==========
  const buildQRPayload = () => {
    switch (qrType) {
      case "url": return qrData.url;
      case "text": return qrData.text;
      case "email": return `mailto:${qrData.email}?subject=${encodeURIComponent(qrData.emailSubject)}&body=${encodeURIComponent(qrData.emailBody)}`;
      case "phone": return `tel:${qrData.phone}`;
      case "sms": return `SMSTO:${qrData.smsNumber}:${qrData.smsMessage}`;
      case "wifi": return `WIFI:T:${qrData.wifiEncryption};S:${qrData.wifiSSID};P:${qrData.wifiPassword};H:${qrData.wifiHidden};`;
      case "vcard": return `BEGIN:VCARD\nVERSION:3.0\nN:${qrData.vcardLastName};${qrData.vcardFirstName}\nFN:${qrData.vcardFirstName} ${qrData.vcardLastName}\nORG:${qrData.vcardOrganization}\nTEL:${qrData.vcardPhone}\nEMAIL:${qrData.vcardEmail}\nURL:${qrData.vcardWebsite}\nADR:${qrData.vcardAddress}\nEND:VCARD`;
      case "location": return `geo:${qrData.latitude},${qrData.longitude}`;
      case "event": {
        const startDateTime = `${qrData.eventStartDate}T${qrData.eventStartTime}:00`;
        const endDateTime = `${qrData.eventEndDate}T${qrData.eventEndTime}:00`;
        return `BEGIN:VEVENT\nSUMMARY:${qrData.eventTitle}\nLOCATION:${qrData.eventLocation}\nDTSTART:${startDateTime.replace(/[-:]/g, '')}\nDTEND:${endDateTime.replace(/[-:]/g, '')}\nDESCRIPTION:${qrData.eventDescription}\nEND:VEVENT`;
      default: return "";
      }
    }
  };

  // ========== GET CURRENT PAYLOAD (UNIFIED) ==========
  const getCurrentPayload = useCallback(() => {
    return buildQRPayload() || 'https://glyphlock.io';
  }, [qrData, qrType]);

  // ========== QR DATA URL HANDLER ==========
  const handleQrDataUrlReady = useCallback((dataUrl) => {
    setQrDataUrl(dataUrl);
    if (qrGenerated) {
      setQrAssetDraft(prev => prev ? { ...prev, safeQrImageUrl: dataUrl } : prev);
    }
  }, [qrGenerated]);

  // ========== NLP ANALYSIS ==========
  const performNLPAnalysis = async (payload) => {
    setScanningStage("Running NLP analysis...");
    try {
      return await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze for security threats: "${payload}". Return domain_trust, sentiment_score, entity_legitimacy, url_features (each 0-100), final_score, risk_level, threat_types, phishing_indicators, analysis_details, ml_version`,
        response_json_schema: {
          type: "object",
          properties: {
            domain_trust: { type: "number" },
            sentiment_score: { type: "number" },
            entity_legitimacy: { type: "number" },
            url_features: { type: "number" },
            final_score: { type: "number" },
            risk_level: { type: "string" },
            threat_types: { type: "array", items: { type: "string" } },
            phishing_indicators: { type: "array", items: { type: "string" } },
            analysis_details: { type: "string" },
            ml_version: { type: "string" }
          }
        }
      });
    } catch {
      return {
        domain_trust: 50, sentiment_score: 50, entity_legitimacy: 50, url_features: 50,
        final_score: 50, risk_level: "medium", threat_types: ["Analysis Error"],
        phishing_indicators: ["Analysis incomplete"], ml_version: "1.0.0"
      };
    }
  };

  // ========== LOGO UPLOAD HANDLER ==========
  const handleLogoUpload = (file) => {
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCustomization(prev => ({
        ...prev,
        logo: { ...prev.logo, url: reader.result }
      }));
    };
    reader.readAsDataURL(file);
  };

  // ========== UPLOAD LOGO TO SERVER ==========
  const uploadLogoToServer = async () => {
    if (logoFile) {
      try {
        setScanningStage("Uploading logo...");
        const { file_url } = await base44.integrations.Core.UploadFile({ file: logoFile });
        setCustomization(prev => ({
          ...prev,
          logo: { ...prev.logo, url: file_url }
        }));
        setLogoFile(null);
        return file_url;
      } catch (error) {
        console.error("Logo upload error:", error);
        toast.error("Failed to upload logo");
        return null;
      }
    }
    return customization.logo?.url;
  };

  // ========== GENERATE QR ==========
  const generateQR = async () => {
    const payload = buildQRPayload();
    if (!payload) {
      toast.error("Please fill in required fields");
      return;
    }
    
    setIsScanning(true);
    setSecurityResult(null);
    setQrGenerated(false);

    try {
      const needsSecurity = currentTypeConfig?.needsSecurity;
      let combinedResult = null;

      if (needsSecurity) {
        setScanningStage("Performing security checks...");
        await new Promise(resolve => setTimeout(resolve, 500));
        const staticResult = performStaticURLChecks(payload);
        const nlpResult = await performNLPAnalysis(payload);
        
        const finalScore = Math.round(
          (nlpResult.domain_trust * 0.4) +
          (nlpResult.sentiment_score * 0.25) +
          (nlpResult.entity_legitimacy * 0.2) +
          (nlpResult.url_features * 0.15)
        );

        combinedResult = {
          ...nlpResult,
          final_score: Math.min(finalScore, staticResult.score),
          phishing_indicators: [...staticResult.issues, ...(nlpResult.phishing_indicators || [])],
          risk_level: finalScore >= 80 ? "safe" : (finalScore >= 65 ? "medium" : "high")
        };

        setSecurityResult(combinedResult);

        if (combinedResult.final_score < 65) {
          const newCodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await base44.entities.QRThreatLog.create({
            incident_id: `threat_${Date.now()}`,
            code_id: newCodeId,
            attack_type: combinedResult.threat_types?.[0] || "High Risk",
            payload,
            threat_description: `Blocked: Score ${combinedResult.final_score}/100`,
            severity: "high"
          });
          setIsScanning(false);
          toast.error("QR blocked due to security concerns");
          return;
        }
      }

      setQrGenerated(true);
      const newCodeId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCodeId(newCodeId);

      const finalLogoUrl = await uploadLogoToServer();

      await base44.entities.QRGenHistory.create({
        code_id: newCodeId,
        payload,
        payload_sha256: await generateSHA256(payload),
        size,
        creator_id: currentUser?.email || "anonymous",
        status: combinedResult ? (combinedResult.final_score >= 80 ? "safe" : "suspicious") : "safe",
        type: qrType,
        image_format: "png",
        error_correction: errorCorrectionLevel,
        foreground_color: customization.foregroundColor,
        background_color: customization.backgroundColor,
        has_logo: !!finalLogoUrl,
        logo_url: finalLogoUrl
      });

      if (combinedResult) {
        await base44.entities.QRAIScore.create({
          code_id: newCodeId,
          final_score: combinedResult.final_score,
          domain_trust: combinedResult.domain_trust,
          sentiment_score: combinedResult.sentiment_score,
          entity_legitimacy: combinedResult.entity_legitimacy,
          risk_level: combinedResult.risk_level,
          ml_version: combinedResult.ml_version || "1.0.0",
          phishing_indicators: combinedResult.phishing_indicators || [],
          threat_types: combinedResult.threat_types || []
        });
      }

      const immutableHash = await generateSHA256(payload);
      
      setQrAssetDraft({
        id: newCodeId,
        title: qrType,
        payload: payload,
        safeQrImageUrl: qrDataUrl,
        artQrImageUrl: null,
        immutableHash,
        riskScore: combinedResult?.final_score ?? 0,
        riskFlags: combinedResult?.phishing_indicators || [],
        errorCorrectionLevel,
        customization: { ...customization },
        artStyle: null,
        stegoConfig: { enabled: false }
      });

      // AUTO-SAVE to preview storage (Phase 4 requirement)
      if (currentUser?.email) {
        await savePreview({
          code_id: newCodeId,
          payload: payload,
          payload_type: qrType,
          image_data_url: qrDataUrl,
          customization: { ...customization },
          size,
          error_correction: errorCorrectionLevel,
          risk_score: combinedResult?.final_score ?? 0,
          risk_flags: combinedResult?.phishing_indicators || [],
          immutable_hash: immutableHash
        });
      }

      toast.success("QR Code generated successfully!");
    } catch (error) {
      console.error("QR generation error:", error);
      toast.error("QR generation failed");
    } finally {
      setIsScanning(false);
      setScanningStage("");
    }
  };

  // Sync customization to qrAssetDraft in real-time
  useEffect(() => {
    if (qrGenerated && qrAssetDraft) {
      setQrAssetDraft(prev => ({
        ...prev,
        customization: { ...customization },
        safeQrImageUrl: qrDataUrl
      }));
    }
  }, [customization, qrGenerated, size, errorCorrectionLevel, qrDataUrl]);

  // Navigate to preview
  const goToPreview = () => {
    if (qrGenerated || buildQRPayload()) {
      setActiveTab('preview');
    } else {
      toast.info('Generate a QR code first');
      setActiveTab('create');
    }
  };

  // Stego embedded handler
  const handleStegoEmbedded = (disguisedImageUrl, mode) => {
    setQrAssetDraft(prev => ({
      ...prev,
      disguisedImageUrl,
      stegoConfig: { enabled: true, mode, disguisedImageUrl }
    }));
    toast.success("Steganographic image created!");
  };

  // Load preview from sidebar
  const handleSelectPreview = useCallback((preview) => {
    if (!preview) return;
    
    // Restore QR state from preview
    setQrData(prev => ({ ...prev, url: preview.payload || '' }));
    setQrType(preview.payload_type || 'url');
    setSize(preview.size || 512);
    setErrorCorrectionLevel(preview.error_correction || 'H');
    
    if (preview.customization) {
      setCustomization(preview.customization);
    }
    
    setQrAssetDraft({
      id: preview.code_id,
      title: preview.payload_type || 'url',
      payload: preview.payload,
      safeQrImageUrl: preview.image_data_url,
      artQrImageUrl: null,
      immutableHash: preview.immutable_hash,
      riskScore: preview.risk_score || 0,
      riskFlags: preview.risk_flags || [],
      errorCorrectionLevel: preview.error_correction || 'H',
      customization: preview.customization || customization,
      artStyle: null,
      stegoConfig: { enabled: false }
    });
    
    setQrGenerated(true);
    setCodeId(preview.code_id);
    setQrDataUrl(preview.image_data_url);
    
    toast.success('Preview loaded');
  }, [customization]);

  // Handle vault save from sidebar
  const handleSaveToVault = async (previewId) => {
    const success = await saveToVault(previewId);
    if (success) {
      await refreshVault();
    }
    return success;
  };

  // Handle delete from vault
  const handleDeleteVaultItem = async (itemId) => {
    try {
      await base44.entities.QrPreview.delete(itemId);
      await refreshVault();
      toast.success('Removed from vault');
      return true;
    } catch (err) {
      toast.error('Failed to delete');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black">
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-blue-500/5 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="border-b border-cyan-500/20 glyph-glass-dark sticky top-0 z-50 shadow-2xl glyph-glow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
                <Zap className="w-10 h-10 text-cyan-400 glyph-pulse" />
                GlyphLock QR Intelligence Platform
              </h1>
              <p className="text-sm sm:text-base text-gray-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              QR code creation with security scanning, steganography, and real-time threat detection.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2 glyph-glass border border-cyan-500/50 rounded-lg glyph-glow">
                <p className="text-xs text-cyan-300 font-semibold">90+ Payload Types</p>
              </div>
              <div className="px-4 py-2 glyph-glass border border-purple-500/50 rounded-lg">
                <p className="text-xs text-purple-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Full Access
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tabs */}
          <TabsList className="hidden lg:flex w-full mb-6 bg-black/40 backdrop-blur-md border-t-2 border-b-2 border-cyan-500/20 p-0 h-auto rounded-none">
            {[
              { value: 'create', icon: Wand2, label: '01_Create' },
              { value: 'customize', icon: Layers, label: '02_Customize' },
              { value: 'preview', icon: Eye, label: '03_Preview' },
              { value: 'stego', icon: Lock, label: '04_Stego' },
              { value: 'security', icon: Shield, label: '05_Security' },
              { value: 'analytics', icon: BarChart3, label: '06_Analytics' },
              { value: 'bulk', icon: Upload, label: '07_Bulk' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 min-h-[52px] relative group border-r border-cyan-500/10 last:border-r-0 data-[state=active]:bg-gradient-to-b data-[state=active]:from-cyan-500/20 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-cyan-400 data-[state=active]:text-cyan-300 text-gray-500 hover:text-gray-300 transition-all font-mono text-xs uppercase tracking-widest rounded-none"
              >
                <tab.icon className="w-4 h-4 mr-2" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile Tabs - Optimized Scroll */}
          <div className="lg:hidden mb-6 -mx-4 px-4 relative">
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide bg-black/60 backdrop-blur-sm border border-cyan-500/20 p-2 rounded-lg">
              {[
                { value: 'create', icon: Wand2, label: 'Create', num: '01' },
                { value: 'customize', icon: Layers, label: 'Customize', num: '02' },
                { value: 'preview', icon: Eye, label: 'Preview', num: '03' },
                { value: 'stego', icon: Lock, label: 'Stego', num: '04' },
                { value: 'security', icon: Shield, label: 'Security', num: '05' },
                { value: 'analytics', icon: BarChart3, label: 'Analytics', num: '06' },
                { value: 'bulk', icon: Upload, label: 'Bulk', num: '07' },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex flex-col items-center justify-center px-4 py-2 whitespace-nowrap text-xs font-mono uppercase tracking-wider transition-all min-h-[52px] min-w-[80px] rounded-lg snap-center flex-shrink-0 ${
                      activeTab === tab.value
                        ? 'bg-gradient-to-b from-cyan-500/30 to-transparent text-cyan-300 border-2 border-cyan-400 shadow-lg'
                        : 'text-gray-500 hover:text-gray-300 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] opacity-60">{tab.num}</span>
                    </div>
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Scroll hint */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black via-black/80 to-transparent pointer-events-none" />
          </div>

          {/* ========== 01_CREATE TAB ========== */}
          <TabsContent value="create">
            <div className="flex flex-col xl:flex-row gap-6 relative z-10">
              {/* Main Content */}
              <div className="flex-1 space-y-6">
              {/* Security Alert */}
              {currentTypeConfig?.needsSecurity && (
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-white">
                    <strong>Security Active:</strong> URLs/emails are scanned by AI. Scores under 65/100 are blocked.
                  </AlertDescription>
                </Alert>
              )}

              {/* Payload Type Selector */}
              <Card className={GlyphCard.premium}>
                <CardHeader className="border-b border-purple-500/20 pb-4">
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      Payload Type ({PAYLOAD_TYPES.length}+ Available)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPayloadSelector(!showPayloadSelector)}
                      className="text-cyan-400"
                    >
                      {showPayloadSelector ? 'Collapse' : 'Expand'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                {showPayloadSelector ? (
                  <CardContent className="pt-4">
                    <PayloadTypeSelector
                      value={payloadType}
                      onChange={(newType) => {
                        setPayloadType(newType);
                        const typeMapping = {
                          'url': 'url', 'url_dynamic': 'url', 'url_timelock': 'url', 'url_geolock': 'url',
                          'vcard': 'vcard', 'mecard': 'vcard', 'digital_card': 'vcard',
                          'tap_call': 'phone', 'tap_text': 'sms', 'email_template': 'email',
                          'wifi_config': 'wifi', 'data_json': 'text', 'data_base64': 'text'
                        };
                        if (typeMapping[newType]) setQrType(typeMapping[newType]);
                      }}
                    />
                  </CardContent>
                ) : (
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      {selectedPayloadType && (
                        <>
                          <div className="p-2 bg-cyan-500/20 rounded-lg">
                            <selectedPayloadType.icon className="w-6 h-6 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{selectedPayloadType.label}</h4>
                            <p className="text-xs text-gray-400">{selectedPayloadType.description}</p>
                          </div>
                          {selectedPayloadType.premium && (
                            <span className="ml-auto px-2 py-1 text-xs bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/50">Advanced</span>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Form + GL Preview - Side by Side Layout */}
              <div className="w-full flex flex-col lg:flex-row gap-6">
                {/* Left: Payload Form Card */}
                <div className="w-full lg:w-[540px]">
                  <Card className={`${GlyphCard.premium} ${GlyphShadows.depth.lg}`}>
                    <CardHeader className="border-b border-purple-500/20">
                      <CardTitle className="text-white flex items-center justify-between">
                        <span>{currentTypeConfig?.name || 'QR Configuration'}</span>
                        <span className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/30">
                          {qrType.toUpperCase()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {/* Mobile QR Type Selector */}
                      <div className="lg:hidden">
                        <Label className="text-white mb-2 block">QR Type</Label>
                        <Select value={qrType} onValueChange={setQrType}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white min-h-[48px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            {qrTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <QRTypeForm qrType={qrType} qrData={qrData} setQrData={setQrData} />

                      {/* Size */}
                      <div className="touch-target-safe">
                        <Label className="text-white">Size: {size}px</Label>
                        <Slider
                          value={[size]}
                          onValueChange={(value) => setSize(value[0])}
                          min={256}
                          max={1024}
                          step={64}
                          className="mt-2 min-h-[44px] flex items-center"
                        />
                      </div>

                      {/* Error Correction */}
                      <div>
                        <Label className="text-white">Error Correction</Label>
                        <Select value={errorCorrectionLevel} onValueChange={setErrorCorrectionLevel}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-2 min-h-[48px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="L">Low (7%)</SelectItem>
                            <SelectItem value="M">Medium (15%)</SelectItem>
                            <SelectItem value="Q">Quartile (25%)</SelectItem>
                            <SelectItem value="H">High (30%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={generateQR}
                        disabled={isScanning}
                        className={`${GlyphButton.primary} w-full ${GlyphShadows.neonCyan} min-h-[48px] flex items-center justify-center gap-2`}
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {scanningStage || 'Processing...'}
                          </>
                        ) : (
                          <>
                            <GlyphIcon type="launch" size={24} />
                            Generate Secure QR
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: GL Preview Block */}
                <div className="hidden lg:flex w-[520px] h-[330px] bg-white rounded-2xl shadow-2xl p-6 items-center justify-center relative overflow-hidden border border-gray-200">
                  
                  {/* GL WATERMARK / FRAME IMAGE */}
                  <img
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/382879216_qrgl.png"
                    alt="GlyphLock Frame"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                  />

                  {/* QR CODE - Large and centered in lock area */}
                  <div 
                    className="absolute z-10 pointer-events-none"
                    style={{ 
                      top: '50%', 
                      left: '68%', 
                      transform: 'translate(-50%, -50%)',
                      width: '120px',
                      height: '120px'
                    }}
                  >
                    <CanvasQrRenderer
                      text={getCurrentPayload()}
                      size={380}
                      errorCorrectionLevel={errorCorrectionLevel}
                      customization={customization}
                      onDataUrlReady={(url) => {
                        if (qrGenerated) {
                          handleQrDataUrlReady(url);
                        }
                      }}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Quick Nav Dropdown */}
                  <div className="absolute top-3 left-3 z-20 group">
                    <button className="p-1.5 bg-slate-800/80 backdrop-blur-sm rounded-full border border-purple-500/50 hover:border-cyan-400 transition-all">
                      <svg className="w-3 h-3 text-cyan-400 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute top-full left-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bg-slate-900/95 backdrop-blur-sm rounded-lg border border-purple-500/30 p-2 min-w-[100px] shadow-xl">
                      <button 
                        onClick={() => setActiveTab('customize')}
                        className="w-full text-left text-xs text-purple-300 hover:bg-purple-500/20 px-2 py-1 rounded flex items-center gap-2"
                      >
                        <Layers className="w-3 h-3" />
                        Customize
                      </button>
                      <button 
                        onClick={() => setActiveTab('preview')}
                        className="w-full text-left text-xs text-cyan-300 hover:bg-cyan-500/20 px-2 py-1 rounded flex items-center gap-2"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {/* Risk Indicator - Top Right */}
                  {qrGenerated && (
                    <div className="absolute top-3 right-3 z-20">
                      <div className={`flex items-center gap-1 px-2 py-0.5 backdrop-blur-sm rounded-md border text-[10px] ${
                        !securityResult || securityResult.final_score <= 20 
                          ? 'bg-green-600/30 border-green-500/50 text-green-300' 
                          : securityResult.final_score <= 50 
                            ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-300' 
                            : 'bg-red-600/30 border-red-500/50 text-red-300'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                          !securityResult || securityResult.final_score <= 20 ? 'bg-green-400' 
                            : securityResult.final_score <= 50 ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        {!securityResult || securityResult.final_score <= 20 ? 'Safe' : securityResult.final_score <= 50 ? 'Caution' : 'Risk'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>

              {/* Preview Sidebar - Right Side */}
              {currentUser && (
                <div className="w-full xl:w-72 space-y-4">
                  <QrPreviewSidebar
                    previews={previews}
                    loading={previewsLoading}
                    onSelectPreview={handleSelectPreview}
                    onSaveToVault={handleSaveToVault}
                    onDeletePreview={deletePreview}
                    selectedId={qrAssetDraft?.id}
                    previewCount={previewCount}
                    maxPreviews={maxPreviews}
                  />
                  <QrVaultPanel
                    vaultedItems={vaultedItems}
                    loading={vaultLoading}
                    onSelectItem={handleSelectPreview}
                    onDeleteItem={handleDeleteVaultItem}
                    selectedId={qrAssetDraft?.id}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          {/* ========== 02_CUSTOMIZE TAB ========== */}
          <TabsContent value="customize">
            <div className="grid lg:grid-cols-2 gap-8 relative z-10">
              <div>
                <QrCustomizationPanel
                  customization={customization}
                  setCustomization={setCustomization}
                  errorCorrectionLevel={errorCorrectionLevel}
                  setErrorCorrectionLevel={setErrorCorrectionLevel}
                  onApply={goToPreview}
                  logoFile={logoFile}
                  onLogoUpload={handleLogoUpload}
                />
              </div>

              {/* Live Preview - Updates in Real-Time */}
              <div>
                <Card className={`${GlyphCard.premium} ${GlyphShadows.depth.lg} sticky top-24`}>
                  <CardHeader className="border-b border-purple-500/20">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-cyan-400" />
                      Live Preview
                      <span className="ml-auto text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        Real-time
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {(qrGenerated || getCurrentPayload()) ? (
                      <div className="space-y-4">
                        <div 
                          className="p-8 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300"
                          style={{
                            background: customization.background?.type === 'gradient'
                              ? `linear-gradient(135deg, ${customization.background?.gradientColor1 || '#ffffff'}, ${customization.background?.gradientColor2 || '#e5e7eb'})`
                              : customization.background?.type === 'image' && customization.background?.imageUrl
                                ? `url(${customization.background.imageUrl}) center/cover`
                                : customization.background?.color || '#ffffff',
                            opacity: (customization.background?.transparency || 100) / 100,
                            borderRadius: `${customization.qrShape?.cornerRadius || 0}%`
                          }}
                        >
                          {/* Pattern Overlay */}
                          {customization.background?.pattern && customization.background.pattern !== 'none' && (
                            <div 
                              className="absolute inset-0 pointer-events-none opacity-20"
                              style={{
                                backgroundImage: customization.background.pattern === 'grid' 
                                  ? 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)'
                                  : customization.background.pattern === 'dots'
                                    ? 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)'
                                    : 'none',
                                backgroundSize: customization.background.pattern === 'grid' ? '20px 20px' : '10px 10px'
                              }}
                            />
                          )}

                          {/* CanvasQRRenderer - Real-time updates with full styling */}
                          <CanvasQrRenderer
                            text={getCurrentPayload()}
                            size={280}
                            errorCorrectionLevel={errorCorrectionLevel}
                            customization={customization}
                            onDataUrlReady={handleQrDataUrlReady}
                            className="relative z-10"
                          />
                        </div>

                        {/* Live Stats */}
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-700">
                            <span className="text-gray-500">Dot:</span> <span className="text-cyan-400">{customization.dotStyle}</span>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-700">
                            <span className="text-gray-500">Eye:</span> <span className="text-purple-400">{customization.eyeStyle}</span>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-700">
                            <span className="text-gray-500">ECC:</span> <span className="text-green-400">{errorCorrectionLevel}</span>
                          </div>
                          <div className="p-2 bg-gray-800/50 rounded border border-gray-700">
                            <span className="text-gray-500">Size:</span> <span className="text-blue-400">{size}px</span>
                          </div>
                        </div>

                        {/* Color Preview */}
                        <div className="flex items-center justify-center gap-3 p-2 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: customization.foregroundColor }} />
                            <span className="text-[10px] text-gray-400">FG</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded border border-gray-600" style={{ backgroundColor: customization.background?.color || '#ffffff' }} />
                            <span className="text-[10px] text-gray-400">BG</span>
                          </div>
                          {customization.gradient?.enabled && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-8 h-4 rounded border border-gray-600"
                                style={{ 
                                  background: `linear-gradient(90deg, ${customization.gradient.color1}, ${customization.gradient.color2}, ${customization.gradient.color3})`
                                }} 
                              />
                              <span className="text-[10px] text-gray-400">Grad</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                        <div className="text-center">
                          <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                          <p className="text-gray-500">Generate a QR code in Create tab first</p>
                          <Button
                            onClick={() => setActiveTab('create')}
                            variant="outline"
                            size="sm"
                            className="mt-4 border-cyan-500/50 text-cyan-400"
                          >
                            Go to Create
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ========== 03_PREVIEW TAB ========== */}
          <TabsContent value="preview">
            <QrPreviewPanel
              qrAssetDraft={qrAssetDraft}
              customization={customization}
              qrDataUrl={qrDataUrl}
              qrPayload={getCurrentPayload()}
              securityResult={securityResult}
              size={size}
              errorCorrectionLevel={errorCorrectionLevel}
              qrType={qrType}
              codeId={codeId}
              onRegenerate={generateQR}
              onDataUrlReady={handleQrDataUrlReady}
            />
          </TabsContent>

          {/* ========== 04_STEGO TAB ========== */}
          <TabsContent value="stego">
            <div className="space-y-8 relative z-10">
              <Card className={GlyphCard.premium}>
                <CardHeader className="border-b border-purple-500/20">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-purple-400" />
                    Steganography Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-400 mb-6">
                    Hide QR data within images or extract hidden data. Uses LSB (Least Significant Bit) encoding.
                  </p>
                  <SteganographicQR 
                    qrPayload={getCurrentPayload()} 
                    qrGenerated={qrGenerated && (!securityResult || securityResult.final_score >= 65)}
                    onEmbedded={handleStegoEmbedded}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========== 05_SECURITY TAB ========== */}
          <TabsContent value="security">
            <div className="space-y-6 relative z-10">
              <Card className={`${GlyphCard.premium} ${GlyphShadows.depth.lg}`}>
                <CardHeader className="border-b border-purple-500/20">
                  <CardTitle className={`${GlyphTypography.heading.lg} text-white flex items-center gap-2`}>
                    <Shield className="w-5 h-5 text-cyan-400" />
                    Security & Integrity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {qrAssetDraft ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Immutable Hash (SHA-256)</Label>
                        <Input
                          value={qrAssetDraft.immutableHash || ''}
                          readOnly
                          className="font-mono text-xs min-h-[44px] bg-gray-800 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Risk Assessment</Label>
                        <QrSecurityBadge
                          riskScore={qrAssetDraft.riskScore || 0}
                          riskFlags={qrAssetDraft.riskFlags || []}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-lg">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400 text-lg">Generate a QR code to view security details</p>
                      <Button
                        onClick={() => setActiveTab('create')}
                        variant="outline"
                        size="sm"
                        className="mt-4 border-cyan-500/50 text-cyan-400"
                      >
                        Go to Create
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {securityResult && <SecurityStatus securityResult={securityResult} />}
              
              {qrAssetDraft && (
                <QrDiagnosticsPanel
                  qrData={{
                    payload: qrAssetDraft.payload,
                    error_correction: qrAssetDraft.errorCorrectionLevel,
                    foreground_color: qrAssetDraft.customization?.foregroundColor,
                    background_color: qrAssetDraft.customization?.background?.color,
                    dynamic_config: { rules: [] }
                  }}
                  onRunDiagnostics={async (results) => {
                    // Log scan event
                    await base44.entities.QRScanEvent.create({
                      qr_asset_id: qrAssetDraft.id,
                      decoded_content: results.decoded_content,
                      device_context: {
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        screenWidth: window.screen.width,
                        screenHeight: window.screen.height
                      },
                      scan_velocity: 0,
                      resolved_slots: results.resolved_slots,
                      rejection_reasons: results.rejection_reasons,
                      error_correction_level: results.error_correction_level,
                      contrast_score: results.contrast_score,
                      quiet_zone_valid: results.quiet_zone_valid
                    });
                    toast.success('Scan event logged');
                  }}
                />
              )}
            </div>
          </TabsContent>

          {/* ========== 06_ANALYTICS TAB ========== */}
          <TabsContent value="analytics">
            {qrAssetDraft ? (
              <AnalyticsPanel qrAssetId={qrAssetDraft.id} codeId={codeId} />
            ) : (
              <Card className={`${GlyphCard.glass} p-12 text-center relative z-10`}>
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg mb-2">Generate a QR code first to view analytics</p>
                <Button
                  onClick={() => setActiveTab('create')}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-cyan-500/50 text-cyan-400"
                >
                  Go to Create
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* ========== 07_BULK TAB ========== */}
          <TabsContent value="bulk">
            <QrBatchUploader />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}