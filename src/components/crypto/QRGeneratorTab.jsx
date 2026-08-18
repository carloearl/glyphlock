/**
 * DEPRECATED COMPONENT - DO NOT USE
 * This component is legacy and has been replaced by the unified QrStudio.jsx
 * Located at: components/qr/QrStudio.jsx
 * Route: /SecureQRStudio
 * 
 * Kept for reference only - will be removed in future cleanup phase
 */

import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, Shield, Info, Upload, Image as ImageIcon } from "lucide-react";
import SecurityStatus from "@/components/qr/SecurityStatus";
import SteganographicQR from "@/components/qr/SteganographicQR";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRTypeSelector from "@/components/crypto/QRTypeSelector";
import QRTypeForm from "@/components/crypto/QRTypeForm";
import ColorPaletteSelector from "@/components/crypto/ColorPaletteSelector";
import { generateSHA256, performStaticURLChecks } from "@/components/utils/securityUtils";

export default function QRGeneratorTab() {
  return (
    <div className="p-12 text-center">
      <h2 className="text-2xl font-bold text-red-400 mb-4">DEPRECATED COMPONENT</h2>
      <p className="text-gray-400">This component has been replaced by the unified QR Studio.</p>
      <p className="text-gray-400">Please use /SecureQRStudio instead.</p>
    </div>
  );
}