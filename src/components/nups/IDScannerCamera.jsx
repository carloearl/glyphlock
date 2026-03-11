import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { isDemoMode, DemoDataGenerator } from './pos/DemoModeController';

/**
 * Camera-based ID scanner with OCR and manual entry fallback.
 * Autofills contract forms with extracted data.
 */
export default function IDScannerCamera({ venue_id, onDataExtracted }) {
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    id_type: 'drivers_license',
    id_number: '',
    id_state: '',
    id_expiration: '',
    address_line1: '',
    city: '',
    state: '',
    zip_code: ''
  });

  const fileInputRef = useRef();

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // In demo mode, generate mock data
      if (isDemoMode()) {
        setTimeout(() => {
          const mockData = {
            full_name: DemoDataGenerator.customerName(),
            date_of_birth: '1990-01-01',
            id_type: 'drivers_license',
            id_number: DemoDataGenerator.idNumber(),
            id_state: 'NV',
            id_expiration: '2028-12-31',
            address_line1: '123 Demo Street',
            city: 'Las Vegas',
            state: 'NV',
            zip_code: '89101'
          };
          setFormData(mockData);
          onDataExtracted?.(mockData);
          setUploading(false);
        }, 1500);
        return;
      }

      // Real mode: upload and extract via AI
      const result = await base44.functions.invoke('scanCustomerID', {
        venue_id,
        scan_data: formData, // Will be populated by OCR
        id_scan_front_file: file
      });

      if (result.data.success) {
        const extracted = result.data.autofill_data;
        setFormData(extracted);
        onDataExtracted?.(extracted);
      }
    } catch (err) {
      console.error('ID scan error:', err);
      alert('Failed to scan ID: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!formData.full_name || !formData.id_number) {
      alert('Please enter at least name and ID number');
      return;
    }
    onDataExtracted?.(formData);
  };

  return (
    <Card className="glyph-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          Customer ID Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!manualEntry ? (
          <>
            {/* Camera Upload */}
            <div className="text-center space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full btn-glow-blue h-24 text-lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Scanning ID...
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 mr-2" />
                    Scan Driver License / ID
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setManualEntry(true)}
                className="w-full"
              >
                Enter Manually
              </Button>

              {isDemoMode() && (
                <div className="text-xs text-yellow-400 p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
                  ⚠️ DEMO MODE: Will generate mock ID data
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Manual Entry Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="John Doe"
                    className="input-glow-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input-glow-blue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number</label>
                  <Input
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    placeholder="D12345678"
                    className="input-glow-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID State</label>
                  <Input
                    value={formData.id_state}
                    onChange={(e) => setFormData({ ...formData, id_state: e.target.value })}
                    placeholder="NV"
                    maxLength={2}
                    className="input-glow-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <Input
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="Street address"
                  className="input-glow-blue"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input-glow-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <Input
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    maxLength={2}
                    className="input-glow-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP</label>
                  <Input
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    maxLength={10}
                    className="input-glow-blue"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setManualEntry(false)}
                  className="flex-1"
                >
                  Back to Scan
                </Button>
                <Button
                  onClick={handleManualSubmit}
                  className="flex-1 btn-glow-blue"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Use This Data
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Extracted Data Preview */}
        {formData.full_name && !manualEntry && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-green-400">ID Data Extracted</span>
            </div>
            <div className="text-sm space-y-1">
              <div><strong>Name:</strong> {formData.full_name}</div>
              <div><strong>DOB:</strong> {formData.date_of_birth}</div>
              <div><strong>ID #:</strong> {formData.id_number}</div>
              <div><strong>State:</strong> {formData.id_state}</div>
              <div><strong>Address:</strong> {formData.address_line1}, {formData.city}, {formData.state} {formData.zip_code}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}