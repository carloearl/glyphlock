import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import MFASetupModal from '@/components/security/MFASetupModal';

export default function AccountSecurityTab() {
  const [user, setUser] = useState(null);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [trustedDevices, setTrustedDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState('');
  const [newRecoveryCodes, setNewRecoveryCodes] = useState([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    loadUserAndStatus();
  }, []);

  const loadUserAndStatus = async () => {
    setIsLoading(true);
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const statusResponse = await base44.functions.invoke('mfaSessionStatus', {});
      setMfaStatus(statusResponse.data);

      if (statusResponse.data.mfaEnabled) {
        const devicesResponse = await base44.functions.invoke('mfaGetTrustedDevices', {});
        setTrustedDevices(devicesResponse.data.trustedDevices || []);
      }
    } catch (error) {
      console.error('Load security settings error:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeDevice = async (deviceIdPrefix) => {
    try {
      await base44.functions.invoke('mfaRevokeTrustedDevice', { deviceIdPrefix });
      toast.success('Device trust revoked');
      loadUserAndStatus();
    } catch (error) {
      toast.error('Failed to revoke device trust');
    }
  };

  const handleSetupSuccess = () => {
    toast.success('Authenticator app enabled successfully!');
    loadUserAndStatus();
  };

  const handleDisable = async () => {
    if (!disablePassword || !disableCode) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsDisabling(true);
    try {
      await base44.functions.invoke('mfaDisable', {
        password: disablePassword,
        totpCode: disableCode
      });

      toast.success('MFA disabled successfully');
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      loadUserAndStatus();
    } catch (error) {
      toast.error(error.message || 'Failed to disable MFA');
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerate = async () => {
    if (!regenerateCode || regenerateCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await base44.functions.invoke('mfaRegenerateRecoveryCodes', {
        totpCode: regenerateCode
      });

      setNewRecoveryCodes(response.data.recoveryCodes);
      setRegenerateCode('');
      toast.success('Recovery codes regenerated!');
    } catch (error) {
      toast.error(error.message || 'Failed to regenerate codes');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyRecoveryCodes = () => {
    const text = newRecoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Recovery codes copied');
  };

  const downloadRecoveryCodes = () => {
    const text = `GlyphLock MFA Recovery Codes\n\nRegenerated: ${new Date().toLocaleString()}\n\n${newRecoveryCodes.join('\n')}\n\nStore these codes securely.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'glyphlock-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Recovery codes downloaded');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Account Security</h2>
        <p className="text-sm text-slate-400">Manage your authentication and security settings</p>
      </div>

      <Card className="bg-slate-900/50 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5 text-cyan-400" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security with authenticator apps
              </CardDescription>
            </div>
            <Badge
              variant={mfaStatus?.mfaEnabled ? 'default' : 'outline'}
              className={mfaStatus?.mfaEnabled ? 'bg-green-500/20 text-green-300 border-green-500/50' : ''}
            >
              {mfaStatus?.mfaEnabled ? (
                <><CheckCircle className="w-3 h-3 mr-1" /> Enabled</>
              ) : (
                'Disabled'
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaStatus?.mfaEnabled ? (
            <>
              <Alert className="bg-blue-500/10 border-blue-500/30">
                <Shield className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  Protect your account with time-based one-time passwords (TOTP) using Google Authenticator, Authy, or any compatible app.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => setShowSetupModal(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enable Authenticator App
              </Button>
            </>
          ) : (
            <>
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  Your account is protected with two-factor authentication.
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateModal(true)}
                  className="border-purple-500/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Recovery Codes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDisableModal(true)}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Disable MFA
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {mfaStatus?.mfaEnabled && trustedDevices.length > 0 && (
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-cyan-400" />
              Trusted Devices
            </CardTitle>
            <CardDescription>
              Devices that can skip MFA verification for 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trustedDevices.map((device, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <div className="flex-1">
                    <p className="text-white font-medium">{device.deviceName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Added {new Date(device.trustGrantedAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      Expires {new Date(device.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRevokeDevice(device.deviceId.split('...')[0])}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-slate-400 text-xs">Email</Label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Role</Label>
            <Badge className="bg-cyan-500/20 text-cyan-400">{user?.role || 'User'}</Badge>
          </div>
          <div>
            <Label className="text-slate-400 text-xs">Account Created</Label>
            <p className="text-white">{user?.created_date ? new Date(user.created_date).toLocaleDateString() : 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <MFASetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={handleSetupSuccess}
      />

      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will remove the extra security layer from your account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Warning: Disabling MFA makes your account less secure
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-white">Authenticator Code or Recovery Code</Label>
              <Input
                type="text"
                placeholder="000000 or recovery code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword('');
                  setDisableCode('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisable}
                disabled={isDisabling}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isDisabling ? 'Disabling...' : 'Disable MFA'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRegenerateModal} onOpenChange={(open) => {
        setShowRegenerateModal(open);
        if (!open) {
          setNewRecoveryCodes([]);
          setRegenerateCode('');
        }
      }}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <RefreshCw className="w-5 h-5 text-cyan-400" />
              Regenerate Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Generate a new set of recovery codes
            </DialogDescription>
          </DialogHeader>

          {newRecoveryCodes.length === 0 ? (
            <div className="space-y-4">
              <Alert className="bg-amber-500/10 border-amber-500/30">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  This will invalidate your old recovery codes
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Authenticator Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={regenerateCode}
                  onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegenerateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={isRegenerating || regenerateCode.length !== 6}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600"
                >
                  {isRegenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="bg-green-500/10 border-green-500/30">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  New recovery codes generated successfully!
                </AlertDescription>
              </Alert>

              <div className="bg-slate-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                  {newRecoveryCodes.map((code, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-900 rounded">
                      <CheckCircle className="w-3 h-3 text-green-400" />
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
                  Copy
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
                onClick={() => {
                  setShowRegenerateModal(false);
                  setNewRecoveryCodes([]);
                }}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}