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
  kiosk,
  clubChannel,
  deckGraph,
  audioVisualizer,
  fableDeckAudio,
  beatInput,
  audioIo,
  storage,
  app,
  navigationTracker,
  lazyPages,
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
  source("src/components/nups/KioskShell.jsx"),
  source("src/components/mixer/ClubBroadcastChannel.jsx"),
  source("src/components/mixer/deckAudioGraph.js"),
  source("src/components/mixer/AudioVisualizer.jsx"),
  source("src/components/mixer/fable/useFableDeckAudio.js"),
  source("src/components/mixer/fable/useFableBeat.js"),
  source("src/components/mixer/AudioIOPreferences.jsx"),
  source("src/components/mixer/services/storageService.jsx"),
  source("src/App.jsx"),
  source("src/lib/NavigationTracker.jsx"),
  source("src/lazyPagesConfig.js"),
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
assert.doesNotMatch(kiosk, /displayPaused\s*\?\s*null\s*:\s*children/, "secure display must not unmount the playback subtree");
assert.match(kiosk, /aria-hidden=\{displayPaused \|\| undefined\}/, "secure display must redact the operational accessibility tree");
assert.match(kiosk, /inert=\{displayPaused \? true : undefined\}/, "secure display must make the operational surface inert");
assert.match(consoleSource, /hidden=\{active !== "visuals"\}/, "Fable host must remain mounted across utility tab changes");
assert.doesNotMatch(consoleSource, /active === "visuals"\s*&&\s*\(/, "visual utility view must not be conditionally unmounted");
assert.match(clubChannel, /receiver-ready/, "Club TV must request an immediate state snapshot");
assert.match(clubChannel, /heartbeat/, "Club TV signal must have a liveness heartbeat");
assert.equal(
  (deckGraph.match(/createMediaElementSource\(/g) || []).length +
    (audioVisualizer.match(/createMediaElementSource\(/g) || []).length +
    (fableDeckAudio.match(/createMediaElementSource\(/g) || []).length,
  1,
  "one canonical MediaElementSource owner is required",
);
assert.match(fableDeckAudio, /getDeckAudioGraph/, "Fable must subscribe to the canonical analyser");
assert.match(beatInput, /deviceId:\s*\{ exact:/, "Fable input must honor the selected microphone");
assert.match(audioIo, /YouTube iframe audio follows your browser or OS output/, "audio routing limits must be disclosed truthfully");
assert.match(playerSection, /canFailoverToCue/, "manual Auto Blend failover must use the tested safety predicate");
assert.match(playerSection, /nextTransitionAfterCueStart/, "cue rejection must preserve the live crossfade");
assert.doesNotMatch(playerSection, /cueRef\?\.play\?\.\(\)\)\.catch\(\(\) => \{\}\)/, "cue prewarm failures must not be swallowed");
assert.match(playerSection, /session\.transportCommand/, "deck transport must consume the authoritative session command");
assert.match(storage, /buildMixerStorageKey\(kind, readMixerStorageScope\(\)\)/, "mixer cache must use the full scoped key");
assert.match(playerSection, /grid-cols-1 lg:grid-cols-2/, "both decks must remain mounted in the mobile layout");
assert.doesNotMatch(app, /from "\.\/pages\.config"/, "App must not eagerly import every page");
assert.doesNotMatch(navigationTracker, /from ["']@\/pages\.config/, "navigation tracking must not pull eager pages into the entry chunk");
assert.match(lazyPages, /import\.meta\.glob/, "pages must be route-lazy");

console.log("NUPS DJ continuity contracts: PASS");
