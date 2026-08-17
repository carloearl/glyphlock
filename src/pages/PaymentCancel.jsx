import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

export default function PaymentCancel() {
  return (
    <>
      <SEOHead title="Payment Cancelled - GlyphLock" />
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8C4BFF]/10 rounded-full blur-[120px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] opacity-5"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-lg w-full relative z-10"
        >
          <div className="bg-gradient-to-br from-[#0A0F24]/90 to-black/80 backdrop-blur-2xl border border-[#8C4BFF]/30 rounded-3xl p-10 shadow-[0_0_40px_rgba(140,75,255,0.2)]">
            
            {/* Warning Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-[#8C4BFF]/20 rounded-full blur-2xl"></div>
              <AlertCircle className="w-24 h-24 text-[#8C4BFF] mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(140,75,255,0.6)]" strokeWidth={1.5} />
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl font-black mb-4 font-space text-white">
                PAYMENT <span className="text-[#8C4BFF]">CANCELLED</span>
              </h1>
              <p className="text-lg text-gray-300 mb-2">
                Your checkout session was cancelled
              </p>
              <p className="text-sm text-gray-500">
                No charges were made to your account
              </p>
            </motion.div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 border border-[#8C4BFF]/20 rounded-xl p-6 mb-8"
            >
              <p className="text-sm text-gray-400 mb-3">
                <span className="text-[#8C4BFF] font-bold">Need help?</span> Our team is here to assist you with any questions about our plans.
              </p>
              <Link to={createPageUrl("Consultation")} className="text-[#00E4FF] text-sm font-semibold hover:underline inline-flex items-center gap-1">
                Schedule a consultation
                <ArrowLeft className="w-3 h-3 rotate-180" />
              </Link>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-4"
            >
              <Link to={createPageUrl("Pricing")} className="block">
                <Button className="w-full bg-gradient-to-r from-[#8C4BFF] to-[#6B3ACC] hover:to-[#8C4BFF] text-white font-bold text-lg py-6 shadow-[0_0_20px_rgba(140,75,255,0.3)] hover:shadow-[0_0_30px_rgba(140,75,255,0.5)] transition-all group">
                  <RefreshCw className="mr-2 w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  View Plans Again
                </Button>
              </Link>
              <Link to={createPageUrl("Home")} className="block">
                <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:text-white hover:bg-white/5 hover:border-white/30 py-6 text-lg">
                  <Home className="mr-2 w-5 h-5" />
                  Return Home
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Bottom note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-center text-gray-500 text-xs mt-6"
          >
            Questions? Contact carloearl@glyphlock.com
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}