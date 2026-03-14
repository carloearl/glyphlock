/**
 * Club Currency Press — Standalone page mount
 * Route: /ClubCurrencyPress
 * Also accessible from NUPS Owner tab
 */
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Loader2 } from "lucide-react";
import ClubCurrencyPressView from "@/components/nups/press/ClubCurrencyPressView";
import SEOHead from "@/components/SEOHead";

export default function ClubCurrencyPress() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          window.location.href = createPageUrl("NUPSLogin");
          return;
        }
        const u = await base44.auth.me();
        setUser(u);
      } catch {
        window.location.href = createPageUrl("NUPSLogin");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SEOHead
        title="Club Currency Press | Dream Dollar Production System"
        description="Professional club currency design and production system. Create custom Dream Dollar vouchers with drag-and-drop canvas, AI assistance, and batch printing."
        keywords="club currency, Dream Dollar press, voucher design, custom currency, nightclub currency, currency production"
        noIndex={true}
      />
      <div className="container mx-auto p-4 md:p-6">
        <ClubCurrencyPressView />
      </div>
    </div>
  );
}