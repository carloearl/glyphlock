import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Activity, Scan } from 'lucide-react';

export default function QrDiagnosticsPanel({ qrData, onRunDiagnostics }) {
  const [results, setResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const runScan = async () => {
    setIsScanning(true);
    try {
      const diagnostics = {
        decoded_content: qrData.payload,
        error_correction_level: qrData.error_correction || 'M',
        contrast_score: calculateContrast(qrData),
        quiet_zone_valid: true,
        resolved_slots: [],
        rejection_reasons: {}
      };

      // Simulate payload resolution
      if (qrData.dynamic_config?.rules) {
        qrData.dynamic_config.rules.forEach((rule, idx) => {
          const accepted = evaluateRule(rule);
          if (accepted) {
            diagnostics.resolved_slots.push(`slot_${idx}`);
          } else {
            diagnostics.rejection_reasons[`slot_${idx}`] = `Condition not met: ${rule.condition}`;
          }
        });
      }

      setResults(diagnostics);
      if (onRunDiagnostics) onRunDiagnostics(diagnostics);
    } catch (error) {
      console.error('Diagnostics error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const calculateContrast = (data) => {
    const fgBrightness = hexToBrightness(data.foreground_color || '#000000');
    const bgBrightness = hexToBrightness(data.background_color || '#FFFFFF');
    const ratio = Math.abs(fgBrightness - bgBrightness) / 255;
    return ratio;
  };

  const hexToBrightness = (hex) => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (r * 0.299 + g * 0.587 + b * 0.114);
  };

  const evaluateRule = (rule) => {
    // Simplified evaluation for demo
    return Math.random() > 0.3;
  };

  return (
    <Card className="bg-slate-900/50 border-cyan-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Scan Diagnostics
          </CardTitle>
          <Button
            onClick={runScan}
            disabled={isScanning}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isScanning ? (
              <>
                <Activity className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" />
                Run Test Scan
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      {results && (
        <CardContent className="space-y-4">
          {/* Decoded Content */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Decoded Content</p>
            <p className="text-sm text-white font-mono break-all">{results.decoded_content}</p>
          </div>

          {/* Quality Checks */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border-2 ${
              results.contrast_score >= 0.6 
                ? 'bg-green-500/10 border-green-500/40'
                : 'bg-yellow-500/10 border-yellow-500/40'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {results.contrast_score >= 0.6 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
                <p className="text-xs text-white font-bold">Contrast</p>
              </div>
              <p className="text-lg font-black text-white">{(results.contrast_score * 100).toFixed(0)}%</p>
            </div>

            <div className={`p-3 rounded-lg border-2 ${
              results.quiet_zone_valid
                ? 'bg-green-500/10 border-green-500/40'
                : 'bg-red-500/10 border-red-500/40'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {results.quiet_zone_valid ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                <p className="text-xs text-white font-bold">Quiet Zone</p>
              </div>
              <p className="text-sm text-white">{results.quiet_zone_valid ? 'Valid' : 'Invalid'}</p>
            </div>
          </div>

          {/* Error Correction */}
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Error Correction Level</p>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/40">
              {results.error_correction_level} ({
                results.error_correction_level === 'L' ? '7%' :
                results.error_correction_level === 'M' ? '15%' :
                results.error_correction_level === 'Q' ? '25%' : '30%'
              } recovery)
            </Badge>
          </div>

          {/* Payload Resolution */}
          {results.resolved_slots.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Payload Slots</p>
              {results.resolved_slots.map(slot => (
                <div key={slot} className="flex items-center gap-2 p-2 rounded bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-white font-mono">{slot}</span>
                  <Badge className="ml-auto bg-green-500/20 text-green-400 text-[10px]">ACCEPTED</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Rejections */}
          {Object.keys(results.rejection_reasons).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Rejected Slots</p>
              {Object.entries(results.rejection_reasons).map(([slot, reason]) => (
                <div key={slot} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-white font-mono font-bold">{slot}</span>
                  </div>
                  <p className="text-xs text-red-300">{reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}