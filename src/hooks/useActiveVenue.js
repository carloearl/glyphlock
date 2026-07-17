// NUPS Venue Context Utility — BPAAA v3.1
// Reads active venue from localStorage. Auto-seeds from Venue entity if empty.

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export const useActiveVenue = () => {
  const [venue, setVenue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nups_active_venue')); } catch { return null; }
  });

  useEffect(() => {
    // Validate the cached venue against the live Venue entity. A stale entry
    // (deleted/renamed/sandbox venue) self-heals, but a legitimately selected
    // venue is KEPT — multi-venue operators switch via the VenueSwitcher.
    base44.entities.Venue.filter({ status: 'active' }, '-created_date', 50)
      .then(venues => {
        if (!venues?.length) return;
        const match = venue && venues.find(v => v.id === venue.id);
        if (match) {
          if (match.name !== venue.name) { saveActiveVenue(match); setVenue(match); }
        } else {
          saveActiveVenue(venues[0]);
          setVenue(venues[0]);
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