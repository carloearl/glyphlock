import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/index.ts";
import { Button } from "@/components/ui/button";
import { 
  Shield, Zap, Brain, Code, Target, Users, 
  Sparkles, Crown, Lock, Blocks, FileText, 
  Globe, TrendingUp, Award, DollarSign, CheckCircle2, Info
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import { motion, useInView } from "framer-motion";

export default function About() {
  const heroRef = useRef(null);
  const originRef = useRef(null);
  const missionRef = useRef(null);
  const pivotRef = useRef(null);
  const leadershipRef = useRef(null);
  const techRef = useRef(null);
  const ctaRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const originInView = useInView(originRef, { once: true, amount: 0.3 });
  const missionInView = useInView(missionRef, { once: true, amount: 0.3 });
  const pivotInView = useInView(pivotRef, { once: true, amount: 0.3 });
  const leadershipInView = useInView(leadershipRef, { once: true, amount: 0.2 });
  const techInView = useInView(techRef, { once: true, amount: 0.3 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.4 });

  const leadership = [
    {
      name: "Carlo Rene Earl",
      title: "Founder & Chief Executive Officer (CEO)",
      role: "Carlo Earl is the Founder and Chief Executive Officer of GlyphLock, responsible for shaping the company's core vision, technological direction, and long-term strategic roadmap. With a multidisciplinary background that spans creative design, systems thinking, and security innovation, Carlo leads GlyphLock with a rare combination of technical insight and business acuity. Under his leadership, GlyphLock has developed a proprietary ecosystem centered on quantum-resistant authentication, steganographic glyph technologies, blockchain-anchored audit systems, and secure AI-driven contract automation. Carlo oversees the architecture of the Master Covenant framework, the company's cryptographic compliance infrastructure, and the intellectual property portfolio that forms the backbone of GlyphLock's market advantage. His executive focus lies in enterprise integration, cross-industry scalability, and future-proofed digital identity. Carlo's governance blends creative innovation with operational discipline, positioning GlyphLock as a rising authority in secure identity verification, AI policy, and next-generation authentication ecosystems.",
      icon: Crown
    },
    {
      name: "Jacub Lough",
      title: "Chief Financial Officer (CFO) & Chief Strategy Officer (CSO)",
      role: "As Chief Financial Officer and Chief Strategy Officer, Jacub Lough directs GlyphLock's financial operations, capital structure, strategic planning, and long-range corporate development. A long-term collaborator with Carlo in the music industry and marketing sectors, Jacub is also the owner of IceVault88. He plays a central role in risk management, compliance oversight, and multi-vertical expansion planning across enterprise, government, medical, defense, and high-integrity commercial environments. Jacub brings a deep analytical framework rooted in disciplined financial modeling, operational forecasting, and scalable growth alignment. His background in asset management, organizational architecture, and creative-industry operations enables him to bridge financial precision with practical execution. At the strategic level, Jacub evaluates market positioning, prepares valuation pathways, supports IP-driven expansion, and leads scenario planning for acquisition readiness, licensing partnerships, and international deployment models. His dual role strengthens GlyphLock's foundation for sustainable, compliant, and high-credibility growth in rapidly evolving security and AI markets.",
      icon: TrendingUp
    },
    {
      name: "Collin Vanderginst",
      title: "Chief Technology Officer (CTO)",
      role: "Collin Vanderginst, GlyphLock's Chief Technology Officer, oversees the design, deployment, and engineering integrity of the company's technical infrastructure. His expertise spans advanced systems engineering, security architecture, distributed surveillance networks, and high-availability backend environments. A key contributor to GlyphLock's foundational prototypes, Collin converts conceptual innovations into functional, scalable software systems. He currently manages all Jiffy Lube surveillance SEC systems across Arizona and leads the surveillance chore integration for the NUPS Point of Sale system. He manages engineering operations, DevSecOps processes, platform optimization, and system-level integrations across the GlyphLock ecosystem — including authentication engines, SDK frameworks, and enterprise-grade API infrastructure. Collin brings a disciplined, methodical engineering philosophy that ensures reliability, resilience, and security at every level of the platform. His work underpins the company's stability as GlyphLock continues expanding into mission-critical, compliance-sensitive industries.",
      icon: Code
    },
    {
      name: "Angel Sticka",
      title: "Director of Administration, Regulatory Affairs & Operational Compliance",
      role: "Angel Sticka serves as GlyphLock's Director of Administration, Regulatory Affairs, and Operational Compliance. She manages corporate documentation, legal coordination, organizational governance, and procedural execution across all departments. Angel oversees the administrative systems that support GlyphLock's operational rhythm — including contract handling, licensing paperwork, compliance tracking, and executive scheduling. Her work ensures alignment between product development, legal processes, and organizational structure. Her administrative precision provides stability throughout GlyphLock's rapid innovation cycles, supporting executive leadership and acting as a central point of continuity for filings, deadlines, communications, and organizational records. Angel's role safeguards operational integrity as the company scales into more regulated markets.",
      icon: Shield
    }
  ];



  const technologies = [
    "QR identity imaging",
    "AI site building engine",
    "Master Covenant authorship",
    "Interactive hotspot layers",
    "Blockchain timestamping",
    "Image Lab generation",
    "Open source framework",
    "Ecosystem-scale verification",
    "Cross-platform identity",
    "Creative sovereignty tools",
    "Decentralized ownership proof",
    "Extensible infrastructure"
  ];

  const whatGlyphLockIs = [
    "A security platform",
    "A legal engine",
    "An AI governance system",
    "A multi-modal truth verification suite",
    "A POS security system",
    "A quantum-resistant encryption network",
    "A digital fraud prevention system",
    "A global IP shield",
    "A forensic evidence protocol",
    "A multi-agent operating framework"
  ];

  return (
    <>
      <SEOHead 
        title="About GlyphLock - Protected Creative Ecosystem for Verified Digital Worlds"
        description="Born from a question: What if imagery itself carried intelligence? GlyphLock is an open framework combining QR identity, site building, and Master Covenant architecture for creative sovereignty at scale."
        keywords="GlyphLock about, creative ecosystem, Carlo Earl founder, open source framework, Master Covenant authorship, QR identity layer, site building infrastructure, verified ownership, digital sovereignty"
        url="/about"
      />
      
      <div className="min-h-screen bg-black text-white pt-24 pb-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00E4FF]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#8C4BFF]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-10">
          
          {/* HERO */}
          <div ref={heroRef} className="text-center mb-16 md:mb-24">
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black mb-4 md:mb-8 tracking-tighter font-space"
            >
              ABOUT <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">GLYPHLOCK</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-3xl text-[#00E4FF] font-bold max-w-4xl mx-auto leading-tight"
            >
              Protected Creative Ecosystem
            </motion.p>
          </div>

          {/* ORIGIN */}
          <motion.div 
            ref={originRef}
            initial={{ opacity: 0, y: 60 }}
            animate={originInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-8 md:p-12 mb-12 border border-[#00E4FF]/20"
          >
            <motion.h2 
              initial={{ opacity: 0, x: -80 }}
              animate={originInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-4 font-space"
            >
              <Sparkles className="w-8 h-8 text-[#00E4FF]" />
              Our Origin
            </motion.h2>
            <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
              <p>
                GlyphLock did not begin as a company. It began as a rupture in expectation. A moment where a simple conversation forced a reexamination of what images are allowed to be.
              </p>
              <p>
                In early 2025 a discussion about camouflage and military patterning exposed a deeper layer of reality. Patterns do not only hide bodies. Patterns can carry intention. The question that followed was not casual. It was catalytic. <span className="text-[#00E4FF] font-bold italic">What if imagery was not concealment but intelligence itself.</span> What if a surface could store encrypted meaning, respond to the environment, and actively defend the information it contained. That realization did not feel like invention. It felt like discovery. A category that had always existed but had not yet been named. <span className="text-white font-semibold">Images as living infrastructure.</span>
              </p>
              <p className="text-white font-semibold">
                Once seen it could not be unseen.
              </p>
              <p>
                The early path was punishing. Progress slowed under financial pressure. Resources were stretched thin. Collaborators appeared and disappeared. Promises collapsed. Momentum was lost and rebuilt more than once. There were periods where the weight of the project collided directly with the realities of family life, responsibility, and survival. The vision did not fail because it was weak. It nearly failed because building something new demands endurance that most systems are never required to prove.
              </p>
              <p>
                At several points the project stood at the edge of abandonment. Not because the idea lacked power but because the cost of carrying it forward was real. The decision that followed defined everything that came next. <span className="text-[#00E4FF] font-bold">Strip the system to its core. Remove dependency on unreliable actors. Bootstrap the architecture. Trust only what can be built, tested, and verified.</span>
              </p>
              <p className="text-white font-semibold">
                That pivot transformed GlyphLock from an idea into a discipline.
              </p>
              <p>
                Every component from that moment forward had to survive stress. Every design choice had to justify itself under hostile conditions. If a mechanism could be broken it was broken deliberately and rebuilt stronger. If a structure failed it was replaced. Nothing ornamental survived. Only what functioned under pressure remained.
              </p>
              <p className="text-white font-semibold">
                Constraint became the forge.
              </p>
              <p>
                From that environment emerged a protected creative ecosystem engineered for endurance. Encrypted glyph signatures capable of anchoring authorship. Interactive image intelligence that treats visuals as active systems rather than static artifacts. Quantum resistant identity layers built to outlast current attack models. And the Master Covenant, a structural framework that binds authorship verification, auditability, and digital truth into a unified operating architecture.
              </p>
              <p>
                The Master Covenant is not decoration. It is a spine. It ensures that what is created inside the ecosystem carries proof of origin, traceable lineage, and resistance to quiet erasure. <span className="text-white font-semibold">Work cannot simply disappear. Authorship cannot be casually rewritten. Systems cannot drift without record.</span> Integrity is embedded at the structural level.
              </p>
              <p>
                GlyphLock was not assembled for optics. It was not shaped in a boardroom or optimized for investor theater. It was constructed in the presence of pressure, scarcity, and repeated failure. That environment did not weaken the system. It filtered it. What remains is architecture that has already survived adversity before ever meeting the public.
              </p>
              <p className="text-[#00E4FF] font-semibold">
                This origin matters because infrastructure inherits the character of its birth.
              </p>
              <p>
                Systems designed in comfort behave differently than systems forged under constraint. GlyphLock was forced to prove its resilience before it was allowed to scale. That proof is embedded in its design philosophy. Expect stress. Engineer for it. Assume adversarial conditions. Build anyway.
              </p>
              <p className="text-white font-semibold">
                The result is not a product. It is a stance.
              </p>
              <p>
                GlyphLock exists because the idea refused to die and the people carrying it refused to surrender to friction. The ecosystem stands on persistence, technical rigor, and the belief that creators deserve environments where their work is defended as fiercely as it is imagined.
              </p>
              <p>
                Systems born under pressure do not panic when pressure returns. They hold. They adapt. They continue.
              </p>
              <p className="text-[#00E4FF] font-bold text-xl">
                And that is why GlyphLock exists.
              </p>
            </div>
          </motion.div>

          {/* MISSION */}
          <div ref={missionRef} className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div 
              initial={{ opacity: 0, x: -80 }}
              animate={missionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl p-8 border border-[#8C4BFF]/20 bg-gradient-to-br from-[#0A0F24] to-black"
            >
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3 font-space">
                <Target className="w-8 h-8 text-[#8C4BFF]" />
                Our Mission
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                GlyphLock's mission:<br />
                <span className="text-[#8C4BFF] font-bold text-xl">
                  Build infrastructure for creative sovereignty. 
                  Make ownership verifiable. Make authorship provable. 
                  Make digital worlds trustworthy by design.
                </span>
              </p>
              <p className="text-xl text-white font-bold mt-8">
                GlyphLock is not a security product.<br/>
                <span className="text-[#00E4FF]">It is an open framework for verified creation.</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 80 }}
              animate={missionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl p-8 border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 to-black"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-500" />
                We Enable
              </h2>
              <div className="space-y-3">
                {[
                  "Verified creative ownership",
                  "QR-based asset identity",
                  "AI-powered site building",
                  "Blockchain authorship proof",
                  "Interactive image ecosystems",
                  "Covenant-backed contracts",
                  "Open source extensibility",
                  "Cross-platform verification",
                  "Decentralized creative infrastructure",
                  "Limitless construction at scale"
                ].map((capability, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full flex-shrink-0" />
                    <span className="text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* THE PIVOT */}
          <motion.div 
            ref={pivotRef}
            initial={{ opacity: 0, y: 60 }}
            animate={pivotInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-8 md:p-12 mb-12 border border-[#00E4FF]/20"
          >
            <motion.h2 
              initial={{ opacity: 0, x: -80 }}
              animate={pivotInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-4 font-space"
            >
              <Zap className="w-8 h-8 text-[#00E4FF]" />
              The Pivot
            </motion.h2>
            <p className="text-gray-300 leading-relaxed mb-8 text-lg">
              GlyphLock did <span className="font-bold text-white">not</span> start as a security company. 
              It started as an interactive-image experiment. 
              Carlo and Collin thought they were building "smart QR codes." 
              Then the technology outgrew the category.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                "QR Identity", "Site Builder", "Image Lab", "Blockchain", "Covenant",
                "Authorship", "Hotzones", "AI Audit", "Open Source", "Ecosystem"
              ].map((tech, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-xs font-bold text-[#00E4FF] uppercase tracking-wide">
                  {tech}
                </div>
              ))}
            </div>
            
            <div className="bg-[#00E4FF]/10 border border-[#00E4FF]/30 rounded-xl p-6 text-center">
              <p className="text-xl text-[#00E4FF] font-bold">
                From smart QR codes to a complete creative infrastructure. <br/>
                The framework for building verified digital ecosystems.
              </p>
            </div>
          </motion.div>

          {/* LEADERSHIP */}
          <div ref={leadershipRef} className="mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              animate={leadershipInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl font-black text-white mb-12 text-center font-space"
            >
              LEADERSHIP
            </motion.h2>
            <div className="grid gap-6">
              {leadership.map((leader, idx) => {
                const Icon = leader.icon;
                return (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -80 : 80 }}
                    animate={leadershipInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 1, delay: 0.2 + (idx * 0.15), ease: [0.16, 1, 0.3, 1] }}
                    className="glass-card rounded-xl p-8 border border-[#8C4BFF]/20 hover:border-[#8C4BFF]/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#00E4FF] to-[#8C4BFF] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(140,75,255,0.3)]">
                        <Icon className="w-10 h-10 text-black" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1 font-space">{leader.name}</h3>
                        <div className="text-[#00E4FF] font-bold text-sm uppercase tracking-widest mb-4">{leader.title}</div>
                        <p className="text-gray-400 leading-relaxed">{leader.role}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>



          {/* TECHNOLOGY STACK */}
          <motion.div 
            ref={techRef}
            initial={{ opacity: 0, y: 60 }}
            animate={techInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-8 md:p-12 border border-[#00E4FF]/20 mb-12"
          >
            <motion.h2 
              initial={{ opacity: 0, x: -80 }}
              animate={techInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl font-bold text-white mb-8 flex items-center gap-4 font-space"
            >
              <Blocks className="w-8 h-8 text-[#00E4FF]" />
              The Technology Stack
            </motion.h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technologies.map((tech, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 30 }}
                  animate={techInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.3 + (idx * 0.05), ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-[#00E4FF]/10 hover:border-[#00E4FF]/30 transition-colors"
                >
                  <div className="w-2 h-2 bg-[#00E4FF] rounded-full flex-shrink-0" />
                  <span className="text-gray-200 font-medium">{tech}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* SERVICE FEES */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card rounded-2xl p-8 md:p-12 mb-12 border border-[#8C4BFF]/20"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 flex items-center gap-4 font-space">
              <DollarSign className="w-8 h-8 text-[#8C4BFF]" />
              Service Fees
            </h2>
            <p className="text-gray-400 mb-10 text-lg">
              Transparent, straightforward pricing across every tier of the GlyphLock ecosystem.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  tier: "Free",
                  price: "$0",
                  period: "/ month",
                  color: "border-white/20",
                  accent: "text-white",
                  badge: null,
                  features: [
                    "50 QR generations / mo",
                    "20 AI images / mo",
                    "1,000 API calls / mo",
                    "1 GB storage",
                    "Basic blockchain tools",
                    "Community support"
                  ]
                },
                {
                  tier: "Professional",
                  price: "$49",
                  period: "/ month",
                  color: "border-[#00E4FF]/50",
                  accent: "text-[#00E4FF]",
                  badge: "Most Popular",
                  features: [
                    "1,000 QR generations / mo",
                    "500 AI images / mo",
                    "100,000 API calls / mo",
                    "50 GB storage",
                    "Full blockchain suite",
                    "Priority support",
                    "Custom voice personas",
                    "Advanced analytics"
                  ]
                },
                {
                  tier: "Enterprise",
                  price: "$199",
                  period: "/ month",
                  color: "border-[#8C4BFF]/50",
                  accent: "text-[#8C4BFF]",
                  badge: "Full Access",
                  features: [
                    "Unlimited QR generations",
                    "Unlimited AI images",
                    "Unlimited API calls",
                    "Unlimited storage",
                    "Master Covenant suite",
                    "Dedicated account manager",
                    "SLA guarantee",
                    "Custom integrations",
                    "NUPS POS integration"
                  ]
                }
              ].map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative bg-white/5 border-2 ${plan.color} rounded-2xl p-6 flex flex-col`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${plan.accent} bg-black border ${plan.color}`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <div className={`text-sm font-bold uppercase tracking-widest mb-2 ${plan.accent}`}>{plan.tier}</div>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-gray-400 mb-1">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.accent}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <div className="flex items-start gap-3 bg-[#8C4BFF]/10 border border-[#8C4BFF]/30 rounded-xl p-4">
              <Info className="w-5 h-5 text-[#8C4BFF] flex-shrink-0 mt-0.5" />
              <p className="text-gray-400 text-sm">
                All plans include access to the GlyphLock open framework and core platform tools. Add-ons and custom enterprise agreements available — contact us for details. Usage resets on your monthly billing cycle date.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div 
            ref={ctaRef}
            initial={{ opacity: 0, y: 70, scale: 0.92 }}
            animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl p-12 text-center bg-gradient-to-b from-[#001F54] to-black border border-[#00E4FF]/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            {/* Purple grid overlay */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `
                linear-gradient(rgba(168,85,247,0.7) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139,92,246,0.7) 1px, transparent 1px)
              `,
              backgroundSize: '30px 30px'
            }} />
            <div className="relative z-10">
              <motion.h2 
                initial={{ opacity: 0, x: -100 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl font-black text-white mb-6 font-space"
              >
                READY TO BUILD YOUR ECOSYSTEM?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: 100 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-gray-400 mb-10 text-xl max-w-2xl mx-auto"
              >
                Start with GlyphLock's open framework for verified creative infrastructure.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
              >
                <Link to={createPageUrl("Consultation")}>
                  <Button 
                    className="bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] hover:scale-105 transition-transform text-white text-lg font-bold uppercase tracking-wide px-10 py-6 shadow-[0_0_30px_rgba(0,228,255,0.3)] border-none"
                    aria-label="Start building with GlyphLock - Request consultation"
                  >
                    Start Building
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}