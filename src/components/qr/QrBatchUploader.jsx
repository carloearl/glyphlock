import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWriteGateway';

export default function QrBatchUploader() {
  const [csvData, setCsvData] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            payloadValue: { type: 'string' },
            payloadType: { type: 'string' }
          },
          required: ['payloadValue']
        }
      });

      if (extracted.status === 'success' && extracted.output) {
        const data = Array.isArray(extracted.output) ? extracted.output : [extracted.output];
        
        const limitedData = data.slice(0, 100);
        setCsvData(limitedData);
        toast.success(`Loaded ${limitedData.length} rows from CSV`);
      } else {
        toast.error('Failed to extract CSV data');
      }
    } catch (error) {
      toast.error('CSV upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateAll = async () => {
    if (csvData.length === 0) {
      toast.error('No data to process');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    const records = csvData.map((row, index) => ({
      code_id: `qr_bulk_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 9)}`,
      payload: row.payloadValue,
      type: row.payloadType || 'url',
      size: 512,
      status: 'safe',
      image_format: 'png',
      error_correction: 'H',
      foreground_color: '#000000',
      background_color: '#ffffff',
      has_logo: false,
    }));

    try {
      const created = await glyphlockWrite('qr_record_generation', {
        records,
        intent: 'bulk_qr_generation_history',
      });
      setProgress(100);
      const newDrafts = csvData.map((row, index) => ({
        title: row.title || `QR ${index + 1}`,
        payloadValue: row.payloadValue,
        payloadType: row.payloadType || 'url',
        code_id: created[index]?.history?.code_id || records[index].code_id,
        generationStatus: 'success',
      }));
      setDrafts(newDrafts);
      toast.success(`Batch generation complete: ${newDrafts.length}/${newDrafts.length} successful`);
    } catch (error) {
      setDrafts(csvData.map((row, index) => ({
        title: row.title || `QR ${index + 1}`,
        payloadValue: row.payloadValue,
        payloadType: row.payloadType || 'url',
        generationStatus: 'error',
        error: error?.message || 'Governed batch recording failed',
      })));
      toast.error(error?.message || 'Batch generation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <Alert className="bg-blue-500/10 border-blue-500/30">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-white">
          <strong>Bulk Generation:</strong> Upload a CSV with columns: <code className="text-cyan-400">title, payloadValue, payloadType</code> (payloadType defaults to 'url' if not specified)
        </AlertDescription>
      </Alert>

      <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
        <CardHeader className="border-b border-gray-800">
          <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
            <FileSpreadsheet className="w-5 h-5 lg:w-6 lg:h-6" />
            Bulk QR Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <label htmlFor="csvUpload" className="text-sm lg:text-base text-gray-300 font-medium">
              Upload CSV (max 100 rows)
            </label>
            <Input
              id="csvUpload"
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              disabled={isProcessing}
              className="min-h-[48px] text-base bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs lg:text-sm text-gray-500">
              CSV should have columns: <span className="font-mono text-cyan-400">title, payloadValue, payloadType</span> (optional)
            </p>
          </div>

          {csvData.length > 0 && (
            <>
              <div className="bg-cyan-500/10 border border-cyan-500/50 rounded-lg p-4 lg:p-6">
                <p className="text-sm lg:text-base text-cyan-400 font-semibold">
                  ✓ Loaded {csvData.length} rows from CSV
                </p>
              </div>

              <Button
                onClick={handleGenerateAll}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-h-[52px] text-base font-semibold shadow-lg shadow-purple-500/30"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating {Math.round(progress)}%
                  </>
                ) : (
                  'Generate All QR Codes'
                )}
              </Button>

              {isProcessing && (
                <Progress value={progress} className="h-2" />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drafts List */}
      {drafts.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800 shadow-xl">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="text-white text-lg lg:text-xl">Generated QR Codes ({drafts.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {drafts.map((draft, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors gap-3 sm:gap-0"
                >
                  <div className="flex-1 w-full sm:w-auto">
                    <p className="text-sm lg:text-base font-semibold text-white mb-1">{draft.title}</p>
                    <p className="text-xs lg:text-sm text-gray-400 truncate">{draft.payloadValue}</p>
                    {draft.code_id && (
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {draft.code_id}</p>
                    )}
                  </div>
                  <div className="w-full sm:w-auto">
                    {draft.generationStatus === 'success' && (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    )}
                    {draft.generationStatus === 'error' && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Error: {draft.error}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}