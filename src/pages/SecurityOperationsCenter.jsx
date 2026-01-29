import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Activity, Database, Loader2, CheckCircle2 } from "lucide-react";
import SEOHead from "@/components/SEOHead";

export default function SecurityOperationsCenter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = '/';
          return;
        }
        const userData = await base44.auth.me();
        if (userData.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(userData);
      } catch (err) {
        console.error('Auth error:', err);
        window.location.href = '/';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { data: qrThreats = [], isLoading: loadingThreats } = useQuery({
    queryKey: ['qrThreats'],
    queryFn: () => base44.entities.QRThreatLog.list('-created_date', 50),
    enabled: !!user
  });

  const { data: audits = [], isLoading: loadingAudits } = useQuery({
    queryKey: ['glyphbotAudits'],
    queryFn: () => base44.entities.GlyphBotAudit.list('-created_date', 25),
    enabled: !!user
  });

  const { data: blockchainActivity = [] } = useQuery({
    queryKey: ['blockchainActivity'],
    queryFn: () => base44.entities.BlockchainActivity.list('-created_date', 15),
    enabled: !!user
  });

  const { data: systemLogs = [] } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => base44.entities.SystemAuditLog.list('-created_date', 10),
    enabled: !!user
  });

  const combinedLedger = [
    ...blockchainActivity.map(b => ({ type: 'blockchain', time: b.created_date, data: b })),
    ...systemLogs.map(s => ({ type: 'system', time: s.created_date, data: s }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 25);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Security Operations Center | GlyphLock" description="Real-time security monitoring and threat intelligence" />
      <div className="min-h-screen bg-black text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Security Operations <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Center</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Real-time threat monitoring and evidence ledger
              </p>
              <Badge className="mt-4 bg-green-500/20 text-green-400 border-green-500/30">
                Admin Only • Evidence View
              </Badge>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-900/50 border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    QR Threats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{qrThreats.length}</p>
                  <p className="text-xs text-slate-400">Total incidents logged</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    Security Audits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{audits.length}</p>
                  <p className="text-xs text-slate-400">Total audits run</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-purple-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    Ledger Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{combinedLedger.length}</p>
                  <p className="text-xs text-slate-400">Combined activity</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Recent QR Threats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadingThreats ? (
                      <Loader2 className="w-6 h-6 animate-spin text-red-400 mx-auto" />
                    ) : qrThreats.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-slate-400">No threats detected</p>
                      </div>
                    ) : (
                      qrThreats.map((threat) => (
                        <div key={threat.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-red-400">{threat.attack_type}</p>
                            <Badge className={`text-xs ${threat.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                              {threat.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">{threat.threat_description?.substring(0, 80)}...</p>
                          <p className="text-xs text-slate-500">{new Date(threat.created_date).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Recent Security Audits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadingAudits ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-400 mx-auto" />
                    ) : audits.length === 0 ? (
                      <div className="text-center py-8">
                        <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No audits run yet</p>
                      </div>
                    ) : (
                      audits.map((audit) => (
                        <div key={audit.id} className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-blue-400">{audit.targetIdentifier?.substring(0, 40)}</p>
                            <Badge className={`text-xs ${
                              audit.status === 'COMPLETE' ? 'bg-green-500/20 text-green-400' : 
                              audit.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                              {audit.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">Target: {audit.targetType} • Mode: {audit.auditMode}</p>
                          <p className="text-xs text-slate-500">{new Date(audit.created_date).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-purple-500/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Combined Ledger Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {combinedLedger.length === 0 ? (
                      <div className="text-center py-8">
                        <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No ledger activity yet</p>
                      </div>
                    ) : (
                      combinedLedger.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${entry.type === 'blockchain' ? 'bg-purple-400' : 'bg-cyan-400'}`} />
                            <div>
                              <p className="text-sm text-white">
                                {entry.type === 'blockchain' 
                                  ? `${entry.data.operation_type} by ${entry.data.user_email}`
                                  : `${entry.data.event_type || 'System event'}`
                                }
                              </p>
                              <p className="text-xs text-slate-500">
                                {entry.type === 'blockchain' ? entry.data.algorithm : entry.data.description?.substring(0, 60)}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {new Date(entry.time).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}