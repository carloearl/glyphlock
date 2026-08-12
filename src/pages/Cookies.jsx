import React from "react";
import { Cookie, Shield, Eye, Database } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Cookies() {
  return (
    <>
      <SEOHead 
        title="Cookie Policy | GlyphLock"
        description="GlyphLock Cookie Policy - How we use cookies and similar technologies."
        url="/cookies"
      />
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-black text-white py-32 relative overflow-hidden">
        {/* Cosmic Background */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="glyph-orb fixed top-20 right-20 opacity-20 glyph-pulse" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center justify-center p-4 glyph-glass border-2 border-cyan-500/40 rounded-2xl mb-6 glyph-glow">
              <Cookie className="w-12 h-12 text-cyan-400" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter font-space">
              COOKIE <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">POLICY</span>
            </h1>
            <div className="inline-block px-4 py-2 glyph-glass border border-cyan-500/30 rounded-full">
              <p className="text-cyan-300 text-sm font-bold uppercase tracking-widest">Last Updated: May 2025</p>
            </div>
          </div>

          <div className="glyph-glass-dark rounded-3xl border-2 border-cyan-500/30 p-8 md:p-12 space-y-12 glyph-glow">
            
            {/* Introduction */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-cyan-500/40 rounded-xl">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">What Are Cookies?</h2>
              </div>
              <div className="pl-4 border-l-2 border-cyan-500/20 ml-6 space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Cookies are small text files stored on your device when you visit websites. GlyphLock uses cookies and similar tracking technologies to provide, secure, and improve our services. This policy explains what cookies we use, why we use them, and how you can control them.
                </p>
              </div>
            </section>

            {/* Types of Cookies */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-purple-500/40 rounded-xl">
                  <Database className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Types of Cookies We Use</h2>
              </div>
              <div className="pl-4 border-l-2 border-purple-500/20 ml-6 space-y-6">
                
                <div className="glyph-glass border border-cyan-500/20 p-4 rounded-xl">
                  <h3 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Essential Cookies (Required)
                  </h3>
                  <p className="text-gray-400 text-sm">These cookies are necessary for the platform to function. They enable core features like authentication, security, session management, and access control. Without these, the service cannot operate properly.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-300">Authentication</span>
                    <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-300">Security</span>
                    <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs text-cyan-300">Session Management</span>
                  </div>
                </div>

                <div className="glyph-glass border border-blue-500/20 p-4 rounded-xl">
                  <h3 className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Performance Cookies
                  </h3>
                  <p className="text-gray-400 text-sm">These help us understand how users interact with our platform, identify performance issues, and improve the user experience. They collect anonymized usage data and error logs.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300">Analytics</span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300">Error Tracking</span>
                    <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs text-blue-300">Performance Monitoring</span>
                  </div>
                </div>

                <div className="glyph-glass border border-purple-500/20 p-4 rounded-xl">
                  <h3 className="text-purple-300 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Functional Cookies
                  </h3>
                  <p className="text-gray-400 text-sm">These remember your preferences, settings, and choices to provide a personalized experience. Examples include language preference, theme selection, and dashboard layout.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300">Preferences</span>
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300">Settings</span>
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-xs text-purple-300">UI Customization</span>
                  </div>
                </div>

                <div className="glyph-glass border border-orange-500/20 p-4 rounded-xl">
                  <h3 className="text-orange-300 font-semibold mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    Security and Fraud Prevention
                  </h3>
                  <p className="text-gray-400 text-sm">These cookies help detect and prevent fraudulent activity, abuse, and security threats. They are critical for maintaining platform integrity and protecting user accounts.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300">Fraud Detection</span>
                    <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300">Bot Prevention</span>
                    <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-xs text-orange-300">Access Control</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Managing Cookies */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-green-500/40 rounded-xl">
                  <Eye className="w-6 h-6 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Managing Your Cookie Preferences</h2>
              </div>
              <div className="pl-4 border-l-2 border-green-500/20 ml-6 space-y-4">
                <p className="text-gray-300">
                  You can control and manage cookies in several ways:
                </p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Browser Settings:</strong> Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies will prevent the platform from functioning.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Account Settings:</strong> You can manage some preferences and tracking options within your GlyphLock account dashboard.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1.5 text-xs">●</span>
                    <div>
                      <strong className="text-white">Third-Party Tools:</strong> You can use browser extensions or privacy tools to manage tracking cookies across websites.
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-yellow-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-yellow-400 mb-3 font-space">Third-Party Cookies</h2>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    GlyphLock does not use third-party advertising or tracking cookies. However, we may use trusted service providers for analytics, security monitoring, and payment processing. These providers operate under strict data protection agreements and cannot use your data for other purposes.
                  </p>
                </div>
              </div>
            </section>

            {/* Related Policies */}
            <section>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 glyph-glass border border-cyan-500/40 rounded-xl">
                  <Database className="w-6 h-6 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-space">Related Policies</h2>
              </div>
              <div className="pl-4 border-l-2 border-cyan-500/20 ml-6">
                <p className="text-gray-300 mb-4">
                  For more information about how we handle your data:
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={createPageUrl("Privacy")}>
                    <button className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-semibold text-white shadow-lg glyph-glow transition-all">
                      Privacy Policy
                    </button>
                  </Link>
                  <Link to={createPageUrl("Terms")}>
                    <button className="w-full sm:w-auto px-6 py-3 glyph-glass-dark border-2 border-purple-500/40 rounded-xl font-semibold text-white hover:border-purple-500/60 transition-all">
                      Terms of Service
                    </button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="mt-16 p-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-2 border-cyan-500/30 rounded-2xl text-center glyph-glow">
              <h2 className="text-3xl font-bold text-white mb-4 font-space">Questions About Cookies?</h2>
              <p className="text-gray-300 mb-6">Contact our privacy team for any cookie-related questions</p>
              <a 
                href="mailto:carloearl@glyphlock.com" 
                className="inline-flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold uppercase tracking-wide px-8 py-4 rounded-xl transition-all shadow-lg glyph-glow min-h-[52px]"
              >
                carloearl@glyphlock.com
              </a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}