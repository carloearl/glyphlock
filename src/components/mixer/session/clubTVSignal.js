export function getClubTVSignalStatus({ now = Date.now(), lastSignalAt = 0 } = {}) {
  if (!lastSignalAt) return "CONNECTING";
  const age = Math.max(0, Number(now) - Number(lastSignalAt));
  if (age <= 3000) return "LIVE";
  if (age <= 8000) return "STALE";
  return "OFFLINE";
}

export function isClubTVOnAir(status, activeTrack) {
  return status === "LIVE" && Boolean(activeTrack);
}
