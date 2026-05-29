import { Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { HeadlineEvent } from "../content/events";
import { fetchHeadlineImage, type HeadlineImageAsset } from "../content/headlineImages";

const headlineImageCache = new Map<string, HeadlineImageAsset | null>();

function useHeadlineImage(event: HeadlineEvent | null) {
  const [imageState, setImageState] = useState<{
    eventId: string | null;
    image: HeadlineImageAsset | null;
    status: "empty" | "ready";
  }>({ eventId: null, image: null, status: "empty" });

  const cached = event && headlineImageCache.has(event.id) ? (headlineImageCache.get(event.id) ?? null) : undefined;
  const visibleState = !event
    ? { image: null, status: "empty" as const }
    : cached !== undefined
      ? { image: cached, status: cached ? ("ready" as const) : ("empty" as const) }
      : imageState.eventId === event.id
        ? imageState
        : { image: null, status: "loading" as const };

  useEffect(() => {
    if (!event || headlineImageCache.has(event.id)) {
      return;
    }

    const controller = new AbortController();

    fetchHeadlineImage(event, controller.signal)
      .then((image) => {
        headlineImageCache.set(event.id, image);
        setImageState({ eventId: event.id, image, status: image ? "ready" : "empty" });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          headlineImageCache.set(event.id, null);
          setImageState({ eventId: event.id, image: null, status: "empty" });
        }
      });

    return () => controller.abort();
  }, [event]);

  return visibleState;
}

export function HeadlineEventImage({ event, variant }: { event: HeadlineEvent | null; variant: "newspaper" | "preview" }) {
  const { image, status } = useHeadlineImage(event);

  if (!event) {
    return null;
  }

  if (image) {
    return (
      <figure className={`storybook-headline-photo ${variant} ready`}>
        <img src={image.url} alt={image.alt} loading="lazy" referrerPolicy="no-referrer" />
        <figcaption>
          <a href={image.pageUrl} target="_blank" rel="noreferrer">
            {image.title}
          </a>
          <span>{image.license}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className={`storybook-headline-photo ${variant} ${status}`}>
      <ImageIcon size={22} />
      <figcaption>
        <span>{status === "loading" ? "Searching Wikimedia Commons" : "Archive image unavailable"}</span>
        <span>{status === "loading" ? "Licensed image lookup" : "The clipping still has the full article"}</span>
      </figcaption>
    </figure>
  );
}
