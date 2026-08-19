/**
 * FableMediaLayer — optional video backdrop for the Fable stage.
 * Plays the live player's YouTube video, an uploaded MP4, or any custom URL.
 * Always muted: the stage never emits audio into the room.
 */
import React from "react";
import { resolveFableMedia } from "./fableMedia";

export default function FableMediaLayer({ settings, track }) {
  const { kind, src } = resolveFableMedia(settings, track);
  if (!kind) return null;

  const dim = { opacity: Math.max(0.15, Number(settings.mediaOpacity) || 1) };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
      {kind === "youtube" ? (
        <iframe
          key={src}
          src={src}
          title="Fable stage video"
          allow="autoplay; encrypted-media"
          className="absolute left-1/2 top-1/2 h-[100%] w-[178vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          style={dim}
        />
      ) : (
        <video
          key={src}
          src={src}
          muted
          autoPlay
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          style={dim}
        />
      )}
    </div>
  );
}