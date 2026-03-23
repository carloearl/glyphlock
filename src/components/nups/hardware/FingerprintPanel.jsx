import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Loader2, CheckCircle2, Camera } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";

export default function FingerprintPanel({ onCapture, label = "Thumbprint" }) {
  const [scanning, setScanning] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleScan = async () => {
    setScanning(true);
    
    // Simulate Adesso fingerprint scan
    setTimeout(async () => {
      setScanning(false);
      
      // In production, this would capture from USB device
      // For now, simulate with a placeholder
      const mockPrint = {
        timestamp: new Date().toISOString(),
        quality: 95,
        device: "Adesso AFPR-200"
      };
      
      toast.success("Fingerprint captured");
      setCaptured(mockPrint);
      
      if (onCapture) {
        onCapture(mockPrint);
      }
    }, 2500);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCaptured({ 
        url: file_url, 
        timestamp: new Date().toISOString(),
        quality: 100,
        method: "upload"
      });
      toast.success("Fingerprint uploaded");
      
      if (onCapture) {
        onCapture({ url: file_url });
      }
    } catch (e) {
      toast.error("Upload failed");
    }
    setUploading(false);
  };

  return (
    <Card className="bg-gray-900/60 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm text-purple-400 flex items-center gap-2">
          <Fingerprint className="w-4 h-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {captured ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Captured
              </div>
              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                {captured.quality}% Quality
              </Badge>
            </div>
            {captured.url && (
              <img 
                src={captured.url} 
                alt="Fingerprint" 
                className="w-full h-24 object-cover rounded border border-purple-500/50"
              />
            )}
            <div className="text-[10px] text-gray-500 font-mono">
              {new Date(captured.timestamp).toLocaleString()}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setCaptured(null)}
              className="w-full text-xs border-gray-700 text-gray-400"
            >
              Rescan
            </Button>
          </div>
        ) : (
          <>
            <Button 
              onClick={handleScan}
              disabled={scanning}
              className="w-full h-16 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 font-bold"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Scan {label}
                </>
              )}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-gray-900 px-2 text-gray-500">or</span>
              </div>
            </div>

            <label className="block">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <Button 
                variant="outline"
                size="sm"
                disabled={uploading}
                className="w-full border-gray-700 text-gray-400"
                onClick={(e) => e.currentTarget.previousElementSibling.click()}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Upload Image
              </Button>
            </label>
          </>
        )}
      </CardContent>
    </Card>
  );
}