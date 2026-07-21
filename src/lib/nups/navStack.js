/**
 * Central in-app navigation trail (path + query) in session storage.
 * Recorded at router level for EVERY route change — the Back button is a
 * pure consumer, so it works on all pages regardless of which shell
 * (kiosk strip, floating, layout) renders it.
 */
const KEY = "gl_nav_stack";

export const readStack = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch { return []; }
};

const write = (stack) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(stack)); } catch { /* storage unavailable */ }
};

/** Idempotent — safe to call on every render for the same path. */
export function recordNavigation(path) {
  let stack = readStack();
  if (stack[stack.length - 1] === path) return;
  // Returning to the previous entry = a back move; pop instead of push
  if (stack.length > 1 && stack[stack.length - 2] === path) stack.pop();
  else stack.push(path);
  if (stack.length > 50) stack = stack.slice(-50);
  write(stack);
}

export const canGoBack = () => readStack().length > 1;

/** Pops the current page and returns the previous path, or null. */
export function popBack() {
  const stack = readStack();
  if (stack.length < 2) return null;
  stack.pop();
  write(stack);
  return stack[stack.length - 1];
}