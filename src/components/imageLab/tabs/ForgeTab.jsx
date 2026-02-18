import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import PromptPanel from "@/components/imageLab/PromptPanel";
import ControlsPanel from "@/components/imageLab/ControlsPanel";
import BatchPanel from "@/components/imageLab/BatchPanel";
import ReferenceUpload from "@/components/imageLab/ReferenceUpload";
import RenderPreview from "@/components/imageLab/RenderPreview";
import RenderLightbox from "@/components/imageLab/RenderLightbox";
import GalleryPanel from "@/components/imageLab/GalleryPanel";

export default function ForgeTab() {
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
      const enhancedPrompt = `${prompt}${selectedStyle !== 'photorealistic' ? `, ${selectedStyle} style` : ''}, ${controls.qualityMode.toLowerCase()} quality, highly detailed`;
      
      const promises = Array.from({ length: batchCount }, async (_, idx) => {
        try {
          const result = await base44.integrations.Core.GenerateImage({ prompt: enhancedPrompt });
          return { url: result.url, source: 'primary' };
        } catch (primaryError) {
          console.warn(`Primary generation failed for image ${idx + 1}:`, primaryError);
          const fallbackResult = await base44.integrations.Core.GenerateImage({ prompt });
          return { url: fallbackResult.url, source: 'fallback' };
        }
      });
      
      const results = await Promise.all(promises);
      setImages(results);
      
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

  return (
    <div className="space-y-6">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        <div>
          <ControlsPanel controls={controls} setControls={setControls} />
        </div>
      </div>

      {/* Render Output */}
      <RenderPreview
        images={images}
        loading={loading}
        onRegenerate={handleGenerate}
        onDownload={handleDownload}
        onViewFullscreen={setFullscreenImage}
        metadata={{ prompt, model: 'DALL-E 3', quality: controls.qualityMode }}
      />

      {/* Gallery */}
      <GalleryPanel onImageSelect={(img) => setFullscreenImage(img.url)} />

      {fullscreenImage && (
        <RenderLightbox
          imageUrl={fullscreenImage}
          onClose={() => setFullscreenImage(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}