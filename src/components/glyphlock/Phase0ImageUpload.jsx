import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function Phase0ImageUpload({ onAssetCreated }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setMessage('Computing fingerprint and checking for duplicates...');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await base44.functions.invoke('uploadInteractiveImage', {
        file: file
      });

      if (response.data.duplicate) {
        setStatus('duplicate');
        setMessage(`Duplicate detected. Using existing asset: ${response.data.asset_id}`);
      } else {
        setStatus('success');
        setMessage(`Asset created: ${response.data.asset_id}`);
      }

      onAssetCreated?.(response.data);
    } catch (error) {
      setStatus('error');
      setMessage(`Upload failed: ${error.message}`);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gray-900/50 border border-cyan-500/30 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Phase 0: Asset Registry</h3>

      <div className="border-2 border-dashed border-cyan-500/50 rounded-lg p-8 text-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          {uploading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-cyan-400">Processing...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-cyan-400" />
              <span className="text-white font-medium">Upload Image</span>
              <span className="text-xs text-gray-400">Fingerprint will be computed on upload</span>
            </div>
          )}
        </label>
      </div>

      {status && (
        <div className={`flex items-start gap-3 p-3 rounded ${
          status === 'success' ? 'bg-green-900/30 border border-green-500/50' :
          status === 'duplicate' ? 'bg-blue-900/30 border border-blue-500/50' :
          status === 'error' ? 'bg-red-900/30 border border-red-500/50' :
          'bg-yellow-900/30 border border-yellow-500/50'
        }`}>
          {status === 'success' && <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
          {status === 'duplicate' && <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />}
          {status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
          <span className="text-sm text-gray-200">{message}</span>
        </div>
      )}

      <div className="text-xs text-gray-400 space-y-1">
        <p>✓ Fingerprint computed (SHA-256)</p>
        <p>✓ Duplicate detection active</p>
        <p>✓ Fingerprint never exposed in URLs</p>
      </div>
    </div>
  );
}