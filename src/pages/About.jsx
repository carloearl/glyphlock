import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  Shield, Zap, Brain, Code, Target, Users, 
  Sparkles, Crown, Lock, Blocks, FileText, 
  Globe, TrendingUp, Award
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
      role: "Carlo Earl is the Founder and Chief Executive Officer of GlyphLock, responsible for shaping the company’s core vision, technological direction, and long-term strategic roadmap. With a multidisciplinary background that spans creative design, systems thinking, and security innovation, Carlo leads GlyphLock with a rare combination of technical insight and business acuity. Under his leadership, GlyphLock has developed a proprietary ecosystem centered on quantum-resistant authentication, steganographic glyph technologies, blockchain-anchored audit systems, and secure AI-driven contract automation. Carlo oversees the architecture of the Master Covenant framework, the company’s cryptographic compliance infrastructure, and the intellectual property portfolio that forms the backbone of GlyphLock’s market advantage. His executive focus lies in enterprise integration, cross-industry scalability, and future-proofed digital identity. Carlo’s governance blends creative innovation with operational discipline, positioning GlyphLock as a rising authority in secure identity verification, AI policy, and next-generation authentication ecosystems.",
      icon: Crown
    },
    {
      name: "Jacub Lough",
      title: "Chief Financial Officer (CFO) & Chief Strategy Officer (CSO)",
      role: "As Chief Financial Officer and Chief Strategy Officer, Jacub Lough directs GlyphLock’s financial operations, capital structure, strategic planning, and long-range corporate development. A long-term collaborator with Carlo in the music industry and marketing sectors, Jacub is also the owner of IceVault88. He plays a central role in risk management, compliance oversight, and multi-vertical expansion planning across enterprise, government, medical, defense, and high-integrity commercial environments. Jacub brings a deep analytical framework rooted in disciplined financial modeling, operational forecasting, and scalable growth alignment. His background in asset management, organizational architecture, and creative-industry operations enables him to bridge financial precision with practical execution. At the strategic level, Jacub evaluates market positioning, prepares valuation pathways, supports IP-driven expansion, and leads scenario planning for acquisition readiness, licensing partnerships, and international deployment models. His dual role strengthens GlyphLock’s foundation for sustainable, compliant, and high-credibility growth in rapidly evolving security and AI markets.",
      icon: TrendingUp
    },
    {
      name: "Collin Vanderginst",
      title: "Chief Technology Officer (CTO)",
      role: "Collin Vanderginst, GlyphLock’s Chief Technology Officer, oversees the design, deployment, and engineering integrity of the company’s technical infrastructure. His expertise spans advanced systems engineering, security architecture, distributed surveillance networks, and high-availability backend environments. A key contributor to GlyphLock’s foundational prototypes, Collin converts conceptual innovations into functional, scalable software systems. He currently manages all Jiffy Lube surveillance SEC systems across Arizona and leads the surveillance chore integration for the NUPS Point of Sale system. He manages engineering operations, DevSecOps processes, platform optimization, and system-level integrations across the GlyphLock ecosystem — including authentication engines, SDK frameworks, and enterprise-grade API infrastructure. Collin brings a disciplined, methodical engineering philosophy that ensures reliability, resilience, and security at every level of the platform. His work underpins the company’s stability as GlyphLock continues expanding into mission-critical, compliance-sensitive industries.",
      icon: Code
    },
    {
      name: "Angel Sticka",
      title: "Director of Administration, Regulatory Affairs & Operational Compliance",
      role: "Angel Sticka serves as GlyphLock’s Director of Administration, Regulatory Affairs, and Operational Compliance. She manages corporate documentation, legal coordination, organizational governance, and procedural execution across all departments. Angel oversees the administrative systems that support GlyphLock’s operational rhythm — including contract handling, licensing paperwork, compliance tracking, and executive scheduling. Her work ensures alignment between product development, legal processes, and organizational structure. Her administrative precision provides stability throughout GlyphLock’s rapid innovation cycles, supporting executive leadership and acting as a central point of continuity for filings, deadlines, communications, and organizational records. Angel’s role safeguards operational integrity as the company scales into more regulated markets.",
      icon: Shield
    }
  ];



  const technologies = [
    "Quantum-resistant encryption",
    "Visual cryptography",
    "Steganographic QR systems",
    "Interactive hotzones",
    "Dynamic glyph layers",
    "Blockchain Merkle verification",
    "Legal auto-binding (CAB + BPAAA)",
    "Secure POS (NUPS)",
    "AI-forensic auditing",
    "Emotional-reactive biometric triggers",
    "Geo-locking + time-locking",
    "Full IP lifecycle protection"
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
        title="About GlyphLock - Quantum-Resistant Security for a World Already Under Attack"
        description="Born from a dangerous idea: What if camouflage could hide QR codes? GlyphLock is survival-grade security built to eliminate digital theft, end fraud, and protect creators for 200 years."
        keywords="GlyphLock about, quantum-resistant security, Carlo Earl DACO, Collin Vanderginst CTO, Master Covenant, steganographic QR, AI governance, IP protection, TruthStrike Protocol, Base44 platform, Dream Team AI"
        url="/about"
      />
      
      <div className="min-h-screen bg-black text-white pt-24 pb-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00E4FF]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[#8C4BFF]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          
          {/* HERO */}
          <div ref={heroRef} className="text-center mb-24">
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-8xl font-black mb-8 tracking-tighter font-space"
            >
              ABOUT <span className="text-transparent bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] bg-clip-text">GLYPHLOCK</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-3xl text-[#00E4FF] font-bold max-w-4xl mx-auto leading-tight"
            >
              Quantum-Resistant Verification Protocol
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
                GlyphLock began with a conversation that shouldn’t have mattered as much as it did — two friends in Arizona in early 2025 talking about camouflage, patterns, and military stealth. Collin mentioned how patterns hide people. Carlo pushed further and asked the question that changed everything: <span className="text-[#00E4FF] font-bold italic">“What if the pattern isn’t hiding you… what if the pattern itself is the intelligence?”</span> That moment cracked open an entirely new idea: imagery as encrypted communication, invisible data embedded inside everyday surfaces, information that could move, react, and protect itself.
              </p>
              <p>
                But the vision didn’t take off instantly. Behind the scenes were long nights, financial setbacks, early collaborators who didn’t deliver, people who stalled progress, partners who talked more than they built, and the constant pressure of raising a family while trying to hold onto a concept that felt bigger than life.
              </p>
              <p>
                There were moments Carlo nearly quit — not because the idea was weak, but because the path was heavy. When outside promises failed and unreliable contributors slowed the project down, he made the toughest but clearest decision: <span className="text-[#00E4FF] font-bold">bootstrap everything and trust no one but the people who actually show up.</span>
              </p>
              <p>
                That pivot reshaped the entire trajectory. What started as a clever thought about camouflage became a full-blown security ecosystem built through sheer discipline, creative intelligence, and refusal to fold. With Collin turning theory into functioning systems, Jacub providing structure and strategic direction, and Angel keeping the entire operation organized and compliant, GlyphLock grew from a raw concept into a quantum-resistant authentication framework, complete with encrypted glyph signatures, interactive image intelligence, and the Master Covenant — a binding blueprint for how humans, AI, and digital truth are verified.
              </p>
              <p>
                GlyphLock wasn’t built in a boardroom or funded by VCs. It was built through perseverance, real struggle, and the belief that the world needed a new way to protect identity, information, and integrity. The story isn’t glamorous — it’s earned. And that’s why GlyphLock exists today: because Carlo refused to let a world-changing idea die in silence.
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
                GlyphLock's mission is simple:<br />
                <span className="text-[#8C4BFF] font-bold text-xl">
                  Eliminate digital theft. End fraud. Protect creators. 
                  Build quantum-resistant systems that will still work 200 years from now.
                </span>
              </p>
              <p className="text-xl text-white font-bold mt-8">
                GlyphLock is not trendy security.<br/>
                <span className="text-[#00E4FF]">It is survival-grade security.</span>
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 80 }}
              animate={missionInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card rounded-2xl p-8 border border-red-500/20 bg-gradient-to-br from-red-950/10 to-black"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-red-500" />
                We Protect Against
              </h2>
              <div className="space-y-3">
                {[
                  "AI-powered plagiarism",
                  "Identity spoofing",
                  "Deepfake manufacturing",
                  "Industrial IP theft",
                  "POS skimmers + hospitality fraud",
                  "Data manipulation",
                  "Unverified claims",
                  "Synthetic evidence",
                  "AI impersonation systems",
                  "Quantum attacks against legacy encryption"
                ].map((threat, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                    <span className="text-gray-300">{threat}</span>
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
              GlyphLock did <span className="font-bold text-white">not</span> start as a company. 
              It started as a simple interactive-image experiment. 
              Carlo and Collin originally thought they were building "QR codes on steroids." 
              Then the technology began outgrowing the category.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
              {[
                "Steganography", "Dynamic Glyphs", "Hotzones", "Blockchain", "Contracts",
                "Verification", "POS Sync", "TruthStrike", "Geo-Locking", "Bio-Triggers"
              ].map((tech, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center text-xs font-bold text-[#00E4FF] uppercase tracking-wide">
                  {tech}
                </div>
              ))}
            </div>
            
            <div className="bg-[#00E4FF]/10 border border-[#00E4FF]/30 rounded-xl p-6 text-center">
              <p className="text-xl text-[#00E4FF] font-bold">
                Get away from being just a QR project. <br/>
                Become the world's most advanced IP protection and digital truth system.
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
                READY TO DEPLOY CREDENTIALED VERIFICATION?
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, x: 100 }}
                animate={ctaInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="text-gray-400 mb-10 text-xl max-w-2xl mx-auto"
              >
                Initiate protocol-governed access with GlyphLock security specialists.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={ctaInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 100 }}
              >
                <Link to={createPageUrl("Consultation")}>
                  <Button className="bg-gradient-to-r from-[#00E4FF] to-[#8C4BFF] hover:scale-105 transition-transform text-white text-lg font-bold uppercase tracking-wide px-10 py-6 shadow-[0_0_30px_rgba(0,228,255,0.3)] border-none">
                    Request Credentials
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