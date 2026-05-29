import { ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type GuidePlacement = "top" | "right" | "bottom" | "left";

export type DashboardGuideItem = {
  target: string;
  arrowTargets?: string[];
  arrowTargetNudges?: Record<string, { x?: number; y?: number }>;
  title: string;
  body: string;
  placement: GuidePlacement;
  mobilePlacement?: GuidePlacement;
  widePlacement?: GuidePlacement;
  nudge?: { x?: number; y?: number };
  mobileNudge?: { x?: number; y?: number };
  wideNudge?: { x?: number; y?: number };
  showArrow?: boolean;
  spotTargets?: string[];
  variant?: "primary";
};

type GuideRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DashboardGuideCallout = {
  item: DashboardGuideItem;
  rect: GuideRect;
  target: { x: number; y: number };
  callout: { x: number; y: number };
};

function getGuideRect(element: Element): GuideRect {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

function getRectCenter(rect: GuideRect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getDashboardGuideCalloutSize(item: DashboardGuideItem, viewport: { width: number; height: number }) {
  const isMobile = viewport.width <= 768;
  const isWideLandscape = viewport.width >= 900 && viewport.width > viewport.height;
  const isWideCallout = item.variant === "primary" || item.target === "date-console" || item.target === "timeline";
  const mobileTimelineWidth = Math.min(318, viewport.width - 28);
  return {
    width: isMobile
      ? item.target === "timeline"
        ? mobileTimelineWidth
        : isWideCallout
          ? 176
          : 152
      : isWideLandscape
        ? item.target === "timeline"
          ? 310
          : isWideCallout
            ? 226
            : 206
        : isWideCallout
          ? 276
          : 236,
    height: isMobile ? 76 : isWideLandscape ? 92 : 112,
  };
}

function getGuideCalloutPoint(item: DashboardGuideItem, rect: GuideRect, viewport: { width: number; height: number }) {
  const isMobile = viewport.width <= 768;
  const isWideLandscape = viewport.width >= 900 && viewport.width > viewport.height;
  const placement = isMobile ? (item.mobilePlacement ?? item.placement) : isWideLandscape ? (item.widePlacement ?? item.placement) : item.placement;
  const nudge = isMobile ? (item.mobileNudge ?? item.nudge) : isWideLandscape ? (item.wideNudge ?? item.nudge) : item.nudge;
  const center = getRectCenter(rect);
  const distance = isMobile ? 74 : isWideLandscape ? 96 : 150;
  const calloutWidth = getDashboardGuideCalloutSize(item, viewport).width;
  const calloutHeight = isMobile ? 76 : isWideLandscape ? 92 : 112;
  let x = center.x;
  let y = center.y;

  if (placement === "left") x = rect.x - distance;
  if (placement === "right") x = rect.x + rect.width + distance;
  if (placement === "top") y = rect.y - distance;
  if (placement === "bottom") y = rect.y + rect.height + distance;

  x += nudge?.x ?? 0;
  y += nudge?.y ?? 0;

  return {
    x: clampNumber(x, calloutWidth / 2 + 10, viewport.width - calloutWidth / 2 - 10),
    y: clampNumber(y, calloutHeight / 2 + 10, viewport.height - calloutHeight / 2 - 66),
  };
}

function resolveDashboardGuideCallouts(callouts: DashboardGuideCallout[], viewport: { width: number; height: number }) {
  if (callouts.length <= 1 || viewport.width > 768) {
    return callouts;
  }

  const topBound = 58;
  const bottomBound = Math.max(topBound + 80, viewport.height - 8);
  const gap = viewport.height <= 700 ? 10 : 14;
  const ordered = [...callouts].sort((a, b) => a.callout.y - b.callout.y);
  const adjusted: DashboardGuideCallout[] = [];

  ordered.forEach((entry) => {
    const size = getDashboardGuideCalloutSize(entry.item, viewport);
    const halfHeight = size.height / 2;
    const maximumY = bottomBound - halfHeight;
    const left = entry.callout.x - size.width / 2;
    const right = entry.callout.x + size.width / 2;
    let minimumY = topBound + halfHeight;

    adjusted.forEach((previous) => {
      const previousSize = getDashboardGuideCalloutSize(previous.item, viewport);
      const previousLeft = previous.callout.x - previousSize.width / 2;
      const previousRight = previous.callout.x + previousSize.width / 2;
      const overlapsX = left < previousRight + 8 && right > previousLeft - 8;
      if (overlapsX) {
        minimumY = Math.max(minimumY, previous.callout.y + previousSize.height / 2 + halfHeight + gap);
      }
    });

    const nextY = clampNumber(Math.max(entry.callout.y, minimumY), topBound + halfHeight, maximumY);

    adjusted.push({
      ...entry,
      callout: {
        ...entry.callout,
        y: nextY,
      },
    });
  });

  const lastEntry = adjusted.at(-1);
  if (!lastEntry) {
    return callouts;
  }

  const lastSize = getDashboardGuideCalloutSize(lastEntry.item, viewport);
  const overflow = lastEntry.callout.y + lastSize.height / 2 - bottomBound;
  if (overflow <= 0) {
    return adjusted;
  }

  let nextBottom = bottomBound;
  return [...adjusted]
    .reverse()
    .map((entry) => {
      const size = getDashboardGuideCalloutSize(entry.item, viewport);
      const halfHeight = size.height / 2;
      const maximumY = nextBottom - halfHeight;
      const y = clampNumber(Math.min(entry.callout.y - overflow, maximumY), topBound + halfHeight, bottomBound - halfHeight);
      nextBottom = y - halfHeight - gap;
      return {
        ...entry,
        callout: {
          ...entry.callout,
          y,
        },
      };
    })
    .reverse();
}

function isDashboardGuideCallout(entry: DashboardGuideCallout | null): entry is DashboardGuideCallout {
  return entry !== null;
}

function getDashboardGuideTargets(item: DashboardGuideItem) {
  return Array.from(new Set([item.target, ...(item.arrowTargets ?? []), ...(item.spotTargets ?? [])]));
}

function getDashboardGuideArrowTargets(item: DashboardGuideItem) {
  return item.arrowTargets && item.arrowTargets.length > 0 ? item.arrowTargets : [item.target];
}

function getDashboardGuideSpotTargets(item: DashboardGuideItem) {
  return item.spotTargets && item.spotTargets.length > 0 ? item.spotTargets : [item.target];
}

export function TargetGuideOverlay({
  buttonLabel,
  className,
  guideItems,
  label,
  onStart,
  showStartButton = true,
  subtitle,
  title,
}: {
  buttonLabel: string;
  className: string;
  guideItems: DashboardGuideItem[];
  label: string;
  onStart: () => void;
  showStartButton?: boolean;
  subtitle?: string;
  title: string;
}) {
  const startedRef = useRef(false);
  const [guideLayout, setGuideLayout] = useState<{
    rects: Record<string, GuideRect>;
    viewport: { width: number; height: number };
  }>({ rects: {}, viewport: { width: 0, height: 0 } });

  const startGuide = useCallback(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    onStart();
  }, [onStart]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopPropagation();
        startGuide();
      }
    };
    const handleClickDismiss = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      startGuide();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("click", handleClickDismiss, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("click", handleClickDismiss, true);
    };
  }, [startGuide]);

  useEffect(() => {
    const measure = () => {
      const rects: Record<string, GuideRect> = {};
      guideItems.forEach((item) => {
        getDashboardGuideTargets(item).forEach((targetName) => {
          const target = document.querySelector(`[data-guide-target="${targetName}"]`);
          if (target) {
            rects[targetName] = getGuideRect(target);
          }
        });
      });
      setGuideLayout({
        rects,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      });
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [guideItems]);

  const rawCallouts = guideItems
    .map((item) => {
      const rect = guideLayout.rects[item.target];
      if (!rect || guideLayout.viewport.width === 0 || guideLayout.viewport.height === 0) {
        return null;
      }
      return {
        item,
        rect,
        target: getRectCenter(rect),
        callout: getGuideCalloutPoint(item, rect, guideLayout.viewport),
      };
    })
    .filter(isDashboardGuideCallout);
  const callouts = resolveDashboardGuideCallouts(rawCallouts, guideLayout.viewport);
  const guideArrows = callouts.flatMap((entry) => {
    if (entry.item.showArrow === false) {
      return [];
    }
    return getDashboardGuideArrowTargets(entry.item).flatMap((targetName) => {
      const rect = guideLayout.rects[targetName];
      if (!rect) {
        return [];
      }
      return [
        {
          key: `${entry.item.target}-${targetName}-arrow`,
          callout: entry.callout,
          target: {
            x: getRectCenter(rect).x + (entry.item.arrowTargetNudges?.[targetName]?.x ?? 0),
            y: getRectCenter(rect).y + (entry.item.arrowTargetNudges?.[targetName]?.y ?? 0),
          },
        },
      ];
    });
  });
  const guideSpots = Array.from(
    callouts.reduce((spots, entry) => {
      getDashboardGuideSpotTargets(entry.item).forEach((targetName) => {
        const rect = guideLayout.rects[targetName];
        if (rect) {
          spots.set(targetName, { targetName, rect });
        }
      });
      return spots;
    }, new Map<string, { targetName: string; rect: GuideRect }>()),
  ).map(([, value]) => value);
  const markerId = `${className}-arrowhead`;

  return (
    <div className={`storybook-guide-overlay dashboard-guide ${className}`} role="dialog" aria-modal="true" aria-label={label} onClick={startGuide}>
      <svg className="storybook-dashboard-guide-arrows" aria-hidden="true">
        <defs>
          <marker id={markerId} markerHeight="7" markerWidth="7" orient="auto" refX="6" refY="3.5">
            <path d="M0,0 L7,3.5 L0,7 Z" />
          </marker>
        </defs>
        {guideArrows.map((entry) => (
          <line
            key={entry.key}
            x1={entry.callout.x}
            x2={entry.target.x}
            y1={entry.callout.y}
            y2={entry.target.y}
            markerEnd={`url(#${markerId})`}
          />
        ))}
      </svg>

      {guideSpots.map((entry) => (
        <span
          key={`${entry.targetName}-spot`}
          className={`storybook-dashboard-guide-spot ${entry.targetName}`}
          style={{
            height: `${entry.rect.height + 12}px`,
            left: `${entry.rect.x - 6}px`,
            top: `${entry.rect.y - 6}px`,
            width: `${entry.rect.width + 12}px`,
          }}
        />
      ))}

      {callouts.map((entry) => (
        <article
          key={entry.item.target}
          className={`storybook-dashboard-callout ${entry.item.target} ${entry.item.variant ?? ""}`}
          style={{ left: `${entry.callout.x}px`, top: `${entry.callout.y}px` }}
        >
          <strong>{entry.item.title}</strong>
          <p>{entry.item.body}</p>
        </article>
      ))}

      <div className="storybook-dashboard-guide-title">
        <strong>{title}</strong>
      </div>
      {subtitle ? <div className="storybook-dashboard-guide-start-hint">{subtitle}</div> : null}

      {showStartButton && (
        <button className="primary-action legacy-primary storybook-dashboard-guide-start" type="button" onClick={startGuide}>
          {buttonLabel}
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}
