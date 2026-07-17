// NUPS Venue Context Utility — BPAAA v3.1
// Reads active venue from localStorage. Auto-seeds from Venue entity if empty.

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useActiveVenue = () => {
  const [venue, setVenue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nups_active_venue')); } catch { return null; }
  });

  useEffect(() => {
    // Always validate the cached venue against the live Venue entity.
    // A stale localStorage entry (e.g. an old SANDBOX venue) must never
    // survive — the DB's active venue is the source of truth.
    base44.entities.Venue.filter({ status: 'active' }, '-created_date', 1)
      .then(venues => {
        if (venues?.length > 0) {
          const v = venues[0];
          if (!venue || venue.id !== v.id || venue.name !== v.name) {
            saveActiveVenue(v);
            setVenue(v);
          }
        }
      })
      .catch(() => {});
  }, []);

  return venue;
};

export const saveActiveVenue = (v) => {
  localStorage.setItem('nups_active_venue', JSON.stringify(v));
};

export const getActiveVenueId = () => {
  try {
    const v = JSON.parse(localStorage.getItem('nups_active_venue'));
    return v?.id || null;
  } catch { return null; }
};