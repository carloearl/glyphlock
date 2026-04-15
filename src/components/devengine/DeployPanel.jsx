import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Rocket, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Loader2,
  Copy,
  RotateCcw,
  FileCode,
  Database,
  Terminal,
  Code,
  Download,
  Play,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import HoverTooltip from '@/components/ui/HoverTooltip';

export default function DeployPanel() {
  const [changeSets, setChangeSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChangeSet, setSelectedChangeSet] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [patchBundle, setPatchBundle] = useState(null);

  useEffect(() => {
    loadChangeSets();
  }, []);

  const loadChangeSets = async () => {
    try {
      const sets = await base44.entities.AgentChangeSet.list('-created_date', 50);
      setChangeSets(sets || []);
    } catch (error) {
      console.error('Failed to load change sets:', error);
      toast.error('Failed to load change sets');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    toast.info('Auto-generation is disabled by the OMEGA directive.');
  };

  const handleApply = async () => {
    toast.info('Auto-apply is disabled by the OMEGA directive.');
  };

  const handleRollback = async (changeSetId) => {
    if (!confirm('Rollback this change set? This will revert all changes.')) return;
    
    setIsRollingBack(true);
    try {
      const { data } = await base44.functions.invoke('agentRollback', { changeSetId });
      
      if (data.success) {
        toast.success(`Rolled back ${data.rolledBackModules} modules`);
        if (data.rollbackText) {
          setPatchBundle(data.rollbackText);
        }
        await loadChangeSets();
      } else {
        toast.error(data.error || 'Rollback failed');
      }
    } catch (error) {
      toast.error('Rollback failed: ' + error.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleDelete = async (changeSetId) => {
    if (!confirm('Delete this change set permanently?')) return;
    
    try {
      await base44.entities.AgentChangeSet.delete(changeSetId);
      toast.success('Change set deleted');
      await loadChangeSets();
      if (selectedChangeSet?.id === changeSetId) {
        setSelectedChangeSet(null);
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const copyPatchBundle = () => {
    if (!patchBundle) return;
    navigator.clipboard.writeText(patchBundle);
    toast.success('Patch Bundle copied! Paste to Base44 AI chat to deploy.');
  };

  // EXPORT ALL - Download entire codebase for offline independence
  const handleExportAll = async () => {
    toast.info('Exporting all code...');
    try {
      const { data } = await base44.functions.invoke('exportProject', {});
      
      if (!data.success) {
        throw new Error(data.error);
      }

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glyphlock-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Also create a human-readable version with all code files
      let readableExport = `# GLYPHLOCK CODE EXPORT\n`;
      readableExport += `# Exported: ${data.export.exportedAt}\n`;
      readableExport += `# Total Files: ${data.export.modules.length}\n\n`;
      readableExport += data.export.readme + '\n\n';
      readableExport += `${'='.repeat(80)}\n\n`;

      for (const mod of data.export.modules) {
        readableExport += `## FILE: ${mod.path}\n`;
        readableExport += `## Type: ${mod.type} | Version: ${mod.version}\n`;
        readableExport += `${'─'.repeat(60)}\n\n`;
        readableExport += mod.code + '\n\n';
        readableExport += `${'='.repeat(80)}\n\n`;
      }

      const textBlob = new Blob([readableExport], { type: 'text/plain' });
      const textUrl = URL.createObjectURL(textBlob);
      const textLink = document.createElement('a');
      textLink.href = textUrl;
      textLink.download = `glyphlock-code-${Date.now()}.txt`;
      textLink.click();
      URL.revokeObjectURL(textUrl);

      toast.success(`Exported ${data.stats.totalModules} files! Check downloads.`);
    } catch (error) {
      toast.error('Export failed: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      generated: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      approved: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      applied: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      rolled_back: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    };
    return colors[status] || colors.planned;
  };

  const getRiskColor = (risk) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[risk] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Deploy Center</h2>
            <p className="text-sm text-blue-300">Manage agent-generated changes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportAll} size="sm" className="bg-green-600 hover:bg-green-700">
            <Download className="w-4 h-4 mr-2" />
            Export All Code
          </Button>
          <Button onClick={loadChangeSets} size="sm" variant="outline" className="border-blue-500/30">
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Change Sets List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
        <Card className="bg-white/5 border-blue-500/20 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-white text-sm">Change Sets ({changeSets.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {changeSets.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No change sets yet</p>
                    <p className="text-xs mt-1">Use Agent Brain to create changes</p>
                  </div>
                ) : (
                  changeSets.map((cs) => (
                    <div
                      key={cs.id}
                      onClick={() => setSelectedChangeSet(cs)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedChangeSet?.id === cs.id
                          ? 'bg-blue-500/20 border-blue-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(cs.status)}>
                          {cs.status}
                        </Badge>
                        <Badge className={`${getRiskColor(cs.riskLevel)} bg-transparent border`}>
                          {cs.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-white font-medium mb-1">{cs.summary}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{cs.userRequest}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(cs.created_date).toLocaleDateString()}
                        <span className="ml-auto">{cs.mode}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card className="bg-white/5 border-blue-500/20 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-blue-500/20">
            <CardTitle className="text-white text-sm">
              {selectedChangeSet ? 'Change Details' : 'Select a Change Set'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
            {selectedChangeSet ? (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {/* Summary */}
                    <div>
                      <h3 className="text-xs text-slate-400 uppercase mb-1">Summary</h3>
                      <p className="text-sm text-white">{selectedChangeSet.summary}</p>
                    </div>

                    {/* User Request */}
                    <div>
                      <h3 className="text-xs text-slate-400 uppercase mb-1">Original Request</h3>
                      <p className="text-sm text-slate-300 bg-black/30 rounded p-2">{selectedChangeSet.userRequest}</p>
                    </div>

                    {/* Execution Plan */}
                    {selectedChangeSet.executionPlan && selectedChangeSet.executionPlan.length > 0 && (
                      <div>
                        <h3 className="text-xs text-slate-400 uppercase mb-2">Execution Plan</h3>
                        <div className="space-y-2">
                          {selectedChangeSet.executionPlan.map((step) => (
                            <div key={step.step} className="flex items-start gap-2 p-2 rounded bg-indigo-500/10 border border-indigo-500/20">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs text-white">
                                {step.step}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-white font-medium">{step.target}</p>
                                <p className="text-xs text-slate-400">{step.description}</p>
                              </div>
                              {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Generated Changes */}
                    {selectedChangeSet.changes && selectedChangeSet.changes.length > 0 && (
                      <div>
                        <h3 className="text-xs text-slate-400 uppercase mb-2">Generated Files ({selectedChangeSet.changes.length})</h3>
                        <div className="space-y-2">
                          {selectedChangeSet.changes.map((change, idx) => (
                            <div key={idx} className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white font-mono">{change.path}</span>
                                <Badge className="text-xs">
                                  {change.action}
                                </Badge>
                              </div>
                              {change.error && (
                                <p className="text-xs text-red-400">{change.error}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Apply Log */}
                    {selectedChangeSet.applyLog && selectedChangeSet.applyLog.length > 0 && (
                      <div>
                        <h3 className="text-xs text-slate-400 uppercase mb-2">Apply Log</h3>
                        <div className="space-y-1">
                          {selectedChangeSet.applyLog.map((log, idx) => (
                            <div key={idx} className="text-xs text-slate-400 font-mono bg-black/30 rounded p-2">
                              <span className={log.result === 'failed' ? 'text-red-400' : 'text-green-400'}>
                                [{log.result}]
                              </span> {log.action} {log.path}
                              {log.error && <span className="text-red-400 block ml-4">└─ {log.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Created</p>
                        <p className="text-white">{new Date(selectedChangeSet.created_date).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Mode</p>
                        <p className="text-white">{selectedChangeSet.mode}</p>
                      </div>
                      {selectedChangeSet.model && (
                        <div className="col-span-2">
                          <p className="text-slate-500">AI Model</p>
                          <p className="text-white">{selectedChangeSet.model}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="border-t border-blue-500/20 p-3 space-y-2">
                  {selectedChangeSet.status === 'planned' && (
                    <Button
                      onClick={() => handleGenerate(selectedChangeSet.id)}
                      disabled={isGenerating}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Code className="w-4 h-4 mr-2" />}
                      Generate Code
                    </Button>
                  )}

                  {selectedChangeSet.status === 'generated' && (
                    <Button
                      onClick={() => handleApply(selectedChangeSet.id)}
                      disabled={isApplying}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isApplying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      Apply Changes
                    </Button>
                  )}

                  {(selectedChangeSet.status === 'applied' || selectedChangeSet.status === 'approved') && selectedChangeSet.rollbackAvailable && (
                    <Button
                      onClick={() => handleRollback(selectedChangeSet.id)}
                      disabled={isRollingBack}
                      variant="outline"
                      className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      {isRollingBack ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                      Rollback
                    </Button>
                  )}

                  <Button
                    onClick={() => handleDelete(selectedChangeSet.id)}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-400 hover:bg-slate-800"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center flex-1 text-slate-400">
                <div className="text-center">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Select a change set to view details</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patch Bundle Modal */}
      {patchBundle && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-slate-900 border-blue-500/30 max-h-[90vh] flex flex-col">
            <CardHeader className="border-b border-blue-500/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" />
                  Patch Bundle Ready
                </CardTitle>
                <Button onClick={() => setPatchBundle(null)} variant="ghost" size="sm">
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col flex-1 overflow-hidden">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-300 font-semibold mb-1">⚠️ Manual Deployment Required</p>
                <p className="text-xs text-yellow-200">
                  Base44 backend functions cannot directly write project files. Copy this patch bundle and paste it in the main Base44 AI chat, then say "apply these changes".
                </p>
              </div>
              
              <ScrollArea className="flex-1 border border-slate-700 rounded-lg">
                <pre className="text-xs text-green-400 font-mono p-4 whitespace-pre-wrap">
                  {patchBundle}
                </pre>
              </ScrollArea>

              <div className="flex gap-2 mt-4">
                <Button onClick={copyPatchBundle} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Patch Bundle
                </Button>
                <Button onClick={() => {
                  const blob = new Blob([patchBundle], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `patch-bundle-${Date.now()}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success('Downloaded patch bundle');
                }} variant="outline" className="border-green-500/30">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}