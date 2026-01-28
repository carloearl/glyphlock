import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function FakeGoogleLogin({ redirectTo = "/dashboard" }) {
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleClick = () => {
    setShowEmailPrompt(true);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setIsLoading(true);
      await base44.auth.magicLinkLogin({
        email: email.trim(),
        redirectTo: redirectTo
      });
      toast.success("Magic link sent! Check your email.");
      setShowEmailPrompt(false);
      setEmail("");
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error("Failed to send magic link. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={handleGoogleClick}
        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 border border-cyan-500/30 transition-all shadow-sm hover:shadow-md h-12"
      >
        <Lock className="w-5 h-5" />
        <span>Continue with Email</span>
      </Button>

      <Dialog open={showEmailPrompt} onOpenChange={setShowEmailPrompt}>
        <DialogContent className="glass-royal border-cyan-500/50 bg-black/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Secure Email Authentication</DialogTitle>
            <DialogDescription className="text-white/70">
              Enter your email to receive a secure sign-in link
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMagicLink} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="magic-email" className="text-white">Email Address</Label>
              <Input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="bg-blue-900/30 text-white border-blue-500/30 mt-2"
                disabled={isLoading}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}