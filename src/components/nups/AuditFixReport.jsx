import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function AuditFixReport({ issues = [], onResolve }) {
  const [resolving, setResolving] = useState({});

  const handleResolve = async (issueId, action) => {
    setResolving(prev => ({ ...prev, [issueId]: true }));
    try {
      if (action === 'openBatch') {
        // Trigger open batch flow
        if (onResolve) onResolve({ type: 'openBatch' });
      } else if (action === 'reviewDiscrepancy') {
        // Trigger discrepancy review
        if (onResolve) onResolve({ type: 'reviewDiscrepancy' });
      }
    } catch (err) {
      console.error('Resolution failed:', err);
    } finally {
      setResolving(prev => ({ ...prev, [issueId]: false }));
    }
  };

  if (!issues || issues.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 border-green-500/30">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-400">No active audit issues. System healthy.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {issues.map(issue => (
        <Card 
          key={issue.id} 
          className={`border-l-4 ${
            issue.severity === 'critical' 
              ? 'border-l-red-500 bg-red-500/5 border-red-500/30'
              : issue.severity === 'warning'
              ? 'border-l-yellow-500 bg-yellow-500/5 border-yellow-500/30'
              : 'border-l-blue-500 bg-blue-500/5 border-blue-500/30'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {issue.severity === 'critical' ? (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-white">{issue.title}</h3>
                  <span className="text-xs px-2 py-1 rounded bg-black/30 text-gray-300 whitespace-nowrap">
                    {issue.code}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3">{issue.description}</p>
                
                {issue.details && (
                  <div className="text-xs text-gray-500 mb-3 p-2 bg-black/20 rounded font-mono">
                    {issue.details}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {issue.actions?.map(action => (
                    <Button
                      key={action.id}
                      size="sm"
                      onClick={() => handleResolve(issue.id, action.id)}
                      disabled={resolving[issue.id]}
                      className={
                        action.type === 'primary'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border-gray-600 text-gray-300 hover:bg-gray-900'
                      }
                      variant={action.type === 'primary' ? 'default' : 'outline'}
                    >
                      {resolving[issue.id] ? 'Processing...' : action.label}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}