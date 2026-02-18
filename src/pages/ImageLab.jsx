import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Sparkles, Layers, Image as ImageIcon, Database, Zap, Box } from 'lucide-react';

import SEOHead from '@/components/SEOHead';
import { injectSoftwareSchema } from '@/components/utils/seoHelpers';

import HelpPanel from '@/components/global/HelpPanel';

// Tab Components
import GenerateTab from '@/components/imageLab/tabs/GenerateTab.jsx';
import InteractiveTab from '@/components/imageLab/tabs/InteractiveTab.jsx';
import GalleryTab from '@/components/imageLab/tabs/GalleryTab.jsx';
import MultimodalTab from '@/components/imageLab/tabs/MultimodalTab.jsx';

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
        description="AI image generation with cryptographic security, interactive hotspots, and steganographic protection. Create, secure, and verify visual assets."
        keywords="AI image generation, interactive images, steganography, secure media, GlyphLock, cryptographic images, hotspot editor"
        url="/image-lab"
      />

      <HelpPanel
        title="Image Lab System Guide"
        sections={[
          {
            title: 'Getting Started',
            content: [
              { heading: 'Prompt Input', text: 'Type a detailed description. Be specific about subject, style, lighting, mood.', tip: 'Use descriptive adjectives and artistic styles' },
              { heading: 'Expand Prompt with AI', text: 'Click "Expand Prompt" for AI-enhanced descriptions with technical specs.' },
              { heading: 'Reference Images', text: 'Upload 1-4 reference images to guide style, composition, or identity.' }
            ]
          },
          {
            title: 'Tabs Overview',
            content: [
              { heading: 'Generate + Forge (01)', text: 'Full AI image generation with prompt engineering, style presets, reference images, batch rendering, and advanced controls.' },
              { heading: 'Interactive (02)', text: 'Add clickable hotspots to images for interactive experiences.' },
              { heading: 'Gallery (03)', text: 'View and manage all your generated and uploaded images.' },
              { heading: 'Multimodal (04)', text: 'Active tools: Image→Video keyframes, Style Transfer, Image→3D multi-view, Audio→Visual synesthesia.' }
            ]
          }
        ]}
      />

      <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'transparent' }}>

        {/* Header - Redesigned */}
        <div className="relative z-50 border-b border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)' }}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
                  <Zap className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent leading-tight">
                    Image Lab
                  </h1>
                  <p className="text-[11px] md:text-xs text-white/40 font-medium mt-0.5">
                    Generate • Interact • Secure • Share
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span className="text-[11px] text-indigo-300 font-semibold">AI-Powered</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10">
                  <span className="text-[11px] text-cyan-300 font-semibold">4 Modules</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8 max-w-7xl relative z-10 w-full overflow-x-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop Tabs - Pill Design */}
            <TabsList className="hidden lg:flex w-full mb-8 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-1.5 h-auto rounded-2xl gap-1">
              {[
                { value: 'generate', icon: ImageIcon, label: 'Generate + Forge', num: '01', color: 'indigo' },
                { value: 'interactive', icon: Layers, label: 'Interactive', num: '02', color: 'cyan' },
                { value: 'gallery', icon: Database, label: 'Gallery', num: '03', color: 'blue' },
                { value: 'multimodal', icon: Box, label: 'Multimodal', num: '04', color: 'pink' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.value;
                return (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className={`flex-1 min-h-[52px] relative group rounded-xl transition-all font-medium text-xs uppercase tracking-wider ${
                      isActive
                        ? 'bg-white/[0.08] text-white shadow-lg border border-white/[0.1]'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="mr-2 text-[10px] opacity-40 font-mono">{tab.num}</span>
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Mobile Tabs */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-1.5 bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-1.5 rounded-2xl">
                {[
                  { value: 'generate', icon: ImageIcon, label: 'Generate' },
                  { value: 'interactive', icon: Layers, label: 'Edit' },
                  { value: 'gallery', icon: Database, label: 'Gallery' },
                  { value: 'multimodal', icon: Box, label: 'Multi' },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`flex-1 flex flex-col items-center justify-center py-3 text-xs transition-all rounded-xl ${
                        activeTab === tab.value
                          ? 'bg-white/[0.1] text-white border border-white/[0.1] shadow-lg'
                          : 'text-white/30 hover:text-white/50'
                      }`}
                      style={{ touchAction: 'manipulation', minHeight: '56px' }}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="text-[10px] font-semibold">{tab.label}</span>
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

            {/* Multimodal Studio Tab */}
            <TabsContent value="multimodal">
              <MultimodalTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}