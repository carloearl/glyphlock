import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, Layers, Image as ImageIcon, Database, Zap } from 'lucide-react';

import SEOHead from '@/components/SEOHead';
import { injectSoftwareSchema } from '@/components/utils/seoHelpers';
import ImageLabOnboarding from '@/components/imageLab/ImageLabOnboarding';
import ImageLabHelp from '@/components/imageLab/ImageLabHelp';
import HelpPanel from '@/components/global/HelpPanel';

// Tab Components
import GenerateTab from '@/components/imageLab/tabs/GenerateTab.jsx';
import InteractiveTab from '@/components/imageLab/tabs/InteractiveTab.jsx';
import GalleryTab from '@/components/imageLab/tabs/GalleryTab.jsx';

export default function ImageLab() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('gl_imagelab_active_tab') || 'generate';
  });

  useEffect(() => {
    localStorage.setItem('gl_imagelab_active_tab', activeTab);
  }, [activeTab]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

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
      <HelpPanel
        title="Image Lab Guide"
        sections={[
          {
            title: 'Basics',
            content: [
              { heading: 'What This Does', text: 'Generate AI images from text prompts. Upload reference images to guide style and composition. Control generation parameters for precise results.' },
              { heading: 'How to Start', text: 'Enter a text prompt describing your desired image. Click "Expand Prompt" to enhance it with AI. Upload 1-4 reference images if needed. Click "Generate Image".' },
              { heading: 'Generation Time', text: 'Typical generation takes 10-30 seconds. The system validates output quality and may retry automatically up to 3 times.' }
            ]
          },
          {
            title: 'Controls',
            content: [
              { heading: 'Delta Mode', text: 'REFINE (0.3): Minor adjustments. BALANCE (0.5): Moderate changes. RESTYLE (0.7): Major style shift. REINTERPRET (0.9): Complete reimagining.' },
              { heading: 'Seed Lock', text: 'Lock the random seed to reproduce exact outputs. Unlock to get variations. Same seed + same prompt = same image.' },
              { heading: 'Identity Lock', text: 'Enforces 87% facial similarity when reference faces are present. Requires clear face in reference image. Error E001 appears if no face detected.' },
              { heading: 'Reference Weights', text: 'When using multiple references, adjust weight sliders. Total must equal 100%. Higher weight = stronger influence on final output.' }
            ]
          },
          {
            title: 'Errors',
            content: [
              { heading: 'E001: No Face Detected', text: 'Identity lock requires a clear face in the reference image. Either upload a different reference with a visible face, or disable identity lock.', errorCode: 'E001' },
              { heading: 'Rate Limit', text: 'Free tier: 20 generations per hour. If exceeded, wait or upgrade to Pro for unlimited generations.' },
              { heading: 'Validation Failed', text: 'System automatically retries up to 3 times if quality scores are below 70%. You receive the best attempt.' }
            ]
          }
        ]}
      />

      <div className="min-h-screen relative overflow-x-hidden" style={{ 
        background: 'radial-gradient(ellipse at top, rgba(87, 61, 255, 0.15), transparent 50%), radial-gradient(ellipse at bottom right, rgba(168, 60, 255, 0.12), transparent 50%), radial-gradient(ellipse at bottom left, rgba(6, 182, 212, 0.1), transparent 50%), #000000'
      }}>
        {/* Cosmic Background - Performance optimized for mobile */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-cyan-900/10 to-transparent pointer-events-none z-0" />
        <div className="hidden md:block fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDYsIDE4MiwgMjEyLCAwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20 pointer-events-none z-0" />
        <div className="hidden lg:block glyph-orb fixed top-20 right-20 opacity-20" style={{ animation: 'float-orb 8s ease-in-out infinite', background: 'radial-gradient(circle, rgba(6,182,212,0.3), rgba(59,130,246,0.2))' }}></div>
        <div className="hidden lg:block glyph-orb fixed bottom-40 left-40 opacity-15" style={{ animation: 'float-orb 10s ease-in-out infinite', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(168,85,247,0.3), rgba(59,130,246,0.2))' }}></div>

        {/* Header - Mobile optimized */}
        <div className="border-b border-cyan-500/20 glyph-glass-dark sticky top-0 z-50 shadow-2xl glyph-glow">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex flex-col gap-3 md:gap-4">
              <div className="flex flex-col space-y-2">
                <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2 md:gap-3">
                  <Zap className="w-7 h-7 md:w-10 md:h-10 text-cyan-400 flex-shrink-0" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }} />
                  <span className="leading-tight">Image Lab</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-purple-400 flex-shrink-0" />
                  <span className="leading-tight">AI generation, interactive hotspots, cryptographic security</span>
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <div className="px-3 py-1.5 md:px-4 md:py-2 glyph-glass border border-cyan-500/50 rounded-lg glyph-glow">
                  <p className="text-[10px] md:text-xs text-cyan-300 font-semibold whitespace-nowrap">Generate • Interact • Secure</p>
                </div>
                <div className="px-3 py-1.5 md:px-4 md:py-2 glyph-glass border border-purple-500/50 rounded-lg">
                  <p className="text-[10px] md:text-xs text-purple-300 font-semibold flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    Premium Lab
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-7xl relative z-10 w-full overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop Tabs - Technical Segmented */}
            <TabsList className="hidden lg:flex w-full mb-6 bg-black/40 backdrop-blur-md border-t-2 border-b-2 border-cyan-500/20 p-0 h-auto rounded-none">
              <TabsTrigger 
                value="generate" 
                className="flex-1 min-h-[56px] relative group border-r border-cyan-500/10 data-[state=active]:bg-gradient-to-b data-[state=active]:from-purple-500/20 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-purple-400 data-[state=active]:text-purple-300 text-gray-500 hover:text-gray-300 transition-all font-mono text-xs uppercase tracking-widest rounded-none"
              >
                <span className="mr-2 text-[10px] opacity-60">01</span>
                <ImageIcon className="w-4 h-4 mr-2" />
                <span>Generate</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-0 group-data-[state=active]:opacity-100 glyph-glow"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="interactive" 
                className="flex-1 min-h-[56px] relative group border-r border-cyan-500/10 data-[state=active]:bg-gradient-to-b data-[state=active]:from-cyan-500/20 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-cyan-400 data-[state=active]:text-cyan-300 text-gray-500 hover:text-gray-300 transition-all font-mono text-xs uppercase tracking-widest rounded-none"
              >
                <span className="mr-2 text-[10px] opacity-60">02</span>
                <Layers className="w-4 h-4 mr-2" />
                <span>Interactive</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-data-[state=active]:opacity-100 glyph-glow"></div>
              </TabsTrigger>
              
              <TabsTrigger 
                value="gallery" 
                className="flex-1 min-h-[56px] relative group data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-500/20 data-[state=active]:to-transparent data-[state=active]:border-t-2 data-[state=active]:border-t-blue-400 data-[state=active]:text-blue-300 text-gray-500 hover:text-gray-300 transition-all font-mono text-xs uppercase tracking-widest rounded-none"
              >
                <span className="mr-2 text-[10px] opacity-60">03</span>
                <Database className="w-4 h-4 mr-2" />
                <span>Gallery</span>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-data-[state=active]:opacity-100 glyph-glow"></div>
              </TabsTrigger>
            </TabsList>

            {/* Mobile Tabs - Enhanced Touch Targets */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-2 bg-black/80 backdrop-blur-md border-2 border-cyan-500/30 p-2 rounded-xl shadow-[0_0_30px_rgba(87,61,255,0.4)]">
                {[
                  { value: 'generate', icon: ImageIcon, label: 'Generate', num: '01' },
                  { value: 'interactive', icon: Layers, label: 'Interactive', num: '02' },
                  { value: 'gallery', icon: Database, label: 'Gallery', num: '03' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveTab(tab.value);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveTab(tab.value);
                      }}
                      className={`flex-1 flex flex-col items-center justify-center py-4 text-xs font-mono uppercase tracking-wider transition-all min-h-[60px] rounded-lg ${
                        activeTab === tab.value
                          ? 'bg-gradient-to-b from-purple-500/40 to-transparent text-purple-300 border-2 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.5)]'
                          : 'text-gray-400 bg-white/5 hover:bg-white/10'
                      }`}
                      style={{
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minWidth: '80px',
                        minHeight: '60px'
                      }}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">{tab.label}</span>
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