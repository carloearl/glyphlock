import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileSignature, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EntertainerContract({ onContractSigned }) {
  const queryClient = useQueryClient();
  const [showContract, setShowContract] = useState(false);
  const [agreed, setAgreed] = useState(false);
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

  const contractTerms = [
    "I understand this is an independent contractor agreement",
    "I will maintain professional conduct at all times",
    "I agree to the house rules and safety protocols",
    "I acknowledge the commission structure and payment terms",
    "I will respect all guests and staff members",
    "I understand my schedule obligations",
    "I agree to maintain confidentiality",
    "I will comply with all legal requirements",
    "I acknowledge receipt of safety guidelines",
    "I understand the termination policies"
  ];

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
                <CardTitle className="text-white text-lg">Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-white">
                      <p className="font-bold mb-1">Important Legal Agreement</p>
                      <p>Please read all terms carefully. By signing, you agree to all conditions of employment.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto bg-gray-900/50 p-4 rounded-lg">
                  {contractTerms.map((term, index) => (
                    <div key={index} className="text-white text-sm flex items-start gap-2">
                      <span className="font-bold text-cyan-400">{index + 1}.</span>
                      <span>{term}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={agreed}
                      onCheckedChange={setAgreed}
                      className="mt-1"
                    />
                    <label className="text-white text-sm cursor-pointer" onClick={() => setAgreed(!agreed)}>
                      I have read and agree to all terms and conditions listed above. I understand this is a legally binding contract.
                    </label>
                  </div>

                  <div>
                    <Label className="text-white">Digital Signature *</Label>
                    <Input
                      placeholder="Type your full legal name as signature"
                      value={signature}
                      onChange={(e) => setSignature(e.target.value)}
                      className="glass-input font-signature text-lg"
                      style={{ fontFamily: 'cursive' }}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      By typing your name, you agree this constitutes a legal signature
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