// NUPS Venue Context Utility — BPAAA v3.1
// Reads active venue from localStorage. Auto-seeds from Venue entity if empty.

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useActiveVenue = () => {
  const [venue, setVenue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nups_active_venue')); } catch { return null; }
  });

  useEffect(() => {
    // If nothing in localStorage, auto-seed from Venue entity (first active venue)
    if (!venue) {
      base44.entities.Venue.filter({ status: 'active' }, '-created_date', 1)
        .then(venues => {
          if (venues?.length > 0) {
            const v = venues[0];
            saveActiveVenue(v);
            setVenue(v);
          }
        })
        .catch(() => {});
    }
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