import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  DollarSign, 
  Users, 
  BarChart3,
  Lock,
  Loader2
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

export default function NUPSPostLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      const currentUser = await base44.auth.me();
      
      if (!currentUser) {
        navigate('/NUPSLogin');
        return;
      }

      setUser(currentUser);

      // Check for stored destination from NUPSLogin flow
      const savedDest = sessionStorage.getItem('nups_destination');
      if (savedDest) {
        sessionStorage.removeItem('nups_destination');
        sessionStorage.removeItem('nups_role_hint');
        setTimeout(() => navigate(`/${savedDest}`), 2000);
        return;
      }

      // Fallback: Auto-redirect based on actual user role
      setTimeout(() => {
        if (currentUser.role === 'owner' || currentUser.role === 'admin') {
          navigate('/NUPSOwner');
        } else if (currentUser.role === 'staff') {
          navigate('/NUPSStaff');
        } else if (currentUser.role === 'entertainer') {
          navigate('/EntertainerCheckIn');
        } else {
          navigate('/DreamDollarHub');
        }
      }, 2000);

    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/NUPSLogin');
    } finally {
      setLoading(false);
    }
  };

  const handleManualNavigation = (path) => {
    navigate(path);
  };

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

        {/* Role-Based Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Staff Portal */}
          {user?.role === 'staff' && (
            <Card 
              className="bg-slate-900/50 border-cyan-500/30 hover:border-cyan-400/60 transition-all cursor-pointer group"
              onClick={() => handleManualNavigation('/NUPSStaff')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleManualNavigation('/NUPSStaff'); }}}
              aria-label="Navigate to Staff Terminal - Access POS, contracts, batch management, and time clock"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-cyan-400">
                  <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Staff Terminal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Access POS, contracts, batch management, and time clock
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="bg-slate-800 px-2 py-1 rounded">Register</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Contracts</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Batches</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Clock In/Out</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Owner/Admin Portal */}
          {(user?.role === 'owner' || user?.role === 'admin') && (
            <Card 
              className="bg-slate-900/50 border-purple-500/30 hover:border-purple-400/60 transition-all cursor-pointer group"
              onClick={() => handleManualNavigation('/NUPSOwner')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleManualNavigation('/NUPSOwner'); }}}
              aria-label="Navigate to Owner Dashboard - Analytics, reports, staff management, and system controls"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-purple-400">
                  <BarChart3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Owner Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Analytics, reports, staff management, and system controls
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="bg-slate-800 px-2 py-1 rounded">Analytics</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Reports</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Staff</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Settings</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dream Dollar Hub */}
          <Card 
            className="bg-slate-900/50 border-blue-500/30 hover:border-blue-400/60 transition-all cursor-pointer group"
            onClick={() => handleManualNavigation('/DreamDollarHub')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleManualNavigation('/DreamDollarHub'); }}}
            aria-label="Navigate to Dream Dollar Hub - Currency operations, sales, press, redemption, and fraud monitoring"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-400">
                <DollarSign className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Dream Dollar Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-400 mb-4">
                Currency operations, sales, press, redemption, and fraud monitoring
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="bg-slate-800 px-2 py-1 rounded">New Sale</span>
                <span className="bg-slate-800 px-2 py-1 rounded">Press Bills</span>
                <span className="bg-slate-800 px-2 py-1 rounded">Redeem</span>
                <span className="bg-slate-800 px-2 py-1 rounded">Analytics</span>
              </div>
            </CardContent>
          </Card>

          {/* Entertainer Portal */}
          {user?.role === 'entertainer' && (
            <Card 
              className="bg-slate-900/50 border-pink-500/30 hover:border-pink-400/60 transition-all cursor-pointer group"
              onClick={() => handleManualNavigation('/EntertainerCheckIn')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleManualNavigation('/EntertainerCheckIn'); }}}
              aria-label="Navigate to Entertainer Portal - Check in, view schedule, track earnings, and manage profile"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-pink-400">
                  <Users className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Entertainer Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 mb-4">
                  Check in, view schedule, track earnings, and manage profile
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="bg-slate-800 px-2 py-1 rounded">Check In</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Schedule</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Earnings</span>
                  <span className="bg-slate-800 px-2 py-1 rounded">Profile</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Auto-redirect notice */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Redirecting to your dashboard automatically...
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
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
              await base44.auth.logout('/NUPSLogin');
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