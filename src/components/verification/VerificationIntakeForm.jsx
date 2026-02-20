import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DOMPurify from "dompurify";
import VerificationGate from "@/components/security/VerificationGate";
import RoyalLoader from "@/components/shared/RoyalLoader";

const SYSTEM_TYPES = [
  "Enterprise Infrastructure",
  "Cloud Native Architecture",
  "Hybrid Deployment",
  "Legacy System Integration",
  "Government / Defense System",
  "Financial Services Platform",
  "Healthcare System",
  "Custom Environment"
];

export default function VerificationIntakeForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    organization: "",
    email: "",
    system_type: "",
    description: ""
  });
  const [verificationToken, setVerificationToken] = useState(null);

  const createConsultation = useMutation({
    mutationFn: async (data) => {
      const sanitizedData = {
        full_name: DOMPurify.sanitize(data.full_name, { ALLOWED_TAGS: [] }),
        organization: DOMPurify.sanitize(data.organization || '', { ALLOWED_TAGS: [] }),
        email: DOMPurify.sanitize(data.email, { ALLOWED_TAGS: [] }),
        system_type: DOMPurify.sanitize(data.system_type, { ALLOWED_TAGS: [] }),
        description: DOMPurify.sanitize(data.description || '', { ALLOWED_TAGS: [] }),
        service_interest: "Protocol Verification",
        status: "pending",
        payment_status: "pending"
      };

      const consultation = await base44.entities.Consultation.create(sanitizedData);

      const response = await base44.functions.invoke('stripeCreateCheckout', {
        priceId: null,
        mode: 'payment',
        lineItems: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'GlyphLock Founding Cohort Verification',
              description: 'Structured protocol verification engagement under Master Covenant governance',
            },
            unit_amount: 650000,
          },
          quantity: 1,
        }],
        successUrl: `${window.location.origin}${createPageUrl('ConsultationSuccess')}?verification_id=${consultation.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}${createPageUrl('Consultation')}?cancelled=true`
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || "Failed to create checkout session");
      }

      return consultation;
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationToken) { alert('Verification required'); return; }

    const validation = await base44.functions.invoke('validateVerificationToken', { token: verificationToken });
    if (!validation.data?.valid) {
      alert('Verification failed. Submission rejected.');
      setVerificationToken(null);
      return;
    }
    createConsultation.mutate(formData);
  };

  if (createConsultation.isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <RoyalLoader text="Processing Verification Request..." />
      </div>
    );
  }

  const inputClass = "bg-slate-900/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-slate-500 focus:ring-0 rounded-none";

  return (
    <section id="intake-form" className="max-w-3xl mx-auto mb-20 md:mb-28 px-4">
      <div className="border border-slate-700/50 p-6 md:p-10 bg-slate-900/30">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Request Verification Review</h2>
        <p className="text-sm text-slate-400 mb-8">Complete the structured intake form to initiate your verification engagement.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Full Name</Label>
              <Input required value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className={inputClass} placeholder="Enter your full name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Email Address</Label>
              <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={inputClass} placeholder="you@organization.com" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Organization</Label>
              <Input required value={formData.organization} onChange={(e) => setFormData({...formData, organization: e.target.value})} className={inputClass} placeholder="Organization name" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">System Type</Label>
              <Select required value={formData.system_type} onValueChange={(value) => setFormData({...formData, system_type: value})}>
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Select infrastructure type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  {SYSTEM_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="text-white hover:bg-slate-800 focus:bg-slate-800">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Verification Requirements</Label>
            <Textarea rows={4} required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={`${inputClass} resize-none`} placeholder="Describe your architecture, governance documentation status, and verification objectives..." />
          </div>

          <div className="pt-2 space-y-4">
            <VerificationGate onVerified={(token) => setVerificationToken(token)} disabled={createConsultation.isPending} />

            <Button type="submit" disabled={createConsultation.isPending || !verificationToken} className="w-full bg-white text-black font-bold py-4 md:py-5 rounded-none hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider">
              {createConsultation.isPending ? "Processing..." : "Request Verification Review"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}