import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadProtectedEvidence } from '@/lib/nups/protectedEvidence';

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
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const fileInputRef = useRef();
  const videoRef = useRef();
  const canvasRef = useRef();

  const handleScanBarcode = () => {
    if (!contractBarcode.trim()) {
      alert('Please enter contract barcode');
      return;
    }
    setBarcodeScanned(true);
  };

  // START LIVE WEBCAM STREAM
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Camera access denied. Please enable camera permissions.');
    }
  };

  // Assign stream to video element after it renders
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraActive]);

  // STOP WEBCAM STREAM
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  // SNAPSHOT FROM LIVE VIDEO TO CANVAS → BLOB → UPLOAD
  const captureSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    setUploading(true);
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
      const file = new File([blob], `verification_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const protectedFile = await uploadProtectedEvidence({
        file,
        venueId: venue_id,
        artifactType: 'verification_media',
        classification: 'PRIVATE_CONTRACT',
        subjectEntity: 'VerificationMedia',
        subjectId: transaction_id,
        purpose: verificationType,
        signedUrlTtl: 0,
      });

      const result = await base44.functions.invoke('captureVerificationMedia', {
        transaction_id,
        contract_barcode: contractBarcode,
        venue_id,
        media_type: 'photo',
        verification_type: verificationType,
        evidence_id: protectedFile.evidence_id,
        geolocation: await getCurrentLocation()
      });

      if (result.data.success) {
        setCapturedMedia(prev => [...prev, result.data.media]);
        alert('✅ Photo captured and uploaded');
        stopCamera();
      }
    } catch (err) {
      console.error('Snapshot upload error:', err);
      alert('Failed to upload photo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // FILE INPUT FALLBACK (for devices without camera API support)
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const protectedFile = await uploadProtectedEvidence({
        file,
        venueId: venue_id,
        artifactType: 'verification_media',
        classification: 'PRIVATE_CONTRACT',
        subjectEntity: 'VerificationMedia',
        subjectId: transaction_id,
        purpose: verificationType,
        signedUrlTtl: 0,
      });

      const result = await base44.functions.invoke('captureVerificationMedia', {
        transaction_id,
        contract_barcode: contractBarcode,
        venue_id,
        media_type: file.type.startsWith('video') ? 'video' : 'photo',
        verification_type: verificationType,
        evidence_id: protectedFile.evidence_id,
        geolocation: await getCurrentLocation()
      });

      if (result.data.success) {
        setCapturedMedia(prev => [...prev, result.data.media]);
        alert('✅ Media uploaded successfully');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => stopCamera(); // Cleanup on unmount
  }, []);

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

            {/* LIVE WEBCAM PREVIEW */}
            {cameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={captureSnapshot}
                    disabled={uploading}
                    className="flex-1 btn-glow-blue h-16"
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Capture Photo
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  onClick={startCamera}
                  className="w-full btn-glow-blue h-20"
                >
                  <Camera className="w-6 h-6 mr-2" />
                  Open Live Camera
                </Button>

                {/* FALLBACK FILE INPUT */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Or Upload from Gallery
                </Button>
              </>
            )}

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