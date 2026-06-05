import { Handshake, UserRound } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { flushSync } from "react-dom";

export const timeJumpTransitionDurationMs = 3600;

export type TimeJumpChartPoint = {
  date: string;
  progress?: number;
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
  durationMs?: number;
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
  targetChart?: TimeJumpTargetChartModel;
  title: string;
  travelerLabel: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
};

export type TimeJumpTargetChartModel = {
  assetLabel: string;
  bestExitMarker?: TimeJumpTargetChartMarker;
  closedEarly?: boolean;
  closeMarker?: TimeJumpTargetChartMarker;
  domainEndDate?: string;
  domainStartDate?: string;
  finalLabel: string;
  hit: boolean;
  hitLabel: string;
  lowerTarget?: number;
  livePayoffLabel?: string;
  livePayoffPoints?: TimeJumpChartPoint[];
  livePayoffZeroLabel?: string;
  liveValueLabel?: string;
  liveValuePoints?: TimeJumpChartPoint[];
  liveValueStart?: number;
  moveLabel: string;
  points: TimeJumpChartPoint[];
  readouts?: TimeJumpTargetReadout[];
  recap?: TimeJumpTargetRecapModel;
  startLabel: string;
  targetKind: "above" | "below" | "outside" | "none";
  targetLabel: string;
  upperTarget?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
};

export type TimeJumpCloseSnapshot = {
  date: string;
  progress: number;
  value: number;
};

type TimeJumpChartDomain = {
  endDate?: string;
  startDate?: string;
};

export type TimeJumpTargetRecapItem = {
  detail?: string;
  label: string;
  tone?: "gain" | "loss" | "neutral" | "tax";
  value: string;
};

export type TimeJumpTargetRecapModel = {
  footer?: string;
  items: TimeJumpTargetRecapItem[];
  optimal?: TimeJumpTargetRecapItem;
  resultLabel?: string;
  resultTone?: "gain" | "loss" | "neutral";
  resultValue?: string;
  subtitle?: string;
  title: string;
};

export type TimeJumpTargetChartMarker = {
  accountLabel?: string;
  date: string;
  detail?: string;
  label: string;
  progress?: number;
  tone?: "best" | "hit" | "miss" | "player";
  value: number;
};

export type TimeJumpTargetReadout = {
  label: string;
  tone?: "gain" | "loss" | "neutral" | "target" | "hit" | "miss" | "tax";
  value: string;
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

function utcTimeToDate(time: number) {
  return new Date(time).toISOString().slice(0, 10);
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

function getTimeJumpChartRange(points: TimeJumpChartPoint[], extraValues: number[] = []) {
  const values = [...points.map((point) => point.value), ...extraValues.filter(Number.isFinite)];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getTimeJumpChartY(value: number, range: { min: number; max: number }, height: number) {
  return height - ((value - range.min) / Math.max(1, range.max - range.min)) * height;
}

function getTimeJumpChartCoordinate(
  point: TimeJumpChartPoint,
  points: TimeJumpChartPoint[],
  range: { min: number; max: number },
  width: number,
  height: number,
  domain: TimeJumpChartDomain = {},
) {
  const start = dateToUtcTime(domain.startDate ?? points[0]?.date ?? point.date);
  const end = dateToUtcTime(domain.endDate ?? points.at(-1)?.date ?? point.date);
  const current = dateToUtcTime(point.date);
  const pointProgress = Number.isFinite(point.progress) ? Math.max(0, Math.min(1, point.progress ?? 0)) : null;
  const x = pointProgress !== null ? pointProgress * width : end > start ? ((current - start) / (end - start)) * width : 0;
  const y = height - ((point.value - range.min) / Math.max(1, range.max - range.min)) * height;
  return { x, y };
}

function buildTimeJumpValuePath(
  points: TimeJumpChartPoint[],
  range: { min: number; max: number },
  width: number,
  height: number,
  domain: TimeJumpChartDomain = {},
) {
  return points
    .map((point, index) => {
      const { x, y } = getTimeJumpChartCoordinate(point, points, range, width, height, domain);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTimeJumpAreaPath(
  points: TimeJumpChartPoint[],
  range: { min: number; max: number },
  width: number,
  height: number,
  domain: TimeJumpChartDomain = {},
) {
  const line = buildTimeJumpValuePath(points, range, width, height, domain);
  if (!line) {
    return "";
  }
  const first = getTimeJumpChartCoordinate(points[0], points, range, width, height, domain);
  const last = getTimeJumpChartCoordinate(points.at(-1) ?? points[0], points, range, width, height, domain);
  return `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

function getTimeJumpChartTicks(points: TimeJumpChartPoint[], maximumTicks = 5) {
  if (points.length <= maximumTicks) {
    return points;
  }
  return Array.from({ length: maximumTicks }, (_, index) => points[Math.round((index / (maximumTicks - 1)) * (points.length - 1))]);
}

function getInterpolatedTimeJumpSnapshot(pointsInput: TimeJumpChartPoint[], progress: number): TimeJumpCloseSnapshot {
  const points = pointsInput.length > 0 ? pointsInput : [{ date: new Date().toISOString().slice(0, 10), value: 0 }];
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const startTime = dateToUtcTime(points[0]?.date ?? "");
  const endTime = dateToUtcTime(points.at(-1)?.date ?? points[0]?.date ?? "");
  const snapshotTime = startTime + Math.max(0, endTime - startTime) * clampedProgress;
  const afterIndex = points.findIndex((point) => dateToUtcTime(point.date) >= snapshotTime);
  const nextIndex = afterIndex < 0 ? points.length - 1 : afterIndex;
  const previousIndex = Math.max(0, nextIndex - 1);
  const previous = points[previousIndex] ?? points[0];
  const next = points[nextIndex] ?? previous;
  const previousTime = dateToUtcTime(previous.date);
  const nextTime = dateToUtcTime(next.date);
  const segmentProgress = nextTime > previousTime ? (snapshotTime - previousTime) / (nextTime - previousTime) : 0;
  const value = previous.value + (next.value - previous.value) * Math.max(0, Math.min(1, segmentProgress));

  return {
    date: utcTimeToDate(snapshotTime),
    progress: clampedProgress,
    value,
  };
}

function getTargetChartSnapshot(targetChart: TimeJumpTargetChartModel, progress: number): TimeJumpCloseSnapshot {
  return getInterpolatedTimeJumpSnapshot(targetChart.points, progress);
}

function getVisibleTimeJumpPoints(pointsInput: TimeJumpChartPoint[], progress: number) {
  const points = pointsInput.length > 0 ? pointsInput : [{ date: new Date().toISOString().slice(0, 10), value: 0 }];
  const snapshot = getInterpolatedTimeJumpSnapshot(points, progress);
  const snapshotTime = dateToUtcTime(snapshot.date);
  const visiblePoints = points.filter((point) => dateToUtcTime(point.date) < snapshotTime);
  const lastVisible = visiblePoints.at(-1);

  if (!lastVisible || lastVisible.date !== snapshot.date || Math.abs(lastVisible.value - snapshot.value) > 0.001) {
    visiblePoints.push({ date: snapshot.date, progress: snapshot.progress, value: snapshot.value });
  }

  if (visiblePoints.length === 0) {
    visiblePoints.push(points[0]);
  }

  return visiblePoints;
}

function isTimeJumpTargetHit(targetChart: TimeJumpTargetChartModel, value: number) {
  if (targetChart.targetKind === "above") {
    return Number.isFinite(targetChart.upperTarget) && value >= (targetChart.upperTarget ?? Number.POSITIVE_INFINITY);
  }
  if (targetChart.targetKind === "below") {
    return Number.isFinite(targetChart.lowerTarget) && value <= (targetChart.lowerTarget ?? Number.NEGATIVE_INFINITY);
  }
  if (targetChart.targetKind === "outside") {
    const belowLower = Number.isFinite(targetChart.lowerTarget) && value <= (targetChart.lowerTarget ?? Number.NEGATIVE_INFINITY);
    const aboveUpper = Number.isFinite(targetChart.upperTarget) && value >= (targetChart.upperTarget ?? Number.POSITIVE_INFINITY);
    return belowLower || aboveUpper;
  }
  return true;
}

function getTimeJumpChartSegments(
  points: TimeJumpChartPoint[],
  targetChart: TimeJumpTargetChartModel,
  range: { min: number; max: number },
  width: number,
  height: number,
  domain: TimeJumpChartDomain = {},
) {
  if (points.length < 2) {
    return [];
  }

  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1];
    const start = getTimeJumpChartCoordinate(point, points, range, width, height, domain);
    const end = getTimeJumpChartCoordinate(next, points, range, width, height, domain);
    const midpointValue = (point.value + next.value) / 2;
    const progress = points.length > 2 ? index / (points.length - 2) : 0;
    return {
      d: `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} L ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
      date: `${point.date}-${next.date}`,
      hit: isTimeJumpTargetHit(targetChart, midpointValue),
      progress,
    };
  });
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
          {transition.yAxisLabel && (
            <text className="storybook-time-reel-axis-label y" x="8" y="14">
              {transition.yAxisLabel}
            </text>
          )}
          {transition.xAxisLabel && (
            <text className="storybook-time-reel-axis-label x" x={width - 8} y={height - 7}>
              {transition.xAxisLabel}
            </text>
          )}
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

function formatTimeJumpChartValue(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    minimumFractionDigits: value < 1000 ? 1 : 0,
  });
}

function TimeJumpTargetPriceChart({
  animationProgress,
  formatMoney,
  formatMoneyDelta,
  targetChart,
  transition,
}: {
  animationProgress: number;
  formatMoney: (value: number) => string;
  formatMoneyDelta: (value: number) => string;
  targetChart: TimeJumpTargetChartModel;
  transition: TimeJumpTransitionModel;
}) {
  const points = targetChart.points.length > 0 ? targetChart.points : transition.chartPoints;
  const width = 420;
  const height = 148;
  const targetValues = [targetChart.lowerTarget, targetChart.upperTarget].filter((value): value is number => Number.isFinite(value));
  const range = getTimeJumpChartRange(points, targetValues);
  const chartDomain = {
    endDate: targetChart.domainEndDate,
    startDate: targetChart.domainStartDate,
  };
  const path = buildTimeJumpValuePath(points, range, width, height, chartDomain);
  const tickPoints =
    targetChart.domainEndDate && points.at(-1)?.date !== targetChart.domainEndDate
      ? [...points, { date: targetChart.domainEndDate, value: points.at(-1)?.value ?? points[0]?.value ?? 0 }]
      : points;
  const ticks = getTimeJumpChartTicks(tickPoints);
  const lowerY = Number.isFinite(targetChart.lowerTarget) ? getTimeJumpChartY(targetChart.lowerTarget ?? 0, range, height) : null;
  const upperY = Number.isFinite(targetChart.upperTarget) ? getTimeJumpChartY(targetChart.upperTarget ?? 0, range, height) : null;
  const showTargetRecap = Boolean(targetChart.recap && (targetChart.closedEarly || animationProgress >= 1));
  const startValue = points[0]?.value ?? 0;
  const endValue = points.at(-1)?.value ?? startValue;
  const finalCoordinate = points.length > 0 ? getTimeJumpChartCoordinate(points.at(-1) ?? points[0], points, range, width, height, chartDomain) : null;
  const closeMarkerCoordinate = targetChart.closeMarker
    ? getTimeJumpChartCoordinate(
        {
          date: targetChart.closeMarker.date,
          progress: targetChart.closeMarker.progress,
          value: targetChart.closeMarker.value,
        },
        points,
        range,
        width,
        height,
        chartDomain,
      )
    : finalCoordinate;
  const bestExitCoordinate = targetChart.bestExitMarker
    ? getTimeJumpChartCoordinate({ date: targetChart.bestExitMarker.date, value: targetChart.bestExitMarker.value }, points, range, width, height, chartDomain)
    : null;
  const closeLabelOnLeft = closeMarkerCoordinate ? closeMarkerCoordinate.x > width - 112 : false;
  const closeLabelX = closeMarkerCoordinate ? Math.max(10, Math.min(width - 10, closeMarkerCoordinate.x + (closeLabelOnLeft ? -8 : 8))) : 0;
  const bestLabelOnLeft = bestExitCoordinate ? bestExitCoordinate.x > width - 128 : false;
  const bestLabelX = bestExitCoordinate ? Math.max(12, Math.min(width - 12, bestExitCoordinate.x + (bestLabelOnLeft ? -10 : 10))) : 0;
  const progress = showTargetRecap ? 1 : Math.max(0, Math.min(1, animationProgress));
  const livePrice = getInterpolatedTimeJumpSnapshot(points, progress);
  const visiblePoints = getVisibleTimeJumpPoints(points, progress);
  const visibleSegments = getTimeJumpChartSegments(visiblePoints, targetChart, range, width, height, chartDomain);
  const liveCoordinate = getTimeJumpChartCoordinate(livePrice, points, range, width, height, chartDomain);
  const markerLabelOnLeft = liveCoordinate.x > width - 88;
  const markerLabelX = Math.max(12, Math.min(width - 12, liveCoordinate.x + (markerLabelOnLeft ? -12 : 12)));
  const markerLabelY = Math.max(16, Math.min(height - 12, liveCoordinate.y - 14));
  const liveValue = targetChart.liveValuePoints?.length ? getInterpolatedTimeJumpSnapshot(targetChart.liveValuePoints, progress) : null;
  const liveValueStart = targetChart.liveValueStart ?? targetChart.liveValuePoints?.[0]?.value ?? 0;
  const livePayoff = targetChart.livePayoffPoints?.length ? getInterpolatedTimeJumpSnapshot(targetChart.livePayoffPoints, progress) : null;
  const liveDelta = liveValue ? liveValue.value - liveValueStart : 0;
  const liveHit = isTimeJumpTargetHit(targetChart, livePrice.value);
  const chartHit = showTargetRecap ? targetChart.hit : liveHit;
  const liveTone = liveHit ? "hit" : "miss";
  const livePayoffIsZero = Boolean(livePayoff && livePayoff.value <= 0.5);
  const liveStatus = showTargetRecap
    ? targetChart.hitLabel
    : targetChart.targetKind === "none"
      ? liveHit
        ? "On track"
        : "Behind"
      : liveHit
        ? "Premium covered now"
        : livePayoffIsZero
          ? targetChart.livePayoffZeroLabel ?? "Option payoff $0"
          : "Premium not covered";
  const headlinePrice = showTargetRecap ? targetChart.closeMarker?.value ?? endValue : livePrice.value;
  const headlineStatus = showTargetRecap ? targetChart.hitLabel : liveStatus;
  const closedResultTone = targetChart.recap?.resultTone;
  const liveMoneyClass = showTargetRecap
    ? `${closedResultTone === "gain" ? "gain hit" : closedResultTone === "loss" ? "loss miss" : "flat"}`
    : `${liveDelta >= 0 ? "gain" : "loss"} ${liveTone}`;
  const liveMoneyLabel = showTargetRecap ? "Final result" : targetChart.liveValueLabel ?? "If closed now";
  const liveMoneyDelta = showTargetRecap && targetChart.recap?.resultValue ? targetChart.recap.resultValue : formatMoneyDelta(liveDelta);
  const liveMoneyAccount = showTargetRecap && targetChart.closeMarker?.accountLabel ? targetChart.closeMarker.accountLabel : liveValue ? formatMoney(liveValue.value) : "";
  const liveMoneyStatus = showTargetRecap && targetChart.recap?.resultLabel ? targetChart.recap.resultLabel : liveStatus;
  const readouts =
    targetChart.readouts ?? [
      { label: "Start", value: targetChart.startLabel },
      { label: "Need", tone: "target" as const, value: targetChart.targetLabel },
      { label: "Landing", tone: targetChart.hit ? ("hit" as const) : ("miss" as const), value: targetChart.finalLabel },
    ];

  return (
    <section
      className={`storybook-time-reel-value-chart storybook-time-reel-target-chart ${chartHit ? "hit" : "miss"} ${targetChart.targetKind} ${showTargetRecap ? "closed-early" : ""}`}
      aria-label={`${targetChart.assetLabel} target chart. ${targetChart.targetLabel}. ${targetChart.hitLabel}.`}
    >
      <header>
        <span>{targetChart.assetLabel}</span>
        <strong>{formatTimeJumpChartValue(headlinePrice)}</strong>
        <em>{headlineStatus}</em>
        <small>{targetChart.targetLabel}</small>
      </header>
      {liveValue && (
        <div className={`storybook-time-reel-live-money ${liveMoneyClass}`}>
          <span>{liveMoneyLabel}</span>
          <strong>{liveMoneyDelta}</strong>
          <em>{liveMoneyAccount}</em>
          <b>{liveMoneyStatus}</b>
          {!showTargetRecap && livePayoff && (
            <small className={`storybook-time-reel-live-payoff ${livePayoff.value <= 0.5 ? "loss" : "gain"}`}>
              {targetChart.livePayoffLabel ?? "Option payoff"} {formatMoney(livePayoff.value)}
              {livePayoff.value <= 0.5 ? " · premium is lost" : " · premium paid upfront"}
            </small>
          )}
        </div>
      )}
      <div className="storybook-time-reel-target-readout" aria-label="Option price target">
        {readouts.map((readout) => (
          <span key={`${readout.label}-${readout.value}`} className={readout.tone ?? "neutral"}>
            <b>{readout.label}</b>
            <strong>{readout.value}</strong>
          </span>
        ))}
      </div>
      <div className="storybook-time-reel-chart-plot">
        <div className="storybook-time-reel-y-axis" aria-hidden="true">
          <span>{formatTimeJumpChartValue(range.max)}</span>
          <span>{formatTimeJumpChartValue((range.max + range.min) / 2)}</span>
          <span>{formatTimeJumpChartValue(range.min)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${targetChart.assetLabel} line chart with the option target region marked`}>
          {targetChart.yAxisLabel && (
            <text className="storybook-time-reel-axis-label y" x="8" y="14">
              {targetChart.yAxisLabel}
            </text>
          )}
          {targetChart.xAxisLabel && (
            <text className="storybook-time-reel-axis-label x" x={width - 8} y={height - 7}>
              {targetChart.xAxisLabel}
            </text>
          )}
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.2} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.8} H ${width}`} />
          {targetChart.targetKind === "above" && upperY !== null && (
            <>
              <rect className="storybook-time-reel-target-zone win top" x="0" y="0" width={width} height={Math.max(0, upperY).toFixed(2)} />
              <rect className="storybook-time-reel-target-zone miss bottom" x="0" y={upperY.toFixed(2)} width={width} height={Math.max(0, height - upperY).toFixed(2)} />
              <line className="storybook-time-reel-target-line" x1="0" x2={width} y1={upperY.toFixed(2)} y2={upperY.toFixed(2)} />
              <text className="storybook-time-reel-zone-label win" x="12" y={Math.max(17, upperY / 2).toFixed(2)}>
                Profit zone
              </text>
              <text className="storybook-time-reel-zone-label miss" x="12" y={Math.min(height - 12, upperY + Math.max(20, (height - upperY) / 2)).toFixed(2)}>
                Premium not covered
              </text>
              <text className="storybook-time-reel-target-label" x={width - 8} y={Math.max(12, upperY - 7).toFixed(2)}>
                Need above {formatTimeJumpChartValue(targetChart.upperTarget ?? 0)}
              </text>
            </>
          )}
          {targetChart.targetKind === "below" && lowerY !== null && (
            <>
              <rect className="storybook-time-reel-target-zone miss top" x="0" y="0" width={width} height={Math.max(0, lowerY).toFixed(2)} />
              <rect className="storybook-time-reel-target-zone win bottom" x="0" y={lowerY.toFixed(2)} width={width} height={Math.max(0, height - lowerY).toFixed(2)} />
              <line className="storybook-time-reel-target-line" x1="0" x2={width} y1={lowerY.toFixed(2)} y2={lowerY.toFixed(2)} />
              <text className="storybook-time-reel-zone-label miss" x="12" y={Math.max(17, lowerY / 2).toFixed(2)}>
                Premium not covered
              </text>
              <text className="storybook-time-reel-zone-label win" x="12" y={Math.min(height - 12, lowerY + Math.max(20, (height - lowerY) / 2)).toFixed(2)}>
                Profit zone
              </text>
              <text className="storybook-time-reel-target-label" x={width - 8} y={Math.min(height - 7, lowerY + 16).toFixed(2)}>
                Need below {formatTimeJumpChartValue(targetChart.lowerTarget ?? 0)}
              </text>
            </>
          )}
          {targetChart.targetKind === "outside" && lowerY !== null && upperY !== null && (
            <>
              <rect className="storybook-time-reel-target-zone win top" x="0" y="0" width={width} height={Math.max(0, upperY).toFixed(2)} />
              <rect className="storybook-time-reel-target-zone miss middle" x="0" y={upperY.toFixed(2)} width={width} height={Math.max(0, lowerY - upperY).toFixed(2)} />
              <rect className="storybook-time-reel-target-zone win bottom" x="0" y={lowerY.toFixed(2)} width={width} height={Math.max(0, height - lowerY).toFixed(2)} />
              <line className="storybook-time-reel-target-line upper" x1="0" x2={width} y1={upperY.toFixed(2)} y2={upperY.toFixed(2)} />
              <line className="storybook-time-reel-target-line lower" x1="0" x2={width} y1={lowerY.toFixed(2)} y2={lowerY.toFixed(2)} />
              <text className="storybook-time-reel-zone-label win" x="12" y={Math.max(17, upperY / 2).toFixed(2)}>
                Big move profit
              </text>
              <text className="storybook-time-reel-zone-label miss" x="12" y={((upperY + lowerY) / 2).toFixed(2)}>
                Premium not covered
              </text>
              <text className="storybook-time-reel-target-label" x={width - 8} y={Math.max(12, upperY - 7).toFixed(2)}>
                Big move zone
              </text>
            </>
          )}
          {path && <path className="storybook-time-reel-chart-line ghost" d={path} pathLength={1} />}
          {visibleSegments.map((segment) => (
            <path
              key={segment.date}
              className={`storybook-time-reel-chart-segment ${segment.hit ? "hit" : "miss"}`}
              d={segment.d}
              pathLength={1}
            />
          ))}
          {!showTargetRecap && (
            <circle
              className={`storybook-time-reel-line-front-dot ${liveHit ? "hit" : "miss"}`}
              cx={liveCoordinate.x.toFixed(2)}
              cy={liveCoordinate.y.toFixed(2)}
              r="5.8"
            />
          )}
          {!showTargetRecap && (
            <g className={`storybook-time-reel-close-runner ${liveHit ? "hit" : "miss"}`} transform={`translate(${liveCoordinate.x.toFixed(2)} ${liveCoordinate.y.toFixed(2)})`}>
              <circle className="storybook-time-reel-close-runner-ring" r="12" />
              <circle className="storybook-time-reel-close-runner-core" r="6.5" />
              <path className="storybook-time-reel-close-runner-arrow" d="M -2 -5 L 8 0 L -2 5 Z" />
            </g>
          )}
          {!showTargetRecap && (
            <text
              className={`storybook-time-reel-close-runner-label ${liveHit ? "hit" : "miss"}`}
              textAnchor={markerLabelOnLeft ? "end" : "start"}
              x={markerLabelX.toFixed(2)}
              y={markerLabelY.toFixed(2)}
            >
              Timing dot
            </text>
          )}
          {showTargetRecap && bestExitCoordinate && targetChart.bestExitMarker && (
            <>
              <line
                className="storybook-time-reel-best-marker-line"
                x1={bestExitCoordinate.x.toFixed(2)}
                x2={bestExitCoordinate.x.toFixed(2)}
                y1="0"
                y2={height}
              />
              <g className="storybook-time-reel-best-marker" transform={`translate(${bestExitCoordinate.x.toFixed(2)} ${bestExitCoordinate.y.toFixed(2)})`}>
                <circle className="storybook-time-reel-best-marker-ring" r="13" />
                <circle className="storybook-time-reel-best-marker-core" r="6.8" />
                <path className="storybook-time-reel-best-marker-star" d="M 0 -9 L 2.3 -2.5 L 9 -2.5 L 3.5 1.3 L 5.7 8 L 0 4 L -5.7 8 L -3.5 1.3 L -9 -2.5 L -2.3 -2.5 Z" />
              </g>
              <text
                className="storybook-time-reel-best-marker-label"
                textAnchor={bestLabelOnLeft ? "end" : "start"}
                x={bestLabelX.toFixed(2)}
                y={Math.max(16, bestExitCoordinate.y - 14).toFixed(2)}
              >
                {targetChart.bestExitMarker.label}
              </text>
            </>
          )}
          {showTargetRecap && closeMarkerCoordinate && (
            <>
              <line
                className="storybook-time-reel-close-marker-line"
                x1={closeMarkerCoordinate.x.toFixed(2)}
                x2={closeMarkerCoordinate.x.toFixed(2)}
                y1="0"
                y2={height}
              />
              <g className={`storybook-time-reel-close-runner stopped ${targetChart.hit ? "hit" : "miss"}`} transform={`translate(${closeMarkerCoordinate.x.toFixed(2)} ${closeMarkerCoordinate.y.toFixed(2)})`}>
                <circle className="storybook-time-reel-close-runner-ring" r="12" />
                <circle className="storybook-time-reel-close-runner-core" r="6.5" />
                <path className="storybook-time-reel-close-runner-arrow" d="M -2 -5 L 8 0 L -2 5 Z" />
              </g>
              <text
                className="storybook-time-reel-close-marker-label"
                textAnchor={closeLabelOnLeft ? "end" : "start"}
                x={closeLabelX.toFixed(2)}
                y={Math.max(16, closeMarkerCoordinate.y - 9).toFixed(2)}
              >
                {targetChart.closeMarker?.label ?? "Your stop"}
              </text>
            </>
          )}
          {showTargetRecap &&
            points.map((point, index) => {
              const { x, y } = getTimeJumpChartCoordinate(point, points, range, width, height, chartDomain);
              const progress = points.length > 1 ? index / (points.length - 1) : 1;
              const isFinal = index === points.length - 1;
              const pointHit = isTimeJumpTargetHit(targetChart, point.value);
              return (
                <circle
                  key={`${point.date}-${index}`}
                  className={`storybook-time-reel-chart-dot ${isFinal ? `final ${pointHit ? "hit" : "miss"}` : ""}`}
                  cx={x.toFixed(2)}
                  cy={y.toFixed(2)}
                  r={isFinal ? 5 : index === 0 ? 3 : 1.6}
                  style={{ "--dot-delay": `${Math.round(220 + progress * 3000)}ms` } as CSSProperties}
                />
              );
            })}
        </svg>
        {showTargetRecap && targetChart.closeMarker && (
          <div className={`storybook-time-reel-closed-badge ${targetChart.hit ? "hit" : "miss"}`}>
            <strong>{targetChart.closedEarly ? "Position stopped" : "Position expired"}</strong>
            <span>{targetChart.moveLabel}</span>
          </div>
        )}
      </div>
      <footer>
        {ticks.map((point) => (
          <span key={point.date}>{formatDateShort(point.date)}</span>
        ))}
        <em>{targetChart.moveLabel}</em>
      </footer>
      {showTargetRecap && targetChart.recap && (
        <section className={`storybook-time-reel-stop-recap ${targetChart.recap.resultTone ?? "neutral"}`} aria-label={targetChart.recap.title}>
          <header>
            <div>
              <span>Round result</span>
              <strong>{targetChart.recap.title}</strong>
            </div>
            {targetChart.recap.resultValue && (
              <div className="storybook-time-reel-stop-score">
                <b>{targetChart.recap.resultValue}</b>
                {targetChart.recap.resultLabel && <em>{targetChart.recap.resultLabel}</em>}
              </div>
            )}
          </header>
          {targetChart.recap.subtitle && <p className="storybook-time-reel-stop-mission">{targetChart.recap.subtitle}</p>}
          <div className="storybook-time-reel-stop-items">
            {targetChart.recap.items.map((item) => (
              <article key={`${item.label}-${item.value}`} className={item.tone ?? "neutral"}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                {item.detail && <em>{item.detail}</em>}
              </article>
            ))}
          </div>
          {targetChart.recap.optimal && (
            <article className={`storybook-time-reel-stop-optimal ${targetChart.recap.optimal.tone ?? "neutral"}`}>
              <span>{targetChart.recap.optimal.label}</span>
              <strong>{targetChart.recap.optimal.value}</strong>
              {targetChart.recap.optimal.detail && <em>{targetChart.recap.optimal.detail}</em>}
            </article>
          )}
          {targetChart.recap.footer && <p className="storybook-time-reel-stop-lesson">{targetChart.recap.footer}</p>}
        </section>
      )}
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
  onCloseTargetPosition,
  onDismiss,
  transition,
}: {
  formatDateLong: (date: string) => string;
  formatDateWithWeekday: (date: string) => string;
  formatMoney: (value: number) => string;
  formatMoneyDelta: (value: number) => string;
  formatPercent: (value: number) => string;
  onCloseTargetPosition?: (snapshot: TimeJumpCloseSnapshot) => void;
  onDismiss?: () => void;
  transition: TimeJumpTransitionModel;
}) {
  const startedAtRef = useRef(performance.now());
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationProgressRef = useRef(0);
  const closeLockedRef = useRef(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [closeLocked, setCloseLocked] = useState(false);
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
  const transitionDurationMs = transition.durationMs ?? timeJumpTransitionDurationMs;
  const style = {
    "--time-reel-duration": `${transitionDurationMs}ms`,
    "--time-reel-start-progress": `${transition.fromProgress}%`,
    "--time-reel-target-progress": `${transition.targetProgress}%`,
    "--time-reel-jump-progress": `${jumpWidth}%`,
  } as CSSProperties;
  const targetAnimationComplete = Boolean(transition.targetChart?.closedEarly || animationProgress >= 1);
  const isTargetRecapMode = Boolean(transition.targetChart?.recap && targetAnimationComplete);
  const canCloseTargetPosition = Boolean(onCloseTargetPosition && transition.targetChart && transition.targetChart.targetKind !== "none" && !targetAnimationComplete);
  const canDismiss = Boolean(onDismiss && !canCloseTargetPosition && (!transition.targetChart || isTargetRecapMode));
  const isTargetChartMode = Boolean(transition.targetChart);
  const isClosedRecapMode = isTargetRecapMode;
  const getInstantTargetProgress = () => {
    if (!transition.targetChart) {
      return animationProgressRef.current;
    }
    if (transition.targetChart.closedEarly) {
      return 1;
    }
    const elapsed = performance.now() - startedAtRef.current;
    return Math.max(0, Math.min(1, elapsed / transitionDurationMs));
  };

  useEffect(() => {
    startedAtRef.current = performance.now();
    const startingProgress = transition.targetChart?.closedEarly ? 1 : 0;
    animationProgressRef.current = startingProgress;
    closeLockedRef.current = false;
    setAnimationProgress(startingProgress);
    setCloseLocked(false);
  }, [transition.fromDate, transition.targetDate, transition.targetBalance, transition.targetChart?.finalLabel]);

  useEffect(() => {
    if (canCloseTargetPosition || canDismiss) {
      overlayRef.current?.focus({ preventScroll: true });
    }
  }, [canCloseTargetPosition, canDismiss, transition.fromDate, transition.targetDate, transition.targetChart?.finalLabel]);

  useEffect(() => {
    if (!transition.targetChart || transition.targetChart.closedEarly) {
      const startingProgress = transition.targetChart?.closedEarly ? 1 : 0;
      animationProgressRef.current = startingProgress;
      setAnimationProgress(startingProgress);
      return undefined;
    }

    const tick = () => {
      const nextProgress = getInstantTargetProgress();
      animationProgressRef.current = nextProgress;
      setAnimationProgress(nextProgress);
      if (nextProgress < 1 && !closeLockedRef.current) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [transition.fromDate, transition.targetDate, transition.targetChart?.closedEarly, transition.targetChart?.finalLabel, transitionDurationMs]);

  const closeTargetPosition = () => {
    if (!transition.targetChart || !onCloseTargetPosition || closeLockedRef.current) {
      return;
    }

    const progress = Math.max(0, Math.min(0.999, Math.max(animationProgressRef.current, getInstantTargetProgress())));
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    animationProgressRef.current = progress;
    closeLockedRef.current = true;
    flushSync(() => {
      setAnimationProgress(progress);
      setCloseLocked(true);
    });
    onCloseTargetPosition(getTargetChartSnapshot(transition.targetChart, progress));
  };

  const handleOverlayPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (canCloseTargetPosition && !closeLockedRef.current) {
      event.preventDefault();
      closeTargetPosition();
    }
  };

  const handleOverlayClick = (_event: ReactMouseEvent<HTMLDivElement>) => {
    if (canCloseTargetPosition && !closeLockedRef.current) {
      closeTargetPosition();
      return;
    }
    if (canDismiss) {
      onDismiss?.();
    }
  };

  const handleOverlayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    if (canCloseTargetPosition && !closeLockedRef.current) {
      event.preventDefault();
      closeTargetPosition();
      return;
    }
    if (canDismiss) {
      event.preventDefault();
      onDismiss?.();
    }
  };

  return (
    <div
      ref={overlayRef}
      className={`storybook-time-reel-overlay ${canCloseTargetPosition ? "can-close-position" : ""} ${canDismiss ? "can-dismiss" : ""} ${closeLocked ? "position-close-locked" : ""}`}
      aria-live="polite"
      aria-label={transition.title}
      onClick={handleOverlayClick}
      onKeyDown={handleOverlayKeyDown}
      onPointerDownCapture={handleOverlayPointerDown}
      tabIndex={canCloseTargetPosition || canDismiss ? 0 : undefined}
      style={style}
    >
      <section
        className={`storybook-time-reel-card rolodex-watch-skin ${transition.learning ? "has-learning" : ""} ${isTargetChartMode ? "target-chart-mode" : ""} ${isClosedRecapMode ? "closed-recap-mode" : ""}`}
      >
        {!isTargetChartMode && (
          <div className="storybook-time-reel-head">
            <span>{transition.title}</span>
            <strong>{transition.strategyLabel}</strong>
          </div>
        )}
        {transition.targetChart ? (
          <TimeJumpTargetPriceChart
            animationProgress={animationProgress}
            formatMoney={formatMoney}
            formatMoneyDelta={formatMoneyDelta}
            targetChart={transition.targetChart}
            transition={transition}
          />
        ) : (
          <TimeJumpValueChart
            formatMoney={formatMoney}
            formatMoneyDelta={formatMoneyDelta}
            formatPercent={formatPercent}
            transition={transition}
          />
        )}
        {canCloseTargetPosition && (
          <div className="storybook-time-reel-close-instruction" aria-hidden="true">
            Click/tap anywhere to close position. Time the gold dot at the line tip.
          </div>
        )}
        {closeLocked && <div className="storybook-time-reel-close-flash">Position stopped at the current chart price</div>}
        {isClosedRecapMode && (
          <div className="storybook-time-reel-dismiss-instruction" aria-hidden="true">
            Click/tap anywhere to close recap
          </div>
        )}
        {!isTargetChartMode && (
          <>
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
          </>
        )}
      </section>
    </div>
  );
}
