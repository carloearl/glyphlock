import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Shield, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function EntertainerCheckIn() {
  const [user, setUser] = useState(null);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [contractText, setContractText] = useState("");

  useEffect(() => {
    checkAuth();
    loadContract();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      base44.auth.redirectToLogin(window.location.href);
    }
  };

  const loadContract = () => {
    setContractText(`ENTERTAINER DIGITAL SUB-CONTRACT

By signing below, I acknowledge and agree to the following terms:

1. I am an independent contractor providing entertainment services.
2. I understand and accept the commission structure and payment terms.
3. I will conduct myself professionally and follow all venue policies.
4. I authorize the venue to process payments and track my performance metrics.
5. This digital signature is legally binding and non-repudiable.

Digital Signature Timestamp: ${new Date().toISOString()}
IP Address will be logged for verification purposes.`);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!signature.trim()) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke('entertainerCheckIn', {
        signature,
        entertainer_id: user.id,
        location: "Main Floor"
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        toast.error('Check-in failed. Please try again.');
      }
    } catch (error) {
      toast.error('Check-in failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-glyphlock-dark text-glyphlock-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-glyphlock-off-dark border-glyphlock-brand">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4 text-glyphlock-primary">Check-In Successful!</h1>
            <p className="text-glyphlock-secondary mb-6">
              Your contract has been digitally signed and verified. You're now checked in.
            </p>
            <Button className="btn-primary-glyphlock w-full" onClick={() => window.location.reload()}>
              Check In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-glyphlock-dark text-glyphlock-primary py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-glyphlock-brand mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-2 text-glyphlock-primary">Entertainer Check-In</h1>
          <p className="text-glyphlock-secondary">Digital Contract & Signature System</p>
        </div>

        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <Clock className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-glyphlock-primary">
            <strong>Secure Check-In:</strong> Your signature will be cryptographically timestamped with your IP address and user agent for non-repudiation.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleCheckIn} className="space-y-6">
          <Card className="bg-glyphlock-off-dark border-gray-700">
            <CardHeader>
              <CardTitle className="text-glyphlock-primary">Contract Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={contractText}
                readOnly
                rows={12}
                className="bg-gray-800 border-gray-600 text-glyphlock-primary font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card className="bg-glyphlock-off-dark border-gray-700">
            <CardHeader>
              <CardTitle className="text-glyphlock-primary">Digital Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-glyphlock-primary">Full Name (Type to Sign)</Label>
                <Input
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  className="bg-gray-800 border-gray-600 text-glyphlock-primary"
                  required
                />
              </div>

              {user && (
                <div className="text-sm text-glyphlock-secondary space-y-1">
                  <p>Signing as: <strong className="text-glyphlock-primary">{user.email}</strong></p>
                  <p>Timestamp: <strong className="text-glyphlock-primary">{new Date().toLocaleString()}</strong></p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !signature.trim()}
                className="btn-primary-glyphlock w-full"
              >
                {loading ? 'Processing...' : 'Sign Contract & Check In'}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}