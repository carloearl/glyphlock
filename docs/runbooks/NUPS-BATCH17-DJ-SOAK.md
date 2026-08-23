# NUPS Batch 17 DJ Continuity Soak

**Minimum duration:** 30 continuous minutes  
**Environment:** DEMO/SANDBOX or authorized non-live provider content

## Record before starting

```text
start timestamp
operator
venue
mode
browser/device ID
provider
Deck A track
Deck B track
current commit
```

## Required sequence

During active playback, repeatedly perform:

1. Load Deck A and start playback.
2. Open Visualizer and return to Mixer.
3. Open entertainer playlist dock.
4. Save and reload an entertainer playlist.
5. Switch DJ internal tabs/views.
6. Load Deck B.
7. Crossfade A → B and B → A.
8. Cue, pause and resume.
9. Change visualizer state.
10. Open automation view and return.
11. Repeat view navigation at least five times during the soak.

## Observe continuously

- one persistent playback engine;
- song ID remains present;
- current song object remains present;
- active deck remains correct;
- elapsed playback does not reset on navigation;
- no duplicate audio instance;
- no unintended pause/stop;
- visualizer follows the active session;
- playlist order survives save/reload;
- provider failure is visible and recoverable;
- no console/runtime errors affecting playback.

## Pass criteria

```text
duration >= 30 minutes
unexpected stops = 0
state resets = 0
duplicate playback = 0
navigation-caused pause = 0
playlist order preserved = true
```

A source-level reducer test or two-minute smoke test is not a soak.
