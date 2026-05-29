import {
  calculateCashBondReturnBetween,
  formatMoney,
  formatPercent,
  formatYearsBetween,
  startingBankroll,
} from "../../headline-market/simulation/headlineMarket";
import {
  futuresHeadlineEvents,
  type FuturesContractChoice,
  type FuturesHeadlineEvent,
} from "../content/futuresHeadlines";

export type FuturesChoice = "bills" | FuturesContractChoice;

export interface FuturesTarget {
  index: number;
  date: string;
  label: string;
  prices: Record<FuturesContractChoice, number>;
  event?: FuturesHeadlineEvent;
  isFinal: boolean;
}

export interface FuturesOutcome {
  choice: FuturesChoice;
  startingBankroll: number;
  grossEndingBankroll: number;
  endingBankroll: number;
  profit: number;
  tax: number;
  commodityReturn: number;
  billReturn: number;
  marginRate: number;
  margin: number;
  billsReserve: number;
  futuresPnL: number;
  notional: number;
  contractCount: number;
  contractInvestment: number;
  contractValue: number;
  exposureLabel: string;
}

export interface FuturesResult extends FuturesOutcome {
  event: FuturesHeadlineEvent;
  target: FuturesTarget;
  targetIndex: number;
}

export interface FuturesFortuneState {
  phase: "intro" | "choose" | "complete";
  currentIndex: number;
  selectedTargetIndex: number;
  choice: FuturesChoice;
  bankroll: number;
  events: FuturesHeadlineEvent[];
  results: FuturesResult[];
  cornBenchmark: number;
  soybeanBenchmark: number;
  wheatBenchmark: number;
  billsBenchmark: number;
  perfectTape: number;
}

export const futuresTitle = "Harvest Ledger";
export { startingBankroll };

export const futuresStartDate = "2010-08-06";
export const futuresEndDate = "2020-08-31";
export const futuresTaxRate = 0.15;
export const futuresContractBushels = 5000;
export const futuresChoiceOrder: FuturesChoice[] = ["bills", "corn", "soybeans", "wheat"];

export const futuresChoiceLabels: Record<FuturesChoice, string> = {
  bills: "Treasury Bills",
  corn: "Corn Futures",
  soybeans: "Soybean Futures",
  wheat: "Wheat Futures",
};

export const futuresChoiceShortLabels: Record<FuturesChoice, string> = {
  bills: "T-Bills",
  corn: "Corn",
  soybeans: "Soybeans",
  wheat: "Wheat",
};

export const futuresChoiceDescriptions: Record<FuturesChoice, string> = {
  bills: "100% Treasury bills. Slow, steady, and outside the grain pit.",
  corn: "Buy as many whole corn contracts as the account can afford; leftover cash earns Treasury bills.",
  soybeans: "Buy as many whole soybean contracts as the account can afford; leftover cash earns Treasury bills.",
  wheat: "Buy as many whole wheat contracts as the account can afford; leftover cash earns Treasury bills.",
};

export const futuresChoiceLessons: Record<FuturesChoice, string> = {
  bills: "Treasury bills teach opportunity cost: safety can beat a bad crop trade, but it misses commodity rallies.",
  corn: "Corn teaches acreage, ethanol, feed demand, and weather sensitivity.",
  soybeans: "Soybeans teach export demand and trade-policy risk.",
  wheat: "Wheat teaches global supply shocks and weather risk beyond the U.S. Corn Belt.",
};

const futuresEvents = futuresHeadlineEvents;
const finalPrices: Record<FuturesContractChoice, number> = {
  corn: 348.5,
  soybeans: 951.25,
  wheat: 544.25,
};

function getBoundedIndex(index: number, events = futuresEvents) {
  return Math.max(0, Math.min(index, events.length));
}

export function createFuturesFortune(): FuturesFortuneState {
  return {
    phase: "intro",
    currentIndex: 0,
    selectedTargetIndex: Math.min(1, futuresEvents.length),
    choice: "bills",
    bankroll: startingBankroll,
    events: futuresEvents,
    results: [],
    cornBenchmark: startingBankroll,
    soybeanBenchmark: startingBankroll,
    wheatBenchmark: startingBankroll,
    billsBenchmark: startingBankroll,
    perfectTape: startingBankroll,
  };
}

export function startFuturesFortune(state: FuturesFortuneState): FuturesFortuneState {
  return {
    ...createFuturesFortune(),
    phase: "choose",
    events: state.events,
  };
}

export function resetFuturesFortune() {
  return createFuturesFortune();
}

export function getFuturesTarget(state: Pick<FuturesFortuneState, "events">, targetIndex: number): FuturesTarget {
  const index = getBoundedIndex(targetIndex, state.events);

  if (index >= state.events.length) {
    return {
      index,
      date: futuresEndDate,
      label: "Final Settlement",
      prices: finalPrices,
      isFinal: true,
    };
  }

  const event = state.events[index];
  return {
    index,
    date: event.date,
    event,
    label: event.era,
    prices: event.futuresPrices,
    isFinal: false,
  };
}

export function getCurrentFuturesEvent(state: FuturesFortuneState) {
  return state.events[state.currentIndex] ?? state.events[0];
}

export function getSelectedFuturesTarget(state: FuturesFortuneState) {
  return getFuturesTarget(state, state.selectedTargetIndex);
}

export function setFuturesTargetIndex(state: FuturesFortuneState, targetIndex: number): FuturesFortuneState {
  if (state.phase !== "choose") {
    return state;
  }

  return {
    ...state,
    selectedTargetIndex: Math.max(state.currentIndex + 1, getBoundedIndex(targetIndex, state.events)),
  };
}

export function setFuturesChoice(state: FuturesFortuneState, choice: FuturesChoice): FuturesFortuneState {
  return {
    ...state,
    choice,
  };
}

function getCommodityReturn(event: FuturesHeadlineEvent, target: FuturesTarget, choice: FuturesChoice) {
  if (choice === "bills") {
    return 0;
  }
  const start = event.futuresPrices[choice];
  const end = target.prices[choice];
  return ((end / start) - 1) * 100;
}

function getFuturesContractValue(centsPerBushel: number) {
  return (centsPerBushel / 100) * futuresContractBushels;
}

export function calculateFuturesOutcome(
  bankroll: number,
  event: FuturesHeadlineEvent,
  target: FuturesTarget,
  choice: FuturesChoice,
): FuturesOutcome {
  const billReturn = calculateCashBondReturnBetween(event.date, target.date);
  const commodityReturn = getCommodityReturn(event, target, choice);
  const contractValue = choice === "bills" ? 0 : getFuturesContractValue(event.futuresPrices[choice]);
  const contractCount = choice === "bills" || contractValue <= 0 ? 0 : Math.floor(bankroll / contractValue);
  const contractInvestment = contractCount * contractValue;
  const billsReserve = choice === "bills" ? bankroll : Math.max(0, bankroll - contractInvestment);
  const notional = contractInvestment;
  const margin = contractInvestment;
  const marginRate = bankroll > 0 ? contractInvestment / bankroll : 0;
  const priceChangePerContract = choice === "bills" ? 0 : ((target.prices[choice] - event.futuresPrices[choice]) / 100) * futuresContractBushels;
  const futuresPnL = contractCount * priceChangePerContract;
  const cashEnding = billsReserve * (1 + billReturn / 100) + contractInvestment;
  const grossEndingBankroll = cashEnding + futuresPnL;
  const grossProfit = grossEndingBankroll - bankroll;
  const tax = grossProfit > 0 ? grossProfit * futuresTaxRate : 0;
  const endingBankroll = Math.max(0, grossEndingBankroll - tax);

  return {
    choice,
    startingBankroll: bankroll,
    grossEndingBankroll,
    endingBankroll,
    profit: endingBankroll - bankroll,
    tax,
    commodityReturn,
    billReturn,
    marginRate,
    margin,
    billsReserve,
    futuresPnL,
    notional,
    contractCount,
    contractInvestment,
    contractValue,
    exposureLabel: choice === "bills" ? "100% Treasury bills" : `${contractCount} ${futuresChoiceShortLabels[choice]} ${contractCount === 1 ? "contract" : "contracts"}`,
  };
}

function getBestChoiceForWindow(bankroll: number, event: FuturesHeadlineEvent, target: FuturesTarget) {
  return futuresChoiceOrder
    .map((choice) => calculateFuturesOutcome(bankroll, event, target, choice))
    .sort((a, b) => b.endingBankroll - a.endingBankroll)[0];
}

export function getProjectedOutcomes(state: FuturesFortuneState) {
  const event = getCurrentFuturesEvent(state);
  const target = getSelectedFuturesTarget(state);
  return Object.fromEntries(
    futuresChoiceOrder.map((choice) => [choice, calculateFuturesOutcome(state.bankroll, event, target, choice)]),
  ) as Record<FuturesChoice, FuturesOutcome>;
}

export function playFuturesRound(state: FuturesFortuneState): FuturesFortuneState {
  if (state.phase !== "choose") {
    return state;
  }

  const event = getCurrentFuturesEvent(state);
  const targetIndex = Math.max(state.currentIndex + 1, Math.min(state.selectedTargetIndex, state.events.length));
  const target = getFuturesTarget(state, targetIndex);
  const outcome = calculateFuturesOutcome(state.bankroll, event, target, state.choice);
  const result: FuturesResult = {
    ...outcome,
    event,
    target,
    targetIndex,
  };
  const cornBenchmark = calculateFuturesOutcome(state.cornBenchmark, event, target, "corn").endingBankroll;
  const soybeanBenchmark = calculateFuturesOutcome(state.soybeanBenchmark, event, target, "soybeans").endingBankroll;
  const wheatBenchmark = calculateFuturesOutcome(state.wheatBenchmark, event, target, "wheat").endingBankroll;
  const billsBenchmark = state.billsBenchmark * (1 + outcome.billReturn / 100);
  const perfectTape = getBestChoiceForWindow(state.perfectTape, event, target).endingBankroll;

  return {
    ...state,
    phase: target.isFinal ? "complete" : "choose",
    currentIndex: targetIndex,
    selectedTargetIndex: Math.min(targetIndex + 1, state.events.length),
    bankroll: outcome.endingBankroll,
    results: [...state.results, result],
    cornBenchmark,
    soybeanBenchmark,
    wheatBenchmark,
    billsBenchmark,
    perfectTape,
  };
}

export function getProgressPercent(state: FuturesFortuneState, index = state.currentIndex) {
  return state.events.length > 0 ? (Math.min(index, state.events.length) / state.events.length) * 100 : 0;
}

export function isMarketVisionUnlocked(state: FuturesFortuneState) {
  return state.currentIndex >= Math.floor(state.events.length / 2);
}

export function formatFuturesMoney(value: number) {
  return formatMoney(value);
}

export function formatFuturesPercent(value: number) {
  return formatPercent(value);
}

export function formatFuturesSpan(startDate: string, endDate: string) {
  return formatYearsBetween(startDate, endDate);
}
