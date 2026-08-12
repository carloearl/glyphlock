import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";

export default function Terms() {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: "By accessing and using GlyphLock services, you accept and agree to be bound by these terms and conditions."
    },
    {
      title: "2. Service Description",
      content: "GlyphLock provides cybersecurity tools and services including visual cryptography, blockchain security, AI assistance, and security operations monitoring."
    },
    {
      title: "3. User Obligations",
      content: "You agree to use our services lawfully and not to engage in activities that could harm our systems or other users. You are responsible for maintaining the confidentiality of your account."
    },
    {
      title: "4. Intellectual Property",
      content: "All GlyphLock technology, including the Master Covenant, software, and documentation, is protected by intellectual property laws and the CAB framework. Unauthorized use is prohibited."
    },
    {
      title: "5. Limitation of Liability",
      content: "GlyphLock is provided 'as is' without warranties. We are not liable for indirect, incidental, or consequential damages arising from service use."
    },
    {
      title: "6. Termination",
      content: "We reserve the right to terminate or suspend access to our services at any time for violations of these terms."
    },
    {
      title: "7. Governing Law",
      content: "These terms are governed by the laws of Arizona, United States. Disputes will be resolved in Arizona courts."
    },
    {
      title: "8. Changes to Terms",
      content: "We may modify these terms at any time. Continued use of our services constitutes acceptance of modified terms."
    }
  ];

  return (
    <>
      <SEOHead 
        title="Terms of Service | GlyphLock"
        description="Terms and conditions for using GlyphLock security services."
        url="/terms"
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black text-white py-32 relative overflow-hidden">
        {/* Cosmic Background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="glyph-orb fixed top-20 right-20 opacity-20 glyph-pulse" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-black mb-4 font-space tracking-tight">
              TERMS OF <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">SERVICE</span>
            </h1>
            <div className="inline-block px-4 py-2 glyph-glass border border-cyan-500/30 rounded-full">
              <p className="text-cyan-300 text-sm font-bold uppercase tracking-widest">Last Updated: May 2025</p>
            </div>
          </div>

          <div className="space-y-6">
            {sections.map((section, idx) => (
              <div key={idx} className="glyph-glass-dark rounded-xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-colors">
                <h2 className="text-xl font-bold text-white mb-3 font-space">{section.title}</h2>
                <p className="text-gray-400 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 glyph-glass-dark rounded-xl border-2 border-cyan-500/30 p-8 text-center glyph-glow">
            <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
            <p className="text-gray-300">
              For questions about these terms, contact us at{" "}
              <a href="mailto:carloearl@glyphlock.com" className="text-[#00E4FF] hover:text-white font-bold transition-colors">
                carloearl@glyphlock.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}