export function canFailoverToCue({ blending, active, targetId, targetDuration }) {
  return Boolean(blending && active && targetId && Number(targetDuration || 0) > 0);
}

export function nextTransitionAfterCueStart({ started, currentCrossfade, targetCrossfade }) {
  return started
    ? { proceed: true, crossfade: targetCrossfade }
    : { proceed: false, crossfade: currentCrossfade };
}
