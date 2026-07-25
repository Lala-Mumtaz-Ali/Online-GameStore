"use client";

import { useEffect, useState } from "react";

type Screenshot = { id: string; url: string; thumbnailUrl: string };

/**
 * Thumbnail strip with a lightbox. Client-side because it holds the selected
 * index and binds keyboard navigation; the images themselves are plain <img>
 * pointing at Steam's CDN.
 */
export function ScreenshotGallery({
  screenshots,
  title,
}: {
  screenshots: Screenshot[];
  title: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenIndex(null);
      if (event.key === "ArrowRight") {
        setOpenIndex((i) => (i === null ? i : (i + 1) % screenshots.length));
      }
      if (event.key === "ArrowLeft") {
        setOpenIndex((i) =>
          i === null ? i : (i - 1 + screenshots.length) % screenshots.length
        );
      }
    }

    window.addEventListener("keydown", onKey);
    // The lightbox covers the page, so the page behind it must not scroll.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, screenshots.length]);

  if (screenshots.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {screenshots.map((shot, index) => (
          <button
            key={shot.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="group aspect-video overflow-hidden rounded-lg border bg-muted"
            aria-label={`View screenshot ${index + 1} of ${screenshots.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.thumbnailUrl}
              alt={`${title} screenshot ${index + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} screenshot viewer`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshots[openIndex].url}
            alt={`${title} screenshot ${openIndex + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Close"
            className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            Close
          </button>
          <p className="absolute bottom-4 text-sm text-white/70">
            {openIndex + 1} / {screenshots.length} &middot; arrow keys to browse
          </p>
        </div>
      )}
    </>
  );
}
