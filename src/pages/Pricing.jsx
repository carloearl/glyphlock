import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, Rocket, Zap, Check, ArrowRight, Lock } from "lucide-react";

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planKey) => {
    setLoading(planKey);
    try {
      const response = await base44.functions.invoke('stripeCreateCheckout', {
        plan: planKey,
        mode: 'subscription',
        successUrl: `${window.location.origin}${createPageUrl('PaymentSuccess')}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}${createPageUrl('Pricing')}`
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error(response.data?.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(null);
    }
  };

  const plans = [
    {
      key: 'creator',
      name: 'Creator',
      price: 39,
      icon: Shield,
      color: 'cyan',
      features: [
        'QR Identity Studio',
        'Image Lab with AI generation',
        'GlyphBot site audits',
        'Up to 1,000 verified assets/month',
        'Community support'
      ]
    },
    {
      key: 'professional',
      name: 'Professional',
      price: 149,
      icon: Crown,
      color: 'purple',
      popular: true,
      features: [
        'Everything in Creator',
        'Unlimited verified assets',
        'Priority AI processing',
        'Master Covenant authorship',
        'Advanced open source tools',
        '24/7 priority support'
      ]
    },
    {
      key: 'enterprise',
      name: 'Enterprise',
      price: null,
      icon: Rocket,
      color: 'blue',
      features: [
        'Everything in Professional',
        'Custom deployment architecture',
        'Dedicated infrastructure engineer',
        'SLA guarantees',
        'White-label deployment',
        'Custom protocol integrations'
      ]
    }
  ];

  return (
    <div className="min-h-screen text-white py-12 md:py-20" style={{ background: 'transparent' }}>
      <SEOHead
        title="Support & Services | GlyphLock Open Source"
        description="GlyphLock is open source. Support plans fund continued development and unlock priority services, dedicated infrastructure, and enterprise SLAs."
        url="/pricing"
      />

      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 mb-3 md:mb-4 inline-block">
              Open Source · Free Core
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent leading-tight">
              Support & Services
            </h1>
            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto px-2">
              The framework is open source. These plans support development and unlock priority services.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            {plans.map((plan) => {
               const Icon = plan.icon;
               const isEnterprise = plan.key === 'enterprise';

               return (
                 <Card 
                   key={plan.key}
                   className={`bg-slate-900/60 backdrop-blur-xl border-2 ${
                     plan.popular 
                       ? 'border-purple-500/50 shadow-lg shadow-purple-500/20 md:scale-105' 
                       : 'border-slate-700/50'
                   } overflow-hidden relative`}
                 >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
                  )}
                  
                  <CardHeader className="text-center pb-6 md:pb-8">
                    {plan.popular && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 mx-auto mb-3 md:mb-4 inline-block">
                        MOST POPULAR
                      </Badge>
                    )}

                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${
                      plan.color === 'cyan' ? 'from-cyan-500/20 to-blue-500/20' :
                      plan.color === 'purple' ? 'from-purple-500/20 to-pink-500/20' :
                      'from-blue-500/20 to-indigo-500/20'
                    } flex items-center justify-center mx-auto mb-3 md:mb-4`}>
                      <Icon className={`w-7 h-7 md:w-8 md:h-8 ${
                        plan.color === 'cyan' ? 'text-cyan-400' :
                        plan.color === 'purple' ? 'text-purple-400' :
                        'text-blue-400'
                      }`} />
                    </div>

                    <CardTitle className="text-xl md:text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </CardTitle>

                    <div className="text-3xl md:text-4xl font-bold text-white">
                      {plan.price ? (
                        <>
                          ${plan.price}
                          <span className="text-sm md:text-lg text-slate-400 font-normal">/mo</span>
                        </>
                      ) : (
                        <span className="text-xl md:text-2xl">Custom</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={() => isEnterprise 
                        ? navigate(createPageUrl('Consultation')) 
                        : handleSubscribe(plan.key)
                      }
                      disabled={loading === plan.key}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                          : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500'
                      } text-white font-semibold py-3 rounded-xl transition-all`}
                    >
                      {loading === plan.key ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          {isEnterprise ? 'Contact Sales' : 'Subscribe Now'}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <Card className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-slate-400 text-sm">Yes, cancel from account settings. The core framework is always free and open source.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">What payment methods work?</h3>
                <p className="text-slate-400 text-sm">All major credit cards via Stripe. Invoicing available for Enterprise.</p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-2">Is GlyphLock really open source?</h3>
                <p className="text-slate-400 text-sm">Yes, 100%. The entire framework is open source. Support plans fund development and provide priority services.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}