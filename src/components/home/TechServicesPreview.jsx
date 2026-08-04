import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Cpu, ShieldCheck, Building2 } from "lucide-react";

const PREVIEW_CARDS = [
  {
    icon: Cpu,
    title: "Custom Systems and Studio Builds",
    description:
      "Custom computers, workstations, and recording-studio technology builds — assembled, configured, tested, and deployed for your operation.",
    color: "#06b6d4",
  },
  {
    icon: ShieldCheck,
    title: "Security and DevOps Deployment",
    description:
      "Security software installation, system hardening, access controls, environment configuration, systems integration, and ongoing technical support.",
    color: "#7c3aed",
  },
  {
    icon: Building2,
    title: "NUPS and GlyphLock Implementation",
    description:
      "Setup and deployment of the NUPS audit, compliance, ERP, and point-of-sale platform, with workflow configuration and staff onboarding.",
    color: "#10b981",
  },
];

export default function TechServicesPreview() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 py-12" aria-labelledby="tech-services-preview-heading">
      <div className="text-center mb-10">
        <h2 id="tech-services-preview-heading" className="text-3xl md:text-4xl font-black text-white mb-4">
          Technology Services{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            Built Around Your Operations
          </span>
        </h2>
        <p className="text-white/70 text-base md:text-lg max-w-3xl mx-auto">
          GlyphLock provides custom technology services for venues, studios, and business operators —
          combining computer systems, security, DevOps, systems integration, and implementation of the
          GlyphLock and NUPS platforms.
        </p>
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {PREVIEW_CARDS.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: idx * 0.12 }}
            whileHover={{ y: -6 }}
            className="rounded-xl p-6 h-full transition-all duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(10,1,24,0.95), rgba(15,5,35,0.9))",
              border: `1px solid ${card.color}44`,
              boxShadow: `0 0 18px ${card.color}22`,
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
              style={{ background: `${card.color}18`, border: `1px solid ${card.color}60` }}
            >
              <card.icon className="w-6 h-6" style={{ color: card.color }} />
            </div>
            <h3 className="text-white font-bold text-base mb-2">{card.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed">{card.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="text-center">
        <Link to={createPageUrl("Services")}>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
            View All Services
          </Button>
        </Link>
      </div>
    </section>
  );
}