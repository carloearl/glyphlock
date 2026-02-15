/**
 * MFA Setup Modal
 * Guides users through enabling authenticator app MFA
 * Supports QR code scanning + manual key entry + otpauth:// deep link
 */

import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Download, Shield, CheckCircle, AlertTriangle, Smartphone, KeyRound, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function MFASetupModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('qr'); // 'qr' | 'verify' | 'codes'
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [tempSecret, setTempSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showManualKey, setShowManualKey] = useState(false);

  React.useEffect(() => {
    if (isOpen && step === 'qr') {
      initializeSetup();
    }
  }, [isOpen]);

  const initializeSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await base44.functions.invoke('mfaSetup', {});
      
      setQrCodeDataUrl(response.data.qrCodeDataUrl);
      setOtpauthUrl(response.data.otpauthUrl || '');
      setManualKey(response.data.manualKey);
      setTempSecret(response.data.tempSecret);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to initialize MFA setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await base44.functions.invoke('mfaVerifySetup', {
        code: verificationCode,
        tempSecret
      });

      setRecoveryCodes(response.data.recoveryCodes);
      setStep('codes');
    } catch (err) {
      setError(err?.response?.data?.error || 'Invalid verification code. Make sure you entered the 6-digit code from your authenticator app.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Recovery codes copied to clipboard');
  };

  const downloadRecoveryCodes = () => {
    const text = `GlyphLock MFA Recovery Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${recoveryCodes.join('\n')}\n\nStore these codes securely. Each can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glyphlock-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Recovery codes downloaded');
  };

  const handleComplete = () => {
    onSuccess();
    onClose();
    setStep('qr');
    setVerificationCode('');
    setRecoveryCodes([]);
    setShowManualKey(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-5 h-5 text-cyan-400" />
            Enable Authenticator App
          </DialogTitle>
          <DialogDescription>
            {step === 'qr' && 'Scan the QR code with your authenticator app'}
            {step === 'verify' && 'Enter the 6-digit code from your app'}
            {step === 'codes' && 'Save your recovery codes'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: QR Code */}
        {step === 'qr' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
              </div>
            ) : (
              <>
                {/* QR Code Display */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white rounded-xl shadow-lg">
                    {qrCodeDataUrl && (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Scan this QR code with your authenticator app" 
                        className="w-64 h-64"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <QrCode className="w-4 h-4" />
                    <span>Scan with Google Authenticator, Authy, or any TOTP app</span>
                  </div>
                </div>

                {/* Open in App (mobile deep link) */}
                {otpauthUrl && (
                  <a
                    href={otpauthUrl}
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:bg-blue-600/30 transition-all text-sm font-medium"
                  >
                    <Smartphone className="w-4 h-4" />
                    Open in Authenticator App
                  </a>
                )}

                {/* Manual Key Toggle */}
                <button
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mx-auto"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {showManualKey ? 'Hide manual key' : "Can't scan? Enter key manually"}
                </button>

                {showManualKey && (
                  <div className="space-y-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                    <p className="text-xs text-slate-400">Manual entry key (Base32):</p>
                    <div className="flex gap-2">
                      <Input
                        value={manualKey}
                        readOnly
                        className="font-mono text-xs tracking-wider"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(manualKey);
                          toast.success('Key copied');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Open your authenticator app → Add account → Enter key manually → Paste this key
                    </p>
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-semibold text-cyan-300">Setup Instructions</h4>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Open Google Authenticator, Authy, or any TOTP app</li>
                    <li>Tap the <strong>+</strong> button to add a new account</li>
                    <li>Select <strong>"Scan QR code"</strong> and point camera at the code above</li>
                    <li>Your app will show a 6-digit code that refreshes every 30 seconds</li>
                    <li>Click <strong>Continue</strong> below and enter that code</li>
                  </ol>
                </div>

                <Button
                  onClick={() => {
                    setError('');
                    setStep('verify');
                  }}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600"
                  disabled={!qrCodeDataUrl}
                >
                  Continue to Verification
                </Button>
              </>
            )}
          </div>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl bg-slate-800/50 border border-slate-700">
              <Smartphone className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300">
                Open your authenticator app and enter the 6-digit code shown for <strong className="text-white">GlyphLock</strong>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  setError('');
                  setVerificationCode(e.target.value.replace(/\D/g, ''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && verificationCode.length === 6) {
                    handleVerify();
                  }
                }}
                className="text-center text-3xl tracking-[0.5em] font-mono"
                autoFocus
              />
              <p className="text-xs text-slate-500 text-center">
                Code refreshes every 30 seconds
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setError('');
                  setStep('qr');
                }}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Recovery Codes */}
        {step === 'codes' && (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Two-factor authentication is now enabled!
              </AlertDescription>
            </Alert>

            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                Save these recovery codes in a secure location. Each code can only be used once. If you lose access to your authenticator app, these codes are your only way back in.
              </AlertDescription>
            </Alert>

            <div className="bg-slate-800 rounded-xl p-4 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {recoveryCodes.map((code, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg">
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                    <span className="text-white">{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyRecoveryCodes}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
              <Button
                variant="outline"
                onClick={downloadRecoveryCodes}
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <Button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I've Saved My Recovery Codes
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}