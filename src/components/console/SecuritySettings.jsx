import React, { useState } from "react";
import { Shield, Lock, Key, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function SecuritySettings({ user }) {
  const [settings, setSettings] = useState({
    autoKeyRotation: true,
    rotationSchedule: "30d",
    mfaEnabled: false,
    ipAllowlist: false,
    geoLock: false,
    rateLimiting: true,
    auditLogging: true
  });

  const handleSave = async () => {
    toast.success("Security settings saved successfully");
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Settings</h1>
        <p className="text-white/70">Configure security policies and access controls</p>
      </div>

      {/* Security Score */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-medium mb-1">Security Score</h3>
              <p className="text-white/70 text-sm">Your account security rating</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-3xl font-bold text-green-400">92</p>
                <p className="text-xs text-white/50">Excellent</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Rotation */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-[#8C4BFF]" />
            API Key Rotation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Automatic Key Rotation</Label>
              <p className="text-sm text-white/70">Rotate keys on a schedule</p>
            </div>
            <Switch
              checked={settings.autoKeyRotation}
              onCheckedChange={() => handleToggle('autoKeyRotation')}
            />
          </div>

          {settings.autoKeyRotation && (
            <div>
              <Label className="text-white">Rotation Schedule</Label>
              <Select
                value={settings.rotationSchedule}
                onValueChange={(value) => setSettings({ ...settings, rotationSchedule: value })}
              >
                <SelectTrigger className="bg-[#020617] border-[#8C4BFF]/20 text-white mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Every 24 Hours</SelectItem>
                  <SelectItem value="7d">Every 7 Days</SelectItem>
                  <SelectItem value="30d">Every 30 Days</SelectItem>
                  <SelectItem value="90d">Every 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access Controls */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Lock className="w-5 h-5 text-[#8C4BFF]" />
            Access Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <Label className="text-white">Multi-Factor Authentication</Label>
              <p className="text-sm text-white/70">Require 2FA for all logins</p>
            </div>
            <Switch
              checked={settings.mfaEnabled}
              onCheckedChange={() => handleToggle('mfaEnabled')}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <Label className="text-white">IP Allowlist</Label>
              <p className="text-sm text-white/70">Restrict access by IP address</p>
            </div>
            <Switch
              checked={settings.ipAllowlist}
              onCheckedChange={() => handleToggle('ipAllowlist')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-white">Geo-Lock</Label>
              <p className="text-sm text-white/70">Restrict access by location</p>
            </div>
            <Switch
              checked={settings.geoLock}
              onCheckedChange={() => handleToggle('geoLock')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Monitoring */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-[#8C4BFF]" />
            Monitoring & Logging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <Label className="text-white">Rate Limiting</Label>
              <p className="text-sm text-white/70">Prevent abuse with rate limits</p>
            </div>
            <Switch
              checked={settings.rateLimiting}
              onCheckedChange={() => handleToggle('rateLimiting')}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <Label className="text-white">Audit Logging</Label>
              <p className="text-sm text-white/70">Log all security events</p>
            </div>
            <Switch
              checked={settings.auditLogging}
              onCheckedChange={() => handleToggle('auditLogging')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <h3 className="text-white font-medium mb-1">Security Recommendation</h3>
              <p className="text-white/70 text-sm mb-3">
                Enable Multi-Factor Authentication to improve your account security score to 100.
              </p>
              <Button size="sm" className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                Enable 2FA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-[#8C4BFF] to-[#9F00FF] hover:opacity-90"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}