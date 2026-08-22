export const PROVIDER_CAPABILITIES = Object.freeze({
  direct: {
    label: "Venue-authorized audio",
    discover: false,
    importPlaylistMetadata: true,
    play: true,
    seek: true,
    setVolume: true,
    mixCrossfade: true,
    pcmAnalysis: true,
    fableSync: "deck-audio",
    offlineUse: true,
    productionAuthorization: "venue-rights-required",
  },
  uploaded: {
    label: "Uploaded venue-authorized audio",
    discover: false,
    importPlaylistMetadata: true,
    play: true,
    seek: true,
    setVolume: true,
    mixCrossfade: true,
    pcmAnalysis: true,
    fableSync: "deck-audio",
    offlineUse: true,
    productionAuthorization: "venue-rights-required",
  },
  youtube: {
    label: "YouTube IFrame",
    discover: true,
    importPlaylistMetadata: true,
    play: true,
    seek: true,
    setVolume: true,
    mixCrossfade: true,
    pcmAnalysis: false,
    fableSync: "metadata-mic-or-synthetic",
    offlineUse: false,
    productionAuthorization: "provider-and-venue-rights-required",
  },
  spotify: {
    label: "Spotify catalog",
    discover: true,
    importPlaylistMetadata: true,
    play: false,
    seek: false,
    setVolume: false,
    mixCrossfade: false,
    pcmAnalysis: false,
    fableSync: "metadata-only",
    offlineUse: false,
    productionAuthorization: "discovery-only",
  },
  apple_music: {
    label: "Apple Music catalog",
    discover: true,
    importPlaylistMetadata: true,
    play: false,
    seek: false,
    setVolume: false,
    mixCrossfade: false,
    pcmAnalysis: false,
    fableSync: "metadata-only",
    offlineUse: false,
    productionAuthorization: "discovery-only",
  },
});

export function getProviderCapability(provider) {
  return PROVIDER_CAPABILITIES[provider] || PROVIDER_CAPABILITIES.direct;
}

export function canUseAsVenueDeckSource(provider) {
  return Boolean(getProviderCapability(provider).play) && !["spotify", "apple_music"].includes(provider);
}

export function capabilityRows() {
  return Object.entries(PROVIDER_CAPABILITIES).map(([id, capability]) => ({ id, ...capability }));
}
