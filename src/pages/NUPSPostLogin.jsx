import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { resolveRoleClass, homeForRoleClass, ROLE_CLASS } from '@/lib/nups/roleClass';
import { isSovereign } from '@/lib/nups/sovereign';

export default function NUPSPostLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roleClass, setRoleClass] = useState(null);
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const currentUser = await base44.auth.me();
      if (!currentUser) { navigate('/NUPSLanding'); return; }
      setUser(currentUser);

      // Look up NUPSUser + SOVEREIGN flag by created_by email (matches guard logic).
      let nupsUser = null;
      let sovereign = false;
      try {
        const matches = await base44.entities.NUPSUser.filter({ created_by: currentUser.email });
        nupsUser = (matches || [])[0] || null;
        sovereign = (matches || []).some(isSovereign);
      } catch { /* fall through */ }

      // §2 Role Matrix — one role class, one home, one flow.
      const cls = resolveRoleClass({ user: currentUser, nupsUser, sovereign });
      setRoleClass(cls);

      // Honor an explicit destination hint from NUPSLogin only if it matches
      // the resolved class's home tree — otherwise fall back to class home.
      // (Prevents cross-role deep-links defeating role scoping.)
      const savedDest = sessionStorage.getItem('nups_destination');
      sessionStorage.removeItem('nups_destination');
      sessionStorage.removeItem('nups_role_hint');
      const classHome = homeForRoleClass(cls);
      const dest = savedDest ? `/${savedDest}` : classHome;
      setDestination(dest);

      setTimeout(() => navigate(dest), 1500);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/NUPSLanding');
    } finally {
      setLoading(false);
    }
  };

  const handleManualNavigation = (path) => navigate(path);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <SEOHead
        title="N.U.P.S. Authenticated | Redirecting to Dashboard"
        description="NUPS authentication successful. Redirecting to your role-based dashboard."
        noIndex={true}
      />
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-slate-800/50 px-6 py-3 rounded-full border border-cyan-500/30 mb-6">
            <Lock className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-mono text-sm">AUTHENTICATED</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Welcome to N.U.P.S.
          </h1>
          
          <p className="text-slate-400 text-lg mb-2">
            Nightclub Utility Payment System
          </p>
          
          {user && (
            <p className="text-slate-500 text-sm">
              Signed in as: <span className="text-cyan-400 font-mono">{user.email}</span>
            </p>
          )}
        </div>

        {/* DACO 003 §2 — Single-class landing card. No cross-role links. */}
        <div className="max-w-md mx-auto bg-slate-900/50 border border-cyan-500/30 rounded-2xl p-8 text-center mb-6">
          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500 mb-2">Role Class</div>
          <div className="text-3xl font-black text-white mb-4">{roleClass || '—'}</div>
          <p className="text-slate-400 text-sm mb-6">
            You'll be taken to your workflow home in a moment. Only your role's tools will be visible.
          </p>
          {destination && (
            <Button
              onClick={() => handleManualNavigation(destination)}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
            >
              Continue to {destination.replace(/^\//, '')}
            </Button>
          )}
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
          </div>
        </div>

        {/* Logout */}
        <div className="mt-12 text-center">
          <Button
            variant="outline"
            onClick={async () => {
              await base44.auth.logout('/NUPSLanding');
            }}
            className="border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
            aria-label="Sign out and return to NUPS login"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}