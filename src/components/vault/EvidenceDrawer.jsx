import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Video, Image as ImageIcon, CreditCard, ExternalLink,
  ShieldCheck, ShieldAlert, Calendar
} from 'lucide-react';

export default function EvidenceDrawer({ profile, vipRooms = [], open, onClose }) {
  if (!profile) return null;

  const signedContracts = profile.contracts.filter((c) => c.is_signed || c.customer_signature);
  const scannedDocs = profile.contracts.filter((c) => c.scanned_document_url);
  const camerasInPlay = (vipRooms || []).filter(
    (r) => r.surveillance_camera && (r.guest_name || '').toLowerCase() === (profile.displayName || '').toLowerCase()
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border-purple-500/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {profile.displayName}
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300">
              ${profile.totalSpend.toFixed(2)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Risk flags */}
        {profile.flags.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-800">
            {profile.flags.map((f) => (
              <Badge key={f} className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                <ShieldAlert className="w-3 h-3 mr-1" /> {f.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        )}

        {/* Payment forensics */}
        <section className="pt-3">
          <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Forensics
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Payment methods used</div>
              <div className="flex flex-wrap gap-1">
                {profile.paymentMethods.length
                  ? profile.paymentMethods.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs border-gray-700 text-gray-300">{m}</Badge>
                    ))
                  : <span className="text-gray-500 text-xs">—</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Card last-4 digits</div>
              <div className="flex flex-wrap gap-1 font-mono">
                {profile.cardsUsed.length
                  ? profile.cardsUsed.map((c) => (
                      <Badge key={c} variant="outline" className="text-xs border-rose-500/30 text-rose-300">•••• {c}</Badge>
                    ))
                  : <span className="text-gray-500 text-xs font-sans">—</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Signed contracts */}
        <section className="pt-4 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Contracts ({profile.contracts.length})
          </h3>
          <div className="space-y-2">
            {profile.contracts.map((c, i) => (
              <div key={c.id || i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300 font-mono">
                        {c.contract_id || c.order_number || c.id?.slice(0, 8)}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-300">
                        {c._source}
                      </Badge>
                      {c.is_signed || c.customer_signature ? (
                        <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                          <ShieldCheck className="w-3 h-3 mr-1" /> Signed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs border-yellow-500/30 text-yellow-300">Unsigned</Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {c.created_date ? new Date(c.created_date).toLocaleString() : '—'}
                      </span>
                      {c.payment_method && <span>{c.payment_method}</span>}
                      {c.card_last_four && <span className="font-mono">•••• {c.card_last_four}</span>}
                      {(c.grand_total || c.contract_amount) && (
                        <span className="text-emerald-300">${(c.grand_total || c.contract_amount).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  {c.scanned_document_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-cyan-500/40 text-cyan-300"
                      onClick={() => window.open(c.scanned_document_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> View Scan
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {profile.contracts.length === 0 && (
              <div className="text-xs text-gray-500 italic">No contracts on file.</div>
            )}
          </div>
        </section>

        {/* Video evidence */}
        <section className="pt-4 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
            <Video className="w-4 h-4" /> Video Evidence
          </h3>
          {camerasInPlay.length ? (
            <div className="space-y-2">
              {camerasInPlay.map((r) => (
                <div key={r.id} className="bg-gray-900/60 border border-gray-800 rounded-lg p-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="text-white">Room {r.room_number} — {r.room_name}</div>
                    <div className="text-xs text-gray-500">
                      Camera: {r.surveillance_camera} · {r.start_time ? new Date(r.start_time).toLocaleString() : '—'}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                    Footage linked
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              No VIP room sessions linked to this customer's name. Link guest via VIP Room Board to enable footage retrieval.
            </div>
          )}
        </section>

        {/* Images */}
        <section className="pt-4 border-t border-gray-800">
          <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Identity & Images
          </h3>
          <div className="text-xs text-gray-500 italic">
            ID scans are captured via Door Check-In and attached to the VIPGuest record. Use the Door module to run a fresh ID scan.
          </div>
        </section>

        <div className="pt-4 border-t border-gray-800 flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-gray-700 text-gray-300">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}