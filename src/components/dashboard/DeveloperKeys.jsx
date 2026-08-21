import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Copy, Check, Key, RefreshCw, Plus, Eye, EyeOff, Shield, 
  Terminal, Globe, Lock, Server, AlertTriangle, Clock, 
  MapPin, Smartphone, Network, History, FileCode, Trash2
} from "lucide-react";
import GlyphLoader from "@/components/GlyphLoader";
import { toast } from "sonner";

export default function DeveloperKeys() {
  const [oneTimeSecret, setOneTimeSecret] = useState(null);
  const [copied, setCopied] = useState(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [environment, setEnvironment] = useState("live");
  const [isCreating, setIsCreating] = useState(false);
  const [processing, setProcessing] = useState(null);
  const queryClient = useQueryClient();

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => base44.entities.APIKey.list({ sort: { created_date: -1 } })
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke("generateAPIKey", data);
      return response.data;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsCreating(false);
      setNewKeyName("");
      if (created?.secret_key) setOneTimeSecret({ kind: 'created', name: created.name || 'API key', public_key: created.public_key, secret_key: created.secret_key });
      toast.success("API key generated securely");
    },
    onError: () => {
      toast.error("Failed to generate Keys");
    }
  });

  const updateKeyMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await base44.functions.invoke('manageAPIKeySecurity', { action: 'update_metadata', key_id: id, data });
      if (!response?.data?.success) throw new Error(response?.data?.error || 'API key metadata update rejected');
      return response.data.key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success("Key settings updated");
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: async (id) => {
      const response = await base44.functions.invoke('manageAPIKeySecurity', { action: 'revoke', key_id: id, reason: 'Revoked from Developer Keys' });
      if (!response?.data?.success) throw new Error(response?.data?.error || 'API key revocation rejected');
      return response.data.key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success("Key revoked");
    }
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: async ({ id, type }) => {
        const res = await base44.functions.invoke("rotateAPIKey", { key_id: id, type });
        if (res.status >= 400) throw new Error(res.data.error || "Failed to rotate key");
        return res.data;
    },
    onSuccess: (rotated) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setProcessing(null);
      if (rotated?.secret_key) setOneTimeSecret({ kind: 'rotated', name: rotated.name || 'API key', public_key: rotated.public_key, secret_key: rotated.secret_key });
      toast.success("API key rotated securely");
    },
    onError: (error) => {
      setProcessing(null);
      toast.error(`Rotation failed: ${error.message}`);
    }
  });

  const handleReglyph = (id, type) => {
    if (confirm(`Are you sure you want to rotate the ${type} key? The old key will stop working immediately.`)) {
        setProcessing(id);
        regenerateKeyMutation.mutate({ id, type });
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copied to clipboard");
  };

  const handleCreateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    createKeyMutation.mutate({ name: newKeyName, environment });
  };

  const handleKillSwitch = (id) => {
      if (confirm("WARNING: KILL SWITCH. This will immediately revoke ALL keys and regenerate them. Active connections will be severed. Continue?")) {
          setProcessing(id);
          regenerateKeyMutation.mutate({ id, type: 'all' });
      }
  };

  if (isLoading) return <GlyphLoader text="Loading Developer Console..." />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-blue-900/30 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            API Key Management Center
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            Manage API keys. Secrets are shown only once at creation or rotation and are never recoverable from stored key records.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-500/50 shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Keys
        </Button>
      </div>

      {isCreating && (
        <Card className="bg-gray-900/50 border-blue-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
          <CardHeader>
            <CardTitle className="text-white">Generate New Key Set</CardTitle>
            <CardDescription className="text-gray-400">Creates a public key plus a one-time secret. Only the secret hash is persisted.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="flex gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label>Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., glx_payment_prod"
                  className="bg-black/50 border-blue-500/30 text-white placeholder:text-gray-600"
                  list="key-suggestions"
                />
                <datalist id="key-suggestions">
                    <option value="glx_auth_primary" />
                    <option value="glx_gateway_prod" />
                    <option value="glx_contracts_main" />
                    <option value="glx_hotzone_scanner" />
                    <option value="glx_ai_binding_core" />
                </datalist>
              </div>
              <div className="grid gap-2 w-40">
                <Label>Environment</Label>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="bg-black/50 border-blue-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                disabled={createKeyMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createKeyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Generate Keys"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {oneTimeSecret && (
        <Card className="border-amber-500/40 bg-amber-950/20">
          <CardContent className="p-5 space-y-3">
            <div>
              <p className="font-semibold text-amber-200">{oneTimeSecret.kind === 'rotated' ? 'Replacement secret generated' : 'API key created'}</p>
              <p className="text-sm text-amber-100/70">Save this secret now. It will not be shown again after you dismiss this panel.</p>
            </div>
            <div className="flex gap-2">
              <Input readOnly value={oneTimeSecret.secret_key} className="font-mono bg-black/50" />
              <Button type="button" onClick={() => copyToClipboard(oneTimeSecret.secret_key, 'one-time-secret')}><Copy className="w-4 h-4 mr-2" />Copy</Button>
              <Button type="button" variant="outline" onClick={() => setOneTimeSecret(null)}>Dismiss</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-8">
        {keys.length === 0 ? (
          <Card className="bg-gray-900/30 border-dashed border-2 border-gray-700 p-12 flex flex-col items-center justify-center text-center">
            <Shield className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Access Keys Active</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Initialize your first Tri-Key set to start integrating with the GlyphLock secure ecosystem.
            </p>
            <Button 
              onClick={() => setIsCreating(true)}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
            >
              Initialize Keys
            </Button>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id} className="bg-gray-900/40 border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all overflow-hidden group">
              <div className={`h-1 w-full ${key.status === 'compromised' ? 'bg-red-600' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500'}`} />
              <CardContent className="p-6">
                
                {/* Header */}
                <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <Key className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-xl">{key.name}</h3>
                        <Badge variant="outline" className={`
                            ${key.status === 'active' ? 'border-green-500/50 text-green-400 bg-green-500/10' : ''}
                            ${key.status === 'revoked' ? 'border-red-500/50 text-red-400 bg-red-500/10' : ''}
                        `}>
                            {key.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1 font-mono">
                        <span className="flex items-center gap-1 text-blue-400"><Globe className="w-3 h-3" /> {(key.environment || 'live').toUpperCase()}</span>
                        <span>•</span>
                        <span>Created: {new Date(key.created_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><History className="w-3 h-3" /> Last used: {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Select 
                        value={key.rotation_schedule || 'manual'} 
                        onValueChange={(val) => updateKeyMutation.mutate({ id: key.id, data: { rotation_schedule: val }})}
                     >
                        <SelectTrigger className="h-8 w-32 bg-black/50 border-gray-700 text-xs">
                            <SelectValue placeholder="Rotation" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="manual">Manual Rotation</SelectItem>
                            <SelectItem value="30_days">Every 30 Days</SelectItem>
                            <SelectItem value="60_days">Every 60 Days</SelectItem>
                            <SelectItem value="90_days">Every 90 Days</SelectItem>
                        </SelectContent>
                     </Select>
                     
                     <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleKillSwitch(key.id)}
                        disabled={processing === key.id}
                        className="h-8 bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900/50"
                     >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        KILL SWITCH
                     </Button>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  
                  {/* Public Key Section */}
                  <div className="space-y-3 p-4 rounded-lg bg-blue-950/10 border border-blue-500/10 relative group/key">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 text-blue-400">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm font-bold tracking-wider">PUBLIC KEY</span>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleReglyph(key.id, 'public')}
                            className="h-6 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                        >
                            Reglyph Public
                        </Button>
                    </div>
                    <div className="relative">
                      <Input 
                        readOnly 
                        value={key.public_key} 
                        className="bg-black/60 border-blue-500/20 font-mono text-sm text-green-400 pr-10 h-11"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(key.public_key, `pk-${key.id}`)}
                        className="absolute right-1 top-1 hover:bg-blue-500/20 text-gray-400 hover:text-white h-9 w-9"
                      >
                        {copied === `pk-${key.id}` ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600">
                        <span>Entropy: 6-char</span>
                        <span>Rotated: {key.last_rotated ? new Date(key.last_rotated).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>

                  {/* Secret lifecycle */}
                  <div className="space-y-3 p-4 rounded-lg bg-purple-950/10 border border-purple-500/10">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-bold tracking-wider">SECRET KEY</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleReglyph(key.id, 'secret')} className="h-6 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-900/30">Rotate Secret</Button>
                    </div>
                    <div className="rounded bg-black/50 border border-purple-500/20 p-3 text-sm text-gray-400">
                      Secret shown only at creation or rotation. Stored key records contain only a SHA-256 secret hash.
                    </div>
                  </div>

                </div>

                {/* Safe export metadata */}
                <div className="mt-6 pt-6 border-t border-gray-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-300"><Server className="w-4 h-4" /><span className="text-sm font-bold tracking-wider">SAFE ENVIRONMENT METADATA</span></div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(`export GLX_PUBLIC_KEY="${key.public_key}"\nexport GLX_ENV_TAG="${key.environment || 'live'}"`, `env-${key.id}`)} className="text-xs h-7 border-gray-700 hover:bg-gray-800"><Copy className="w-3 h-3 mr-2" />Copy Safe Export</Button>
                  </div>
                  <div className="bg-black/80 rounded-lg p-4 border border-gray-800 font-mono text-xs">
                    <div>GLX_PUBLIC_KEY="{key.public_key}"</div>
                    <div>GLX_ENV_TAG="{key.environment || 'live'}"</div>
                    <div className="mt-2 text-gray-500">GLX_SECRET_KEY is intentionally omitted. Use the one-time creation/rotation response.</div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="mt-6 flex flex-wrap gap-6 pt-4 border-t border-gray-800/50">
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={key.geo_lock} 
                            onCheckedChange={(val) => updateKeyMutation.mutate({ id: key.id, data: { geo_lock: val }})}
                        />
                        <Label className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Geo Lock</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={key.device_lock} 
                            onCheckedChange={(val) => updateKeyMutation.mutate({ id: key.id, data: { device_lock: val }})}
                        />
                        <Label className="text-xs text-gray-400 flex items-center gap-1"><Smartphone className="w-3 h-3" /> Device Lock</Label>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Network className="w-3 h-3" /> IP Allowlist:</span>
                        <Input 
                            placeholder="0.0.0.0/0" 
                            value={key.ip_allowlist || ''}
                            onChange={(e) => updateKeyMutation.mutate({ id: key.id, data: { ip_allowlist: e.target.value }})}
                            className="h-6 w-32 text-xs bg-black/50 border-gray-800"
                        />
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