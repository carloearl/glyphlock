/**
 * useLivePlayerTrack — reads the DJ mixer's live state off the club broadcast
 * channel so the Fable stage always knows the active deck, track and queue.
 * Read-only: it never controls playback.
 */
import { useEffect, useState } from "react";
import { subscribeClubTV } from "../ClubBroadcastChannel";
import { useOptionalDJSession } from "../session/DJSessionProvider";

export default function useLivePlayerTrack() {
  const session = useOptionalDJSession();
  const [state, setState] = useState({ deckA: null, deckB: null, crossfade: 50 });

  useEffect(() => subscribeClubTV((data) => {
    if (data) setState((prev) => ({ ...prev, ...data }));
  }), []);

  if (session) {
    const deck = session.state.activeDeck;
    const track = deck === "A" ? session.state.deckA.song : session.state.deckB.song;
    const nextTrack = deck === "A" ? session.state.deckB.song : session.state.deckA.song;
    return {
      deck,
      track: track || null,
      nextTrack: nextTrack || null,
      crossfade: session.state.crossfade,
      syncSource: track?.youtubeUrl ? "metadata-mic-or-synthetic" : "deck-audio",
    };
  }

  const deck = (Number(state.crossfade) || 50) < 50 ? "A" : "B";
  const track = deck === "A" ? state.deckA : state.deckB;
  const nextTrack = deck === "A" ? state.deckB : state.deckA;

  return { deck, track: track || null, nextTrack: nextTrack || null, crossfade: state.crossfade };
}