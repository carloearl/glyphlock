/**
 * Mixer Validation
 * Song and Profile validation with user-friendly error messages
 */
import { TrackVibe } from "@/components/mixer/types/mixerTypes";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";

const YT_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:[&?].*)?$/;

export function parseYoutubeUrl(url) {
  if (!url) return null;
  const match = url.trim().match(YT_REGEX);
  if (!match) return null;
  return { videoId: match[1], canonical: `https://www.youtube.com/watch?v=${match[1]}` };
}

export function validateSong(song, allSongs = []) {
  const errors = {};

  if (!song.title?.trim()) errors.title = "Title is required";
  else if (song.title.trim().length > 100) errors.title = "Title must be 100 characters or less";

  if (!song.artist?.trim()) errors.artist = "Artist is required";
  else if (song.artist.trim().length > 100) errors.artist = "Artist must be 100 characters or less";

  // At least one source needed
  if (!song.uploadUrl?.trim() && !song.youtubeUrl?.trim()) {
    errors.youtubeUrl = "YouTube URL or direct audio URL is required";
  } else if (song.youtubeUrl?.trim() && !parseYoutubeUrl(song.youtubeUrl) && !song.youtubeUrl.includes("youtube.com/results") && !song.uploadUrl?.trim()) {
    errors.youtubeUrl = "Invalid YouTube URL";
  }

  if (song.energyLevel == null || song.energyLevel < 1 || song.energyLevel > 10 || !Number.isInteger(song.energyLevel)) {
    errors.energyLevel = "Energy level must be an integer from 1-10";
  }

  if (!song.vibeTag || !Object.values(TrackVibe).includes(song.vibeTag)) {
    errors.vibeTag = "Vibe tag is required";
  }

  const hasErrors = Object.keys(errors).length > 0;
  if (hasErrors) {
    Object.entries(errors).forEach(([field, message]) => {
      emitTelemetry("VALIDATION_ERROR", { entity: "song", field, message });
    });
  }
  return { valid: !hasErrors, errors };
}

export function validateProfile(profile, allProfiles = []) {
  const errors = {};

  if (!profile.name?.trim()) errors.name = "Name is required";
  else if (profile.name.trim().length > 50) errors.name = "Name must be 50 characters or less";
  else {
    const dupe = allProfiles.find(
      (p) => p.id !== profile.id && p.name.toLowerCase().trim() === profile.name.toLowerCase().trim()
    );
    if (dupe) errors.name = "A profile with this name already exists";
  }

  if (!profile.colorTheme || !/^#[0-9a-fA-F]{6}$/.test(profile.colorTheme)) {
    errors.colorTheme = "Valid hex color required (#RRGGBB)";
  }

  const hasErrors = Object.keys(errors).length > 0;
  if (hasErrors) {
    Object.entries(errors).forEach(([field, message]) => {
      emitTelemetry("VALIDATION_ERROR", { entity: "profile", field, message });
    });
  }
  return { valid: !hasErrors, errors };
}