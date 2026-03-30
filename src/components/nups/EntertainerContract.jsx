import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSignature, AlertTriangle, ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ENTERTAINER_LICENSE_AGREEMENT } from '@/constants/contractText';

export default function EntertainerContract({ onContractSigned }) {
  const queryClient = useQueryClient();
  const [showContract, setShowContract] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledContract, setHasScrolledContract] = useState(false);
  const contractScrollRef = useRef(null);

  const { data: venues } = useQuery({
    queryKey: ['venues'],
    queryFn: () => base44.entities.Venue.list(),
    initialData: []
  });
  const currentVenue = venues?.[0] || { name: 'Venue', address: '', age_requirement: 18 };

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

      // CONTRACT STATUS AUTO-CALCULATION — DIRECTIVE 5E
      const minimumAge = (venues?.[0]?.minimum_age) || 21;
      const calculateContractStatus = (ent, minAge) => {
        if (!ent.date_of_birth) return 'PENDING';
        const dob = new Date(ent.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear()
          - (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        if (age < minAge) return 'PENDING';
        if (
          ent.contract_signed === true &&
          ent.contract_signed_date &&
          ent.contract_signature &&
          ent.contract_ip_address &&
          ent.legal_name &&
          ent.stage_name &&
          ent.id_type &&
          ent.id_number &&
          ent.id_expiration &&
          ent.ssn_or_ein &&
          ent.emergency_contact &&
          ent.independent_contractor_acknowledgment === true
        ) { return 'VALID'; }
        return 'PENDING';
      };

      const entertainerPayload = {
        ...data,
        contract_signed: true,
        contract_signature: signature,
        contract_signed_date: new Date().toISOString(),
        contract_ip_address: ip,
        status: 'active',
        total_earnings: 0,
        vip_room_count: 0
      };
      const contractStatus = calculateContractStatus(entertainerPayload, minimumAge);

      return base44.entities.Entertainer.create({
        ...entertainerPayload,
        contract_status: contractStatus
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
                  className="h-72 overflow-y-auto bg-gray-900/70 border border-gray-600 rounded-lg p-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-mono"
                >
                  {ENTERTAINER_LICENSE_AGREEMENT(currentVenue)}
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