import { headlineMarketTimeline, type HeadlineEvent } from "../../headline-market/content/events";
import { bondYieldByMonth, sp500DailySeries } from "../../headline-market/content/marketHistory";
import {
  calculateCashBondReturnBetween,
  formatMoney,
  formatPercent,
  formatYearsBetween,
  startingBankroll,
} from "../../headline-market/simulation/headlineMarket";
import { optionsHeadlineEvents } from "../content/optionsHeadlines";

export type OptionChoice = "bills" | "calls" | "puts" | "straddle";

export interface OptionsTarget {
  index: number;
  date: string;
  label: string;
  sp500: number;
  event?: HeadlineEvent;
  isFinal: boolean;
}

export interface OptionOutcome {
  choice: OptionChoice;
  startingBankroll: number;
  grossEndingBankroll: number;
  endingBankroll: number;
  profit: number;
  tax: number;
  underlyingReturn: number;
  billReturn: number;
  premiumRate: number;
  riskFreeRate: number;
  volatility: number;
  optionBudgetRate: number;
  optionBudget: number;
  collateral: number;
  payoff: number;
  breakEvenMove: number;
  notional: number;
  expiredWorthless: boolean;
}

export interface OptionsResult extends OptionOutcome {
  event: HeadlineEvent;
  target: OptionsTarget;
  targetIndex: number;
}

export interface OptionsFortuneState {
  phase: "intro" | "choose" | "complete";
  currentIndex: number;
  selectedTargetIndex: number;
  choice: OptionChoice;
  bankroll: number;
  events: HeadlineEvent[];
  results: OptionsResult[];
  indexBenchmark: number;
  billsBenchmark: number;
  perfectTape: number;
}

export const optionsTitle = "Expiration Date";
export { startingBankroll };

export const optionsStartDate = "1997-10-27";
export const optionsEndDate = "2007-10-26";
export const optionTaxRate = 0.15;
export const optionChoiceOrder: OptionChoice[] = ["bills", "calls", "puts", "straddle"];

export const optionChoiceLabels: Record<OptionChoice, string> = {
  bills: "Treasury Bills",
  calls: "Buy Calls",
  puts: "Buy Puts",
  straddle: "Buy Straddle",
};

export const optionChoiceShortLabels: Record<OptionChoice, string> = {
  bills: "Bills",
  calls: "Calls",
  puts: "Puts",
  straddle: "Straddle",
};

export const optionChoiceDescriptions: Record<OptionChoice, string> = {
  bills: "100% Treasury bills. Slow, steady, and no premium at risk.",
  calls: "35% buys S&P 500 calls. The rest waits in bills.",
  puts: "35% buys S&P 500 puts. The rest waits in bills.",
  straddle: "45% buys calls and puts together. The rest waits in bills.",
};

export const optionChoiceLessons: Record<OptionChoice, string> = {
  bills: "Bills teach opportunity cost: safety can win in bad windows, but it also sits out rallies.",
  calls: "Calls teach directional upside: the market needs to rise enough to overcome the option premium.",
  puts: "Puts teach downside convexity: the market needs to fall enough before protection becomes profitable.",
  straddle: "Straddles teach volatility: direction matters less, but the move must be large enough to pay for two premiums.",
};

const optionEvents = optionsHeadlineEvents;

function getBoundedIndex(index: number, events = optionEvents) {
  return Math.max(0, Math.min(index, events.length));
}

export function createOptionsFortune(): OptionsFortuneState {
  return {
    phase: "intro",
    currentIndex: 0,
    selectedTargetIndex: Math.min(1, optionEvents.length),
    choice: "bills",
    bankroll: startingBankroll,
    events: optionEvents,
    results: [],
    indexBenchmark: startingBankroll,
    billsBenchmark: startingBankroll,
    perfectTape: startingBankroll,
  };
}

export function startOptionsFortune(state: OptionsFortuneState): OptionsFortuneState {
  return {
    ...createOptionsFortune(),
    phase: "choose",
    events: state.events,
  };
}

export function resetOptionsFortune() {
  return createOptionsFortune();
}

export function getOptionsTarget(state: Pick<OptionsFortuneState, "events">, targetIndex: number): OptionsTarget {
  const index = getBoundedIndex(targetIndex, state.events);

  if (index >= state.events.length) {
    return {
      index,
      date: optionsEndDate,
      label: "Final Expiration",
      sp500: headlineMarketTimeline.finalClose,
      isFinal: true,
    };
  }

  const event = state.events[index];
  return {
    index,
    date: event.date,
    event,
    label: event.era,
    sp500: event.startClose,
    isFinal: false,
  };
}

export function getCurrentOptionsEvent(state: OptionsFortuneState) {
  return state.events[state.currentIndex] ?? state.events[0];
}

export function getSelectedOptionsTarget(state: OptionsFortuneState) {
  return getOptionsTarget(state, state.selectedTargetIndex);
}

export function setOptionsTargetIndex(state: OptionsFortuneState, targetIndex: number): OptionsFortuneState {
  if (state.phase !== "choose") {
    return state;
  }

  return {
    ...state,
    selectedTargetIndex: Math.max(state.currentIndex + 1, getBoundedIndex(targetIndex, state.events)),
  };
}

export function setOptionsChoice(state: OptionsFortuneState, choice: OptionChoice): OptionsFortuneState {
  return {
    ...state,
    choice,
  };
}

export function getDaysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
}

function clampNumber(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function normalCdf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
  return 0.5 * (1 + sign * erf);
}

function getHistoricalRiskFreeRate(date: string) {
  const value = bondYieldByMonth[date.slice(0, 7)];
  return Number.isFinite(value) ? Math.max(0, value / 100) : 0.03;
}

function getTrailingRealizedVolatility(date: string, lookbackDays = 126) {
  const endIndex = sp500DailySeries.findIndex((point) => point.date >= date);
  const end = endIndex > 1 ? endIndex : sp500DailySeries.length - 1;
  const start = Math.max(1, end - lookbackDays);
  const returns: number[] = [];

  for (let index = start; index <= end; index += 1) {
    const previous = sp500DailySeries[index - 1]?.value;
    const current = sp500DailySeries[index]?.value;
    if (previous > 0 && current > 0) {
      returns.push(Math.log(current / previous));
    }
  }

  if (returns.length < 20) {
    return 0.2;
  }

  const mean = returns.reduce((total, value) => total + value, 0) / returns.length;
  const variance = returns.reduce((total, value) => total + (value - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  return clampNumber(Math.sqrt(variance) * Math.sqrt(252), 0.08, 0.8);
}

function getBlackScholesPremiumRate({
  optionType,
  riskFreeRate,
  spot,
  strike,
  termYears,
  volatility,
}: {
  optionType: "call" | "put";
  riskFreeRate: number;
  spot: number;
  strike: number;
  termYears: number;
  volatility: number;
}) {
  const safeTerm = Math.max(1 / 365, termYears);
  const safeVolatility = Math.max(0.01, volatility);
  const sqrtTerm = Math.sqrt(safeTerm);
  const d1 = (Math.log(spot / strike) + (riskFreeRate + (safeVolatility ** 2) / 2) * safeTerm) / (safeVolatility * sqrtTerm);
  const d2 = d1 - safeVolatility * sqrtTerm;
  const discountedStrike = strike * Math.exp(-riskFreeRate * safeTerm);
  const premium =
    optionType === "call"
      ? spot * normalCdf(d1) - discountedStrike * normalCdf(d2)
      : discountedStrike * normalCdf(-d2) - spot * normalCdf(-d1);
  return clampNumber(premium / spot, 0.0025, 0.95);
}

export function estimatePremiumRate(event: HeadlineEvent, target: OptionsTarget, choice: OptionChoice = "calls") {
  if (choice === "bills") {
    return 0;
  }
  const termYears = getDaysBetween(event.date, target.date) / 365;
  const riskFreeRate = getHistoricalRiskFreeRate(event.date);
  const volatility = getTrailingRealizedVolatility(event.date);
  const spot = event.startClose;
  const strike = spot;
  const callPremiumRate = getBlackScholesPremiumRate({
    optionType: "call",
    riskFreeRate,
    spot,
    strike,
    termYears,
    volatility,
  });
  const putPremiumRate = getBlackScholesPremiumRate({
    optionType: "put",
    riskFreeRate,
    spot,
    strike,
    termYears,
    volatility,
  });

  if (choice === "puts") {
    return putPremiumRate;
  }
  if (choice === "straddle") {
    return callPremiumRate + putPremiumRate;
  }
  return callPremiumRate;
}

export function getOptionBudgetRate(choice: OptionChoice) {
  if (choice === "calls" || choice === "puts") {
    return 0.35;
  }
  if (choice === "straddle") {
    return 0.45;
  }
  return 0;
}

function calculatePayoff(choice: OptionChoice, optionBudget: number, premiumRate: number, underlyingReturn: number) {
  if (choice === "bills" || optionBudget <= 0 || premiumRate <= 0) {
    return 0;
  }

  const move = underlyingReturn / 100;
  const winningMove =
    choice === "calls" ? Math.max(0, move) : choice === "puts" ? Math.max(0, -move) : Math.abs(move);
  return optionBudget * (winningMove / premiumRate);
}

export function calculateOptionOutcome(
  bankroll: number,
  event: HeadlineEvent,
  target: OptionsTarget,
  choice: OptionChoice,
): OptionOutcome {
  const underlyingReturn = (target.sp500 / event.startClose - 1) * 100;
  const billReturn = calculateCashBondReturnBetween(event.date, target.date);
  const optionBudgetRate = getOptionBudgetRate(choice);
  const optionBudget = bankroll * optionBudgetRate;
  const collateral = bankroll - optionBudget;
  const premiumRate = estimatePremiumRate(event, target, choice);
  const riskFreeRate = getHistoricalRiskFreeRate(event.date);
  const volatility = getTrailingRealizedVolatility(event.date);
  const payoff = calculatePayoff(choice, optionBudget, premiumRate, underlyingReturn);
  const collateralEnding = collateral * (1 + billReturn / 100);
  const grossEndingBankroll = choice === "bills" ? bankroll * (1 + billReturn / 100) : collateralEnding + payoff;
  const grossProfit = grossEndingBankroll - bankroll;
  const tax = grossProfit > 0 ? grossProfit * optionTaxRate : 0;
  const endingBankroll = grossEndingBankroll - tax;

  return {
    choice,
    startingBankroll: bankroll,
    grossEndingBankroll,
    endingBankroll,
    profit: endingBankroll - bankroll,
    tax,
    underlyingReturn,
    billReturn,
    premiumRate,
    riskFreeRate,
    volatility,
    optionBudgetRate,
    optionBudget,
    collateral,
    payoff,
    breakEvenMove: premiumRate * 100,
    notional: premiumRate > 0 ? optionBudget / premiumRate : 0,
    expiredWorthless: choice !== "bills" && payoff <= 0,
  };
}

function getBestChoiceForWindow(bankroll: number, event: HeadlineEvent, target: OptionsTarget) {
  return optionChoiceOrder
    .map((choice) => calculateOptionOutcome(bankroll, event, target, choice))
    .sort((a, b) => b.endingBankroll - a.endingBankroll)[0];
}

export function getProjectedOutcomes(state: OptionsFortuneState) {
  const event = getCurrentOptionsEvent(state);
  const target = getSelectedOptionsTarget(state);
  return Object.fromEntries(
    optionChoiceOrder.map((choice) => [choice, calculateOptionOutcome(state.bankroll, event, target, choice)]),
  ) as Record<OptionChoice, OptionOutcome>;
}

export function playOptionsRound(state: OptionsFortuneState): OptionsFortuneState {
  if (state.phase !== "choose") {
    return state;
  }

  const event = getCurrentOptionsEvent(state);
  const targetIndex = Math.max(state.currentIndex + 1, Math.min(state.selectedTargetIndex, state.events.length));
  const target = getOptionsTarget(state, targetIndex);
  const outcome = calculateOptionOutcome(state.bankroll, event, target, state.choice);
  const result: OptionsResult = {
    ...outcome,
    event,
    target,
    targetIndex,
  };
  const stockReturn = (target.sp500 / event.startClose - 1) * 100;
  const indexBenchmark = state.indexBenchmark * (1 + stockReturn / 100);
  const billsBenchmark = state.billsBenchmark * (1 + outcome.billReturn / 100);
  const perfectTape = getBestChoiceForWindow(state.perfectTape, event, target).endingBankroll;

  return {
    ...state,
    phase: target.isFinal ? "complete" : "choose",
    currentIndex: targetIndex,
    selectedTargetIndex: Math.min(targetIndex + 1, state.events.length),
    bankroll: outcome.endingBankroll,
    results: [...state.results, result],
    indexBenchmark,
    billsBenchmark,
    perfectTape,
  };
}

export function getProgressPercent(state: OptionsFortuneState, index = state.currentIndex) {
  return state.events.length > 0 ? (Math.min(index, state.events.length) / state.events.length) * 100 : 0;
}

export function isVolatilityLensUnlocked(state: OptionsFortuneState) {
  return state.currentIndex >= Math.floor(state.events.length / 2);
}

export function formatOptionsMoney(value: number) {
  return formatMoney(value);
}

export function formatOptionsPercent(value: number) {
  return formatPercent(value);
}

export function formatOptionsSpan(startDate: string, endDate: string) {
  return formatYearsBetween(startDate, endDate);
}
