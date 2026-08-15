import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Shield, Clock, FileImage, RefreshCw, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import QrSecurityBadge from './QrSecurityBadge';
import CanvasQrRenderer from './CanvasQrRenderer';

/**
 * QrPreviewPanel - Final Preview Tab Component
 * Uses CanvasQrRenderer for unified rendering pipeline
 */
export default function QrPreviewPanel({
  qrAssetDraft,
  customization,
  qrDataUrl,
  qrPayload,
  securityResult,
  size,
  errorCorrectionLevel,
  qrType,
  codeId,
  onRegenerate,
  onDataUrlReady
}) {
  const qrDataUrlRef = useRef(null);
  const [savingToVault, setSavingToVault] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const user = await base44.auth.me();
          setCurrentUser(user);
        }
      } catch (err) { /* Intentionally ignored: best-effort operation. */ }
    })();
  }, []);

  const handleSaveToVault = async () => {
    if (!currentUser?.email || !qrAssetDraft) {
      toast.error('Please log in to save to vault');
      return;
    }

    setSavingToVault(true);
    try {
      // Check if already in vault
      const existing = await base44.entities.QrPreview.filter({
        user_id: currentUser.email,
        code_id: qrAssetDraft.id,
        vaulted: true
      });

      if (existing.length > 0) {
        toast.info('Already in your vault');
        setSavingToVault(false);
        return;
      }

      // Create vault entry
      await base44.entities.QrPreview.create({
        user_id: currentUser.email,
        code_id: qrAssetDraft.id,
        payload: qrAssetDraft.payload || qrPayload,
        payload_type: qrType || 'url',
        image_data_url: qrDataUrlRef.current || qrDataUrl,
        customization: customization,
        size: size || 512,
        error_correction: errorCorrectionLevel || 'H',
        risk_score: qrAssetDraft.riskScore || 0,
        risk_flags: qrAssetDraft.riskFlags || [],
        immutable_hash: qrAssetDraft.immutableHash,
        vaulted: true,
        vault_date: new Date().toISOString()
      });

      toast.success('Saved to your Vault!');
    } catch (err) {
      console.error('Vault save error:', err);
      toast.error('Failed to save to vault');
    } finally {
      setSavingToVault(false);
    }
  };

  const handleDataUrlReady = useCallback((dataUrl) => {
    qrDataUrlRef.current = dataUrl;
    if (onDataUrlReady) {
      onDataUrlReady(dataUrl);
    }
  }, [onDataUrlReady]);

  if (!qrAssetDraft && !qrPayload) {
    return (
      <Card className="bg-gray-900/80 border-purple-500/30 p-12 text-center">
        <Eye className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h3 className="text-xl font-bold text-white mb-2">No QR Code Generated</h3>
        <p className="text-gray-400">
          Go to the Create tab to generate a QR code, then customize it in the Customize tab.
        </p>
      </Card>
    );
  }

  const riskScore = qrAssetDraft?.riskScore ?? securityResult?.final_score ?? 0;
  const riskFlags = qrAssetDraft?.riskFlags || securityResult?.phishing_indicators || [];
  const displayPayload = qrPayload || qrAssetDraft?.payload || 'https://glyphlock.io';

  const handleDownload = async () => {
    const dataUrl = qrDataUrlRef.current || qrDataUrl;
    if (!dataUrl) {
      toast.error('No QR code to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `glyphlock-qr-${qrType || 'code'}-${codeId || Date.now()}.png`;
      link.click();
      toast.success(`QR code downloaded as PNG`);
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      {/* Main Preview Card */}
      <Card className="bg-gray-900/80 border-purple-500/30 shadow-2xl">
        <CardHeader className="border-b border-purple-500/20">
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Final QR Preview
            </span>
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: QR Display using CanvasQrRenderer */}
            <div className="space-y-4">
              <div 
                className="p-8 rounded-xl flex items-center justify-center relative shadow-inner"
                style={{
                  background: customization?.background?.type === 'gradient'
                    ? `linear-gradient(135deg, ${customization.background?.gradientColor1 || '#ffffff'}, ${customization.background?.gradientColor2 || '#e5e7eb'})`
                    : customization?.background?.type === 'image' && customization?.background?.imageUrl
                      ? `url(${customization.background.imageUrl}) center/cover`
                      : customization?.background?.color || '#ffffff'
                }}
              >
                <CanvasQrRenderer
                  text={displayPayload}
                  size={size || 300}
                  errorCorrectionLevel={errorCorrectionLevel || 'H'}
                  customization={customization}
                  onDataUrlReady={handleDataUrlReady}
                  className="relative"
                />
              </div>
            </div>

            {/* Right: Metadata & Downloads */}
            <div className="space-y-6">
              {/* Security Score */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Security Score</h4>
                <QrSecurityBadge riskScore={riskScore} riskFlags={riskFlags} />
              </div>

              {/* Metadata Summary */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Metadata</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500">Payload Type</p>
                    <p className="text-sm font-medium text-white capitalize">{qrType || 'URL'}</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500">Size</p>
                    <p className="text-sm font-medium text-white">{size || 512}px</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500">Error Correction</p>
                    <p className="text-sm font-medium text-white">{errorCorrectionLevel || 'H'} ({
                      errorCorrectionLevel === 'L' ? '7%' :
                      errorCorrectionLevel === 'M' ? '15%' :
                      errorCorrectionLevel === 'Q' ? '25%' : '30%'
                    })</p>
                  </div>
                  <div className="p-3 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-500">Generated</p>
                    <p className="text-sm font-medium text-white flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customization Summary */}
              {customization && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Customization</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      Dot: {customization.dotStyle || 'square'}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      Eye: {customization.eyeStyle || 'square'}
                    </Badge>
                    {customization.gradient?.enabled && (
                      <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                        Gradient
                      </Badge>
                    )}
                    {customization.logo?.url && (
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        Logo
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Download & Vault Buttons */}
              <div>
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                  {currentUser && (
                    <Button
                      onClick={handleSaveToVault}
                      disabled={savingToVault}
                      variant="outline"
                      className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      {savingToVault ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Archive className="w-4 h-4 mr-2" />
                      )}
                      Save to My Vault
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hash & Integrity */}
      {qrAssetDraft?.immutableHash && (
        <Card className="bg-gray-900/60 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Immutable Hash (SHA-256)</p>
                <p className="text-xs font-mono text-gray-400 break-all">{qrAssetDraft.immutableHash}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}