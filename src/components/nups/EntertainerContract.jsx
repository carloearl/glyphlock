import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSignature, AlertTriangle, ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EntertainerContract({ onContractSigned }) {
  const queryClient = useQueryClient();
  const [showContract, setShowContract] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledContract, setHasScrolledContract] = useState(false);
  const contractScrollRef = useRef(null);

  const handleContractScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
      setHasScrolledContract(true);
    }
  };
  const [signature, setSignature] = useState("");
  const [entertainerData, setEntertainerData] = useState({
    stage_name: "",
    legal_name: "",
    phone: "",
    email: "",
    emergency_contact: {
      name: "",
      phone: "",
      relationship: ""
    },
    commission_rate: 0.5
  });

  const createEntertainer = useMutation({
    mutationFn: async (data) => {
      // Get client IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      return base44.entities.Entertainer.create({
        ...data,
        contract_signed: true,
        contract_signature: signature,
        contract_signed_date: new Date().toISOString(),
        contract_ip_address: ip,
        status: 'active',
        total_earnings: 0,
        vip_room_count: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entertainers'] });
      alert('✅ Contract signed successfully! Welcome aboard!');
      if (onContractSigned) onContractSigned();
      setShowContract(false);
    }
  });

  const stripHtml = (str) => (str || '').replace(/<[^>]*>/g, '').replace(/[<>"']/g, '').trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('You must agree to the terms to continue');
      return;
    }
    if (!signature) {
      alert('Please provide your digital signature');
      return;
    }
    const cleaned = {
      stage_name: stripHtml(entertainerData.stage_name),
      legal_name: stripHtml(entertainerData.legal_name),
      phone: stripHtml(entertainerData.phone),
      email: (entertainerData.email || '').trim(),
      emergency_contact: {
        name: stripHtml(entertainerData.emergency_contact.name),
        phone: stripHtml(entertainerData.emergency_contact.phone),
        relationship: stripHtml(entertainerData.emergency_contact.relationship)
      },
      commission_rate: entertainerData.commission_rate
    };
    if (cleaned.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)) {
      alert('Please enter a valid email address');
      return;
    }
    createEntertainer.mutate(cleaned);
  };

  return (
    <div>
      <Button
        onClick={() => setShowContract(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-600"
      >
        <FileSignature className="w-4 h-4 mr-2" />
        New Entertainer Contract
      </Button>

      <Dialog open={showContract} onOpenChange={setShowContract}>
        <DialogContent className="glass-modal border-purple-500/30 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              Entertainer Independent Contractor Agreement
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Stage Name *</Label>
                    <Input
                      value={entertainerData.stage_name}
                      onChange={(e) => setEntertainerData({...entertainerData, stage_name: e.target.value})}
                      className="glass-input"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white">Legal Name *</Label>
                    <Input
                      value={entertainerData.legal_name}
                      onChange={(e) => setEntertainerData({...entertainerData, legal_name: e.target.value})}
                      className="glass-input"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white">Phone *</Label>
                    <Input
                      value={entertainerData.phone}
                      onChange={(e) => setEntertainerData({...entertainerData, phone: e.target.value})}
                      className="glass-input"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-white">Email *</Label>
                    <Input
                      type="email"
                      value={entertainerData.email}
                      onChange={(e) => setEntertainerData({...entertainerData, email: e.target.value})}
                      className="glass-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block">Emergency Contact</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Name *"
                      value={entertainerData.emergency_contact.name}
                      onChange={(e) => setEntertainerData({
                        ...entertainerData,
                        emergency_contact: {...entertainerData.emergency_contact, name: e.target.value}
                      })}
                      className="glass-input"
                      required
                    />
                    <Input
                      placeholder="Phone *"
                      value={entertainerData.emergency_contact.phone}
                      onChange={(e) => setEntertainerData({
                        ...entertainerData,
                        emergency_contact: {...entertainerData.emergency_contact, phone: e.target.value}
                      })}
                      className="glass-input"
                      required
                    />
                    <Input
                      placeholder="Relationship *"
                      value={entertainerData.emergency_contact.relationship}
                      onChange={(e) => setEntertainerData({
                        ...entertainerData,
                        emergency_contact: {...entertainerData.emergency_contact, relationship: e.target.value}
                      })}
                      className="glass-input"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Terms */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-purple-400" />
                  Independent Contractor Agreement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white"><span className="font-bold">You must scroll to the bottom</span> to read and accept this agreement.</p>
                  </div>
                </div>

                {/* Full contract scroll box */}
                <div
                  ref={contractScrollRef}
                  onScroll={handleContractScroll}
                  className="h-72 overflow-y-auto bg-gray-900/70 border border-gray-600 rounded-lg p-5 text-sm text-gray-300 space-y-4 leading-relaxed"
                >
                  <p className="text-white font-bold text-base text-center uppercase tracking-wide">ENTERTAINER INDEPENDENT CONTRACTOR AGREEMENT</p>
                  <p className="text-gray-400 text-center text-xs">GlyphLock Financial LLC — Effective upon digital signature</p>

                  <p><span className="text-white font-semibold">1. INDEPENDENT CONTRACTOR STATUS.</span> The entertainer ("Contractor") agrees that they are an independent contractor and not an employee of the venue or GlyphLock Financial LLC ("Company"). Contractor is solely responsible for their own taxes, insurance, and benefits. No employer-employee relationship is created by this agreement.</p>

                  <p><span className="text-white font-semibold">2. SERVICES.</span> Contractor agrees to provide entertainment services at the designated venue on agreed-upon dates and times. Services include but are not limited to: live performance, guest interaction, VIP room services, and promotional activities as directed by venue management.</p>

                  <p><span className="text-white font-semibold">3. COMPENSATION & COMMISSION.</span> Contractor shall be compensated based on the commission structure communicated at time of onboarding. Dream Dollar redemption payouts are processed at 85% of face value. VIP commissions and other earnings are subject to the venue's published rate schedule. All payouts require Contractor's signed acknowledgment.</p>

                  <p><span className="text-white font-semibold">4. HOUSE FEES & DEDUCTIONS.</span> Contractor acknowledges that the venue may charge a house fee per shift. This fee is agreed upon prior to each scheduled shift. Contractor consents to deduction of applicable fees from earned compensation prior to payout.</p>

                  <p><span className="text-white font-semibold">5. CONDUCT & PROFESSIONALISM.</span> Contractor agrees to maintain a professional standard of conduct at all times on venue premises. This includes: respectful treatment of all guests, staff, and management; adherence to dress code and appearance standards; sobriety during working hours unless otherwise permitted by venue policy; and compliance with all venue rules posted or communicated by management.</p>

                  <p><span className="text-white font-semibold">6. LEGAL COMPLIANCE.</span> Contractor represents and warrants that they are of legal age (18+) to perform the services described herein, possess all required licenses or permits applicable to their services, and will comply with all local, state, and federal laws governing their activities at the venue.</p>

                  <p><span className="text-white font-semibold">7. CONFIDENTIALITY.</span> Contractor agrees to maintain strict confidentiality regarding venue operations, guest identities, financial information, and any proprietary systems or processes observed during the course of their engagement. This obligation survives termination of this agreement.</p>

                  <p><span className="text-white font-semibold">8. SAFETY & PROTOCOLS.</span> Contractor agrees to follow all safety protocols, emergency procedures, and health guidelines as established by the venue. Contractor acknowledges receipt of safety guidelines and agrees to review and comply with them in full.</p>

                  <p><span className="text-white font-semibold">9. SCHEDULING & CANCELLATION.</span> Contractor agrees to provide at least 24 hours' notice for any shift cancellation. Repeated no-shows or late cancellations may result in suspension or termination of this agreement at the venue's discretion.</p>

                  <p><span className="text-white font-semibold">10. TERMINATION.</span> Either party may terminate this agreement at any time with or without cause. Venue management reserves the right to immediately remove a Contractor from the premises for conduct violations, safety concerns, or non-compliance with this agreement. Earned but unpaid compensation will be remitted within the normal pay cycle.</p>

                  <p><span className="text-white font-semibold">11. INTELLECTUAL PROPERTY & MEDIA.</span> Contractor grants venue a non-exclusive license to use photographs or video recordings taken during scheduled shifts for promotional purposes. Contractor may not record, photograph, or distribute any images of guests or internal venue operations without express written consent.</p>

                  <p><span className="text-white font-semibold">12. DISPUTE RESOLUTION.</span> Any disputes arising from this agreement shall be resolved through binding arbitration in the jurisdiction where the venue is located. Both parties waive their right to a jury trial in connection with any dispute arising hereunder.</p>

                  <p><span className="text-white font-semibold">13. ENTIRE AGREEMENT.</span> This agreement constitutes the entire agreement between the parties with respect to Contractor's services and supersedes all prior understandings or agreements, whether written or oral.</p>

                  <p className="text-center text-gray-500 text-xs pt-4 border-t border-gray-700">— End of Agreement —</p>
                </div>

                {!hasScrolledContract && (
                  <p className="text-center text-xs text-amber-400/70 mt-2 animate-pulse">
                    ↓ Scroll to the bottom of the contract to unlock the agreement checkbox
                  </p>
                )}
                {hasScrolledContract && (
                  <p className="text-center text-xs text-green-400 mt-2">
                    ✓ Contract fully read — you may now sign below
                  </p>
                )}

                <div className="mt-4 space-y-4">
                  <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${hasScrolledContract ? 'border-purple-500/30 bg-purple-500/5' : 'border-gray-700 bg-gray-800/30 opacity-50 pointer-events-none'}`}>
                    <Checkbox
                      checked={agreed}
                      onCheckedChange={setAgreed}
                      className="mt-1"
                      disabled={!hasScrolledContract}
                    />
                    <label className={`text-sm ${hasScrolledContract ? 'text-white cursor-pointer' : 'text-gray-500'}`} onClick={() => hasScrolledContract && setAgreed(!agreed)}>
                      I have read the entire Independent Contractor Agreement above and agree to all terms and conditions. I understand this is a legally binding contract.
                    </label>
                  </div>

                  <div>
                    <Label className="text-white">Digital Signature *</Label>
                    <Input
                      placeholder="Type your full legal name as signature"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="glass-input text-lg"
                      style={{ fontFamily: 'cursive' }}
                      disabled={!hasScrolledContract}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      By typing your name, you agree this constitutes a legal digital signature
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowContract(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!agreed || !signature || createEntertainer.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {createEntertainer.isPending ? "Signing Contract..." : "Sign Contract & Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}