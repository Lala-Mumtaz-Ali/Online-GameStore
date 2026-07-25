"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Plays a Steam trailer.
 *
 * Steam serves trailers only as adaptive streams - DASH manifests and an HLS
 * playlist, with no progressive MP4 anywhere in the API response - so a plain
 * <video src> cannot play them outside Safari. hls.js is loaded lazily, and
 * only once the viewer actually presses play, so the ~40KB never reaches anyone
 * who just browses past the page.
 */
export function TrailerPlayer({
  hlsUrl,
  thumbnailUrl,
  title,
}: {
  hlsUrl: string;
  thumbnailUrl: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!started || !video) return;

    let destroy: (() => void) | undefined;
    let cancelled = false;

    // Order matters, and it is the opposite of what seems obvious. Chrome
    // answers canPlayType("application/vnd.apple.mpegurl") with "maybe" - which
    // is truthy - despite being unable to play HLS at all, so testing native
    // support first silently leaves the video stuck at readyState 0. hls.js
    // documents this: ask Hls.isSupported() first, and only fall back to native
    // playback (Safari) when it says no.
    void import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;

        if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true });
          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            void video.play().catch(() => setFailed(true));
          });
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) setFailed(true);
          });

          destroy = () => hls.destroy();
          return;
        }

        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = hlsUrl;
          void video.play().catch(() => setFailed(true));
          return;
        }

        setFailed(true);
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, [started, hlsUrl]);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        This trailer couldn&apos;t be loaded.
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
      <video
        ref={videoRef}
        controls={started}
        playsInline
        poster={thumbnailUrl}
        className="h-full w-full"
        aria-label={title}
      />
      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          aria-label={`Play trailer: ${title}`}
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/20"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
