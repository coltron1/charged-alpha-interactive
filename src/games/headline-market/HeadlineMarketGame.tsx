import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Gem,
  Home,
  Landmark,
  LineChart,
  Minimize2,
  Newspaper,
  Play,
  RotateCcw,
  Send,
  SlidersHorizontal,
  Trophy,
  UserRound,
  WalletCards,
} from "lucide-react";
import type {
  CSSProperties,
  FormEvent as ReactFormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackGameEvent } from "../../shared/analytics/events";
import { assetUrl } from "../../shared/assets";
import { educationalDisclaimer } from "../../shared/compliance/copy";
import { TargetGuideOverlay } from "../../shared/game-ui/TargetGuideOverlay";
import { HeadlineEventImage } from "./components/HeadlineEventImage";
import type { HeadlineEvent } from "./content/events";
import {
  chronicleName,
  dashboardGuideItems,
  defaultSeed,
  finalChapterDeck,
  finalChapterHeadline,
  finalChapterJournal,
  finalChapterSummary,
  landmarkEventIds,
} from "./content/gameCopy";
import { bondYieldByMonth, goldDailySeries, sp500DailySeries, type MarketChartPoint } from "./content/marketHistory";
import {
  createHeadlineMarket,
  formatMoney,
  formatPercent,
  formatYearsBetween,
  getDecisionPositions,
  getDefaultCashPercent,
  getFinalRank,
  calculateBenchmarkFinals,
  getAnnualCashBondYield,
  calculateCashBondReturnBetween,
  getCashBondReturn,
  getGoldReturn,
  getMarketPrices,
  getPositionPercent,
  getPositionTotal,
  getStockReturn,
  getTargetMarketPoint,
  getTimingRead,
  nextHeadlineRound,
  resolveHeadlineRound,
  calculateCapitalGainsTax,
  setAssetChoice,
  setDefaultPosition,
  setTargetIndex,
  startHeadlineMarket,
  startingBankroll,
  type AssetChoice,
  type HeadlineMarketResult,
  type HeadlineMarketState,
  type PortfolioPositions,
} from "./simulation/headlineMarket";

type AllocationChoice = Exclude<AssetChoice, "hold">;

const assetChoices: Array<{ id: AllocationChoice; label: string; short: string; metric: "default" | "cash" | "sp" | "gold" }> = [
  { id: "default", label: "Custom Mix", short: "Use custom plan", metric: "default" },
  { id: "cash", label: "Bonds", short: "100% bonds", metric: "cash" },
  { id: "sp500", label: "S&P 500", short: "100% stocks", metric: "sp" },
  { id: "gold", label: "Gold", short: "100% gold", metric: "gold" },
];

const assetLabels: Record<AssetChoice, string> = {
  hold: "Hold Current",
  default: "Custom Mix",
  cash: "Bonds",
  sp500: "S&P 500",
  gold: "Gold",
};

const positionAssets: Array<{ id: keyof PortfolioPositions; label: string }> = [
  { id: "cash", label: "Bonds" },
  { id: "sp500", label: "S&P 500" },
  { id: "gold", label: "Gold" },
];

const allocationVisualAssets: Array<{ id: keyof PortfolioPositions; label: string; tone: "cash" | "sp" | "gold" }> = [
  { id: "sp500", label: "S&P 500", tone: "sp" },
  { id: "cash", label: "Bonds", tone: "cash" },
  { id: "gold", label: "Gold", tone: "gold" },
];

type IntroPage = "setup" | "rules";
type IntroTransition = "none" | "page" | "briefcase";
type MarketTarget = ReturnType<typeof getTargetMarketPoint>;
type TimeReelEntry = {
  date: string;
  headline: string;
  isFinal: boolean;
  isMajor: boolean;
  isMarketMover: boolean;
};
type TimeReelChartPoint = {
  date: string;
  value: number;
};
type TimeReelTransition = {
  assetLabel: string;
  balanceDelta: number;
  balanceReturnPercent: number;
  chartPoints: TimeReelChartPoint[];
  entries: TimeReelEntry[];
  fromBalance: number;
  fromDate: string;
  fromHeadline: string;
  fromProgress: number;
  targetBalance: number;
  targetDate: string;
  targetHeadline: string;
  targetProgress: number;
};
type MarketHeat = {
  alpha: number;
  className: "market-heat-hot" | "market-heat-cold" | "market-heat-neutral";
  returnPercent: number;
};
type LeaderboardEntry = {
  createdAt: string;
  email: string;
  id: string;
  name: string;
  score: number;
  returnPercent: number;
  moves: number;
  reallocations: number;
  taxPaid: number;
};
type LeaderboardRow = {
  id: string;
  kind: "player" | "benchmark" | "preview";
  label: string;
  score: number;
  returnPercent: number;
  detail: string;
  submittedAt?: string;
  highlighted?: boolean;
};

const leaderboardNameBlocklist = [
  "admin",
  "administrator",
  "asshole",
  "bitch",
  "chargedalpha",
  "cunt",
  "dick",
  "fuck",
  "hitler",
  "moderator",
  "nazi",
  "shit",
  "support",
];

const marketHeatQuietBand = 0.75;
const timeReelDurationMs = 4000;
const leaderboardStorageKey = "front-page-fortune-leaderboard-v1";
const leaderboardGameSlug = "front-page-fortune";
const leaderboardMaxEntries = 50;

function resultTone(result: HeadlineMarketResult) {
  if (result.profit > 0) {
    return "positive";
  }
  if (result.profit < 0) {
    return "negative";
  }
  return "neutral";
}

function formatMarketPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value < 1000 ? 2 : 0,
  }).format(value);
}

function formatChartValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
    minimumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function formatDateLong(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDateWithWeekday(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDateShort(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getRolodexDateParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));

  return {
    month: parts.find((part) => part.type === "month")?.value ?? "",
    day: parts.find((part) => part.type === "day")?.value ?? "",
    year: parts.find((part) => part.type === "year")?.value ?? "",
  };
}

function formatMoneyDelta(value: number) {
  const absolute = formatMoney(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return "$0";
}

function getSeriesThroughDate(series: MarketChartPoint[], startDate: string, endDate: string) {
  return series.filter((point) => point.date >= startDate && point.date <= endDate);
}

function getOneYearBefore(date: string) {
  const current = new Date(`${date}T00:00:00Z`);
  current.setUTCFullYear(current.getUTCFullYear() - 1);
  return current.toISOString().slice(0, 10);
}

function getChartWindow(series: MarketChartPoint[], startDate: string, endDate: string) {
  const sinceStart = getSeriesThroughDate(series, startDate, endDate);
  if (sinceStart.length >= 45) {
    return { contextLabel: "since start", points: sinceStart, rangeStartDate: startDate };
  }

  const rangeStartDate = getOneYearBefore(endDate);
  return {
    contextLabel: "1-year context",
    points: getSeriesThroughDate(series, rangeStartDate, endDate),
    rangeStartDate,
  };
}

function downsampleSeries(points: MarketChartPoint[], maximumPoints = 140) {
  if (points.length <= maximumPoints) {
    return points;
  }

  const sampled: MarketChartPoint[] = [points[0]];
  const bucketSize = (points.length - 2) / (maximumPoints - 2);

  for (let index = 0; index < maximumPoints - 2; index += 1) {
    sampled.push(points[Math.floor(1 + index * bucketSize)]);
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

function buildSparklinePath(points: MarketChartPoint[], width = 240, height = 72) {
  if (points.length === 0) {
    return "";
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const lastIndex = Math.max(1, points.length - 1);

  return points
    .map((point, index) => {
      const x = (index / lastIndex) * width;
      const y = height - ((point.value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getBondYieldForDate(date: string) {
  let [year, month] = date.slice(0, 7).split("-").map(Number);

  while (year >= 1987) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const value = bondYieldByMonth[key];
    if (value !== undefined) {
      return { month: key, value };
    }
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return { month: date.slice(0, 7), value: 0 };
}

function characterAge(state: HeadlineMarketState, date: string) {
  const start = new Date(`${state.timeline.inheritanceDate}T00:00:00Z`).getTime();
  const current = new Date(`${date}T00:00:00Z`).getTime();
  const years = Math.max(0, Math.floor((current - start) / (365.25 * 24 * 60 * 60 * 1000)));
  return state.timeline.characterAgeAtStart + years;
}

function getChoiceAllocationPercent(
  assetChoice: AssetChoice,
  game: Pick<HeadlineMarketState, "defaultSpPercent" | "defaultGoldPercent">,
  currentPositions: PortfolioPositions,
): PortfolioPositions {
  const currentTotal = getPositionTotal(currentPositions);

  if (assetChoice === "hold") {
    return currentTotal > 0
      ? {
          cash: getPositionPercent(currentPositions, "cash"),
          sp500: getPositionPercent(currentPositions, "sp500"),
          gold: getPositionPercent(currentPositions, "gold"),
        }
      : { cash: 100, sp500: 0, gold: 0 };
  }

  if (assetChoice === "default") {
    return {
      cash: getDefaultCashPercent(game),
      sp500: game.defaultSpPercent,
      gold: game.defaultGoldPercent,
    };
  }

  if (assetChoice === "cash") {
    return { cash: 100, sp500: 0, gold: 0 };
  }

  if (assetChoice === "sp500") {
    return { cash: 0, sp500: 100, gold: 0 };
  }

  return { cash: 0, sp500: 0, gold: 100 };
}

function isSameAllocationPreview(currentPositions: PortfolioPositions, targetAllocation: PortfolioPositions) {
  return positionAssets.every((asset) => Math.abs(getPositionPercent(currentPositions, asset.id) - targetAllocation[asset.id]) < 0.5);
}

function getAllocationPreview(game: HeadlineMarketState, assetChoice: AssetChoice, positions = getDecisionPositions(game)) {
  const currentTotal = getPositionTotal(positions);
  const allocation = getChoiceAllocationPercent(assetChoice, game, positions);
  const previousChoice = getPreviousAllocationChoice(game);
  const keepsPreviousChoice = previousChoice === assetChoice;
  const isReallocation = assetChoice !== "hold" && !keepsPreviousChoice && !isSameAllocationPreview(positions, allocation);
  const taxPenalty = isReallocation ? calculateCapitalGainsTax(currentTotal - game.taxBasis) : 0;
  const assignableTotal = Math.max(0, currentTotal - taxPenalty);
  const targetPositions =
    assetChoice === "hold" || keepsPreviousChoice
      ? positions
      : {
          cash: assignableTotal * (allocation.cash / 100),
          sp500: assignableTotal * (allocation.sp500 / 100),
          gold: assignableTotal * (allocation.gold / 100),
        };

  return {
    allocation,
    assignableTotal,
    currentTotal,
    isReallocation,
    targetPositions,
    taxPenalty,
  };
}

function getPreviousAllocationChoice(game: Pick<HeadlineMarketState, "results">): AllocationChoice | null {
  const previousChoice = game.results.at(-1)?.assetChoice;
  return previousChoice && previousChoice !== "hold" ? previousChoice : null;
}

function formatAllocationLine(allocation: PortfolioPositions, positions: PortfolioPositions) {
  return positionAssets
    .filter((asset) => positions[asset.id] > 0.5 || allocation[asset.id] > 0.5)
    .map((asset) => `${Math.round(allocation[asset.id])}% ${asset.label} (${formatMoney(positions[asset.id])})`)
    .join(" / ");
}

function getAllocationButtonSummary(game: HeadlineMarketState, assetChoice: AssetChoice, positions = getDecisionPositions(game)) {
  const preview = getAllocationPreview(game, assetChoice, positions);
  const compactAllocation =
    assetChoice === "default"
      ? `${game.defaultSpPercent}/${game.defaultGoldPercent}/${getDefaultCashPercent(game)} mix`
        : assetChoice === "hold"
          ? "Current mix"
        : assetChoice === "cash"
          ? "100% Bonds"
          : assetChoice === "sp500"
            ? "100% S&P"
            : "100% Gold";

  if (assetChoice === "hold") {
    return {
      action: "Hold as-is",
      compact: compactAllocation,
      dollars: formatMoney(preview.currentTotal),
      detail: formatAllocationLine(preview.allocation, preview.targetPositions),
      total: formatMoney(preview.currentTotal),
    };
  }

  return {
    action: `Move ${formatMoney(preview.assignableTotal)}`,
    compact: compactAllocation,
    dollars: preview.taxPenalty > 0 ? `${formatMoney(preview.taxPenalty)} capital gains tax` : "No capital gains tax",
    detail: formatAllocationLine(preview.allocation, preview.targetPositions),
    total: formatMoney(preview.assignableTotal),
  };
}

function formatCompactAllocationPercentLine(assetChoice: AssetChoice, allocation: PortfolioPositions) {
  if (assetChoice === "cash") {
    return "100% Bonds";
  }
  if (assetChoice === "sp500") {
    return "100% S&P 500 stocks";
  }
  if (assetChoice === "gold") {
    return "100% Gold";
  }

  const parts = [
    { label: "S&P", value: allocation.sp500 },
    { label: "Bonds", value: allocation.cash },
    { label: "Gold", value: allocation.gold },
  ].filter((part) => part.value > 0.5);

  return parts.length > 0 ? parts.map((part) => `${Math.round(part.value)}% ${part.label}`).join(" / ") : "No allocation";
}

function getDashboardChoiceLine(assetChoice: AssetChoice, allocation: PortfolioPositions) {
  if (assetChoice === "cash") {
    return "Bonds";
  }
  if (assetChoice === "sp500") {
    return "Stocks";
  }
  if (assetChoice === "gold") {
    return "Gold";
  }

  if (allocation.gold > 0.5) {
    return `${Math.round(allocation.sp500)}/${Math.round(allocation.cash)}/${Math.round(allocation.gold)}`;
  }

  return `${Math.round(allocation.sp500)}/${Math.round(allocation.cash)} mix`;
}

function getFlowAllocationChoice(positions: PortfolioPositions): AllocationChoice {
  if (getPositionPercent(positions, "cash") >= 99.5) {
    return "cash";
  }
  if (getPositionPercent(positions, "sp500") >= 99.5) {
    return "sp500";
  }
  if (getPositionPercent(positions, "gold") >= 99.5) {
    return "gold";
  }

  return "default";
}

function getAllocationFlowPosition(choice: AllocationChoice | "tax") {
  if (choice === "default") {
    return 10;
  }
  if (choice === "cash") {
    return 30;
  }
  if (choice === "sp500") {
    return 50;
  }
  if (choice === "gold") {
    return 70;
  }

  return 90;
}

const allocationFlowStops: Array<{
  id: AllocationChoice | "tax";
  label: string;
  icon: typeof SlidersHorizontal;
  tone: "custom" | "bonds" | "stocks" | "gold" | "tax";
}> = [
  { id: "default", label: "Mix", icon: SlidersHorizontal, tone: "custom" },
  { id: "cash", label: "Bonds", icon: Landmark, tone: "bonds" },
  { id: "sp500", label: "S&P", icon: LineChart, tone: "stocks" },
  { id: "gold", label: "Gold", icon: Gem, tone: "gold" },
  { id: "tax", label: "Tax", icon: Landmark, tone: "tax" },
];

function getMarketHeat(returnPercent: number, relativeIntensity = Math.min(Math.abs(returnPercent), 10) / 10): MarketHeat {
  const cappedIntensity = Math.min(Math.abs(returnPercent), 10) / 10;
  const blendedIntensity = cappedIntensity * 0.4 + Math.min(1, Math.max(0, relativeIntensity)) * 0.6;
  const alpha = Math.abs(returnPercent) < marketHeatQuietBand ? 0 : 0.07 + blendedIntensity * 0.35;

  return {
    alpha,
    className: alpha === 0 ? "market-heat-neutral" : returnPercent > 0 ? "market-heat-hot" : "market-heat-cold",
    returnPercent,
  };
}

function getMarketHeatStyle(heat: MarketHeat) {
  return { "--market-heat-alpha": heat.alpha.toFixed(3) } as CSSProperties;
}

function getNeutralMarketHeats() {
  return new Map<AllocationChoice, MarketHeat>(assetChoices.map((asset) => [asset.id, getMarketHeat(0, 0)]));
}

function getMarketHeatUnlockDate(game: HeadlineMarketState) {
  const unlockDate = new Date(`${game.timeline.periodEndDate}T00:00:00Z`);
  unlockDate.setUTCFullYear(unlockDate.getUTCFullYear() - 5);
  const unlockDateIso = formatDateIso(unlockDate);
  return dateToUtcTime(unlockDateIso) < dateToUtcTime(game.timeline.inheritanceDate) ? game.timeline.inheritanceDate : unlockDateIso;
}

function isMarketHeatUnlockedForDate(game: HeadlineMarketState, date: string) {
  return dateToUtcTime(date) >= dateToUtcTime(getMarketHeatUnlockDate(game));
}

function getMarketHeatUnlockProgress(game: HeadlineMarketState) {
  return getTimelineProgressPercent(game, getMarketHeatUnlockDate(game));
}

function getChoiceProjectedReturn(
  game: HeadlineMarketState,
  currentEvent: HeadlineEvent,
  target: MarketTarget,
  assetChoice: AssetChoice,
  positions: PortfolioPositions,
) {
  const preview = getAllocationPreview(game, assetChoice, positions);
  const targetTotal = getPositionTotal(preview.targetPositions);

  if (targetTotal <= 0) {
    return 0;
  }

  const stockReturn = getStockReturn(currentEvent, target);
  const goldReturn = getGoldReturn(currentEvent, target);
  const cashBondReturn = getCashBondReturn(currentEvent, target);
  const projectedEnding =
    preview.targetPositions.sp500 * (1 + stockReturn / 100) +
    preview.targetPositions.gold * (1 + goldReturn / 100) +
    preview.targetPositions.cash * (1 + cashBondReturn / 100);

  return (projectedEnding / targetTotal - 1) * 100;
}

function getAllocationMarketHeats(game: HeadlineMarketState, currentEvent: HeadlineEvent, target: MarketTarget, positions: PortfolioPositions) {
  if (!isMarketHeatUnlockedForDate(game, target.date)) {
    return getNeutralMarketHeats();
  }

  const returns = assetChoices.map((asset) => ({
    id: asset.id,
    returnPercent: getChoiceProjectedReturn(game, currentEvent, target, asset.id, positions),
  }));
  const strongestMove = Math.max(0, ...returns.map((result) => Math.abs(result.returnPercent)).filter((magnitude) => magnitude >= marketHeatQuietBand));

  return new Map<AllocationChoice, MarketHeat>(
    returns.map((result) => [
      result.id,
      getMarketHeat(result.returnPercent, strongestMove > 0 ? Math.abs(result.returnPercent) / strongestMove : 0),
    ]),
  );
}

function getBondYieldFigure(startDate: string, endDate: string) {
  const startYield = getAnnualCashBondYield(startDate);
  const endYield = getAnnualCashBondYield(endDate);
  const startYear = startDate.slice(0, 4);
  const endYear = endDate.slice(0, 4);

  if (startYear === endYear || Math.abs(startYield - endYield) < 0.005) {
    return `${startYield.toFixed(2)}%`;
  }

  return `${startYield.toFixed(2)}% to ${endYield.toFixed(2)}%`;
}

function getArrivalSummary(result: HeadlineMarketResult) {
  return `${formatDateLong(result.event.date)} to ${formatDateLong(result.targetDate)} · ${assetLabels[result.assetChoice]} · ${formatPercent(
    result.assetReturn,
  )} · ${formatMoney(result.endingBankroll)}${result.taxPenalty > 0 ? ` after ${formatMoney(result.taxPenalty)} capital gains tax` : ""}`;
}

function getStartingGain(value: number) {
  return ((value / startingBankroll) - 1) * 100;
}

function getPlayerStrategyGap(playerValue: number, benchmarkValue: number, benchmarkName: string) {
  const gap = playerValue - benchmarkValue;
  if (gap >= 0) {
    return `${formatMoney(gap)} ahead of ${benchmarkName}`;
  }
  return `${formatMoney(Math.abs(gap))} behind ${benchmarkName}`;
}

function formatCountNoun(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.email === "string" &&
    typeof entry.createdAt === "string" &&
    typeof entry.score === "number" &&
    typeof entry.returnPercent === "number" &&
    typeof entry.moves === "number" &&
    typeof entry.reallocations === "number" &&
    typeof entry.taxPaid === "number"
  );
}

function loadLeaderboardEntries(): LeaderboardEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(leaderboardStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLeaderboardEntry) : [];
  } catch {
    return [];
  }
}

function saveLeaderboardEntries(entries: LeaderboardEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(leaderboardStorageKey, JSON.stringify(entries.slice(0, leaderboardMaxEntries)));
  } catch {
    // A future API-backed leaderboard can report persistence failures to the UI.
  }
}

function sanitizeLeaderboardName(name: string) {
  return name
    .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function getLeaderboardNameError(name: string) {
  const cleaned = sanitizeLeaderboardName(name);
  const compact = cleaned.toLowerCase().replace(/[^a-z0-9]/g, "");
  const tokens = cleaned.toLowerCase().match(/[a-z0-9]+/g) ?? ([] as string[]);
  if (cleaned.length < 2) {
    return "Enter a display name.";
  }
  if (/@|https?:|www\./i.test(cleaned)) {
    return "Use a display name, not an email or link.";
  }
  if (!/^[A-Za-z][A-Za-z0-9 .'-]{1,23}$/.test(cleaned)) {
    return "Names can use letters, numbers, spaces, apostrophes, periods, and hyphens.";
  }
  if (leaderboardNameBlocklist.some((word) => compact === word || tokens.includes(word))) {
    return "Choose a different display name.";
  }
  return "";
}

function createLeaderboardEntry(game: HeadlineMarketState, name: string): LeaderboardEntry {
  const taxPaid = game.results.reduce((total, result) => total + result.taxPenalty, 0);
  return {
    createdAt: new Date().toISOString(),
    email: "",
    id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: sanitizeLeaderboardName(name),
    score: Math.round(game.bankroll),
    returnPercent: getStartingGain(game.bankroll),
    moves: game.results.length,
    reallocations: game.results.filter((result) => result.isReallocation).length,
    taxPaid,
  };
}

function getLeaderboardPreviewEntry(game: HeadlineMarketState): LeaderboardEntry {
  const taxPaid = game.results.reduce((total, result) => total + result.taxPenalty, 0);
  return {
    createdAt: "",
    email: "",
    id: "current-run-preview",
    name: "Your run",
    score: Math.round(game.bankroll),
    returnPercent: getStartingGain(game.bankroll),
    moves: game.results.length,
    reallocations: game.results.filter((result) => result.isReallocation).length,
    taxPaid,
  };
}

function addLeaderboardEntry(entry: LeaderboardEntry) {
  const entries = loadLeaderboardEntries();
  const nextEntries = [entry, ...entries]
    .sort((a, b) => b.score - a.score || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, leaderboardMaxEntries);
  saveLeaderboardEntries(nextEntries);
  return nextEntries;
}

async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[] | null> {
  const response = await fetch(`/games/api/leaderboard/${leaderboardGameSlug}`, { credentials: "same-origin" });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { entries?: unknown };
  return Array.isArray(payload.entries) ? payload.entries.filter(isLeaderboardEntry) : [];
}

async function postLeaderboardEntry(entry: LeaderboardEntry): Promise<LeaderboardEntry> {
  const response = await fetch("/games/api/scores", {
    body: JSON.stringify({
      display_name: entry.name,
      game_slug: leaderboardGameSlug,
      metadata: {
        source: "front-page-fortune",
      },
      moves: entry.moves,
      reallocations: entry.reallocations,
      return_percent: entry.returnPercent,
      score: entry.score,
      tax_paid: entry.taxPaid,
    }),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    entry?: unknown;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Score was not accepted.");
  }

  if (!isLeaderboardEntry(payload.entry)) {
    throw new Error("Score response was incomplete.");
  }
  return payload.entry;
}

function getLeaderboardRows(game: HeadlineMarketState, entries: LeaderboardEntry[], previewEntry: LeaderboardEntry | null): LeaderboardRow[] {
  const benchmarks = calculateBenchmarkFinals(game.timeline);
  const rows: LeaderboardRow[] = [
    {
      id: "eli-benchmark",
      kind: "benchmark",
      label: "Eli",
      score: game.brotherBankroll,
      returnPercent: getStartingGain(game.brotherBankroll),
      detail: "S&P 500 buy-and-hold",
    },
    {
      id: "ruth-benchmark",
      kind: "benchmark",
      label: "Ruth",
      score: game.sisterBankroll,
      returnPercent: getStartingGain(game.sisterBankroll),
      detail: "Gold jewelry tracked to gold",
    },
    {
      id: "perfect-tape-benchmark",
      kind: "benchmark",
      label: "Perfect tape",
      score: benchmarks.perfectNewspaperTiming,
      returnPercent: getStartingGain(benchmarks.perfectNewspaperTiming),
      detail: "Best allocation each jump",
    },
  ];

  entries.forEach((entry) => {
    rows.push({
      id: entry.id,
      kind: "player",
      label: entry.name,
      score: entry.score,
      returnPercent: entry.returnPercent,
      detail: `${formatCountNoun(entry.moves, "move")} · ${formatCountNoun(entry.reallocations, "reallocation")}`,
      submittedAt: entry.createdAt,
      highlighted: previewEntry?.id === entry.id,
    });
  });

  if (previewEntry && !entries.some((entry) => entry.id === previewEntry.id)) {
    rows.push({
      id: "current-run-preview",
      kind: "preview",
      label: "Your run",
      score: previewEntry.score,
      returnPercent: previewEntry.returnPercent,
      detail: "Not posted yet",
      highlighted: true,
    });
  }

  return rows.sort((a, b) => b.score - a.score);
}

function getLedgerComparisonRows(game: HeadlineMarketState) {
  const jonah = getPositionTotal(game.currentPositions);
  return [
    {
      label: "Jonah",
      note: "Player-controlled allocation",
      value: jonah,
      gap: 0,
    },
    {
      label: "Eli",
      note: "S&P 500 buy-and-hold",
      value: game.brotherBankroll,
      gap: game.brotherBankroll - jonah,
    },
    {
      label: "Ruth",
      note: "Gold jewelry tracked to gold",
      value: game.sisterBankroll,
      gap: game.sisterBankroll - jonah,
    },
  ];
}

function getMarketMoverIds(events: HeadlineMarketState["events"]) {
  const byYear = new Map<string, Array<{ id: string; move: number }>>();

  events.forEach((event) => {
    const year = event.date.slice(0, 4);
    const yearEvents = byYear.get(year) ?? [];
    yearEvents.push({ id: event.id, move: Math.abs(event.periodReturn) });
    byYear.set(year, yearEvents);
  });

  const ids = new Set<string>();
  byYear.forEach((yearEvents) => {
    const sorted = [...yearEvents].sort((a, b) => b.move - a.move);
    const [largest, runnerUp] = sorted;
    if (largest) {
      ids.add(largest.id);
    }
    if (largest && runnerUp && runnerUp.move >= Math.max(5, largest.move * 0.75)) {
      ids.add(runnerUp.id);
    }
  });

  return ids;
}

function getEventAt(game: HeadlineMarketState, index: number) {
  return index < game.events.length ? game.events[index] : null;
}

function getHeadlinePreviewParagraph(event: ReturnType<typeof getEventAt>, isFinalPreview: boolean) {
  const lede = event?.newspaperArticle?.lede
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .find(Boolean);

  return lede ?? event?.summary ?? event?.setup ?? (isFinalPreview ? finalChapterSummary : finalChapterDeck);
}

function formatAllocationPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getAllocationSummary(positions: PortfolioPositions) {
  return [
    `S&P 500 ${formatAllocationPercent(getPositionPercent(positions, "sp500"))}`,
    `Bonds ${formatAllocationPercent(getPositionPercent(positions, "cash"))}`,
    `Gold ${formatAllocationPercent(getPositionPercent(positions, "gold"))}`,
  ].join(" / ");
}

function getSpanLabels(game: HeadlineMarketState, target: MarketTarget) {
  const currentDate = game.events[game.roundIndex]?.date ?? game.timeline.periodEndDate;
  return {
    passes: formatYearsBetween(currentDate, target.date),
    remains: formatYearsBetween(target.date, game.timeline.periodEndDate),
  };
}

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getStoryProgressDate(game: HeadlineMarketState) {
  if (game.phase === "complete") {
    return game.timeline.periodEndDate;
  }
  if (game.phase === "reveal") {
    return game.results.at(-1)?.targetDate ?? game.events[game.roundIndex]?.date ?? game.timeline.inheritanceDate;
  }
  return game.events[game.roundIndex]?.date ?? game.timeline.inheritanceDate;
}

function getStoryProgressPercent(game: HeadlineMarketState) {
  return getTimelineProgressPercent(game, getStoryProgressDate(game));
}

function getTimelineProgressPercent(game: HeadlineMarketState, date: string) {
  const start = dateToUtcTime(game.timeline.inheritanceDate);
  const end = dateToUtcTime(game.timeline.periodEndDate);
  const current = dateToUtcTime(date);
  if (end <= start) {
    return 0;
  }
  return clampPercent(((current - start) / (end - start)) * 100);
}

function getTimeReelEntries(game: HeadlineMarketState, targetIndex: number): TimeReelEntry[] {
  const marketMoverIds = getMarketMoverIds(game.events);
  const startIndex = Math.min(game.roundIndex + 1, game.events.length);
  const endIndex = Math.max(startIndex, Math.min(targetIndex, game.events.length));
  const entries: TimeReelEntry[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    const target = getTargetMarketPoint(game, index);
    const event = getEventAt(game, index);
    entries.push({
      date: target.date,
      headline: event?.headline ?? finalChapterHeadline,
      isFinal: target.isFinal,
      isMajor: event?.major ?? target.isFinal,
      isMarketMover: event ? marketMoverIds.has(event.id) : false,
    });
  }

  return entries.length > 0
    ? entries
    : [
        {
          date: getTargetMarketPoint(game, targetIndex).date,
          headline: getEventAt(game, targetIndex)?.headline ?? finalChapterHeadline,
          isFinal: targetIndex >= game.events.length,
          isMajor: false,
          isMarketMover: false,
        },
      ];
}

function formatDateIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthlyTimelineDates(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (end.getTime() <= start.getTime()) {
    return [startDate];
  }

  const dates = [startDate];
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

  while (cursor.getTime() < end.getTime()) {
    dates.push(formatDateIso(cursor));
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  if (dates.at(-1) !== endDate) {
    dates.push(endDate);
  }

  return dates;
}

function getSeriesValueAtOrBefore(series: MarketChartPoint[], date: string, fallback: number) {
  let low = 0;
  let high = series.length - 1;
  let match: MarketChartPoint | null = null;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const point = series[mid];
    if (point.date <= date) {
      match = point;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return match?.value ?? fallback;
}

function buildTimeReelChartPoints(game: HeadlineMarketState, targetIndex: number, result: HeadlineMarketResult): TimeReelChartPoint[] {
  const target = getTargetMarketPoint(game, targetIndex);
  const startDate = result.event.date;
  const endDate = result.targetDate;
  const startSp500 = result.event.startClose;
  const startGold = result.event.goldStart;
  const positions = result.targetPositions;

  const points = getMonthlyTimelineDates(startDate, endDate).map((date) => {
    const isStart = date === startDate;
    const isEnd = date === endDate;
    const sp500Value = isStart ? startSp500 : isEnd ? target.sp500 : getSeriesValueAtOrBefore(sp500DailySeries, date, startSp500);
    const goldValue = isStart ? startGold : isEnd ? target.gold : getSeriesValueAtOrBefore(goldDailySeries, date, startGold);
    const cashReturn = calculateCashBondReturnBetween(startDate, date);
    const value =
      positions.cash * (1 + cashReturn / 100) +
      positions.sp500 * (sp500Value / startSp500) +
      positions.gold * (goldValue / startGold);

    return { date, value };
  });

  if (points.length > 0) {
    points[points.length - 1] = { ...points[points.length - 1], value: result.endingBankroll };
  }

  return points;
}

function createTimeReelTransition(game: HeadlineMarketState, targetIndex: number, result: HeadlineMarketResult): TimeReelTransition {
  const targetEvent = getEventAt(game, targetIndex);
  const balanceDelta = result.endingBankroll - result.decisionBankroll;
  const balanceReturnPercent = result.decisionBankroll > 0 ? (balanceDelta / result.decisionBankroll) * 100 : 0;
  return {
    assetLabel: assetLabels[result.assetChoice],
    balanceDelta,
    balanceReturnPercent,
    chartPoints: buildTimeReelChartPoints(game, targetIndex, result),
    entries: getTimeReelEntries(game, targetIndex),
    fromBalance: result.decisionBankroll,
    fromDate: result.event.date,
    fromHeadline: result.event.headline,
    fromProgress: getTimelineProgressPercent(game, result.event.date),
    targetBalance: result.endingBankroll,
    targetDate: result.targetDate,
    targetHeadline: targetEvent?.headline ?? finalChapterHeadline,
    targetProgress: getTimelineProgressPercent(game, result.targetDate),
  };
}

function getDecisionTimelineYearTicks(game: HeadlineMarketState) {
  const startYear = Number(game.timeline.inheritanceDate.slice(0, 4));
  const endYear = Number(game.timeline.periodEndDate.slice(0, 4));
  const ticks: Array<{ label: string; progress: number }> = [];

  for (let year = startYear; year <= endYear; year += 5) {
    const tickDate = year === startYear ? game.timeline.inheritanceDate : `${year}-01-01`;
    ticks.push({ label: String(year), progress: getTimelineProgressPercent(game, tickDate) });
  }

  if (ticks.at(-1)?.label !== String(endYear)) {
    ticks.push({ label: String(endYear), progress: 100 });
  }

  return ticks;
}

function DecisionJourneyTimeline({ currentDate, game, target }: { currentDate: string; game: HeadlineMarketState; target: MarketTarget }) {
  const currentProgress = getTimelineProgressPercent(game, currentDate);
  const targetProgress = getTimelineProgressPercent(game, target.date);
  const jumpLeft = Math.min(currentProgress, targetProgress);
  const jumpWidth = Math.abs(targetProgress - currentProgress);
  const ticks = getDecisionTimelineYearTicks(game);
  const startYear = game.timeline.inheritanceDate.slice(0, 4);
  const endYear = game.timeline.periodEndDate.slice(0, 4);
  const heatUnlockDate = getMarketHeatUnlockDate(game);
  const heatUnlockProgress = getMarketHeatUnlockProgress(game);
  const heatUnlockActive = targetProgress >= heatUnlockProgress;
  const style = {
    "--journey-current": `${currentProgress}%`,
    "--journey-target": `${targetProgress}%`,
    "--journey-jump-left": `${jumpLeft}%`,
    "--journey-jump-width": `${jumpWidth}%`,
    "--market-heat-unlock": `${heatUnlockProgress}%`,
  } as CSSProperties;

  return (
    <section
      className="storybook-decision-timeline"
      aria-label={`Jonah's story timeline from ${formatDateLong(game.timeline.inheritanceDate)} to ${formatDateLong(target.date)}`}
      style={style}
    >
      <div className="storybook-decision-timeline-track" aria-hidden="true">
        <span className="storybook-decision-endcap start">
          <b>Start</b>
          <em>{startYear}</em>
        </span>
        <span className="storybook-decision-endcap end">
          <b>End</b>
          <em>{endYear}</em>
        </span>
        <div className="storybook-decision-timeline-complete" />
        <div className="storybook-decision-timeline-jump" />
        {ticks.map((tick) => {
          const isEndpointYear = tick.label === startYear || tick.label === endYear;
          return (
            <span
              key={tick.label}
              className={`storybook-decision-year-tick ${isEndpointYear || tick.progress <= 1 ? "edge-start" : ""} ${isEndpointYear || tick.progress >= 99 ? "edge-end" : ""}`}
              style={{ "--tick-progress": `${tick.progress}%` } as CSSProperties}
            >
              <em>{tick.label}</em>
            </span>
          );
        })}
        <span
          className={`storybook-decision-heat-unlock ${heatUnlockActive ? "active" : ""}`}
          aria-label={`Market Vision unlocked at ${formatDateLong(heatUnlockDate)}`}
        >
          <b>Market Vision</b>
          <em>Unlocked</em>
        </span>
        <span className="storybook-decision-pin start" />
        <span className="storybook-decision-pin current">
          <UserRound size={11} />
        </span>
        <span className="storybook-decision-pin target">
          <ChevronRight size={12} />
        </span>
        <span className="storybook-decision-pin end" />
      </div>
    </section>
  );
}

function getNearestTimelineTargetIndex(game: HeadlineMarketState, progressPercent: number) {
  const minimumTargetIndex = Math.min(game.roundIndex + 1, game.events.length);
  const start = dateToUtcTime(game.timeline.inheritanceDate);
  const end = dateToUtcTime(game.timeline.periodEndDate);
  const targetTime = start + ((end - start) * clampPercent(progressPercent)) / 100;
  let nearestIndex = minimumTargetIndex;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = minimumTargetIndex; index <= game.events.length; index += 1) {
    const distance = Math.abs(dateToUtcTime(getTargetMarketPoint(game, index).date) - targetTime);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

function StoryProgressRail({
  embedded = false,
  game,
  onSelectTarget,
}: {
  embedded?: boolean;
  game: HeadlineMarketState;
  onSelectTarget?: (index: number) => void;
}) {
  const activeTimelinePointerRef = useRef<number | null>(null);
  const [isTimelineScrubbing, setIsTimelineScrubbing] = useState(false);
  const currentDate = getStoryProgressDate(game);
  const currentEvent = getEventAt(game, Math.min(game.roundIndex, game.events.length - 1));
  const progress = getStoryProgressPercent(game);
  const currentBalance = getPositionTotal(game.currentPositions);
  const allocationSummary = getAllocationSummary(game.currentPositions);
  const nextTarget = game.phase === "choose" ? getTargetMarketPoint(game, game.selectedTargetIndex) : null;
  const startYear = game.timeline.inheritanceDate.slice(0, 4);
  const endYear = game.timeline.periodEndDate.slice(0, 4);
  const canScrubTimeline = game.phase === "choose" && Boolean(onSelectTarget);
  const projectedProgress = nextTarget ? getTimelineProgressPercent(game, nextTarget.date) : progress;
  const heatUnlockDate = getMarketHeatUnlockDate(game);
  const heatUnlockProgress = getMarketHeatUnlockProgress(game);
  const heatUnlockActive = Math.max(progress, projectedProgress) >= heatUnlockProgress;
  const nextText = nextTarget
    ? nextTarget.isFinal
      ? `Selected jump: 20-year ending`
      : `Selected jump: ${formatDateLong(nextTarget.date)}`
    : "Pick Jonah's next page";
  const style = {
    "--jonah-progress": `${progress}%`,
    "--jonah-target-progress": `${projectedProgress}%`,
    "--market-heat-unlock": `${heatUnlockProgress}%`,
  } as CSSProperties;
  const selectTimelineTargetFromClientX = (clientX: number, track: HTMLElement) => {
    if (!canScrubTimeline || !onSelectTarget) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const clickedProgress = ((clientX - rect.left) / rect.width) * 100;
    onSelectTarget(getNearestTimelineTargetIndex(game, clickedProgress));
  };
  const handleTimelinePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canScrubTimeline || event.button !== 0) {
      return;
    }
    event.preventDefault();
    activeTimelinePointerRef.current = event.pointerId;
    setIsTimelineScrubbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    selectTimelineTargetFromClientX(event.clientX, event.currentTarget);
  };
  const handleTimelinePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTimelinePointerRef.current !== event.pointerId) {
      return;
    }
    event.preventDefault();
    selectTimelineTargetFromClientX(event.clientX, event.currentTarget);
  };
  const finishTimelineScrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTimelinePointerRef.current !== event.pointerId) {
      return;
    }
    activeTimelinePointerRef.current = null;
    setIsTimelineScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleTimelineKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!canScrubTimeline || !onSelectTarget) {
      return;
    }
    const minimumTargetIndex = Math.min(game.roundIndex + 1, game.events.length);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onSelectTarget(Math.max(minimumTargetIndex, game.selectedTargetIndex - 1));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onSelectTarget(Math.min(game.events.length, game.selectedTargetIndex + 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelectTarget(minimumTargetIndex);
    } else if (event.key === "End") {
      event.preventDefault();
      onSelectTarget(game.events.length);
    }
  };

  return (
    <section className={`storybook-progress-rail ${embedded ? "embedded" : ""}`} aria-label="Jonah story progress" style={style}>
      {!embedded && (
        <div className="storybook-progress-status" aria-label="Jonah portfolio status" data-guide-target="portfolio-status">
          <span aria-label={`Jonah's balance ${formatMoney(currentBalance)}`}>
            <strong>{formatMoney(currentBalance)}</strong>
          </span>
          <span aria-label={`Allocation ${allocationSummary}`}>
            <strong>{allocationSummary}</strong>
          </span>
        </div>
      )}
      <div className="storybook-progress-context">
        <strong>
          Location: {currentEvent?.era ?? chronicleName} · {formatDateLong(currentDate)}
          <em>{nextText}</em>
        </strong>
      </div>
      <div className="storybook-progress-body">
        <div
          className={`storybook-progress-track ${canScrubTimeline ? "interactive" : ""} ${isTimelineScrubbing ? "scrubbing" : ""}`}
          role={canScrubTimeline ? "slider" : undefined}
          aria-label={canScrubTimeline ? "Choose Jonah's next future headline on the story timeline" : undefined}
          aria-valuemin={canScrubTimeline ? Math.round(progress) : undefined}
          aria-valuemax={canScrubTimeline ? 100 : undefined}
          aria-valuenow={canScrubTimeline ? Math.round(projectedProgress) : undefined}
          aria-valuetext={canScrubTimeline ? nextText : undefined}
          tabIndex={canScrubTimeline ? 0 : undefined}
          title={canScrubTimeline ? "Click or drag the timeline to select the nearest future headline date." : undefined}
          onKeyDown={handleTimelineKeyDown}
          onLostPointerCapture={() => {
            activeTimelinePointerRef.current = null;
            setIsTimelineScrubbing(false);
          }}
          onPointerCancel={finishTimelineScrub}
          onPointerDown={handleTimelinePointerDown}
          onPointerMove={handleTimelinePointerMove}
          onPointerUp={finishTimelineScrub}
          data-guide-target="timeline"
        >
          <span className="storybook-progress-endcap start">{startYear}</span>
          <span className="storybook-progress-endcap end">{endYear}</span>
          <span
            className={`storybook-progress-heat-unlock ${heatUnlockActive ? "active" : ""}`}
            aria-label={`Market Vision unlocked at ${formatDateLong(heatUnlockDate)}`}
          >
            <b>Market Vision</b>
            <em>Unlocked</em>
          </span>
          <div className="storybook-progress-fill" />
          {nextTarget && (
            <>
              <div className="storybook-progress-projection" />
              <div className="storybook-progress-target-pin">
                <ChevronRight size={13} />
                <span>Jump</span>
              </div>
            </>
          )}
          <div className="storybook-progress-pin">
            <UserRound size={15} />
            <span>Jonah</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function getTimeReelChartRange(points: TimeReelChartPoint[]) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getTimeReelChartCoordinate(
  point: TimeReelChartPoint,
  points: TimeReelChartPoint[],
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

function buildTimeReelValuePath(points: TimeReelChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  return points
    .map((point, index) => {
      const { x, y } = getTimeReelChartCoordinate(point, points, range, width, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildTimeReelAreaPath(points: TimeReelChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  const line = buildTimeReelValuePath(points, range, width, height);
  if (!line) {
    return "";
  }
  const first = getTimeReelChartCoordinate(points[0], points, range, width, height);
  const last = getTimeReelChartCoordinate(points.at(-1) ?? points[0], points, range, width, height);
  return `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

function getTimeReelChartTicks(points: TimeReelChartPoint[], maximumTicks = 5) {
  if (points.length <= maximumTicks) {
    return points;
  }
  return Array.from({ length: maximumTicks }, (_, index) => points[Math.round((index / (maximumTicks - 1)) * (points.length - 1))]);
}

function TimeReelValueChart({ transition }: { transition: TimeReelTransition }) {
  const points = transition.chartPoints.length > 0 ? transition.chartPoints : [{ date: transition.fromDate, value: transition.fromBalance }];
  const width = 420;
  const height = 148;
  const range = getTimeReelChartRange(points);
  const path = buildTimeReelValuePath(points, range, width, height);
  const areaPath = buildTimeReelAreaPath(points, range, width, height);
  const ticks = getTimeReelChartTicks(points);
  const startValue = points[0]?.value ?? transition.fromBalance;
  const endValue = points.at(-1)?.value ?? transition.targetBalance;
  const change = endValue - startValue;
  const changePercent = startValue > 0 ? (change / startValue) * 100 : 0;
  const tone = change > 0 ? "gain" : change < 0 ? "loss" : "flat";

  return (
    <section className={`storybook-time-reel-value-chart ${tone}`} aria-label={`Investment value chart from ${formatDateLong(transition.fromDate)} to ${formatDateLong(transition.targetDate)}`}>
      <header>
        <span>Investment value</span>
        <strong>{formatMoneyDelta(change)}</strong>
        <em>{formatPercent(changePercent)}</em>
        <small>
          {formatMoney(startValue)} to {formatMoney(endValue)}
        </small>
      </header>
      <div className="storybook-time-reel-chart-plot">
        <div className="storybook-time-reel-y-axis" aria-hidden="true">
          <span>{formatMoney(range.max)}</span>
          <span>{formatMoney((range.max + range.min) / 2)}</span>
          <span>{formatMoney(range.min)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart with monthly portfolio values over this time jump">
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.2} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
          <path className="storybook-time-reel-chart-gridline" d={`M 0 ${height * 0.8} H ${width}`} />
          {areaPath && <path className="storybook-time-reel-chart-area" d={areaPath} />}
          {path && <path className="storybook-time-reel-chart-line" d={path} pathLength={1} />}
          {points.map((point, index) => {
            const { x, y } = getTimeReelChartCoordinate(point, points, range, width, height);
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

function TimeReelTransitionOverlay({ transition }: { transition: TimeReelTransition }) {
  const currentParts = getRolodexDateParts(transition.fromDate);
  const landingParts = getRolodexDateParts(transition.targetDate);
  const reelFrames = [
    {
      date: transition.fromDate,
      headline: transition.fromHeadline,
      isCurrent: true,
      isFinal: false,
      isMajor: false,
      isMarketMover: false,
      parts: currentParts,
    },
    ...transition.entries.map((entry) => ({
      ...entry,
      isCurrent: false,
      parts: getRolodexDateParts(entry.date),
    })),
  ];
  const jumpWidth = Math.max(0, transition.targetProgress - transition.fromProgress);
  const style = {
    "--time-reel-start-progress": `${transition.fromProgress}%`,
    "--time-reel-target-progress": `${transition.targetProgress}%`,
    "--time-reel-jump-progress": `${jumpWidth}%`,
  } as CSSProperties;

  return (
    <div className="storybook-time-reel-overlay" aria-live="polite" aria-label="Advancing Jonah through time">
      <section className="storybook-time-reel-card rolodex-watch-skin" style={style}>
        <div className="storybook-time-reel-head">
          <span>Time jump</span>
          <strong>{transition.assetLabel}</strong>
        </div>
        <TimeReelValueChart transition={transition} />
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
                <em>{entry.isCurrent ? "Current page" : entry.isFinal ? "Final page" : entry.isMajor ? "Ultra significant" : entry.isMarketMover ? "Market shock" : "Future page"}</em>
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
            </b>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardAllocationStrip({
  currentEvent,
  game,
  onChooseAsset,
  positions,
  target,
}: {
  currentEvent: HeadlineEvent;
  game: HeadlineMarketState;
  onChooseAsset: (value: AssetChoice) => void;
  positions: PortfolioPositions;
  target: MarketTarget;
}) {
  const previousChoice = getPreviousAllocationChoice(game);
  const marketHeatUnlocked = isMarketHeatUnlockedForDate(game, target.date);
  const marketHeatUnlockDate = getMarketHeatUnlockDate(game);
  const marketHeats = getAllocationMarketHeats(game, currentEvent, target, positions);

  return (
    <div
      className={`storybook-dashboard-allocation ${marketHeatUnlocked ? "heat-unlocked" : "heat-locked"}`}
      aria-label="Choose Jonah's allocation"
      data-guide-target="allocation-buttons"
    >
      {assetChoices.map((asset) => {
        const Icon =
          asset.id === "default" ? SlidersHorizontal : asset.id === "cash" ? Landmark : asset.id === "sp500" ? LineChart : Gem;
        const preview = getAllocationPreview(game, asset.id, positions);
        const heat = marketHeats.get(asset.id) ?? getMarketHeat(0, 0);
        const isActive = asset.id === game.assetChoice;
        const isPreviousChoice = asset.id === previousChoice;

        return (
          <button
            key={asset.id}
            className={`storybook-dashboard-allocation-choice ${asset.metric} ${heat.className} ${preview.taxPenalty > 0 ? "has-tax" : ""} ${isActive ? "active" : ""} ${
              isPreviousChoice ? "previous-choice" : ""
            }`}
            type="button"
            aria-pressed={isActive}
            style={getMarketHeatStyle(heat)}
            title={
              marketHeatUnlocked
                ? `${asset.label} Market Vision: ${formatPercent(heat.returnPercent)}`
                : `Market Vision unlocks at ${formatDateLong(marketHeatUnlockDate)}`
            }
            onClick={() => onChooseAsset(asset.id)}
          >
            <Icon size={15} aria-hidden="true" />
            <strong>{asset.label}</strong>
            <span>{getDashboardChoiceLine(asset.id, preview.allocation)}</span>
            <em aria-hidden="true">{isActive ? "Selected" : isPreviousChoice ? "No trade" : ""}</em>
          </button>
        );
      })}
    </div>
  );
}

function SelectedAllocationBanner({
  assetLabel,
  allocationLine,
  isNoTrade,
  positions,
  pulseKey,
  preview,
}: {
  assetLabel: string;
  allocationLine: string;
  isNoTrade: boolean;
  positions: PortfolioPositions;
  pulseKey: number;
  preview: ReturnType<typeof getAllocationPreview>;
}) {
  const sourceChoice = getFlowAllocationChoice(positions);
  const destinationChoice = getFlowAllocationChoice(preview.targetPositions);
  const selectedFlowChoice = preview.isReallocation ? destinationChoice : sourceChoice;
  const billFrom = getAllocationFlowPosition(sourceChoice);
  const billTo = getAllocationFlowPosition(selectedFlowChoice);
  const taxTo = getAllocationFlowPosition("tax");
  const isHolding = !preview.isReallocation || billFrom === billTo;
  const visibleTax = preview.taxPenalty > 0.5;

  return (
    <aside
      className={`storybook-selected-allocation-banner ${preview.taxPenalty > 0 ? "has-tax" : "no-tax"} ${pulseKey > 0 ? "is-pulsing" : ""} ${isHolding ? "is-holding" : "is-moving"}`}
      aria-label={`Selected allocation ${assetLabel}, ${allocationLine}. ${formatMoney(preview.assignableTotal)} will be invested. Capital gains tax ${formatMoney(preview.taxPenalty)}.`}
      style={
        {
          "--bill-from": `${billFrom}%`,
          "--bill-to": `${billTo}%`,
          "--tax-to": `${taxTo}%`,
        } as CSSProperties
      }
    >
      <div className="allocation-flow-stops" aria-hidden="true">
        {allocationFlowStops.map((stop) => {
          const Icon = stop.icon;
          const isSource = stop.id === sourceChoice;
          const isDestination = stop.id === selectedFlowChoice;
          const isTaxStop = stop.id === "tax";

          return (
            <span
              key={stop.id}
              className={`allocation-flow-stop ${stop.tone} ${isSource ? "source" : ""} ${isDestination ? "destination" : ""} ${
                isTaxStop && visibleTax ? "tax-active" : ""
              }`}
            >
              <i>
                {isTaxStop ? (
                  <b>US</b>
                ) : (
                  <Icon size={15} aria-hidden="true" />
                )}
              </i>
              <em>{stop.label}</em>
            </span>
          );
        })}
        <b className="allocation-dollar-bill main-bill">
          <span>$</span>
          <strong>{formatMoney(preview.assignableTotal)}</strong>
        </b>
        {visibleTax && (
          <b className="allocation-dollar-bill tax-bill">
            <span>$</span>
            <strong>{formatMoney(preview.taxPenalty)}</strong>
          </b>
        )}
      </div>
      <div className="allocation-banner-copy">
        <span>
          {isNoTrade ? "No trade" : "Selected"} · {assetLabel}
        </span>
        <strong>
          In {formatMoney(preview.assignableTotal)} · Tax {formatMoney(preview.taxPenalty)}
        </strong>
      </div>
    </aside>
  );
}

function HeadlineRolodexSelector({
  game,
  onAdvance,
  onChooseAsset,
  onOpenChapters,
  onSelectTarget,
}: {
  game: HeadlineMarketState;
  onAdvance: () => void;
  onChooseAsset: (value: AssetChoice) => void;
  onOpenChapters: () => void;
  onSelectTarget: (index: number) => void;
}) {
  const dragStartRef = useRef<{ moved: boolean; selectedIndex: number; targetIndex: number | null; y: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const previousSelectedIndexRef = useRef(game.selectedTargetIndex);
  const [isSpinning, setIsSpinning] = useState(false);
  const [playPulseKey, setPlayPulseKey] = useState(0);
  const minimumTargetIndex = Math.min(game.roundIndex + 1, game.events.length);
  const selectedIndex = Math.max(minimumTargetIndex, Math.min(game.selectedTargetIndex, game.events.length));
  const target = getTargetMarketPoint(game, selectedIndex);
  const dateParts = getRolodexDateParts(target.date);
  const span = getSpanLabels(game, target);
  const isFinal = target.isFinal;
  const canMoveEarlier = selectedIndex > minimumTargetIndex;
  const canMoveLater = selectedIndex < game.events.length;
  const marketMoverIds = useMemo(() => getMarketMoverIds(game.events), [game.events]);
  const currentEvent = game.events[game.roundIndex];
  const decisionPositions = getDecisionPositions(game);
  const selectedAssetLabel = assetLabels[game.assetChoice];
  const selectedAllocationPreview = getAllocationPreview(game, game.assetChoice, decisionPositions);
  const selectedAllocationLine = formatCompactAllocationPercentLine(game.assetChoice, selectedAllocationPreview.allocation);
  const isNoTradeSelection = getPreviousAllocationChoice(game) === game.assetChoice;

  useEffect(() => {
    if (previousSelectedIndexRef.current !== selectedIndex) {
      previousSelectedIndexRef.current = selectedIndex;
      const frame = window.requestAnimationFrame(() => {
        setPlayPulseKey((current) => current + 1);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [selectedIndex]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPlayPulseKey((current) => current + 1);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [game.assetChoice]);

  const firstVisibleDeckIndex = game.roundIndex + Math.max(0, selectedIndex - game.roundIndex - 1);
  const lastVisibleDeckIndex = firstVisibleDeckIndex + 3;
  const headlineDeck = Array.from({ length: game.events.length - game.roundIndex + 1 }, (_, offset) => {
    const index = game.roundIndex + offset;
    const deckTarget = getTargetMarketPoint(game, index);
    const deckEvent = getEventAt(game, index);
    const isCurrent = index === game.roundIndex;
    const isSelected = index === selectedIndex;
    const isMajor = deckEvent?.major ?? false;
    const isMarketMover = deckEvent ? marketMoverIds.has(deckEvent.id) : false;
    const statusParts = [isCurrent ? "Current date" : isSelected ? "Selected jump" : deckTarget.isFinal ? "Final page" : "Future page"];
    if (isMajor) {
      statusParts.push("ultra significant");
    }
    if (isMarketMover && deckEvent) {
      statusParts.push(`red highlighter: S&P ${formatPercent(deckEvent.periodReturn)}`);
    }

    return {
      date: deckTarget.date,
      headline: deckEvent?.headline ?? finalChapterHeadline,
      index,
      isCurrent,
      isFinal: deckTarget.isFinal,
      isMajor,
      isMarketMover,
      isSelected,
      status: statusParts.join(" · "),
    };
  });
  const headlineShift = Math.max(0, selectedIndex - game.roundIndex - 1) * -1;
  const clampTargetIndex = (index: number) => Math.max(minimumTargetIndex, Math.min(game.events.length, index));
  const selectRelativeTarget = (direction: -1 | 1) => {
    const nextIndex = clampTargetIndex(selectedIndex + direction);
    if (nextIndex !== selectedIndex) {
      onSelectTarget(nextIndex);
    }
  };
  const selectYearJump = (direction: -1 | 1) => {
    const selectedDate = new Date(`${target.date}T00:00:00Z`);
    selectedDate.setUTCFullYear(selectedDate.getUTCFullYear() + direction);
    const targetTime = selectedDate.getTime();

    if (direction > 0) {
      for (let index = selectedIndex + 1; index <= game.events.length; index += 1) {
        if (dateToUtcTime(getTargetMarketPoint(game, index).date) >= targetTime) {
          onSelectTarget(index);
          return;
        }
      }
      onSelectTarget(game.events.length);
      return;
    }

    for (let index = selectedIndex - 1; index >= minimumTargetIndex; index -= 1) {
      if (dateToUtcTime(getTargetMarketPoint(game, index).date) <= targetTime) {
        onSelectTarget(index);
        return;
      }
    }
    onSelectTarget(minimumTargetIndex);
  };
  const startSpin = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.focus({ preventScroll: true });
    const headlineCard =
      event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
    const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
    const targetIndex = Number.isFinite(headlineIndex) ? clampTargetIndex(headlineIndex) : null;
    dragStartRef.current = { moved: false, selectedIndex, targetIndex, y: event.clientY };
    setIsSpinning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSpin = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) {
      return;
    }
    const deltaY = dragStart.y - event.clientY;
    if (Math.abs(deltaY) > 6) {
      dragStart.moved = true;
    }
    const nextIndex = clampTargetIndex(dragStart.selectedIndex + Math.round(deltaY / 42));
    if (nextIndex !== selectedIndex) {
      onSelectTarget(nextIndex);
    }
  };
  const stopSpin = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (dragStart?.moved) {
      ignoreClickRef.current = true;
      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
    } else if (dragStart && dragStart.targetIndex !== null && dragStart.targetIndex > game.roundIndex) {
      onSelectTarget(dragStart.targetIndex);
    }
    dragStartRef.current = null;
    setIsSpinning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleSpinWheel = (event: ReactWheelEvent<HTMLElement>) => {
    if (Math.abs(event.deltaY) < 6) {
      return;
    }
    event.preventDefault();
    selectRelativeTarget(event.deltaY > 0 ? 1 : -1);
  };
  const handleHeadlineDeckKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectRelativeTarget(-1);
      event.currentTarget.focus({ preventScroll: true });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      selectRelativeTarget(1);
      event.currentTarget.focus({ preventScroll: true });
    } else if (event.key === "Enter") {
      const headlineCard =
        event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
      const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
      if (Number.isFinite(headlineIndex) && headlineIndex > game.roundIndex && headlineIndex !== selectedIndex) {
        event.preventDefault();
        onSelectTarget(clampTargetIndex(headlineIndex));
        return;
      }
      event.preventDefault();
      onAdvance();
    }
  };
  const spinHandlers = {
    onPointerCancel: stopSpin,
    onPointerDown: startSpin,
    onPointerMove: moveSpin,
    onPointerUp: stopSpin,
    onWheel: handleSpinWheel,
  };

  return (
    <section className="storybook-date-console rolodex-watch-skin" aria-label="Grandpa's gold Rolex date selector" data-guide-target="date-console">
      <StoryProgressRail embedded game={game} onSelectTarget={onSelectTarget} />
      <article className="storybook-date-headline" aria-label="Rolling headline preview">
        <div className="storybook-deck-kicker">
          <span>{isFinal ? "Final cash-out page" : `Future page ${selectedIndex + 1} of ${game.events.length}`}</span>
          <em>
            {span.passes} pass · {span.remains} remain
          </em>
        </div>
        <div
          className={`storybook-headline-deck ${isSpinning ? "spinning" : ""}`}
          style={{ "--headline-shift": headlineShift } as CSSProperties}
          aria-keyshortcuts="ArrowUp ArrowDown"
          tabIndex={0}
          data-guide-target="headline-deck"
          onKeyDown={handleHeadlineDeckKeyDown}
          {...spinHandlers}
        >
          <div className="storybook-headline-track">
            {headlineDeck.map((deckEntry) => (
              <button
                key={`${deckEntry.index}-${deckEntry.date}`}
                className={`storybook-headline-card ${deckEntry.isCurrent ? "current" : ""} ${deckEntry.isSelected ? "selected" : ""} ${
                  deckEntry.isMajor ? "major" : ""
                } ${deckEntry.isMarketMover ? "market-shock" : ""}`}
                type="button"
                aria-label={`${formatDateLong(deckEntry.date)} ${deckEntry.headline}`}
                data-headline-index={deckEntry.index}
                onClick={() => {
                  if (ignoreClickRef.current || deckEntry.isCurrent) {
                    return;
                  }
                  onSelectTarget(deckEntry.index);
                }}
                disabled={deckEntry.isCurrent}
                tabIndex={deckEntry.index >= firstVisibleDeckIndex && deckEntry.index <= lastVisibleDeckIndex ? undefined : -1}
                aria-hidden={deckEntry.index < firstVisibleDeckIndex || deckEntry.index > lastVisibleDeckIndex}
              >
                <strong className={deckEntry.isSelected ? "marquee" : ""}>
                  {deckEntry.isSelected ? (
                    <span className="storybook-headline-marquee-track" aria-hidden="true">
                      <span>{deckEntry.headline}</span>
                      <span>{deckEntry.headline}</span>
                    </span>
                  ) : (
                    <span className="storybook-headline-text">{deckEntry.headline}</span>
                  )}
                </strong>
                <em aria-hidden="true">{deckEntry.status}</em>
              </button>
            ))}
          </div>
        </div>
      </article>

      <div className="storybook-date-controls">
        <div className="storybook-date-picker-row">
          <div
            className={`storybook-rolodex-date ${isSpinning ? "spinning" : ""}`}
            aria-label="Selected jump date. Drag vertically or use the wheel buttons to change it."
            aria-live="polite"
            data-guide-target="date-rolodex"
            {...spinHandlers}
          >
            <div key={`month-${dateParts.month}`} className="storybook-date-window month">
              <span className="storybook-date-part-label">Month</span>
              <strong>{dateParts.month}</strong>
            </div>
            <div key={`day-${dateParts.day}`} className="storybook-date-window day">
              <span className="storybook-date-part-label">Day</span>
              <strong>{dateParts.day}</strong>
            </div>
            <div key={`year-${dateParts.year}`} className="storybook-date-window storybook-year-card">
              <button
                className="storybook-year-jump up"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  selectYearJump(-1);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={!canMoveEarlier}
                aria-label="Skip back one year in headline preview"
              >
                <ChevronUp size={20} />
              </button>
              <span className="storybook-date-part-label">Year</span>
              <strong>{dateParts.year}</strong>
              <button
                className="storybook-year-jump down"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  selectYearJump(1);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                disabled={!canMoveLater}
                aria-label="Skip ahead one year in headline preview"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          <div className="storybook-rolodex-wheel" aria-label="Cycle future headline dates">
            <button type="button" onClick={() => onSelectTarget(selectedIndex - 1)} disabled={!canMoveEarlier} aria-label="Previous future headline">
              <ChevronUp size={18} />
            </button>
            <button
              className="storybook-wheel-dial"
              type="button"
              onClick={onOpenChapters}
              aria-label="Open Chapter Index"
              title="Chapter Index"
              data-guide-target="chapter-index"
            >
              <span />
              <span />
              <span />
            </button>
            <button type="button" onClick={() => onSelectTarget(selectedIndex + 1)} disabled={!canMoveLater} aria-label="Next future headline">
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        <DashboardAllocationStrip
          currentEvent={currentEvent}
          game={game}
          onChooseAsset={onChooseAsset}
          positions={decisionPositions}
          target={target}
        />

        <div className="storybook-date-actions">
          <button
            key={`play-${playPulseKey}`}
            className={`primary-action legacy-primary storybook-date-advance ${playPulseKey > 0 ? "is-pulsing" : ""}`}
            type="button"
            onClick={onAdvance}
            data-guide-target="advance-game"
            aria-label="Play selected dashboard allocation"
          >
            <span>Play</span>
            <small>
              {selectedAssetLabel} · {formatMoney(selectedAllocationPreview.assignableTotal)}
            </small>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <SelectedAllocationBanner
        key={`selected-allocation-${playPulseKey}`}
        allocationLine={selectedAllocationLine}
        assetLabel={selectedAssetLabel}
        isNoTrade={isNoTradeSelection}
        positions={decisionPositions}
        pulseKey={playPulseKey}
        preview={selectedAllocationPreview}
      />
    </section>
  );
}

function PortfolioLedger({
  compact = false,
  guideTarget,
  showGain = false,
  title,
  positions,
}: {
  compact?: boolean;
  guideTarget?: string;
  showGain?: boolean;
  title: string;
  positions: PortfolioPositions;
}) {
  const total = getPositionTotal(positions);
  const gain = total - startingBankroll;
  const gainPercent = (gain / startingBankroll) * 100;

  return (
    <section className={`storybook-ledger ${compact ? "compact" : ""}`} aria-label={title} data-guide-target={guideTarget}>
      <div className="storybook-ledger-head">
        <span>{title}</span>
        <strong>
          {formatMoney(total)}
          {showGain && (
            <em className={`storybook-ledger-performance ${gain > 0 ? "positive" : gain < 0 ? "negative" : "neutral"}`}>
              ({formatMoneyDelta(gain)} / {formatPercent(gainPercent)})
            </em>
          )}
        </strong>
      </div>
      <div className="storybook-ledger-lines">
        {positionAssets.map((asset) => (
          <div key={asset.id}>
            <span>{asset.label}</span>
            <strong>{formatMoney(positions[asset.id])}</strong>
            <em>{formatPercent(getPositionPercent(positions, asset.id)).replace("+", "")}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketMiniChart({
  accent,
  endDate,
  label,
  prefix = "",
  series,
  startDate,
}: {
  accent: "sp" | "gold";
  endDate: string;
  label: string;
  prefix?: string;
  series: MarketChartPoint[];
  startDate: string;
}) {
  const chartWindow = getChartWindow(series, startDate, endDate);
  const points = chartWindow.points;
  const sampledPoints = downsampleSeries(points);
  const path = buildSparklinePath(sampledPoints);
  const firstPoint = points[0];
  const lastPoint = points.at(-1);
  const change = firstPoint && lastPoint ? (lastPoint.value / firstPoint.value - 1) * 100 : 0;

  return (
    <section className={`storybook-market-chart ${accent}`}>
      <div>
        <span>{label}</span>
        <strong>
          {prefix}
          {formatChartValue(lastPoint?.value ?? 0)}
        </strong>
        <em className={change >= 0 ? "positive" : "negative"}>{formatPercent(change)}</em>
      </div>
      <svg viewBox="0 0 240 72" role="img" aria-label={`${label} chart from ${formatDateShort(startDate)} to ${formatDateShort(endDate)}`}>
        <path className="storybook-chart-gridline top" d="M 0 12 H 240" />
        <path className="storybook-chart-gridline mid" d="M 0 36 H 240" />
        <path className="storybook-chart-gridline bottom" d="M 0 60 H 240" />
        {path && <path className="storybook-chart-line" d={path} />}
      </svg>
      <footer>
        <span>{formatDateShort(chartWindow.rangeStartDate)} to {formatDateShort(lastPoint?.date ?? endDate)}</span>
        <span>{chartWindow.contextLabel}</span>
        <span>{points.length} daily points</span>
      </footer>
    </section>
  );
}

function StorybookStart({
  game,
  introPage,
  introTransition,
  onTurnPage,
  onBegin,
  onDefaultSp,
  onDefaultGold,
}: {
  game: HeadlineMarketState;
  introPage: IntroPage;
  introTransition: IntroTransition;
  onTurnPage: () => void;
  onBegin: () => void;
  onDefaultSp: (value: number) => void;
  onDefaultGold: (value: number) => void;
}) {
  const defaultCashPercent = getDefaultCashPercent(game);
  const defaultSpAmount = (startingBankroll * game.defaultSpPercent) / 100;
  const defaultGoldAmount = (startingBankroll * game.defaultGoldPercent) / 100;
  const defaultCashAmount = (startingBankroll * defaultCashPercent) / 100;
  const prologueDate = formatDateWithWeekday(game.timeline.inheritanceDate);
  const perfectTimingQuestion = `How much do you think someone using this investment strategy from ${formatDateLong(game.timeline.inheritanceDate)} to ${formatDateLong(game.timeline.periodEndDate)} could have made if they timed the market perfectly? Find out at the end.`;
  const isTransitioning = introTransition !== "none";

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-intro-shell">
      <section className={`storybook-book intro ${introPage}`}>
        {introPage === "setup" ? (
          <article className="storybook-intro-page prologue">
            <figure className="storybook-prologue-art" aria-label="Jonah outside The Sentinel on a stormy night">
              <img src={assetUrl("jonah-prologue-front-page-fortune.jpg")} alt="Cartoon depiction of Jonah holding Grandpa's Rolex and briefcase outside The Sentinel during a storm." />
            </figure>
            <div className="storybook-prologue-copy-panel">
              <p className="storybook-game-title">Front Page Fortune</p>
              <p className="eyebrow">Prologue</p>
              <h1>The Inheritance</h1>
              <p className="storybook-prologue-date">{prologueDate}</p>
              <p className="storybook-copy">
                Grandpa is found dead inside The Sentinel and leaves each grandchild {formatMoney(startingBankroll)} to invest.
              </p>
            </div>
            <div className="storybook-chapter-one-cards">
              <span>Jonah receives Grandpa's gold Rolex and a leather briefcase of impossible future front pages.</span>
              <span>The clippings point through the next 20 years. Jonah can use them to grow the inheritance.</span>
            </div>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play" type="button" onClick={onTurnPage} disabled={isTransitioning}>
              <Play size={18} />
              <span>Start Game</span>
              <small>{formatDateLong(game.timeline.inheritanceDate)}</small>
            </button>
          </article>
        ) : (
          <article className="storybook-intro-page rules">
            <h1>How To Play</h1>
            <p className="storybook-howto-goal">Goal: Grow Grandpa's {formatMoney(startingBankroll)} by deciding how markets react to future front pages.</p>
            <p className="storybook-perfect-question">
              <Trophy size={16} />
              <span>{perfectTimingQuestion}</span>
            </p>
            <div className="storybook-howto-dashboard-map">
              <figure className="storybook-howto-dashboard-shot wide">
                <img
                  src={assetUrl("games/headline-market/how-to-dashboard-desktop.png")}
                  alt="Front Page Fortune dashboard with the headline stack, Rolex date selector, allocation buttons, Play button, selected article preview, and bottom page controls."
                />
                <figcaption>Dashboard view</figcaption>
              </figure>
              <figure className="storybook-howto-dashboard-shot phone">
                <img
                  src={assetUrl("games/headline-market/how-to-dashboard-mobile.png")}
                  alt="Mobile Front Page Fortune dashboard with the date selector, allocation buttons, article preview, and fixed bottom controls."
                />
                <figcaption>Phone view</figcaption>
              </figure>
            </div>
            <div className="storybook-howto-steps" aria-label="How to play Front Page Fortune">
              <section className="storybook-howto-step">
                <span className="storybook-howto-number">1</span>
                <Newspaper size={16} />
                <strong>Pick a future page</strong>
                <p>Use the timeline, headline stack, or gold date selector to choose the next front page. After you play it, Jonah cannot jump backward.</p>
              </section>
              <section className="storybook-howto-step">
                <span className="storybook-howto-number">2</span>
                <SlidersHorizontal size={16} />
                <strong>Choose allocation</strong>
                <p>Pick Custom Mix, Bonds, S&amp;P 500, or Gold. That allocation stays invested through the skipped time.</p>
              </section>
              <section className="storybook-howto-step">
                <span className="storybook-howto-number">3</span>
                <Play size={16} />
                <strong>Hit Play</strong>
                <p>The dashboard advances to the selected article date and shows how Jonah's portfolio changed.</p>
              </section>
              <section className="storybook-howto-step">
                <span className="storybook-howto-number">4</span>
                <WalletCards size={16} />
                <strong>Check the pages</strong>
                <p>Journal, Ledger, and Current Page stay fixed at the bottom. The ledger tracks balance, taxes, allocation, and family benchmarks.</p>
              </section>
            </div>
            <div className="storybook-default-position">
              <div className="storybook-default-heading">
                <span>Custom Portfolio Allocation</span>
                <p>
                  This sets the dashboard's Custom Mix button. Reallocating after gains can trigger a 15% capital gains tax.
                </p>
              </div>
              <label>
                <span>S&amp;P 500</span>
                <input type="range" min="0" max="100" step="5" value={game.defaultSpPercent} onChange={(event) => onDefaultSp(Number(event.target.value))} />
                <b><strong>{game.defaultSpPercent}%</strong><em>{formatMoney(defaultSpAmount)}</em></b>
              </label>
              <div className="storybook-cash-start">
                <span>Bonds</span>
                <strong>{defaultCashPercent}%</strong>
                <em>{formatMoney(defaultCashAmount)}</em>
              </div>
              <label>
                <span>Gold</span>
                <input type="range" min="0" max="100" step="5" value={game.defaultGoldPercent} onChange={(event) => onDefaultGold(Number(event.target.value))} />
                <b><strong>{game.defaultGoldPercent}%</strong><em>{formatMoney(defaultGoldAmount)}</em></b>
              </label>
            </div>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play storybook-briefcase-play" type="button" onClick={onBegin} disabled={isTransitioning}>
              <Play size={18} />
              Play
            </button>
          </article>
        )}
        <aside className="storybook-briefcase-art" aria-label="Grandfather's leather briefcase of future newspapers">
          <div className="storybook-briefcase-handle" />
          <div className="storybook-paper-fan">
            {game.events.slice(0, 4).map((event, index) => (
              <div key={event.id} style={{ "--paper-offset": `${index * 12}px` } as CSSProperties}>
                <span>{formatDateLong(event.date)}</span>
                <strong>{event.headline}</strong>
              </div>
            ))}
          </div>
          <div className="storybook-briefcase-label">Grandpa's briefcase</div>
        </aside>
      </section>
      <footer className="disclaimer">{educationalDisclaimer} Historical index returns are not predictions.</footer>
      {introTransition === "page" && (
        <div className="storybook-intro-rolex-spin-overlay" aria-hidden="true">
          <div className="storybook-intro-rolex-stage">
            <div className="storybook-intro-rolex-dial">
              <span>Oct</span>
              <strong>26</strong>
              <em>1987</em>
            </div>
            <strong>Setting the first date</strong>
          </div>
        </div>
      )}
      {introTransition === "briefcase" && (
        <div className="storybook-briefcase-open-overlay" aria-hidden="true">
          <div className="storybook-briefcase-open-stage">
            <div className="storybook-opening-briefcase">
              <div className="storybook-opening-briefcase-handle" />
              <div className="storybook-opening-papers">
                <span />
                <span />
                <span />
              </div>
              <div className="storybook-opening-briefcase-lid" />
              <div className="storybook-opening-briefcase-base" />
            </div>
            <strong>
              <BriefcaseBusiness size={20} />
              Opening Grandpa's briefcase
            </strong>
          </div>
        </div>
      )}
    </main>
  );
}

function NewspaperOverlay({
  game,
  previewIndex,
  onClose,
  onJump,
}: {
  game: HeadlineMarketState;
  previewIndex: number;
  onClose: () => void;
  onJump: (index: number) => void;
}) {
  const event = getEventAt(game, previewIndex);
  const target = getTargetMarketPoint(game, previewIndex);
  const canJump = game.phase === "choose" && previewIndex > game.roundIndex;
  const article = event?.newspaperArticle;
  const ledeParagraphs = article?.lede.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean) ?? [];
  const isFinalPreview = previewIndex >= game.events.length;
  const fallbackArticle =
    event?.summary ?? event?.setup ?? (isFinalPreview ? finalChapterSummary : "Jonah reaches the end of the briefcase. The future papers have stopped being future.");

  return (
    <div className="storybook-overlay storybook-desk-overlay" role="dialog" aria-modal="true" aria-label={`Newspaper page for ${formatDateLong(target.date)}`}>
      <article className="storybook-newspaper-page storybook-desk-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Minimize newspaper">
          <Minimize2 size={16} />
          Minimize
        </button>
        <div className="storybook-desk-layout">
          <section className={`storybook-newspaper-clipping ${event ? "with-headline-image" : ""}`} aria-label="Opened newspaper clipping">
            <div className="storybook-masthead">
              <span>{event?.era ?? "Twenty-Year Close"}</span>
              <b>{chronicleName}</b>
              <em>{formatDateLong(target.date)}</em>
            </div>
            {event?.major && <strong className="storybook-major-banner">Ultra significant world headline</strong>}
            <h2>{event?.headline ?? finalChapterHeadline}</h2>
            <p className="storybook-deck">{event?.deck ?? finalChapterDeck}</p>
            <HeadlineEventImage event={event} variant="newspaper" />
            {article ? (
              <div className="storybook-article-body">
                <div className="storybook-article-lede">
                  {ledeParagraphs.map((paragraph, index) => (
                    <p key={`${article.dateline}-${index}`}>
                      {index === 0 && (
                        <>
                          <strong>{article.dateline}</strong>
                          {" - "}
                        </>
                      )}
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="storybook-article-fallback">{fallbackArticle}</p>
            )}
          </section>

          <aside className="storybook-desk-notes" aria-label="Jonah's desk notes">
            {article && (
              <section className="storybook-desk-note storybook-frontpage-facts" aria-label="Front page facts">
                <span>Front Page Facts</span>
                <ul>
                  {article.facts.map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
              </section>
            )}
            <div className="storybook-paper-columns storybook-desk-note storybook-desk-prices storybook-pricing-anchor">
              <section>
                <span>Pricing anchor</span>
                <strong>{formatDateLong(target.date)}</strong>
                <p>
                  {isFinalPreview
                    ? "The twenty-year cash-out happens on Grandpa's final page."
                    : "The game prices the move from this page's close, or the next market-open close when markets were shut."}
                </p>
              </section>
              <section>
                <span>Result hidden</span>
                <strong>Choose first</strong>
                <p>Future returns stay hidden until Jonah plays the allocation.</p>
              </section>
            </div>
            <div className="storybook-overlay-actions storybook-desk-actions">
              {canJump && (
                <button className="primary-action legacy-primary" type="button" onClick={() => onJump(previewIndex)}>
                  Jump to This Chapter
                  <ChevronRight size={18} />
                </button>
              )}
              <button className="secondary-action" type="button" onClick={onClose}>
                Back to Book
              </button>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function JournalOverlay({ game, onClose }: { game: HeadlineMarketState; onClose: () => void }) {
  const lastResult = game.results.at(-1);
  const event = game.phase === "reveal" && lastResult && !lastResult.targetIsFinal ? game.events[lastResult.targetIndex] : game.events[game.roundIndex];
  const date = event?.date ?? game.timeline.periodEndDate;
  const journalText = event?.journalEntry ?? event?.lifeNote ?? "Jonah keeps the briefcase close and the answers farther away than he expected.";
  const paragraphs = journalText.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Jonah's journal">
      <article className="storybook-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Minimize journal">
          <Minimize2 size={16} />
          Minimize
        </button>
        <p className="eyebrow">Mercer Family Journal</p>
        <h2>{formatDateLong(date)} · Age {characterAge(game, date)}</h2>
        <div className="storybook-journal-entry">
          {paragraphs.map((paragraph, index) => (
            <p key={`${date}-${index}`}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}

function ChapterDrawer({
  game,
  onClose,
  onRead,
  onJump,
}: {
  game: HeadlineMarketState;
  onClose: () => void;
  onRead: (index: number) => void;
  onJump: (index: number) => void;
}) {
  const activeIndex = game.phase === "reveal" ? (game.results.at(-1)?.targetIndex ?? game.roundIndex) : game.roundIndex;
  const allEntries = useMemo(
    () => [
      ...game.events.map((event, index) => ({ ...event, index, final: false })),
      {
        id: "final-ledger",
        index: game.events.length,
        date: game.timeline.periodEndDate,
        era: "Final Page",
        headline: finalChapterHeadline,
        deck: finalChapterDeck,
        setup: "",
        marketQuestion: "",
        lifeNote: "",
        startClose: game.timeline.finalClose,
        endClose: game.timeline.finalClose,
        periodReturn: 0,
        beforeStartClose: game.timeline.finalClose,
        beforeEndClose: game.timeline.finalClose,
        beforePeriodReturn: 0,
        afterStartClose: game.timeline.finalClose,
        afterEndClose: game.timeline.finalClose,
        afterPeriodReturn: 0,
        goldStart: game.timeline.finalGold,
        goldEnd: game.timeline.finalGold,
        goldReturn: 0,
        beforeGoldStart: game.timeline.finalGold,
        beforeGoldEnd: game.timeline.finalGold,
        beforeGoldReturn: 0,
        afterGoldStart: game.timeline.finalGold,
        afterGoldEnd: game.timeline.finalGold,
        afterGoldReturn: 0,
        lesson: "",
        sourceLabel: "Final story page",
        summary: finalChapterSummary,
        journalEntry: finalChapterJournal,
        major: false,
        final: true,
      },
    ],
    [game],
  );
  const entries = useMemo(() => allEntries.filter((entry) => entry.index > activeIndex), [activeIndex, allEntries]);
  const marketMoverIds = useMemo(() => getMarketMoverIds(game.events), [game.events]);
  const firstFutureIndex = entries[0]?.index;
  const [expandedYears, setExpandedYears] = useState<Set<string>>(() => new Set());
  const groups = useMemo(
    () =>
      entries.reduce<Array<{ year: string; entries: typeof entries }>>((yearGroups, entry) => {
        const year = entry.date.slice(0, 4);
        const existing = yearGroups.find((group) => group.year === year);
        if (existing) {
          existing.entries.push(entry);
        } else {
          yearGroups.push({ year, entries: [entry] });
        }
        return yearGroups;
      }, []),
    [entries],
  );

  const toggleYear = (year: string) => {
    setExpandedYears((current) => {
      const next = new Set(current);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  return (
    <div className="storybook-overlay chapters" role="dialog" aria-modal="true" aria-label="Chapter selection">
      <article className="storybook-chapter-page">
        <div className="storybook-chapter-head">
          <div>
            <p className="eyebrow">Chapter Index</p>
            <h2>Set Jonah's next date</h2>
            <p data-guide-target="chapter-instructions">
              Pick from any date below to advance. You can also skip from this point to the end of the game holding one investment.
            </p>
          </div>
          <button
            className="storybook-minimize inline"
            type="button"
            onClick={onClose}
            aria-label="Minimize chapters"
            data-guide-target="chapter-minimize"
          >
            <Minimize2 size={16} />
            Minimize
          </button>
        </div>
        <button
          className="primary-action legacy-primary storybook-skip-end"
          type="button"
          onClick={() => onJump(game.events.length)}
          data-guide-target="chapter-skip-end"
        >
          Skip to the End Holding One Investment
          <ChevronRight size={18} />
        </button>
        <div className="storybook-year-book" data-guide-target="chapter-year-book">
          {groups.map((group) => {
            const isExpanded = expandedYears.has(group.year);
            const hasNext = group.entries.some((entry) => entry.index === firstFutureIndex);
            const hasLandmark = group.entries.some((entry) => !entry.final && landmarkEventIds.has(entry.id));
            return (
              <section
                key={group.year}
                className={`storybook-year-chapter ${hasNext ? "current" : ""} ${hasLandmark ? "landmark" : ""}`}
                data-guide-target={hasNext ? "chapter-next-year" : undefined}
              >
                <button type="button" onClick={() => toggleYear(group.year)} aria-expanded={isExpanded}>
                  <ChevronDown size={15} />
                  <strong>{group.year}</strong>
                  <span>{group.entries.length} pages</span>
                  {hasLandmark && <em>Landmark year</em>}
                  {hasNext && <em>Next available</em>}
                </button>
                {isExpanded && (
                  <div className="storybook-headline-list">
                    {group.entries.map((entry) => {
                      const target = getTargetMarketPoint(game, entry.index);
                      const span = getSpanLabels(game, target);
                      const canJump = game.phase !== "complete";
                      const isMarketMover = !entry.final && marketMoverIds.has(entry.id);
                      return (
                        <article key={entry.id} className={`${entry.major ? "major" : ""} ${isMarketMover ? "market-shock" : ""}`}>
                          <div>
                            <span>{formatDateLong(entry.date)}</span>
                            <strong>{entry.headline}</strong>
                            <em>
                              {entry.era}
                              {entry.major ? " · ultra significant" : ""}
                              {isMarketMover ? ` · red highlighter: S&P ${formatPercent(entry.periodReturn)}` : ""}
                            </em>
                            <small>{span.passes} pass · {span.remains} remain</small>
                          </div>
                          <div>
                            <button className="secondary-action compact" type="button" onClick={() => onRead(entry.index)}>
                              Read
                            </button>
                            {canJump && (
                              <button
                                className="primary-action legacy-primary compact storybook-chapter-play-button"
                                type="button"
                                onClick={() => onJump(entry.index)}
                                aria-label={`Play this date to move Jonah to ${formatDateLong(entry.date)}`}
                              >
                                Play
                                <ChevronRight size={14} />
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function DashboardGuideOverlay({ onStart }: { onStart: () => void }) {
  return (
    <TargetGuideOverlay
      buttonLabel="Start"
      className="dashboard-guide-live"
      guideItems={dashboardGuideItems}
      label="Dashboard guide"
      onStart={onStart}
      showStartButton={false}
      subtitle="Click anywhere to start"
      title="Jonah's Dashboard"
    />
  );
}

function AllocationComplicationSelector({
  currentEvent,
  game,
  isFinalJump,
  onChooseAsset,
  pulseKey,
  positions,
  target,
}: {
  currentEvent: HeadlineEvent;
  game: HeadlineMarketState;
  isFinalJump: boolean;
  onChooseAsset: (value: AssetChoice) => void;
  pulseKey: number;
  positions: PortfolioPositions;
  target: MarketTarget;
}) {
  const foundAssetIndex = assetChoices.findIndex((asset) => asset.id === game.assetChoice);
  const selectedAssetIndex = foundAssetIndex >= 0 ? foundAssetIndex : 0;
  const selectedAsset = assetChoices[selectedAssetIndex];
  const selectedPreview = getAllocationPreview(game, selectedAsset.id, positions);
  const selectedTitle = assetLabels[selectedAsset.id];
  const previousChoice = getPreviousAllocationChoice(game);
  const selectedIsPreviousChoice = selectedAsset.id === previousChoice;
  const marketHeatUnlocked = isMarketHeatUnlockedForDate(game, target.date);
  const marketHeatUnlockDate = getMarketHeatUnlockDate(game);
  const marketHeats = getAllocationMarketHeats(game, currentEvent, target, positions);
  const selectedHeat = marketHeats.get(selectedAsset.id) ?? getMarketHeat(0, 0);
  const allocationFigures = allocationVisualAssets.map((asset) => ({
    ...asset,
    amount: selectedPreview.targetPositions[asset.id],
    percent: selectedPreview.allocation[asset.id],
  }));
  const actionLabel = selectedPreview.isReallocation ? "Moving" : "Holding";
  const tradeLabel = isFinalJump ? "Final" : selectedPreview.isReallocation ? "Trade" : "No trade";
  const tradeStatLabel = selectedIsPreviousChoice ? "No trade" : selectedAsset.id === "cash" ? "T-bill" : tradeLabel;
  const tradeValue = selectedIsPreviousChoice
    ? "Previous"
    : selectedAsset.id === "cash"
      ? getBondYieldFigure(currentEvent.date, target.date)
      : selectedPreview.isReallocation
        ? "Reallocate"
        : "Keep";
  const selectAssetIndex = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(assetChoices.length - 1, index));
    onChooseAsset(assetChoices[boundedIndex].id);
  };

  return (
    <div className={`storybook-allocation-complication ${marketHeatUnlocked ? "heat-unlocked" : "heat-locked"}`} aria-label="Choose allocation for this jump">
      <div className="storybook-allocation-wheel-wrap">
        <span className="storybook-allocation-choice-label">Make Selection</span>
        <div
          className="storybook-allocation-wheel"
          role="listbox"
          aria-label="Choose allocation"
          aria-activedescendant={`allocation-choice-${selectedAsset.id}`}
          aria-keyshortcuts="ArrowUp ArrowDown"
          tabIndex={0}
        >
          <div className="storybook-allocation-wheel-track">
            {assetChoices.map((asset, index) => {
              const summary = getAllocationButtonSummary(game, asset.id, positions);
              const isActive = asset.id === selectedAsset.id;
              const isPreviousChoice = asset.id === previousChoice;
              const heat = marketHeats.get(asset.id) ?? getMarketHeat(0, 0);
              return (
                <button
                  id={`allocation-choice-${asset.id}`}
                  key={asset.id}
                  className={`storybook-allocation-wheel-item ${asset.metric} ${heat.className} ${isActive ? "active" : ""} ${isPreviousChoice ? "previous-choice" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  aria-pressed={isActive}
                  data-allocation-index={index}
                  style={getMarketHeatStyle(heat)}
                  title={
                    marketHeatUnlocked
                      ? `${asset.label} Market Vision: ${formatPercent(heat.returnPercent)}`
                      : `Market Vision unlocks at ${formatDateLong(marketHeatUnlockDate)}`
                  }
                  onClick={() => selectAssetIndex(index)}
                >
                  {isPreviousChoice && <small className="storybook-no-trade-ribbon">No trade</small>}
                  <strong>{asset.label}</strong>
                  <span>{asset.short}</span>
                  <em className={isActive ? "selection-tag" : ""}>{isActive ? "Currently Selected" : isPreviousChoice ? "Previous choice" : summary.action}</em>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <article
        key={`allocation-detail-${pulseKey}`}
        className={`storybook-allocation-detail-panel ${selectedHeat.className} ${pulseKey > 0 ? "is-pulsing" : ""} ${selectedIsPreviousChoice ? "previous-choice" : ""}`}
        style={getMarketHeatStyle(selectedHeat)}
        aria-live="polite"
      >
        {selectedIsPreviousChoice && <span className="storybook-no-trade-corner">No trade</span>}
        <span className="storybook-selected-badge">Currently Selected</span>
        <h3>{selectedTitle}</h3>
        <div className="storybook-allocation-figure" aria-label={`Selected allocation for ${selectedTitle}`}>
          <div className="storybook-allocation-bar" aria-hidden="true">
            {allocationFigures.map((asset) => (
              <span
                key={asset.id}
                className={`storybook-allocation-bar-segment ${asset.tone}`}
                style={{ "--allocation-share": `${asset.percent}%` } as CSSProperties}
              />
            ))}
          </div>
          <div className="storybook-allocation-legend">
            {allocationFigures.map((asset) => (
              <span key={asset.id} className={`storybook-allocation-legend-item ${asset.tone} ${asset.percent <= 0.5 ? "empty" : ""}`}>
                <i aria-hidden="true" />
                <b>{asset.label}</b>
                <strong>{Math.round(asset.percent)}%</strong>
                <em>{formatMoney(asset.amount)}</em>
              </span>
            ))}
          </div>
        </div>
        <div className="storybook-allocation-stats">
          <span>
            <em>{actionLabel}</em>
            <strong>{formatMoney(selectedPreview.assignableTotal)}</strong>
          </span>
          <span>
            <em>Tax</em>
            <strong>{selectedPreview.taxPenalty > 0 ? formatMoney(selectedPreview.taxPenalty) : "$0"}</strong>
          </span>
          <span>
            <em>{tradeStatLabel}</em>
            <strong>{tradeValue}</strong>
          </span>
        </div>
      </article>
    </div>
  );
}

function ConfirmJumpDialog({
  game,
  targetIndex,
  onChooseAsset,
  onCancel,
  onConfirm,
}: {
  game: HeadlineMarketState;
  targetIndex: number;
  onChooseAsset: (value: AssetChoice) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const target = getTargetMarketPoint(game, targetIndex);
  const targetEvent = getEventAt(game, targetIndex);
  const currentEvent = game.events[game.roundIndex];
  const decisionPositions = getDecisionPositions(game);
  const isFinalJump = target.isFinal;
  const selectedAssetIndex = assetChoices.findIndex((asset) => asset.id === game.assetChoice);
  const selectedChoice = selectedAssetIndex >= 0 ? assetChoices[selectedAssetIndex] : assetChoices[0];
  const confirmAssetLabel = assetLabels[selectedChoice.id];
  const previousAssetChoiceRef = useRef(game.assetChoice);
  const [allocationPulseKey, setAllocationPulseKey] = useState(0);
  const selectRelativeAsset = (direction: -1 | 1) => {
    const currentIndex = selectedAssetIndex >= 0 ? selectedAssetIndex : 0;
    const nextIndex = Math.max(0, Math.min(assetChoices.length - 1, currentIndex + direction));
    onChooseAsset(assetChoices[nextIndex].id);
  };
  const handleConfirmKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectRelativeAsset(-1);
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectRelativeAsset(1);
    } else if (event.key === "Enter") {
      const activeButton = event.target instanceof HTMLElement ? event.target.closest("button") : null;
      if (activeButton) {
        return;
      }
      event.preventDefault();
      onConfirm();
    } else if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  useEffect(() => {
    dialogRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (selectedAssetIndex < 0) {
      onChooseAsset(assetChoices[0].id);
    }
  }, [onChooseAsset, selectedAssetIndex]);

  useEffect(() => {
    if (previousAssetChoiceRef.current !== game.assetChoice) {
      previousAssetChoiceRef.current = game.assetChoice;
      setAllocationPulseKey((current) => current + 1);
    }
  }, [game.assetChoice]);

  return (
    <div className="storybook-confirm-backdrop" role="dialog" aria-modal="true" aria-label="Confirm time jump">
      <section
        ref={dialogRef}
        className={`storybook-confirm-card ${isFinalJump ? "final-jump" : ""}`}
        tabIndex={-1}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Enter Escape"
        onKeyDown={handleConfirmKeyDown}
      >
        <h2>{formatDateWithWeekday(target.date)}</h2>
        <div className="storybook-decision-front-page">
          <div className="storybook-decision-front-copy">
            <span>{target.isFinal ? "Final cash-out" : targetEvent?.era ?? "Selected front page"}</span>
            <strong>{targetEvent?.headline ?? finalChapterHeadline}</strong>
          </div>
          <HeadlineEventImage event={targetEvent} variant="preview" />
        </div>
        <DecisionJourneyTimeline currentDate={currentEvent.date} game={game} target={target} />
        {isFinalJump && (
          <div className="storybook-end-warning">
            <strong>End-game jump</strong>
            <span>Pick one allocation below. Jonah will hold it from here through the final cash-out.</span>
          </div>
        )}
        <div className="storybook-confirm-allocation">
          <AllocationComplicationSelector
            currentEvent={currentEvent}
            game={game}
            isFinalJump={isFinalJump}
            onChooseAsset={onChooseAsset}
            pulseKey={allocationPulseKey}
            positions={decisionPositions}
            target={target}
          />
        </div>
        <div className="storybook-overlay-actions">
          <button
            key={`confirm-play-${allocationPulseKey}`}
            className={`primary-action legacy-primary storybook-confirm-play-button ${allocationPulseKey > 0 ? "is-pulsing" : ""}`}
            type="button"
            onClick={onConfirm}
          >
            Play with {confirmAssetLabel}
            <ChevronRight size={18} />
          </button>
          <button className="secondary-action" type="button" onClick={onCancel}>
            Back
          </button>
        </div>
      </section>
    </div>
  );
}

function LedgerOverlay({ game, onClose }: { game: HeadlineMarketState; onClose: () => void }) {
  const comparisonRows = getLedgerComparisonRows(game);
  const event = game.events[game.roundIndex];
  const prices = event ? getMarketPrices(event) : { sp500: game.timeline.finalClose, gold: game.timeline.finalGold };
  const bondYield = getBondYieldForDate(event?.date ?? game.timeline.periodEndDate);
  const chartEndDate = event?.marketDate ?? event?.date ?? game.timeline.periodEndDate;
  const goldChartEndDate = event?.goldMarketDate ?? event?.date ?? game.timeline.periodEndDate;

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Portfolio ledger">
      <article className="storybook-ledger-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Minimize ledger">
          <Minimize2 size={16} />
          Minimize
        </button>
        <p className="eyebrow">Portfolio Ledger</p>
        <h2>Jonah's Positions</h2>
        <PortfolioLedger showGain title="Current ledger" positions={game.currentPositions} />
        <section className="storybook-ledger-market-context" aria-label="Market tape and charts">
          <div className="storybook-ledger-section-head">
            <span>Market tape</span>
            <strong>{event ? formatDateLong(event.date) : formatDateLong(game.timeline.periodEndDate)}</strong>
          </div>
          <div className="storybook-market-row">
            <span>S&amp;P {formatMarketPrice(prices.sp500)}</span>
            <span>Gold ${formatMarketPrice(prices.gold)}</span>
            <span>3M T-Bill annual yield {bondYield.value.toFixed(2)}%</span>
          </div>
          <div className="storybook-market-charts" aria-label="Market charts through current story date">
            <MarketMiniChart accent="sp" endDate={chartEndDate} label="S&P 500" series={sp500DailySeries} startDate={game.timeline.inheritanceDate} />
            <MarketMiniChart accent="gold" endDate={goldChartEndDate} label="Gold" prefix="$" series={goldDailySeries} startDate={game.timeline.inheritanceDate} />
          </div>
          <div className="storybook-yield-card">
            <span>Bonds annual yield</span>
            <strong>
              {bondYield.value.toFixed(2)}%
              <em>per year</em>
            </strong>
            <p>
              Annualized 3-month U.S. Treasury bill secondary-market yield, monthly average for {formatDateShort(`${bondYield.month}-01`)}.
              Used as Jonah's bonds return proxy.
            </p>
          </div>
        </section>
        <section className="storybook-ledger-comparison" aria-label="Family investment comparison">
          <div className="storybook-ledger-section-head">
            <span>Family comparison</span>
            <strong>Where everyone stands now</strong>
          </div>
          {comparisonRows.map((row) => (
            <article key={row.label} className={row.label === "Jonah" ? "player" : ""}>
              <div>
                <span>{row.label}</span>
                <small>{row.note}</small>
              </div>
              <strong>{formatMoney(row.value)}</strong>
              <em>
                {formatPercent(getStartingGain(row.value))}
                {row.label !== "Jonah" ? ` · ${row.gap >= 0 ? "+" : ""}${formatMoney(row.gap)} vs Jonah` : ""}
              </em>
            </article>
          ))}
        </section>
        <div className="storybook-ledger-history">
          <div className="storybook-ledger-section-head">
            <span>Recent moves</span>
            <strong>Last committed chapters</strong>
          </div>
          {game.results.length === 0 ? (
            <p>No chapters committed yet.</p>
          ) : (
            game.results.slice(-5).map((result, index) => (
              <article key={`${result.event.id}-${index}`}>
                <span>{formatDateLong(result.event.date)} to {formatDateLong(result.targetDate)}</span>
                <strong>{assetLabels[result.assetChoice]}</strong>
                <em>{formatPercent(result.assetReturn)} · {formatMoney(result.endingBankroll)}</em>
              </article>
            ))
          )}
        </div>
      </article>
    </div>
  );
}

function FinalJournalOverlay({ onClose }: { onClose: () => void }) {
  const paragraphs = finalChapterJournal.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean);

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Final journal entry">
      <article className="storybook-journal-page final-entry">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Minimize final journal entry">
          <Minimize2 size={16} />
          Minimize
        </button>
        <p className="eyebrow">Final Journal Entry</p>
        <h2>Grandpa's Last Edition</h2>
        <div className="storybook-journal-entry">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}

type FinalPerformancePoint = {
  date: string;
  label: string;
  jonah: number;
  eli: number;
  ruth: number;
};

function getFinalPerformancePoints(game: HeadlineMarketState): FinalPerformancePoint[] {
  const points: FinalPerformancePoint[] = [
    {
      date: game.timeline.inheritanceDate,
      label: "Inheritance",
      jonah: startingBankroll,
      eli: startingBankroll,
      ruth: startingBankroll,
    },
  ];

  game.results.forEach((result, index) => {
    points.push({
      date: result.targetDate,
      label: result.targetIsFinal ? "Final cash-out" : `Move ${index + 1}`,
      jonah: result.endingBankroll,
      eli: result.brotherEndingBankroll,
      ruth: result.sisterEndingBankroll,
    });
  });

  return points;
}

function getFinalChartRange(points: FinalPerformancePoint[]) {
  const values = points.flatMap((point) => [point.jonah, point.eli, point.ruth]);
  const min = Math.min(...values, startingBankroll);
  const max = Math.max(...values, startingBankroll);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getFinalChartX(game: HeadlineMarketState, date: string, width: number) {
  const start = dateToUtcTime(game.timeline.inheritanceDate);
  const end = dateToUtcTime(game.timeline.periodEndDate);
  const current = dateToUtcTime(date);
  return ((current - start) / Math.max(1, end - start)) * width;
}

function getFinalChartY(value: number, range: { min: number; max: number }, height: number) {
  return height - ((value - range.min) / Math.max(1, range.max - range.min)) * height;
}

function buildFinalPerformancePath(
  game: HeadlineMarketState,
  points: FinalPerformancePoint[],
  key: "jonah" | "eli" | "ruth",
  range: { min: number; max: number },
  width = 340,
  height = 126,
) {
  return points
    .map((point, index) => {
      const x = getFinalChartX(game, point.date, width);
      const y = getFinalChartY(point[key], range, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function FinalPerformanceChart({ game, points }: { game: HeadlineMarketState; points: FinalPerformancePoint[] }) {
  const range = getFinalChartRange(points);
  const width = 340;
  const height = 126;
  const latest = points.at(-1) ?? points[0];
  const series: Array<{ key: "jonah" | "eli" | "ruth"; label: string }> = [
    { key: "jonah", label: "Jonah" },
    { key: "eli", label: "Eli" },
    { key: "ruth", label: "Ruth" },
  ];

  return (
    <section className="storybook-final-chart wealth" aria-label="Portfolio value by headline move">
      <header>
        <span>Portfolio Path</span>
        <strong>{formatCountNoun(points.length - 1, "committed move")}</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Line chart comparing Jonah, Eli, and Ruth by committed headline move">
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.25} H ${width}`} />
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.75} H ${width}`} />
        {series.map((item) => (
          <path
            key={item.key}
            className={`storybook-final-line ${item.key}`}
            d={buildFinalPerformancePath(game, points, item.key, range, width, height)}
          />
        ))}
        {points.map((point) => {
          const x = getFinalChartX(game, point.date, width);
          return (
            <g key={`${point.date}-${point.label}`}>
              {series.map((item) => (
                <circle
                  key={item.key}
                  className={`storybook-final-dot ${item.key}`}
                  cx={x.toFixed(2)}
                  cy={getFinalChartY(point[item.key], range, height).toFixed(2)}
                  r={point === latest ? 3.4 : 2.2}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <footer>
        {series.map((item) => (
          <span key={item.key} className={item.key}>
            <i aria-hidden="true" />
            {item.label} {formatMoney(latest[item.key])}
          </span>
        ))}
      </footer>
    </section>
  );
}

function FinalMoveImpactChart({ game }: { game: HeadlineMarketState }) {
  const width = 340;
  const height = 96;
  const zeroY = height / 2;
  const maxMove = Math.max(1, ...game.results.map((result) => Math.abs(result.profit)));
  const barGap = game.results.length > 90 ? 0.6 : 1.4;
  const barWidth = Math.max(1, width / Math.max(1, game.results.length) - barGap);
  const bestMove = game.results.reduce<HeadlineMarketResult | null>(
    (best, result) => (!best || result.profit > best.profit ? result : best),
    null,
  );
  const worstMove = game.results.reduce<HeadlineMarketResult | null>(
    (worst, result) => (!worst || result.profit < worst.profit ? result : worst),
    null,
  );
  const weakestMoveLabel = worstMove && worstMove.profit < 0 ? "Worst" : "Smallest";

  return (
    <section className="storybook-final-chart moves" aria-label="Jonah move impact by committed headline">
      <header>
        <span>Move Impact</span>
        <strong>Gain/loss after each jump</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart showing Jonah's gain or loss after each committed headline move">
        <path className="storybook-final-zero-line" d={`M 0 ${zeroY} H ${width}`} />
        {game.results.map((result, index) => {
          const magnitude = (Math.abs(result.profit) / maxMove) * (height * 0.44);
          const x = (index / Math.max(1, game.results.length - 1)) * (width - barWidth);
          const y = result.profit >= 0 ? zeroY - magnitude : zeroY;
          return (
            <rect
              key={`${result.targetDate}-${index}`}
              className={`storybook-final-move-bar ${result.profit >= 0 ? "positive" : "negative"}`}
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              width={barWidth.toFixed(2)}
              height={Math.max(1, magnitude).toFixed(2)}
              rx="1.5"
            />
          );
        })}
      </svg>
      <footer>
        <span className={bestMove && bestMove.profit < 0 ? "negative" : "positive"}>Best {bestMove ? formatMoneyDelta(bestMove.profit) : "$0"}</span>
        <span className={worstMove && worstMove.profit < 0 ? "negative" : "positive"}>
          {weakestMoveLabel} {worstMove ? formatMoneyDelta(worstMove.profit) : "$0"}
        </span>
      </footer>
    </section>
  );
}

function FinalLeaderboardOverlay({
  game,
  onClose,
  onSubmitted,
  submittedEntry,
}: {
  game: HeadlineMarketState;
  onClose: () => void;
  onSubmitted: (entry: LeaderboardEntry) => void;
  submittedEntry: LeaderboardEntry | null;
}) {
  const [entries, setEntries] = useState(() => loadLeaderboardEntries());
  const [playerName, setPlayerName] = useState("");
  const [formMessage, setFormMessage] = useState(submittedEntry ? "Score posted to this device." : "");
  const [serverLeaderboardAvailable, setServerLeaderboardAvailable] = useState(false);
  const [postingScore, setPostingScore] = useState(false);
  const previewEntry = submittedEntry ?? getLeaderboardPreviewEntry(game);
  const rows = getLeaderboardRows(game, entries, previewEntry);
  const previewRank = rows.findIndex((row) => row.id === previewEntry.id || (submittedEntry && row.id === submittedEntry.id)) + 1;

  useEffect(() => {
    let cancelled = false;

    fetchLeaderboardEntries()
      .then((serverEntries) => {
        if (!cancelled && serverEntries) {
          setEntries(serverEntries);
          setServerLeaderboardAvailable(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerLeaderboardAvailable(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const submitScore = async (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = sanitizeLeaderboardName(playerName);
    const nameError = getLeaderboardNameError(cleanName);

    if (submittedEntry) {
      setFormMessage("This run is already posted.");
      return;
    }
    if (nameError) {
      setFormMessage(nameError);
      return;
    }

    const entry = createLeaderboardEntry(game, cleanName);
    setPostingScore(true);
    try {
      if (serverLeaderboardAvailable) {
        const serverEntry = await postLeaderboardEntry(entry);
        const serverEntries = await fetchLeaderboardEntries();
        setEntries(serverEntries ?? [serverEntry, ...entries]);
        onSubmitted(serverEntry);
        setFormMessage("Posted to this week's public board.");
      } else {
        const nextEntries = addLeaderboardEntry(entry);
        setEntries(nextEntries);
        onSubmitted(entry);
        setFormMessage("Posted on this device.");
      }
      trackGameEvent("headline_market_score_submit", {
        score: entry.score,
        returnPercent: entry.returnPercent,
        moves: entry.moves,
      });
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Score posting failed. Try again.");
    } finally {
      setPostingScore(false);
    }
  };

  return (
    <div className="storybook-overlay leaderboard-overlay" role="dialog" aria-modal="true" aria-label="Front Page Fortune high scores">
      <section className="storybook-leaderboard-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close high scores">
          <Minimize2 size={16} />
          Close
        </button>
        <header className="storybook-leaderboard-head">
          <p className="eyebrow">Front Page Fortune</p>
          <h2>High Scores</h2>
          <span>Your run ranks #{Math.max(1, previewRank)} against this week's players and family benchmarks.</span>
        </header>

        <section className="storybook-leaderboard-submit" aria-label="Post your score">
          <div>
            <span>Post your score</span>
            <strong>{formatMoney(game.bankroll)}</strong>
            <em>{formatPercent(getStartingGain(game.bankroll))} over 20 years</em>
          </div>
          <form
            onSubmit={submitScore}
          >
            <label>
              <span>Name</span>
              <input
                type="text"
                autoComplete="name"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Your name"
                disabled={Boolean(submittedEntry)}
                maxLength={24}
              />
            </label>
            <button className="primary-action legacy-primary" type="submit" disabled={Boolean(submittedEntry) || postingScore}>
              <Send size={16} />
              {submittedEntry ? "Score Posted" : postingScore ? "Posting..." : "Post Score"}
            </button>
          </form>
          <p>
            {formMessage ||
              (serverLeaderboardAvailable
                ? "No login needed. Clean display names only; the board starts fresh weekly."
                : "Standalone scores are stored on this device.")}
          </p>
        </section>

        <section className="storybook-leaderboard-list" aria-label="Leaderboard rankings">
          {rows.map((row, index) => (
            <article key={row.id} className={`${row.kind} ${row.highlighted ? "highlighted" : ""}`}>
              <span>#{index + 1}</span>
              <div>
                <strong>{row.label}</strong>
                <em>{row.detail}</em>
              </div>
              <b>{formatMoney(row.score)}</b>
              <small>{formatPercent(row.returnPercent)}{row.submittedAt ? ` · ${formatDateLong(row.submittedAt.slice(0, 10))}` : ""}</small>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}

function FinalScreen({ game, onRestart }: { game: HeadlineMarketState; onRestart: () => void }) {
  const [finalJournalOpen, setFinalJournalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<LeaderboardEntry | null>(null);
  const finalGain = (game.bankroll / startingBankroll - 1) * 100;
  const brotherGain = (game.brotherBankroll / startingBankroll - 1) * 100;
  const sisterGain = (game.sisterBankroll / startingBankroll - 1) * 100;
  const totalTaxPaid = game.results.reduce((total, result) => total + result.taxPenalty, 0);
  const performancePoints = getFinalPerformancePoints(game);
  const profitableMoves = game.results.filter((result) => result.profit >= 0).length;
  const reallocatedMoves = game.results.filter((result) => result.isReallocation).length;
  const benchmarks = calculateBenchmarkFinals(game.timeline);
  const perfectTimingGain = (benchmarks.perfectNewspaperTiming / startingBankroll - 1) * 100;

  return (
    <main className="app-shell legacy-shell storybook-shell final">
      <section className="storybook-final-book last-edition">
        <header className="storybook-final-head">
          <p className="storybook-game-title">Front Page Fortune</p>
          <p className="eyebrow">Twenty Years Later · {formatDateLong(game.timeline.periodEndDate)}</p>
          <h1>The Last Edition</h1>
          <span>{getFinalRank(game)}</span>
        </header>

        <section className="storybook-final-scoreboard" aria-label="Final strategy comparison">
          <article className="storybook-final-player-score">
            <span>Jonah's final ledger</span>
            <strong>{formatMoney(game.bankroll)}</strong>
            <em>{formatPercent(finalGain)} after {formatMoney(totalTaxPaid)} in capital gains tax</em>
          </article>
          <div className="storybook-final-rivals">
            <article>
              <span>Eli's index fund</span>
              <strong>{formatMoney(game.brotherBankroll)}</strong>
              <em>{formatPercent(brotherGain)} buy-and-hold S&amp;P 500</em>
              <small className={game.bankroll >= game.brotherBankroll ? "positive" : "negative"}>
                {getPlayerStrategyGap(game.bankroll, game.brotherBankroll, "Eli")}
              </small>
            </article>
            <article>
              <span>Ruth's jewelry box</span>
              <strong>{formatMoney(game.sisterBankroll)}</strong>
              <em>{formatPercent(sisterGain)} tracked to gold</em>
              <small className={game.bankroll >= game.sisterBankroll ? "positive" : "negative"}>
                {getPlayerStrategyGap(game.bankroll, game.sisterBankroll, "Ruth")}
              </small>
            </article>
            <article>
              <span>Perfect tape</span>
              <strong>{formatMoney(benchmarks.perfectNewspaperTiming)}</strong>
              <em>{formatPercent(perfectTimingGain)} best allocation each jump</em>
              <small className={game.bankroll >= benchmarks.perfectNewspaperTiming ? "positive" : "negative"}>
                {getPlayerStrategyGap(game.bankroll, benchmarks.perfectNewspaperTiming, "Perfect tape")}
              </small>
            </article>
          </div>
        </section>

        <section className="storybook-final-analytics" aria-label="Final performance charts">
          <FinalPerformanceChart game={game} points={performancePoints} />
          <FinalMoveImpactChart game={game} />
        </section>

        <section className="storybook-final-metrics" aria-label="Performance metrics">
          <article>
            <span>Moves made</span>
            <strong>{game.results.length}</strong>
            <em>{formatCountNoun(reallocatedMoves, "reallocation")}</em>
          </article>
          <article>
            <span>Winning moves</span>
            <strong>{profitableMoves}</strong>
            <em>{formatPercent(game.results.length > 0 ? (profitableMoves / game.results.length) * 100 : 0).replace("+", "")}</em>
          </article>
          <article>
            <span>Capital gains tax</span>
            <strong>{formatMoney(totalTaxPaid)}</strong>
            <em>{formatPercent(totalTaxPaid > 0 ? (totalTaxPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
        </section>

        <div className="storybook-final-actions">
          <button className="primary-action legacy-primary" type="button" onClick={() => setFinalJournalOpen(true)}>
            <BookOpen size={18} />
            Read Final Journal Entry
          </button>
          <button className="secondary-action" type="button" onClick={() => setLeaderboardOpen(true)}>
            <Trophy size={18} />
            High Scores
          </button>
          <a className="primary-action legacy-primary" href="/games/harvest-ledger">
            Play Next: Harvest Ledger
            <ChevronRight size={18} />
          </a>
          <button className="secondary-action" type="button" onClick={onRestart}>
            <RotateCcw size={18} />
            Play It Again
          </button>
          <a className="secondary-action" href="/games">
            <Home size={18} />
            Back to Games
          </a>
        </div>

        <section className="storybook-final-overview">
          <div>
            <BookOpen size={18} />
            <span>Story recap</span>
          </div>
          <figure className="storybook-final-scene-art">
            <img
              src={assetUrl("jonah-last-edition-final-scene.png")}
              alt="Cartoon depiction of Grandpa pushing Jonah away from a falling tree inside The Sentinel during the final storm."
            />
          </figure>
          <p>
            Jonah began with {formatMoney(startingBankroll)}, Grandpa's gold Rolex, a leather briefcase, and a stack of impossible Sentinel front pages. Eli
            stayed in the S&amp;P 500, Ruth bought gold jewelry, Nora put her inheritance into a first home, and Max spent like life had a
            return policy. Jonah used the future dates quietly while twenty real years kept happening around him: the shop,
            Lena and Omar, Mom's memory, family dinners, town repairs, bad weather, and clues pointing back to the Sentinel.
          </p>
          <p>
            By the final page, the briefcase is quiet and the town newspaper calls about water in the archives. The missing brass-corner pages,
            the frozen clock, the Rolex stopped at 3:17, and Grandpa's old accident all lead Jonah back to the press building for one last answer.
          </p>
        </section>
      </section>
      {finalJournalOpen && <FinalJournalOverlay onClose={() => setFinalJournalOpen(false)} />}
      {leaderboardOpen && (
        <FinalLeaderboardOverlay
          game={game}
          onClose={() => setLeaderboardOpen(false)}
          onSubmitted={setSubmittedScore}
          submittedEntry={submittedScore}
        />
      )}
      <footer className="disclaimer">{educationalDisclaimer} Historical index returns are not predictions.</footer>
    </main>
  );
}

export function HeadlineMarketGame() {
  const [game, setGame] = useState(() => createHeadlineMarket(defaultSeed));
  const [introPage, setIntroPage] = useState<IntroPage>("setup");
  const [chaptersOpen, setChaptersOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [timeReel, setTimeReel] = useState<TimeReelTransition | null>(null);
  const [introTransition, setIntroTransition] = useState<IntroTransition>("none");
  const [dashboardGuideOpen, setDashboardGuideOpen] = useState(false);
  const [dashboardGuideSeen, setDashboardGuideSeen] = useState(false);
  const timeReelTimerRef = useRef<number | null>(null);
  const previousFrontPageIndexRef = useRef<number | null>(null);
  const [frontPageFlipToken, setFrontPageFlipToken] = useState(0);

  const currentEvent = game.events[game.roundIndex];
  const lastResult = game.results.at(-1);
  const roundLabel = `${Math.min(game.roundIndex + 1, game.events.length)} / ${game.events.length}`;
  const arrivalResult = game.phase === "choose" && lastResult?.targetIndex === game.roundIndex ? lastResult : null;
  const selectedFrontPageIndex = game.phase === "choose" ? game.selectedTargetIndex : game.roundIndex;
  const selectedFrontPageTarget = getTargetMarketPoint(game, selectedFrontPageIndex);
  const selectedFrontPageEvent = getEventAt(game, selectedFrontPageIndex);
  const selectedFrontPage = {
    date: selectedFrontPageTarget.date,
    deck: selectedFrontPageEvent?.deck ?? finalChapterDeck,
    era: selectedFrontPageEvent?.era ?? "Final Page",
    headline: selectedFrontPageEvent?.headline ?? finalChapterHeadline,
    isFinal: selectedFrontPageTarget.isFinal,
    major: selectedFrontPageEvent?.major ?? false,
    previewParagraph: getHeadlinePreviewParagraph(selectedFrontPageEvent, selectedFrontPageTarget.isFinal),
  };
  const showArrivalSummary = Boolean(arrivalResult && selectedFrontPageIndex === game.roundIndex);
  const dashboardBalance = getPositionTotal(game.currentPositions);
  const dashboardGain = dashboardBalance - startingBankroll;
  const dashboardGainPercent = (dashboardGain / startingBankroll) * 100;
  const dashboardPerformanceTone = dashboardGain > 0 ? "positive" : dashboardGain < 0 ? "negative" : "neutral";
  const dashboardAllocationSummary = getAllocationSummary(game.currentPositions);

  useEffect(() => {
    if (previousFrontPageIndexRef.current === null) {
      previousFrontPageIndexRef.current = selectedFrontPageIndex;
      return;
    }

    if (previousFrontPageIndexRef.current !== selectedFrontPageIndex) {
      previousFrontPageIndexRef.current = selectedFrontPageIndex;
      setFrontPageFlipToken((current) => current + 1);
    }
  }, [selectedFrontPageIndex]);

  const clearTimeReelTimer = () => {
    if (timeReelTimerRef.current !== null) {
      window.clearTimeout(timeReelTimerRef.current);
      timeReelTimerRef.current = null;
    }
  };

  useEffect(() => () => clearTimeReelTimer(), []);

  const restart = () => {
    clearTimeReelTimer();
    const fresh = createHeadlineMarket(defaultSeed);
    setGame(fresh);
    setIntroPage("setup");
    setChaptersOpen(false);
    setJournalOpen(false);
    setLedgerOpen(false);
    setPreviewIndex(null);
    setConfirmIndex(null);
    setTimeReel(null);
    setIntroTransition("none");
    setDashboardGuideOpen(false);
    setDashboardGuideSeen(false);
    trackGameEvent("headline_market_reset", { timeline: fresh.timeline.id });
  };

  const begin = () => {
    const fresh = startHeadlineMarket(game);
    setGame(fresh);
    setPreviewIndex(null);
    setConfirmIndex(null);
    setTimeReel(null);
    setIntroTransition("none");
    if (!dashboardGuideSeen) {
      setDashboardGuideOpen(true);
      setDashboardGuideSeen(true);
    }
    trackGameEvent("headline_market_start", { timeline: fresh.timeline.id });
  };

  const turnIntroPage = () => {
    if (introTransition !== "none") {
      return;
    }
    setIntroTransition("page");
    window.setTimeout(() => {
      setIntroPage("rules");
      setIntroTransition("none");
    }, 940);
  };

  const openBriefcase = () => {
    if (introTransition !== "none") {
      return;
    }
    setIntroTransition("briefcase");
    window.setTimeout(() => begin(), 1040);
  };

  const updateDefaultSp = (value: number) => setGame((current) => setDefaultPosition(current, { defaultSpPercent: value }));
  const updateDefaultGold = (value: number) => setGame((current) => setDefaultPosition(current, { defaultGoldPercent: value }));
  const chooseAsset = (value: AssetChoice) => setGame((current) => setAssetChoice(current, value));
  const selectTargetDate = (targetIndex: number) => {
    setGame((current) => {
      if (current.phase !== "choose") {
        return current;
      }
      return setTargetIndex(current, targetIndex);
    });
  };
  const openChapters = () => {
    setChaptersOpen(true);
  };
  const closeChapters = () => {
    setChaptersOpen(false);
  };

  const requestJump = (targetIndex: number) => {
    const activeIndex = game.phase === "reveal" ? (game.results.at(-1)?.targetIndex ?? game.roundIndex) : game.roundIndex;
    if ((game.phase !== "choose" && game.phase !== "reveal") || targetIndex <= activeIndex) {
      return;
    }
    setGame((current) => {
      const ready = current.phase === "reveal" ? nextHeadlineRound(current) : current;
      if (ready.phase !== "choose") {
        return current;
      }
      return setTargetIndex(ready, targetIndex);
    });
    setConfirmIndex(targetIndex);
  };

  const commitJump = (targetIndex: number) => {
    if (game.phase !== "choose" || timeReel) {
      return;
    }
    if (targetIndex <= game.roundIndex || targetIndex > game.events.length) {
      return;
    }

    const prepared = setTargetIndex(game, targetIndex);
    const resolved = resolveHeadlineRound(prepared);
    const result = resolved.results.at(-1);
    if (!result) {
      return;
    }
    const advanced = nextHeadlineRound(resolved);

    trackGameEvent("headline_market_reveal", {
      timeline: resolved.timeline.id,
      round: resolved.roundIndex + 1,
      targetDate: result.targetDate,
      assetChoice: result.assetChoice,
      returnPercent: result.assetReturn,
      bankroll: Math.round(resolved.bankroll),
    });
    trackGameEvent(advanced.phase === "complete" ? "headline_market_complete" : "headline_market_next_round", {
      timeline: advanced.timeline.id,
      round: advanced.roundIndex + 1,
      bankroll: Math.round(advanced.bankroll),
    });

    clearTimeReelTimer();
    setTimeReel(createTimeReelTransition(prepared, targetIndex, result));
    setChaptersOpen(false);
    setPreviewIndex(null);
    setConfirmIndex(null);
    timeReelTimerRef.current = window.setTimeout(() => {
      setGame(advanced);
      setTimeReel(null);
      timeReelTimerRef.current = null;
    }, timeReelDurationMs);
  };

  const advanceSelectedDate = () => {
    commitJump(game.selectedTargetIndex);
  };

  const confirmJump = () => {
    if (confirmIndex === null) {
      return;
    }

    commitJump(confirmIndex);
  };

  const advance = () => {
    setGame((current) => {
      const next = nextHeadlineRound(current);
      trackGameEvent(next.phase === "complete" ? "headline_market_complete" : "headline_market_next_round", {
        timeline: next.timeline.id,
        round: next.roundIndex + 1,
        bankroll: Math.round(next.bankroll),
      });
      return next;
    });
  };

  if (game.phase === "start") {
    return (
      <StorybookStart
        game={game}
        introPage={introPage}
        introTransition={introTransition}
        onTurnPage={turnIntroPage}
        onBegin={openBriefcase}
        onDefaultSp={updateDefaultSp}
        onDefaultGold={updateDefaultGold}
      />
    );
  }

  if (game.phase === "complete") {
    return <FinalScreen game={game} onRestart={restart} />;
  }

  return (
    <main className={`app-shell legacy-shell storybook-shell storybook-play-shell ${game.phase}`}>
      <section className={`storybook-play-book ${game.phase === "choose" ? "dashboard-book" : ""}`}>
        <header className="storybook-play-head">
          <div className="storybook-top-portfolio" data-guide-target="portfolio-status">
            <span>Page {roundLabel} · {formatDateLong(currentEvent.date)}</span>
            <strong>{formatMoney(dashboardBalance)}</strong>
            <em className={`storybook-top-performance ${dashboardPerformanceTone}`}>
              {formatMoneyDelta(dashboardGain)} / {formatPercent(dashboardGainPercent)}
            </em>
            <small>{dashboardAllocationSummary}</small>
          </div>
          <button className="icon-reset secondary-action compact" type="button" onClick={restart} aria-label="Reset Front Page Fortune" data-guide-target="reset">
            <RotateCcw size={15} />
          </button>
        </header>

        {game.phase !== "choose" && <StoryProgressRail game={game} />}

        {game.phase === "choose" && (
          <div className="storybook-one-screen dashboard-clean">
            <HeadlineRolodexSelector
              game={game}
              onAdvance={advanceSelectedDate}
              onChooseAsset={chooseAsset}
              onOpenChapters={openChapters}
              onSelectTarget={selectTargetDate}
            />
            <article
              key={`selected-front-page-${frontPageFlipToken}`}
              className={`storybook-current-page with-headline-image ${frontPageFlipToken > 0 ? "is-flipping" : ""}`}
              data-guide-target="selected-front-page-article"
            >
              <div className={`storybook-current-copy${showArrivalSummary ? " has-arrival" : ""}`}>
                <div className="storybook-masthead mini">
                  <span>{selectedFrontPage.era}</span>
                  <b>{selectedFrontPage.major ? "Ultra Significant" : selectedFrontPage.isFinal ? "Final Page" : "Selected Front Page"}</b>
                </div>
                <h1>
                  <button
                    className="storybook-front-page-link"
                    type="button"
                    onClick={() => setPreviewIndex(selectedFrontPageIndex)}
                    data-guide-target="front-page"
                    aria-label={`Read front page: ${selectedFrontPage.headline}`}
                  >
                    {selectedFrontPage.headline}
                  </button>
                </h1>
                <div className="storybook-front-page-date-line">{formatDateWithWeekday(selectedFrontPage.date)}</div>
                <HeadlineEventImage event={selectedFrontPageEvent} variant="preview" />
                {showArrivalSummary && arrivalResult && (
                  <div className={`storybook-arrival-summary ${resultTone(arrivalResult)}`}>
                    <span>Previous move</span>
                    <strong>{getArrivalSummary(arrivalResult)}</strong>
                  </div>
                )}
                <p>{selectedFrontPage.previewParagraph}</p>
              </div>
            </article>
          </div>
        )}

        {game.phase === "reveal" && lastResult && (
          <div className="storybook-one-screen reveal">
            <article className={`storybook-result-page ${resultTone(lastResult)}`}>
              <p className="eyebrow">Chapter Result</p>
              <h1>{formatPercent(lastResult.assetReturn)}</h1>
              <p>
                {formatDateLong(lastResult.event.date)} to {formatDateLong(lastResult.targetDate)} with {assetLabels[lastResult.assetChoice]}.
              </p>
              <div className="storybook-result-grid">
                <div>
                  <span>Jonah</span>
                  <strong>{formatMoney(lastResult.endingBankroll)}</strong>
                </div>
                <div>
                  <span>Capital gains tax</span>
                  <strong>{formatMoney(lastResult.taxPenalty)}</strong>
                </div>
              </div>
              <p className="storybook-lesson"><strong>{getTimingRead(lastResult)}:</strong> {lastResult.event.lesson}</p>
            </article>
            <aside className="storybook-command-page reveal-actions">
              <PortfolioLedger compact title={`Positions on ${formatDateLong(lastResult.targetDate)}`} positions={lastResult.endingPositions} />
              <button className="primary-action legacy-primary storybook-advance" type="button" onClick={advance}>
                {lastResult.targetIsFinal ? "Close the Briefcase" : `Turn to ${formatDateLong(lastResult.targetDate)}`}
                <ChevronRight size={18} />
              </button>
              <button className="secondary-action" type="button" onClick={() => setJournalOpen(true)}>
                <BookOpen size={16} />
                Journal Entry
              </button>
              <button className="secondary-action" type="button" onClick={() => setLedgerOpen(true)}>
                <BarChart3 size={16} />
                Ledger
              </button>
            </aside>
          </div>
        )}

        <nav className="storybook-bottom-tabs" aria-label="Game and story pages" data-guide-target="bottom-tabs">
          <button type="button" onClick={() => setJournalOpen(true)} data-guide-target="journal">
            <BookOpen size={15} />
            Journal
          </button>
          <button type="button" onClick={() => setLedgerOpen(true)} data-guide-target="ledger-button">
            <WalletCards size={15} />
            Ledger
          </button>
          <button type="button" onClick={() => setPreviewIndex(game.roundIndex)} data-guide-target="current-page-button">
            <Newspaper size={15} />
            Current Page
          </button>
        </nav>
      </section>

      {timeReel && <TimeReelTransitionOverlay transition={timeReel} />}
      {dashboardGuideOpen && <DashboardGuideOverlay onStart={() => setDashboardGuideOpen(false)} />}
      {chaptersOpen && <ChapterDrawer game={game} onClose={closeChapters} onRead={setPreviewIndex} onJump={requestJump} />}
      {journalOpen && <JournalOverlay game={game} onClose={() => setJournalOpen(false)} />}
      {ledgerOpen && <LedgerOverlay game={game} onClose={() => setLedgerOpen(false)} />}
      {previewIndex !== null && <NewspaperOverlay game={game} previewIndex={previewIndex} onClose={() => setPreviewIndex(null)} onJump={requestJump} />}
      {confirmIndex !== null && (
        <ConfirmJumpDialog
          game={game}
          targetIndex={confirmIndex}
          onChooseAsset={chooseAsset}
          onCancel={() => setConfirmIndex(null)}
          onConfirm={confirmJump}
        />
      )}
    </main>
  );
}
