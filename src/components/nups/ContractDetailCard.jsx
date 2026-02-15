import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, CreditCard, Fingerprint, FileText, Shield, Calendar, Globe, Monitor } from "lucide-react";

export default function ContractDetailCard({ contract }) {
  const c = contract;

  const Row = ({ label, value, color }) => (
    <div className="flex justify-between text-sm py-1.5 border-b border-gray-800/50">
      <span className="text-gray-400">{label}</span>
      <span className={color || "text-white font-medium"}>{value || "—"}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Guest Photo + Name Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-purple-500/50 bg-gray-800 flex-shrink-0">
          {c.guest_photo_url ? (
            <img src={c.guest_photo_url} alt={c.guest_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold">{c.guest_name}</h2>
          <Badge className="mt-1 bg-purple-500/20 text-purple-400 border-purple-500/40 font-mono text-xs">
            {c.serial_number}
          </Badge>
          <div className="text-xs text-gray-500 mt-1">
            Signed: {c.signed_at ? new Date(c.signed_at).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-cyan-400 mb-2">
          <CreditCard className="w-4 h-4" /> Identity & Payment
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <Row label="Card" value={c.card_type ? `${c.card_type} •••• ${c.card_last_four}` : null} />
          <Row label="Government ID" value={c.government_id_type} />
          <Row label="ID State" value={c.government_id_state} />
        </div>
      </div>

      {/* Biometrics */}
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-purple-400 mb-2">
          <Fingerprint className="w-4 h-4" /> Biometric Verification
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
          <Row label="Thumbprint Hash" value={c.thumbprint_hash ? `${c.thumbprint_hash.slice(0, 16)}...` : null} color="text-green-400 font-mono text-xs" />
          <Row label="Signature Hash" value={c.signature_hash ? `${c.signature_hash.slice(0, 16)}...` : null} color="text-green-400 font-mono text-xs" />
          <Row label="ID Hash" value={c.id_hash ? `${c.id_hash.slice(0, 16)}...` : null} color="text-green-400 font-mono text-xs" />
          <Row label="Contract Hash" value={c.contract_hash ? `${c.contract_hash.slice(0, 16)}...` : null} color="text-amber-400 font-mono text-xs" />
        </div>
      </div>

      {/* Photos */}
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-green-400 mb-2">
          <FileText className="w-4 h-4" /> Archived Photos
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {c.guest_photo_url && (
            <div className="space-y-1">
              <img src={c.guest_photo_url} alt="Guest" className="w-full rounded-lg border border-green-500/30" />
              <p className="text-[10px] text-gray-500 text-center">Guest Face</p>
            </div>
          )}
          {c.id_photo_url && (
            <div className="space-y-1">
              <img src={c.id_photo_url} alt="ID Front" className="w-full rounded-lg border border-cyan-500/30" />
              <p className="text-[10px] text-gray-500 text-center">ID Front</p>
            </div>
          )}
          {c.id_photo_back_url && (
            <div className="space-y-1">
              <img src={c.id_photo_back_url} alt="ID Back" className="w-full rounded-lg border border-gray-600" />
              <p className="text-[10px] text-gray-500 text-center">ID Back</p>
            </div>
          )}
          {c.thumbprint_url && (
            <div className="space-y-1">
              <img src={c.thumbprint_url} alt="Thumbprint" className="w-full rounded-lg border border-purple-500/30" />
              <p className="text-[10px] text-gray-500 text-center">Thumbprint</p>
            </div>
          )}
        </div>
      </div>

      {/* Signatures (from metadata) */}
      {c.metadata && (
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2">
            <Shield className="w-4 h-4" /> Signatures (3 of 3)
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <Row label="Guest Signature" value="✓ Signed" color="text-green-400" />
            <Row label="Host" value={c.metadata.host_name || "—"} />
            <Row label="Host Signature Hash" value={c.metadata.host_signature_hash ? `${c.metadata.host_signature_hash.slice(0, 12)}...` : null} color="text-cyan-400 font-mono text-xs" />
            <Row label="Manager" value={c.metadata.manager_name || "—"} />
            <Row label="Manager Signature Hash" value={c.metadata.manager_signature_hash ? `${c.metadata.manager_signature_hash.slice(0, 12)}...` : null} color="text-amber-400 font-mono text-xs" />
          </div>
        </div>
      )}

      {/* Hardcopy Rescan */}
      {c.signed_hardcopy_photo_url && (
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2">
            <FileText className="w-4 h-4" /> Physical Signed Copy
          </div>
          <div className="space-y-2">
            <img src={c.signed_hardcopy_photo_url} alt="Signed Hardcopy" className="w-full rounded-lg border border-amber-500/30" />
            <div className="bg-gray-900/50 rounded-lg p-3">
              <Row label="Barcode/Serial" value={c.hardcopy_barcode_scan} color="text-purple-400 font-mono text-xs" />
              <Row label="Logged At" value={c.hardcopy_logged_at ? new Date(c.hardcopy_logged_at).toLocaleString() : null} />
              <Row label="Logged By" value={c.hardcopy_logged_by} />
            </div>
          </div>
        </div>
      )}

      {/* Audit */}
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-2">
          <Monitor className="w-4 h-4" /> Audit Trail
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <Row label="IP Address" value={c.ip_address} color="text-gray-300 font-mono text-xs" />
          <Row label="User Agent" value={c.user_agent ? `${c.user_agent.slice(0, 50)}...` : null} color="text-gray-500 text-xs" />
          <Row label="Issued By" value={c.issued_by} />
          <Row label="Token Used" value={c.used ? "✓ Yes" : "No"} color={c.used ? "text-green-400" : "text-red-400"} />
        </div>
      </div>
    </div>
  );
}