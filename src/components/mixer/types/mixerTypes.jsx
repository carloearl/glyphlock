/**
 * Mixer Module Type Definitions & Constants
 * DJ-style dancer song management
 */

export const TrackVibe = {
  slow: "slow",
  seductive: "seductive",
  highEnergy: "highEnergy",
  experimental: "experimental",
  crowdControl: "crowdControl",
  cooldown: "cooldown",
};

export const VIBE_META = {
  slow: { label: "Slow", color: "#6366f1", description: "Slow tempo, sensual rhythm" },
  seductive: { label: "Seductive", color: "#ec4899", description: "Alluring, magnetic energy" },
  highEnergy: { label: "High Energy", color: "#ef4444", description: "Peak intensity, maximum crowd" },
  experimental: { label: "Experimental", color: "#f59e0b", description: "Unique, unconventional selection" },
  crowdControl: { label: "Crowd Control", color: "#10b981", description: "Universal crowd pleaser" },
  cooldown: { label: "Cooldown", color: "#06b6d4", description: "Recovery, deceleration" },
};

export const DialogMode = {
  addSong: "addSong",
  editSong: "editSong",
  profileManager: "profileManager",
  archive: "archive",
  filter: "filter",
  shortcuts: "shortcuts",
};

export const ViewMode = {
  grid: "grid",
  list: "list",
  mixer: "mixer",
};

/**
 * @typedef {Object} SongEntry
 * @property {string} id
 * @property {string} title
 * @property {string} artist
 * @property {string} youtubeUrl
 * @property {string} vibeTag - TrackVibe enum value
 * @property {number} energyLevel - 1-10
 * @property {string} [notes]
 * @property {number} [lastPlayed] - Unix timestamp
 * @property {boolean} favoriteFlag
 * @property {boolean} archivedFlag
 */

/**
 * @typedef {Object} DancerProfile
 * @property {string} id
 * @property {string} name
 * @property {string} colorTheme - Hex #RRGGBB
 * @property {string[]} songIds
 * @property {Object<string,number>} stats
 * @property {string[]} tags
 */

export function createSongEntry(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    title: "",
    artist: "",
    youtubeUrl: "",
    uploadUrl: "",
    vibeTag: TrackVibe.crowdControl,
    energyLevel: 5,
    notes: "",
    lastPlayed: null,
    favoriteFlag: false,
    archivedFlag: false,
    ...overrides,
  };
}

export function createDancerProfile(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: "",
    colorTheme: "#8b5cf6",
    songIds: [],
    stats: {},
    tags: [],
    ...overrides,
  };
}