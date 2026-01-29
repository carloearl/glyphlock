import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Layers, Image as ImageIcon, Database, Zap } from 'lucide-react';
import { toast } from 'sonner';

import SEOHead from '@/components/SEOHead';
import { injectSoftwareSchema } from '@/components/utils/seoHelpers';
import ImageLabOnboarding from '@/components/imageLab/ImageLabOnboarding';
import ImageLabHelp from '@/components/imageLab/ImageLabHelp';

// Tab Components
import GenerateTab from '@/components/imageLab/tabs/GenerateTab.jsx';
import InteractiveTab from '@/components/imageLab/tabs/InteractiveTab.jsx';
import GalleryTab from '@/components/imageLab/tabs/GalleryTab.jsx';

export default function ImageLab() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('gl_imagelab_active_tab') || 'generate');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  // Persist active tab
  useEffect(() => {
    localStorage.setItem('gl_imagelab_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const cleanup = injectSoftwareSchema(
      'GlyphLock Image Lab',
      'AI image generation with cryptographic security, interactive hotspots, and steganographic protection',
      '/image-lab',
      [
        'AI Image Generation',
        'Interactive Hotspot Editor',
        'Blockchain Verification',
        'Steganography Tools',
        'Secure Media Storage',
        'Copyright Protection'
      ]
    );
    return cleanup;
  }, []);

  const handleImageGenerated = (image) => {
    setSelectedImage(image);
    toast.success('Image generated! Open Interactive tab to add hotspots.');
  };

  const handleImageSelected = (image) => {
    setSelectedImage(image);
    setActiveTab('interactive');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-white/70">Initializing GlyphLock Image Lab...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="GlyphLock Image Lab | Generate & Secure Interactive Images"
        description="Military-grade AI image generation with cryptographic security, interactive hotspots, and steganographic protection. Create, secure, and verify visual assets."
        keywords="AI image generation, interactive images, steganography, secure media, GlyphLock, cryptographic images, hotspot editor"
        url="/image-lab"
      />

      <ImageLabOnboarding />
      <ImageLabHelp />

      <div className="min-h-screen relative overflow-x-hidden" style={{ 
        background: 'radial-gradient(ellipse at top, rgba(87, 61, 255, 0.15), transparent 50%), radial-gradient(ellipse at bottom right, rgba(168, 60, 255, 0.12), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.1), transparent 50%), #000000'
      }}>
        {/* Cosmic Background - Performance optimized for mobile */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="hidden md:block fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="hidden lg:block glyph-orb fixed top-20 right-20 opacity-20" style={{ animation: 'float-orb 8s ease-in-out infinite', background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        <div className="hidden lg:block glyph-orb fixed bottom-40 left-40 opacity-15" style={{ animation: 'float-orb 10s ease-in-out infinite', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(168,85,247,0.3), rgba(59,130,246,0.2))' }}></div>

        {/* Header - NEON AUTHORITY */}
        <div className="sticky top-0 z-50 backdrop-blur-2xl bg-gradient-to-r from-black/90 via-purple-900/40 to-black/90 border-b-2 border-cyan-500/40 shadow-[0_0_80px_rgba(6,182,212,0.4),0_0_120px_rgba(139,92,246,0.3)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
            {/* Pulsing glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 blur-3xl animate-pulse pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-600 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.7),0_0_80px_rgba(168,85,247,0.5)] animate-pulse border-2 border-white/20">
                  <Zap className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,1)]" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(6,182,212,1)] leading-tight">
                    ⚡ GLYPHLOCK IMAGE LAB ⚡
                  </h1>
                  <p className="text-cyan-300 text-sm md:text-base font-bold tracking-wide mt-1">
                    🔬 Military-Grade AI Generation • 🔐 Cryptographic Verification • ⚡ Neural Processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-7xl relative z-10 w-full overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop Tabs - NEON CONTROL DECK */}
            <div className="hidden lg:flex items-center gap-3 mb-8 bg-gradient-to-r from-slate-900/80 via-purple-900/40 to-slate-900/80 p-2 rounded-2xl border-2 border-purple-500/40 shadow-[0_0_50px_rgba(139,92,246,0.4)] backdrop-blur-xl">
              {[
                { value: 'generate', label: 'Generate', icon: Zap, color: 'cyan', num: '01' },
                { value: 'interactive', label: 'Interactive', icon: Layers, color: 'purple', num: '02' },
                { value: 'gallery', label: 'Gallery', icon: Database, color: 'pink', num: '03' }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`relative flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-black text-base transition-all duration-300 overflow-hidden ${
                      isActive
                        ? `bg-gradient-to-r ${
                            tab.color === 'cyan' ? 'from-cyan-600 to-blue-600' :
                            tab.color === 'purple' ? 'from-purple-600 to-pink-600' :
                            'from-pink-600 to-rose-600'
                          } text-white shadow-[0_0_40px_rgba(139,92,246,0.7)] border-2 border-white/30`
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border-2 border-transparent'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                    <span className="text-xs opacity-60">{tab.num}</span>
                    <TabIcon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_10px_rgba(255,255,255,1)]' : ''}`} />
                    <span className="relative z-10 uppercase tracking-wider">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Tabs - NEON TOUCH DECK */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-3 bg-gradient-to-r from-slate-900/90 via-purple-900/40 to-slate-900/90 p-2 rounded-2xl border-2 border-purple-500/40 shadow-[0_0_40px_rgba(139,92,246,0.4)] backdrop-blur-xl">
                {[
                  { value: 'generate', icon: Zap, label: 'Generate', num: '01', color: 'cyan' },
                  { value: 'interactive', icon: Layers, label: 'Interactive', num: '02', color: 'purple' },
                  { value: 'gallery', icon: Database, label: 'Gallery', num: '03', color: 'pink' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`relative flex-1 flex flex-col items-center justify-center py-5 text-xs font-black uppercase tracking-widest transition-all duration-300 min-h-[70px] rounded-xl overflow-hidden ${
                        isActive
                          ? `bg-gradient-to-b ${
                              tab.color === 'cyan' ? 'from-cyan-600 to-blue-600' :
                              tab.color === 'purple' ? 'from-purple-600 to-pink-600' :
                              'from-pink-600 to-rose-600'
                            } text-white shadow-[0_0_30px_rgba(139,92,246,0.6)] border-2 border-white/30`
                          : 'text-slate-400 bg-slate-800/40 hover:bg-slate-700/40 border-2 border-slate-700'
                      }`}
                      style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '70px'
                      }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      )}
                      <Icon className={`w-6 h-6 mb-2 ${isActive ? 'drop-shadow-[0_0_10px_rgba(255,255,255,1)]' : ''}`} />
                      <span className="text-[10px] relative z-10">{tab.num}</span>
                      <span className="text-[11px] font-black relative z-10">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Generate Tab */}
            <TabsContent value="generate">
              <GenerateTab
                user={user}
                onImageGenerated={handleImageGenerated}
              />
            </TabsContent>

            {/* Interactive Tab */}
            <TabsContent value="interactive">
              <InteractiveTab
                user={user}
                selectedImage={selectedImage}
                onImageSelect={setSelectedImage}
              />
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery">
              <GalleryTab
                user={user}
                onImageSelect={handleImageSelected}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}