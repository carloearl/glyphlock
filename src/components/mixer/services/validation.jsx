/**
 * Mixer Validation
 * Song and Profile validation with user-friendly error messages
 */
import { TrackVibe } from "@/components/mixer/types/mixerTypes";
import { emitTelemetry } from "@/components/mixer/events/mixerTelemetry";

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

export function parseYoutubeUrl(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;

  if (YT_ID.test(raw)) {
    return {
      videoId: raw,
      canonical: `https://www.youtube.com/watch?v=${raw}`,
      embedUrl: `https://www.youtube.com/embed/${raw}`,
    };
  }

  let value = raw;
  if (!/^https?:\/\//i.test(value) && /^(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\//i.test(value)) {
    value = `https://${value}`;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v') || '';
      else if (/^\/(?:embed|shorts|live)\//.test(parsed.pathname)) videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
    } else if (host === 'youtube-nocookie.com' && parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
    }

    if (!YT_ID.test(videoId)) return null;
    return {
      videoId,
      canonical: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  } catch (_) {
    return null;
  }
}

export function isYoutubeUrl(input) {
  return Boolean(parseYoutubeUrl(input));
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