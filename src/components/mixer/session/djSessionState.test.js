import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialDJSessionState,
  djSessionReducer,
  createDeckCommand,
  selectActiveDeckSnapshot,
} from "./djSessionState.js";
import { getProviderCapability, canUseAsVenueDeckSource } from "./providerCapabilities.js";
import { createScopedLayoutKey, normalizeLayout, WORKBENCH_PRESETS } from "./djLayout.js";
import { matchImportedTrack } from "./playlistMatching.js";
import {
  classifyYouTubeError,
  createYouTubeCommandGate,
  createYouTubeWatchdogState,
  advanceYouTubeWatchdog,
} from "./youtubeHealth.js";

test("typed deck commands are acknowledged exactly once and preserve queue", () => {
  const initial = createInitialDJSessionState({ queue: ["one", "two"] });
  const command = createDeckCommand({
    requestId: "req-1",
    targetDeck: "B",
    song: { id: "track-7", source: "youtube", source_id: "abcdefghijk" },
    entityTrackId: "track-7",
  });
  const requested = djSessionReducer(initial, { type: "DECK_COMMAND_REQUESTED", command });
  const loaded = djSessionReducer(requested, { type: "DECK_LOADED", requestId: "req-1", deck: "B", songId: "track-7" });
  const duplicate = djSessionReducer(loaded, { type: "DECK_LOADED", requestId: "req-1", deck: "B", songId: "track-7" });
  assert.deepEqual(duplicate.queue, ["one", "two"]);
  assert.equal(duplicate.deckB.songId, "track-7");
  assert.equal(duplicate.commandAcks.filter((ack) => ack.requestId === "req-1").length, 1);
});

test("50 view changes and 20 accelerated transitions preserve one session identity", () => {
  let state = createInitialDJSessionState();
  const sessionId = state.sessionId;
  for (let i = 0; i < 50; i += 1) {
    state = djSessionReducer(state, { type: "VIEW_CHANGED", view: i % 2 ? "visuals" : "library" });
  }
  for (let i = 0; i < 20; i += 1) {
    const deck = i % 2 ? "A" : "B";
    state = djSessionReducer(state, { type: "DECK_LOADED_DIRECT", deck, songId: `soak-${i}` });
    state = djSessionReducer(state, { type: "ACTIVE_DECK_CHANGED", deck });
  }
  assert.equal(state.sessionId, sessionId);
  assert.equal(state.transitionCount, 20);
  assert.equal(state.diagnostics.length <= 200, true);
  assert.equal(selectActiveDeckSnapshot(state).songId, "soak-19");
});

test("provider capability truth forbids consumer catalog sources as venue decks", () => {
  assert.equal(getProviderCapability("direct").pcmAnalysis, true);
  assert.equal(getProviderCapability("youtube").pcmAnalysis, false);
  assert.equal(canUseAsVenueDeckSource("spotify"), false);
  assert.equal(canUseAsVenueDeckSource("apple_music"), false);
  assert.equal(getProviderCapability("spotify").discover, true);
  assert.equal(getProviderCapability("apple_music").importPlaylistMetadata, true);
});

test("layout serialization is scoped and minimum-safe", () => {
  const keyA = createScopedLayoutKey({ venueId: "venue-a", operatorId: "operator-1", deviceId: "desk" });
  const keyB = createScopedLayoutKey({ venueId: "venue-b", operatorId: "operator-1", deviceId: "desk" });
  assert.notEqual(keyA, keyB);
  const layout = normalizeLayout({ performance: 1, library: 99, visual: 0 });
  assert.ok(layout.performance >= 35);
  assert.ok(layout.library >= 18);
  assert.ok(layout.visual >= 18);
  assert.ok(WORKBENCH_PRESETS.performance);
});

test("playlist import matches ISRC first and never silently substitutes", () => {
  const approved = [
    { id: "wrong-title", isrc: "US-AAA-12-34567", title: "Different", artist: "Different", playable: true },
    { id: "name-only", title: "Song Name", artist: "Artist", playable: true },
  ];
  const matched = matchImportedTrack({ isrc: "usaaa1234567", title: "Song Name", artist: "Artist" }, approved);
  assert.equal(matched.track.id, "wrong-title");
  assert.equal(matched.method, "isrc");
  const unmatched = matchImportedTrack({ title: "Unknown", artist: "Nobody" }, approved);
  assert.equal(unmatched.status, "unmatched");
  assert.equal(unmatched.track, null);
});

test("YouTube health classifies provider errors, deduplicates commands, and retries once", () => {
  assert.match(classifyYouTubeError(153).message, /Referer|identity/i);
  assert.equal(classifyYouTubeError(101).retryable, false);
  const gate = createYouTubeCommandGate({ volumeCadenceMs: 100, volumeDelta: 2 });
  assert.equal(gate.shouldApplyVolume(50, 0), true);
  assert.equal(gate.shouldApplyVolume(50, 10), false);
  assert.equal(gate.shouldApplyMute(false), true);
  assert.equal(gate.shouldApplyMute(false), false);

  let watchdog = createYouTubeWatchdogState();
  watchdog = advanceYouTubeWatchdog(watchdog, { now: 0, position: 5, state: "PLAYING" });
  watchdog = advanceYouTubeWatchdog(watchdog, { now: 9000, position: 5, state: "PLAYING" });
  assert.equal(watchdog.action, "retry");
  watchdog = advanceYouTubeWatchdog(watchdog, { now: 18000, position: 5, state: "PLAYING" });
  assert.equal(watchdog.action, "operator");
  assert.equal(watchdog.retryCount, 1);
  const buffering = advanceYouTubeWatchdog(watchdog, { now: 27000, position: 5, state: "BUFFERING" });
  assert.notEqual(buffering.action, "ended");
});
