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
  RotateCcw,
  SlidersHorizontal,
  Trophy,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  HighScoreToBeatBanner,
  InvestmentLeaderboardOverlay,
  ResultsMoveImpactChart,
  ResultsPerformanceChart,
  type LeaderboardSubmittedEntry,
  type ResultsChartPoint,
} from "../../shared/game-ui/InvestmentResults";
import { TargetGuideOverlay } from "../../shared/game-ui/TargetGuideOverlay";
import {
  buildInterpolatedTimeJumpPoints,
  TimeJumpTransitionOverlay,
  timeJumpTransitionDurationMs,
  type TimeJumpCloseSnapshot,
  type TimeJumpEntry,
  type TimeJumpTargetChartModel,
  type TimeJumpTargetRecapModel,
  type TimeJumpTransitionModel,
} from "../../shared/game-ui/TimeJumpTransition";
import { assetUrl } from "../../shared/assets";
import { HeadlineEventImage } from "../headline-market/components/HeadlineEventImage";
import type { HeadlineEvent } from "../headline-market/content/events";
import { sp500DailySeries } from "../headline-market/content/marketHistory";
import {
  calculateEarlyCloseOptionOutcome,
  calculateOptionOutcome,
  closeLatestOptionsResult,
  createOptionsFortune,
  formatOptionsMoney,
  formatOptionsPercent,
  formatOptionsSpan,
  getCurrentOptionsEvent,
  getOptionsTarget,
  getProgressPercent,
  getProjectedOutcomes,
  getSelectedOptionsTarget,
  getVolatilityLensUnlockDate,
  getVolatilityLensUnlockProgress,
  isVolatilityLensUnlocked,
  optionChoiceLabels,
  optionChoiceOrder,
  optionChoiceShortLabels,
  optionTaxRate,
  optionsEndDate,
  optionsStartDate,
  playOptionsRound,
  resetOptionsFortune,
  setOptionsChoice,
  setOptionsTargetIndex,
  startOptionsFortune,
  startingBankroll,
  type OptionChoice,
  type OptionOutcome,
  type OptionsFortuneState,
  type OptionsResult,
  type OptionsTarget,
} from "./simulation/optionsFortune";
import {
  optionsChronicleName,
  optionsCompactDashboardGuideItems,
  optionsDashboardGuideItems,
  optionsPrologueDate,
  optionsStory,
} from "./content/optionsCopy";

type IntroPage = "setup" | "rules";
type Overlay = "journal" | "ledger" | "article" | "index" | null;

const optionsBillsTransitionDurationMs = 2000;
const optionsOptionTransitionDurationMs = Math.round(timeJumpTransitionDurationMs * 0.8);

const optionIcons: Record<OptionChoice, typeof Landmark> = {
  bills: Landmark,
  calls: TrendingUp,
  puts: TrendingDown,
  straddle: SlidersHorizontal,
};

const optionsContractRuleSummary =
  "Contract rule: each option trade is a modeled SPX-style, cash-settled, European-style at-the-money option. The strike is set to the S&P 500 close on the current headline date, expiration is the future headline date you choose, premium is priced with historical CBOE VIX closes, and Mara buys as many whole contracts as her cash can afford. Leftover cash waits in T-Bills.";

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

function getPreviewParagraph(event: HeadlineEvent | undefined, isFinal = false) {
  if (isFinal) {
    return "The final expiration arrives. Mara closes the quote case and compares every option decision against the simple paths she could have taken instead.";
  }
  return event?.newspaperArticle?.lede ?? event?.summary ?? event?.setup ?? "A future headline reaches Mara's desk with just enough information to tempt a trade.";
}

function getTargetHeadline(target: OptionsTarget) {
  return target.isFinal ? "Final expiration: the option tape is settled" : target.event?.headline ?? target.label;
}

function getTargetDeck(target: OptionsTarget) {
  return target.isFinal ? "The decade closes and every premium, payoff, and tax bill comes due." : target.event?.deck ?? "Future headline";
}

function getTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getOutcomeHeat(outcome: OptionOutcome, unlocked: boolean) {
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

function getOptionsContractTermLabel(startDate: string, endDate: string) {
  return `Term ${formatOptionsSpan(startDate, endDate)} · expires ${formatDateLong(endDate)}`;
}

function getOptionsContractTermShortLabel(startDate: string, endDate: string) {
  return `Term: ${formatOptionsSpan(startDate, endDate)}`;
}

function getPreviousOptionChoice(game: OptionsFortuneState): OptionChoice {
  return game.results.at(-1)?.choice ?? "bills";
}

function chooseNearestTargetIndex(game: OptionsFortuneState, progressPercent: number) {
  const minimum = game.currentIndex + 1;
  const boundedProgress = Math.max(0, Math.min(100, progressPercent));
  let closestIndex = minimum;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = minimum; index <= game.events.length; index += 1) {
    const distance = Math.abs(getProgressPercent(game, index) - boundedProgress);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

function buildOptionSparkline(results: OptionsResult[], currentValue: number) {
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

function formatOptionsMoneyDelta(value: number) {
  const absolute = formatOptionsMoney(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return "$0";
}

function formatOptionsContractCount(count: number) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "contract" : "contracts"}`;
}

function getOptionsContractPurchaseLabel(outcome: OptionOutcome) {
  if (outcome.choice === "bills") {
    return "No option contracts";
  }
  if (outcome.contractCount <= 0) {
    return `0 contracts · needs ${formatOptionsMoney(outcome.premiumPerContract)} each`;
  }
  return `${formatOptionsContractCount(outcome.contractCount)} at ${formatOptionsMoney(outcome.premiumPerContract)} each`;
}

function formatUnsignedOptionsPercent(value: number) {
  return formatOptionsPercent(value).replace("+", "");
}

function formatOptionsIndexPrice(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value >= 1000 ? 0 : 1,
    minimumFractionDigits: value < 1000 ? 1 : 0,
  });
}

function getOptionsPriceTarget(result: OptionsResult) {
  const startPrice = result.event.startClose;
  const comparisonPrice = result.earlyClose?.sp500 ?? result.target.sp500;
  const move = result.breakEvenMove / 100;
  const upperTarget = startPrice * (1 + move);
  const lowerTarget = Math.max(0, startPrice * (1 - move));

  if (result.choice === "calls") {
    return {
      hit: comparisonPrice >= upperTarget,
      lowerTarget: undefined,
      targetKind: "above" as const,
      targetLabel: `S&P above ${formatOptionsIndexPrice(upperTarget)}`,
      upperTarget,
    };
  }
  if (result.choice === "puts") {
    return {
      hit: comparisonPrice <= lowerTarget,
      lowerTarget,
      targetKind: "below" as const,
      targetLabel: `S&P below ${formatOptionsIndexPrice(lowerTarget)}`,
      upperTarget: undefined,
    };
  }
  if (result.choice === "straddle") {
    return {
      hit: comparisonPrice <= lowerTarget || comparisonPrice >= upperTarget,
      lowerTarget,
      targetKind: "outside" as const,
      targetLabel: `Below ${formatOptionsIndexPrice(lowerTarget)} or above ${formatOptionsIndexPrice(upperTarget)}`,
      upperTarget,
    };
  }

  return {
    hit: true,
    lowerTarget: undefined,
    targetKind: "none" as const,
    targetLabel: "No option target",
    upperTarget: undefined,
  };
}

function isOptionsPriceInProfitZone(choice: OptionChoice, target: ReturnType<typeof getOptionsPriceTarget>, price: number) {
  if (choice === "calls") {
    return Number.isFinite(target.upperTarget) && price >= (target.upperTarget ?? Number.POSITIVE_INFINITY);
  }
  if (choice === "puts") {
    return Number.isFinite(target.lowerTarget) && price <= (target.lowerTarget ?? Number.NEGATIVE_INFINITY);
  }
  if (choice === "straddle") {
    const belowLower = Number.isFinite(target.lowerTarget) && price <= (target.lowerTarget ?? Number.NEGATIVE_INFINITY);
    const aboveUpper = Number.isFinite(target.upperTarget) && price >= (target.upperTarget ?? Number.POSITIVE_INFINITY);
    return belowLower || aboveUpper;
  }
  return false;
}

function sampleOptionsPricePoints(points: { date: string; value: number }[], maximumPoints = 46) {
  if (points.length <= maximumPoints) {
    return points;
  }

  const sampledIndexes = new Set<number>([0, points.length - 1]);
  for (let index = 0; index < maximumPoints; index += 1) {
    sampledIndexes.add(Math.round((index / Math.max(1, maximumPoints - 1)) * (points.length - 1)));
  }

  return [...sampledIndexes].sort((a, b) => a - b).map((index) => points[index]);
}

function buildOptionsFullStockPricePoints(result: OptionsResult) {
  const byDate = new Map<string, { date: string; value: number }>();

  byDate.set(result.event.date, { date: result.event.date, value: result.event.startClose });
  sp500DailySeries
    .filter((entry) => entry.date >= result.event.date && entry.date <= result.target.date)
    .forEach((entry) => byDate.set(entry.date, { date: entry.date, value: entry.value }));
  if (result.earlyClose) {
    byDate.set(result.earlyClose.date, { date: result.earlyClose.date, value: result.earlyClose.sp500 });
  }
  byDate.set(result.target.date, { date: result.target.date, value: result.target.sp500 });

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildOptionsStockPricePoints(result: OptionsResult) {
  return sampleOptionsPricePoints(buildOptionsFullStockPricePoints(result), 64);
}

function buildOptionsLiveValuePoints(result: OptionsResult, pricePoints: { date: string; value: number }[]) {
  const startTime = new Date(`${result.event.date}T00:00:00Z`).getTime();
  const endTime = new Date(`${result.target.date}T00:00:00Z`).getTime();
  const duration = Math.max(1, endTime - startTime);

  return pricePoints.map((point) => {
    const pointTime = new Date(`${point.date}T00:00:00Z`).getTime();
    const progress = Math.max(0, Math.min(1, (pointTime - startTime) / duration));
    const outcome = calculateEarlyCloseOptionOutcome({
      bankroll: result.startingBankroll,
      choice: result.choice,
      closeDate: point.date,
      closeProgress: progress,
      closeSp500: point.value,
      event: result.event,
      target: result.target,
    });

    return {
      date: point.date,
      value: outcome.earlyClose?.accountAfterClose ?? outcome.endingBankroll,
    };
  });
}

function buildOptionsLivePayoffPoints(result: OptionsResult, pricePoints: { date: string; value: number }[]) {
  const startTime = new Date(`${result.event.date}T00:00:00Z`).getTime();
  const endTime = new Date(`${result.target.date}T00:00:00Z`).getTime();
  const duration = Math.max(1, endTime - startTime);

  return pricePoints.map((point) => {
    const pointTime = new Date(`${point.date}T00:00:00Z`).getTime();
    const progress = Math.max(0, Math.min(1, (pointTime - startTime) / duration));
    const outcome = calculateEarlyCloseOptionOutcome({
      bankroll: result.startingBankroll,
      choice: result.choice,
      closeDate: point.date,
      closeProgress: progress,
      closeSp500: point.value,
      event: result.event,
      target: result.target,
    });

    return {
      date: point.date,
      value: outcome.payoff,
    };
  });
}

function getBestOptionsStopForChoice(result: OptionsResult) {
  if (result.choice === "bills") {
    return null;
  }

  const priceTarget = getOptionsPriceTarget(result);
  const startTime = new Date(`${result.event.date}T00:00:00Z`).getTime();
  const endTime = new Date(`${result.target.date}T00:00:00Z`).getTime();
  const duration = Math.max(1, endTime - startTime);
  const candidates = buildOptionsFullStockPricePoints(result)
    .filter((point) => point.date > result.event.date && point.date <= result.target.date)
    .filter((point) => isOptionsPriceInProfitZone(result.choice, priceTarget, point.value))
    .map((point) => {
      const closeTime = new Date(`${point.date}T00:00:00Z`).getTime();
      const outcome = calculateEarlyCloseOptionOutcome({
        bankroll: result.startingBankroll,
        choice: result.choice,
        closeDate: point.date,
        closeProgress: Math.max(0, Math.min(1, (closeTime - startTime) / duration)),
        closeSp500: point.value,
        event: result.event,
        target: result.target,
      });

      return {
        date: point.date,
        outcome,
        sp500: point.value,
      };
    });

  return candidates.sort((a, b) => b.outcome.endingBankroll - a.outcome.endingBankroll)[0] ?? null;
}

function getOptionsBillInterest(result: OptionsResult) {
  if (result.choice === "bills") {
    return result.endingBankroll - result.startingBankroll;
  }
  if (result.earlyClose) {
    const closeGrossValue = result.earlyClose.accountAfterClose + result.earlyClose.closeTax;
    const cashSideAtClose = closeGrossValue - result.payoff;
    const cashInterestBeforeClose = cashSideAtClose - result.collateral;
    const cashInterestAfterClose = result.endingBankroll - result.earlyClose.accountAfterClose;
    return cashInterestBeforeClose + cashInterestAfterClose;
  }

  return result.collateral * (result.billReturn / 100);
}

function getOptionsTradePrinciple(result: OptionsResult) {
  if (result.choice === "calls") {
    return "A call is an upside ticket: it grows when the S&P rises far enough, soon enough, to beat the premium.";
  }
  if (result.choice === "puts") {
    return "A put is a downside ticket: it grows when the S&P falls far enough, soon enough, to beat the premium.";
  }
  return "A straddle buys both directions: it needs a huge move up or down because Mara paid for two tickets.";
}

function getOptionsDirectionRecap(result: OptionsResult) {
  const closePrice = result.earlyClose?.sp500 ?? result.target.sp500;
  const movePercent = ((closePrice - result.event.startClose) / result.event.startClose) * 100;
  const moveSize = Math.abs(movePercent);
  const actualMove =
    moveSize < 0.05
      ? "the S&P barely moved from the strike"
      : `the S&P went ${movePercent > 0 ? "up" : "down"} ${formatUnsignedOptionsPercent(moveSize)} from the strike`;

  if (result.choice === "calls") {
    return `Direction: call wanted a sharp move up; ${actualMove}.`;
  }
  if (result.choice === "puts") {
    return `Direction: put wanted a sharp move down; ${actualMove}.`;
  }
  return `Direction: straddle wanted a big move up or down; ${actualMove}.`;
}

function getOptionsTradeWhy({
  finalProfit,
  premiumResult,
  priceTarget,
  result,
}: {
  finalProfit: number;
  premiumResult: number;
  priceTarget: ReturnType<typeof getOptionsPriceTarget>;
  result: OptionsResult;
}) {
  const overallResult = finalProfit < 0 ? `Lost ${formatOptionsMoney(Math.abs(finalProfit))} overall` : `Made ${formatOptionsMoney(finalProfit)} overall`;
  const optionLost = premiumResult < 0;
  const ticketResult =
    optionLost
      ? `the option ticket lost ${formatOptionsMoney(Math.abs(premiumResult))}`
      : `the option ticket made ${formatOptionsMoney(premiumResult)} after premium`;
  const closeVerb = result.earlyClose ? "when Mara stopped it" : "by expiration";

  if (optionLost) {
    const reason =
      result.payoff <= 0.5
        ? `the S&P never reached ${priceTarget.targetLabel}, so the option paid $0`
        : `the S&P moved some, but not enough to cover the ${formatOptionsMoney(result.optionBudget)} premium`;
    return `${overallResult}; ${ticketResult} because ${reason} ${closeVerb}.`;
  }

  if (result.choice === "straddle") {
    return `${overallResult}; ${ticketResult} because the S&P moved far enough away from the strike to beat both premiums.`;
  }

  return `${overallResult}; ${ticketResult} because the S&P crossed ${priceTarget.targetLabel} ${closeVerb}.`;
}

function getOptionsTradeLesson(result: OptionsResult, premiumResult: number, bestStopSentence: string) {
  const timeValueLesson =
    "Downside: an option is not stock. You bought time value, so the ticket can shrink as days pass and can expire worthless even if the headline was partly right.";

  if (premiumResult < 0) {
    return `${timeValueLesson} ${bestStopSentence}`;
  }

  return `${getOptionsTradePrinciple(result)} Time still matters: closing in the green zone can beat waiting for expiration. ${bestStopSentence}`;
}

function createOptionsTradeRecap(result: OptionsResult, bestStop = getBestOptionsStopForChoice(result)): TimeJumpTargetRecapModel | undefined {
  if (result.choice === "bills") {
    return undefined;
  }

  const priceTarget = getOptionsPriceTarget(result);
  const finalProfit = result.endingBankroll - result.startingBankroll;
  const premiumResult = result.payoff - result.optionBudget;
  const billInterest = getOptionsBillInterest(result);
  const taxPaid = result.earlyClose?.closeTax ?? result.tax;
  const taxRateLabel = `${Math.round(optionTaxRate * 100)}% short-term option tax`;
  const billsItem =
    Math.abs(billInterest) > 0.5
      ? [
          {
            detail: result.earlyClose ? "Cash earned before/after close" : "Cash side while option ran",
            label: "T-bill interest",
            tone: billInterest >= 0 ? ("gain" as const) : ("loss" as const),
            value: formatOptionsMoneyDelta(billInterest),
          },
        ]
      : [];
  const taxItem =
    taxPaid > 0.5
      ? [
          {
            detail: taxRateLabel,
            label: "Tax paid",
            tone: "tax" as const,
            value: formatOptionsMoney(taxPaid),
          },
        ]
      : [];
  const payoffDetail =
    result.payoff <= 0.5
      ? `Target missed; the option paid $0`
      : `${formatOptionsMoneyDelta(premiumResult)} after premium`;
  const stoppedLabel = result.earlyClose
    ? `Stopped at S&P ${formatOptionsIndexPrice(result.earlyClose.sp500)}`
    : `Expired at S&P ${formatOptionsIndexPrice(result.target.sp500)}`;
  const neededLabel = `Needed ${priceTarget.targetLabel}`;
  const resultTone = finalProfit > 0 ? "gain" : finalProfit < 0 ? "loss" : "neutral";
  const bestStopGain = bestStop ? bestStop.outcome.profit : null;
  const bestStopDifference = bestStop ? bestStop.outcome.endingBankroll - result.endingBankroll : 0;
  const title =
    finalProfit < 0
      ? "Money Lost"
      : result.earlyClose
        ? "Good Stop"
        : priceTarget.hit
          ? "Ticket Won"
          : result.payoff <= 0.5
            ? "Expired Worthless"
            : "Premium Trap";
  const bestStopSentence =
    bestStop && bestStopDifference > 1
      ? result.earlyClose
        ? `Star = best stop. You missed that green-zone moment by about ${formatOptionsMoney(bestStopDifference)}.`
        : `Star = best timed exit. Letting it expire left about ${formatOptionsMoney(bestStopDifference)} versus closing there.`
      : bestStop
        ? result.earlyClose
          ? `Star = best stop. Your close was near the best timing this window offered.`
        : `Star = best timed exit. Expiration was near the best result this window offered.`
        : `No green-zone stop appeared. The stock never crossed the profit line before the ticket ran out.`;
  const taxPhrase = taxPaid > 0.5 ? ` and ${formatOptionsMoney(taxPaid)} tax` : "";
  const directionRecap = getOptionsDirectionRecap(result);
  const tradeWhy = getOptionsTradeWhy({ finalProfit, premiumResult, priceTarget, result });
  const footer = `${getOptionsTradeLesson(result, premiumResult, bestStopSentence)} Premium P/L is just the option ticket; final result also includes ${formatOptionsMoney(billInterest)} T-bill interest${taxPhrase}.`;

  return {
    footer,
    items: [
      {
        detail: finalProfit < 0 ? "Lost this play" : "Made this play",
        label: "Money result",
        tone: resultTone,
        value: formatOptionsMoneyDelta(finalProfit),
      },
      {
        detail: `${getOptionsContractPurchaseLabel(result)}; paid ${formatOptionsMoney(result.optionBudget)}; got ${formatOptionsMoney(result.payoff)}`,
        label: "Premium P/L",
        tone: premiumResult >= 0 ? "gain" : "loss",
        value: formatOptionsMoneyDelta(premiumResult),
      },
      {
        detail: "Option ticket cost",
        label: "Premium paid",
        tone: "loss",
        value: formatOptionsMoneyDelta(-result.optionBudget),
      },
      {
        detail: payoffDetail,
        label: "Option payoff",
        tone: result.payoff > 0.5 ? "gain" : "loss",
        value: formatOptionsMoney(result.payoff),
      },
      ...billsItem,
      ...taxItem,
    ],
    optimal: bestStop
      ? {
          detail: `${formatDateLong(bestStop.date)} at S&P ${formatOptionsIndexPrice(bestStop.sp500)}. ${formatOptionsMoneyDelta(bestStopGain ?? 0)} if closed there.`,
          label: "Best stop example",
          tone: (bestStopGain ?? 0) >= 0 ? "gain" : "loss",
          value: bestStopDifference > 1 ? `${formatOptionsMoneyDelta(bestStopDifference)} better` : "Near this result",
        }
      : {
          detail: `No point in this window crossed ${priceTarget.targetLabel}.`,
          label: "Best stop example",
          tone: "neutral",
          value: "None",
        },
    resultLabel: finalProfit < 0 ? "lost this play" : finalProfit > 0 ? "made this play" : "break-even play",
    resultTone,
    resultValue: formatOptionsMoneyDelta(finalProfit),
    subtitle: `${directionRecap} ${tradeWhy} ${neededLabel}. ${stoppedLabel}.`,
    title,
  };
}

function createOptionsTargetChart(result: OptionsResult): TimeJumpTargetChartModel {
  const priceTarget = getOptionsPriceTarget(result);
  const closingPrice = result.earlyClose?.sp500 ?? result.target.sp500;
  const pricePoints = buildOptionsStockPricePoints(result);
  const bestStop = result.choice === "bills" ? null : getBestOptionsStopForChoice(result);
  const accountAtChartEnd = result.endingBankroll;
  const hitLabel =
    result.choice === "bills"
      ? "No option target"
      : priceTarget.hit
        ? "Premium covered"
        : result.payoff <= 0.5
          ? "Option payoff $0"
          : "Premium not covered";
  return {
    assetLabel: "S&P 500 price",
    bestExitMarker: bestStop
      ? {
          accountLabel: formatOptionsMoney(bestStop.outcome.endingBankroll),
          date: bestStop.date,
          detail: formatOptionsMoneyDelta(bestStop.outcome.profit),
          label: "Best stop",
          tone: "best",
          value: bestStop.sp500,
        }
      : undefined,
    closedEarly: Boolean(result.earlyClose),
    closeMarker: result.choice !== "bills"
      ? {
          accountLabel: formatOptionsMoney(result.endingBankroll),
          date: result.earlyClose?.date ?? result.target.date,
          detail: formatOptionsMoneyDelta(result.profit),
          label: result.earlyClose ? "Your stop" : "Expiration",
          progress: result.earlyClose?.progress,
          tone: priceTarget.hit ? "hit" : "miss",
          value: closingPrice,
        }
      : undefined,
    domainEndDate: result.target.date,
    domainStartDate: result.event.date,
    finalLabel: `${result.earlyClose ? "Close " : ""}S&P ${formatOptionsIndexPrice(closingPrice)}`,
    hit: priceTarget.hit,
    hitLabel,
    lowerTarget: priceTarget.lowerTarget,
    livePayoffLabel: result.choice === "bills" ? undefined : "Option payoff",
    livePayoffPoints: result.choice === "bills" ? undefined : buildOptionsLivePayoffPoints(result, pricePoints),
    livePayoffZeroLabel: "Option payoff $0",
    liveValueLabel: result.earlyClose ? "Stopped net account" : "Net this play if closed",
    liveValuePoints: buildOptionsLiveValuePoints(result, pricePoints),
    liveValueStart: result.startingBankroll,
    moveLabel: result.earlyClose
      ? `Closed ${formatDateLong(result.earlyClose.date)} · bills to headline`
      : result.choice !== "bills" && result.payoff <= 0.5
        ? `Option payoff $0 · ${formatOptionsMoney(result.optionBudget)} premium lost`
        : result.choice !== "bills" && !priceTarget.hit
          ? `Payoff ${formatOptionsMoney(result.payoff)} did not cover ${formatOptionsMoney(result.optionBudget)} premium`
          : `S&P moved ${formatOptionsPercent(result.underlyingReturn)}`,
    points: pricePoints,
    readouts:
      result.choice === "bills"
        ? undefined
        : [
            {
              label: "Premium paid",
              tone: "loss",
              value: formatOptionsMoneyDelta(-result.optionBudget),
            },
            {
              label: "Need to profit",
              tone: "target",
              value: priceTarget.targetLabel,
            },
            {
              label: "Option payoff",
              tone: result.payoff > 0.5 ? "gain" : "loss",
              value: formatOptionsMoney(result.payoff),
            },
            {
              label: result.earlyClose ? "After bills" : "Account at expiry",
              tone: result.profit >= 0 ? "gain" : "loss",
              value: formatOptionsMoney(accountAtChartEnd),
            },
          ],
    recap: createOptionsTradeRecap(result, bestStop),
    startLabel: `S&P ${formatOptionsIndexPrice(result.event.startClose)}`,
    targetKind: priceTarget.targetKind,
    targetLabel: priceTarget.targetLabel,
    upperTarget: priceTarget.upperTarget,
    xAxisLabel: "X: Time",
    yAxisLabel: "Y: S&P",
  };
}

function getOptionBreakEvenLabel(choice: OptionChoice, outcome: OptionOutcome) {
  if (choice === "bills") {
    return "No break-even";
  }
  if (choice === "puts") {
    return `BE -${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
  }
  if (choice === "straddle") {
    return `Needs ±${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
  }
  return `BE +${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
}

function getOptionWinLineLabel(choice: OptionChoice, outcome: OptionOutcome) {
  if (choice === "bills") {
    return "No win line";
  }
  if (choice === "puts") {
    return `Green line -${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
  }
  if (choice === "straddle") {
    return `Green lines ±${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
  }
  return `Green line +${formatUnsignedOptionsPercent(outcome.breakEvenMove)}`;
}

function getOptionKidLabel(choice: OptionChoice) {
  if (choice === "calls") {
    return "Call Option";
  }
  if (choice === "puts") {
    return "Put Option";
  }
  if (choice === "straddle") {
    return "Straddle";
  }
  return "T-Bills";
}

function getOptionChoiceMetricLabel(choice: OptionChoice, outcome: OptionOutcome) {
  if (choice === "bills") {
    return "Safe";
  }
  return formatOptionsContractCount(outcome.contractCount);
}

function getOptionTicketRule(choice: OptionChoice, outcome: OptionOutcome) {
  if (choice === "bills") {
    return "T-Bills: safe investment, slow growth, no strike zone.";
  }
  if (choice === "puts") {
    return `Put target: S&P must fall more than ${formatUnsignedOptionsPercent(outcome.breakEvenMove)} before time runs out.`;
  }
  if (choice === "straddle") {
    return `Straddle target: S&P must move more than ${formatUnsignedOptionsPercent(outcome.breakEvenMove)} either way.`;
  }
  return `Call target: S&P must rise more than ${formatUnsignedOptionsPercent(outcome.breakEvenMove)} before time runs out.`;
}

function projectedOptionSpend(outcome: OptionOutcome) {
  return outcome.optionBudget || outcome.collateral;
}

function getOptionsStartingGain(value: number) {
  return (value / startingBankroll - 1) * 100;
}

function getStrategyGap(playerValue: number, benchmarkValue: number, benchmarkName: string) {
  const gap = playerValue - benchmarkValue;
  if (gap >= 0) {
    return `${formatOptionsMoney(gap)} ahead of ${benchmarkName}`;
  }
  return `${formatOptionsMoney(Math.abs(gap))} behind ${benchmarkName}`;
}

function formatCountNoun(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getOptionsFinalRank(game: OptionsFortuneState) {
  if (game.bankroll >= game.perfectTape * 0.96) {
    return "Tape Reader";
  }
  if (game.bankroll >= game.indexBenchmark && game.bankroll >= game.billsBenchmark) {
    return "Market Beater";
  }
  if (game.bankroll >= startingBankroll) {
    return "Capital Preserved";
  }
  return "Premium Lesson";
}

function getOptionsBestHindsightChoice(result: OptionsResult): OptionChoice {
  return optionChoiceOrder
    .map((choice) => calculateOptionOutcome(result.startingBankroll, result.event, result.target, choice))
    .sort((a, b) => b.endingBankroll - a.endingBankroll)[0]?.choice ?? "bills";
}

function getOptionsChoiceCountSummary(results: OptionsResult[]) {
  const counts = optionChoiceOrder
    .map((choice) => ({
      choice,
      count: results.filter((result) => result.choice === choice).length,
    }))
    .filter(({ count }) => count > 0);

  if (counts.length === 0) {
    return "No trades were placed.";
  }

  return counts.map(({ choice, count }) => `${optionChoiceShortLabels[choice]} ${count}`).join(" / ");
}

function getOptionsRecommendedStrategy(game: OptionsFortuneState) {
  const hindsightCounts = optionChoiceOrder.map((choice) => ({
    choice,
    count: game.results.filter((result) => getOptionsBestHindsightChoice(result) === choice).length,
  }));
  const bestPattern = hindsightCounts.sort((a, b) => b.count - a.count)[0] ?? { choice: "bills" as OptionChoice, count: 0 };
  const total = Math.max(1, game.results.length);

  if (bestPattern.choice === "bills") {
    return {
      title: "Recommended strategy: let premium earn its keep",
      text: `Treasury bills were the best hindsight choice in ${bestPattern.count} of ${total} expirations. A practical options lesson is to stay in bills unless the future headline implies a move large enough to clear the modeled premium. This may work because long options lose the premium if the move is too small or arrives too late.`,
    };
  }

  return {
    title: `Recommended strategy: selective ${optionChoiceShortLabels[bestPattern.choice]}`,
    text: `${optionChoiceLabels[bestPattern.choice]} was the best hindsight choice in ${bestPattern.count} of ${total} expirations. The teachable strategy is to use the option only when the headline suggests direction and magnitude, then let bills carry the unused cash. This may work because options reward convexity, but only after the underlying move beats the cost of the premium.`,
  };
}

function getOptionsFinalRecap(game: OptionsFortuneState) {
  const results = game.results;
  const gain = game.bankroll - startingBankroll;
  const gainPercent = getOptionsStartingGain(game.bankroll);
  const totalTaxPaid = results.reduce((total, result) => total + result.tax, 0);
  const totalPremiumPaid = results.reduce((total, result) => total + result.optionBudget, 0);
  const winners = results.filter((result) => result.profit >= 0).length;
  const choiceSummary = getOptionsChoiceCountSummary(results);
  const sortedByProfit = [...results].sort((a, b) => b.profit - a.profit);
  const best = sortedByProfit[0];
  const worst = sortedByProfit.at(-1);
  const recommendation = getOptionsRecommendedStrategy(game);

  return {
    bestMove: best
      ? `Best expiration: ${optionChoiceLabels[best.choice]} from ${formatDateLong(best.event.date)} to ${formatDateLong(best.target.date)} added ${formatOptionsMoneyDelta(best.profit)}.`
      : "Best expiration: none yet.",
    choiceSummary: `Mara made ${formatCountNoun(results.length, "time jump")} with this mix: ${choiceSummary}.`,
    impactSummary: `Net result: ${formatOptionsMoneyDelta(gain)} (${formatOptionsPercent(gainPercent)}) after ${formatOptionsMoney(totalPremiumPaid)} in option premium and ${formatOptionsMoney(totalTaxPaid)} in short-term option tax; ${winners} of ${results.length} expirations finished positive.`,
    recommendation,
    rulesSummary: "Contract terms used: SPX-style cash-settled European options, struck at-the-money on the current headline date and expiring on the future headline selected by the player. Premiums are Black-Scholes-style modeled premiums using real historical S&P 500 prices, historical CBOE VIX closes, historical Treasury bill yields, and a 100x SPX-style contract multiplier. Mara buys whole contracts only; leftover cash waits in T-Bills.",
    worstMove: worst
      ? `${worst.profit < 0 ? "Costliest" : "Smallest"} expiration: ${optionChoiceLabels[worst.choice]} from ${formatDateLong(worst.event.date)} to ${formatDateLong(worst.target.date)} moved the account ${formatOptionsMoneyDelta(worst.profit)}.`
      : "Smallest expiration: none yet.",
  };
}

function getOptionsPerformancePoints(game: OptionsFortuneState): ResultsChartPoint[] {
  const points: ResultsChartPoint[] = [
    {
      date: optionsStartDate,
      label: "Start",
      values: {
        mara: startingBankroll,
        index: startingBankroll,
        bills: startingBankroll,
      },
    },
  ];
  let indexBenchmark = startingBankroll;
  let billsBenchmark = startingBankroll;

  game.results.forEach((result) => {
    indexBenchmark *= 1 + result.underlyingReturn / 100;
    billsBenchmark *= 1 + result.billReturn / 100;
    points.push({
      date: result.target.date,
      label: result.target.label,
      values: {
        mara: result.endingBankroll,
        index: indexBenchmark,
        bills: billsBenchmark,
      },
    });
  });

  return points;
}

function getOptionsTimeJumpEntries(game: OptionsFortuneState, result: OptionsResult): TimeJumpEntry[] {
  if (result.earlyClose) {
    return [
      {
        date: result.earlyClose.date,
        headline: `Position stopped; proceeds wait in T-Bills until ${formatDateLong(result.target.date)}`,
        isMajor: true,
        isMarketMover: true,
        status: "Closed position",
      },
    ];
  }

  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  const startIndex = Math.min(fromIndex + 1, game.events.length);
  const endIndex = Math.max(startIndex, Math.min(result.targetIndex, game.events.length));
  const entries: TimeJumpEntry[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (index >= game.events.length) {
      entries.push({
        date: optionsEndDate,
        headline: "Final expiration: the option tape is settled",
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

function createOptionsTimeJumpTransition(game: OptionsFortuneState, result: OptionsResult): TimeJumpTransitionModel {
  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  const fromProgress = getProgressPercent(game, fromIndex);
  const fullTargetProgress = getProgressPercent(game, result.targetIndex);
  const earlyCloseProgress = Math.max(0, Math.min(1, result.earlyClose?.progress ?? 1));
  const visualTargetDate = result.earlyClose?.date ?? result.target.date;
  const visualTargetBalance = result.earlyClose?.accountAfterClose ?? result.endingBankroll;
  const visualTargetHeadline = result.earlyClose
    ? `Position stopped; proceeds wait in T-Bills until ${formatDateLong(result.target.date)}`
    : getTargetHeadline(result.target);
  const visualTargetProgress = result.earlyClose ? fromProgress + (fullTargetProgress - fromProgress) * earlyCloseProgress : fullTargetProgress;
  return {
    chartPoints: buildInterpolatedTimeJumpPoints({
      endDate: visualTargetDate,
      endValue: visualTargetBalance,
      startDate: result.event.date,
      startValue: result.startingBankroll,
    }),
    durationMs: result.choice === "bills" ? optionsBillsTransitionDurationMs : optionsOptionTransitionDurationMs,
    entries: getOptionsTimeJumpEntries(game, result),
    fromBalance: result.startingBankroll,
    fromDate: result.event.date,
    fromHeadline: result.event.headline,
    fromProgress,
    strategyLabel: optionChoiceLabels[result.choice],
    targetBalance: visualTargetBalance,
    targetDate: visualTargetDate,
    targetHeadline: visualTargetHeadline,
    targetProgress: visualTargetProgress,
    targetChart: createOptionsTargetChart(result),
    title: result.earlyClose ? "Position closed" : "Expiration settled",
    travelerLabel: "Mara",
    xAxisLabel: "X: Time",
    yAxisLabel: "Y: Account",
  };
}

function createOptionsPreviewResult(game: OptionsFortuneState): OptionsResult {
  const event = getCurrentOptionsEvent(game);
  const target = getSelectedOptionsTarget(game);
  return {
    ...calculateOptionOutcome(game.bankroll, event, target, game.choice),
    event,
    target,
    targetIndex: target.index,
  };
}

function buildOptionsTimingCoachChart(result: OptionsResult, bestStop: ReturnType<typeof getBestOptionsStopForChoice>) {
  const priceTarget = getOptionsPriceTarget(result);
  const points = sampleOptionsPricePoints(buildOptionsFullStockPricePoints(result), 38);
  const startTime = new Date(`${result.event.date}T00:00:00Z`).getTime();
  const endTime = new Date(`${result.target.date}T00:00:00Z`).getTime();
  const duration = Math.max(1, endTime - startTime);
  const targetValues = [priceTarget.lowerTarget, priceTarget.upperTarget].filter((value): value is number => Number.isFinite(value));
  const values = [...points.map((point) => point.value), ...targetValues, bestStop?.sp500 ?? result.target.sp500];
  const low = Math.min(...values);
  const high = Math.max(...values);
  const padding = Math.max(8, (high - low) * 0.16);
  const min = low - padding;
  const max = high + padding;
  const span = Math.max(1, max - min);
  const left = 20;
  const right = 224;
  const top = 16;
  const bottom = 104;
  const height = bottom - top;
  const xForDate = (date: string) => left + Math.max(0, Math.min(1, (new Date(`${date}T00:00:00Z`).getTime() - startTime) / duration)) * (right - left);
  const yForValue = (value: number) => bottom - ((value - min) / span) * height;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xForDate(point.date).toFixed(1)} ${yForValue(point.value).toFixed(1)}`)
    .join(" ");
  const marker = bestStop
    ? {
        x: xForDate(bestStop.date),
        y: yForValue(bestStop.sp500),
      }
    : null;
  const upperY = priceTarget.upperTarget ? yForValue(priceTarget.upperTarget) : null;
  const lowerY = priceTarget.lowerTarget ? yForValue(priceTarget.lowerTarget) : null;

  return {
    lowerY,
    marker,
    path,
    upperY,
  };
}

function getOptionsTimingCoachCopy(result: OptionsResult, bestStop: ReturnType<typeof getBestOptionsStopForChoice>) {
  const priceTarget = getOptionsPriceTarget(result);
  const expirationGap = bestStop ? bestStop.outcome.endingBankroll - result.endingBankroll : 0;
  const direction =
    result.choice === "calls"
      ? "up through the green profit line"
      : result.choice === "puts"
        ? "down through the green profit line"
        : "far enough up or down to leave the red middle";

  if (!bestStop) {
    return {
      bestLine: "No green-zone stop appears in this window.",
      reason:
        `This ticket needs ${priceTarget.targetLabel}. The S&P never gets there, so the option never has a profitable stop to lock in.`,
      resultLine: "You can still tap to practice, but this is the lesson: a headline can be right and the option can still miss.",
    };
  }

  return {
    bestLine: `Best-looking stop: ${formatDateLong(bestStop.date)} near S&P ${formatOptionsIndexPrice(bestStop.sp500)}.`,
    reason:
      `Stop there because the gold dot has moved ${direction}. The option has covered its premium, so closing locks in value before time value or a reversal can take it back.`,
    resultLine:
      `${formatOptionsMoneyDelta(bestStop.outcome.profit)} if closed there${
        expirationGap > 1 ? `, about ${formatOptionsMoney(expirationGap)} better than waiting for expiration` : ""
      }.`,
  };
}

function OptionsTimingCoachOverlay({ onStart, result }: { onStart: () => void; result: OptionsResult }) {
  const startedRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const Icon = optionIcons[result.choice];
  const bestStop = getBestOptionsStopForChoice(result);
  const priceTarget = getOptionsPriceTarget(result);
  const chart = buildOptionsTimingCoachChart(result, bestStop);
  const copy = getOptionsTimingCoachCopy(result, bestStop);

  useEffect(() => {
    overlayRef.current?.focus({ preventScroll: true });
  }, []);

  const start = () => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    onStart();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      start();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="storybook-guide-overlay dashboard-guide options-timing-coach"
      role="dialog"
      aria-modal="true"
      aria-label="Option timing coach"
      onClick={start}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="storybook-dashboard-guide-title options-timing-coach-title">
        <strong>Timing Coach</strong>
      </div>
      <div className="storybook-dashboard-guide-start-hint options-timing-coach-hint">
        Click anywhere to dismiss this coach and start the live chart immediately
      </div>
      <article className="options-timing-coach-card" aria-label={`${optionChoiceLabels[result.choice]} timing coach`}>
        <header>
          <span>
            <Icon size={17} aria-hidden="true" />
            {optionChoiceLabels[result.choice]}
          </span>
          <strong>Watch the gold dot</strong>
          <p>The real chart starts immediately after this card. During the chart, click/tap/Enter again to stop the option, or do nothing and let it run to expiration.</p>
        </header>
        <figure className={`options-timing-coach-chart ${result.choice}`} aria-hidden="true">
          <svg viewBox="0 0 240 120" role="img">
            <rect className="options-timing-coach-bg" x="0" y="0" width="240" height="120" rx="14" />
            <rect className="options-timing-coach-zone miss" x="20" y="16" width="204" height="88" rx="10" />
            {chart.upperY !== null && <rect className="options-timing-coach-zone win" x="20" y="16" width="204" height={Math.max(0, chart.upperY - 16)} rx="10" />}
            {chart.lowerY !== null && <rect className="options-timing-coach-zone win" x="20" y={chart.lowerY} width="204" height={Math.max(0, 104 - chart.lowerY)} rx="10" />}
            {chart.upperY !== null && <line className="options-timing-coach-target-line" x1="18" x2="226" y1={chart.upperY} y2={chart.upperY} />}
            {chart.lowerY !== null && <line className="options-timing-coach-target-line" x1="18" x2="226" y1={chart.lowerY} y2={chart.lowerY} />}
            <path className="options-timing-coach-path" d={chart.path} />
            {chart.marker ? (
              <g className="options-timing-coach-marker" transform={`translate(${chart.marker.x.toFixed(1)} ${chart.marker.y.toFixed(1)})`}>
                <circle r="13" />
                <circle r="5.5" />
                <path d="M -2 -9 L 8 0 L -2 9 Z" />
                <text x="14" y="-10">
                  Stop here
                </text>
              </g>
            ) : (
              <text className="options-timing-coach-none" x="120" y="63">
                No green stop
              </text>
            )}
            <text className="options-timing-coach-axis-label y" transform="translate(10 74) rotate(-90)">
              Y: S&P
            </text>
            <text className="options-timing-coach-axis-label x" x="224" y="114">
              X: Time
            </text>
          </svg>
        </figure>
        <section className="options-timing-coach-copy">
          <article className={bestStop ? "gain" : "neutral"}>
            <span>Opportune moment</span>
            <strong>{copy.bestLine}</strong>
            <p>{copy.resultLine}</p>
          </article>
          <article>
            <span>Why stop there?</span>
            <strong>{priceTarget.targetLabel}</strong>
            <p>{copy.reason} Stopping is optional: if waiting to expiration ends higher, leave the chart alone.</p>
          </article>
        </section>
        <footer>
          <span>This one-time coach appears before the first option chart only.</span>
          <strong>Click anywhere to dismiss it and the live timing challenge begins right away.</strong>
        </footer>
      </article>
    </div>
  );
}

function OptionsFinalJournalOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const totalPremium = game.results.reduce((total, result) => total + result.optionBudget, 0);
  const totalPayoff = game.results.reduce((total, result) => total + result.payoff, 0);
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Final options journal">
      <article className="storybook-journal-page options-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close final journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Mara's final journal</p>
        <h2>The Last Expiration</h2>
        <div className="storybook-journal-entry">
          <p>{optionsStory.ending}</p>
          <p>
            Mara paid {formatOptionsMoney(totalPremium)} in option premium across {formatCountNoun(game.results.length, "trade")} and collected {formatOptionsMoney(totalPayoff)} in payoff before taxes and bills interest.
          </p>
          <p>
            Aunt June's lesson finally lands: a future headline is an edge, but options ask a sharper question. Was the move large enough, soon enough, and cheap enough to own?
          </p>
        </div>
      </article>
    </div>
  );
}

type OptionHowToChartKind = "call" | "put" | "straddle" | "bills" | "stop";

function OptionHowToMiniChart({ kind }: { kind: OptionHowToChartKind }) {
  const pathByKind: Record<OptionHowToChartKind, string> = {
    bills: "M 12 46 C 42 45 74 45 104 44 C 124 44 140 43 150 43",
    call: "M 12 62 C 40 60 65 50 86 39 C 108 27 128 18 150 16",
    put: "M 12 26 C 38 28 64 38 88 50 C 112 63 130 70 150 72",
    stop: "M 12 62 C 40 60 65 50 86 39 C 108 27 128 18 150 16",
    straddle: "M 12 42 C 36 44 56 48 76 43 C 98 37 118 21 150 15",
  };
  const labelByKind: Record<OptionHowToChartKind, string> = {
    bills: "Cash waits",
    call: "Above line pays",
    put: "Below line pays",
    stop: "Click here",
    straddle: "Big move pays",
  };
  const isCallZone = kind === "call" || kind === "straddle" || kind === "stop";
  const isPutZone = kind === "put" || kind === "straddle";
  const isCash = kind === "bills";

  return (
    <figure className={`options-howto-chart ${kind}`} aria-hidden="true">
      <svg viewBox="0 0 160 84" role="img">
        <rect className="options-howto-chart-bg" x="0" y="0" width="160" height="84" rx="10" />
        <text className="options-howto-axis-label y" transform="translate(10 54) rotate(-90)">
          Y: S&P
        </text>
        <text className="options-howto-axis-label x" x="151" y="80">
          X: Time
        </text>
        <rect className={isCallZone ? "options-howto-zone win" : "options-howto-zone miss"} x="0" y="0" width="160" height="25" rx="8" />
        <rect className="options-howto-zone middle" x="0" y="25" width="160" height="35" />
        <rect className={isPutZone ? "options-howto-zone win" : "options-howto-zone miss"} x="0" y="60" width="160" height="24" rx="8" />
        <line className="options-howto-strike-line" x1="8" x2="152" y1="42" y2="42" />
        {!isCash && <line className="options-howto-target-line" x1="8" x2="152" y1={kind === "put" ? 60 : 25} y2={kind === "put" ? 60 : 25} />}
        {kind === "straddle" && <line className="options-howto-target-line" x1="8" x2="152" y1="60" y2="60" />}
        <path className={`options-howto-path ${isCash ? "cash" : ""}`} d={pathByKind[kind]} />
        {(kind === "call" || kind === "straddle" || kind === "stop") && <circle className="options-howto-dot win" cx={kind === "stop" ? 108 : 144} cy={kind === "stop" ? 27 : 16} r="5" />}
        {kind === "put" && <circle className="options-howto-dot win" cx="144" cy="72" r="5" />}
        {isCash && <circle className="options-howto-dot cash" cx="144" cy="43" r="5" />}
        {kind === "stop" && (
          <>
            <circle className="options-howto-stop-ring" cx="108" cy="27" r="11" />
            <path className="options-howto-stop-arrow" d="M105 22 L114 27 L105 32 Z" />
          </>
        )}
        <text className="options-howto-green-label" x="9" y={isPutZone && !isCallZone ? 75 : 16}>
          GREEN
        </text>
        <text className="options-howto-chart-label" x="151" y="39">
          Strike
        </text>
      </svg>
      <figcaption>{labelByKind[kind]}</figcaption>
    </figure>
  );
}

function OptionsIntro({
  game,
  introPage,
  onBegin,
  onTurnPage,
}: {
  game: OptionsFortuneState;
  introPage: IntroPage;
  onBegin: () => void;
  onTurnPage: () => void;
}) {
  const howToCards: Array<{
    chart: "call" | "put" | "straddle" | "bills";
    label: string;
    text: string;
    title: string;
  }> = [
    {
      chart: "call",
      label: "Call",
      text: "Buy this when the headline may push the S&P up sharply. It must rise past the premium.",
      title: "Bet on a big rise",
    },
    {
      chart: "put",
      label: "Put",
      text: "Buy this when the headline may push the S&P down sharply. It must fall past the premium.",
      title: "Bet on a big fall",
    },
    {
      chart: "straddle",
      label: "Straddle",
      text: "Buy this when the headline may cause a huge move, but you are not sure which way.",
      title: "Bet on a huge move",
    },
    {
      chart: "bills",
      label: "T-Bills",
      text: "A safe investment. Slow growth, no option premium, and no ticket can expire worthless.",
      title: "Safe slow growth",
    },
  ];
  const perfectTimingQuestion = `How much do you think someone using this investment strategy from ${formatDateLong(optionsStartDate)} to ${formatDateLong(optionsEndDate)} could have made if they timed the market perfectly? Find out at the end.`;

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-intro-shell options-fortune-shell">
      <section className={`storybook-book intro ${introPage} options-intro-book`}>
        {introPage === "setup" ? (
          <article
            className="storybook-intro-page prologue options-prologue"
            style={{ "--options-prologue-image": `url("${assetUrl("games/options-fortune/expiration-date-game-image-1.webp")}")` } as CSSProperties}
          >
            <figure className="options-prologue-art" aria-label="Chicago options desk with future headline sheets">
              <div className="options-floor-board">
                <span>OEX</span>
                <strong>EXPIRATION</strong>
                <em>VOL TAPE</em>
              </div>
              <div className="options-case">
                <i />
                <b>JUNE VALE</b>
              </div>
            </figure>
            <div className="storybook-prologue-copy-panel">
              <p className="storybook-game-title">Expiration Date</p>
              <p className="eyebrow">Options desk prologue</p>
              <h1>The Quote Case</h1>
              <p className="storybook-prologue-date">{optionsPrologueDate}</p>
              <p className="storybook-copy">{optionsStory.prologue}</p>
            </div>
            <div className="storybook-chapter-one-cards">
              <span>{optionsStory.hook}</span>
              <span>
                Buy option contracts using your future knowledge of breaking news events from historical events.
                Can you become rich with your future knowledge? It might be tougher than you think...
              </span>
            </div>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play" type="button" onClick={onTurnPage}>
              <Play size={18} />
              <span>Start Game</span>
              <small>{formatDateLong(getCurrentOptionsEvent(game).date)}</small>
            </button>
          </article>
        ) : (
          <article className="storybook-intro-page rules options-rules">
            <h1>How To Play</h1>
            <p className="storybook-howto-goal">Pick a future headline. Buy one ticket. Watch the chart. Green means the ticket can win.</p>
            <p className="storybook-perfect-question options-perfect-question">
              <Trophy size={16} />
              <span>{perfectTimingQuestion}</span>
            </p>
            <HighScoreToBeatBanner formatMoney={formatOptionsMoney} gameSlug="expiration-date" />
            <section className="options-howto-flow" aria-label="Expiration Date round steps">
              <span>
                <b>1</b>
                Pick headline date
              </span>
              <span>
                <b>2</b>
                Pay premium
              </span>
              <span>
                <b>3</b>
                Reach green zone
              </span>
              <span>
                <b>4</b>
                Stop early or expire
              </span>
            </section>
            <div className="options-howto-ticket-grid" aria-label="What each option is trying to achieve">
              {howToCards.map((card) => (
                <section className={`options-howto-ticket ${card.chart}`} key={card.label}>
                  {card.chart === "bills" ? (
                    <div className="options-howto-safe-investment" aria-hidden="true">
                      <Landmark size={20} />
                      <strong>Safe Investment</strong>
                      <span>Slow growth</span>
                    </div>
                  ) : (
                    <OptionHowToMiniChart kind={card.chart} />
                  )}
                  <div>
                    <span>{card.label}</span>
                    <strong>{card.title}</strong>
                    <p>{card.text}</p>
                  </div>
                </section>
              ))}
            </div>
            <section className="options-howto-stop-card" aria-label="How to close an option early">
              <OptionHowToMiniChart kind="stop" />
              <div>
                <span>Timing</span>
                <strong>Click the moving chart to stop</strong>
                <p>When the gold dot is in green, click, tap, or press Enter. Mara closes the ticket early.</p>
              </div>
            </section>
            <section className="options-basics-strip" aria-label="Simple options basics">
              <header>
                <span>Option Basics</span>
                <strong>A paid ticket with a clock</strong>
              </header>
              <div className="options-basics-tiles">
                <article>
                  <figure className="options-basics-figure ticket" aria-hidden="true">
                    <WalletCards size={15} />
                    <i />
                  </figure>
                  <strong>Premium</strong>
                  <p>Ticket price. Miss means lose it.</p>
                </article>
                <article>
                  <figure className="options-basics-figure strike" aria-hidden="true">
                    <span className="options-basics-line" />
                    <b />
                  </figure>
                  <strong>Strike</strong>
                  <p>The S&P line to beat.</p>
                </article>
                <article>
                  <figure className="options-basics-figure call-put" aria-hidden="true">
                    <TrendingUp size={14} />
                    <TrendingDown size={14} />
                  </figure>
                  <strong>Call / Put</strong>
                  <p>Call up. Put down. Straddle big.</p>
                </article>
                <article>
                  <figure className="options-basics-figure clock" aria-hidden="true">
                    <span />
                    <i />
                    <b />
                  </figure>
                  <strong>Expiration</strong>
                  <p>Clock ends. Paid or expired.</p>
                </article>
              </div>
            </section>
            <details className="options-contract-rule-card options-contract-terms-collapse">
              <summary>Contract terms</summary>
              <p>{optionsContractRuleSummary}</p>
              <p>Premiums use historical S&P 500 levels, CBOE VIX closes, Treasury bill yields, and a 100x contract multiplier. Whole contracts only; leftover cash waits in T-Bills. The option can expire worthless.</p>
            </details>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play storybook-briefcase-play" type="button" onClick={onBegin}>
              <Play size={18} />
              Play
            </button>
          </article>
        )}
      </section>
    </main>
  );
}

function OptionsTimeline({
  game,
  onSelectTarget,
}: {
  game: OptionsFortuneState;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const activePointerRef = useRef<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const currentProgress = getProgressPercent(game);
  const targetProgress = getProgressPercent(game, game.selectedTargetIndex);
  const currentEvent = getCurrentOptionsEvent(game);
  const target = getSelectedOptionsTarget(game);
  const lensUnlocked = isVolatilityLensUnlocked(game);
  const lensUnlockDate = getVolatilityLensUnlockDate();
  const lensUnlockProgress = getVolatilityLensUnlockProgress();
  const style = {
    "--story-progress": `${currentProgress}%`,
    "--story-projected-progress": `${targetProgress}%`,
    "--story-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
    "--jonah-progress": `${currentProgress}%`,
    "--jonah-target-progress": `${targetProgress}%`,
    "--jonah-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
    "--market-heat-unlock": `${lensUnlockProgress}%`,
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
    <section className="storybook-progress-rail embedded options-timeline-rail" aria-label="Options timeline control" style={style}>
      <div className="storybook-progress-context options-timeline-context">
        <span className="options-timeline-control-cue">
          <SlidersHorizontal size={12} aria-hidden="true" />
          Tap or drag timeline
        </span>
        <strong>
          Current date: {formatDateLong(currentEvent.date)}
          <em key={target.date} className="options-selected-date-label">
            Selected date: {formatDateLong(target.date)}
          </em>
        </strong>
      </div>
      <div className="storybook-progress-body">
        <div
          className={`storybook-progress-track interactive ${scrubbing ? "scrubbing" : ""}`}
          role="slider"
          aria-label="Choose Mara's next future headline on the options timeline"
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
          <span className="storybook-progress-endcap start">{optionsStartDate.slice(0, 4)}</span>
          <span className="storybook-progress-endcap end">{optionsEndDate.slice(0, 4)}</span>
          <span
            className={`storybook-progress-heat-unlock ${lensUnlocked ? "active" : ""}`}
            aria-label={`Market Vision unlocked at ${formatDateLong(lensUnlockDate)}`}
          >
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
            <span>Mara</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function clampOptionRoadPosition(value: number) {
  return Math.max(6, Math.min(94, value));
}

function getOptionRoadPosition(movePercent: number, scalePercent: number) {
  return clampOptionRoadPosition(50 + (movePercent / Math.max(1, scalePercent)) * 44);
}

function getOptionTicketRoadStyle(choice: OptionChoice, outcome: OptionOutcome): CSSProperties {
  if (choice === "bills") {
    return {
      "--option-be-left": "50%",
      "--option-be-right": "50%",
      "--option-priced-left": "12%",
      "--option-priced-right": "88%",
    } as CSSProperties;
  }

  const scalePercent = Math.max(outcome.breakEvenMove, outcome.pricedInMove, 1) * 1.45;
  const breakEvenLeft = getOptionRoadPosition(-outcome.breakEvenMove, scalePercent);
  const breakEvenRight = getOptionRoadPosition(outcome.breakEvenMove, scalePercent);
  const pricedLeft = getOptionRoadPosition(-outcome.pricedInMove, scalePercent);
  const pricedRight = getOptionRoadPosition(outcome.pricedInMove, scalePercent);

  return {
    "--option-be-left": `${breakEvenLeft}%`,
    "--option-be-right": `${breakEvenRight}%`,
    "--option-priced-left": `${pricedLeft}%`,
    "--option-priced-right": `${pricedRight}%`,
  } as CSSProperties;
}

function OptionTicketPlayground({ choice, outcome, pulseKey = 0 }: { choice: OptionChoice; outcome: OptionOutcome; pulseKey?: number }) {
  const Icon = optionIcons[choice];
  const coinCount = choice === "bills" ? 0 : choice === "straddle" ? 6 : 4;
  const ticketStyle = getOptionTicketRoadStyle(choice, outcome);
  const premiumLabel =
    choice === "bills"
      ? formatOptionsMoney(outcome.startingBankroll)
      : `${formatOptionsMoney(outcome.optionBudget)} premium`;
  const pricedMoveLabel =
    choice === "bills"
      ? "slow path"
      : `${formatOptionsContractCount(outcome.contractCount)} · market guessed ±${formatUnsignedOptionsPercent(outcome.pricedInMove)}`;

  return (
    <section
      key={`${choice}-${pulseKey}`}
      className={`options-ticket-playground ${choice} ${pulseKey > 0 ? "is-pulsing" : ""}`}
      style={ticketStyle}
      aria-label={`${getOptionKidLabel(choice)} option lesson. ${getOptionTicketRule(choice, outcome)}`}
      data-guide-target="option-ticket"
    >
      <div className="options-ticket-topline">
        <span className="options-ticket-name">
          <Icon size={15} aria-hidden="true" />
          <strong>{getOptionKidLabel(choice)}</strong>
        </span>
        <span className="options-ticket-price">
          <em>{choice === "bills" ? "Keep" : "Pay"}</em>
          <b>{premiumLabel}</b>
        </span>
      </div>
      <div className="options-ticket-road-shell">
        <div className="options-ticket-road-labels" aria-hidden="true">
          <span>Down</span>
          <strong>{choice === "bills" ? "Cash" : "Strike"}</strong>
          <span>Up</span>
        </div>
        <div className="options-ticket-road" aria-hidden="true">
          <span className="options-priced-zone" />
          <span className="options-win-zone left" />
          <span className="options-win-zone right" />
          {choice !== "bills" && (
            <>
              <span className="options-strike-zone" />
              <span className="options-strike-pin">
                <i />
              </span>
              <span className="options-win-pin left">
                <i />
              </span>
              <span className="options-win-pin right">
                <i />
              </span>
            </>
          )}
          {choice === "bills" && <span className="options-cash-path" />}
        </div>
      </div>
      <p className="options-ticket-rule">{getOptionTicketRule(choice, outcome)}</p>
      <div className="options-ticket-footer">
        <span className="options-premium-coins" aria-hidden="true">
          {Array.from({ length: Math.max(1, coinCount || 1) }, (_, index) => (
            <i key={index} className={coinCount === 0 ? "empty" : ""} />
          ))}
        </span>
        <strong>{choice === "bills" ? "no premium" : getOptionWinLineLabel(choice, outcome)}</strong>
        <em>{pricedMoveLabel}</em>
      </div>
    </section>
  );
}

function OptionsAccountStatusStrip({ game }: { game: OptionsFortuneState }) {
  const gain = game.bankroll - startingBankroll;
  const gainPercent = getOptionsStartingGain(game.bankroll);
  const tone = getTone(gain);

  return (
    <section className={`options-account-status ${tone}`} aria-label={`Current account balance ${formatOptionsMoney(game.bankroll)}. Performance ${formatOptionsMoneyDelta(gain)} divided by ${formatOptionsPercent(gainPercent)}.`}>
      <div>
        <span>Account</span>
        <strong>{formatOptionsMoney(game.bankroll)}</strong>
      </div>
      <div>
        <span>Performance</span>
        <strong>
          {formatOptionsMoneyDelta(gain)}/({formatOptionsPercent(gainPercent)})
        </strong>
      </div>
      <small>{formatCountNoun(game.results.length, "trade")}</small>
    </section>
  );
}

function OptionsChoiceStrip({
  game,
  onChoose,
}: {
  game: OptionsFortuneState;
  onChoose: (choice: OptionChoice) => void;
}) {
  const outcomes = getProjectedOutcomes(game);
  const unlocked = isVolatilityLensUnlocked(game);

  return (
    <div className={`storybook-dashboard-allocation options-choice-strip ${unlocked ? "heat-unlocked" : "heat-locked"}`} data-guide-target="allocation-buttons">
      {optionChoiceOrder.map((choice) => {
        const Icon = optionIcons[choice];
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
            <strong>{getOptionKidLabel(choice)}</strong>
            <span>{getOptionChoiceMetricLabel(choice, outcome)}</span>
            <em aria-hidden="true">{active ? "Selected" : ""}</em>
          </button>
        );
      })}
    </div>
  );
}

function OptionsSelectedStrategyBanner({
  game,
  onChoose,
  onPlay,
  outcome,
  pulseKey,
}: {
  game: OptionsFortuneState;
  onChoose: (choice: OptionChoice) => void;
  onPlay: () => void;
  outcome: OptionOutcome;
  pulseKey: number;
}) {
  const previousChoice = getPreviousOptionChoice(game);
  const currentEvent = getCurrentOptionsEvent(game);
  const selectedTarget = getSelectedOptionsTarget(game);
  const visibleTax = outcome.tax > 0.5;
  const isHolding = previousChoice === game.choice;
  const mainAmount = game.choice === "bills" ? outcome.startingBankroll : outcome.optionBudget;
  const secondaryAmount = game.choice === "bills" ? 0 : outcome.collateral;
  const premiumLabel = game.choice === "bills" ? "Safe amount" : "Premium";
  const contractSummary = game.choice === "bills" ? "No option contracts" : getOptionsContractPurchaseLabel(outcome);
  const reserveSummary = game.choice === "bills" ? "No option premium" : `${formatOptionsMoney(secondaryAmount)} leftover in T-Bills`;

  return (
    <aside
      className={`storybook-selected-allocation-banner options-selected-strategy-banner expanded-ticket-banner ${visibleTax ? "has-tax" : "no-tax"} ${
        pulseKey > 0 ? "is-pulsing" : ""
      } ${isHolding ? "is-holding" : "is-moving"}`}
      aria-label={`Selected strategy ${optionChoiceLabels[game.choice]}. ${formatOptionsMoney(mainAmount)} moves to ${optionChoiceLabels[game.choice]}. Short-term option tax estimate ${formatOptionsMoney(outcome.tax)}.`}
    >
      <OptionsChoiceStrip game={game} onChoose={onChoose} />
      <OptionTicketPlayground key={`${game.choice}-${pulseKey}`} choice={game.choice} outcome={outcome} pulseKey={pulseKey} />
      <div className="allocation-banner-copy options-selected-ticket-summary">
        <span>{isHolding ? "Holding" : "Selected option"}</span>
        <strong>{getOptionKidLabel(game.choice)}</strong>
        <em>
          <b>{premiumLabel}</b>
          {formatOptionsMoney(mainAmount)}
        </em>
        <small className="allocation-contract-term">{contractSummary}</small>
        <small className="allocation-contract-term">{reserveSummary}</small>
        <small className="allocation-contract-term">{getOptionsContractTermLabel(currentEvent.date, selectedTarget.date)}</small>
        {game.choice !== "bills" && (
          <small className="allocation-contract-term">
            {getOptionWinLineLabel(game.choice, outcome)} · Market priced ±{formatUnsignedOptionsPercent(outcome.pricedInMove)} move
          </small>
        )}
      </div>
      <button className="primary-action legacy-primary storybook-play-button options-banner-play-button" type="button" onClick={onPlay} data-guide-target="advance-game">
        <span>Play</span>
        <small>
          {getOptionKidLabel(game.choice)} · {game.choice === "bills" ? formatOptionsMoney(projectedOptionSpend(outcome)) : formatOptionsContractCount(outcome.contractCount)}
        </small>
        <ChevronRight size={18} />
      </button>
    </aside>
  );
}

function OptionsDateConsole({
  compact,
  game,
  lastResult,
  onChoose,
  onOpenArticle,
  onPlay,
  onSelectTarget,
}: {
  compact: boolean;
  game: OptionsFortuneState;
  lastResult?: OptionsResult;
  onChoose: (choice: OptionChoice) => void;
  onOpenArticle: () => void;
  onPlay: () => void;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const dragStartRef = useRef<{ moved: boolean; selectedIndex: number; targetIndex: number | null; y: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const currentEvent = getCurrentOptionsEvent(game);
  const minimum = game.currentIndex + 1;
  const selectedIndex = Math.max(minimum, Math.min(game.selectedTargetIndex, game.events.length));
  const selectedTarget = getOptionsTarget(game, selectedIndex);
  const outcomes = getProjectedOutcomes(game);
  const projected = outcomes[game.choice];
  const firstVisibleDeckIndex = game.currentIndex + Math.max(0, selectedIndex - game.currentIndex - 1);
  const lastVisibleDeckIndex = firstVisibleDeckIndex + 3;
  const headlineDeck = Array.from({ length: game.events.length - game.currentIndex + 1 }, (_, offset) => {
    const index = game.currentIndex + offset;
    const deckTarget = getOptionsTarget(game, index);
    const event = deckTarget.event;
    const isCurrent = index === game.currentIndex;
    const isSelected = index === selectedIndex;
    const statusParts = [isCurrent ? "Current page" : isSelected ? "Selected expiry" : deckTarget.isFinal ? "Final expiration" : "Future expiry"];
    if (event?.major) {
      statusParts.push("major headline");
    }

    return {
      date: deckTarget.date,
      headline: deckTarget.isFinal ? "Final expiration: close the quote case" : event?.headline ?? deckTarget.label,
      index,
      isCurrent,
      isFinal: deckTarget.isFinal,
      isMajor: event?.major ?? false,
      isSelected,
      status: statusParts.join(" · "),
    };
  });
  const headlineShift = Math.max(0, selectedIndex - game.currentIndex - 1) * -1;
  const [selectionPulseKey, setSelectionPulseKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    setSelectionPulseKey((key) => key + 1);
  }, [game.choice, selectedIndex]);

  const moveSelection = (delta: number) => {
    onSelectTarget(Math.max(minimum, Math.min(game.events.length, selectedIndex + delta)));
  };
  const clampTargetIndex = (index: number) => Math.max(minimum, Math.min(game.events.length, index));

  const handleWheel = (event: ReactWheelEvent) => {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  };

  const handleHeadlineDeckKeyDown = (event: ReactKeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      const headlineCard =
        event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
      const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
      if (Number.isFinite(headlineIndex) && headlineIndex > game.currentIndex && headlineIndex !== selectedIndex) {
        event.preventDefault();
        onSelectTarget(clampTargetIndex(headlineIndex));
        return;
      }
      event.preventDefault();
      onPlay();
    }
  };
  const startSpin = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.focus({ preventScroll: true });
    const headlineCard =
      event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
    const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
    dragStartRef.current = {
      moved: false,
      selectedIndex,
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
  const headlineSelector = (
    <article className="storybook-date-headline options-headline-selector" aria-label="Rolling headline preview">
      <div className="storybook-deck-kicker options-headline-date-kicker">
        <span>Current page · {formatDateLong(currentEvent.date)}</span>
        <em key={selectedTarget.date}>To expiry · {formatDateLong(selectedTarget.date)}</em>
      </div>
      <div className="storybook-deck-kicker">
        <span>{selectedTarget.isFinal ? "Final expiration" : `Future page ${selectedTarget.index + 1} of ${game.events.length}`}</span>
        <em>
          {formatOptionsSpan(currentEvent.date, selectedTarget.date)} pass · {formatOptionsSpan(selectedTarget.date, optionsEndDate)} remain
        </em>
      </div>
      <div className="options-term-chip" aria-label="Selected options contract term">
        {getOptionsContractTermShortLabel(currentEvent.date, selectedTarget.date)}
      </div>
      <div
        className={`storybook-headline-deck options-headline-deck ${isSpinning ? "spinning" : ""}`}
        style={{ "--headline-shift": headlineShift } as CSSProperties}
        aria-keyshortcuts="ArrowUp ArrowDown"
        tabIndex={0}
        data-guide-target="headline-deck"
        onKeyDown={handleHeadlineDeckKeyDown}
        onWheel={handleWheel}
        {...spinHandlers}
      >
        <div className="storybook-headline-track">
          {headlineDeck.map((deckEntry) => (
            <button
              key={`${deckEntry.index}-${deckEntry.date}`}
              className={`storybook-headline-card ${deckEntry.isCurrent ? "current" : ""} ${deckEntry.isSelected ? "selected" : ""} ${
                deckEntry.isMajor ? "major" : ""
              }`}
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
  );
  return (
    <section className={`storybook-date-console rolodex-watch-skin options-date-console ${compact ? "compact-dashboard" : ""}`} aria-label="Expiration date selector" data-guide-target="date-console">
      {compact ? (
        <>
          <OptionsPreviewCard currentDate={currentEvent.date} lastResult={lastResult} onOpen={onOpenArticle} target={selectedTarget} />
          <OptionsAccountStatusStrip game={game} />
          <OptionsTimeline game={game} onSelectTarget={onSelectTarget} />
          <OptionsSelectedStrategyBanner game={game} onChoose={onChoose} onPlay={onPlay} outcome={projected} pulseKey={selectionPulseKey} />
        </>
      ) : (
        <>
          {headlineSelector}
          <OptionsTimeline game={game} onSelectTarget={onSelectTarget} />
          <OptionsSelectedStrategyBanner game={game} onChoose={onChoose} onPlay={onPlay} outcome={projected} pulseKey={selectionPulseKey} />
        </>
      )}
    </section>
  );
}

function OptionsPreviewCard({
  target,
  onOpen,
  currentDate,
  lastResult,
}: {
  target: OptionsTarget;
  onOpen: () => void;
  currentDate?: string;
  lastResult?: OptionsResult;
}) {
  const event = target.event;
  return (
    <article className="storybook-current-page with-headline-image options-preview-card" data-guide-target="selected-front-page-article">
      <div className="storybook-current-copy">
        <div className="storybook-masthead mini">
          <span>{target.label}</span>
          <b>{target.isFinal ? "Final Expiration" : event?.major ? "Major Headline" : "Selected Expiration"}</b>
        </div>
        {currentDate && (
          <div className="options-front-page-date-pair" aria-label={`Current page ${formatDateLong(currentDate)}. Headline date ${formatDateLong(target.date)}.`}>
            <span>
              <b>Current page</b>
              <strong>{formatDateLong(currentDate)}</strong>
            </span>
            <span>
              <b>Headline date</b>
              <strong>{formatDateLong(target.date)}</strong>
            </span>
          </div>
        )}
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
              {optionChoiceShortLabels[lastResult.choice]} · {formatOptionsPercent((lastResult.endingBankroll / lastResult.startingBankroll - 1) * 100)} · {formatOptionsMoney(lastResult.endingBankroll)}
            </strong>
          </div>
        )}
        <p>{getPreviewParagraph(event, target.isFinal)}</p>
        <div className="options-preview-contract-note">
          <strong>Contract terms</strong>
          <span>{optionsContractRuleSummary}</span>
        </div>
      </div>
    </article>
  );
}

function OptionsDashboardGuide({ compact, onStart }: { compact: boolean; onStart: () => void }) {
  return (
    <TargetGuideOverlay
      buttonLabel="Start"
      className="dashboard-guide-live options-guide"
      guideItems={compact ? optionsCompactDashboardGuideItems : optionsDashboardGuideItems}
      label="Options dashboard guide"
      onStart={onStart}
      showStartButton={false}
      subtitle="Click anywhere to start"
      title="Mara's Dashboard"
    />
  );
}

function OptionsArticleOverlay({ target, onClose }: { target: OptionsTarget; onClose: () => void }) {
  const event = target.event;
  const facts = event?.newspaperArticle?.facts ?? [];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Expiration front page">
      <article className="storybook-newspaper-max options-newspaper">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close front page">
          <Minimize2 size={17} />
          <span>Close</span>
        </button>
        <section className="storybook-newspaper-clipping">
          <div className="storybook-masthead">
            <span>{optionsChronicleName}</span>
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
          <p>Gameplay uses real historical S&P 500 headline-date levels, historical Treasury bill yields, and CBOE VIX closes as the options-market volatility input for modeled SPX-style premiums.</p>
          <p>{optionsContractRuleSummary}</p>
        </aside>
      </article>
    </div>
  );
}

function OptionsJournalOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const currentEvent = getCurrentOptionsEvent(game);
  const paragraphs = [
    optionsStory.journal,
    currentEvent.lifeNote,
    `Current desk page: ${currentEvent.headline}`,
    `Mara has made ${game.results.length} ${game.results.length === 1 ? "trade" : "trades"} and is sitting at ${formatOptionsMoney(game.bankroll)}.`,
  ];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Mara's journal">
      <article className="storybook-journal-page options-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Mara's desk journal</p>
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

function OptionsLedgerOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const lastResult = game.results.at(-1);
  const path = buildOptionSparkline(game.results, game.bankroll);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Options ledger">
      <article className="storybook-ledger-page options-ledger-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close ledger">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Options ledger</p>
        <h2>{formatOptionsMoney(game.bankroll)}</h2>
        <section className="storybook-ledger-comparison">
          <article className="player">
            <span>Mara</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em>{formatOptionsPercent(gainPercent)}</em>
          </article>
          <article>
            <span>S&P 500</span>
            <strong>{formatOptionsMoney(game.indexBenchmark)}</strong>
            <em>{formatOptionsPercent((game.indexBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
          <article>
            <span>Bills</span>
            <strong>{formatOptionsMoney(game.billsBenchmark)}</strong>
            <em>{formatOptionsPercent((game.billsBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
        </section>
        <section className="storybook-market-chart sp500 options-ledger-chart" aria-label="Options account chart">
          <div>
            <span>Account path</span>
            <strong>{formatOptionsMoney(gain)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatOptionsPercent(gainPercent)}</em>
          </div>
          <svg viewBox="0 0 240 72" role="img" aria-label="Mara account value by trade">
            <text className="storybook-chart-axis-label y" x="6" y="10">
              Y: Account
            </text>
            <text className="storybook-chart-axis-label x" x="234" y="68">
              X: Trades
            </text>
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
              <strong>{optionChoiceLabels[lastResult.choice]}</strong>
            </div>
            <div className="storybook-market-row">
              <span>Premium spent</span>
              <strong>{formatOptionsMoney(lastResult.optionBudget)}</strong>
              <em>{getOptionsContractPurchaseLabel(lastResult)} · Payoff {formatOptionsMoney(lastResult.payoff)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Short-term tax</span>
              <strong>{formatOptionsMoney(lastResult.tax)}</strong>
              <em>S&P move {formatOptionsPercent(lastResult.underlyingReturn)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Contract term</span>
              <strong>{formatOptionsSpan(lastResult.event.date, lastResult.target.date)}</strong>
              <em>Expires {formatDateLong(lastResult.target.date)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Option market input</span>
              <strong>
                {lastResult.vixClose
                  ? `VIX ${lastResult.vixClose.toFixed(2)}`
                  : `${formatUnsignedOptionsPercent(lastResult.volatility * 100)} vol`}
              </strong>
              <em>{formatUnsignedOptionsPercent(lastResult.riskFreeRate * 100)} T-bill rate</em>
            </div>
            <div className="storybook-market-row">
              <span>Break-even</span>
              <strong>{getOptionBreakEvenLabel(lastResult.choice, lastResult)}</strong>
              <em>VIX priced ±{formatUnsignedOptionsPercent(lastResult.pricedInMove)} move</em>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function OptionsIndexOverlay({
  game,
  onClose,
  onSelect,
}: {
  game: OptionsFortuneState;
  onClose: () => void;
  onSelect: (targetIndex: number) => void;
}) {
  const futureEntries = game.events
    .map((event, index) => ({ event, index }))
    .filter(({ index }) => index > game.currentIndex);
  const grouped = futureEntries.reduce<Record<string, Array<{ event: HeadlineEvent; index: number }>>>((acc, entry) => {
    const year = entry.event.date.slice(0, 4);
    acc[year] = [...(acc[year] ?? []), entry];
    return acc;
  }, {});
  const years = Object.keys(grouped).sort();
  const [openYear, setOpenYear] = useState(years[0] ?? "");

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Expiration index">
      <article className="storybook-chapter-page options-index-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close expiration index">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Expiration Index</p>
        <h2>Pick any future page</h2>
        <p>Choose a future headline. You cannot move backward once time advances.</p>
        <div className="storybook-year-book">
          {years.map((year) => (
            <section key={year} className={`storybook-year-chapter ${openYear === year ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenYear(openYear === year ? "" : year)}>
                <strong>{year}</strong>
                <span>{grouped[year].length} expirations</span>
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
          <button className="primary-action legacy-primary options-final-expiry" type="button" onClick={() => onSelect(game.events.length)}>
            Skip to final expiration
            <ChevronRight size={16} />
          </button>
        </div>
      </article>
    </div>
  );
}

function OptionsTransitionOverlay({
  game,
  onClosePosition,
  onDismiss,
  result,
}: {
  game: OptionsFortuneState;
  onClosePosition?: (snapshot: TimeJumpCloseSnapshot) => void;
  onDismiss?: () => void;
  result: OptionsResult;
}) {
  return (
    <TimeJumpTransitionOverlay
      key={`${result.event.id}-${result.target.date}-${result.earlyClose?.date ?? "expiration"}-${Math.round(result.endingBankroll)}`}
      formatDateLong={formatDateLong}
      formatDateWithWeekday={formatDateWithWeekday}
      formatMoney={formatOptionsMoney}
      formatMoneyDelta={formatOptionsMoneyDelta}
      formatPercent={formatOptionsPercent}
      onCloseTargetPosition={result.earlyClose || result.choice === "bills" ? undefined : onClosePosition}
      onDismiss={result.choice === "bills" ? undefined : onDismiss}
      transition={createOptionsTimeJumpTransition(game, result)}
    />
  );
}

function OptionsFinalScreen({ game, onRestart }: { game: OptionsFortuneState; onRestart: () => void }) {
  const [finalJournalOpen, setFinalJournalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<LeaderboardSubmittedEntry | null>(null);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  const totalTaxPaid = game.results.reduce((total, result) => total + result.tax, 0);
  const totalPremiumPaid = game.results.reduce((total, result) => total + result.optionBudget, 0);
  const profitableTrades = game.results.filter((result) => result.profit >= 0).length;
  const performancePoints = getOptionsPerformancePoints(game);
  const finalRecap = getOptionsFinalRecap(game);
  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell complete options-fortune-shell">
      <section className="storybook-final-book last-edition options-final-book">
        <header className="storybook-final-head">
          <p className="storybook-game-title">Expiration Date</p>
          <p className="eyebrow">Seven Years Later · {formatDateLong(optionsEndDate)}</p>
          <h1>Final Expiration</h1>
          <span>{getOptionsFinalRank(game)}</span>
        </header>
        <section className="storybook-final-scoreboard" aria-label="Options strategy comparison">
          <article className="storybook-final-player-score">
            <span>Mara's account</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatOptionsPercent(gainPercent)} after {formatOptionsMoney(totalTaxPaid)} in short-term option tax</em>
          </article>
          <div className="storybook-final-rivals">
            <article>
              <span>S&P 500</span>
              <strong>{formatOptionsMoney(game.indexBenchmark)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.indexBenchmark))} buy-and-hold index</em>
              <small className={game.bankroll >= game.indexBenchmark ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.indexBenchmark, "S&P 500")}
              </small>
            </article>
            <article>
              <span>Treasury bills</span>
              <strong>{formatOptionsMoney(game.billsBenchmark)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.billsBenchmark))} bills benchmark</em>
              <small className={game.bankroll >= game.billsBenchmark ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.billsBenchmark, "Bills")}
              </small>
            </article>
            <article>
              <span>Perfect tape</span>
              <strong>{formatOptionsMoney(game.perfectTape)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.perfectTape))} best choice and close timing</em>
              <small className={game.bankroll >= game.perfectTape ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.perfectTape, "Perfect tape")}
              </small>
            </article>
          </div>
        </section>

        <section className="storybook-final-analytics" aria-label="Final options performance charts">
          <ResultsPerformanceChart
            ariaLabel="Line chart comparing Mara, the S&P 500, and Treasury bills by option trade"
            endDate={optionsEndDate}
            formatMoney={formatOptionsMoney}
            points={performancePoints}
            series={[
              { key: "mara", label: "Mara", className: "jonah" },
              { key: "index", label: "S&P", className: "eli" },
              { key: "bills", label: "Bills", className: "ruth" },
            ]}
            startDate={optionsStartDate}
            summary={formatCountNoun(Math.max(0, performancePoints.length - 1), "settled trade")}
            xAxisLabel="X: Trades"
            yAxisLabel="Y: Account"
          />
          <ResultsMoveImpactChart
            ariaLabel="Bar chart showing Mara's gain or loss after each option trade"
            formatMoneyDelta={formatOptionsMoneyDelta}
            impacts={game.results.map((result) => ({ date: result.target.date, profit: result.profit }))}
          />
        </section>

        <section className="storybook-final-metrics" aria-label="Options performance metrics">
          <article>
            <span>Trades made</span>
            <strong>{game.results.length}</strong>
            <em>{formatCountNoun(profitableTrades, "winner")}</em>
          </article>
          <article>
            <span>Premium paid</span>
            <strong>{formatOptionsMoney(totalPremiumPaid)}</strong>
            <em>{formatOptionsPercent(totalPremiumPaid > 0 ? (totalPremiumPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
          <article>
            <span>Short-term tax</span>
            <strong>{formatOptionsMoney(totalTaxPaid)}</strong>
            <em>{formatOptionsPercent(totalTaxPaid > 0 ? (totalTaxPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
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
          <a className="primary-action legacy-primary" href="/games/front-page-fortune">
            Play Next: Front Page Fortune
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
          <p>{optionsStory.ending}</p>
          <p>
            Mara started with {formatOptionsMoney(startingBankroll)} and a quote case full of future market pages. Each jump forced her to decide whether the headline deserved calls, puts, a straddle, or the patience of Treasury bills.
          </p>
        </section>
      </section>
      {finalJournalOpen && <OptionsFinalJournalOverlay game={game} onClose={() => setFinalJournalOpen(false)} />}
      {leaderboardOpen && (
        <InvestmentLeaderboardOverlay
          benchmarkRows={[
            {
              detail: "S&P 500 buy-and-hold",
              id: "options-index-benchmark",
              label: "S&P 500",
              returnPercent: getOptionsStartingGain(game.indexBenchmark),
              score: game.indexBenchmark,
            },
            {
              detail: "Treasury bills",
              id: "options-bills-benchmark",
              label: "Bills",
              returnPercent: getOptionsStartingGain(game.billsBenchmark),
              score: game.billsBenchmark,
            },
            {
              detail: "Best option choice and close timing each window",
              id: "options-perfect-benchmark",
              label: "Perfect tape",
              returnPercent: getOptionsStartingGain(game.perfectTape),
              score: game.perfectTape,
            },
          ]}
          currentRunDetail={`${formatCountNoun(game.results.length, "trade")} · ${formatOptionsMoney(totalTaxPaid)} tax`}
          formatDateLong={formatDateLong}
          formatMoney={formatOptionsMoney}
          formatPercent={formatOptionsPercent}
          gameSlug="expiration-date"
          gameTitle="Expiration Date"
          moves={game.results.length}
          onClose={() => setLeaderboardOpen(false)}
          onSubmitted={setSubmittedScore}
          periodLabel="7 years"
          reallocations={game.results.filter((result, index, results) => index > 0 && result.choice !== results[index - 1]?.choice).length}
          returnPercent={gainPercent}
          score={game.bankroll}
          storageKey="charged-alpha-options-fortune-leaderboard"
          submittedEntry={submittedScore}
          taxPaid={totalTaxPaid}
        />
      )}
    </main>
  );
}

const optionsCompactDashboardQuery = "(max-width: 767px)";

function getMatchesOptionsCompactDashboard() {
  return typeof window !== "undefined" && window.matchMedia(optionsCompactDashboardQuery).matches;
}

function useOptionsCompactDashboard() {
  const [compact, setCompact] = useState(getMatchesOptionsCompactDashboard);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const query = window.matchMedia(optionsCompactDashboardQuery);
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return compact;
}

export function OptionsFortuneGame() {
  const [game, setGame] = useState(createOptionsFortune);
  const [introPage, setIntroPage] = useState<IntroPage>("setup");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [timingCoachSeen, setTimingCoachSeen] = useState(false);
  const [timingCoachResult, setTimingCoachResult] = useState<OptionsResult | null>(null);
  const [transitionResult, setTransitionResult] = useState<OptionsResult | null>(null);
  const compactDashboard = useOptionsCompactDashboard();
  const transitionTimerRef = useRef<number | null>(null);
  const currentEvent = getCurrentOptionsEvent(game);
  const selectedTarget = getSelectedOptionsTarget(game);
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
    const next = startOptionsFortune(game);
    setGame(next);
    setGuideOpen(true);
  };

  const scheduleTransitionClear = (duration = timeJumpTransitionDurationMs) => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitionResult(null);
      transitionTimerRef.current = null;
    }, duration);
  };

  const restart = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setGame(resetOptionsFortune());
    setIntroPage("setup");
    setOverlay(null);
    setGuideOpen(false);
    setTimingCoachSeen(false);
    setTimingCoachResult(null);
    setTransitionResult(null);
  };

  const executePlay = () => {
    setGame((current) => {
      const next = playOptionsRound(current);
      const result = next.results.at(-1);
      if (result && result !== current.results.at(-1)) {
        setTransitionResult(result);
        if (result.choice === "bills") {
          scheduleTransitionClear(optionsBillsTransitionDurationMs);
        }
      }
      return next;
    });
  };

  const play = () => {
    if (!timingCoachSeen && game.choice !== "bills") {
      setTimingCoachResult(createOptionsPreviewResult(game));
      return;
    }

    executePlay();
  };

  const startTimingCoachPlay = () => {
    setTimingCoachSeen(true);
    setTimingCoachResult(null);
    executePlay();
  };

  const closePositionEarly = (snapshot: TimeJumpCloseSnapshot) => {
    setGame((current) => {
      const next = closeLatestOptionsResult(current, snapshot.date, snapshot.value, snapshot.progress);
      const updatedResult = next.results.at(-1);
      if (updatedResult && updatedResult !== current.results.at(-1)) {
        setTransitionResult(updatedResult);
        if (transitionTimerRef.current) {
          window.clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = null;
        }
      }
      return next;
    });
  };

  if (game.phase === "intro") {
    return <OptionsIntro game={game} introPage={introPage} onBegin={begin} onTurnPage={() => setIntroPage("rules")} />;
  }

  if (game.phase === "complete") {
    return (
      <>
        <OptionsFinalScreen game={game} onRestart={restart} />
        {transitionResult && (
          <OptionsTransitionOverlay
            game={game}
            onClosePosition={closePositionEarly}
            onDismiss={() => setTransitionResult(null)}
            result={transitionResult}
          />
        )}
      </>
    );
  }

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell choose options-fortune-shell">
      <section className="storybook-play-book dashboard-book options-dashboard-book">
        <header className="storybook-play-head">
          <div className="storybook-top-portfolio" data-guide-target="portfolio-status">
            <span>Page {game.currentIndex + 1} / {game.events.length} · {formatDateLong(currentEvent.date)}</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em className={`storybook-top-performance ${getTone(gain)}`}>{formatOptionsMoney(gain)} / {formatOptionsPercent(gainPercent)}</em>
            <small>{optionChoiceLabels[game.choice]}</small>
          </div>
          <button className="icon-reset secondary-action compact" type="button" onClick={restart} aria-label="Reset Expiration Date">
            <RotateCcw size={15} />
          </button>
        </header>

        <div className="storybook-one-screen dashboard-clean options-one-screen">
          <OptionsDateConsole
            compact={compactDashboard}
            game={game}
            lastResult={lastResult}
            onChoose={(choice) => setGame((current) => setOptionsChoice(current, choice))}
            onOpenArticle={() => setOverlay("article")}
            onPlay={play}
            onSelectTarget={(targetIndex) => setGame((current) => setOptionsTargetIndex(current, targetIndex))}
          />
          {!compactDashboard && (
            <OptionsPreviewCard
              currentDate={currentEvent.date}
              lastResult={lastResult}
              onOpen={() => setOverlay("article")}
              target={selectedTarget}
            />
          )}
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

      {transitionResult && (
        <OptionsTransitionOverlay
          game={game}
          onClosePosition={closePositionEarly}
          onDismiss={() => setTransitionResult(null)}
          result={transitionResult}
        />
      )}
      {guideOpen && <OptionsDashboardGuide compact={compactDashboard} onStart={() => setGuideOpen(false)} />}
      {timingCoachResult && <OptionsTimingCoachOverlay result={timingCoachResult} onStart={startTimingCoachPlay} />}
      {overlay === "article" && <OptionsArticleOverlay target={selectedTarget} onClose={() => setOverlay(null)} />}
      {overlay === "journal" && <OptionsJournalOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "ledger" && <OptionsLedgerOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "index" && (
        <OptionsIndexOverlay
          game={game}
          onClose={() => setOverlay(null)}
          onSelect={(targetIndex) => {
            setGame((current) => setOptionsTargetIndex(current, targetIndex));
            setOverlay(null);
          }}
        />
      )}
      <p className="compliance-disclaimer">Educational simulation. Options involve risk and can expire worthless.</p>
    </main>
  );
}
