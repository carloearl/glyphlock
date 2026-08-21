import React, { useState, useEffect } from "react";
import { Key, Plus, RefreshCw, Eye, EyeOff, Copy, Trash2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { GlyphIcon, IconButton } from "@/components/icons/GlyphIcons";

export default function APIKeyVault({ user }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [oneTimeSecret, setOneTimeSecret] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    environment: "live"
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const result = await base44.entities.APIKey.list();
      setKeys(result || []);
    } catch (err) {
      console.error('Load keys error:', err);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    try {
      const response = await base44.functions.invoke('generateAPIKey', {
        name: formData.name,
        environment: formData.environment
      });
      
      const newKey = response.data;
      
      if (newKey.secret_key) setOneTimeSecret({ kind: 'created', public_key: newKey.public_key, secret_key: newKey.secret_key });
      
      toast.success("API key created successfully");
      await loadKeys(); // Reload to show new key in list
      setShowCreateForm(false);
      setFormData({ name: "", environment: "live" });
    } catch (err) {
      console.error('API Key Creation Error:', err);
      toast.error(err.message || "Failed to create API key");
    }
  };

  const handleRotateKey = async (keyId) => {
    if (!confirm('Rotate this API key? The old secret will stop working immediately.')) return;
    try {
      const response = await base44.functions.invoke('rotateAPIKey', { keyId });
      const rotated = response.data;
      
      if (rotated.secret_key) setOneTimeSecret({ kind: 'rotated', public_key: rotated.public_key, secret_key: rotated.secret_key });
      
      toast.success("API key rotated successfully");
      await loadKeys(); // Reload to show updated key
    } catch (err) {
      console.error('Rotate key error:', err);
      toast.error(err.message || "Failed to rotate key");
    }
  };

  const handleDeleteKey = async (keyId, keyName) => {
    if (!confirm(`Delete "${keyName}"? This cannot be undone.`)) return;
    try {
      const response = await base44.functions.invoke('manageAPIKeySecurity', {
        action: 'revoke', key_id: keyId, reason: `Revoked from API Key Vault (${keyName})`
      });
      if (!response?.data?.success) throw new Error(response?.data?.error || 'Key revocation rejected');
      toast.success("API key revoked");
      await loadKeys(); // Reload list
    } catch (err) {
      console.error('Delete key error:', err);
      toast.error("Failed to delete key");
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const maskKey = (key) => {
    if (!key) return "••••••••";
    return key.substring(0, 8) + "••••••••" + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Key Vault</h1>
          <p className="text-white/70">Manage your secure API credentials</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-[#8C4BFF] to-[#9F00FF] hover:opacity-90 flex items-center gap-2"
        >
          <GlyphIcon type="blockchain" size={20} />
          Create New Key
        </Button>
      </div>

      {oneTimeSecret && (
        <Card className="bg-amber-950/20 border-amber-500/40">
          <CardContent className="p-5 space-y-3">
            <p className="text-amber-200 font-semibold">{oneTimeSecret.kind === 'rotated' ? 'Replacement secret generated' : 'API key created'}</p>
            <p className="text-sm text-amber-100/70">Copy this secret now. It is never stored in the APIKey record and disappears when dismissed.</p>
            <div className="flex gap-2"><Input readOnly value={oneTimeSecret.secret_key} className="font-mono bg-[#020617]" /><Button onClick={() => copyToClipboard(oneTimeSecret.secret_key, 'One-time secret')}><Copy className="w-4 h-4 mr-2" />Copy</Button><Button variant="outline" onClick={() => setOneTimeSecret(null)}>Dismiss</Button></div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
          <CardHeader>
            <CardTitle className="text-white">Generate New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Key Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Production API Key"
                  required
                  className="bg-[#020617] border-[#8C4BFF]/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="environment" className="text-white">Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData({ ...formData, environment: value })}
                >
                  <SelectTrigger className="bg-[#020617] border-[#8C4BFF]/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-[#8C4BFF] hover:bg-[#8C4BFF]/90">
                  Generate Key
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
            <CardContent className="p-6 text-center text-white/70">
              Loading keys...
            </CardContent>
          </Card>
        ) : keys.length === 0 ? (
          <Card className="bg-[#0A0F24] border-[#8C4BFF]/20">
            <CardContent className="p-12 text-center">
              <Key className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/70">No API keys yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id} className="bg-[#0A0F24] border-[#8C4BFF]/20 hover:border-[#8C4BFF]/40 transition-all">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#8C4BFF]/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-[#8C4BFF]" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{key.name}</h3>
                        <p className="text-xs text-white/50">
                          Created {new Date(key.created_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (key.environment || 'live') === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {key.environment || 'live'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRotateKey(key.id)}
                        className="text-cyan-400 hover:text-cyan-300"
                        title="Re-roll key"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Keys Display */}
                  <div className="space-y-3">
                    {/* Public Key */}
                    <div>
                      <Label className="text-xs text-white/50">Public Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-[#020617] px-3 py-2 rounded text-sm text-white font-mono">
                          {key.public_key}
                        </code>
                        <IconButton
                          type="attachment"
                          size={16}
                          onClick={() => copyToClipboard(key.public_key, "Public key")}
                          variant="primary"
                          title="Copy public key"
                        />
                      </div>
                    </div>

                    {/* Secret lifecycle */}
                    <div>
                      <Label className="text-xs text-white/50">Secret Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-[#020617] px-3 py-2 rounded text-sm text-white/40 font-mono">Not retrievable after creation/rotation</code>
                        <span className="text-xs text-white/40 italic">Hash stored only</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/50">Last Used</p>
                      <p className="text-sm text-white font-medium">
                        {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Status</p>
                      <p className="text-sm text-white font-medium capitalize">{key.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50">Rotation</p>
                      <p className="text-sm text-white font-medium">{key.rotation_schedule || 'Manual'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}