import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, CheckCircle2, Loader2 } from "lucide-react";

export default function DreamPalaceStaffSign({
  managerName, hostessName, managerSig, setManagerSig,
  hostessSig, setHostessSig, customerName, signature,
  canFinalize, loading, onBack, onFinalize
}) {
  return (
    <Card className="bg-gray-900/60 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Manager & Hostess Signatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-xs text-purple-300">
          <p className="font-bold">⚠️ STAFF ONLY — Hand device to each staff member to sign.</p>
        </div>

        {/* Customer sig confirmation */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-400">Customer Signature</div>
            <div className="text-sm font-bold" style={{ fontFamily: 'cursive, serif' }}>{signature}</div>
            <div className="text-[10px] text-gray-500">{customerName}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>

        {/* Manager */}
        <div className="border border-amber-500/30 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-amber-400">Manager Signature</h4>
          <div>
            <Label>Manager Name: <span className="text-white font-bold">{managerName || '(not set)'}</span></Label>
          </div>
          <div>
            <Label>Manager Signature — Type name *</Label>
            <Input value={managerSig} onChange={e => setManagerSig(e.target.value)}
              placeholder={managerName || "Type name exactly"}
              className="text-lg text-center font-bold" style={{ fontFamily: 'cursive, serif' }} />
            {managerSig.trim() && managerName.trim() && managerSig.toLowerCase() !== managerName.toLowerCase() && (
              <p className="text-xs text-red-400 mt-1">Must match: "{managerName}"</p>
            )}
          </div>
          {managerSig.trim() && managerName.trim() && managerSig.toLowerCase() === managerName.toLowerCase() && (
            <div className="flex items-center gap-2 text-green-400 text-xs"><CheckCircle2 className="w-3 h-3" /> Verified</div>
          )}
        </div>

        {/* Hostess */}
        <div className="border border-pink-500/30 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-bold text-pink-400">Hostess Signature</h4>
          <div>
            <Label>Hostess Name: <span className="text-white font-bold">{hostessName || '(not set)'}</span></Label>
          </div>
          <div>
            <Label>Hostess Signature — Type name *</Label>
            <Input value={hostessSig} onChange={e => setHostessSig(e.target.value)}
              placeholder={hostessName || "Type name exactly"}
              className="text-lg text-center font-bold" style={{ fontFamily: 'cursive, serif' }} />
            {hostessSig.trim() && hostessName.trim() && hostessSig.toLowerCase() !== hostessName.toLowerCase() && (
              <p className="text-xs text-red-400 mt-1">Must match: "{hostessName}"</p>
            )}
          </div>
          {hostessSig.trim() && hostessName.trim() && hostessSig.toLowerCase() === hostessName.toLowerCase() && (
            <div className="flex items-center gap-2 text-green-400 text-xs"><CheckCircle2 className="w-3 h-3" /> Verified</div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1 border-gray-700">← Back</Button>
          <Button onClick={onFinalize} disabled={loading || !canFinalize}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold h-12">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Finalize All Signatures"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}