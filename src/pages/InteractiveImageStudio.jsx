import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SEOHead from "@/components/SEOHead";
import EditorTab from "@/components/studio/EditorTab";
import VerifyTab from "@/components/studio/VerifyTab";
import { StudioProvider, useStudio } from "@/components/studio/state/StudioContext";
import HelpPanel from '@/components/global/HelpPanel';

function InteractiveImageStudioContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state, dispatch } = useStudio();

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        } else {
          await base44.auth.redirectToLogin('/InteractiveImageStudio');
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFinalizeSuccess = () => {
    dispatch({ type: "SET_TAB", tab: "verify" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <HelpPanel
      title="Interactive Studio Guide"
      sections={[
        {
          title: 'Getting Started',
          content: [
            { heading: 'What This Does', text: 'Create interactive images with clickable hotspots. Add hidden links, media, or actions to any image. Finalize to cryptographically secure the image and hotspot configuration.' },
            { heading: 'Upload an Image', text: 'Drag and drop or click to upload any JPG, PNG, or WEBP image. The system supports images up to 10MB.' },
            { heading: 'Add Hotspots', text: 'Click anywhere on the image. AI detects what you clicked and creates a bounding box. Set a URL or action for each hotspot.' }
          ]
        },
        {
          title: 'Features',
          content: [
            { heading: 'AI Detection', text: 'When you click on the image, AI analyzes that region and identifies the object (button, logo, face, product, etc.). It suggests a label and bounding box automatically.' },
            { heading: 'Action Types', text: 'Open URL (links to external site), Play Audio (trigger audio file), Show Modal (display text), Invoke Agent (call AI agent), Verify Access (authentication gate).' },
            { heading: 'Finalize & Lock', text: 'Generates a cryptographic hash of the image + hotspot configuration. Once finalized, the image cannot be altered without invalidating the hash.' },
            { heading: 'Share Links', text: 'Create hosted share URLs or downloadable packages. Hotspots remain hidden until user hovers/taps. Clicks trigger the configured action.' }
          ]
        }
      ]}
    />
    <div className="min-h-screen bg-black text-white py-8">
      <SEOHead
        title="Interactive Image Studio | GlyphLock Security"
        description="Create cryptographically secured interactive images with hotspots, hashing, and verification."
      />

      <div className="container mx-auto px-4">
        <div className="mb-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent blur-3xl -z-10"></div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="text-white">Interactive </span>
            <span className="text-white">Image </span>
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Studio</span>
          </h1>
          <p className="text-white/60 text-lg">Create secure, interactive, cryptographically verified images</p>
        </div>

        <Tabs value={state.tab} onValueChange={(tab) => dispatch({ type: "SET_TAB", tab })} className="space-y-6">
          <TabsList className="glass-royal border-cyan-500/30 mx-auto flex w-fit">
            <TabsTrigger 
              value="editor" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-white"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger 
              value="verify" 
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-white"
            >
              Verify
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor">
            <EditorTab user={user} onFinalizeSuccess={handleFinalizeSuccess} />
          </TabsContent>

          <TabsContent value="verify">
            <VerifyTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}

export default function InteractiveImageStudio() {
  return (
    <StudioProvider>
      <InteractiveImageStudioContent />
    </StudioProvider>
  );
}