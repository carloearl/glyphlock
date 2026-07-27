const STANDALONE_QUERY = "(display-mode: standalone)";

export function isEmbeddedPreview() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia?.(STANDALONE_QUERY)?.matches === true || window.navigator?.standalone === true;
  } catch {
    return false;
  }
}

export function isSecureDisplayActive() {
  if (typeof document === "undefined") return false;
  return isStandaloneDisplay() || Boolean(document.fullscreenElement);
}

export async function requestSecureDisplay() {
  if (typeof document === "undefined") return false;
  if (isStandaloneDisplay() || document.fullscreenElement) return true;

  const root = document.documentElement;
  if (!document.fullscreenEnabled || typeof root?.requestFullscreen !== "function") return false;

  try {
    await root.requestFullscreen({ navigationUI: "hide" });
    return true;
  } catch {
    try {
      await root.requestFullscreen();
      return true;
    } catch {
      return false;
    }
  }
}

export async function exitSecureDisplay() {
  if (typeof document === "undefined" || !document.fullscreenElement) return;
  try {
    await document.exitFullscreen();
  } catch {
    // The manager exit still clears the NUPS session even if the browser rejects
    // the fullscreen exit request during a route transition.
  }
}
