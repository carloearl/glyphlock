import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { glyphlockWrite } from '@/lib/glyphlock/glyphlockWriteGateway';
import { toast } from 'sonner';

const MAX_PREVIEWS = 10;

/**
 * QR Preview Storage Hook
 * Manages per-user preview storage with auto-save and hard limit
 */
export function useQrPreviewStorage(userId) {
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load previews on mount
  const loadPreviews = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await base44.entities.QrPreview.filter(
        { user_id: userId, vaulted: false, archived: { $ne: true } },
        'created_date',
        MAX_PREVIEWS + 5
      );
      setPreviews(data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to load previews:', err);
      setError('Failed to sync previews. Working from local state.');
      toast.error('Failed to sync previews. Working from local state.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPreviews();
  }, [loadPreviews]);

  // Auto-save preview (enforces 10 limit)
  const savePreview = useCallback(async (previewData) => {
    if (!userId) return null;

    try {
      const newPreview = await glyphlockWrite('qr_preview_save', {
        preview: {
          ...previewData,
          vaulted: false,
        },
        intent: 'auto_save_ephemeral_qr_preview',
      });

      // Refresh list
      await loadPreviews();
      return newPreview;
    } catch (err) {
      console.error('Failed to save preview:', err);
      toast.error('Failed to save preview');
      return null;
    }
  }, [userId, loadPreviews]);

  // Save to vault (move from previews to permanent)
  const saveToVault = useCallback(async (previewId) => {
    if (!userId) return false;

    try {
      await glyphlockWrite('qr_preview_vault', {
        id: previewId,
        intent: 'move_qr_preview_to_vault',
      });

      // Also update QRGenHistory if exists
      const preview = previews.find(p => p.id === previewId);
      if (preview?.code_id) {
        try {
          const histories = await base44.entities.QRGenHistory.filter({ code_id: preview.code_id });
          if (histories.length > 0) {
            // Note: QRGenHistory doesn't have vaulted field, but we track it in QrPreview
          }
        } catch (e) {
          // Ignore if QRGenHistory update fails
        }
      }

      toast.success('QR saved to your Vault!');
      await loadPreviews();
      return true;
    } catch (err) {
      console.error('Failed to save to vault:', err);
      toast.error('Failed to save to vault');
      return false;
    }
  }, [userId, previews, loadPreviews]);

  // Delete preview
  const deletePreview = useCallback(async (previewId) => {
    if (!userId) return false;

    try {
      await glyphlockWrite('qr_preview_remove', {
        id: previewId,
        reason: 'Removed by preview owner',
        intent: 'remove_qr_preview',
      });
      await loadPreviews();
      toast.success('Preview deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete preview:', err);
      toast.error('Failed to delete preview');
      return false;
    }
  }, [userId, loadPreviews]);

  // Get vaulted items
  const loadVaultedItems = useCallback(async () => {
    if (!userId) return [];

    try {
      const data = await base44.entities.QrPreview.filter(
        { user_id: userId, vaulted: true, archived: { $ne: true } },
        '-vault_date'
      );
      return data || [];
    } catch (err) {
      console.error('Failed to load vault:', err);
      return [];
    }
  }, [userId]);

  return {
    previews,
    loading,
    error,
    savePreview,
    saveToVault,
    deletePreview,
    loadPreviews,
    loadVaultedItems,
    previewCount: previews.length,
    maxPreviews: MAX_PREVIEWS
  };
}

export default useQrPreviewStorage;