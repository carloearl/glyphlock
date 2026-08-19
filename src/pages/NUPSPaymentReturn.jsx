import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function notifyOpener(payload) {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(
      { type: "nups:stripe-payment-result", ...payload },
      window.location.origin,
    );
    return true;
  }
  return false;
}

export default function NUPSPaymentReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderNumber = searchParams.get("order_number");
  const canceled = searchParams.get("canceled") === "1";
  const [state, setState] = useState(canceled ? "canceled" : "checking");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let disposed = false;
    let closeTimer;

    const finish = (nextState, message, data = null) => {
      if (disposed) return;
      setState(nextState);
      setDetail(message);
      const notified = notifyOpener({
        status: nextState,
        order_number: orderNumber,
        data,
      });
      if (notified && (nextState === "succeeded" || nextState === "canceled")) {
        closeTimer = window.setTimeout(() => window.close(), 1200);
      }
    };

    async function reconcile() {
      if (canceled) {
        finish("canceled", "Checkout was canceled. No NUPS payment record was created.");
        return;
      }
      if (!sessionId || !orderNumber) {
        finish("failed", "The Stripe return URL is missing its session or order reference.");
        return;
      }

      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const response = await base44.functions.invoke("confirmGlyphBucksPayment", {
            checkout_session_id: sessionId,
            order_number: orderNumber,
          });
          const data = response?.data || {};
          if (data.success === true && data.payment_status === "succeeded") {
            finish("succeeded", "Stripe confirmed the payment and NUPS created the payment evidence record.", data);
            return;
          }
          if (data.error !== "PAYMENT_NOT_COMPLETE") {
            finish("failed", data.message || data.error || "Payment reconciliation failed.", data);
            return;
          }
        } catch (error) {
          const errorData = error?.response?.data || {};
          const retryable =
            error?.response?.status === 409 &&
            errorData.error === "PAYMENT_NOT_COMPLETE";
          if (!retryable) {
            finish(
              "failed",
              errorData.message || errorData.error || error?.message || "Payment reconciliation failed.",
            );
            return;
          }
        }

        if (attempt < 11) await sleep(2000);
      }

      finish("failed", "Stripe did not report a completed payment before the verification window ended.");
    }

    reconcile();
    return () => {
      disposed = true;
      if (closeTimer) window.clearTimeout(closeTimer);
    };
  }, [canceled, orderNumber, sessionId]);

  const content = {
    checking: {
      icon: Loader2,
      iconClass: "animate-spin text-cyan-300",
      title: "Verifying payment",
      message: "Confirming the Stripe Checkout Session and creating the NUPS evidence record.",
    },
    succeeded: {
      icon: CheckCircle2,
      iconClass: "text-emerald-300",
      title: "Payment confirmed",
      message: detail,
    },
    canceled: {
      icon: XCircle,
      iconClass: "text-amber-300",
      title: "Checkout canceled",
      message: detail,
    },
    failed: {
      icon: AlertTriangle,
      iconClass: "text-red-300",
      title: "Payment not confirmed",
      message: detail,
    },
  }[state] || {};

  const StatusIcon = content.icon || AlertTriangle;

  return (
    <main className="min-h-screen bg-slate-950 text-white grid place-items-center p-6">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/90 p-8 text-center shadow-2xl">
        <StatusIcon className={`mx-auto h-16 w-16 ${content.iconClass}`} />
        <h1 className="mt-5 text-2xl font-black">{content.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">{content.message}</p>
        {orderNumber && (
          <p className="mt-4 font-mono text-xs text-slate-500">Order {orderNumber}</p>
        )}
        <Button
          type="button"
          variant="outline"
          className="mt-7 w-full border-white/15"
          onClick={() => window.close()}
        >
          Close payment window
        </Button>
      </section>
    </main>
  );
}
