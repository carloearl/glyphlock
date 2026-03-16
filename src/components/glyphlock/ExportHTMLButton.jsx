import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExportHTMLButton({ assetId, mapId }) {
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const handleExport = async () => {
    if (!assetId || !mapId) {
      setStatus('error');
      setMessage('Asset ID and Map ID required');
      return;
    }

    setExporting(true);
    setStatus('exporting');
    setMessage('Generating offline HTML...');

    try {
      const response = await base44.functions.invoke('exportInteractiveImageHTML', {
        asset_id: assetId,
        map_id: mapId
      });

      // The response should be the HTML content
      const htmlContent = response.data;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `interactive-${assetId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus('success');
      setMessage('HTML exported successfully - offline compatible');
    } catch (error) {
      setStatus('error');
      setMessage(`Export failed: ${error.message}`);
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleExport}
        disabled={exporting || !assetId || !mapId}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
        size="lg"
      >
        {exporting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Export as HTML
          </>
        )}
      </Button>

      {status && (
        <div className={`flex items-center gap-2 p-3 rounded text-sm ${
          status === 'success' ? 'bg-green-900/30 border border-green-500/50 text-green-300' :
          status === 'error' ? 'bg-red-900/30 border border-red-500/50 text-red-300' :
          'bg-blue-900/30 border border-blue-500/50 text-blue-300'
        }`}>
          {status === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
          {status === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1 bg-gray-900/30 p-3 rounded border border-gray-700">
        <p>✓ Offline capable (image embedded as base64)</p>
        <p>✓ No external dependencies</p>
        <p>✓ Normalized coordinates rendered correctly</p>
        <p>✓ Click handlers included for all payloads</p>
        <p>✓ Responsive and mobile-friendly</p>
      </div>
    </div>
  );
}