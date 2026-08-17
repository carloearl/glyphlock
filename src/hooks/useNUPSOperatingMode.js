import { useCallback, useEffect, useMemo, useState } from 'react';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { loadVenueRates, invalidateRateCache } from '@/lib/nups/venueRateConfig';
import {
  LEDGER_MODE,
  OPERATING_MODE,
  MODE_CHANGE_EVENT,
  getOperatingMode,
  readTrainingSession,
  setCurrentOperatingModeSnapshot,
} from '@/lib/nups/operatingMode';

/**
 * Reactive source for the NUPS operating boundary.
 *
 * `ledgerMode` is persisted (REAL | DEMO | SANDBOX).
 * `operatingMode` is what the operator sees (LIVE | TRAINING | DEMO | SANDBOX).
 * TRAINING is session-scoped on top of the DEMO ledger.
 */
export function useNUPSOperatingMode(explicitVenueId = null) {
  const activeVenue = useActiveVenue();
  const venueId = explicitVenueId || activeVenue?.id || activeVenue?.venue_id || null;
  const [ledgerMode, setLedgerMode] = useState(LEDGER_MODE.REAL);
  const [operatingMode, setOperatingMode] = useState(OPERATING_MODE.LIVE);
  const [trainingSession, setTrainingSession] = useState(null);
  const [loading, setLoading] = useState(Boolean(venueId));
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!venueId) {
      setLedgerMode(LEDGER_MODE.REAL);
      setOperatingMode(OPERATING_MODE.LIVE);
      setTrainingSession(null);
      setCurrentOperatingModeSnapshot(OPERATING_MODE.LIVE, { ledger_mode: LEDGER_MODE.REAL, venue_id: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      invalidateRateCache(venueId);
      const rates = await loadVenueRates(venueId);
      const nextLedgerMode = String(rates?.mode || LEDGER_MODE.REAL).toUpperCase();
      const nextOperatingMode = getOperatingMode(nextLedgerMode, venueId);
      setLedgerMode(nextLedgerMode);
      setOperatingMode(nextOperatingMode);
      setCurrentOperatingModeSnapshot(nextOperatingMode, { ledger_mode: nextLedgerMode, venue_id: venueId });
      setTrainingSession(readTrainingSession(venueId));
      setError(null);
    } catch (cause) {
      setError(cause);
      setLedgerMode(LEDGER_MODE.REAL);
      setOperatingMode(OPERATING_MODE.LIVE);
      setTrainingSession(null);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return undefined;
    const onModeChanged = (event) => {
      if (!event?.detail?.venue_id || event.detail.venue_id === venueId) refresh();
    };
    window.addEventListener(MODE_CHANGE_EVENT, onModeChanged);
    window.addEventListener('storage', onModeChanged);
    return () => {
      window.removeEventListener(MODE_CHANGE_EVENT, onModeChanged);
      window.removeEventListener('storage', onModeChanged);
    };
  }, [refresh, venueId]);

  return useMemo(() => ({
    venueId,
    ledgerMode,
    operatingMode,
    trainingSession,
    loading,
    error,
    isLive: operatingMode === OPERATING_MODE.LIVE,
    isTraining: operatingMode === OPERATING_MODE.TRAINING,
    isDemo: operatingMode === OPERATING_MODE.DEMO,
    isSandbox: operatingMode === OPERATING_MODE.SANDBOX,
    isNonLive: operatingMode !== OPERATING_MODE.LIVE,
    refresh,
  }), [venueId, ledgerMode, operatingMode, trainingSession, loading, error, refresh]);
}

export default useNUPSOperatingMode;
