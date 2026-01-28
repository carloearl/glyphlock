import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { audit as auditService } from '../services';

export function useGlyphBotAudit(currentUser) {
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAudits = useCallback(async () => {
    if (!currentUser?.email) return;

    setIsLoading(true);
    try {
      const results = await base44.entities.GlyphBotAudit.filter(
        { user_id: currentUser.email, isArchived: false },
        '-created_date',
        100
      );

      const normalized = (results || []).map(a => ({
        ...a,
        id: a.id || a._id || a.entity_id
      }));

      setAudits(normalized);
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to load audits:', e);
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.email]);

  useEffect(() => {
    if (currentUser?.email) loadAudits();
  }, [currentUser?.email, loadAudits]);

  const createAudit = useCallback(async (auditData) => {
    if (!currentUser?.email) return null;

    try {
      const data = {
        user_id: currentUser.email,
        targetType: auditData.targetType || 'business',
        targetIdentifier: auditData.targetIdentifier,
        auditMode: auditData.auditMode || 'SURFACE',
        rawInput: auditData.rawInput || auditData.targetIdentifier,
        notes: auditData.notes || '',
        status: 'PENDING',
        findings: '{}',
        summary: '',
        riskScore: 0,
        overallGrade: '',
        isArchived: false
      };

      const audit = await base44.entities.GlyphBotAudit.create(data);
      const auditId = audit.id || audit._id || audit.entity_id;
      
      await loadAudits();
      return { ...audit, id: auditId };
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to create audit:', e);
      return null;
    }
  }, [currentUser?.email, loadAudits]);

  const updateAudit = useCallback(async (auditId, updates) => {
    if (!auditId) return false;

    try {
      await base44.entities.GlyphBotAudit.update(auditId, updates);
      await loadAudits();
      return true;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to update audit:', e);
      return false;
    }
  }, [loadAudits]);

  const getAudit = useCallback(async (auditId) => {
    if (!auditId || !currentUser?.email) return null;

    try {
      const results = await base44.entities.GlyphBotAudit.filter(
        { user_id: currentUser.email },
        '-created_date',
        100
      );

      const audit = results.find(a => {
        const aid = a.id || a._id || a.entity_id;
        return aid === auditId;
      });

      if (!audit) return null;

      return {
        ...audit,
        id: audit.id || audit._id || audit.entity_id
      };
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to get audit:', e);
      return null;
    }
  }, [currentUser?.email]);

  const deleteAudit = useCallback(async (auditId) => {
    if (!auditId) return false;

    try {
      await base44.entities.GlyphBotAudit.delete(auditId);
      await loadAudits();
      return true;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to delete audit:', e);
      return false;
    }
  }, [loadAudits]);

  const archiveAudit = useCallback(async (auditId) => {
    if (!auditId) return false;

    try {
      await base44.entities.GlyphBotAudit.update(auditId, { isArchived: true });
      await loadAudits();
      return true;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to archive audit:', e);
      return false;
    }
  }, [loadAudits]);

  const unarchiveAudit = useCallback(async (auditId) => {
    if (!auditId) return false;

    try {
      await base44.entities.GlyphBotAudit.update(auditId, { isArchived: false });
      await loadAudits();
      return true;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to unarchive audit:', e);
      return false;
    }
  }, [loadAudits]);

  const runAudit = useCallback(async (auditId, auditConfig) => {
    if (!auditId) return null;

    try {
      await updateAudit(auditId, { status: 'IN_PROGRESS' });

      const audit = await getAudit(auditId);
      if (!audit) return null;

      const auditPrompt = auditService.buildAuditPrompt(auditConfig, audit.targetType);
      
      return auditPrompt;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to run audit:', e);
      return null;
    }
  }, [updateAudit, getAudit]);

  const loadArchivedAudits = useCallback(async () => {
    if (!currentUser?.email) return [];

    try {
      const results = await base44.entities.GlyphBotAudit.filter(
        { user_id: currentUser.email, isArchived: true },
        '-created_date',
        100
      );

      const normalized = (results || []).map(a => ({
        ...a,
        id: a.id || a._id || a.entity_id
      }));

      return normalized;
    } catch (e) {
      console.error('[GlyphBot Audit] Failed to load archived audits:', e);
      return [];
    }
  }, [currentUser?.email]);

  return {
    audits,
    isLoading,
    createAudit,
    updateAudit,
    getAudit,
    deleteAudit,
    archiveAudit,
    unarchiveAudit,
    runAudit,
    loadAudits,
    loadArchivedAudits
  };
}

export default useGlyphBotAudit;