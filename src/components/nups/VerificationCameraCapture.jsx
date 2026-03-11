import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * Contract verification media capture.
 * Scans contract barcode → opens camera → uploads media → verifies upload.
 */
export default function VerificationCameraCapture({ transaction_id, venue_id, onCaptureComplete }) {
  const [contractBarcode, setContractBarcode] = useState('');
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [verificationType, setVerificationType] = useState('customer_signing');

  const fileInputRef = useRef();

  const handleScanBarcode = () => {
    if (!contractBarcode.trim()) {
      alert('Please enter contract barcode');
      return;
    }
    setBarcodeScanned(true);
  };

  const handleCaptureMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.functions.invoke('captureVerificationMedia', {
        transaction_id,
        contract_barcode: contractBarcode,
        venue_id,
        media_type: file.type.startsWith('video') ? 'video' : 'photo',
        verification_type: verificationType,
        media_file: file,
        geolocation: await getCurrentLocation()
      });

      if (result.data.success) {
        setCapturedMedia(prev => [...prev, result.data.media]);
        alert('✅ Media captured and uploaded successfully');
      }
    } catch (err) {
      console.error('Media capture error:', err);
      alert('Failed to capture media: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = () => {
    if (capturedMedia.length === 0) {
      alert('Please capture at least one verification photo');
      return;
    }
    onCaptureComplete?.(capturedMedia);
  };

  async function getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_meters: pos.coords.accuracy
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  }

  return (
    <Card className="glyph-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          Contract Verification Capture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Scan Contract Barcode */}
        {!barcodeScanned ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">Scan Contract Barcode</label>
              <div className="flex gap-2">
                <Input
                  value={contractBarcode}
                  onChange={(e) => setContractBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScanBarcode()}
                  placeholder="Scan or enter barcode"
                  className="input-glow-blue flex-1"
                />
                <Button onClick={handleScanBarcode}>
                  Confirm
                </Button>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Scan the contract barcode before capturing verification photos
            </div>
          </div>
        ) : (
          <>
            {/* Step 2: Capture Media */}
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-500/50 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">Contract barcode scanned: {contractBarcode}</span>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Verification Type</label>
              <select
                value={verificationType}
                onChange={(e) => setVerificationType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg input-glow-blue"
              >
                <option value="customer_signing">Customer Signing Contract</option>
                <option value="customer_receiving_bills">Customer Receiving Dream Dollars</option>
                <option value="staff_witness">Staff Witness</option>
                <option value="id_verification">ID Verification</option>
                <option value="other">Other</option>
              </select>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleCaptureMedia}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full btn-glow-blue h-20"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="w-6 h-6 mr-2" />
                  Capture Verification Photo/Video
                </>
              )}
            </Button>

            {/* Captured Media List */}
            {capturedMedia.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Captured Media ({capturedMedia.length})
                </div>
                {capturedMedia.map((media, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg glyph-glass border border-white/10 flex items-center gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <div className="flex-1 text-sm">
                      <div>{media.verification_type}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(media.capture_timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleComplete}
              disabled={capturedMedia.length === 0}
              className="w-full"
              variant="outline"
            >
              Complete Verification ({capturedMedia.length} media)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}