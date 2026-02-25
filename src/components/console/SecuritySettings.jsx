/**
 * DACO FIX: HIGH-003 - Removed non-functional security toggles
 * Converted to read-only security status display
 * Functional settings (MFA, API keys) accessible via dedicated tabs
 */

import React from "react";
import { Shield, Lock, Key, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SecuritySettings({ user }) {
  // Platform-enforced security features (read-only status)
  const platformFeatures = [
    { 
      label: "HTTPS Enforcement", 
      status: true, 
      icon: Lock,
      description: "All connections use TLS 1.3 encryption" 
    },
    { 
      label: "Rate Limiting", 
      status: true, 
      icon: Shield,
      description: "API endpoints protected with rate limits" 
    },
    { 
      label: "Audit Logging", 
      status: true, 
      icon: Key,
      description: "All security events logged to AuditEvent entity" 
    },
    { 
      label: "Data Encryption", 
      status: true, 
      icon: Lock,
      description: "AES-256 encryption at rest for sensitive fields" 
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Overview</h1>
        <p className="text-white/70">Platform-enforced security features and account settings</p>
      </div>

      {/* Important Notice */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          Core security features below are enforced by the platform and cannot be disabled. 
          For account-specific settings (MFA, API keys), use the dedicated tabs in the sidebar.
        </AlertDescription>
      </Alert>

      {/* Platform Security Features (Read-Only) */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-[#8C4BFF]" />
            Platform Security Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {platformFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-800/30 border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{feature.label}</p>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Account-Specific Settings Links */}
      <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-5 h-5 text-[#8C4BFF]" />
            Account Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link to={createPageUrl('AccountSecurity')}>
            <Button variant="outline" className="w-full justify-between border-cyan-500/30 hover:bg-cyan-500/10 h-auto py-4">
              <div className="text-left">
                <p className="text-white font-medium">Multi-Factor Authentication</p>
                <p className="text-sm text-slate-400">Enable, manage, or regenerate recovery codes</p>
              </div>
              <CheckCircle className="w-5 h-5 text-cyan-400" />
            </Button>
          </Link>

          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <div className="text-left">
              <p className="text-white font-medium mb-1">API Key Management</p>
              <p className="text-sm text-slate-400">Create, rotate, and delete API keys from the API Keys tab</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
            <div className="text-left">
              <p className="text-white font-medium mb-1">Trusted Devices</p>
              <p className="text-sm text-slate-400">Manage trusted devices from Account Security page</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendation */}
      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400 mt-1" />
            <div>
              <h3 className="text-white font-medium mb-1">Security Recommendation</h3>
              <p className="text-white/70 text-sm mb-3">
                Enable Multi-Factor Authentication to maximize your account security.
              </p>
              <Link to={createPageUrl('AccountSecurity')}>
                <Button size="sm" className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
                  Configure MFA
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}