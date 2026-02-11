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
  const [visibleKeys, setVisibleKeys] = useState({});
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
      
      // Show secret key in modal/alert (only shown once)
      if (newKey.secret_key) {
        alert(`🔐 SECRET KEY (save this now - won't be shown again!):\n\n${newKey.secret_key}\n\nPublic Key: ${newKey.public_key}`);
      }
      
      toast.success("API key created successfully");
      setKeys([newKey, ...keys]);
      setShowCreateForm(false);
      setFormData({ name: "", environment: "live" });
    } catch (err) {
      console.error('API Key Creation Error:', err);
      toast.error(err.message || "Failed to create API key");
    }
  };

  const handleRotateKey = async (keyId) => {
    try {
      const response = await base44.functions.invoke('rotateAPIKey', { keyId });
      const rotated = response.data;
      
      if (rotated.secret_key) {
        alert(`🔐 NEW SECRET KEY (save this now!):\n\n${rotated.secret_key}`);
      }
      
      toast.success("API key rotated successfully");
      setKeys(keys.map(k => k.id === keyId ? rotated : k));
    } catch (err) {
      console.error('Rotate key error:', err);
      toast.error(err.message || "Failed to rotate key");
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
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
          <GlyphIcon type="blockchain" size={20} glow />
          Create New Key
        </Button>
      </div>

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
                        key.environment === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {key.environment}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRotateKey(key.id)}
                        className="text-white/70 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4" />
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

                    {/* Secret Key */}
                    <div>
                      <Label className="text-xs text-white/50">Secret Key</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-[#020617] px-3 py-2 rounded text-sm text-white font-mono">
                          {visibleKeys[key.id] ? key.secret_key : maskKey(key.secret_key)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <IconButton
                          type="download"
                          size={16}
                          onClick={() => copyToClipboard(key.secret_key, "Secret key")}
                          variant="success"
                          title="Copy secret key"
                        />
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