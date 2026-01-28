import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Crown, Zap } from "lucide-react";

export default function PaywallGuard({ serviceName, children, requirePlan = "professional" }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        setLoading(false);
        return;
      }

      const userData = await base44.auth.me();
      setUser(userData);

      // Admin bypass - intentional for testing and support
      if (userData.role === 'admin') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // GLYPHLOCK: Check subscription plan key matches required tier
      const hasSubscription = userData.subscription_plan && 
                            userData.subscription_status === 'active';
      
      // GLYPHLOCK: Map plan requirements (creator < professional < enterprise)
      const planHierarchy = { creator: 1, professional: 2, enterprise: 3 };
      const userPlanLevel = planHierarchy[userData.subscription_plan] || 0;
      const requiredLevel = planHierarchy[requirePlan] || 1;
      
      setHasAccess(hasSubscription && userPlanLevel >= requiredLevel);
    } catch (error) {
      console.error("Access check error:", error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planKey) => {
    try {
      // GLYPHLOCK: Use plan key instead of price ID
      const response = await base44.functions.invoke('stripeCreateCheckout', {
        plan: planKey,
        mode: 'subscription',
        successUrl: `${window.location.origin}${createPageUrl('PaymentSuccess')}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}${createPageUrl('PaymentCancel')}`
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white py-20 relative overflow-hidden">
        {/* Cosmic background effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-cyan-900/10 to-transparent pointer-events-none" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none" />
        
        {/* Floating orbs */}
        <div className="fixed top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="fixed bottom-20 left-20 w-48 h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 md:p-12 shadow-2xl"
                 style={{ boxShadow: '0 0 60px rgba(6, 182, 212, 0.15), 0 0 120px rgba(168, 85, 247, 0.1)' }}>
              
              {/* Lock icon with glow */}
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
                   style={{ boxShadow: '0 0 40px rgba(6, 182, 212, 0.5), 0 0 80px rgba(168, 85, 247, 0.3)' }}>
                <Lock className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Premium Feature
              </h1>
              
              <p className="text-xl text-center mb-2">
                <span className="text-cyan-400 font-semibold">{serviceName}</span> 
                <span className="text-gray-300"> requires a subscription</span>
              </p>
              <p className="text-gray-400 text-center mb-10">
                {user ? "Upgrade to access all GlyphLock tools" : "Sign in and subscribe to continue"}
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                {/* Creator Plan */}
                <div className="bg-gray-900/80 backdrop-blur-xl border-2 border-cyan-500/40 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-cyan-400/60 hover:scale-[1.02]"
                     style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 pointer-events-none" />
                  <div className="relative z-10">
                    <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                    <h3 className="font-bold text-xl text-white text-center mb-2">Creator</h3>
                    <div className="text-4xl font-bold text-center mb-6">
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">$39</span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                    <ul className="text-sm space-y-3 mb-6 text-gray-300">
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        All Security Tools
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        Blockchain Suite
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        GlyphBot AI
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        1,000 QR/month
                      </li>
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade('creator')}
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                      style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' }}
                    >
                      Subscribe Now
                    </Button>
                  </div>
                </div>

                {/* Professional Plan */}
                <div className="bg-gray-900/80 backdrop-blur-xl border-2 border-purple-500/50 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:border-purple-400/70 hover:scale-[1.02]"
                     style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.25)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5 pointer-events-none" />
                  <div className="absolute -top-px left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-4 py-1.5 rounded-b-lg font-semibold shadow-lg"
                          style={{ boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)' }}>
                      POPULAR
                    </span>
                  </div>
                  <div className="relative z-10 pt-2">
                    <Crown className="w-12 h-12 text-purple-400 mx-auto mb-4" style={{ filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))' }} />
                    <h3 className="font-bold text-xl text-white text-center mb-2">Professional</h3>
                    <div className="text-4xl font-bold text-center mb-6">
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">$149</span>
                      <span className="text-sm text-gray-400">/mo</span>
                    </div>
                    <ul className="text-sm space-y-3 mb-6 text-gray-300">
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        Everything in Creator
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        Unlimited QR
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        N.U.P.S. POS
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        24/7 Support
                      </li>
                    </ul>
                    <Button 
                      onClick={() => handleUpgrade('professional')}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0 text-white font-semibold py-3 rounded-xl transition-all duration-300"
                      style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
                    >
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-w-md mx-auto">
                {!user && (
                  <Button 
                    size="lg"
                    onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                    className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 border-0 text-white font-semibold py-4 rounded-xl text-lg transition-all duration-300"
                    style={{ boxShadow: '0 0 30px rgba(6, 182, 212, 0.3), 0 0 60px rgba(168, 85, 247, 0.2)' }}
                  >
                    Sign In to Continue
                  </Button>
                )}
                
                <Link to={createPageUrl("Pricing")} className="block">
                  <Button variant="outline" className="w-full border-2 border-cyan-500/50 bg-transparent text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 py-3 rounded-xl font-semibold transition-all duration-300">
                    View All Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}