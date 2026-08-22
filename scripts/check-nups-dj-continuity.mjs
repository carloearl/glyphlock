import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const [
  home,
  consoleSource,
  mixer,
  playerSection,
  youtube,
  fableHost,
  fableStage,
  clubTv,
  capability,
] = await Promise.all([
  source("src/pages/DJHome.jsx"),
  source("src/components/mixer/UnifiedMusicConsole.jsx"),
  source("src/components/mixer/MixerModuleView.jsx"),
  source("src/components/mixer/DJPlayerSection.jsx"),
  source("src/components/mixer/YouTubePlayer.jsx"),
  source("src/components/mixer/fable/useFableHost.js"),
  source("src/pages/FableStagePage.jsx"),
  source("src/pages/ClubTV.jsx"),
  source("src/components/mixer/session/providerCapabilities.js"),
]);

assert.match(home, /<DJSessionProvider>/, "DJ route must own one persistent session provider");
assert.doesNotMatch(consoleSource, /left-\[-200vw\]/, "off-screen playback workaround must stay removed");
assert.equal((consoleSource.match(/<MixerModuleView/g) || []).length, 1, "mixer/player subtree must mount exactly once");
assert.match(consoleSource, /<FableVisualizerTab/, "same-screen Fable surface is required");
assert.match(consoleSource, /ResizablePanelGroup/, "workbench must remain resizable");
assert.match(consoleSource, /createScopedLayoutKey\(scope\)/, "layout cache must be venue/operator/device scoped");
assert.doesNotMatch(mixer, /window\.innerWidth/, "responsive behavior must use a live media query");
assert.match(mixer, /djSession\.pendingCommand/, "mixer must consume the typed deck command bus");
assert.match(playerSection, /acknowledgeDeckLoad/, "deck load commands must acknowledge");
assert.match(playerSection, /setProviderState/, "provider states must feed diagnostics");
assert.match(youtube, /onAutoplayBlocked/, "YouTube autoplay blocking must be observable");
assert.match(youtube, /BUFFERING|YOUTUBE_STATES/, "YouTube buffering must have an explicit state");
assert.match(youtube, /origin: window\.location\.origin/, "YouTube origin identity must be configured");
assert.match(youtube, /createYouTubeCommandGate/, "YouTube commands must be deduplicated/throttled");
assert.match(youtube, /advanceYouTubeWatchdog/, "YouTube must have a bounded stall watchdog");
assert.match(fableHost, /stage-ready/, "Fable host must use a readiness handshake");
assert.match(fableHost, /type: "snapshot"/, "Fable host must send a full snapshot");
assert.doesNotMatch(fableHost, /setTimeout\(\(\) => \{[\s\S]{0,200}publishFable/, "Fable snapshot must not depend on a fixed timeout");
assert.match(fableStage, /Visual only/, "external Fable stage must disclose visual-only operation");
assert.doesNotMatch(clubTv, /<audio\b/, "ClubTV must not create a second audible HTML audio owner");
assert.match(clubTv, /volume=\{0\}[\s\S]*muted/, "ClubTV YouTube video must be muted");
assert.match(capability, /spotify:[\s\S]*play: false/, "Spotify must stay discovery/import only");
assert.match(capability, /apple_music:[\s\S]*play: false/, "Apple Music must stay discovery/import only");

console.log("NUPS DJ continuity contracts: PASS");
