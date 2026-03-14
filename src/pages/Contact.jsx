import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Mail, Phone, MapPin, Send, CheckCircle2, Globe } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SEOHead from "@/components/SEOHead";
import { GlyphInput, GlyphButton, GlyphFormPanel } from "@/components/ui/GlyphForm";
import { motion, useInView } from "framer-motion";
import CyanLoader from "@/components/shared/CyanLoader";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  
  const heroRef = useRef(null);
  const cardsRef = useRef(null);
  const formRef = useRef(null);
  
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const cardsInView = useInView(cardsRef, { once: true, amount: 0.3 });
  const formInView = useInView(formRef, { once: true, amount: 0.3 });

  const sendEmail = useMutation({
    mutationFn: async (data) => {
      // Create evidence record first
      const contactEvent = await base44.entities.ContactEvent.create({
        contact_email: data.email,
        contact_name: data.name,
        subject: data.subject,
        message: data.message,
        status: "pending",
        ip_address: "client_ip"
      });

      // Send email
      try {
        await base44.integrations.Core.SendEmail({
          to: "support@glyphlock.io",
          subject: `Contact Form: ${data.subject}`,
          body: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
        });
        
        // Update status to sent
        await base44.entities.ContactEvent.update(contactEvent.id, { status: "sent" });
      } catch (err) {
        // Update status to failed
        await base44.entities.ContactEvent.update(contactEvent.id, { status: "failed" });
        throw err;
      }
    },
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    }
  });

  const [cooldown, setCooldown] = useState(false);
  const [errors, setErrors] = useState({});

  const sanitize = (str) => str.replace(/<[^>]*>/g, '').replace(/[<>"'&]/g, '').trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cooldown) return;

    const name = sanitize(formData.name);
    const email = formData.email.trim();
    const subject = sanitize(formData.subject);
    const message = sanitize(formData.message);

    const newErrors = {};
    if (name.length < 2) newErrors.name = "Name must be at least 2 characters.";
    else if (name.length > 100) newErrors.name = "Name must be under 100 characters.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Enter a valid email address.";
    if (subject.length < 2) newErrors.subject = "Subject is required.";
    else if (subject.length > 200) newErrors.subject = "Subject must be under 200 characters.";
    if (message.length < 10) newErrors.message = "Message must be at least 10 characters.";
    else if (message.length > 2000) newErrors.message = "Message must be under 2,000 characters.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    sendEmail.mutate({ name, email, subject, message });
    setCooldown(true);
    setTimeout(() => setCooldown(false), 30000);
  };

  return (
    <>
      <SEOHead 
        title="Contact GlyphLock - Creative Infrastructure & Partnership Inquiries"
        description="Contact GlyphLock for ecosystem architecture, partnership opportunities, creator protection infrastructure, and enterprise consultations. El Mirage, AZ | (424) 246-6499 | support@glyphlock.io"
        keywords="contact GlyphLock, creative infrastructure, ecosystem partnership, creator protection, licensing inquiry, enterprise consultation, GlyphLock support, El Mirage Arizona"
        url="/contact"
      />
      <div className="min-h-screen bg-black text-white pt-16 md:pt-32 pb-12 md:pb-24 relative overflow-x-hidden w-full">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#3B82F6]/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#7C3AED]/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-6xl relative z-10 w-full overflow-x-hidden">
          
          {/* Hero */}
          <div ref={heroRef} className="text-center mb-10 md:mb-20">
            <motion.h1 
              initial={{ opacity: 0, x: -100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black mb-3 md:mb-6 tracking-tighter px-2"
            >
              START <span className="text-transparent bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] bg-clip-text drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]">BUILDING</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: 100 }}
              animate={heroInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-base md:text-xl text-gray-400 max-w-2xl mx-auto px-4"
            >
              Connect with the team protecting independent creators with battle-tested infrastructure.
            </motion.p>
          </div>

          <div ref={cardsRef} className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-8 mb-12 md:mb-16">
            {[
              { icon: Mail, title: "Email", content: "support@glyphlock.io", href: "mailto:support@glyphlock.io", color: "text-[#3B82F6]" },
              { icon: Phone, title: "Phone", content: "(424) 246-6499", href: "tel:+14242466499", color: "text-[#8B5CF6]" },
              { icon: MapPin, title: "Location", content: "El Mirage, Arizona", color: "text-white" }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={cardsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.9, delay: 0.1 + (idx * 0.12), type: "spring", stiffness: 100 }}
                className="bg-slate-900/80 rounded-xl p-8 border-2 border-[#3B82F6]/30 text-center hover:border-[#3B82F6]/60 transition-all group shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
              >
                <div className={`w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-[#3B82F6]/40 group-hover:bg-[#3B82F6]/20 group-hover:border-[#3B82F6]/60 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]`}>
                  <item.icon className={`w-8 h-8 ${item.color} drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                {item.href ? (
                  <a href={item.href} className="text-gray-400 hover:text-[#3B82F6] transition-colors text-lg">
                    {item.content}
                  </a>
                ) : (
                  <p className="text-gray-400 text-lg">{item.content}</p>
                )}
              </motion.div>
            ))}
          </div>

          <div ref={formRef} className="flex flex-col lg:grid lg:grid-cols-[1fr_1fr] gap-8 md:gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -80 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
            <GlyphFormPanel title="" className="w-full">
              <div className="w-full">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Send className="w-6 h-6 text-[#3B82F6] drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                  Verified Messaging
                </h2>

                {submitted ? (
                  <Alert className="bg-green-500/10 border-green-500/30 mb-6">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <AlertDescription className="text-green-100 ml-2">
                      Transmission received. We will respond within 24 hours.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-5 w-full">
                  <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/80 text-xs uppercase tracking-wider font-bold">Identity</Label>
                      <GlyphInput
                        id="name"
                        type="text"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        maxLength={100}
                        className="w-full"
                        aria-required="true"
                      />
                      {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80 text-xs uppercase tracking-wider font-bold">Contact Point</Label>
                      <GlyphInput
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full"
                        aria-required="true"
                      />
                      {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-white/80 text-xs uppercase tracking-wider font-bold">Subject Protocol</Label>
                    <GlyphInput
                      id="subject"
                      type="text"
                      placeholder="Consultation / Partnership / Support"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      maxLength={200}
                      className="w-full"
                      aria-required="true"
                    />
                    {errors.subject && <p className="text-red-400 text-xs mt-1">{errors.subject}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="message" className="text-white/80 text-xs uppercase tracking-wider font-bold">Transmission</Label>
                      <span className="text-xs text-slate-500">{formData.message.length}/2000</span>
                    </div>
                    <Textarea
                      id="message"
                      required
                      value={formData.message}
                      onChange={(e) => {
                        if (e.target.value.length <= 2000) setFormData({...formData, message: e.target.value});
                      }}
                      rows={5}
                      className="w-full bg-slate-900 border-2 border-slate-800 text-white focus:border-[#3B82F6]/60 resize-none rounded-lg px-4 py-3 placeholder:text-slate-500"
                      style={{
                        boxShadow: '6px 6px 10px rgba(0,0,0,0.8), 1px 1px 10px rgba(59, 130, 246, 0.2)'
                      }}
                      placeholder="Describe your creative infrastructure needs or partnership vision..."
                      aria-label="Message content"
                    />
                    {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
                  </div>

                  <GlyphButton type="submit" variant="mixed" className="w-full" disabled={sendEmail.isPending || cooldown}>
                    {sendEmail.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div 
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Encrypting Transmission...
                      </div>
                    ) : cooldown ? (
                      "Message Sent — Please Wait"
                    ) : (
                      "Send Verified Message"
                    )}
                  </GlyphButton>
                </form>
              </div>
            </GlyphFormPanel>
            </motion.div>

            {/* Side Info */}
            <motion.div 
              initial={{ opacity: 0, x: 80 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <div className="bg-slate-900/80 rounded-2xl p-8 border-2 border-[#8B5CF6]/30 shadow-[0_0_25px_rgba(139,92,246,0.2)]">
                <h3 className="text-2xl font-bold text-white mb-4">Global Infrastructure</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  GlyphLock protects creators worldwide with Arizona-based governance and audit-ready compliance. 
                  Our infrastructure is deployed across creative studios, agencies, enterprises, and independent operators building verified ecosystems.
                </p>
                <div className="flex items-center gap-3 text-[#8B5CF6] font-bold uppercase tracking-wide text-sm">
                  <Globe className="w-5 h-5 drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                  <span>Resilient Infrastructure, Global Reach</span>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl p-8 border-2 border-[#3B82F6]/30 shadow-[0_0_25px_rgba(59,130,246,0.2)]">
                <h3 className="text-2xl font-bold text-white mb-4">Ecosystem Partnerships</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  For ecosystem licensing, white-label framework deployment, or strategic integrations, use the contact form with subject "Partnership". We protect your creative infrastructure the same way we protect ours.
                </p>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                    <span>Open framework licensing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                    <span>Custom ecosystem integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                    <span>Auditable support infrastructure</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </>
  );
}