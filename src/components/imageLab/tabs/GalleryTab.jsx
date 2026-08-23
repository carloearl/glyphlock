import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWriteGateway';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Download, Edit, Trash2, Lock, Image as ImageIcon, CheckSquare, Square, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  GlyphImageCard,
  GlyphImageButton,
  GlyphImageInput,
  GlyphImageTypography,
  GlyphImageBadge,
  GlyphImagePanel,
} from '../design/GlyphImageDesignSystem';

export default function GalleryTab({ user, onImageSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();

  const { data: images = [], isLoading, refetch } = useQuery({
    queryKey: ['interactive-images'],
    queryFn: async () => {
      const result = await base44.entities.InteractiveImage.list('-created_date', 100);
      return (result || []).filter((image) => image.archived !== true);
    },
    initialData: [],
  });

  const filteredImages = images.filter((img) => {
    const matchesSearch =
      !searchQuery ||
      img.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.prompt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || img.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || img.source === sourceFilter;
    return matchesSearch && matchesStatus && matchesSource;
  });

  // Toggle selection
  const toggleSelect = (imageId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Select all visible
  const selectAll = () => {
    setSelectedIds(new Set(filteredImages.map(img => img.id)));
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const count = selectedIds.size;
    if (!confirm(`Archive ${count} image${count > 1 ? 's' : ''}? Published and finalized evidence will be retained.`)) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        glyphlockWrite('interactive_image_archive', {
          id,
          reason: 'Archived from Image Lab gallery',
          intent: 'archive_interactive_image_from_gallery',
        })
      );
      
      await Promise.all(deletePromises);
      toast.success(`Archived ${count} image${count > 1 ? 's' : ''}`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      refetch();
    } catch (error) {
      console.error('Batch archive error:', error);
      toast.error('Failed to archive some images');
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Archive this image? Its integrity and publication evidence will be retained.')) return;

    try {
      await glyphlockWrite('interactive_image_archive', {
        id: imageId,
        reason: 'Archived from Image Lab gallery',
        intent: 'archive_interactive_image_from_gallery',
      });
      toast.success('Image archived');
      refetch();
    } catch (error) {
      console.error('Archive error:', error);
      toast.error('Failed to archive image');
    }
  };

  const handleDownload = async (url, name) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${name || 'image'}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();
      toast.success('Downloaded image');
    } catch (error) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Batch Actions */}
      <Card className={GlyphImageCard.glass}>
        <CardContent className={GlyphImagePanel.compact}>
          <div className="flex flex-col gap-4">
            {/* Search & Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search images..."
                  className={`${GlyphImageInput.base} pl-11`}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={GlyphImageInput.base}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className={GlyphImageInput.base}>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="generated">Generated</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selection Actions Row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {!selectionMode ? (
                  <Button
                    onClick={() => setSelectionMode(true)}
                    variant="outline"
                    size="sm"
                    className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20"
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Select Multiple
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={selectAll}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                    >
                      Select All ({filteredImages.length})
                    </Button>
                    <Button
                      onClick={deselectAll}
                      variant="outline"
                      size="sm"
                      className="border-gray-500/50 text-gray-300 hover:bg-gray-500/20"
                    >
                      Deselect All
                    </Button>
                    <Button
                      onClick={exitSelectionMode}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              {selectionMode && selectedIds.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-cyan-400 font-medium">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    onClick={handleBatchDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Archive {selectedIds.size} Image{selectedIds.size > 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
        </div>
      ) : filteredImages.length === 0 ? (
        <Card className={`${GlyphImageCard.glass} p-12 text-center`}>
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">
            {searchQuery || statusFilter !== 'all' || sourceFilter !== 'all'
              ? 'No images match your filters'
              : 'No images yet. Generate or upload images to get started.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => {
            const isSelected = selectedIds.has(image.id);
            
            return (
              <Card 
                key={image.id} 
                className={`${GlyphImageCard.premium} group hover:shadow-2xl transition-all relative ${
                  isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''
                }`}
              >
                {/* Selection Checkbox */}
                {selectionMode && (
                  <div 
                    className="absolute top-3 left-3 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(image.id);
                    }}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-cyan-500 border-cyan-400' 
                        : 'bg-black/50 border-white/50 hover:border-cyan-400'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                )}

                <CardHeader className="p-0">
                  <div 
                    className="relative aspect-video overflow-hidden rounded-t-xl cursor-pointer"
                    onClick={() => selectionMode ? toggleSelect(image.id) : null}
                  >
                    <img
                      src={image.fileUrl}
                      alt={image.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      {image.status === 'active' && (
                        <div className={GlyphImageBadge.success}>
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                      {image.source === 'generated' && (
                        <div className={GlyphImageBadge.info}>AI</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-white font-semibold truncate">{image.name}</h3>
                    {image.prompt && (
                      <p className="text-xs text-gray-400 truncate">{image.prompt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{new Date(image.created_date).toLocaleDateString()}</span>
                      {image.hotspots?.length > 0 && (
                        <span>• {image.hotspots.length} hotspots</span>
                      )}
                    </div>
                  </div>

                  {!selectionMode && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        onClick={() => onImageSelect(image)}
                        className={GlyphImageButton.secondary}
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(image.fileUrl, image.name)}
                        className={GlyphImageButton.ghost}
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDelete(image.id)}
                        className={GlyphImageButton.danger}
                        title="Archive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Check icon component
function Check({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}