import React, { useState } from "react";
import { motion } from "framer-motion";
import PaywallGuard from "@/components/PaywallGuard";
import SEOHead from "@/components/SEOHead";
import { base44 } from "@/api/base44Client";
import ImageLabLayout from "@/components/imageLab/ImageLabLayout";
import PromptPanel from "@/components/imageLab/PromptPanel";
import ControlsPanel from "@/components/imageLab/ControlsPanel";
import BatchPanel from "@/components/imageLab/BatchPanel";
import ReferenceUpload from "@/components/imageLab/ReferenceUpload";
import RenderPreview from "@/components/imageLab/RenderPreview";
import RenderLightbox from "@/components/imageLab/RenderLightbox";
import GalleryPanel from "@/components/imageLab/GalleryPanel";
import MultimodalStubs from "@/components/imageLab/MultimodalStubs";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [batchCount, setBatchCount] = useState(1);
  const [referenceImage, setReferenceImage] = useState(null);
  
  const [controls, setControls] = useState({
    aspectRatio: "1:1",
    modelStrength: 75,
    sharpness: 50,
    creativity: 70,
    guidanceScale: 7.5,
    seed: Math.floor(Math.random() * 1000000),
    seedLocked: false,
    qualityMode: "Standard",
    negativePrompt: "",
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setImages([]);
    
    try {
      // Enhanced prompt with style and quality settings
      const enhancedPrompt = `${prompt}${selectedStyle !== 'photorealistic' ? `, ${selectedStyle} style` : ''}, ${controls.qualityMode.toLowerCase()} quality, highly detailed`;
      
      const promises = Array.from({ length: batchCount }, async (_, idx) => {
        try {
          // Primary: Use Core.GenerateImage with enhanced prompt
          const result = await base44.integrations.Core.GenerateImage({ 
            prompt: enhancedPrompt 
          });
          return { url: result.url, source: 'primary' };
        } catch (primaryError) {
          console.warn(`Primary generation failed for image ${idx + 1}:`, primaryError);
          
          // Fallback: Try with original prompt
          try {
            const fallbackResult = await base44.integrations.Core.GenerateImage({ 
              prompt: prompt 
            });
            return { url: fallbackResult.url, source: 'fallback' };
          } catch (fallbackError) {
            console.error(`All generation methods failed for image ${idx + 1}:`, fallbackError);
            throw new Error(`Image generation failed: ${fallbackError.message || 'Unknown error'}`);
          }
        }
      });
      
      const results = await Promise.all(promises);
      setImages(results);
      
      // Save to gallery
      const savedImages = JSON.parse(localStorage.getItem('glyphlock_generated_images') || '[]');
      results.forEach(img => {
        savedImages.push({
          ...img,
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          prompt,
          style: selectedStyle,
          settings: controls,
        });
      });
      localStorage.setItem('glyphlock_generated_images', JSON.stringify(savedImages));
      
    } catch (error) {
      console.error("Error generating images:", error);
      alert(`Failed to generate images: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
      if (!controls.seedLocked) {
        setControls(prev => ({ ...prev, seed: Math.floor(Math.random() * 1000000) }));
      }
    }
  };

  const handleDownload = async (url, index = 0) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `glyphlock-forge-${Date.now()}-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <PaywallGuard serviceName="Quantum Image Forge" requirePlan="professional">
      <SEOHead
        title="GlyphLock AI Image Generator | Creation Context & Workflows"
        description="Generate visual assets, retain prompt and creation settings, and route approved images into carrier, hotspot, Secure QR, and record workflows."
        keywords="GlyphLock AI image generator, image creation context, image carrier workflow, interactive hotspots, Secure QR images, visual asset records"
        url="/image-generator"
      />
      
      <ImageLabLayout>
        <div className="container mx-auto px-4 py-12 max-w-[1600px]">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 relative"
          >
            {/* Beam Animation */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-32 bg-gradient-to-b from-[#8C4BFF] to-transparent opacity-30"
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 relative"
              animate={{
                textShadow: [
                  "0 0 20px rgba(140, 75, 255, 0.5)",
                  "0 0 40px rgba(0, 228, 255, 0.5)",
                  "0 0 20px rgba(140, 75, 255, 0.5)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="bg-gradient-to-r from-[#8C4BFF] via-[#00E4FF] to-[#8C4BFF] bg-clip-text text-transparent">
                Quantum Image Forge
              </span>
            </motion.h1>
            
            <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto">
              Forged on enterprise frameworks. Fortified by global standards.
              <br />
              <span className="text-[#00E4FF]">Supercharged with GlyphLock intelligence.</span>
            </p>
          </motion.div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column - Prompt & Quick Controls */}
            <div className="lg:col-span-2 space-y-6">
              <PromptPanel
                prompt={prompt}
                setPrompt={setPrompt}
                onGenerate={handleGenerate}
                loading={loading}
                selectedStyle={selectedStyle}
                setSelectedStyle={setSelectedStyle}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BatchPanel batchCount={batchCount} setBatchCount={setBatchCount} />
                <ReferenceUpload referenceImage={referenceImage} setReferenceImage={setReferenceImage} />
              </div>
            </div>

            {/* Right Column - Advanced Controls */}
            <div>
              <ControlsPanel controls={controls} setControls={setControls} />
            </div>
          </div>

          {/* Render Output */}
          <div className="mb-6">
            <RenderPreview
              images={images}
              loading={loading}
              onRegenerate={handleRegenerate}
              onDownload={handleDownload}
              onViewFullscreen={setFullscreenImage}
              metadata={{
                prompt,
                model: 'DALL-E 3',
                quality: controls.qualityMode,
              }}
            />
          </div>

          {/* Gallery */}
          <div className="mb-6">
            <GalleryPanel onImageSelect={(img) => setFullscreenImage(img.url)} />
          </div>

          {/* Multimodal Features Preview */}
          <div>
            <MultimodalStubs />
          </div>
        </div>

        {/* Fullscreen Lightbox */}
        {fullscreenImage && (
          <RenderLightbox
            imageUrl={fullscreenImage}
            onClose={() => setFullscreenImage(null)}
            onDownload={handleDownload}
          />
        )}
      </ImageLabLayout>
    </PaywallGuard>
  );
}