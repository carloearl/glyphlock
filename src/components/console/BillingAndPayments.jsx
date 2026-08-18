import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Eye, FileCode, Brain, Lock, Shield, Zap, Check, Download, AlertCircle, CreditCard, RefreshCw, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import glyphLockAPI from '@/components/api/glyphLockAPI';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

// Test/Admin emails that bypass credential gate
const BYPASS_EMAILS = [
  'admin@glyphlock.io',
  'test@glyphlock.io',
  'carloearl@gmail.com',
  'glyphlock@gmail.com',
];

const isCredentialedUser = (user) => {
  if (!user) return false;
  // Admins always have access
  if (user.role === 'admin') return true;
  // Test users bypass
  if (BYPASS_EMAILS.includes(user.email?.toLowerCase())) return true;
  // Check if user has completed protocol verification
  if (user.credentialed === true || user.verified === true || user.protocol_verified === true) return true;
  // Check subscription status
  if (user.subscription_status === 'active' || user.subscription_tier) return true;
  return false;
};

// Product catalog removed - all access is now credential-gated via Protocol Verification
const productCatalog = [];

const featureIcons = {
  "Visual Cryptography": <Eye className="h-4 w-4 mr-2 text-cyan-400" />,
  "Blockchain": <Lock className="h-4 w-4 mr-2 text-purple-400" />,
  "GlyphBot": <Brain className="h-4 w-4 mr-2 text-blue-400" />,
  "QR": <FileCode className="h-4 w-4 mr-2 text-green-400" />,
  "Security": <Shield className="h-4 w-4 mr-2 text-red-400" />,
  "AI": <Zap className="h-4 w-4 mr-2 text-yellow-400" />
};

const getFeaturesList = (description) => {
  return description.split(',').map(f => f.trim()).filter(Boolean);
};

export default function BillingAndPayments({ user: propUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [billingStatus, setBillingStatus] = useState(null);
  const [billingHistory, setBillingHistory] = useState(null);
  const [loadingBillingData, setLoadingBillingData] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [currentUser, setCurrentUser] = useState(propUser || null);
  const [checkingAuth, setCheckingAuth] = useState(!propUser);

  // Fetch current user if not provided
  useEffect(() => {
    if (!propUser) {
      setCheckingAuth(true);
      base44.auth.me()
        .then(userData => setCurrentUser(userData))
        .catch(() => setCurrentUser(null))
        .finally(() => setCheckingAuth(false));
    }
  }, [propUser]);

  const user = currentUser;
  const hasCredentialAccess = isCredentialedUser(user);

  const fetchBillingData = async () => {
    setLoadingBillingData(true);
    try {
      const [statusData, historyData] = await Promise.all([
        glyphLockAPI.billing.getStatus(),
        glyphLockAPI.billing.getHistory()
      ]);
      setBillingStatus(statusData);
      setBillingHistory(historyData);
      toast.success('Billing data loaded');
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoadingBillingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBillingData();
    }
  }, [user]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');

    if (sessionId) {
      setLoading(true);
      glyphLockAPI.stripe.pollPaymentStatus(sessionId)
        .then(response => {
          setPaymentStatus(response.status);
          toast.success(`Payment ${response.status}`);
        })
        .catch(error => {
          console.error("Error polling Stripe session:", error);
          toast.error("Failed to retrieve payment status");
        })
        .finally(() => {
          setLoading(false);
          navigate(location.pathname, { replace: true });
        });
    }
  }, [location.search, navigate, location.pathname]);

  const handleCheckout = async (plan) => {
    setLoading(true);
    try {
      const response = await glyphLockAPI.stripe.startCheckout(plan);
      
      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        toast.error("Failed to get checkout URL");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(`Checkout failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const response = await glyphLockAPI.billing.downloadInvoice(invoiceId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleRetryPayment = async () => {
    setRetryingPayment(true);
    try {
      await glyphLockAPI.billing.retryInvoice(billingStatus.lastFailedInvoiceId);
      toast.success('Payment retry initiated');
      fetchBillingData();
    } catch (error) {
      console.error('Failed to retry payment:', error);
      toast.error('Failed to retry payment');
    } finally {
      setRetryingPayment(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setUpdatingPayment(true);
    try {
      toast.info('Opening payment method update...');
      window.open('https://billing.stripe.com/p/login/test_PLACEHOLDER', '_blank');
    } catch (error) {
      console.error('Failed to update payment method:', error);
      toast.error('Failed to update payment method');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Loading state
  if (checkingAuth) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Credential Gate - Non-credentialed users see this
  if (!hasCredentialAccess) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-900/90 border-2 border-amber-500/40 backdrop-blur-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <ShieldAlert className="w-10 h-10 text-amber-400" />
              </div>
              <CardTitle className="text-3xl font-black text-white">Credential Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 pt-4">
              <p className="text-slate-300 text-lg leading-relaxed">
                Access to billing and subscription modules requires <span className="text-amber-400 font-semibold">Protocol Verification</span> under the Master Covenant.
              </p>
              
              <div className="bg-slate-950/60 border border-slate-700/50 rounded-xl p-6 text-left space-y-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-cyan-400" />
                  What is Protocol Verification?
                </h3>
                <ul className="text-slate-400 text-sm space-y-2">
                  <li>• A controlled verification engagement ($12,000 USD)</li>
                  <li>• Determines credential eligibility under Covenant governance</li>
                  <li>• Required before accessing enterprise modules or subscriptions</li>
                  <li>• Produces proof-based determination, not opinions</li>
                </ul>
              </div>

              <div className="pt-4 space-y-3">
                <Link to={createPageUrl('Consultation')}>
                  <Button className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-6 text-lg">
                    <Shield className="w-5 h-5 mr-2" />
                    Request Protocol Verification
                  </Button>
                </Link>
                <Link to={createPageUrl('GovernanceHub')}>
                  <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 py-5">
                    Learn About the Master Covenant
                  </Button>
                </Link>
              </div>

              <p className="text-slate-500 text-xs pt-4">
                Already credentialed? Contact <a href="mailto:carloearl@glyphlock.com" className="text-cyan-400 hover:underline">carloearl@glyphlock.com</a> for account verification.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold text-center text-white mb-4">Billing & Payments</h1>
      <p className="text-xl text-center text-white/70 mb-12">Manage your subscriptions and purchases</p>

      {loading && (
        <div className="flex justify-center items-center mb-8">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="ml-3 text-white">Processing...</span>
        </div>
      )}

      {paymentStatus && (
        <div className="mb-8 p-4 rounded-lg bg-[#0A0F24]/80 border-[#00E4FF]/30 backdrop-blur-xl flex items-center justify-center">
          {paymentStatus === 'complete' ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
              <span className="text-white">Payment successful!</span>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500 mr-3" />
              <span className="text-white">Payment {paymentStatus}</span>
            </>
          )}
        </div>
      )}

      {loadingBillingData ? (
        <div className="space-y-6 mb-12">
          <Skeleton className="h-32 w-full bg-[#0A0F24]/80 border border-[#00E4FF]/20" />
          <Skeleton className="h-48 w-full bg-[#0A0F24]/80 border border-[#00E4FF]/20" />
        </div>
      ) : (
        <div>
          {/* Past Due Recovery Panel */}
          {billingStatus && (billingStatus.status === 'past_due' || billingStatus.status === 'payment_failed') && (
            <Card className="bg-[#0A0F24]/80 border-red-500/30 backdrop-blur-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-6 w-6" />
                  Payment Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-white/80">
                  <p className="mb-2">Your last payment failed. Please update your payment method or retry the payment.</p>
                  {billingStatus.gracePeriodEnd && (
                    <p className="text-yellow-400 text-sm">
                      Grace period ends: {formatDate(billingStatus.gracePeriodEnd)}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleUpdatePaymentMethod}
                    disabled={updatingPayment}
                    className="bg-gradient-to-r from-[#8C4BFF] to-[#00E4FF] hover:opacity-90"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {updatingPayment ? 'Opening...' : 'Update Payment Method'}
                  </Button>
                  <Button
                    onClick={handleRetryPayment}
                    disabled={retryingPayment}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {retryingPayment ? 'Retrying...' : 'Retry Payment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {billingStatus && (
            <Card className="bg-[#0A0F24]/80 border-[#8C4BFF]/20 backdrop-blur-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#8C4BFF]">Current Plan & License Tier</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/80">
                <div className="space-y-2">
                  <p><span className="font-semibold text-white">Plan:</span> {billingStatus.planName}</p>
                  <p><span className="font-semibold text-white">Status:</span> <span className={`${billingStatus.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>{billingStatus.status}</span></p>
                  <p><span className="font-semibold text-white">Renews:</span> {formatDate(billingStatus.renewalDate)}</p>
                  {billingStatus.trialEndDate && <p><span className="font-semibold text-white">Trial Ends:</span> {formatDate(billingStatus.trialEndDate)}</p>}
                  <div className="pt-2">
                    <p className="font-semibold text-white mb-1">License Tier:</p>
                    <div className="inline-block px-3 py-1 rounded-full bg-gradient-to-r from-[#8C4BFF] to-[#00E4FF] text-white font-bold">
                      {billingStatus.licenseTier || 'Starter'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><span className="font-semibold text-white">Price:</span> {formatCurrency(billingStatus.currentPrice)} / {billingStatus.interval}</p>
                  <div>
                    <p className="font-semibold text-white mb-2">Active Entitlements:</p>
                    <ul className="list-disc list-inside ml-2 space-y-1">
                      {billingStatus.entitlements && Object.entries(billingStatus.entitlements).map(([key, value]) => (
                        <li key={key} className={value ? 'text-green-400' : 'text-white/40'}>
                          {key}: {value ? 'Enabled' : 'Disabled'}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Flags */}
          {billingStatus && billingStatus.entitlements?.flags && (
            <Card className="bg-[#0A0F24]/80 border-yellow-500/20 backdrop-blur-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-yellow-400">Feature Flags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(billingStatus.entitlements.flags).map(([flag, enabled]) => (
                    <div
                      key={flag}
                      className={`p-3 rounded-lg border ${
                        enabled
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-semibold capitalize">
                          {flag.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {billingHistory && billingHistory.length > 0 && (
            <Card className="bg-[#0A0F24]/80 border-[#00E4FF]/20 backdrop-blur-xl mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-[#00E4FF]">Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-white/90">
                    <thead>
                      <tr className="border-b border-white/20">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((item, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4">{formatDate(item.date)}</td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(item.amount)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${item.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.invoiceId && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadInvoice(item.invoiceId)} 
                                className="text-cyan-400 hover:text-cyan-300"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* No pricing modules - all access is credential-gated */}
      <Card className="bg-slate-900/80 border-cyan-500/30 backdrop-blur-xl">
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
          <h3 className="text-xl font-bold text-white mb-2">Credential-Based Access</h3>
          <p className="text-slate-400 mb-4">
            All GlyphLock modules are provisioned through Protocol Verification under the Master Covenant.
          </p>
          <Link to={createPageUrl('Consultation')}>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-bold">
              Request Protocol Verification
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}