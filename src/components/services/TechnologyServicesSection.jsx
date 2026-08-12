import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { Cpu, ShieldCheck, GitBranch, Building2, Mic, CheckCircle2, Globe } from "lucide-react";

const TECH_SERVICES = [
  {
    icon: Cpu,
    title: "Custom Computer and CPU Builds",
    description:
      "Custom-built computers and workstations for venues, studios, business operations, security monitoring, and specialized software environments. Services may include hardware assembly, operating-system configuration, peripheral integration, testing, and deployment.",
  },
  {
    icon: ShieldCheck,
    title: "Security Software Deployment",
    description:
      "Installation and configuration of security software, access controls, system-hardening measures, monitoring tools, account-security settings, and operational security controls.",
  },
  {
    icon: GitBranch,
    title: "DevOps and Systems Integration",
    description:
      "Environment configuration, software deployment, systems integration, workflow implementation, operational testing, troubleshooting, infrastructure setup, and ongoing technical support.",
  },
  {
    icon: Building2,
    title: "NUPS and GlyphLock Platform Implementation",
    description:
      "Configuration and deployment of GlyphLock software and the NUPS audit, compliance, ERP, and point-of-sale platform for venue operations. Services may include system setup, workflow configuration, reporting, audit controls, payment-system integration, staff onboarding, and implementation support.",
  },
  {
    icon: Mic,
    title: "Recording Studio Technology Builds",
    description:
      "Custom studio-computer builds, recording-software setup, audio-interface and peripheral integration, equipment configuration, system optimization, testing, and operational deployment.",
  },
];

export default function TechnologyServicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="mb-16" aria-labelledby="technology-services-heading">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <h2 id="technology-services-heading" className="text-3xl md:text-4xl font-bold mb-4">
          <span className="text-white">Technology </span>
          <span className="bg-gradient-to-r from-blue-400 via-violet-500 to-emerald-400 bg-clip-text text-transparent">
            Services
          </span>
        </h2>
        <p className="text-white/70 max-w-3xl mx-auto text-base md:text-lg">
          GlyphLock provides custom technology services for venues, studios, and business operators.
          Our services combine computer systems, security, DevOps, systems integration, and
          implementation of the GlyphLock and NUPS platforms.
        </p>
      </motion.div>

      <div className="space-y-5 mb-8">
        {TECH_SERVICES.map((svc, idx) => (
          <motion.div
            key={svc.title}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -60 : 60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1 + idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card-dark border border-blue-500/30 rounded-xl p-5 md:p-7"
            style={{ background: "rgba(30, 58, 138, 0.2)", backdropFilter: "blur(16px)" }}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/50 flex-shrink-0">
                <svc.icon className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{svc.title}</h3>
                <p className="text-sm md:text-base text-white/75 leading-relaxed">{svc.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-card-dark border border-blue-500/30 rounded-xl p-6 md:p-8 text-center"
        style={{ background: "rgba(30, 58, 138, 0.2)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-start justify-center gap-2 max-w-3xl mx-auto mb-6">
          <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
          <p className="text-white/75 text-sm md:text-base text-left">
            Each project is scoped according to the customer's operational requirements. Deliverables
            may include hardware configuration, software deployment, security controls, platform
            integration, testing, documentation, and implementation support.
          </p>
        </div>
        <Link to={createPageUrl("Consultation")}>
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white">
            Request a Technology Consultation
          </Button>
        </Link>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/50">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Payment architecture is processor-neutral: clients may keep their existing merchant processing or add a supported API/webhook integration.</span>
        </div>
      </motion.div>
    </section>
  );
}