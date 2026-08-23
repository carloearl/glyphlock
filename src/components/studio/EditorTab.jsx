import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { glyphlockWrite } from "@/lib/glyphlock/glyphlockWriteGateway";
import UploadZone from "./UploadZone";
import ToolbarPanel from "./ToolbarPanel";
import CanvasPanel from "./CanvasPanel";
import PropertiesPanel from "./PropertiesPanel";
import { useStudio } from "./state/StudioContext";
import { selectImage, selectImageId, selectImageName, selectHotspots, selectSelectedHotspot, selectUploadLoading } from "./state/selectors";

export default function EditorTab({ user, onFinalizeSuccess }) {
  const { state, dispatch } = useStudio();
  const [activeTool, setActiveTool] = useState("select");
  
  const imageId = selectImageId(state);
  const imageUrl = selectImage(state);
  const imageName = selectImageName(state);
  const hotspots = selectHotspots(state);
  const selectedHotspot = selectSelectedHotspot(state);
  const loading = selectUploadLoading(state);

  const handleImageUpload = async (file) => {
    try {
      dispatch({ type: "UPLOAD_START" });
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      const image = await glyphlockWrite('interactive_image_create', {
        image: {
          name: file.name,
          fileUrl: uploadResult.file_url,
          source: 'uploaded',
          width: 0,
          height: 0,
        },
        intent: 'studio_upload_interactive_image',
      });
      
      dispatch({ 
        type: "UPLOAD_SUCCESS", 
        imageUrl: uploadResult.file_url,
        imageId: image.id,
        imageName: file.name
      });
    } catch (error) {
      console.error("Upload error:", error);
      dispatch({ type: "UPLOAD_ERROR", error: error.message });
      throw error;
    }
  };

  const handleAddHotspot = (hotspot) => {
    const newHotspot = { 
      ...hotspot, 
      id: Date.now().toString(),
      label: `Hotspot ${hotspots.length + 1}`,
      description: '',
      actionType: 'none',
      actionValue: ''
    };
    dispatch({ type: "ADD_HOTSPOT", hotspot: newHotspot });
    dispatch({ type: "SELECT_HOTSPOT", id: newHotspot.id });
  };

  const handleUpdateHotspot = (updatedHotspot) => {
    dispatch({ type: "UPDATE_HOTSPOT", hotspot: updatedHotspot });
  };

  const handleDeleteHotspot = () => {
    if (!selectedHotspot) return;
    dispatch({ type: "DELETE_HOTSPOT", id: selectedHotspot.id });
  };

  const handleSelectHotspot = (hotspot) => {
    dispatch({ type: "SELECT_HOTSPOT", id: hotspot?.id || null });
  };

  const handleSaveHotspots = async () => {
    if (!imageId) return;

    try {
      await glyphlockWrite('interactive_image_update', {
        id: imageId,
        hotspots,
        intent: 'studio_save_image_hotspots',
      });
      return true;
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  };

  const handleFinalize = async () => {
    if (!imageId) return;

    try {
      dispatch({ type: "FINALIZE_START" });
      await handleSaveHotspots();

      const result = await glyphlockWrite('interactive_image_finalize', {
        id: imageId,
        intent: 'studio_finalize_interactive_image',
      });

      dispatch({ 
        type: "FINALIZE_SUCCESS", 
        logId: null,
        hash: result.hash,
        imageFileHash: result.imageFileHash,
        createdAt: new Date().toISOString()
      });
      onFinalizeSuccess();
      return result;
    } catch (error) {
      console.error("Finalize error:", error);
      dispatch({ type: "FINALIZE_ERROR", error: error.message });
      throw error;
    }
  };

  if (!imageUrl) {
    return <UploadZone onUpload={handleImageUpload} loading={loading} />;
  }

  return (
    <div className="grid lg:grid-cols-12 gap-4">
      <div className="lg:col-span-1">
        <ToolbarPanel activeTool={activeTool} onToolChange={setActiveTool} />
      </div>

      <div className="lg:col-span-7">
        <CanvasPanel
          imageUrl={imageUrl}
          imageName={imageName}
          hotspots={hotspots}
          selectedHotspot={selectedHotspot}
          activeTool={activeTool}
          onAddHotspot={handleAddHotspot}
          onSelectHotspot={handleSelectHotspot}
        />
      </div>

      <div className="lg:col-span-4">
        <PropertiesPanel
          selectedHotspot={selectedHotspot}
          hotspots={hotspots}
          onUpdateHotspot={handleUpdateHotspot}
          onDeleteHotspot={handleDeleteHotspot}
          onSelectHotspot={handleSelectHotspot}
          onSave={handleSaveHotspots}
          onFinalize={handleFinalize}
        />
      </div>
    </div>
  );
}