import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FreeTrialGuard({ serviceName, children, allowAdminBypass = true }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      let sessionId = '';

      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        if (allowAdminBypass && userData.role === 'admin') {
          setCanAccess(true);
          return;
        }
      } else {
        sessionId = localStorage.getItem('glyphlock_session_id') || crypto.randomUUID();
        localStorage.setItem('glyphlock_session_id', sessionId);
      }

      const result = await glyphlockWrite('service_usage_check', {
        service_name: serviceName,
        session_id: sessionId,
        request_id: crypto.randomUUID(),
        intent: 'server_controlled_free_trial_usage',
      });
      setUsageCount(result.usage_count || 0);
      setCanAccess(result.can_access === true);
    } catch (error) {
      console.error("Access check error:", error);
      setCanAccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-black text-white py-20 relative">
        <div className="fixed inset-0 opacity-20 pointer-events-none">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6902128ac3c5c94a82446585/8cd0364f8_Whisk_2bd57b9a449d359968944ab33f98257edr-Copy.jpg"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-blue-900/20 backdrop-blur-md border-blue-500/30">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-3xl font-bold mb-4 text-white">
                  Free Trial Used
                </h1>
                
                <p className="text-lg text-white/80 mb-6">
                  You've already used your free trial for <span className="text-blue-400 font-semibold">{serviceName}</span>.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-8">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-1" />
                    <div className="text-left">
                      <h3 className="font-semibold text-white mb-2">Continue with Full Access</h3>
                      <p className="text-sm text-white/80">
                        Sign up or log in to unlock unlimited access to all GlyphLock security tools and services.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {user ? (
                    <Link to={createPageUrl("Pricing")}>
                      <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        <Shield className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                        onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                      >
                        Sign In to Continue
                      </Button>
                      <Link to={createPageUrl("Pricing")}>
                        <Button size="lg" variant="outline" className="w-full border-blue-500/50 text-white hover:bg-blue-500/20">
                          View Pricing Plans
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <Link to={createPageUrl("Home")}>
                    <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
                      Return to Home
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-blue-500/20">
                  <p className="text-sm text-white/60">
                    Usage Count: {usageCount} {usageCount === 1 ? 'use' : 'uses'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return children;
}