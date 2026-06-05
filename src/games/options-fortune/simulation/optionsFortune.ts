import type { HeadlineEvent } from "../../headline-market/content/events";
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

export type OptionsEarlyClose = {
  accountAfterClose: number;
  billReturnAfterClose: number;
  closeTax: number;
  date: string;
  progress: number;
  sp500: number;
};

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
  volatilitySource: "cboe-vix-close" | "trailing-realized";
  vixClose: number | null;
  pricedInMove: number;
  contractCount: number;
  premiumPerContract: number;
  optionBudgetRate: number;
  optionBudget: number;
  collateral: number;
  payoff: number;
  breakEvenMove: number;
  notional: number;
  expiredWorthless: boolean;
  earlyClose?: OptionsEarlyClose;
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
export const optionsEndDate = "2004-10-27";
const marketVisionUnlockYears = 5;
export const optionContractMultiplier = 100;
export const optionTaxRate = 0.22;
export const optionChoiceOrder: OptionChoice[] = ["bills", "calls", "puts", "straddle"];

export const optionChoiceLabels: Record<OptionChoice, string> = {
  bills: "T-Bills",
  calls: "Call Option",
  puts: "Put Option",
  straddle: "Straddle",
};

export const optionChoiceShortLabels: Record<OptionChoice, string> = {
  bills: "Cash",
  calls: "Call",
  puts: "Put",
  straddle: "Straddle",
};

export const optionChoiceDescriptions: Record<OptionChoice, string> = {
  bills: "100% Treasury bills. Slow, steady, and no premium at risk.",
  calls: "Cash buys as many whole S&P 500 call contracts as it can. Leftover cash waits in bills.",
  puts: "Cash buys as many whole S&P 500 put contracts as it can. Leftover cash waits in bills.",
  straddle: "Cash buys as many whole straddles as it can. Leftover cash waits in bills.",
};

export const optionChoiceLessons: Record<OptionChoice, string> = {
  bills: "Bills teach opportunity cost: safety can win in bad windows, but it also sits out rallies.",
  calls: "Calls teach directional upside: the market needs to rise enough to overcome the option premium.",
  puts: "Puts teach downside convexity: the market needs to fall enough before protection becomes profitable.",
  straddle: "Straddles teach volatility: direction matters less, but the move must be large enough to pay for two premiums.",
};

const optionEvents = optionsHeadlineEvents.filter((event) => event.date <= optionsEndDate);
const dayMilliseconds = 24 * 60 * 60 * 1000;

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function formatDateIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getSp500CloseOnOrAfter(date: string) {
  return sp500DailySeries.find((entry) => entry.date >= date)?.value ?? sp500DailySeries.at(-1)?.value ?? 0;
}

export const historicalVixCloseByDate: Record<string, number> = {
  "1997-10-27": 31.12,
  "1998-02-02": 21.36,
  "1998-08-31": 44.28,
  "1998-10-15": 33.34,
  "1999-03-29": 23.54,
  "2000-03-24": 23.31,
  "2000-04-14": 33.49,
  "2001-01-03": 26.6,
  "2001-09-17": 41.76,
  "2001-12-03": 25.77,
  "2002-06-26": 28.42,
  "2002-07-24": 39.86,
  "2002-10-09": 42.13,
  "2003-03-12": 33.51,
  "2003-05-27": 19.99,
  "2004-06-30": 14.34,
  "2005-08-29": 13.52,
  "2006-06-13": 23.81,
  "2007-02-27": 18.31,
  "2007-07-26": 20.74,
  "2007-08-09": 26.48,
  "2007-09-18": 20.35,
  "2007-10-09": 16.12,
};

function getBoundedIndex(index: number, events = optionEvents) {
  return Math.max(0, Math.min(index, events.length));
}

export function createOptionsFortune(): OptionsFortuneState {
  return {
    phase: "intro",
    currentIndex: 0,
    selectedTargetIndex: Math.min(1, optionEvents.length),
    choice: "calls",
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
      sp500: getSp500CloseOnOrAfter(optionsEndDate),
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
  return Math.max(1, Math.round((dateToUtcTime(endDate) - dateToUtcTime(startDate)) / dayMilliseconds));
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

export function getHistoricalVixClose(date: string) {
  const exact = historicalVixCloseByDate[date];
  if (Number.isFinite(exact)) {
    return exact;
  }

  const previousDate = Object.keys(historicalVixCloseByDate)
    .filter((entryDate) => entryDate <= date)
    .sort()
    .at(-1);

  return previousDate ? historicalVixCloseByDate[previousDate] : null;
}

export function getOptionVolatilitySnapshot(date: string) {
  const vixClose = getHistoricalVixClose(date);
  if (vixClose && vixClose > 0) {
    return {
      source: "cboe-vix-close" as const,
      vixClose,
      volatility: clampNumber(vixClose / 100, 0.08, 0.8),
    };
  }

  return {
    source: "trailing-realized" as const,
    vixClose: null,
    volatility: getTrailingRealizedVolatility(date),
  };
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
  const { volatility } = getOptionVolatilitySnapshot(event.date);
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

function getOptionContractOrder(bankroll: number, event: HeadlineEvent, choice: OptionChoice, premiumRate: number) {
  if (choice === "bills" || premiumRate <= 0 || bankroll <= 0) {
    return {
      collateral: bankroll,
      contractCount: 0,
      notional: 0,
      optionBudget: 0,
      optionBudgetRate: 0,
      premiumPerContract: 0,
    };
  }

  const premiumPerContract = premiumRate * event.startClose * optionContractMultiplier;
  const contractCount = premiumPerContract > 0 ? Math.floor(bankroll / premiumPerContract) : 0;
  const optionBudget = contractCount * premiumPerContract;
  const collateral = Math.max(0, bankroll - optionBudget);

  return {
    collateral,
    contractCount,
    notional: contractCount * event.startClose * optionContractMultiplier,
    optionBudget,
    optionBudgetRate: bankroll > 0 ? optionBudget / bankroll : 0,
    premiumPerContract,
  };
}

function calculatePayoff(choice: OptionChoice, contractCount: number, spot: number, underlyingReturn: number) {
  if (choice === "bills" || contractCount <= 0) {
    return 0;
  }

  const move = underlyingReturn / 100;
  const winningMove =
    choice === "calls" ? Math.max(0, move) : choice === "puts" ? Math.max(0, -move) : Math.abs(move);
  return contractCount * spot * optionContractMultiplier * winningMove;
}

function calculateOptionOutcomeForPrice({
  bankroll,
  billReturn,
  choice,
  earlyClose,
  event,
  target,
  tax,
  underlyingReturn,
}: {
  bankroll: number;
  billReturn: number;
  choice: OptionChoice;
  earlyClose?: OptionsEarlyClose;
  event: HeadlineEvent;
  target: OptionsTarget;
  tax?: number;
  underlyingReturn: number;
}): OptionOutcome {
  const premiumRate = estimatePremiumRate(event, target, choice);
  const { collateral, contractCount, notional, optionBudget, optionBudgetRate, premiumPerContract } = getOptionContractOrder(
    bankroll,
    event,
    choice,
    premiumRate,
  );
  const riskFreeRate = getHistoricalRiskFreeRate(event.date);
  const volatilitySnapshot = getOptionVolatilitySnapshot(event.date);
  const volatility = volatilitySnapshot.volatility;
  const pricedInMove = volatility * Math.sqrt(getDaysBetween(event.date, target.date) / 365) * 100;
  const payoff = calculatePayoff(choice, contractCount, event.startClose, underlyingReturn);
  const collateralEnding = collateral * (1 + billReturn / 100);
  const grossEndingBankroll = choice === "bills" ? bankroll * (1 + billReturn / 100) : collateralEnding + payoff;
  const taxableProfit = choice === "bills" ? 0 : grossEndingBankroll - bankroll;
  const calculatedTax = tax ?? (taxableProfit > 0 ? taxableProfit * optionTaxRate : 0);
  const endingBankroll = grossEndingBankroll - calculatedTax;

  return {
    choice,
    startingBankroll: bankroll,
    grossEndingBankroll,
    endingBankroll,
    profit: endingBankroll - bankroll,
    tax: calculatedTax,
    underlyingReturn,
    billReturn,
    premiumRate,
    riskFreeRate,
    volatility,
    volatilitySource: volatilitySnapshot.source,
    vixClose: volatilitySnapshot.vixClose,
    pricedInMove,
    contractCount,
    premiumPerContract,
    optionBudgetRate,
    optionBudget,
    collateral,
    payoff,
    breakEvenMove: premiumRate * 100,
    notional,
    expiredWorthless: choice !== "bills" && payoff <= 0,
    earlyClose,
  };
}

export function calculateOptionOutcome(
  bankroll: number,
  event: HeadlineEvent,
  target: OptionsTarget,
  choice: OptionChoice,
): OptionOutcome {
  return calculateOptionOutcomeForPrice({
    bankroll,
    billReturn: calculateCashBondReturnBetween(event.date, target.date),
    choice,
    event,
    target,
    underlyingReturn: (target.sp500 / event.startClose - 1) * 100,
  });
}

export function calculateEarlyCloseOptionOutcome({
  bankroll,
  choice,
  closeDate,
  closeProgress,
  closeSp500,
  event,
  target,
}: {
  bankroll: number;
  choice: OptionChoice;
  closeDate: string;
  closeProgress: number;
  closeSp500: number;
  event: HeadlineEvent;
  target: OptionsTarget;
}): OptionOutcome {
  if (choice === "bills") {
    return calculateOptionOutcome(bankroll, event, target, choice);
  }

  const closeUnderlyingReturn = (closeSp500 / event.startClose - 1) * 100;
  const billReturnToClose = calculateCashBondReturnBetween(event.date, closeDate);
  const closeOutcome = calculateOptionOutcomeForPrice({
    bankroll,
    billReturn: billReturnToClose,
    choice,
    event,
    target,
    tax: 0,
    underlyingReturn: closeUnderlyingReturn,
  });
  const closeGrossProfit = closeOutcome.grossEndingBankroll - bankroll;
  const closeTax = closeGrossProfit > 0 ? closeGrossProfit * optionTaxRate : 0;
  const accountAfterClose = closeOutcome.grossEndingBankroll - closeTax;
  const billReturnAfterClose = calculateCashBondReturnBetween(closeDate, target.date);
  const grossEndingBankroll = accountAfterClose * (1 + billReturnAfterClose / 100);

  return {
    ...closeOutcome,
    billReturn: billReturnToClose + billReturnAfterClose,
    earlyClose: {
      accountAfterClose,
      billReturnAfterClose,
      closeTax,
      date: closeDate,
      progress: closeProgress,
      sp500: closeSp500,
    },
    endingBankroll: grossEndingBankroll,
    grossEndingBankroll,
    profit: grossEndingBankroll - bankroll,
    tax: closeTax,
  };
}

function getBestTimedChoiceForWindow(bankroll: number, event: HeadlineEvent, target: OptionsTarget) {
  const startTime = new Date(`${event.date}T00:00:00Z`).getTime();
  const endTime = new Date(`${target.date}T00:00:00Z`).getTime();
  const duration = Math.max(1, endTime - startTime);
  const expirationOutcomes = optionChoiceOrder.map((choice) => calculateOptionOutcome(bankroll, event, target, choice));
  const timedOutcomes = optionChoiceOrder
    .filter((choice) => choice !== "bills")
    .flatMap((choice) =>
      sp500DailySeries
        .filter((entry) => entry.date > event.date && entry.date < target.date)
        .map((entry) => {
          const closeTime = new Date(`${entry.date}T00:00:00Z`).getTime();
          return calculateEarlyCloseOptionOutcome({
            bankroll,
            choice,
            closeDate: entry.date,
            closeProgress: Math.max(0, Math.min(1, (closeTime - startTime) / duration)),
            closeSp500: entry.value,
            event,
            target,
          });
        }),
    );

  return [...expirationOutcomes, ...timedOutcomes].sort((a, b) => b.endingBankroll - a.endingBankroll)[0];
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
  const perfectTape = getBestTimedChoiceForWindow(state.perfectTape, event, target).endingBankroll;

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

export function closeLatestOptionsResult(
  state: OptionsFortuneState,
  closeDate: string,
  closeSp500: number,
  closeProgress: number,
): OptionsFortuneState {
  const result = state.results.at(-1);
  if (!result || result.earlyClose || result.choice === "bills") {
    return state;
  }

  const earlyOutcome = calculateEarlyCloseOptionOutcome({
    bankroll: result.startingBankroll,
    choice: result.choice,
    closeDate,
    closeProgress,
    closeSp500,
    event: result.event,
    target: result.target,
  });
  const earlyResult: OptionsResult = {
    ...earlyOutcome,
    event: result.event,
    target: result.target,
    targetIndex: result.targetIndex,
  };

  return {
    ...state,
    bankroll: earlyResult.endingBankroll,
    perfectTape: Math.max(state.perfectTape, earlyResult.endingBankroll),
    results: [...state.results.slice(0, -1), earlyResult],
  };
}

export function getProgressPercent(state: OptionsFortuneState, index = state.currentIndex) {
  return getOptionsTimelineProgressPercent(getOptionsTarget(state, index).date);
}

export function getOptionsTimelineProgressPercent(date: string) {
  const start = dateToUtcTime(optionsStartDate);
  const end = dateToUtcTime(optionsEndDate);
  const current = dateToUtcTime(date);

  if (end <= start) {
    return 0;
  }

  return clampNumber(((current - start) / (end - start)) * 100, 0, 100);
}

export function getVolatilityLensUnlockDate() {
  const unlockDate = new Date(`${optionsStartDate}T00:00:00Z`);
  unlockDate.setUTCFullYear(unlockDate.getUTCFullYear() + marketVisionUnlockYears);
  const unlockDateIso = formatDateIso(unlockDate);
  return dateToUtcTime(unlockDateIso) > dateToUtcTime(optionsEndDate) ? optionsEndDate : unlockDateIso;
}

export function getVolatilityLensUnlockProgress() {
  return getOptionsTimelineProgressPercent(getVolatilityLensUnlockDate());
}

export function isVolatilityLensUnlockedForDate(date: string) {
  return dateToUtcTime(date) >= dateToUtcTime(getVolatilityLensUnlockDate());
}

export function isVolatilityLensUnlocked(state: OptionsFortuneState) {
  return isVolatilityLensUnlockedForDate(getOptionsTarget(state, state.currentIndex).date);
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
