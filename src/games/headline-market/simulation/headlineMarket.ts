import { headlineEvents, headlineMarketTimeline, type HeadlineEvent, type LegacyTimeline } from "../content/events";

export const startingBankroll = 100_000;
export const roundCount = headlineEvents.length;
export const capitalGainsTaxRate = 0.15;
export type AssetChoice = "hold" | "default" | "cash" | "sp500" | "gold";

export interface PortfolioPositions {
  cash: number;
  sp500: number;
  gold: number;
}

export interface HeadlineMarketResult {
  event: HeadlineEvent;
  targetIndex: number;
  targetDate: string;
  targetLabel: string;
  targetIsFinal: boolean;
  startingBankroll: number;
  decisionBankroll: number;
  assetChoice: AssetChoice;
  defaultCashPercent: number;
  defaultSpPercent: number;
  defaultGoldPercent: number;
  assetReturn: number;
  stockReturn: number;
  goldReturn: number;
  cashBondReturn: number;
  startingPositions: PortfolioPositions;
  decisionPositions: PortfolioPositions;
  targetPositions: PortfolioPositions;
  endingPositions: PortfolioPositions;
  isReallocation: boolean;
  grossEndingBankroll: number;
  grossProfit: number;
  taxPenalty: number;
  endingBankroll: number;
  profit: number;
  brotherEndingBankroll: number;
  sisterEndingBankroll: number;
  oracleEndingBankroll: number;
}

export interface BenchmarkFinals {
  cashBonds: number;
  investedBeforeHeadline: number;
  brotherIndexFund: number;
  sisterGold: number;
  perfectNewspaperTiming: number;
}

export interface HeadlineMarketState {
  phase: "start" | "choose" | "reveal" | "complete";
  seed: string;
  roundIndex: number;
  selectedTargetIndex: number;
  bankroll: number;
  assetChoice: AssetChoice;
  defaultSpPercent: number;
  defaultGoldPercent: number;
  currentPositions: PortfolioPositions;
  taxBasis: number;
  timeline: LegacyTimeline;
  events: HeadlineEvent[];
  results: HeadlineMarketResult[];
  brotherBankroll: number;
  sisterBankroll: number;
  oracleBankroll: number;
}

export interface MarketTarget {
  index: number;
  date: string;
  label: string;
  sp500: number;
  gold: number;
  isFinal: boolean;
}

type ReturnTarget = Pick<MarketTarget, "sp500" | "gold">;

const cashBondAnnualYields: Record<string, number> = {
  1987: 5.53,
  1988: 6.39,
  1989: 7.8,
  1990: 7.18,
  1991: 5.15,
  1992: 3.29,
  1993: 2.87,
  1994: 4.07,
  1995: 5.28,
  1996: 4.81,
  1997: 4.85,
  1998: 4.57,
  1999: 4.46,
  2000: 5.62,
  2001: 3.23,
  2002: 1.54,
  2003: 0.97,
  2004: 1.31,
  2005: 3.03,
  2006: 4.55,
  2007: 4.19,
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectHeadlineEvents(seed: string, count = roundCount) {
  const offset = hashSeed(seed) % headlineEvents.length;
  const rotated = [...headlineEvents.slice(offset), ...headlineEvents.slice(0, offset)];
  return rotated.sort((a, b) => a.date.localeCompare(b.date)).slice(0, count);
}

export function calculateBenchmarkFinals(timeline = headlineMarketTimeline, oracleBankroll = calculatePerfectTiming(timeline.events)) {
  return {
    cashBonds: calculateCashBondValue(startingBankroll, timeline.inheritanceDate, timeline.periodEndDate),
    investedBeforeHeadline: startingBankroll * (timeline.finalClose / timeline.preHeadlineClose),
    brotherIndexFund: startingBankroll * (timeline.finalClose / timeline.inheritanceClose),
    sisterGold: startingBankroll * (timeline.finalGold / timeline.inheritanceGold),
    perfectNewspaperTiming: oracleBankroll,
  };
}

function getBestChapterReturn(event: HeadlineEvent, target?: ReturnTarget) {
  return Math.max(
    getCashBondReturn(event, target),
    getStockReturn(event, target),
    getGoldReturn(event, target),
  );
}

export function calculatePerfectTiming(events: HeadlineEvent[]) {
  return events.reduce((bankroll, event) => {
    const grossEndingBankroll = bankroll * (1 + getBestChapterReturn(event) / 100);
    const grossProfit = grossEndingBankroll - bankroll;
    return grossEndingBankroll - calculateCapitalGainsTax(grossProfit);
  }, startingBankroll);
}

export function createHeadlineMarket(seed = "mercer-future-papers"): HeadlineMarketState {
  const events = selectHeadlineEvents(seed);

  return {
    phase: "start",
    seed,
    roundIndex: 0,
    selectedTargetIndex: Math.min(1, events.length),
    bankroll: startingBankroll,
    assetChoice: "default",
    defaultSpPercent: 60,
    defaultGoldPercent: 0,
    currentPositions: createCashPositions(startingBankroll),
    taxBasis: startingBankroll,
    timeline: headlineMarketTimeline,
    events,
    results: [],
    brotherBankroll: startingBankroll,
    sisterBankroll: startingBankroll,
    oracleBankroll: startingBankroll,
  };
}

export function startHeadlineMarket(state: HeadlineMarketState): HeadlineMarketState {
  return {
    ...state,
    phase: "choose",
    roundIndex: 0,
    selectedTargetIndex: Math.min(1, state.events.length),
    bankroll: startingBankroll,
    assetChoice: "default",
    currentPositions: createCashPositions(startingBankroll),
    taxBasis: startingBankroll,
    results: [],
    brotherBankroll: startingBankroll,
    sisterBankroll: startingBankroll,
    oracleBankroll: startingBankroll,
  };
}

export function setAssetChoice(state: HeadlineMarketState, assetChoice: AssetChoice): HeadlineMarketState {
  return {
    ...state,
    assetChoice,
  };
}

export const setAllocation = setAssetChoice;

export function getDefaultTargetIndex(state: Pick<HeadlineMarketState, "events" | "roundIndex">) {
  return Math.min(state.roundIndex + 1, state.events.length);
}

export function getTargetMarketPoint(
  state: Pick<HeadlineMarketState, "events" | "timeline">,
  targetIndex: number,
): MarketTarget {
  const boundedIndex = Math.max(0, Math.min(targetIndex, state.events.length));

  if (boundedIndex >= state.events.length) {
    return {
      index: state.events.length,
      date: state.timeline.periodEndDate,
      label: "Final ledger",
      sp500: state.timeline.finalClose,
      gold: state.timeline.finalGold,
      isFinal: true,
    };
  }

  const event = state.events[boundedIndex];
  return {
    index: boundedIndex,
    date: event.date,
    label: event.era,
    sp500: event.startClose,
    gold: event.goldStart,
    isFinal: false,
  };
}

export function setTargetIndex(state: HeadlineMarketState, targetIndex: number): HeadlineMarketState {
  const minimumTargetIndex = getDefaultTargetIndex(state);
  const maximumTargetIndex = state.events.length;

  return {
    ...state,
    selectedTargetIndex: Math.max(minimumTargetIndex, Math.min(maximumTargetIndex, targetIndex)),
  };
}

export function setDefaultPosition(
  state: HeadlineMarketState,
  nextMix: Partial<Pick<HeadlineMarketState, "defaultSpPercent" | "defaultGoldPercent">>,
): HeadlineMarketState {
  const requestedSp = Math.max(0, Math.min(100, Math.round(nextMix.defaultSpPercent ?? state.defaultSpPercent)));
  const requestedGold = Math.max(0, Math.min(100, Math.round(nextMix.defaultGoldPercent ?? state.defaultGoldPercent)));
  const total = requestedSp + requestedGold;

  if (total <= 100) {
    return {
      ...state,
      defaultSpPercent: requestedSp,
      defaultGoldPercent: requestedGold,
    };
  }

  if (nextMix.defaultSpPercent !== undefined) {
    return {
      ...state,
      defaultSpPercent: Math.max(0, 100 - requestedGold),
      defaultGoldPercent: requestedGold,
    };
  }

  return {
    ...state,
    defaultSpPercent: requestedSp,
    defaultGoldPercent: Math.max(0, 100 - requestedSp),
  };
}

export function getDefaultCashPercent(state: Pick<HeadlineMarketState, "defaultSpPercent" | "defaultGoldPercent">) {
  return Math.max(0, 100 - state.defaultSpPercent - state.defaultGoldPercent);
}

export function createCashPositions(bankroll = startingBankroll): PortfolioPositions {
  return {
    cash: bankroll,
    sp500: 0,
    gold: 0,
  };
}

export function getPositionTotal(positions: PortfolioPositions) {
  return positions.cash + positions.sp500 + positions.gold;
}

export function getPositionPercent(positions: PortfolioPositions, asset: keyof PortfolioPositions) {
  const total = getPositionTotal(positions);
  return total > 0 ? (positions[asset] / total) * 100 : 0;
}

export function getStockReturn(event: HeadlineEvent, target: ReturnTarget = { sp500: event.endClose, gold: event.goldEnd }) {
  return (target.sp500 / event.startClose - 1) * 100;
}

export function getGoldReturn(event: HeadlineEvent, target: ReturnTarget = { sp500: event.endClose, gold: event.goldEnd }) {
  return (target.gold / event.goldStart - 1) * 100;
}

export function getAnnualCashBondYield(date: string) {
  return cashBondAnnualYields[date.slice(0, 4)] ?? 2;
}

export function calculateCashBondReturnBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (end.getTime() <= start.getTime()) {
    return 0;
  }

  let cursor = start;
  let growth = 1;

  while (cursor.getTime() < end.getTime()) {
    const year = cursor.getUTCFullYear();
    const nextYear = new Date(Date.UTC(year + 1, 0, 1));
    const segmentEnd = nextYear.getTime() < end.getTime() ? nextYear : end;
    const years = (segmentEnd.getTime() - cursor.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    growth *= Math.pow(1 + getAnnualCashBondYield(cursor.toISOString().slice(0, 10)) / 100, years);
    cursor = segmentEnd;
  }

  return (growth - 1) * 100;
}

export function getCashBondReturn(
  event: HeadlineEvent,
  target: ReturnTarget & { date?: string } = { sp500: event.endClose, gold: event.goldEnd, date: event.endDate },
) {
  return calculateCashBondReturnBetween(event.date, target.date ?? event.endDate);
}

export function calculateCashBondValue(bankroll: number, startDate: string, endDate: string) {
  return bankroll * (1 + calculateCashBondReturnBetween(startDate, endDate) / 100);
}

export function getMarketPrices(event: HeadlineEvent) {
  return { sp500: event.startClose, gold: event.goldStart };
}

function growPositions(positions: PortfolioPositions, stockReturn: number, goldReturn: number, cashBondReturn = 0): PortfolioPositions {
  return {
    cash: positions.cash * (1 + cashBondReturn / 100),
    sp500: positions.sp500 * (1 + stockReturn / 100),
    gold: positions.gold * (1 + goldReturn / 100),
  };
}

export function getDecisionPositions(state: HeadlineMarketState): PortfolioPositions {
  return state.currentPositions;
}

function getChoiceAllocation(
  assetChoice: AssetChoice,
  defaultMix: Pick<HeadlineMarketState, "defaultSpPercent" | "defaultGoldPercent">,
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
      cash: getDefaultCashPercent(defaultMix),
      sp500: defaultMix.defaultSpPercent,
      gold: defaultMix.defaultGoldPercent,
    };
  }
  if (assetChoice === "sp500") {
    return { cash: 0, sp500: 100, gold: 0 };
  }
  if (assetChoice === "gold") {
    return { cash: 0, sp500: 0, gold: 100 };
  }
  return { cash: 100, sp500: 0, gold: 0 };
}

function allocatePositions(bankroll: number, allocation: PortfolioPositions): PortfolioPositions {
  return {
    cash: bankroll * (allocation.cash / 100),
    sp500: bankroll * (allocation.sp500 / 100),
    gold: bankroll * (allocation.gold / 100),
  };
}

function isSameAllocation(currentPositions: PortfolioPositions, targetAllocation: PortfolioPositions) {
  return (["cash", "sp500", "gold"] as const).every(
    (asset) => Math.abs(getPositionPercent(currentPositions, asset) - targetAllocation[asset]) < 0.5,
  );
}

export function getAssetReturn(
  event: HeadlineEvent,
  assetChoice: AssetChoice,
  defaultMix: Pick<HeadlineMarketState, "defaultSpPercent" | "defaultGoldPercent"> = {
    defaultSpPercent: 60,
    defaultGoldPercent: 0,
  },
  target?: ReturnTarget,
) {
  const stockReturn = getStockReturn(event, target);
  const goldReturn = getGoldReturn(event, target);
  const cashBondReturn = getCashBondReturn(event, target);

  if (assetChoice === "hold") {
    return 0;
  }
  if (assetChoice === "default") {
    return (
      stockReturn * defaultMix.defaultSpPercent +
      goldReturn * defaultMix.defaultGoldPercent +
      cashBondReturn * getDefaultCashPercent(defaultMix)
    ) / 100;
  }
  if (assetChoice === "sp500") {
    return stockReturn;
  }
  if (assetChoice === "gold") {
    return goldReturn;
  }
  return cashBondReturn;
}

export function calculateCapitalGainsTax(grossProfit: number) {
  return grossProfit > 0 ? grossProfit * capitalGainsTaxRate : 0;
}

export function resolveHeadlineRound(state: HeadlineMarketState): HeadlineMarketState {
  if (state.phase !== "choose") {
    return state;
  }

  const event = state.events[state.roundIndex];
  const targetIndex = Math.max(getDefaultTargetIndex(state), Math.min(state.selectedTargetIndex, state.events.length));
  const target = getTargetMarketPoint(state, targetIndex);
  const decisionPositions = getDecisionPositions(state);
  const decisionBankroll = getPositionTotal(decisionPositions);
  const targetAllocation = getChoiceAllocation(state.assetChoice, state, decisionPositions);
  const previousChoice = state.results.at(-1)?.assetChoice;
  const keepsPreviousChoice = Boolean(previousChoice && previousChoice !== "hold" && previousChoice === state.assetChoice);
  const isReallocation = state.assetChoice !== "hold" && !keepsPreviousChoice && !isSameAllocation(decisionPositions, targetAllocation);
  const taxPenalty = isReallocation ? calculateCapitalGainsTax(decisionBankroll - state.taxBasis) : 0;
  const bankrollAfterTax = decisionBankroll - taxPenalty;
  const targetPositions = state.assetChoice === "hold" || keepsPreviousChoice ? decisionPositions : allocatePositions(bankrollAfterTax, targetAllocation);
  const stockReturn = getStockReturn(event, target);
  const goldReturn = getGoldReturn(event, target);
  const cashBondReturn = getCashBondReturn(event, target);
  const endingPositions = growPositions(targetPositions, stockReturn, goldReturn, cashBondReturn);
  const endingBankroll = getPositionTotal(endingPositions);
  const assetReturn = bankrollAfterTax > 0 ? (endingBankroll / bankrollAfterTax - 1) * 100 : 0;
  const grossEndingBankroll = endingBankroll;
  const grossProfit = endingBankroll - bankrollAfterTax;
  const brotherReturn = getStockReturn(event, target);
  const sisterReturn = getGoldReturn(event, target);
  const brotherEndingBankroll = state.brotherBankroll * (1 + brotherReturn / 100);
  const sisterEndingBankroll = state.sisterBankroll * (1 + sisterReturn / 100);
  const oracleGrossEndingBankroll = state.oracleBankroll * (1 + getBestChapterReturn(event, target) / 100);
  const oracleEndingBankroll =
    oracleGrossEndingBankroll - calculateCapitalGainsTax(oracleGrossEndingBankroll - state.oracleBankroll);

  const result: HeadlineMarketResult = {
    event,
    targetIndex,
    targetDate: target.date,
    targetLabel: target.label,
    targetIsFinal: target.isFinal,
    startingBankroll: state.bankroll,
    decisionBankroll,
    assetChoice: state.assetChoice,
    defaultCashPercent: getDefaultCashPercent(state),
    defaultSpPercent: state.defaultSpPercent,
    defaultGoldPercent: state.defaultGoldPercent,
    assetReturn,
    stockReturn,
    goldReturn,
    cashBondReturn,
    startingPositions: state.currentPositions,
    decisionPositions,
    targetPositions,
    endingPositions,
    isReallocation,
    grossEndingBankroll,
    grossProfit,
    taxPenalty,
    endingBankroll,
    profit: endingBankroll - state.bankroll,
    brotherEndingBankroll,
    sisterEndingBankroll,
    oracleEndingBankroll,
  };

  return {
    ...state,
    phase: "reveal",
    bankroll: endingBankroll,
    currentPositions: endingPositions,
    taxBasis: isReallocation ? bankrollAfterTax : state.taxBasis,
    results: [...state.results, result],
    brotherBankroll: brotherEndingBankroll,
    sisterBankroll: sisterEndingBankroll,
    oracleBankroll: oracleEndingBankroll,
  };
}

export function nextHeadlineRound(state: HeadlineMarketState): HeadlineMarketState {
  if (state.phase !== "reveal") {
    return state;
  }

  const nextIndex = state.roundIndex + 1;
  const lastResult = state.results.at(-1);
  const nextTargetIndex = lastResult?.targetIndex ?? nextIndex;
  const nextAssetChoice = lastResult?.assetChoice && lastResult.assetChoice !== "hold" ? lastResult.assetChoice : "default";
  if (nextTargetIndex >= state.events.length) {
    return {
      ...state,
      phase: "complete",
    };
  }

  return {
    ...state,
    phase: "choose",
    roundIndex: nextTargetIndex,
    selectedTargetIndex: Math.min(nextTargetIndex + 1, state.events.length),
    assetChoice: nextAssetChoice,
  };
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatYearsBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  const years = (end - start) / (365.25 * 24 * 60 * 60 * 1000);
  return years < 1 ? `${Math.round(years * 12)} months` : `${years.toFixed(1)} years`;
}

export function getTimingRead(result: HeadlineMarketResult) {
  const bestReturn = Math.max(result.cashBondReturn, result.stockReturn, result.goldReturn);

  if (result.assetChoice === "hold") {
    return "Held the existing positions";
  }
  if (result.assetChoice === "default") {
    return result.isReallocation ? "Rebalanced to the standing policy" : "Stayed with the standing policy";
  }
  if (result.assetReturn === bestReturn && result.assetReturn > 0) {
    return "Found the strongest shelter";
  }
  if (result.assetChoice === "cash" && bestReturn <= 0) {
    return "Protected the inheritance";
  }
  if (result.assetChoice === "cash" && bestReturn > 0) {
    return "Sat out a winning chapter";
  }
  if (result.assetReturn < 0) {
    return "Paid tuition to history";
  }
  if (result.assetChoice === "sp500") {
    return "Followed Eli's market";
  }
  if (result.assetChoice === "gold") {
    return "Followed Ruth's jewelry box";
  }
  return "Kept the envelope closed";
}

export function getFinalRank(state: HeadlineMarketState) {
  const benchmarks = calculateBenchmarkFinals(state.timeline);
  const gain = (state.bankroll / startingBankroll - 1) * 100;
  const oracleGap = benchmarks.perfectNewspaperTiming - state.bankroll;

  if (oracleGap < startingBankroll * 0.05) {
    return "Keeper of the Tote";
  }
  if (state.bankroll >= benchmarks.brotherIndexFund) {
    return "Beat Eli's Index";
  }
  if (state.bankroll >= benchmarks.sisterGold) {
    return "Beat Ruth's Jewelry Box";
  }
  if (gain >= 200) {
    return "Mercer Family Steward";
  }
  if (gain >= 0) {
    return "The Ledger Survived";
  }
  return "The Papers Won";
}
