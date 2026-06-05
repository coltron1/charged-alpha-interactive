import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  ChevronDown,
  Home,
  Landmark,
  Minimize2,
  Newspaper,
  Play,
  ReceiptText,
  RotateCcw,
  Tractor,
  Trophy,
  WalletCards,
  Warehouse,
  X,
} from "lucide-react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  SVGProps,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useEffect, useRef, useState } from "react";
import {
  HighScoreToBeatBanner,
  InvestmentLeaderboardOverlay,
  ResultsMoveImpactChart,
  ResultsPerformanceChart,
  type LeaderboardSubmittedEntry,
  type ResultsChartPoint,
} from "../../shared/game-ui/InvestmentResults";
import { assetUrl } from "../../shared/assets";
import { TargetGuideOverlay } from "../../shared/game-ui/TargetGuideOverlay";
import {
  buildInterpolatedTimeJumpPoints,
  TimeJumpTransitionOverlay,
  timeJumpTransitionDurationMs,
  type TimeJumpEntry,
  type TimeJumpTransitionModel,
} from "../../shared/game-ui/TimeJumpTransition";
import { HeadlineEventImage } from "../headline-market/components/HeadlineEventImage";
import {
  calculateFuturesOutcome,
  createFuturesFortune,
  formatFuturesMoney,
  formatFuturesPercent,
  formatFuturesSpan,
  getCurrentFuturesEvent,
  getProgressPercent,
  getProjectedOutcomes,
  getSelectedFuturesTarget,
  isMarketVisionUnlocked,
  futuresChoiceLabels,
  futuresChoiceOrder,
  futuresChoiceShortLabels,
  futuresContractBushels,
  futuresEndDate,
  futuresStartDate,
  playFuturesRound,
  resetFuturesFortune,
  setFuturesChoice,
  setFuturesTargetIndex,
  startFuturesFortune,
  startingBankroll,
  type FuturesChoice,
  type FuturesOutcome,
  type FuturesFortuneState,
  type FuturesResult,
  type FuturesTarget,
} from "./simulation/futuresFortune";
import {
  futuresChronicleName,
  futuresCompactDashboardGuideItems,
  futuresDashboardGuideItems,
  futuresPrologueDate,
  futuresStory,
} from "./content/futuresCopy";
import type { FuturesContractChoice, FuturesHeadlineEvent } from "./content/futuresHeadlines";

type Overlay = "journal" | "ledger" | "article" | "index" | null;
type FuturesMathTone = "gain" | "loss" | "flat";
type FuturesMathRow = {
  detail: string;
  label: string;
  marker: string;
  value: string;
};

type GrainIconProps = SVGProps<SVGSVGElement> & { size?: number };
type GrainIcon = (props: GrainIconProps) => ReactNode;

function CornIcon({ size = 16, ...props }: GrainIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <path d="M12 21c4-4 5-8 3.7-12.2C14.9 6.1 13.4 4 12 3c-1.4 1-2.9 3.1-3.7 5.8C7 13 8 17 12 21Z" />
      <path d="M8.6 10.2c2.2.6 4.6.6 6.8 0M8.4 13.5c2.3.7 4.9.7 7.2 0M9.7 16.6c1.5.4 3.1.4 4.6 0" />
      <path d="M7 12.2C4.8 10.6 4 8.3 4 6.2c2.7.5 4.4 2.3 4.9 5.2M17 12.2c2.2-1.6 3-3.9 3-6-2.7.5-4.4 2.3-4.9 5.2" />
    </svg>
  );
}

function SoybeanIcon({ size = 16, ...props }: GrainIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <path d="M6.2 18.2c3.2.9 7.1-.1 10-3s3.9-6.8 3-10c-3.2-.9-7.1.1-10 3s-3.9 6.8-3 10Z" />
      <path d="M8.2 16.2 17.1 7.3" />
      <circle cx="9.2" cy="14.8" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="14.8" cy="9.2" r="1.4" />
      <path d="M4 20c1.5-.4 2.8-1 4.2-2" />
    </svg>
  );
}

function WheatIcon({ size = 16, ...props }: GrainIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...props}>
      <path d="M12 21V4" />
      <path d="M12 7c-2.5 0-4-1.3-4.8-3.2C9.6 3.8 11.1 5.1 12 7ZM12 10.5c-2.5 0-4-1.3-4.8-3.2 2.4 0 3.9 1.3 4.8 3.2ZM12 14c-2.5 0-4-1.3-4.8-3.2 2.4 0 3.9 1.3 4.8 3.2Z" />
      <path d="M12 7c2.5 0 4-1.3 4.8-3.2C14.4 3.8 12.9 5.1 12 7ZM12 10.5c2.5 0 4-1.3 4.8-3.2-2.4 0-3.9 1.3-4.8 3.2ZM12 14c2.5 0 4-1.3 4.8-3.2-2.4 0-3.9 1.3-4.8 3.2Z" />
    </svg>
  );
}

const futuresIcons: Record<FuturesChoice, GrainIcon> = {
  bills: Landmark,
  corn: CornIcon,
  soybeans: SoybeanIcon,
  wheat: WheatIcon,
};

const futuresFlowStops: Array<{ id: FuturesChoice | "tax"; label: string; tone: string; icon?: GrainIcon }> = [
  { id: "bills", label: "T-Bills", tone: "cash", icon: Landmark },
  { id: "corn", label: "Corn", tone: "sp500", icon: CornIcon },
  { id: "soybeans", label: "Soy", tone: "gold", icon: SoybeanIcon },
  { id: "wheat", label: "Wheat", tone: "custom", icon: WheatIcon },
  { id: "tax", label: "Tax", tone: "tax" },
];

// Flip to false to restore the previous five-scroll allocation-flow banner.
const useExperimentalFuturesAllocationScroll = true;

const futuresContractRuleSummary =
  "Contract rule: each crop trade buys as many whole CBOT-style grain futures contracts as Riley can afford on the current headline date, then cash-settles on the future headline date you choose. Real corn, soybean, and wheat contracts represent 5,000 bushels; dollars that cannot buy another full contract automatically stay in Treasury bills. If a time jump crosses a standard contract expiration, the game re-ups into the next listed contract month and uses continuous futures prices as the rolled-position proxy.";

const futuresProductCodes: Record<FuturesContractChoice, string> = {
  corn: "ZC",
  soybeans: "ZS",
  wheat: "ZW",
};

const futuresContractMonthSpecs: Record<FuturesContractChoice, Array<{ code: string; label: string; month: number }>> = {
  corn: [
    { code: "H", label: "Mar", month: 3 },
    { code: "K", label: "May", month: 5 },
    { code: "N", label: "Jul", month: 7 },
    { code: "U", label: "Sep", month: 9 },
    { code: "Z", label: "Dec", month: 12 },
  ],
  soybeans: [
    { code: "F", label: "Jan", month: 1 },
    { code: "H", label: "Mar", month: 3 },
    { code: "K", label: "May", month: 5 },
    { code: "N", label: "Jul", month: 7 },
    { code: "Q", label: "Aug", month: 8 },
    { code: "U", label: "Sep", month: 9 },
    { code: "X", label: "Nov", month: 11 },
  ],
  wheat: [
    { code: "H", label: "Mar", month: 3 },
    { code: "K", label: "May", month: 5 },
    { code: "N", label: "Jul", month: 7 },
    { code: "U", label: "Sep", month: 9 },
    { code: "Z", label: "Dec", month: 12 },
  ],
};

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

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  return day !== 0 && day !== 6;
}

function getBusinessDayPriorToFifteenth(year: number, month: number) {
  let date = new Date(Date.UTC(year, month - 1, 15));
  do {
    date = addUtcDays(date, -1);
  } while (!isBusinessDay(date));
  return getIsoDate(date);
}

function getPreviewParagraph(event: FuturesHeadlineEvent | undefined, isFinal = false) {
  if (isFinal) {
    return "The final harvest arrives. Riley closes the grain ledger and compares every futures decision against the simple paths she could have taken instead.";
  }
  return event?.newspaperArticle?.lede ?? event?.summary ?? event?.setup ?? "A future headline reaches Riley's desk with just enough information to tempt a trade.";
}

function getTargetHeadline(target: FuturesTarget) {
  return target.isFinal ? "Final harvest: the futures tape is settled" : target.event?.headline ?? target.label;
}

function getTargetDeck(target: FuturesTarget) {
  return target.isFinal ? "The decade closes and every contract gain, futures loss, and tax bill comes due." : target.event?.deck ?? "Future headline";
}

function getTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getOutcomeHeat(outcome: FuturesOutcome, unlocked: boolean) {
  if (!unlocked) {
    return { className: "market-heat-neutral", alpha: 0 };
  }
  const returnPercent = (outcome.endingBankroll / outcome.startingBankroll - 1) * 100;
  if (Math.abs(returnPercent) < 0.75) {
    return { className: "market-heat-neutral", alpha: 0 };
  }
  return {
    className: returnPercent > 0 ? "market-heat-hot" : "market-heat-cold",
    alpha: Math.min(0.52, 0.1 + Math.min(Math.abs(returnPercent), 60) / 130),
  };
}

function getFuturesFlowPosition(choice: FuturesChoice | "tax") {
  const index = futuresFlowStops.findIndex((stop) => stop.id === choice);
  if (index < 0 || futuresFlowStops.length === 0) {
    return 0;
  }
  if (index === 0) {
    return 12;
  }
  if (index === futuresFlowStops.length - 1) {
    return 88;
  }
  return ((index + 0.5) / futuresFlowStops.length) * 100;
}

function getFuturesContractTermShortLabel(startDate: string, endDate: string) {
  return `Term: ${formatFuturesSpan(startDate, endDate)}`;
}

function getPreviousFuturesChoice(game: FuturesFortuneState): FuturesChoice {
  return game.results.at(-1)?.choice ?? "bills";
}

function chooseNearestTargetIndex(game: FuturesFortuneState, progressPercent: number) {
  const minimum = game.currentIndex + 1;
  const raw = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * game.events.length);
  return Math.max(minimum, Math.min(game.events.length, raw));
}

function buildFuturesSparkline(results: FuturesResult[], currentValue: number) {
  const values = [startingBankroll, ...results.map((result) => result.endingBankroll), currentValue];
  const uniqueValues = values.filter((_, index) => index === 0 || index === values.length - 1 || index < values.length - 1);
  const min = Math.min(...uniqueValues);
  const max = Math.max(...uniqueValues);
  const width = 240;
  const height = 72;
  const range = Math.max(1, max - min);
  return uniqueValues
    .map((value, index) => {
      const x = uniqueValues.length <= 1 ? 0 : (index / (uniqueValues.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatFuturesMoneyDelta(value: number) {
  const absolute = formatFuturesMoney(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return "$0";
}

function formatFuturesMathTerm(value: number) {
  if (value < 0) {
    return `- ${formatFuturesMoney(Math.abs(value))}`;
  }
  return `+ ${formatFuturesMoney(value)}`;
}

function formatBushelPrice(centsPerBushel: number) {
  return `$${(centsPerBushel / 100).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}/bu`;
}

function formatRealContractValue(centsPerBushel: number) {
  return formatFuturesMoney((centsPerBushel / 100) * futuresContractBushels);
}

function formatFuturesContractCount(count: number) {
  return `${count} ${count === 1 ? "contract" : "contracts"}`;
}

function formatBushels(count: number) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "bushel" : "bushels"}`;
}

function formatFuturesMoneyCompact(value: number) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 1_000_000) {
    return `$${(rounded / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (Math.abs(rounded) >= 1_000) {
    return `$${Math.round(rounded / 1_000).toLocaleString("en-US")}k`;
  }
  return formatFuturesMoney(rounded);
}

function formatCompactBushels(count: number) {
  if (count >= 1000 && count % 1000 === 0) {
    return `${(count / 1000).toLocaleString("en-US")}k ${count === 1000 ? "bushel" : "bushels"}`;
  }
  return formatBushels(count);
}

function formatContractYear(year: number) {
  return String(year).slice(-2);
}

function formatFuturesContractCode(choice: FuturesContractChoice, monthCode: string, year: number) {
  return `${futuresProductCodes[choice]}${monthCode}${formatContractYear(year)}`;
}

function formatFuturesContractPlainName(choice: FuturesContractChoice, contract: { code: string; label: string }) {
  return `${contract.label} ${futuresChoiceShortLabels[choice]} Contract`;
}

function getFuturesContract(choice: FuturesContractChoice, year: number, month: number) {
  const spec = futuresContractMonthSpecs[choice].find((candidate) => candidate.month === month) ?? futuresContractMonthSpecs[choice][0];
  return {
    code: formatFuturesContractCode(choice, spec.code, year),
    label: `${spec.label} ${year}`,
    lastTradeDate: getBusinessDayPriorToFifteenth(year, spec.month),
    month: spec.month,
    monthCode: spec.code,
    year,
  };
}

function getNextFuturesContract(choice: FuturesContractChoice, afterDate: string) {
  const after = dateToUtcTime(afterDate);
  const startYear = new Date(`${afterDate}T00:00:00Z`).getUTCFullYear();

  for (let year = startYear; year <= startYear + 12; year += 1) {
    for (const spec of futuresContractMonthSpecs[choice]) {
      const contract = getFuturesContract(choice, year, spec.month);
      if (dateToUtcTime(contract.lastTradeDate) > after) {
        return contract;
      }
    }
  }

  return getFuturesContract(choice, startYear + 13, futuresContractMonthSpecs[choice][0].month);
}

function getFuturesRollSchedule(choice: FuturesChoice, startDate: string, endDate: string) {
  if (choice === "bills") {
    return {
      finalContract: null,
      initialContract: null,
      rolls: [] as Array<{ fromCode: string; rollDate: string; toCode: string }>,
    };
  }

  const rolls: Array<{ fromCode: string; rollDate: string; toCode: string }> = [];
  const end = dateToUtcTime(endDate);
  let active = getNextFuturesContract(choice, startDate);

  for (let guard = 0; guard < 80 && dateToUtcTime(active.lastTradeDate) < end; guard += 1) {
    const next = getNextFuturesContract(choice, active.lastTradeDate);
    rolls.push({
      fromCode: active.code,
      rollDate: active.lastTradeDate,
      toCode: next.code,
    });
    active = next;
  }

  return {
    finalContract: active,
    initialContract: getNextFuturesContract(choice, startDate),
    rolls,
  };
}

function getFuturesRollSummary(choice: FuturesChoice, startDate: string, endDate: string) {
  const schedule = getFuturesRollSchedule(choice, startDate, endDate);
  if (choice === "bills" || !schedule.initialContract || !schedule.finalContract) {
    return "No futures contract rolls.";
  }
  if (schedule.rolls.length === 0) {
    return `Opened ${schedule.initialContract.code}; no re-up before settlement.`;
  }

  const preview = schedule.rolls
    .slice(0, 3)
    .map((roll) => `${roll.fromCode}->${roll.toCode} on ${formatDateLong(roll.rollDate)}`)
    .join("; ");
  const extra = schedule.rolls.length > 3 ? `; plus ${schedule.rolls.length - 3} more` : "";
  return `Opened ${schedule.initialContract.code}; re-upped ${schedule.rolls.length} ${schedule.rolls.length === 1 ? "time" : "times"} (${preview}${extra}).`;
}

function getFuturesStartingGain(value: number) {
  return (value / startingBankroll - 1) * 100;
}

function getFuturesStrategyGap(playerValue: number, benchmarkValue: number, benchmarkName: string) {
  const gap = playerValue - benchmarkValue;
  if (gap >= 0) {
    return `${formatFuturesMoney(gap)} ahead of ${benchmarkName}`;
  }
  return `${formatFuturesMoney(Math.abs(gap))} behind ${benchmarkName}`;
}

function formatCountNoun(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getFuturesFinalRank(game: FuturesFortuneState) {
  if (game.bankroll >= game.perfectTape * 0.96) {
    return "Grain Whisperer";
  }
  if (game.bankroll >= game.cornBenchmark && game.bankroll >= game.soybeanBenchmark && game.bankroll >= game.wheatBenchmark) {
    return "Pit Beater";
  }
  if (game.bankroll >= startingBankroll) {
    return "Capital Preserved";
  }
  return "Contract Lesson";
}

function getFuturesPerformancePoints(game: FuturesFortuneState): ResultsChartPoint[] {
  const points: ResultsChartPoint[] = [
    {
      date: futuresStartDate,
      label: "Start",
      values: {
        riley: startingBankroll,
        corn: startingBankroll,
        soybeans: startingBankroll,
        wheat: startingBankroll,
      },
    },
  ];
  let cornBenchmark = startingBankroll;
  let soybeanBenchmark = startingBankroll;
  let wheatBenchmark = startingBankroll;

  game.results.forEach((result) => {
    const cornReturn = (result.target.prices.corn / result.event.futuresPrices.corn - 1) * 100;
    const soybeanReturn = (result.target.prices.soybeans / result.event.futuresPrices.soybeans - 1) * 100;
    const wheatReturn = (result.target.prices.wheat / result.event.futuresPrices.wheat - 1) * 100;
    cornBenchmark *= 1 + cornReturn / 100;
    soybeanBenchmark *= 1 + soybeanReturn / 100;
    wheatBenchmark *= 1 + wheatReturn / 100;
    points.push({
      date: result.target.date,
      label: result.target.label,
      values: {
        riley: result.endingBankroll,
        corn: cornBenchmark,
        soybeans: soybeanBenchmark,
        wheat: wheatBenchmark,
      },
    });
  });

  return points;
}

function getFuturesBestHindsightChoice(result: FuturesResult): FuturesChoice {
  return futuresChoiceOrder
    .map((choice) => calculateFuturesOutcome(result.startingBankroll, result.event, result.target, choice))
    .sort((a, b) => b.endingBankroll - a.endingBankroll)[0]?.choice ?? "bills";
}

function getFuturesChoiceCountSummary(results: FuturesResult[]) {
  const counts = futuresChoiceOrder
    .map((choice) => ({
      choice,
      count: results.filter((result) => result.choice === choice).length,
    }))
    .filter(({ count }) => count > 0);

  if (counts.length === 0) {
    return "No trades were placed.";
  }

  return counts.map(({ choice, count }) => `${futuresChoiceShortLabels[choice]} ${count}`).join(" / ");
}

function getFuturesRecommendedStrategy(game: FuturesFortuneState) {
  const hindsightCounts = futuresChoiceOrder.map((choice) => ({
    choice,
    count: game.results.filter((result) => getFuturesBestHindsightChoice(result) === choice).length,
  }));
  const bestPattern = hindsightCounts.sort((a, b) => b.count - a.count)[0] ?? { choice: "bills" as FuturesChoice, count: 0 };
  const topLabel = futuresChoiceLabels[bestPattern.choice];
  const total = Math.max(1, game.results.length);

  if (bestPattern.choice === "bills") {
    return {
      title: "Recommended strategy: patience first",
      text: `Treasury bills were the best hindsight choice in ${bestPattern.count} of ${total} jumps. A practical approach is to keep Treasury bills as the default, then only leave safety when a future headline clearly changes crop supply, export demand, or transportation. This may work because it avoids crop-contract losses and tax drag during noisy headlines while preserving capital for the rare clean setup.`,
    };
  }

  return {
    title: `Recommended strategy: selective ${futuresChoiceShortLabels[bestPattern.choice]}`,
    text: `${topLabel} was the best hindsight choice in ${bestPattern.count} of ${total} jumps, but the cleaner lesson is not to be permanently aggressive. Keep Treasury bills as the waiting room, then move into the crop contract when the headline directly affects that market. This may work because futures respond sharply to crop-specific shocks, while sitting out unclear windows reduces drawdowns, overtrading, and capital gains tax.`,
  };
}

function getFuturesFinalRecap(game: FuturesFortuneState) {
  const results = game.results;
  const gain = game.bankroll - startingBankroll;
  const gainPercent = getFuturesStartingGain(game.bankroll);
  const totalTaxPaid = results.reduce((total, result) => total + result.tax, 0);
  const winners = results.filter((result) => result.profit >= 0).length;
  const choiceSummary = getFuturesChoiceCountSummary(results);
  const sortedByProfit = [...results].sort((a, b) => b.profit - a.profit);
  const best = sortedByProfit[0];
  const worst = sortedByProfit.at(-1);
  const recommendation = getFuturesRecommendedStrategy(game);

  return {
    bestMove: best
      ? `Best jump: ${futuresChoiceLabels[best.choice]} from ${formatDateLong(best.event.date)} to ${formatDateLong(best.target.date)} added ${formatFuturesMoneyDelta(best.profit)}.`
      : "Best jump: none yet.",
    choiceSummary: `Riley made ${formatCountNoun(results.length, "time jump")} with this mix: ${choiceSummary}.`,
    impactSummary: `Net result: ${formatFuturesMoneyDelta(gain)} (${formatFuturesPercent(gainPercent)}) after ${formatFuturesMoney(totalTaxPaid)} in capital gains tax; ${winners} of ${results.length} jumps finished positive.`,
    recommendation,
    rulesSummary: "Contract terms used: each crop trade was modeled as whole, rolling, cash-settled futures contracts held from the current headline to the future headline selected by the player. Real grain contracts represent 5,000 bushels; Harvest Ledger buys as many full contracts as Riley can afford at the starting price, while leftover dollars earn Treasury bills.",
    worstMove: worst
      ? `${worst.profit < 0 ? "Costliest" : "Smallest"} jump: ${futuresChoiceLabels[worst.choice]} from ${formatDateLong(worst.event.date)} to ${formatDateLong(worst.target.date)} moved the account ${formatFuturesMoneyDelta(worst.profit)}.`
      : "Smallest jump: none yet.",
  };
}

function getFuturesBillsInterest(result: FuturesResult) {
  const cashBase = result.choice === "bills" ? result.startingBankroll : result.billsReserve;
  return cashBase * (result.billReturn / 100);
}

function getFuturesMathTone(result: FuturesResult): FuturesMathTone {
  const change = result.endingBankroll - result.startingBankroll;
  return change > 0 ? "gain" : change < 0 ? "loss" : "flat";
}

function getFuturesFinancialMathHeadline(result: FuturesResult) {
  const span = formatFuturesSpan(result.event.date, result.target.date);
  const grossProfit = result.grossEndingBankroll - result.startingBankroll;
  if (result.choice === "bills") {
    const interest = getFuturesBillsInterest(result);
    return `${span}: ${formatFuturesMoney(result.startingBankroll)} in Treasury bills + ${formatFuturesMoney(interest)} interest - ${formatFuturesMoney(result.tax)} tax = ${formatFuturesMoney(result.endingBankroll)}.`;
  }

  return `${span}: ${formatFuturesMoney(result.startingBankroll)} start, ${formatFuturesMoney(result.contractInvestment)} buys ${formatFuturesContractCount(result.contractCount)}, ${formatFuturesMoney(result.billsReserve)} waits in T-bills, ${formatFuturesMathTerm(result.futuresPnL)} futures P/L ${formatFuturesMathTerm(getFuturesBillsInterest(result))} T-bill interest - ${formatFuturesMoney(result.tax)} tax = ${formatFuturesMoney(result.endingBankroll)} (${formatFuturesMoneyDelta(grossProfit)} gross).`;
}

function getFuturesFinancialMathRows(result: FuturesResult): FuturesMathRow[] {
  const span = formatFuturesSpan(result.event.date, result.target.date);
  const interest = getFuturesBillsInterest(result);
  const grossProfit = result.grossEndingBankroll - result.startingBankroll;
  const rollSchedule = getFuturesRollSchedule(result.choice, result.event.date, result.target.date);

  if (result.choice === "bills") {
    return [
      {
        detail: `${formatDateLong(result.event.date)} to ${formatDateLong(result.target.date)}. The money stayed in Treasury bills for the whole time jump.`,
        label: "Time Held",
        marker: "1",
        value: span,
      },
      {
        detail: `${formatFuturesMoney(result.startingBankroll)} x ${formatFuturesPercent(result.billReturn)} over the hold period.`,
        label: "T-Bill Interest",
        marker: "2",
        value: `+${formatFuturesMoney(interest)}`,
      },
      {
        detail: `${formatFuturesMoney(result.grossEndingBankroll)} gross - ${formatFuturesMoney(result.tax)} tax.`,
        label: "Final Account",
        marker: "3",
        value: formatFuturesMoney(result.endingBankroll),
      },
    ];
  }

  const startPrice = result.event.futuresPrices[result.choice];
  const endPrice = result.target.prices[result.choice];

  return [
    {
      detail: `${formatDateLong(result.event.date)} to ${formatDateLong(result.target.date)}. The trade only wins or loses because time passes between those two dates.`,
      label: "Time Held",
      marker: "1",
      value: span,
    },
    {
      detail: `${formatFuturesMoney(result.contractInvestment)} buys ${formatFuturesContractCount(result.contractCount)} with a starting contract value of about ${formatFuturesMoney(result.contractValue)} each. ${formatFuturesMoney(result.billsReserve)} could not buy another full contract, so it stays in Treasury bills. ${getFuturesRollSummary(result.choice, result.event.date, result.target.date)}`,
      label: "Contracts Bought",
      marker: "2",
      value: formatFuturesContractCount(result.contractCount),
    },
    {
      detail: `${futuresChoiceLabels[result.choice]} moved from ${formatBushelPrice(startPrice)} to ${formatBushelPrice(endPrice)} across the rolled holding period.`,
      label: "Price Move",
      marker: "3",
      value: `${formatFuturesPercent(result.commodityReturn)}`,
    },
    {
      detail: `${formatFuturesContractCount(result.contractCount)} x ${futuresContractBushels.toLocaleString("en-US")} bushels x the price change. ${rollSchedule.rolls.length === 0 ? "No contract roll was needed." : `Rolled ${rollSchedule.rolls.length} ${rollSchedule.rolls.length === 1 ? "time" : "times"} before settlement.`}`,
      label: "Futures P/L",
      marker: "4",
      value: formatFuturesMoneyDelta(result.futuresPnL),
    },
    {
      detail: `Treasury bill interest ${formatFuturesMoney(interest)}; gross profit ${formatFuturesMoneyDelta(grossProfit)}; tax ${formatFuturesMoney(result.tax)}.`,
      label: "Final Account",
      marker: "5",
      value: formatFuturesMoney(result.endingBankroll),
    },
  ];
}

function getFuturesWhatHappened(result: FuturesResult) {
  const span = formatFuturesSpan(result.event.date, result.target.date);
  if (result.choice === "bills") {
    return `Riley chose not to buy a crop contract on ${formatDateLong(result.event.date)}. For the next ${span}, the account sat in U.S. Treasury bills, short-term government debt often treated as a conservative cash-like holding, until ${formatDateLong(result.target.date)}. Because the position was held through time, the account changed only by Treasury bill interest and any capital gains tax.`;
  }

  const startPrice = result.event.futuresPrices[result.choice];
  const endPrice = result.target.prices[result.choice];
  const priceVerb = endPrice > startPrice ? "rose" : endPrice < startPrice ? "fell" : "stayed flat";
  const outcomeVerb = result.futuresPnL > 0 ? "created a gain" : result.futuresPnL < 0 ? "created a loss" : "left the trade about flat";

  return `Riley bought ${formatFuturesContractCount(result.contractCount)} of simulated ${futuresChoiceLabels[result.choice]} on ${formatDateLong(result.event.date)} and held the contracts for ${span}, until ${formatDateLong(result.target.date)}. Each real contract is tied to ${futuresContractBushels.toLocaleString("en-US")} bushels and had a starting contract value of about ${formatFuturesMoney(result.contractValue)}, so ${formatFuturesMoney(result.contractInvestment)} went into contracts and the leftover ${formatFuturesMoney(result.billsReserve)} stayed in Treasury bills. The other side is a farmer, elevator, processor, or trader who sold the promise. A farmer may do this to lock in a selling price before harvest: if prices fall, the short futures hedge can help offset a weaker cash crop sale; if prices rise, the hedge loses, but the crop may sell for more locally. ${getFuturesRollSummary(result.choice, result.event.date, result.target.date)} The cash settlement follows the price move over time: ${formatBushelPrice(startPrice)} became ${formatBushelPrice(endPrice)}. Because the price ${priceVerb}, it ${outcomeVerb}; when the gross move is profitable, capital gains tax takes a slice before Riley sees the final account value.`;
}

function createFuturesLearningCards(result: FuturesResult) {
  const tone = getFuturesMathTone(result);

  return {
    cards: getFuturesFinancialMathRows(result).map((row) => ({
      detail: row.detail,
      label: row.label,
      marker: row.marker,
      value: row.value,
    })),
    formula: getFuturesFinancialMathHeadline(result),
    title: "Financial math",
    tone,
  };
}

function getFuturesLessonExplanation(result: FuturesResult) {
  return getFuturesWhatHappened(result);
}

function FuturesCropIllustration({ choice }: { choice: FuturesChoice }) {
  if (choice === "bills") {
    return (
      <div className="futures-crop-illustration bills" aria-hidden="true">
        <Landmark size={34} />
      </div>
    );
  }

  const Icon = futuresIcons[choice];
  return (
    <div className={`futures-crop-illustration ${choice}`} aria-hidden="true">
      <div className="futures-field-rows">
        <i />
        <i />
        <i />
      </div>
      <div className="futures-bushel-count">
        {Array.from({ length: 5 }, (_, index) => (
          <Icon key={index} size={20} />
        ))}
      </div>
      <span>5 x 1k bu</span>
    </div>
  );
}

function FuturesPersonGraphic({ role }: { role: "farmer" | "riley" | "tax" | "counterparty" }) {
  return (
    <div className={`futures-person-graphic ${role}`} aria-hidden="true">
      <i className="person-hat" />
      <i className="person-head" />
      <i className="person-body" />
      {role === "tax" && <b>US</b>}
    </div>
  );
}

function FuturesDeliveryPromise({ choice }: { choice: FuturesChoice }) {
  if (choice === "bills") {
    return (
      <div className="futures-delivery-promise bills" aria-hidden="true">
        <Landmark size={40} />
        <span>Treasury bill IOU</span>
      </div>
    );
  }

  return (
    <div className={`futures-delivery-promise ${choice}`} aria-hidden="true">
      <div className="futures-delivery-truck">
        <i />
        <b />
        <b />
      </div>
      <FuturesCropIllustration choice={choice} />
      <span>5,000-bushel delivery promise</span>
    </div>
  );
}

function FuturesMoneyRibbon({
  amount,
  label,
  tone,
}: {
  amount: string;
  label: string;
  tone: "gain" | "loss" | "neutral" | "tax";
}) {
  return (
    <div className={`futures-money-ribbon ${tone}`}>
      <span>{label}</span>
      <strong>{amount}</strong>
    </div>
  );
}

function FuturesTransactionVisual({ result }: { result: FuturesResult }) {
  const contractChoice = result.choice === "bills" ? null : result.choice;
  const isBills = contractChoice === null;
  const rollSchedule = getFuturesRollSchedule(result.choice, result.event.date, result.target.date);
  const initialContractCode = rollSchedule.initialContract?.code ?? "Bills";
  const initialContractName = contractChoice && rollSchedule.initialContract
    ? formatFuturesContractPlainName(contractChoice, rollSchedule.initialContract)
    : "Treasury Bills";
  const finalContractCode = rollSchedule.finalContract?.code ?? initialContractCode;
  const finalContractName = contractChoice && rollSchedule.finalContract
    ? formatFuturesContractPlainName(contractChoice, rollSchedule.finalContract)
    : initialContractName;
  const startPrice = contractChoice ? result.event.futuresPrices[contractChoice] : 0;
  const endPrice = contractChoice ? result.target.prices[contractChoice] : 0;
  const settlementTone = result.futuresPnL > 0 ? "gain" : result.futuresPnL < 0 ? "loss" : "neutral";
  const counterpartyLabel = result.futuresPnL >= 0 ? "Short side pays settlement" : "Riley pays short side";
  const settlementLabel = isBills ? "Interest earned" : counterpartyLabel;
  const settlementAmount = isBills ? formatFuturesMoney(getFuturesBillsInterest(result)) : formatFuturesMoneyDelta(result.futuresPnL);
  const contractValue = isBills ? formatFuturesMoney(result.startingBankroll) : formatRealContractValue(startPrice);
  const grossMove = result.grossEndingBankroll - result.startingBankroll;
  const moveTone = grossMove > 0 ? "gain" : grossMove < 0 ? "loss" : "neutral";
  const rollLine = rollSchedule.rolls.length === 0
    ? "No roll before settlement."
    : `Rolls ${rollSchedule.rolls.length}x into ${finalContractName} (${finalContractCode}) before settlement.`;

  return (
    <section className={`futures-transaction-visual expanded ${isBills ? "bills-only" : ""}`} aria-label="Visual futures transaction">
      <div className="futures-deal-headline">
        <div>
          <span>{isBills ? "Safety position" : "Futures promise"}</span>
          <strong>
            {isBills
              ? `${formatFuturesMoney(result.startingBankroll)} waits in Treasury bills`
              : `${initialContractName} starts the promise`}
          </strong>
        </div>
        <em>
          {isBills
              ? "No crop changes hands. Treasury bills are short-term U.S. government debt used here as the conservative waiting position."
            : `One real grain contract represents 5,000 bushels. Riley's game position is rolled and cash-settled before delivery.`}
        </em>
      </div>

      <div className="futures-transaction-scene">
        <article className="futures-transaction-node riley futures-party-card">
          <FuturesPersonGraphic role="riley" />
          <span>Riley</span>
          <strong>{isBills ? "Chooses safety" : `Buys ${formatFuturesContractCount(result.contractCount)}`}</strong>
          <p>{isBills ? "The money stays in short-term U.S. Treasury bills." : `${formatFuturesMoney(result.contractInvestment)} buys whole contracts; ${formatFuturesMoney(result.billsReserve)} stays in Treasury bills.`}</p>
        </article>

        <div className="futures-transaction-arrow contract-money futures-flow-step">
          <FuturesMoneyRibbon amount={isBills ? formatFuturesMoney(result.startingBankroll) : formatFuturesMoney(result.contractInvestment)} label={isBills ? "cash waits" : "contract money"} tone="neutral" />
          <p>{isBills ? "Cash sits in short-term U.S. government debt." : `Whole contracts only: each contract is valued at about ${contractValue}, so leftover cash goes to T-bills.`}</p>
        </div>

        <article className="futures-contract-paper">
          <div className="futures-contract-topline">
            <span>{isBills ? "Treasury Bills" : futuresChoiceLabels[result.choice]}</span>
            <strong>{isBills ? "No crop contract" : initialContractName}</strong>
            {!isBills && <em>Exchange code: {initialContractCode}</em>}
          </div>
          <FuturesDeliveryPromise choice={result.choice} />
          {!isBills && (
            <dl className="futures-contract-details">
              <div>
                <dt>Contract value</dt>
                <dd>{contractValue}</dd>
              </div>
              <div>
                <dt>Count</dt>
                <dd>{result.contractCount}</dd>
              </div>
              <div>
                <dt>Starts</dt>
                <dd>{formatBushelPrice(startPrice)}</dd>
              </div>
              <div>
                <dt>Ends</dt>
                <dd>{formatBushelPrice(endPrice)}</dd>
              </div>
            </dl>
          )}
          <p>
            {isBills
              ? "No farmer, crop promise, or futures counterparty is used."
              : rollLine}
          </p>
        </article>

        <div className="futures-transaction-arrow counterparty futures-flow-step">
          <FuturesMoneyRibbon
            amount={settlementAmount}
            label={settlementLabel}
            tone={isBills ? "gain" : settlementTone}
          />
          <p>{isBills ? "Interest accrues as time passes." : "At settlement, only the gain or loss moves. The crop promise explains what the contract tracks."}</p>
        </div>

        <article className="futures-transaction-node counterparty futures-party-card">
          <div className="futures-counterparty-cast">
            <FuturesPersonGraphic role={isBills ? "counterparty" : "farmer"} />
            {!isBills && <FuturesPersonGraphic role="counterparty" />}
          </div>
          <span>{isBills ? "Treasury market" : "Farmer / elevator / trader"}</span>
          <strong>{isBills ? "Pays interest" : "Takes the short side"}</strong>
          <p>{isBills ? "Treasury bills mature over time and pay interest." : "A farmer may sell futures before harvest to lock in a price and protect the crop from a price drop."}</p>
        </article>
      </div>

      <div className="futures-promise-strip">
        <article>
          <span>Promise</span>
          <strong>{isBills ? "Repay cash with interest" : `${formatFuturesContractCount(result.contractCount)} x ${futuresContractBushels.toLocaleString("en-US")} bu`}</strong>
          <p>{isBills ? "Riley effectively holds short-term U.S. Treasury debt for the hold." : "A real held-to-delivery grain future is tied to a farmer or elevator delivering grain into the system."}</p>
        </article>
        {!isBills && (
          <article>
            <span>Leftover</span>
            <strong>{formatFuturesMoney(result.billsReserve)} T-Bills</strong>
            <p>Money that cannot buy another full contract automatically earns Treasury bill interest.</p>
          </article>
        )}
        <article className="hedge-reason">
          <span>{isBills ? "Why bills" : "Why the farmer sells"}</span>
          <strong>{isBills ? "Lower risk waiting room" : "Locks a crop price"}</strong>
          <p>
            {isBills
              ? "Treasury bills are the conservative side of the futures game."
              : "The farmer gives up some upside if prices rise, but gains protection if crop prices fall before the grain is sold."}
          </p>
        </article>
        <article>
          <span>Time jump</span>
          <strong>{formatFuturesSpan(result.event.date, result.target.date)}</strong>
          <p>{isBills ? "The Treasury bill return compounds over the jump." : "The position rolls into the next listed contract before expiration instead of pretending one contract lasts for years."}</p>
        </article>
        <article className={moveTone}>
          <span>Account move</span>
          <strong>{formatFuturesMoneyDelta(grossMove)} gross</strong>
          <p>{isBills ? "Treasury bill interest changes the balance." : "The futures price move creates the gain or loss before tax."}</p>
        </article>
      </div>

      <div className="futures-transaction-settlement">
        <article>
          <span>Time passes</span>
          <strong>{formatFuturesSpan(result.event.date, result.target.date)}</strong>
          <p>{formatDateLong(result.event.date)} to {formatDateLong(result.target.date)}</p>
        </article>
        <article>
          <span>Price change</span>
          <strong>{isBills ? formatFuturesPercent(result.billReturn) : formatFuturesPercent(result.commodityReturn)}</strong>
          <p>{isBills ? "U.S. Treasury bill yield over the hold" : "Continuous futures proxy across rolls"}</p>
        </article>
        <article className="tax">
          <FuturesPersonGraphic role="tax" />
          <div>
            <span>Capital gains tax</span>
            <strong>{formatFuturesMoney(result.tax)}</strong>
            <p>{result.tax > 0 ? "Taken after the profitable settlement." : "No tax because this move did not create a taxable gain."}</p>
          </div>
        </article>
      </div>
    </section>
  );
}

function getFuturesTimeJumpEntries(game: FuturesFortuneState, result: FuturesResult): TimeJumpEntry[] {
  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  const startIndex = Math.min(fromIndex + 1, game.events.length);
  const endIndex = Math.max(startIndex, Math.min(result.targetIndex, game.events.length));
  const entries: TimeJumpEntry[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (index >= game.events.length) {
      entries.push({
        date: futuresEndDate,
        headline: "Final harvest: the futures tape is settled",
        isFinal: true,
        isMajor: true,
        status: "Final page",
      });
      continue;
    }

    const event = game.events[index];
    entries.push({
      date: event.date,
      headline: event.headline,
      isMajor: event.major,
      isMarketMover: event.major,
      status: event.major ? "Major headline" : "Future page",
    });
  }

  return entries.length > 0
    ? entries
    : [
        {
          date: result.target.date,
          headline: getTargetHeadline(result.target),
          isFinal: result.target.isFinal,
          isMajor: result.target.event?.major ?? result.target.isFinal,
          isMarketMover: result.target.event?.major ?? false,
        },
      ];
}
function createFuturesTimeJumpTransition(game: FuturesFortuneState, result: FuturesResult): TimeJumpTransitionModel {
  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  return {
    chartPoints: buildInterpolatedTimeJumpPoints({
      endDate: result.target.date,
      endValue: result.endingBankroll,
      startDate: result.event.date,
      startValue: result.startingBankroll,
    }),
    entries: getFuturesTimeJumpEntries(game, result),
    fromBalance: result.startingBankroll,
    fromDate: result.event.date,
    fromHeadline: result.event.headline,
    fromProgress: getProgressPercent(game, fromIndex),
    strategyLabel: futuresChoiceLabels[result.choice],
    targetBalance: result.endingBankroll,
    targetDate: result.target.date,
    targetHeadline: getTargetHeadline(result.target),
    targetProgress: getProgressPercent(game, result.targetIndex),
    title: "Harvest settled",
    travelerLabel: "Riley",
  };
}

function FuturesFinalJournalOverlay({ game, onClose }: { game: FuturesFortuneState; onClose: () => void }) {
  const totalContractInvestment = game.results.reduce((total, result) => total + result.contractInvestment, 0);
  const totalFuturesPnL = game.results.reduce((total, result) => total + result.futuresPnL, 0);
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Final futures journal">
      <article className="storybook-journal-page futures-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close final journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Riley's final journal</p>
        <h2>The Last Harvest</h2>
        <div className="storybook-journal-entry">
          <p>{futuresStory.ending}</p>
          <p>
            Riley allocated {formatFuturesMoney(totalContractInvestment)} into whole futures contracts across {formatCountNoun(game.results.length, "trade")} and generated {formatFuturesMoney(totalFuturesPnL)} in futures P/L before taxes and Treasury bill interest.
          </p>
          <p>
            Granddad's ledger proved that knowing tomorrow's front page helps, but grain futures still answer to weather, storage, demand, leverage, and the discipline to stop trading when the board turns louder than the facts.
          </p>
        </div>
      </article>
    </div>
  );
}

function FuturesIntro({
  game,
  onBegin,
}: {
  game: FuturesFortuneState;
  onBegin: () => void;
}) {
  const perfectTimingQuestion = `How much do you think someone using this investment strategy from ${formatDateLong(futuresStartDate)} to ${formatDateLong(futuresEndDate)} could have made if they timed the market perfectly? Find out at the end.`;

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-intro-shell futures-fortune-shell">
      <section className="storybook-book intro setup futures-intro-book">
        <article className="storybook-intro-page prologue futures-prologue">
          <figure className="storybook-prologue-art futures-prologue-art">
            <img
              src={assetUrl("games/futures-fortune/grain-ledger-prologue.webp")}
              alt="Cartoon of Riley Bell holding a brass key beside her granddad's locked grain ledger in a rural grain elevator office."
            />
          </figure>
          <div className="storybook-prologue-copy-panel">
            <p className="storybook-game-title">Harvest Ledger</p>
            <p className="eyebrow">Futures desk prologue</p>
            <h1>The Grain Ledger</h1>
            <p className="storybook-prologue-date">{futuresPrologueDate}</p>
            <p className="storybook-copy">{futuresStory.prologue}</p>
          </div>
          <div className="storybook-chapter-one-cards">
            <span>{futuresStory.hook}</span>
            <span>Start on Riley's dashboard: choose a future clipping, pick Treasury Bills or one grain future, then let time run.</span>
            <span>{perfectTimingQuestion}</span>
          </div>
          <HighScoreToBeatBanner formatMoney={formatFuturesMoney} gameSlug="harvest-ledger" />
          <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play" type="button" onClick={onBegin}>
            <Play size={18} />
            <span>Start Game</span>
            <small>{formatDateLong(getCurrentFuturesEvent(game).date)}</small>
          </button>
        </article>
      </section>
    </main>
  );
}

function FuturesTimeline({
  game,
  onSelectTarget,
}: {
  game: FuturesFortuneState;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const activePointerRef = useRef<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const currentProgress = getProgressPercent(game);
  const targetProgress = getProgressPercent(game, game.selectedTargetIndex);
  const currentEvent = getCurrentFuturesEvent(game);
  const target = getSelectedFuturesTarget(game);
  const lensUnlocked = isMarketVisionUnlocked(game);
  const style = {
    "--story-progress": `${currentProgress}%`,
    "--story-projected-progress": `${targetProgress}%`,
    "--story-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
    "--jonah-progress": `${currentProgress}%`,
    "--jonah-target-progress": `${targetProgress}%`,
    "--jonah-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
  } as CSSProperties;

  const selectFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    onSelectTarget(chooseNearestTargetIndex(game, progress));
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      activePointerRef.current = null;
      setScrubbing(false);
    }
  };

  return (
    <section className="storybook-progress-rail embedded" aria-label="Futures timeline" style={style}>
      <div className="storybook-progress-context">
        <strong>
          Desk: {currentEvent.era} · {formatDateLong(currentEvent.date)}
          <em>Selected harvest: {formatDateLong(target.date)}</em>
        </strong>
      </div>
      <div className="storybook-progress-body">
        <div
          className={`storybook-progress-track interactive ${scrubbing ? "scrubbing" : ""}`}
          role="slider"
          aria-label="Choose Riley's next future headline on the futures timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(targetProgress)}
          tabIndex={0}
          title="Click or drag to select the nearest future headline."
          data-guide-target="timeline"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              onSelectTarget(Math.max(game.currentIndex + 1, game.selectedTargetIndex - 1));
            } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              onSelectTarget(Math.min(game.events.length, game.selectedTargetIndex + 1));
            } else if (event.key === "End") {
              event.preventDefault();
              onSelectTarget(game.events.length);
            }
          }}
          onPointerDown={(event) => {
            activePointerRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrubbing(true);
            selectFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (activePointerRef.current === event.pointerId) {
              selectFromPointer(event);
            }
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <span className="storybook-progress-endcap start">2010</span>
          <span className="storybook-progress-endcap end">2020</span>
          <span className={`storybook-progress-heat-unlock ${lensUnlocked ? "active" : ""}`}>
            <b>Market Vision</b>
            <em>{lensUnlocked ? "Unlocked" : "Locked"}</em>
          </span>
          <div className="storybook-progress-fill" />
          <div className="storybook-progress-projection" />
          <div className="storybook-progress-target-pin">
            <ChevronRight size={13} />
            <span>Expiry</span>
          </div>
          <div className="storybook-progress-pin">
            <BriefcaseBusiness size={15} />
            <span>Riley</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function FuturesChoiceStrip({
  game,
  onChoose,
}: {
  game: FuturesFortuneState;
  onChoose: (choice: FuturesChoice) => void;
}) {
  const outcomes = getProjectedOutcomes(game);
  const unlocked = isMarketVisionUnlocked(game);

  return (
    <div className={`storybook-dashboard-allocation futures-choice-strip ${unlocked ? "heat-unlocked" : "heat-locked"}`} data-guide-target="allocation-buttons">
      {futuresChoiceOrder.map((choice) => {
        const Icon = futuresIcons[choice];
        const outcome = outcomes[choice];
        const heat = getOutcomeHeat(outcome, unlocked);
        const active = game.choice === choice;
        return (
          <button
            key={choice}
            className={`storybook-dashboard-allocation-choice ${choice} ${heat.className} ${active ? "active" : ""}`}
            style={{ "--market-heat-alpha": heat.alpha } as CSSProperties}
            type="button"
            onClick={() => onChoose(choice)}
          >
            <Icon size={15} aria-hidden="true" />
            <strong>{choice === "soybeans" ? "Soy" : futuresChoiceShortLabels[choice]}</strong>
            <span>{choice === "bills" ? "100%" : "Max"}</span>
            <em aria-hidden="true">{active ? "Selected" : ""}</em>
          </button>
        );
      })}
    </div>
  );
}

function FuturesSelectedStrategyBanner({
  game,
  onChoose,
  onPlay,
  outcome,
  pulseKey,
}: {
  game: FuturesFortuneState;
  onChoose: (choice: FuturesChoice) => void;
  onPlay: () => void;
  outcome: FuturesOutcome;
  pulseKey: number;
}) {
  const previousChoice = getPreviousFuturesChoice(game);
  const billFrom = getFuturesFlowPosition(previousChoice);
  const billTo = getFuturesFlowPosition(game.choice);
  const taxTo = getFuturesFlowPosition("tax");
  const visibleTax = outcome.tax > 0.5;
  const isHolding = previousChoice === game.choice;
  const mainAmount = game.choice === "bills" ? outcome.startingBankroll : outcome.contractInvestment;
  const secondaryAmount = game.choice === "bills" ? 0 : outcome.billsReserve;
  const visibleReserve = game.choice !== "bills" && secondaryAmount > 0.5;
  const visibleContractBill = game.choice === "bills" || mainAmount > 0.5;
  const contractSummary = game.choice === "bills"
    ? `In ${formatFuturesMoney(mainAmount)} T-Bills · Tax ${formatFuturesMoney(outcome.tax)}`
    : `${formatFuturesContractCount(outcome.contractCount)} ${futuresChoiceShortLabels[game.choice]} · ${formatFuturesMoney(mainAmount)} · T-Bills ${formatFuturesMoney(secondaryAmount)} · Tax ${formatFuturesMoney(outcome.tax)}`;
  const strategyAria = game.choice === "bills"
    ? `Selected strategy ${futuresChoiceLabels[game.choice]}. ${formatFuturesMoney(mainAmount)} stays in Treasury bills. Capital gains tax estimate ${formatFuturesMoney(outcome.tax)}.`
    : `Selected strategy ${futuresChoiceLabels[game.choice]}. ${formatFuturesMoney(mainAmount)} buys ${formatFuturesContractCount(outcome.contractCount)} and ${formatFuturesMoney(secondaryAmount)} stays in Treasury bills. Capital gains tax estimate ${formatFuturesMoney(outcome.tax)}.`;
  const ContractIcon = game.choice === "bills" ? null : futuresIcons[game.choice];
  const contractIconCount = game.choice === "bills" ? 0 : Math.min(outcome.contractCount, 20);
  const contractIconRows = Math.max(1, Math.ceil(contractIconCount / 4));
  const totalBushels = outcome.contractCount * futuresContractBushels;
  const scrollOrderTitle = game.choice === "bills" ? "T-Bills" : futuresChoiceLabels[game.choice];
  const scrollAssets: Array<{
    amount: string;
    className: string;
    detail: string;
    icon: GrainIcon | null;
    label: string;
  }> = [
    {
      amount: formatFuturesMoney(mainAmount),
      className: game.choice,
      detail:
        game.choice === "bills"
          ? "Treasury bill position"
          : `${formatFuturesContractCount(outcome.contractCount)} x ${formatBushels(futuresContractBushels)}`,
      icon: game.choice === "bills" ? Landmark : ContractIcon,
      label: game.choice === "bills" ? "T-Bills" : futuresChoiceShortLabels[game.choice],
    },
  ];

  if (visibleReserve) {
    scrollAssets.push({
      amount: formatFuturesMoney(secondaryAmount),
      className: "bills",
      detail: "Leftover reserve",
      icon: Landmark,
      label: "T-Bills",
    });
  }

  if (visibleTax) {
    scrollAssets.push({
      amount: formatFuturesMoney(outcome.tax),
      className: "tax",
      detail: "Capital gains tax",
      icon: null,
      label: "Tax",
    });
  }

  const scrollDetails =
    game.choice === "bills"
      ? [
          `${formatFuturesMoney(mainAmount)} stays in Treasury bills.`,
          `Estimated tax: ${formatFuturesMoney(outcome.tax)}.`,
        ]
      : [
          `${formatFuturesMoney(secondaryAmount)} remains in Treasury bills; estimated tax ${formatFuturesMoney(outcome.tax)}.`,
        ];
  const promiseLine =
    game.choice === "bills"
      ? `${formatFuturesMoneyCompact(mainAmount)} stays in Treasury Bills.`
      : `${formatFuturesMoneyCompact(mainAmount)} buys ${outcome.contractCount} ${futuresChoiceShortLabels[game.choice]} contracts = ${formatCompactBushels(totalBushels)}.`;
  const counterpartyLine =
    game.choice === "bills"
      ? "No futures side."
      : "Hedger shorts to lock price.";

  if (useExperimentalFuturesAllocationScroll) {
    return (
      <aside
        className={`storybook-selected-allocation-banner futures-selected-strategy-banner experimental-contract-scroll ${visibleTax ? "has-tax" : "no-tax"} ${
          pulseKey > 0 ? "is-pulsing" : ""
        } ${isHolding ? "is-holding" : "is-moving"}`}
        aria-label={strategyAria}
      >
        <section className="futures-allocation-contract-scroll" aria-label="Futures contract order controls">
          <div className="futures-scroll-roll top" aria-hidden="true" />
          <div className="futures-scroll-roll bottom" aria-hidden="true" />
          <div className="futures-scroll-notches left" aria-hidden="true" />
          <div className="futures-scroll-notches right" aria-hidden="true" />
          <header>
            <span>{isHolding ? "No trade" : "New order"}</span>
            <strong>{scrollOrderTitle}</strong>
            <em>{contractSummary}</em>
          </header>
          <div className={`futures-scroll-assets asset-count-${scrollAssets.length}`}>
            {scrollAssets.map((asset) => {
              const Icon = asset.icon;
              const isContractAsset = Boolean(asset.className === game.choice && ContractIcon && game.choice !== "bills" && outcome.contractCount > 0);
              return (
                <span key={`${asset.className}-${asset.label}`} className={`futures-scroll-asset ${asset.className} ${isContractAsset ? "contract-asset" : ""}`}>
                  {isContractAsset && ContractIcon ? (
                    <i
                      className="futures-scroll-contract-icons"
                      aria-label={`${outcome.contractCount} ${futuresChoiceShortLabels[game.choice]} contracts`}
                      style={{ "--contract-stack-rows": contractIconRows } as CSSProperties}
                    >
                      {Array.from({ length: contractIconCount }, (_, index) => (
                        <b key={`${game.choice}-scroll-contract-face-${index}`}>
                          <ContractIcon size={10} aria-hidden="true" />
                        </b>
                      ))}
                    </i>
                  ) : (
                    <i>{asset.className === "tax" ? <b>US</b> : Icon ? <Icon size={17} aria-hidden="true" /> : null}</i>
                  )}
                  <strong>{asset.label}</strong>
                  <em>{asset.detail}</em>
                  <small>{asset.amount}</small>
                </span>
              );
            })}
          </div>
          <FuturesChoiceStrip game={game} onChoose={onChoose} />
          <div className="futures-scroll-written-details">
            <article className="futures-scroll-promise-card">
              <span>
                <ReceiptText size={13} aria-hidden="true" />
                Promise
              </span>
              <strong>{promiseLine}</strong>
            </article>
            <article className="futures-scroll-promise-card counterparty">
              <span>
                {game.choice === "bills" ? <Landmark size={13} aria-hidden="true" /> : <Tractor size={13} aria-hidden="true" />}
                Other side
              </span>
              <strong>{counterpartyLine}</strong>
              {game.choice !== "bills" && (
                <em>
                  <Warehouse size={12} aria-hidden="true" />
                  Held-to-delivery grain futures are tied to delivery through the elevator system; this game rolls and cash-settles before delivery.
                </em>
              )}
            </article>
            {scrollDetails.map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
          <button className="primary-action legacy-primary storybook-play-button futures-scroll-play-button" type="button" onClick={onPlay} data-guide-target="advance-game">
            <span>Play</span>
            <small>{futuresChoiceLabels[game.choice]}</small>
            <ChevronRight size={18} />
          </button>
        </section>
        <div className="allocation-banner-copy">
          <span>
            {isHolding ? "No trade" : "Selected"} · {futuresChoiceLabels[game.choice]}
          </span>
          <strong>{contractSummary}</strong>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`storybook-selected-allocation-banner futures-selected-strategy-banner ${visibleTax ? "has-tax" : "no-tax"} ${
        pulseKey > 0 ? "is-pulsing" : ""
      } ${isHolding ? "is-holding" : "is-moving"}`}
      aria-label={strategyAria}
      style={
        {
          "--bill-from": `${billFrom}%`,
          "--bill-to": `${billTo}%`,
          "--reserve-to": `${getFuturesFlowPosition("bills")}%`,
          "--tax-to": `${taxTo}%`,
        } as CSSProperties
      }
    >
      <div className="allocation-flow-stops" aria-hidden="true">
        {futuresFlowStops.map((stop) => {
          const Icon = stop.icon;
          const isSource = stop.id === previousChoice;
          const isDestination = stop.id === game.choice;
          const isTaxStop = stop.id === "tax";
          const isReserveStop = stop.id === "bills" && visibleReserve;
          const isContractStop = Boolean(
            ContractIcon && stop.id === game.choice && outcome.contractCount > 0,
          );

          return (
            <span
              key={stop.id}
              className={`allocation-flow-stop ${stop.tone} ${isSource ? "source" : ""} ${isDestination ? "destination" : ""} ${isReserveStop ? "reserve" : ""} ${
                isTaxStop && visibleTax ? "tax-active" : ""
              }`}
            >
              <i
                className={isContractStop ? "has-contract-icons" : ""}
                style={
                  isContractStop
                    ? ({ "--contract-stack-rows": contractIconRows } as CSSProperties)
                    : undefined
                }
              >
                <span className="allocation-scroll-title">{stop.label}</span>
                {isContractStop && ContractIcon ? (
                  <>
                    <span className="allocation-scroll-contracts">
                      {Array.from({ length: contractIconCount }, (_, index) => {
                        const row = Math.floor(index / 4);
                        const rowLength = Math.min(4, contractIconCount - row * 4);
                        const column = index % 4;
                        const x = (column - (rowLength - 1) / 2) * 9;
                        const y = row * 6;
                        const rotation = [-9, 6, -3, 8][index % 4];

                        return (
                          <b
                            key={`${game.choice}-scroll-contract-${index}`}
                            style={
                              {
                                "--contract-rot": `${rotation}deg`,
                                "--contract-x": `${x}px`,
                                "--contract-y": `${y}px`,
                              } as CSSProperties
                            }
                          >
                            <ContractIcon size={10} aria-hidden="true" />
                          </b>
                        );
                      })}
                    </span>
                  </>
                ) : (
                  <span className="allocation-scroll-single">
                    {isTaxStop ? <b>US</b> : Icon ? <Icon size={15} aria-hidden="true" /> : null}
                  </span>
                )}
              </i>
              <em>{isContractStop ? `${outcome.contractCount} x 5k bu` : stop.label}</em>
            </span>
          );
        })}
        {visibleContractBill && (
          <b className="allocation-dollar-bill main-bill">
            <span>$</span>
            <strong>{formatFuturesMoney(mainAmount)}</strong>
          </b>
        )}
        {visibleReserve && (
          <b className="allocation-dollar-bill reserve-bill">
            <span>$</span>
            <strong>{formatFuturesMoney(secondaryAmount)}</strong>
          </b>
        )}
        {visibleTax && (
          <b className="allocation-dollar-bill tax-bill">
            <span>$</span>
            <strong>{formatFuturesMoney(outcome.tax)}</strong>
          </b>
        )}
      </div>
      <div className="allocation-banner-copy">
        <span>
          {isHolding ? "No trade" : "Selected"} · {futuresChoiceLabels[game.choice]}
        </span>
        <strong>{contractSummary}</strong>
      </div>
    </aside>
  );
}

function FuturesDateConsole({
  compact,
  game,
  onChoose,
  onOpenIndex,
  onPlay,
  onSelectTarget,
}: {
  compact: boolean;
  game: FuturesFortuneState;
  onChoose: (choice: FuturesChoice) => void;
  onOpenIndex: () => void;
  onPlay: () => void;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const dragStartRef = useRef<{ moved: boolean; selectedIndex: number; targetIndex: number | null; y: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const selectedTarget = getSelectedFuturesTarget(game);
  const outcomes = getProjectedOutcomes(game);
  const projected = outcomes[game.choice];
  const currentEvent = getCurrentFuturesEvent(game);
  const minimum = game.currentIndex + 1;
  const headlineWindowStart = Math.max(game.currentIndex, game.selectedTargetIndex - 2);
  const headlineWindowEnd = Math.min(game.events.length, headlineWindowStart + 5);
  const entries = Array.from({ length: headlineWindowEnd - headlineWindowStart + 1 }, (_, offset) => headlineWindowStart + offset);
  const [selectionPulseKey, setSelectionPulseKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    setSelectionPulseKey((key) => key + 1);
  }, [game.choice, game.selectedTargetIndex]);

  const moveSelection = (delta: number) => {
    onSelectTarget(Math.max(minimum, Math.min(game.events.length, game.selectedTargetIndex + delta)));
  };
  const clampTargetIndex = (index: number) => Math.max(minimum, Math.min(game.events.length, index));

  const handleWheel = (event: ReactWheelEvent) => {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onPlay();
    }
  };
  const startSpin = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    const headlineCard =
      event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
    const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
    dragStartRef.current = {
      moved: false,
      selectedIndex: game.selectedTargetIndex,
      targetIndex: Number.isFinite(headlineIndex) ? clampTargetIndex(headlineIndex) : null,
      y: event.clientY,
    };
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
    if (nextIndex !== game.selectedTargetIndex) {
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
    } else if (dragStart?.targetIndex !== null && dragStart?.targetIndex !== undefined && dragStart.targetIndex > game.currentIndex) {
      onSelectTarget(dragStart.targetIndex);
    }
    dragStartRef.current = null;
    setIsSpinning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const spinHandlers = {
    onPointerCancel: stopSpin,
    onPointerDown: startSpin,
    onPointerMove: moveSpin,
    onPointerUp: stopSpin,
  };

  return (
    <section
      className={`storybook-date-console rolodex-watch-skin futures-date-console ${compact ? "compact-dashboard" : ""}`}
      aria-label="Harvest date selector"
      data-guide-target="date-console"
    >
      {compact ? (
        <>
          <div className="futures-date-banner" aria-label="Current and selected headline dates">
            <span>
              <b>Current page</b>
              <strong>{formatDateLong(currentEvent.date)}</strong>
            </span>
            <em>{formatFuturesSpan(currentEvent.date, selectedTarget.date)}</em>
            <span>
              <b>Selected harvest</b>
              <strong>{formatDateLong(selectedTarget.date)}</strong>
            </span>
          </div>
          <FuturesTimeline game={game} onSelectTarget={onSelectTarget} />
          <div className="futures-term-chip" aria-label="Selected futures contract term">
            {getFuturesContractTermShortLabel(currentEvent.date, selectedTarget.date)}
          </div>
        </>
      ) : (
        <>
          <FuturesTimeline game={game} onSelectTarget={onSelectTarget} />
          <article className="storybook-date-headline" aria-label="Rolling headline preview">
            <div className="storybook-deck-kicker">
              <span>{selectedTarget.isFinal ? "Final harvest" : `Future page ${selectedTarget.index + 1} of ${game.events.length}`}</span>
              <em>
                {formatFuturesSpan(currentEvent.date, selectedTarget.date)} pass · {formatFuturesSpan(selectedTarget.date, futuresEndDate)} remain
              </em>
            </div>
            <div className="futures-term-chip" aria-label="Selected futures contract term">
              {getFuturesContractTermShortLabel(currentEvent.date, selectedTarget.date)}
            </div>
            <button className="futures-headline-index-button" type="button" onClick={onOpenIndex} aria-label="Open harvest index" data-guide-target="chapter-index">
              <Newspaper size={14} />
            </button>
            <div
              className={`storybook-headline-deck futures-headline-deck ${isSpinning ? "spinning" : ""}`}
              tabIndex={0}
              data-guide-target="headline-deck"
              onKeyDown={handleKeyDown}
              onWheel={handleWheel}
              {...spinHandlers}
            >
              <div className="storybook-headline-track">
                {entries.map((index) => {
                  const event = game.events[index];
                  const isFinal = index >= game.events.length;
                  const headline = isFinal ? "Final harvest: close the grain ledger" : event.headline;
                  const isCurrent = index === game.currentIndex;
                  const selected = index === game.selectedTargetIndex;
                  return (
                    <button
                      key={`${index}-${headline}`}
                      className={`storybook-headline-card ${isCurrent ? "current" : ""} ${selected ? "selected" : ""} ${event?.major ? "major" : ""}`}
                      type="button"
                      data-headline-index={index}
                      disabled={isCurrent}
                      onClick={() => {
                        if (ignoreClickRef.current) return;
                        if (!isCurrent) onSelectTarget(index);
                      }}
                    >
                      <strong className={selected ? "marquee" : ""}>
                        {selected ? (
                          <span className="storybook-headline-marquee-track" aria-hidden="true">
                            <span>{headline}</span>
                            <span>{headline}</span>
                          </span>
                        ) : (
                          <span className="storybook-headline-text">{headline}</span>
                        )}
                      </strong>
                      <em aria-hidden="true">{isCurrent ? "Now" : selected ? "Selected" : ""}</em>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        </>
      )}

      {!useExperimentalFuturesAllocationScroll && (
        <div className="storybook-date-controls futures-controls">
          <FuturesChoiceStrip game={game} onChoose={onChoose} />
          <button className="primary-action legacy-primary storybook-play-button" type="button" onClick={onPlay} data-guide-target="advance-game">
            <span>Play</span>
            <small>{futuresChoiceLabels[game.choice]}</small>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
      <FuturesSelectedStrategyBanner game={game} onChoose={onChoose} onPlay={onPlay} outcome={projected} pulseKey={selectionPulseKey} />
    </section>
  );
}

function FuturesPreviewCard({
  target,
  onOpen,
  lastResult,
}: {
  target: FuturesTarget;
  onOpen: () => void;
  lastResult?: FuturesResult;
}) {
  const event = target.event;
  return (
    <article className="storybook-current-page with-headline-image futures-preview-card" data-guide-target="selected-front-page-article">
      <div className="storybook-current-copy">
        <div className="storybook-masthead mini">
          <span>{target.label}</span>
          <b>{target.isFinal ? "Final Harvest" : event?.major ? "Major Headline" : "Selected Harvest"}</b>
        </div>
        <h1>
          <button className="storybook-front-page-link" type="button" onClick={onOpen} data-guide-target="front-page">
            {getTargetHeadline(target)}
          </button>
        </h1>
        <div className="storybook-front-page-date-line">{formatDateWithWeekday(target.date)}</div>
        <HeadlineEventImage event={event ?? null} variant="preview" />
        {lastResult && (
          <div className={`storybook-arrival-summary ${getTone(lastResult.profit)}`}>
            <span>Previous trade</span>
            <strong>
              {futuresChoiceShortLabels[lastResult.choice]} · {formatFuturesPercent((lastResult.endingBankroll / lastResult.startingBankroll - 1) * 100)} · {formatFuturesMoney(lastResult.endingBankroll)}
            </strong>
          </div>
        )}
        <p>{getPreviewParagraph(event, target.isFinal)}</p>
      </div>
    </article>
  );
}

function FuturesDashboardGuide({ compact, onStart }: { compact: boolean; onStart: () => void }) {
  return (
    <TargetGuideOverlay
      buttonLabel="Start"
      className="dashboard-guide-live futures-guide"
      guideItems={compact ? futuresCompactDashboardGuideItems : futuresDashboardGuideItems}
      label="Futures dashboard guide"
      onStart={onStart}
      showStartButton={false}
      subtitle="Tap anywhere to start"
      title="Riley's Trading Desk"
    />
  );
}

function FuturesArticleOverlay({ target, onClose }: { target: FuturesTarget; onClose: () => void }) {
  const event = target.event;
  const facts = event?.newspaperArticle?.facts ?? [];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Harvest front page">
      <article className="storybook-newspaper-max futures-newspaper">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close front page">
          <Minimize2 size={17} />
        </button>
        <section className="storybook-newspaper-clipping">
          <div className="storybook-masthead">
            <span>{futuresChronicleName}</span>
            <em>{formatDateWithWeekday(target.date)}</em>
          </div>
          <h2>{getTargetHeadline(target)}</h2>
          <p>{getTargetDeck(target)}</p>
          <HeadlineEventImage event={event ?? null} variant="newspaper" />
          <div className="storybook-article-columns">
            {(event?.newspaperArticle?.lede ?? getPreviewParagraph(event, target.isFinal))
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
          </div>
        </section>
        <aside className="storybook-front-page-notes">
          <span>Desk Notes</span>
          {facts.slice(0, 4).map((fact) => (
            <p key={fact}>{fact}</p>
          ))}
          <p>Gameplay uses historical headline dates and continuous CBOT corn, soybean, and wheat futures chart prices.</p>
          <p>{futuresContractRuleSummary}</p>
        </aside>
      </article>
    </div>
  );
}

function FuturesJournalOverlay({ game, onClose }: { game: FuturesFortuneState; onClose: () => void }) {
  const currentEvent = getCurrentFuturesEvent(game);
  const paragraphs = [
    futuresStory.journal,
    currentEvent.lifeNote,
    `Current desk page: ${currentEvent.headline}`,
    `Riley has made ${game.results.length} ${game.results.length === 1 ? "trade" : "trades"} and is sitting at ${formatFuturesMoney(game.bankroll)}.`,
  ];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Riley's journal">
      <article className="storybook-journal-page futures-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Riley's desk journal</p>
        <h2>{formatDateLong(currentEvent.date)}</h2>
        <div className="storybook-journal-entry">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}

function FuturesLedgerOverlay({ game, onClose }: { game: FuturesFortuneState; onClose: () => void }) {
  const lastResult = game.results.at(-1);
  const path = buildFuturesSparkline(game.results, game.bankroll);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Futures ledger">
      <article className="storybook-ledger-page futures-ledger-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close ledger">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Futures ledger</p>
        <h2>{formatFuturesMoney(game.bankroll)}</h2>
        <section className="storybook-ledger-comparison">
          <article className="player">
            <span>Riley</span>
            <strong>{formatFuturesMoney(game.bankroll)}</strong>
            <em>{formatFuturesPercent(gainPercent)}</em>
          </article>
          <article>
            <span>Corn</span>
            <strong>{formatFuturesMoney(game.cornBenchmark)}</strong>
            <em>{formatFuturesPercent((game.cornBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
          <article>
            <span>Soybeans</span>
            <strong>{formatFuturesMoney(game.soybeanBenchmark)}</strong>
            <em>{formatFuturesPercent((game.soybeanBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
          <article>
            <span>Wheat</span>
            <strong>{formatFuturesMoney(game.wheatBenchmark)}</strong>
            <em>{formatFuturesPercent((game.wheatBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
          <article>
            <span>T-Bills</span>
            <strong>{formatFuturesMoney(game.billsBenchmark)}</strong>
            <em>{formatFuturesPercent((game.billsBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
        </section>
        <section className="storybook-market-chart sp500 futures-ledger-chart" aria-label="Futures account chart">
          <div>
            <span>Account path</span>
            <strong>{formatFuturesMoney(gain)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatFuturesPercent(gainPercent)}</em>
          </div>
          <svg viewBox="0 0 240 72" role="img" aria-label="Riley account value by trade">
            <path className="storybook-chart-gridline top" d="M 0 12 H 240" />
            <path className="storybook-chart-gridline mid" d="M 0 36 H 240" />
            <path className="storybook-chart-gridline bottom" d="M 0 60 H 240" />
            {path && <path className="storybook-chart-line" d={path} />}
          </svg>
        </section>
        {lastResult && (
          <section className="storybook-ledger-market-context">
            <div className="storybook-ledger-section-head">
              <span>Last trade</span>
              <strong>{futuresChoiceLabels[lastResult.choice]}</strong>
            </div>
            <div className="storybook-market-row">
              <span>Contract investment</span>
              <strong>{formatFuturesMoney(lastResult.contractInvestment)}</strong>
              <em>P/L {formatFuturesMoney(lastResult.futuresPnL)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Capital gains tax</span>
              <strong>{formatFuturesMoney(lastResult.tax)}</strong>
              <em>Contract move {formatFuturesPercent(lastResult.commodityReturn)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Contract term</span>
              <strong>{formatFuturesSpan(lastResult.event.date, lastResult.target.date)}</strong>
              <em>Settled {formatDateLong(lastResult.target.date)}</em>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function FuturesIndexOverlay({
  game,
  onClose,
  onSelect,
}: {
  game: FuturesFortuneState;
  onClose: () => void;
  onSelect: (targetIndex: number) => void;
}) {
  const futureEntries = game.events
    .map((event, index) => ({ event, index }))
    .filter(({ index }) => index > game.currentIndex);
  const grouped = futureEntries.reduce<Record<string, Array<{ event: FuturesHeadlineEvent; index: number }>>>((acc, entry) => {
    const year = entry.event.date.slice(0, 4);
    acc[year] = [...(acc[year] ?? []), entry];
    return acc;
  }, {});
  const years = Object.keys(grouped).sort();
  const [openYear, setOpenYear] = useState(years[0] ?? "");

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Harvest index">
      <article className="storybook-chapter-page futures-index-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close harvest index">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Harvest Index</p>
        <h2>Pick any future page</h2>
        <p>Choose a future headline. You cannot move backward once time advances.</p>
        <div className="storybook-year-book">
          {years.map((year) => (
            <section key={year} className={`storybook-year-chapter ${openYear === year ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenYear(openYear === year ? "" : year)}>
                <strong>{year}</strong>
                <span>{grouped[year].length} harvests</span>
                <ChevronDown size={16} />
              </button>
              {openYear === year && (
                <div>
                  {grouped[year].slice(0, 14).map(({ event, index }) => (
                    <article key={event.id} className={`storybook-chapter-entry ${event.major ? "major" : ""}`}>
                      <div>
                        <span>{formatDateLong(event.date)}</span>
                        <strong>{event.headline}</strong>
                        <em>{event.deck}</em>
                      </div>
                      <button className="primary-action legacy-primary compact storybook-chapter-play-button" type="button" onClick={() => onSelect(index)}>
                        Play
                        <ChevronRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
          <button className="primary-action legacy-primary futures-final-expiry" type="button" onClick={() => onSelect(game.events.length)}>
            Skip to final harvest
            <ChevronRight size={16} />
          </button>
        </div>
      </article>
    </div>
  );
}

function FuturesTransitionOverlay({ game, result }: { game: FuturesFortuneState; result: FuturesResult }) {
  return (
    <TimeJumpTransitionOverlay
      formatDateLong={formatDateLong}
      formatDateWithWeekday={formatDateWithWeekday}
      formatMoney={formatFuturesMoney}
      formatMoneyDelta={formatFuturesMoneyDelta}
      formatPercent={formatFuturesPercent}
      transition={createFuturesTimeJumpTransition(game, result)}
    />
  );
}

function FuturesLessonPopup({
  lesson,
  result,
  onClose,
}: {
  lesson: ReturnType<typeof createFuturesLearningCards>;
  result: FuturesResult;
  onClose: () => void;
}) {
  return (
    <aside className={`futures-lesson-popup fullscreen ${lesson.tone}`} aria-label="Futures financial math" aria-modal="true" role="dialog" onClick={onClose}>
      <button className="futures-lesson-close" type="button" onClick={onClose} aria-label="Continue to the next headline">
        <X size={14} />
        <span>Continue</span>
      </button>
      <div className="futures-lesson-inner">
        <header className="futures-lesson-header">
          <span>{lesson.title}</span>
          <strong>{lesson.formula}</strong>
          <small>Click anywhere to close and continue.</small>
        </header>

        <FuturesTransactionVisual result={result} />

        <div className="futures-happened-copy">
          <h3>So Here's What Happened</h3>
          <p>{getFuturesLessonExplanation(result)}</p>
        </div>

        <section className="futures-math-rows">
          {lesson.cards.map((card) => (
            <article key={`${card.marker}-${card.label}`}>
              <b>{card.marker}</b>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <p>{card.detail}</p>
            </article>
          ))}
        </section>
      </div>
    </aside>
  );
}

function FuturesFinalScreen({ game, onRestart }: { game: FuturesFortuneState; onRestart: () => void }) {
  const [finalJournalOpen, setFinalJournalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<LeaderboardSubmittedEntry | null>(null);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  const totalTaxPaid = game.results.reduce((total, result) => total + result.tax, 0);
  const totalContractInvestment = game.results.reduce((total, result) => total + result.contractInvestment, 0);
  const profitableTrades = game.results.filter((result) => result.profit >= 0).length;
  const performancePoints = getFuturesPerformancePoints(game);
  const finalRecap = getFuturesFinalRecap(game);
  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell complete futures-fortune-shell">
      <section className="storybook-final-book last-edition futures-final-book">
        <header className="storybook-final-head">
          <p className="storybook-game-title">Harvest Ledger</p>
          <p className="eyebrow">Ten Years Later · {formatDateLong(futuresEndDate)}</p>
          <h1>Final Harvest</h1>
          <span>{getFuturesFinalRank(game)}</span>
        </header>
        <section className="storybook-final-scoreboard" aria-label="Futures strategy comparison">
          <article className="storybook-final-player-score">
            <span>Riley's account</span>
            <strong>{formatFuturesMoney(game.bankroll)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatFuturesPercent(gainPercent)} after {formatFuturesMoney(totalTaxPaid)} in capital gains tax</em>
          </article>
          <div className="storybook-final-rivals">
            <article>
              <span>Corn</span>
              <strong>{formatFuturesMoney(game.cornBenchmark)}</strong>
              <em>{formatFuturesPercent(getFuturesStartingGain(game.cornBenchmark))} buy-and-hold corn</em>
              <small className={game.bankroll >= game.cornBenchmark ? "positive" : "negative"}>
                {getFuturesStrategyGap(game.bankroll, game.cornBenchmark, "Corn")}
              </small>
            </article>
            <article>
              <span>Soybeans</span>
              <strong>{formatFuturesMoney(game.soybeanBenchmark)}</strong>
              <em>{formatFuturesPercent(getFuturesStartingGain(game.soybeanBenchmark))} buy-and-hold soybeans</em>
              <small className={game.bankroll >= game.soybeanBenchmark ? "positive" : "negative"}>
                {getFuturesStrategyGap(game.bankroll, game.soybeanBenchmark, "Soybeans")}
              </small>
            </article>
            <article>
              <span>Wheat</span>
              <strong>{formatFuturesMoney(game.wheatBenchmark)}</strong>
              <em>{formatFuturesPercent(getFuturesStartingGain(game.wheatBenchmark))} buy-and-hold wheat</em>
              <small className={game.bankroll >= game.wheatBenchmark ? "positive" : "negative"}>
                {getFuturesStrategyGap(game.bankroll, game.wheatBenchmark, "Wheat")}
              </small>
            </article>
            <article>
              <span>Treasury bills</span>
              <strong>{formatFuturesMoney(game.billsBenchmark)}</strong>
              <em>{formatFuturesPercent(getFuturesStartingGain(game.billsBenchmark))} bills benchmark</em>
              <small className={game.bankroll >= game.billsBenchmark ? "positive" : "negative"}>
                {getFuturesStrategyGap(game.bankroll, game.billsBenchmark, "T-Bills")}
              </small>
            </article>
            <article>
              <span>Perfect tape</span>
              <strong>{formatFuturesMoney(game.perfectTape)}</strong>
              <em>{formatFuturesPercent(getFuturesStartingGain(game.perfectTape))} best choice each window</em>
              <small className={game.bankroll >= game.perfectTape ? "positive" : "negative"}>
                {getFuturesStrategyGap(game.bankroll, game.perfectTape, "Perfect tape")}
              </small>
            </article>
          </div>
        </section>

        <section className="storybook-final-analytics" aria-label="Final futures performance charts">
          <ResultsPerformanceChart
            ariaLabel="Line chart comparing Riley, corn, soybeans, and wheat by futures trade"
            endDate={futuresEndDate}
            formatMoney={formatFuturesMoney}
            points={performancePoints}
            series={[
              { key: "riley", label: "Riley", className: "jonah" },
              { key: "corn", label: "Corn", className: "eli" },
              { key: "soybeans", label: "Soy", className: "ruth" },
              { key: "wheat", label: "Wheat", className: "wheat" },
            ]}
            startDate={futuresStartDate}
            summary={formatCountNoun(Math.max(0, performancePoints.length - 1), "settled trade")}
          />
          <ResultsMoveImpactChart
            ariaLabel="Bar chart showing Riley's gain or loss after each futures trade"
            formatMoneyDelta={formatFuturesMoneyDelta}
            impacts={game.results.map((result) => ({ date: result.target.date, profit: result.profit }))}
          />
        </section>

        <section className="storybook-final-metrics" aria-label="Futures performance metrics">
          <article>
            <span>Trades made</span>
            <strong>{game.results.length}</strong>
            <em>{formatCountNoun(profitableTrades, "winner")}</em>
          </article>
          <article>
            <span>Contract investment</span>
            <strong>{formatFuturesMoney(totalContractInvestment)}</strong>
            <em>{formatFuturesPercent(totalContractInvestment > 0 ? (totalContractInvestment / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
          <article>
            <span>Capital gains tax</span>
            <strong>{formatFuturesMoney(totalTaxPaid)}</strong>
            <em>{formatFuturesPercent(totalTaxPaid > 0 ? (totalTaxPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
        </section>

        <section className="storybook-final-overview storybook-final-trade-recap" aria-label="Trade recap and recommended strategy">
          <div>
            <WalletCards size={18} />
            <span>Trade recap</span>
          </div>
          <p>{finalRecap.choiceSummary}</p>
          <p>{finalRecap.impactSummary}</p>
          <p>{finalRecap.bestMove}</p>
          <p>{finalRecap.worstMove}</p>
          <p>{finalRecap.rulesSummary}</p>
          <article className="storybook-final-strategy-note">
            <span>{finalRecap.recommendation.title}</span>
            <p>{finalRecap.recommendation.text}</p>
          </article>
        </section>

        <div className="storybook-final-actions">
          <button className="primary-action legacy-primary" type="button" onClick={() => setFinalJournalOpen(true)}>
            <BookOpen size={18} />
            Read Final Journal Entry
          </button>
          <button className="secondary-action" type="button" onClick={() => setLeaderboardOpen(true)}>
            <Trophy size={18} />
            Post Your Score and See How You Rank
          </button>
          <a className="primary-action legacy-primary" href="/games/sector-oracle">
            Play Next: Sector Oracle
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
          <p>{futuresStory.ending}</p>
          <p>
            Riley started with {formatFuturesMoney(startingBankroll)}, her granddad's grain ledger, and a decade of future clippings about droughts, floods, trade fights, crop reports, and storms. Every jump asked which contract deserved the risk until the next headline arrived.
          </p>
        </section>
      </section>
      {finalJournalOpen && <FuturesFinalJournalOverlay game={game} onClose={() => setFinalJournalOpen(false)} />}
      {leaderboardOpen && (
        <InvestmentLeaderboardOverlay
          benchmarkRows={[
            {
              detail: "Corn futures buy-and-hold",
              id: "futures-corn-benchmark",
              label: "Corn",
              returnPercent: getFuturesStartingGain(game.cornBenchmark),
              score: game.cornBenchmark,
            },
            {
              detail: "Soybean futures buy-and-hold",
              id: "futures-soybean-benchmark",
              label: "Soybeans",
              returnPercent: getFuturesStartingGain(game.soybeanBenchmark),
              score: game.soybeanBenchmark,
            },
            {
              detail: "Wheat futures buy-and-hold",
              id: "futures-wheat-benchmark",
              label: "Wheat",
              returnPercent: getFuturesStartingGain(game.wheatBenchmark),
              score: game.wheatBenchmark,
            },
            {
              detail: "Best grain choice each window",
              id: "futures-perfect-benchmark",
              label: "Perfect tape",
              returnPercent: getFuturesStartingGain(game.perfectTape),
              score: game.perfectTape,
            },
          ]}
          currentRunDetail={`${formatCountNoun(game.results.length, "trade")} · ${formatFuturesMoney(totalTaxPaid)} tax`}
          formatDateLong={formatDateLong}
          formatMoney={formatFuturesMoney}
          formatPercent={formatFuturesPercent}
          gameSlug="harvest-ledger"
          gameTitle="Harvest Ledger"
          moves={game.results.length}
          onClose={() => setLeaderboardOpen(false)}
          onSubmitted={setSubmittedScore}
          periodLabel="10 years"
          reallocations={game.results.filter((result, index, results) => index > 0 && result.choice !== results[index - 1]?.choice).length}
          returnPercent={gainPercent}
          score={game.bankroll}
          storageKey="charged-alpha-futures-fortune-leaderboard"
          submittedEntry={submittedScore}
          taxPaid={totalTaxPaid}
        />
      )}
    </main>
  );
}

const futuresCompactDashboardQuery = "(max-width: 700px)";

function getMatchesFuturesCompactDashboard() {
  return typeof window !== "undefined" && window.matchMedia(futuresCompactDashboardQuery).matches;
}

function useFuturesCompactDashboard() {
  const [compact, setCompact] = useState(getMatchesFuturesCompactDashboard);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const query = window.matchMedia(futuresCompactDashboardQuery);
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

export function FuturesFortuneGame() {
  const [game, setGame] = useState(createFuturesFortune);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [transitionResult, setTransitionResult] = useState<FuturesResult | null>(null);
  const [lessonResult, setLessonResult] = useState<FuturesResult | null>(null);
  const compactDashboard = useFuturesCompactDashboard();
  const transitionTimerRef = useRef<number | null>(null);
  const currentEvent = getCurrentFuturesEvent(game);
  const selectedTarget = getSelectedFuturesTarget(game);
  const lastResult = game.results.at(-1);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const begin = () => {
    const next = startFuturesFortune(game);
    setGame(next);
    setGuideOpen(true);
  };

  const restart = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setGame(resetFuturesFortune());
    setOverlay(null);
    setGuideOpen(false);
    setTransitionResult(null);
    setLessonResult(null);
  };

  const play = () => {
    setLessonResult(null);
    setGame((current) => {
      const next = playFuturesRound(current);
      const result = next.results.at(-1);
      if (result && result !== current.results.at(-1)) {
        setTransitionResult(result);
        if (transitionTimerRef.current) {
          window.clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = window.setTimeout(() => {
          setTransitionResult(null);
          setLessonResult(result);
          transitionTimerRef.current = null;
        }, timeJumpTransitionDurationMs);
      }
      return next;
    });
  };

  if (game.phase === "intro") {
    return <FuturesIntro game={game} onBegin={begin} />;
  }

  if (game.phase === "complete") {
    return (
      <>
        <FuturesFinalScreen game={game} onRestart={restart} />
        {transitionResult && <FuturesTransitionOverlay game={game} result={transitionResult} />}
        {lessonResult && !transitionResult && (
          <FuturesLessonPopup lesson={createFuturesLearningCards(lessonResult)} result={lessonResult} onClose={() => setLessonResult(null)} />
        )}
      </>
    );
  }

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell choose futures-fortune-shell">
      <section className="storybook-play-book dashboard-book futures-dashboard-book">
        <header className="storybook-play-head">
          <div className="storybook-top-portfolio" data-guide-target="portfolio-status">
            <span>Page {game.currentIndex + 1} / {game.events.length} · {formatDateLong(currentEvent.date)}</span>
            <strong>{formatFuturesMoney(game.bankroll)}</strong>
            <em className={`storybook-top-performance ${getTone(gain)}`}>{formatFuturesMoney(gain)} / {formatFuturesPercent(gainPercent)}</em>
            <small>{futuresChoiceLabels[game.choice]}</small>
          </div>
          <button className="icon-reset secondary-action compact" type="button" onClick={restart} aria-label="Reset Harvest Ledger">
            <RotateCcw size={15} />
          </button>
        </header>

        <div className="storybook-one-screen dashboard-clean futures-one-screen">
          {compactDashboard && <FuturesPreviewCard target={selectedTarget} lastResult={lastResult} onOpen={() => setOverlay("article")} />}
          <FuturesDateConsole
            compact={compactDashboard}
            game={game}
            onChoose={(choice) => setGame((current) => setFuturesChoice(current, choice))}
            onOpenIndex={() => setOverlay("index")}
            onPlay={play}
            onSelectTarget={(targetIndex) => setGame((current) => setFuturesTargetIndex(current, targetIndex))}
          />
          {!compactDashboard && <FuturesPreviewCard target={selectedTarget} lastResult={lastResult} onOpen={() => setOverlay("article")} />}
        </div>

        <nav className="storybook-bottom-tabs" aria-label="Game and story pages">
          <button type="button" onClick={() => setOverlay("journal")} data-guide-target="journal">
            <BookOpen size={15} />
            Journal
          </button>
          <button type="button" onClick={() => setOverlay("ledger")} data-guide-target="ledger-button">
            <WalletCards size={15} />
            Ledger
          </button>
          <button type="button" onClick={() => setOverlay("article")} data-guide-target="current-page-button">
            <Newspaper size={15} />
            Front Page
          </button>
        </nav>
      </section>

      {transitionResult && <FuturesTransitionOverlay game={game} result={transitionResult} />}
      {lessonResult && !transitionResult && !guideOpen && !overlay && (
        <FuturesLessonPopup lesson={createFuturesLearningCards(lessonResult)} result={lessonResult} onClose={() => setLessonResult(null)} />
      )}
      {guideOpen && <FuturesDashboardGuide compact={compactDashboard} onStart={() => setGuideOpen(false)} />}
      {overlay === "article" && <FuturesArticleOverlay target={selectedTarget} onClose={() => setOverlay(null)} />}
      {overlay === "journal" && <FuturesJournalOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "ledger" && <FuturesLedgerOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "index" && (
        <FuturesIndexOverlay
          game={game}
          onClose={() => setOverlay(null)}
          onSelect={(targetIndex) => {
            setGame((current) => setFuturesTargetIndex(current, targetIndex));
            setOverlay(null);
          }}
        />
      )}
      <p className="compliance-disclaimer">Educational simulation. Futures involve risk and can expire worthless.</p>
    </main>
  );
}
