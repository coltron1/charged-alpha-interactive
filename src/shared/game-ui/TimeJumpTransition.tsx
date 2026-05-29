import { Handshake, UserRound } from "lucide-react";
import type { CSSProperties } from "react";

export const timeJumpTransitionDurationMs = 4000;

export type TimeJumpChartPoint = {
  date: string;
  value: number;
};

export type TimeJumpEntry = {
  date: string;
  headline: string;
  isFinal?: boolean;
  isMajor?: boolean;
  isMarketMover?: boolean;
  status?: string;
};

export type TimeJumpTransitionModel = {
  chartPoints: TimeJumpChartPoint[];
  entries: TimeJumpEntry[];
  fromBalance: number;
  fromDate: string;
  fromHeadline: string;
  fromProgress: number;
  learning?: TimeJumpLearningModel;
  strategyLabel: string;
  targetBalance: number;
  targetDate: string;
  targetHeadline: string;
  targetProgress: number;
  title: string;
  travelerLabel: string;
};

export type TimeJumpLearningCard = {
  detail: string;
  label: string;
  marker: string;
  value: string;
};

export type TimeJumpLearningModel = {
  cards: TimeJumpLearningCard[];
  formula: string;
  title: string;
  tone: "gain" | "loss" | "flat";
};

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function getDateParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));

  return {
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "2000",
  };
}

function formatDateShort(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getTimeJumpChartRange(points: TimeJumpChartPoint[]) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getTimeJumpChartCoordinate(
  point: TimeJumpChartPoint,
  points: TimeJumpChartPoint[],
  range: { min: number; max: number },
  width: number,
  height: number,
) {
  const start = dateToUtcTime(points[0]?.date ?? point.date);
  const end = dateToUtcTime(points.at(-1)?.date ?? point.date);
  const current = dateToUtcTime(point.date);
  const x = end > start ? ((current - start) / (end - start)) * width : 0;
  const y = height - ((point.value - range.min) / Math.max(1, range.max - range.min)) * height;
  return { x, y };
}

function buildTimeJumpValuePath(points: TimeJumpChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  return points
    .map((point, index) => {
      const { x, y } = getTimeJumpChartCoordinate(point, points, range, width, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTimeJumpAreaPath(points: TimeJumpChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  const line = buildTimeJumpValuePath(points, range, width, height);
  if (!line) {
    return "";
  }
  const first = getTimeJumpChartCoordinate(points[0], points, range, width, height);
  const last = getTimeJumpChartCoordinate(points.at(-1) ?? points[0], points, range, width, height);
  return `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

function getTimeJumpChartTicks(points: TimeJumpChartPoint[], maximumTicks = 5) {
  if (points.length <= maximumTicks) {
    return points;
  }
  return Array.from({ length: maximumTicks }, (_, index) => points[Math.round((index / (maximumTicks - 1)) * (points.length - 1))]);
}

export function buildInterpolatedTimeJumpPoints({
  endDate,
  endValue,
  startDate,
  startValue,
}: {
  endDate: string;
  endValue: number;
  startDate: string;
  startValue: number;
}): TimeJumpChartPoint[] {
  const start = dateToUtcTime(startDate);
  const end = dateToUtcTime(endDate);
  const duration = Math.max(1, end - start);
  const change = endValue - startValue;
  const wiggle = Math.min(Math.abs(change) * 0.16, Math.max(startValue, endValue) * 0.035);
  const dates = [startDate];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);

  while (cursor.getTime() < end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
  }

  if (dates.at(-1) !== endDate) {
    dates.push(endDate);
  }

  return dates.map((date, index) => {
    const current = dateToUtcTime(date);
    const progress = Math.max(0, Math.min(1, (current - start) / duration));
    const eased = progress * progress * (3 - 2 * progress);
    const wave = Math.sin(progress * Math.PI * 2) * wiggle * (1 - Math.abs(progress - 0.5));
    const value = index === 0 ? startValue : index === dates.length - 1 ? endValue : Math.max(0, startValue + change * eased + wave);
    return { date, value };
  });
}

function TimeJumpValueChart({
  formatMoney,
  formatMoneyDelta,
  formatPercent,
  transition,
}: {
  formatMoney: (value: number) => string;
  formatMoneyDelta: (value: number) => string;
  formatPercent: (value: number) => string;
  transition: TimeJumpTransitionModel;
}) {
  const points = transition.chartPoints.length > 0 ? transition.chartPoints : [{ date: transition.fromDate, value: transition.fromBalance }];
  const width = 420;
  const height = 148;
  const range = getTimeJumpChartRange(points);
  const path = buildTimeJumpValuePath(points, range, width, height);
  const areaPath = buildTimeJumpAreaPath(points, range, width, height);
  const ticks = getTimeJumpChartTicks(points);
  const startValue = points[0]?.value ?? transition.fromBalance;
  const endValue = points.at(-1)?.value ?? transition.targetBalance;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
  const tone = change > 0 ? "gain" : change < 0 ? "loss" : "flat";

  return (
    <section className={`storybook-time-reel-value-chart ${tone}`} aria-label={`Investment value chart from ${transition.fromDate} to ${transition.targetDate}`}>
      <header>
        <span>Investment value</span>
        <strong>{formatMoneyDelta(change)}</strong>
        <em>{formatPercent(changePercent)}</em>
        <small>
          {formatMoney(startValue)} to {formatMoney(endValue)}
        </small>
      </header>
      <div
        className="storybook-time-reel-handshake"
        aria-label={`${transition.travelerLabel} selected ${transition.strategyLabel}; the market accepts the order`}
      >
        <span className="storybook-time-reel-handshake-party player">
          <UserRound size={15} aria-hidden="true" />
          <b>{transition.travelerLabel}</b>
        </span>
        <span className="storybook-time-reel-handshake-motion" aria-hidden="true">
          <Handshake size={30} />
          <i />
        </span>
        <span className="storybook-time-reel-handshake-party market">
          <b>Market</b>
        </span>
        <em>{transition.strategyLabel} selected</em>
      </div>
      <div className="storybook-time-reel-chart-plot">
        <div className="storybook-time-reel-y-axis" aria-hidden="true">
          <span>{formatMoney(range.max)}</span>
          <span>{formatMoney((range.max + range.min) / 2)}</span>
          <span>{formatMoney(range.min)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart with account values over this time jump">
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.2} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.8} H ${width}`} />
          {areaPath && <path className="storybook-time-reel-chart-area" d={areaPath} />}
          {path && <path className="storybook-time-reel-chart-line" d={path} pathLength={1} />}
          {points.map((point, index) => {
            const { x, y } = getTimeJumpChartCoordinate(point, points, range, width, height);
            const progress = points.length > 1 ? index / (points.length - 1) : 1;
            return (
              <circle
                key={`${point.date}-${index}`}
                className="storybook-time-reel-chart-dot"
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r={index === 0 || index === points.length - 1 ? 3 : 1.8}
                style={{ "--dot-delay": `${Math.round(220 + progress * 3000)}ms` } as CSSProperties}
              />
            );
          })}
        </svg>
        <span className="storybook-time-reel-chart-scan" aria-hidden="true" />
      </div>
      <footer>
        {ticks.map((point) => (
          <span key={point.date}>{formatDateShort(point.date)}</span>
        ))}
      </footer>
    </section>
  );
}

function TimeJumpLearningPanel({ learning }: { learning: TimeJumpLearningModel }) {
  return (
    <section className={`storybook-time-reel-learning ${learning.tone}`} aria-label={learning.title}>
      <header>
        <span>{learning.title}</span>
        <strong>{learning.formula}</strong>
      </header>
      <div>
        {learning.cards.map((card) => (
          <article key={`${card.marker}-${card.label}`}>
            <b>{card.marker}</b>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TimeJumpTransitionOverlay({
  formatDateLong,
  formatDateWithWeekday,
  formatMoney,
  formatMoneyDelta,
  formatPercent,
  transition,
}: {
  formatDateLong: (date: string) => string;
  formatDateWithWeekday: (date: string) => string;
  formatMoney: (value: number) => string;
  formatMoneyDelta: (value: number) => string;
  formatPercent: (value: number) => string;
  transition: TimeJumpTransitionModel;
}) {
  const currentParts = getDateParts(transition.fromDate);
  const landingParts = getDateParts(transition.targetDate);
  const reelFrames = [
    {
      date: transition.fromDate,
      headline: transition.fromHeadline,
      isCurrent: true,
      isFinal: false,
      isMajor: false,
      isMarketMover: false,
      status: "Current page",
    },
    ...transition.entries.map((entry) => ({
      ...entry,
      isCurrent: false,
      status: entry.status ?? (entry.isFinal ? "Final page" : entry.isMajor ? "Major headline" : "Future page"),
    })),
  ];
  const jumpWidth = Math.max(0, transition.targetProgress - transition.fromProgress);
  const style = {
    "--time-reel-start-progress": `${transition.fromProgress}%`,
    "--time-reel-target-progress": `${transition.targetProgress}%`,
    "--time-reel-jump-progress": `${jumpWidth}%`,
  } as CSSProperties;

  return (
    <div className="storybook-time-reel-overlay" aria-live="polite" aria-label={transition.title}>
      <section className={`storybook-time-reel-card rolodex-watch-skin ${transition.learning ? "has-learning" : ""}`} style={style}>
        <div className="storybook-time-reel-head">
          <span>{transition.title}</span>
          <strong>{transition.strategyLabel}</strong>
        </div>
        <TimeJumpValueChart
          formatMoney={formatMoney}
          formatMoneyDelta={formatMoneyDelta}
          formatPercent={formatPercent}
          transition={transition}
        />
        {transition.learning && <TimeJumpLearningPanel learning={transition.learning} />}
        <div className="storybook-time-reel-date" aria-label={`Spinning from ${formatDateWithWeekday(transition.fromDate)} to ${formatDateWithWeekday(transition.targetDate)}`}>
          {(["month", "day", "year"] as const).map((part) => (
            <div key={part} className={`storybook-time-reel-date-window ${part}`}>
              <span>{part}</span>
              <strong className="storybook-time-reel-date-current">{currentParts[part]}</strong>
              <i className="storybook-time-reel-date-spin" aria-hidden="true" />
              <strong className="storybook-time-reel-date-landing">{landingParts[part]}</strong>
            </div>
          ))}
        </div>
        <div className="storybook-time-reel-headline-window" aria-hidden="true">
          <div className="storybook-time-reel-headline-track">
            {reelFrames.map((entry, index) => (
              <article
                key={`${entry.date}-${index}`}
                className={`storybook-time-reel-headline ${entry.isCurrent ? "current" : ""} ${entry.isMajor ? "major" : ""} ${entry.isMarketMover ? "market-shock" : ""}`}
              >
                <span>{formatDateLong(entry.date)}</span>
                <strong>{entry.headline}</strong>
                <em>{entry.status}</em>
              </article>
            ))}
          </div>
          <article className="storybook-time-reel-landing">
            <span>{formatDateWithWeekday(transition.targetDate)}</span>
            <strong>{transition.targetHeadline}</strong>
          </article>
        </div>
        <div className="storybook-time-reel-timeline" aria-label={`Timeline advancing from ${formatDateLong(transition.fromDate)} to ${formatDateLong(transition.targetDate)}`}>
          <span>{formatDateLong(transition.fromDate)}</span>
          <span>{formatDateLong(transition.targetDate)}</span>
          <div className="storybook-time-reel-track" aria-hidden="true">
            <i className="storybook-time-reel-track-base" />
            <i className="storybook-time-reel-track-jump" />
            <b className="storybook-time-reel-jonah-pin">
              <UserRound size={14} />
              <span className="sr-only">{transition.travelerLabel}</span>
            </b>
          </div>
        </div>
      </section>
    </div>
  );
}
