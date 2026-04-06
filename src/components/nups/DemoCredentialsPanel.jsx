import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DemoCredentialsPanel() {
  const [showPasswords, setShowPasswords] = useState(false);

  const demoAccounts = [
    { username: "carloearl@glyphlock", pin: "4891", role: "VENUE_MANAGER", tier: "Manager" },
    { username: "lucki@dream", pin: "9876", role: "PERFORMER", tier: "Entertainer (LUCKi)" },
    { username: "bartender@dream", pin: "1234", role: "BARTENDER", tier: "POS Staff" },
    { username: "doorstaff@dream", pin: "5678", role: "SECURITY", tier: "Door" },
    { username: "hostess@dream", pin: "2468", role: "HOSTESS", tier: "VIP" },
    { username: "dj@dream", pin: "3579", role: "DJ", tier: "Audio" },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-red-900/20 border-red-500/50">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            ⚠️ Demo Credentials (Admin Only)
          </CardTitle>
          <p className="text-xs text-red-300 mt-2">For development & testing. Do NOT share outside team.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm text-gray-300">Reveal PIN Codes</label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
              className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>

          <div className="grid gap-3">
            {demoAccounts.map((acc) => (
              <Card key={acc.username} className="bg-gray-900/50 border-gray-700/50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-cyan-400">{acc.username}</p>
                      <p className="text-xs text-gray-400">{acc.tier}</p>
                    </div>
                    <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                      {acc.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-3 p-2 bg-gray-800/50 rounded">
                    <code className="text-sm font-bold text-yellow-400">
                      PIN: {showPasswords ? acc.pin : "••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(acc.pin)}
                      className="h-6 w-6 p-0 hover:bg-purple-500/20"
                    >
                      <Copy className="w-3 h-3 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-900/20 border-blue-500/50">
        <CardHeader>
          <CardTitle className="text-blue-400">Test Data Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <div>
            <p className="font-mono text-cyan-400">Demo Transaction IDs:</p>
            <code className="text-xs text-gray-400">DEMO-* prefix or demo@ email</code>
          </div>
          <div>
            <p className="font-mono text-cyan-400">Test Mode Flag:</p>
            <code className="text-xs text-gray-400">t.mode === 'REAL' filters out demos</code>
          </div>
          <div>
            <p className="font-mono text-cyan-400">Session Token:</p>
            <code className="text-xs text-gray-400">nups_session in sessionStorage</code>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-900/20 border-green-500/50">
        <CardHeader>
          <CardTitle className="text-green-400">Quick Access</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10 text-sm"
            onClick={() => {
              const demoSession = {
                email: "carloearl@glyphlock",
                _highestRole: "PLATFORM_ADMIN",
              };
              sessionStorage.setItem("nups_session", JSON.stringify(demoSession));
              window.location.reload();
            }}
          >
            Load Manager Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}