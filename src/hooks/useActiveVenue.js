// NUPS Venue Context Utility — BPAAA v3.0
// Reads active venue from localStorage without requiring Context/Provider

import { useState } from 'react';

export const useActiveVenue = () => {
  const [venue] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nups_active_venue')); } catch { return null; }
  });
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