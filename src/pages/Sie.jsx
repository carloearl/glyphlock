import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle2, AlertTriangle, RefreshCw, History, Settings, Bot, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ScanHistory from "@/components/sie/ScanHistory";
import ScanAutomation from "@/components/sie/ScanAutomation";
import AIRemediationPanel from "@/components/sie/AIRemediationPanel";

export default function Sie() {
  const [user, setUser] = useState(null);
  const [scanRun, setScanRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [config, setConfig] = useState(null);
  
  const [navRows, setNavRows] = useState([]);
  const [routeRows, setRouteRows] = useState([]);
  const [sitemapRows, setSitemapRows] = useState([]);
  const [backendRows, setBackendRows] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Admin guard
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
          toast.error('Site Intelligence Engine is admin-only');
          window.location.href = '/';
          return;
        }
        setUser(userData);
      } catch (err) {
        console.error('Auth error:', err);
        window.location.href = '/';
      }
    })();
  }, []);

  // Initial Data Load via Middleware
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      // Use the unified middleware to fetch all dashboard data
      const res = await base44.functions.invoke("sieOps", { action: "get_dashboard" });
      const { history: fetchedHistory, config: fetchedConfig } = res.data;
      
      setHistory(fetchedHistory || []);
      setConfig(fetchedConfig);

      if (fetchedHistory && fetchedHistory.length > 0) {
        // Load details for the latest scan
        await loadScanDetails(fetchedHistory[0]);
      }
    } catch (e) {
      console.error("Failed to load dashboard:", e);
      toast.error("Failed to connect to SIE Backend");
    } finally {
      setInitializing(false);
    }
  };

  const loadScanDetails = async (run) => {
    setScanRun(run);
    try {
      const res = await base44.functions.invoke("sieOps", { 
        action: "get_scan_details", 
        payload: { scan_id: run.scan_id } // scan_id matches the foreign key
      });
      
      const { nav, routes, sitemaps, backend } = res.data;
      setNavRows(nav);
      setRouteRows(routes);
      setSitemapRows(sitemaps);
      setBackendRows(backend);
    } catch (e) {
      console.error("Failed to load scan details:", e);
      toast.error("Could not load scan details");
    }
  };

  const runScan = async () => {
    setLoading(true);
    try {
      // 1. Trigger the unified scan
      const res = await base44.functions.invoke("runFullScan");
      
      // 2. Handle immediate completion (Unified scan is now awaited backend-side)
      if (res.data?.status === "success" || res.data?.status === "warning" || res.data?.status === "critical") {
        toast.success(`Scan completed: ${res.data.status.toUpperCase()}`);
        
        // 3. Immediately fetch the fresh data for this specific run to update UI
        // We use the run_id from the response to be precise
        if (res.data?.run_id) {
            // First update the history list
            await loadDashboardData(); 
        }
      } else {
        toast.error("Scan failed or timed out");
      }
    } catch (e) {
      console.error("Scan execution failed:", e);
      toast.error("Scan failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await base44.functions.invoke("sieOps", { 
        action: "save_config", 
        payload: { config } 
      });
      toast.success("Configuration saved");
    } catch (e) {
      toast.error("Failed to save configuration");
    }
  };

  if (initializing || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="bg-slate-950 border-slate-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">Site Intelligence Engine</CardTitle>
            <p className="text-slate-400">System Integrity & Auditing</p>
          </div>
          <div className="flex gap-4 items-center">
            {scanRun && (
              <div className="text-right hidden md:block">
                <p className="text-sm text-slate-400">Last Scan</p>
                <p className="font-mono">{new Date(scanRun.started_at).toLocaleString()}</p>
              </div>
            )}
            <Button 
              onClick={runScan} 
              disabled={loading} 
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {loading ? "Scanning..." : "Run Full Scan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatusCard label="Navigation" ok={scanRun?.nav_ok_count} warn={scanRun?.nav_warning_count} crit={scanRun?.nav_critical_count} />
            <StatusCard label="Routes" ok={scanRun?.route_ok_count} warn={scanRun?.route_warning_count} crit={scanRun?.route_critical_count} />
            <StatusCard label="Sitemaps" ok={scanRun?.sitemap_ok_count} warn={scanRun?.sitemap_warning_count} crit={scanRun?.sitemap_critical_count} />
            <StatusCard label="Backend" ok={scanRun?.backend_ok_count} warn={scanRun?.backend_warning_count} crit={scanRun?.backend_critical_count} />
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-900 text-slate-400 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="navigation">Navigation</TabsTrigger>
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="sitemaps">Sitemaps</TabsTrigger>
              <TabsTrigger value="backend">Backend</TabsTrigger>
              <TabsTrigger value="ai-fixes" className="gap-2"><Sparkles className="w-4 h-4" /> AI Fixes</TabsTrigger>
              <TabsTrigger value="history" className="ml-auto"><History className="w-4 h-4 mr-2" /> History</TabsTrigger>
              <TabsTrigger value="automation"><Settings className="w-4 h-4 mr-2" /> Automation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4 text-white">System Status</h3>
                  <div className="flex items-center gap-2">
                    {!scanRun ? <span className="text-slate-500">No scan data available</span> :
                     scanRun.status === 'success' ? <><CheckCircle2 className="text-green-500 h-8 w-8" /><span className="text-xl capitalize text-white">Secure</span></> :
                     scanRun.status === 'warning' ? <><AlertTriangle className="text-yellow-500 h-8 w-8" /><span className="text-xl capitalize text-white">Warning</span></> :
                     <><AlertCircle className="text-red-500 h-8 w-8" /><span className="text-xl capitalize text-white">Critical</span></>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="navigation">
              <DataTable 
                columns={['Label', 'Path', 'Visibility', 'Status', 'Severity', 'Action']}
                data={navRows}
                renderRow={(row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-white">{row.label}</TableCell>
                    <TableCell className="font-mono text-slate-300">{row.path}</TableCell>
                    <TableCell><Badge variant="outline">{row.visibility}</Badge></TableCell>
                    <TableCell>{row.http_status}</TableCell>
                    <TableCell><SeverityBadge severity={row.severity} /></TableCell>
                    <TableCell className="text-white">{row.required_action}</TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            <TabsContent value="routes">
              <DataTable 
                columns={['Route', 'Component', 'Public', 'Auth', 'Severity', 'Action']}
                data={routeRows}
                renderRow={(row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-white">{row.route_path}</TableCell>
                    <TableCell className="text-slate-300">{row.component_name}</TableCell>
                    <TableCell>{row.is_public ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.has_auth_guard ? 'Yes' : 'No'}</TableCell>
                    <TableCell><SeverityBadge severity={row.severity} /></TableCell>
                    <TableCell className="text-white">{row.required_action}</TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            <TabsContent value="sitemaps">
              <DataTable 
                columns={['Type', 'Human URL', 'XML URL', 'Exists', 'Severity', 'Action']}
                data={sitemapRows}
                renderRow={(row) => (
                  <TableRow key={row.id}>
                    <TableCell className="capitalize text-white">{row.sitemap_type}</TableCell>
                    <TableCell><a href={row.human_readable_url} className="text-blue-400 hover:underline" target="_blank">{row.human_readable_url}</a></TableCell>
                    <TableCell><a href={row.xml_url} className="text-blue-400 hover:underline" target="_blank">XML</a></TableCell>
                    <TableCell>{row.human_exists && row.xml_exists ? 'Yes' : 'No'}</TableCell>
                    <TableCell><SeverityBadge severity={row.severity} /></TableCell>
                    <TableCell className="text-white">{row.required_action}</TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            <TabsContent value="backend">
              <DataTable 
                columns={['Function', 'Endpoint', 'Exists', 'Responds', 'Severity', 'Action']}
                data={backendRows}
                renderRow={(row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-white">{row.function_name}</TableCell>
                    <TableCell className="font-mono text-slate-300">{row.endpoint_path}</TableCell>
                    <TableCell>{row.function_exists ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.responds_correctly ? 'Yes' : 'No'}</TableCell>
                    <TableCell><SeverityBadge severity={row.severity} /></TableCell>
                    <TableCell className="text-white">
                      {row.required_action?.startsWith('[AI]') ? (
                        <div className="flex items-start gap-2">
                          <Bot className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
                          <span className="text-purple-100">{row.required_action.replace('[AI] ', '')}</span>
                        </div>
                      ) : (
                        row.required_action
                      )}
                    </TableCell>
                  </TableRow>
                )}
              />
            </TabsContent>

            <TabsContent value="ai-fixes" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AIRemediationPanel findings={navRows} scanType="navigation" />
                <AIRemediationPanel findings={routeRows} scanType="routes" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AIRemediationPanel findings={sitemapRows} scanType="sitemaps" />
                <AIRemediationPanel findings={backendRows} scanType="backend" />
              </div>
            </TabsContent>

            <TabsContent value="history">
              <ScanHistory history={history} onSelectScan={loadScanDetails} />
            </TabsContent>

            <TabsContent value="automation">
              <ScanAutomation config={config} onConfigChange={setConfig} onSave={handleSaveConfig} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({ label, ok = 0, warn = 0, crit = 0 }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <p className="text-sm text-slate-400 mb-2">{label}</p>
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-green-500">{ok || 0}</p>
            <p className="text-xs text-slate-500">OK</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-yellow-500">{warn || 0}</p>
            <p className="text-xs text-slate-500">Warn</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-500">{crit || 0}</p>
            <p className="text-xs text-slate-500">Crit</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SeverityBadge({ severity }) {
  const colors = {
    ok: "bg-green-500/10 text-green-500",
    warning: "bg-yellow-500/10 text-yellow-500",
    critical: "bg-red-500/10 text-red-500"
  };
  return <Badge className={colors[severity] || "bg-slate-500/10 text-slate-500"}>{severity}</Badge>;
}

function DataTable({ columns, data, renderRow }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-900">
              {columns.map(c => <TableHead key={c} className="text-slate-400">{c}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-slate-500 h-24">No data available</TableCell>
              </TableRow>
            ) : (
              data.map(renderRow)
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}