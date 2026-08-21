import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, User, CreditCard, Fingerprint, Shield, Hash, Calendar, 
  FileText, Globe, Monitor, CheckCircle2, Camera 
} from "lucide-react";

export default function ContractDetailModal({ contract, onClose }) {
  if (!contract) return null;

  const statusColor = {
    signed: "bg-green-500/20 text-green-400 border-green-500/40",
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    expired: "bg-red-500/20 text-red-400 border-red-500/40",
    revoked: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  };

  const meta = contract.metadata || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-gray-900 border border-purple-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <h2 className="font-bold text-lg">Contract Details</h2>
            <Badge className={statusColor[contract.status] || statusColor.pending}>
              {contract.status}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-5 space-y-5">

          {/* Protected guest media is not rendered directly until private retrieval is verified. */}
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden border-2 border-purple-500/30">
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-10 h-10 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{contract.guest_name}</h3>
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-purple-400" />
                  <span className="font-mono">{contract.serial_number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {contract.signed_at ? new Date(contract.signed_at).toLocaleString() : 'Not signed'}
                </div>
              </div>
            </div>
          </div>

          {/* Identity Details */}
          <Section title="Identity & Payment" icon={CreditCard}>
            <Row label="Card" value={`${contract.card_type || '—'} •••• ${contract.card_last_four || '—'}`} />
            <Row label="ID Type" value={contract.government_id_type || '—'} />
            <Row label="ID State" value={contract.government_id_state || '—'} />
          </Section>

          {/* Biometrics */}
          <Section title="Biometric Verification" icon={Fingerprint}>
            <Row label="Thumbprint" value={contract.thumbprint_hash ? "✓ Captured & Hashed" : "✗ Missing"} 
              valueClass={contract.thumbprint_hash ? "text-green-400" : "text-red-400"} />
            <Row label="Guest Photo" value={contract.guest_photo_url ? "✓ On file" : "✗ Not captured"}
              valueClass={contract.guest_photo_url ? "text-green-400" : "text-red-400"} />
            <Row label="ID Front" value={contract.id_photo_url ? "✓ Archived" : "✗ Missing"}
              valueClass={contract.id_photo_url ? "text-green-400" : "text-red-400"} />
            <Row label="ID Back" value={contract.id_photo_back_url ? "✓ Archived" : "— Not provided"}
              valueClass={contract.id_photo_back_url ? "text-green-400" : "text-gray-500"} />
          </Section>

          {/* Media presence is visible; raw URLs are intentionally withheld pending private retrieval. */}
          {(contract.id_photo_url || contract.id_photo_back_url || contract.thumbprint_url || contract.guest_photo_url) && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Protected guest/ID/biometric evidence is on file. Direct rendering is disabled until authorized private retrieval is verified.
            </div>
          )}

          {/* Signatures */}
          <Section title="Signatures" icon={Shield}>
            <Row label="Guest Signature" value={contract.signature_hash ? "✓ Signed & Hashed" : "✗ Not signed"}
              valueClass={contract.signature_hash ? "text-green-400" : "text-red-400"} />
            <Row label="Host" value={meta.host_name ? `✓ ${meta.host_name}` : "✗ Pending"}
              valueClass={meta.host_name ? "text-cyan-400" : "text-red-400"} />
            <Row label="Manager" value={meta.manager_name ? `✓ ${meta.manager_name}` : "✗ Pending"}
              valueClass={meta.manager_name ? "text-amber-400" : "text-red-400"} />
            <Row label="Total Signatures" value={`${meta.signatures_count || 0} of 3`} />
          </Section>

          {/* Hashes */}
          <Section title="Cryptographic Audit Trail" icon={Hash}>
            <HashRow label="Signature Hash" hash={contract.signature_hash} />
            <HashRow label="Thumbprint Hash" hash={contract.thumbprint_hash} />
            <HashRow label="ID Hash" hash={contract.id_hash} />
            <HashRow label="Contract Hash" hash={contract.contract_hash} />
          </Section>

          {/* Device / IP */}
          <Section title="Device & Network" icon={Monitor}>
            <Row label="IP Address" value={contract.ip_address || '—'} />
            <Row label="User Agent" value={contract.user_agent || '—'} valueClass="text-gray-500 text-[10px] break-all" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border border-gray-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-1">
        <Icon className="w-4 h-4 text-purple-400" />
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, valueClass = "text-white" }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}:</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function HashRow({ label, hash }) {
  return (
    <div className="text-xs">
      <span className="text-gray-500">{label}:</span>
      <div className="font-mono text-[10px] text-purple-400/70 break-all mt-0.5">
        {hash || '—'}
      </div>
    </div>
  );
}