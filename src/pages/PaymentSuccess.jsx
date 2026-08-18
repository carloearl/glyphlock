import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock3,
  Loader2,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const CONFIRMED_STATUSES = new Set(["active", "trialing", "paid"]);
const PENDING_STATUSES = new Set(["pending", "open", "incomplete", "processing"]);

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [verification, setVerification] = useState({ state: "checking", detail: null });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!sessionId) {
        setVerification({ state: "invalid", detail: "No Checkout Session was provided." });
        return;
      }

      try {
        const response = await base44.functions.invoke("stripePoll", { sessionId });
        if (cancelled) return;
        const data = response?.data || {};
        const normalizedStatus = String(data.status || "unknown").toLowerCase();
        const paymentStatus = String(data.paymentStatus || "").toLowerCase();

        if (CONFIRMED_STATUSES.has(normalizedStatus) || paymentStatus === "paid") {
          setVerification({ state: "confirmed", detail: data });
          setShowConfetti(true);
        } else if (PENDING_STATUSES.has(normalizedStatus)) {
          setVerification({ state: "pending", detail: data });
        } else {
          setVerification({ state: "unconfirmed", detail: data });
        }
      } catch (error) {
        if (!cancelled) {
          setVerification({
            state: "error",
            detail: error?.response?.data?.error || error?.message || "Payment verification failed.",
          });
        }
      }
    }

    verifySession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!showConfetti) return undefined;
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [showConfetti]);

  const confirmed = verification.state === "confirmed";
  const checking = verification.state === "checking";
  const pending = verification.state === "pending";

  const statusContent = checking
    ? {
        icon: Loader2,
        iconClass: "text-[#00E4FF] animate-spin",
        title: "VERIFYING PAYMENT",
        message: "Confirming this Checkout Session with Stripe.",
        border: "border-[#00E4FF]/30",
      }
    : confirmed
      ? {
          icon: CheckCircle,
          iconClass: "text-[#00E4FF]",
          title: "PAYMENT CONFIRMED",
          message: "Stripe confirmed the payment and the webhook will finalize account access.",
          border: "border-[#00E4FF]/30",
        }
      : pending
        ? {
            icon: Clock3,
            iconClass: "text-amber-300",
            title: "PAYMENT PENDING",
            message: "Stripe has not reported a completed payment yet. Access remains unchanged until confirmation.",
            border: "border-amber-300/30",
          }
        : {
            icon: AlertTriangle,
            iconClass: "text-red-300",
            title: "PAYMENT NOT CONFIRMED",
            message: "This page could not verify a completed payment. No access was granted from the browser redirect.",
            border: "border-red-300/30",
          };

  const StatusIcon = statusContent.icon;

  return (
    <>
      <SEOHead title={`${statusContent.title} - GlyphLock`} />
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00E4FF]/20 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-[#8C4BFF]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(30)].map((_, index) => (
              <motion.div
                key={index}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-10%",
                  background: index % 2 === 0 ? "#00E4FF" : "#8C4BFF",
                }}
                animate={{
                  y: ["0vh", "110vh"],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl w-full relative z-10"
        >
          <div className={`bg-gradient-to-br from-[#0A0F24]/90 to-black/80 backdrop-blur-2xl border ${statusContent.border} rounded-3xl p-8 md:p-12 shadow-[0_0_60px_rgba(0,228,255,0.2)]`}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-8"
            >
              <StatusIcon className={`w-24 h-24 mx-auto ${statusContent.iconClass}`} strokeWidth={1.5} />
            </motion.div>

            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black mb-4 font-space">
                <span className="text-transparent bg-gradient-to-r from-[#00E4FF] via-[#8C4BFF] to-[#9F00FF] bg-clip-text">
                  {statusContent.title}
                </span>
              </h1>
              <p className="text-lg text-gray-300">{statusContent.message}</p>
              {sessionId && (
                <p className="text-xs text-gray-600 mt-4 font-mono">
                  Session: {sessionId.slice(0, 20)}...
                </p>
              )}
            </div>

            {confirmed && (
              <div className="grid grid-cols-3 gap-3 mb-10">
                {[
                  { icon: Shield, label: "Verified" },
                  { icon: Zap, label: "Webhook queued" },
                  { icon: Sparkles, label: "Account updating" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 rounded-xl bg-white/5 border border-[#00E4FF]/20">
                    <item.icon className="w-7 h-7 text-[#00E4FF] mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {confirmed && (
                <Link to={createPageUrl("CommandCenter")} className="block">
                  <Button className="w-full bg-gradient-to-r from-[#00E4FF] to-[#0099FF] hover:to-[#00E4FF] text-black font-bold text-lg py-6 group">
                    <span>Open Command Center</span>
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
              <Link to={createPageUrl("BillingAndPayments")} className="block">
                <Button variant="outline" className="w-full border-[#8C4BFF]/50 text-[#8C4BFF] hover:bg-[#8C4BFF]/10 py-6 text-lg">
                  Review Billing Status
                </Button>
              </Link>
              <Link to={createPageUrl("Home")} className="block">
                <Button variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/5 py-6">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}