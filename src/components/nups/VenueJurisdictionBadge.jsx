import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * JURISDICTION BADGE COMPONENT
 * Displays regulatory jurisdiction for venue compliance visibility
 */
export default function VenueJurisdictionBadge({ venue }) {
  if (!venue) return null;

  const getBadgeConfig = () => {
    if (venue.jurisdiction === 'unincorporated_county') {
      return {
        color: 'bg-amber-900/30 text-amber-400 border-amber-500/50',
        text: `UNINCORPORATED ${venue.county.toUpperCase()} COUNTY`
      };
    }
    
    // City jurisdiction
    return {
      color: 'bg-blue-900/30 text-blue-400 border-blue-500/50',
      text: `CITY OF ${venue.city.toUpperCase()}`
    };
  };

  const config = getBadgeConfig();

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} border text-xs font-semibold tracking-wide`}
    >
      {config.text}
    </Badge>
  );
}