import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Target, Zap, Clock, CheckCircle2, Lock, AlertTriangle } from "lucide-react";
import GlyphLoader from "@/components/GlyphLoader";
import RoyalLoader from "@/components/shared/RoyalLoader";
import SEOHead from "@/components/SEOHead";
import { injectServiceSchema } from "@/components/utils/seoHelpers";
import DOMPurify from "dompurify";
import VerificationGate from "@/components/security/VerificationGate";

export default function Consultation() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    organization: "",
    email: "",
    system_type: "",
    description: ""
  });
  const [verificationToken, setVerificationToken] = useState(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
    }
  }, []);

  useEffect(() => {
    const cleanup = injectServiceSchema(
      'Security Consultation',
      '60-minute expert cybersecurity analysis with GlyphLock specialists - vulnerability assessment, architecture planning, and custom security solutions',
      '/consultation'
    );
    return cleanup;
  }, []);

  // Rotate featured capability
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const createConsultation = useMutation({
    mutationFn: async (data) => {
      // Sanitize all inputs
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

      // First create the consultation record
      const consultation = await base44.entities.Consultation.create(sanitizedData);
      
      // Then create Stripe checkout for the $200 consultation fee
      const response = await base44.functions.invoke('stripeCreateCheckout', {
        priceId: null,
        mode: 'payment',
        lineItems: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'GlyphLock Protocol Verification',
              description: 'Controlled protocol verification engagement under Master Covenant governance',
            },
            unit_amount: parseInt(Deno.env?.get?.('CONSULTATION_PRICE_CENTS') || '1200000'), // Default $12,000.00 in cents
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
    
    if (!verificationToken) {
      alert('Verification required');
      return;
    }

    // Validate token server-side before submission
    try {
      const validation = await base44.functions.invoke('validateVerificationToken', {
        token: verificationToken
      });

      if (!validation.data?.valid) {
        alert('Verification failed. Submission rejected.');
        setVerificationToken(null);
        return;
      }

      // Proceed with submission
      createConsultation.mutate(formData);
    } catch (error) {
      alert('Verification failed. Submission rejected.');
      setVerificationToken(null);
    }
  };

  const systemTypes = [
    "Enterprise Infrastructure",
    "Cloud Native Architecture",
    "Hybrid Deployment",
    "Legacy System Integration",
    "Government/Defense System",
    "Financial Services Platform",
    "Healthcare System",
    "Custom Environment"
  ];

  const verificationScope = [
    { icon: Shield, text: "System integrity and threat exposure analysis" },
    { icon: Lock, text: "Enforceability assessment under Covenant governance" },
    { icon: Target, text: "Visual, QR, and protocol authenticity validation" },
    { icon: CheckCircle2, text: "Credential eligibility determination" },
    { icon: Zap, text: "Definitive enforcement roadmap" }
  ];

  const protocolCapabilities = [
    { icon: Shield, text: "Zero-forge visual authentication", desc: "Cryptographic proof that cannot be replicated" },
    { icon: Zap, text: "AI-driven protocol verification", desc: "Intelligent analysis of security posture" },
    { icon: Target, text: "Autonomous audit pathways", desc: "Self-executing compliance validation" },
    { icon: Lock, text: "Post-quantum readiness", desc: "Future-proof cryptographic standards" },
    { icon: CheckCircle2, text: "Enforcement-grade architecture", desc: "Military-level security infrastructure" }
  ];

  const engagementFeatures = [
    { label: "Duration", value: "Up to 90 minutes", icon: Clock },
    { label: "Format", value: "Secure video or audio", icon: Shield },
    { label: "Recording", value: "Mutual authorization only", icon: Lock },
    { label: "Software", value: "No installs required", icon: CheckCircle2 }
  ];

  if (createConsultation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900">
        <RoyalLoader text="Processing Credential Request..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pt-20 pb-16" style={{ background: 'transparent' }}>
      <SEOHead 
        title="Protocol Verification | GlyphLock"
        description="GlyphLock protocol verification engagement - credentialed enforcement eligibility under Master Covenant governance."
        url="/consultation"
      />
      
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-16 md:mb-20">
            {/* Floating Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 mb-8">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-medium">Master Covenant Governed</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">
              Protocol Verification
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12">
              Determine if your system qualifies for credentialed enforcement under GlyphLock's security protocol.
            </p>

            {/* Pricing Card */}
            <div className="relative max-w-md mx-auto mb-16">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl" />
              <Card className="relative bg-slate-900/80 backdrop-blur-xl border-2 border-cyan-500/30 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />
                <CardContent className="p-8">
                  <div className="text-sm text-cyan-400 font-semibold tracking-wider mb-2">VERIFICATION ENGAGEMENT</div>
                  <div className="text-5xl font-black text-white mb-2">$12,000</div>
                  <div className="text-slate-400 text-sm mb-6">One-time comprehensive protocol analysis</div>
                  
                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-700/50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">90</div>
                      <div className="text-xs text-slate-500">Minutes</div>
                    </div>
                    <div className="text-center border-x border-slate-700/50">
                      <div className="text-lg font-bold text-white">1:1</div>
                      <div className="text-xs text-slate-500">Expert</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">Full</div>
                      <div className="text-xs text-slate-500">Report</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2 text-left">
                    {verificationScope.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <item.icon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="text-slate-300">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
                      <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Request Verification</CardTitle>
                      <p className="text-sm text-slate-400">Complete the form to begin your credential review</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-slate-300 text-sm">Full Name</Label>
                        <Input
                          id="full_name"
                          required
                          placeholder="Enter your full name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300 text-sm">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          placeholder="you@company.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="organization" className="text-slate-300 text-sm">Organization</Label>
                        <Input
                          id="organization"
                          required
                          placeholder="Your company name"
                          value={formData.organization}
                          onChange={(e) => setFormData({...formData, organization: e.target.value})}
                          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="system_type" className="text-slate-300 text-sm">System Type</Label>
                        <Select
                          required
                          value={formData.system_type}
                          onValueChange={(value) => setFormData({...formData, system_type: value})}
                        >
                          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white focus:border-cyan-500/50">
                            <SelectValue placeholder="Select your infrastructure" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700">
                            {systemTypes.map((type) => (
                              <SelectItem key={type} value={type} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-slate-300 text-sm">What Needs Verification</Label>
                      <Textarea
                        id="description"
                        rows={4}
                        required
                        placeholder="Describe your security requirements and what you need verified..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 resize-none"
                      />
                    </div>

                    <div className="pt-2 space-y-4">
                      <VerificationGate 
                        onVerified={(token) => setVerificationToken(token)}
                        disabled={createConsultation.isPending}
                      />

                      <Button
                        type="submit"
                        size="lg"
                        disabled={createConsultation.isPending || !verificationToken}
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-6 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {createConsultation.isPending ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing Request...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Submit Verification Request
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Engagement Format */}
              <Card className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Engagement Format
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  {engagementFeatures.map((feature, idx) => (
                    <div key={idx} className={`flex items-center justify-between py-3 ${idx !== engagementFeatures.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-400 text-sm">{feature.label}</span>
                      </div>
                      <span className="font-medium text-white text-sm">{feature.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* What You'll Receive */}
              <Card className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-cyan-400" />
                    What You'll Receive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {['Comprehensive security assessment', 'Threat exposure analysis', 'Protocol compliance report', 'Credential eligibility determination', 'Enforcement roadmap'].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm mb-2">Important Notice</h3>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Passing verification does not guarantee deployment. All determinations are governed by the Master Covenant.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Why GlyphLock Section */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Why GlyphLock</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Threats adapt. Protocols enforce. Here's what sets us apart.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {protocolCapabilities.map((cap, idx) => (
                <Card 
                  key={idx} 
                  className={`bg-slate-900/60 backdrop-blur-xl border transition-all duration-500 ${
                    activeFeature === idx 
                      ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                      : 'border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  <CardContent className="p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${
                      activeFeature === idx 
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30' 
                        : 'bg-slate-800/50'
                    }`}>
                      <cap.icon className={`w-5 h-5 transition-colors duration-500 ${activeFeature === idx ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <h3 className="text-white font-semibold mb-1">{cap.text}</h3>
                    <p className="text-slate-400 text-sm">{cap.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Ready to Begin?</h3>
                  <p className="text-slate-400 mb-6">
                    After verification, you'll gain access to protocol enforcement deployment, red team simulations, compliance preparation, and long-term governance support.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {['Enforcement Deployment', 'Red Team Simulation', 'Compliance Prep', 'Governance Support'].map((item, idx) => (
                      <div key={idx} className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-slate-500 text-sm mb-2">Questions about the process?</p>
                  <a href="mailto:glyphlock@gmail.com" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                    Contact our team →
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}