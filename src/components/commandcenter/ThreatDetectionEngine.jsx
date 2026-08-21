import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Shield, AlertTriangle, Activity, Zap, Eye, Lock,
  TrendingUp, Clock, CheckCircle, XCircle, Loader2,
  Settings, Bell, ShieldAlert, ShieldCheck, Radio
} from "lucide-react";

// Threat Detection Configuration
const DEFAULT_THRESHOLDS = {
  apiCallsPerMinute: 100,
  failedAuthAttempts: 5,
  unusualHourActivity: true,
  rapidAssetCreation: 20, // assets per hour
  geoAnomalyDetection: true,
  sensitivityLevel: 50, // 0-100
  autoDisableKeys: false,
  alertOnNewDevice: true
};

// Threat types and severity
const THREAT_TYPES = {
  RATE_LIMIT_EXCEEDED: { severity: 'high', label: 'Rate Limit Exceeded', icon: TrendingUp },
  FAILED_AUTH_SPIKE: { severity: 'critical', label: 'Authentication Attack', icon: Lock },
  UNUSUAL_HOUR: { severity: 'medium', label: 'Unusual Activity Hours', icon: Clock },
  RAPID_ASSET_CREATION: { severity: 'medium', label: 'Rapid Asset Creation', icon: Zap },
  SUSPICIOUS_PATTERN: { severity: 'high', label: 'Suspicious Pattern', icon: Eye },
  API_KEY_ABUSE: { severity: 'critical', label: 'API Key Abuse', icon: ShieldAlert }
};

// Analyze activity patterns
function analyzePatterns(logs, apiKeys, assets, thresholds) {
  const threats = [];
  const now = new Date();
  const oneHourAgo = new Date(now - 60 * 60 * 1000);
  const oneMinuteAgo = new Date(now - 60 * 1000);

  // Get recent logs
  const recentLogs = logs.filter(l => new Date(l.created_date) > oneHourAgo);
  const veryRecentLogs = logs.filter(l => new Date(l.created_date) > oneMinuteAgo);

  // 1. Check API call rate (per minute)
  if (veryRecentLogs.length > thresholds.apiCallsPerMinute * (thresholds.sensitivityLevel / 100)) {
    threats.push({
      type: 'RATE_LIMIT_EXCEEDED',
      details: `${veryRecentLogs.length} API calls in last minute (threshold: ${thresholds.apiCallsPerMinute})`,
      timestamp: now,
      data: { count: veryRecentLogs.length, threshold: thresholds.apiCallsPerMinute }
    });
  }

  // 2. Check failed auth attempts
  const failedAuths = recentLogs.filter(l => 
    l.event_type?.toLowerCase().includes('auth') && 
    l.status === 'failure'
  );
  if (failedAuths.length >= thresholds.failedAuthAttempts) {
    threats.push({
      type: 'FAILED_AUTH_SPIKE',
      details: `${failedAuths.length} failed authentication attempts in last hour`,
      timestamp: now,
      data: { count: failedAuths.length, threshold: thresholds.failedAuthAttempts }
    });
  }

  // 3. Check unusual hours (2am - 5am local time)
  if (thresholds.unusualHourActivity) {
    const hour = now.getHours();
    const unusualHourLogs = recentLogs.filter(l => {
      const logHour = new Date(l.created_date).getHours();
      return logHour >= 2 && logHour <= 5;
    });
    if (unusualHourLogs.length > 5 && hour >= 2 && hour <= 5) {
      threats.push({
        type: 'UNUSUAL_HOUR',
        details: `${unusualHourLogs.length} activities detected during unusual hours (2am-5am)`,
        timestamp: now,
        data: { count: unusualHourLogs.length }
      });
    }
  }

  // 4. Rapid asset creation
  const recentAssets = assets.filter(a => new Date(a.created_date) > oneHourAgo);
  if (recentAssets.length > thresholds.rapidAssetCreation * (thresholds.sensitivityLevel / 100)) {
    threats.push({
      type: 'RAPID_ASSET_CREATION',
      details: `${recentAssets.length} assets created in last hour (threshold: ${thresholds.rapidAssetCreation})`,
      timestamp: now,
      data: { count: recentAssets.length, threshold: thresholds.rapidAssetCreation }
    });
  }

  // 5. API Key abuse patterns
  apiKeys.forEach(key => {
    const keyLogs = recentLogs.filter(l => l.api_key_id === key.id);
    const errorRate = keyLogs.filter(l => l.status === 'failure').length / (keyLogs.length || 1);
    
    if (errorRate > 0.5 && keyLogs.length > 10) {
      threats.push({
        type: 'API_KEY_ABUSE',
        details: `API Key "${key.name}" has ${Math.round(errorRate * 100)}% error rate`,
        timestamp: now,
        data: { keyId: key.id, keyName: key.name, errorRate }
      });
    }
  });

  // 6. Suspicious patterns - burst followed by silence
  const logsByHour = {};
  recentLogs.forEach(l => {
    const hour = new Date(l.created_date).getHours();
    logsByHour[hour] = (logsByHour[hour] || 0) + 1;
  });
  const hourCounts = Object.values(logsByHour);
  if (hourCounts.length > 1) {
    const max = Math.max(...hourCounts);
    const min = Math.min(...hourCounts);
    if (max > 50 && min < 5 && max / (min || 1) > 10) {
      threats.push({
        type: 'SUSPICIOUS_PATTERN',
        details: 'Detected burst activity pattern followed by silence',
        timestamp: now,
        data: { maxActivity: max, minActivity: min }
      });
    }
  }

  return threats;
}

// Threat Alert Component
export function ThreatAlert({ threat, onDismiss, onAction }) {
  const config = THREAT_TYPES[threat.type] || THREAT_TYPES.SUSPICIOUS_PATTERN;
  const Icon = config.icon;
  
  const severityColors = {
    low: 'border-blue-500/30 bg-blue-500/10',
    medium: 'border-yellow-500/30 bg-yellow-500/10',
    high: 'border-orange-500/30 bg-orange-500/10',
    critical: 'border-red-500/30 bg-red-500/10 animate-pulse'
  };

  const severityBadge = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[config.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${severityBadge[config.severity]}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white text-sm">{config.label}</span>
              <Badge className={severityBadge[config.severity]} variant="outline">
                {config.severity}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">{threat.details}</p>
            <p className="text-[10px] text-slate-500 mt-1">
              {new Date(threat.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {threat.type === 'API_KEY_ABUSE' && threat.data?.keyId && (
            <Button 
              size="sm" 
              variant="destructive" 
              className="h-7 text-xs"
              onClick={() => onAction?.('disable_key', threat.data.keyId)}
            >
              Disable Key
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 text-xs"
            onClick={() => onDismiss?.(threat)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}

// Threat Configuration Panel
export function ThreatConfigPanel({ config, onConfigChange }) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          Threat Detection Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sensitivity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-slate-300">Detection Sensitivity</Label>
            <span className="text-xs text-cyan-400 font-mono">{config.sensitivityLevel}%</span>
          </div>
          <Slider
            value={[config.sensitivityLevel]}
            onValueChange={([val]) => onConfigChange({ ...config, sensitivityLevel: val })}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
          <p className="text-[10px] text-slate-500">
            Higher sensitivity = more alerts, lower thresholds
          </p>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">API Calls/min</Label>
            <input
              type="number"
              value={config.apiCallsPerMinute}
              onChange={(e) => onConfigChange({ ...config, apiCallsPerMinute: parseInt(e.target.value) || 100 })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Failed Auth Limit</Label>
            <input
              type="number"
              value={config.failedAuthAttempts}
              onChange={(e) => onConfigChange({ ...config, failedAuthAttempts: parseInt(e.target.value) || 5 })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Assets/hour Limit</Label>
            <input
              type="number"
              value={config.rapidAssetCreation}
              onChange={(e) => onConfigChange({ ...config, rapidAssetCreation: parseInt(e.target.value) || 20 })}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-slate-300">Auto-disable Suspicious Keys</Label>
              <p className="text-[10px] text-slate-500">Automatically disable API keys showing abuse patterns</p>
            </div>
            <Switch
              checked={config.autoDisableKeys}
              onCheckedChange={(val) => onConfigChange({ ...config, autoDisableKeys: val })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-slate-300">Unusual Hour Detection</Label>
              <p className="text-[10px] text-slate-500">Flag activity between 2am-5am</p>
            </div>
            <Switch
              checked={config.unusualHourActivity}
              onCheckedChange={(val) => onConfigChange({ ...config, unusualHourActivity: val })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Threat Detection Hook
export function useThreatDetection(user) {
  const queryClient = useQueryClient();
  const [threats, setThreats] = useState([]);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('glyphlock_threat_config');
    return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
  });
  const [isScanning, setIsScanning] = useState(false);

  // Fetch data for analysis
  const { data: apiKeys = [] } = useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => base44.entities.APIKey.list()
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.SystemAuditLog.list('-created_date', 500)
  });

  const { data: qrAssets = [] } = useQuery({
    queryKey: ['qrAssets'],
    queryFn: () => base44.entities.QrAsset.list('-created_date', 200)
  });

  const { data: images = [] } = useQuery({
    queryKey: ['images'],
    queryFn: () => base44.entities.InteractiveImage.list()
  });

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('glyphlock_threat_config', JSON.stringify(config));
  }, [config]);

  // Log threat incident
  const logIncident = useCallback(async (threat) => {
    try {
      await base44.entities.SystemAuditLog.create({
        event_type: `THREAT_DETECTED_${threat.type}`,
        description: threat.details,
        status: 'alert',
        actor_email: user?.email,
        metadata: JSON.stringify(threat.data || {})
      });
    } catch (err) {
      console.error('Failed to log threat incident:', err);
    }
  }, [user?.email]);

  // Disable API key
  const disableApiKey = useCallback(async (keyId) => {
    try {
      const action = await base44.functions.invoke('manageAPIKeySecurity', {
        action: 'disable', key_id: keyId, reason: 'Automated threat-detection response'
      });
      if (!action?.data?.success) throw new Error(action?.data?.error || 'Security action rejected');
      queryClient.invalidateQueries(['apiKeys']);
      toast.success('API key disabled');
      
      await base44.entities.SystemAuditLog.create({
        event_type: 'API_KEY_AUTO_DISABLED',
        description: `API key ${keyId} automatically disabled due to threat detection`,
        status: 'security_action',
        actor_email: 'system'
      });
    } catch (err) {
      toast.error('Failed to disable key');
    }
  }, [queryClient]);

  // Run threat analysis
  const runAnalysis = useCallback(() => {
    setIsScanning(true);
    
    const allAssets = [...qrAssets, ...images];
    const detectedThreats = analyzePatterns(auditLogs, apiKeys, allAssets, config);
    
    // Check for new threats
    const newThreats = detectedThreats.filter(t => 
      !threats.some(existing => 
        existing.type === t.type && 
        Math.abs(new Date(existing.timestamp) - new Date(t.timestamp)) < 60000
      )
    );

    if (newThreats.length > 0) {
      setThreats(prev => [...newThreats, ...prev].slice(0, 50));
      
      // Log new threats
      newThreats.forEach(threat => {
        logIncident(threat);
        
        // Auto-disable keys if configured
        if (config.autoDisableKeys && threat.type === 'API_KEY_ABUSE' && threat.data?.keyId) {
          disableApiKey(threat.data.keyId);
        }
      });

      // Show notification for critical threats
      const criticalThreats = newThreats.filter(t => 
        THREAT_TYPES[t.type]?.severity === 'critical'
      );
      if (criticalThreats.length > 0) {
        toast.error(`${criticalThreats.length} critical threat(s) detected!`, {
          duration: 10000
        });
      }
    }

    setIsScanning(false);
  }, [auditLogs, apiKeys, qrAssets, images, config, threats, logIncident, disableApiKey]);

  // Run analysis periodically
  useEffect(() => {
    runAnalysis();
    const interval = setInterval(runAnalysis, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [runAnalysis]);

  const dismissThreat = useCallback((threat) => {
    setThreats(prev => prev.filter(t => t !== threat));
  }, []);

  const handleAction = useCallback((action, data) => {
    if (action === 'disable_key') {
      disableApiKey(data);
    }
  }, [disableApiKey]);

  return {
    threats,
    config,
    setConfig,
    isScanning,
    runAnalysis,
    dismissThreat,
    handleAction,
    threatCount: threats.length,
    criticalCount: threats.filter(t => THREAT_TYPES[t.type]?.severity === 'critical').length
  };
}

// Threat Summary Widget
export function ThreatSummaryWidget({ threats, isScanning, onViewAll }) {
  const criticalCount = threats.filter(t => THREAT_TYPES[t.type]?.severity === 'critical').length;
  const highCount = threats.filter(t => THREAT_TYPES[t.type]?.severity === 'high').length;

  return (
    <Card className={`bg-slate-900/50 border-slate-800 ${criticalCount > 0 ? 'border-red-500/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-5 h-5 ${criticalCount > 0 ? 'text-red-400' : 'text-green-400'}`} />
            <span className="text-sm font-semibold text-white">Threat Detection</span>
          </div>
          {isScanning && (
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              <Radio className="w-3 h-3 animate-pulse" />
              Scanning
            </div>
          )}
        </div>
        
        {threats.length === 0 ? (
          <div className="flex items-center gap-2 text-green-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm">No active threats</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              {criticalCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-400">{criticalCount} Critical</span>
                </div>
              )}
              {highCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-xs text-orange-400">{highCount} High</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-slate-400">{threats.length} Total</span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full mt-2 border-slate-700 text-xs"
              onClick={onViewAll}
            >
              View All Threats
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { DEFAULT_THRESHOLDS, THREAT_TYPES, analyzePatterns };