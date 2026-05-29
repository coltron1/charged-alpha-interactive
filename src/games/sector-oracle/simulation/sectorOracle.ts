import {
  sectorChoiceOrder,
  sectorOracleEndDate,
  sectorOracleEvents,
  sectorOracleStartDate,
  type SectorChoice,
  type SectorOracleEvent,
  type SectorReturnChoice,
} from "../content/sectorOracleEvents";

export interface SectorOracleTarget {
  index: number;
  date: string;
  label: string;
  event?: SectorOracleEvent;
  isFinal: boolean;
}

export interface SectorOracleOutcome {
  choice: SectorChoice;
  startingBankroll: number;
  grossEndingBankroll: number;
  endingBankroll: number;
  profit: number;
  tax: number;
  returnPercent: number;
  switched: boolean;
  previousChoice: SectorChoice;
}

export interface SectorOracleResult extends SectorOracleOutcome {
  event: SectorOracleEvent;
  target: SectorOracleTarget;
  targetIndex: number;
}

export interface SectorOracleState {
  phase: "intro" | "choose" | "complete";
  currentIndex: number;
  selectedTargetIndex: number;
  choice: SectorChoice;
  bankroll: number;
  events: SectorOracleEvent[];
  results: SectorOracleResult[];
  indexBenchmark: number;
  balancedBenchmark: number;
  techBenchmark: number;
  bondsBenchmark: number;
  perfectOracle: number;
}

export const sectorOracleStartingBankroll = 100_000;
export const sectorOracleTaxRate = 0.15;

const balancedWeights: Record<SectorReturnChoice, number> = {
  tech: 0.14,
  energy: 0.12,
  financials: 0.14,
  healthcare: 0.14,
  staples: 0.1,
  bonds: 0.36,
};

function clampIndex(index: number, events = sectorOracleEvents) {
  return Math.max(0, Math.min(index, events.length));
}

function compoundValue(startingValue: number, returns: number[]) {
  return returns.reduce((value, returnPercent) => value * (1 + returnPercent / 100), startingValue);
}

function getBalancedReturn(event: SectorOracleEvent) {
  return Object.entries(balancedWeights).reduce((total, [choice, weight]) => {
    return total + event.returnsToNext[choice as SectorReturnChoice] * weight;
  }, 0);
}

export function getSectorIntervalReturn(event: SectorOracleEvent, choice: SectorChoice | "market") {
  if (choice === "market") {
    return event.marketReturn;
  }
  if (choice === "balanced") {
    return getBalancedReturn(event);
  }
  return event.returnsToNext[choice];
}

export function getSectorReturnRange(events: SectorOracleEvent[], startIndex: number, targetIndex: number, choice: SectorChoice | "market") {
  const start = clampIndex(startIndex, events);
  const end = clampIndex(targetIndex, events);
  if (end <= start) {
    return 0;
  }
  const endingValue = compoundValue(1, events.slice(start, end).map((event) => getSectorIntervalReturn(event, choice)));
  return (endingValue - 1) * 100;
}

export function createSectorOracle(): SectorOracleState {
  return {
    phase: "intro",
    currentIndex: 0,
    selectedTargetIndex: 1,
    choice: "balanced",
    bankroll: sectorOracleStartingBankroll,
    events: sectorOracleEvents,
    results: [],
    indexBenchmark: sectorOracleStartingBankroll,
    balancedBenchmark: sectorOracleStartingBankroll,
    techBenchmark: sectorOracleStartingBankroll,
    bondsBenchmark: sectorOracleStartingBankroll,
    perfectOracle: sectorOracleStartingBankroll,
  };
}

export function startSectorOracle(state: SectorOracleState): SectorOracleState {
  return {
    ...createSectorOracle(),
    events: state.events,
    phase: "choose",
  };
}

export function resetSectorOracle() {
  return createSectorOracle();
}

export function getCurrentSectorEvent(state: SectorOracleState) {
  return state.events[state.currentIndex] ?? state.events[0];
}

export function getSectorTarget(state: Pick<SectorOracleState, "events">, targetIndex: number): SectorOracleTarget {
  const index = clampIndex(targetIndex, state.events);
  if (index >= state.events.length) {
    return {
      index,
      date: sectorOracleEndDate,
      label: "Final Tape",
      isFinal: true,
    };
  }

  const event = state.events[index];
  return {
    index,
    date: event.date,
    label: event.era,
    event,
    isFinal: false,
  };
}

export function getSelectedSectorTarget(state: SectorOracleState) {
  return getSectorTarget(state, state.selectedTargetIndex);
}

export function setSectorTargetIndex(state: SectorOracleState, targetIndex: number): SectorOracleState {
  if (state.phase !== "choose") {
    return state;
  }
  return {
    ...state,
    selectedTargetIndex: Math.max(state.currentIndex + 1, clampIndex(targetIndex, state.events)),
  };
}

export function setSectorChoice(state: SectorOracleState, choice: SectorChoice): SectorOracleState {
  if (state.phase !== "choose") {
    return state;
  }
  return {
    ...state,
    choice,
  };
}

export function calculateSectorOutcome(
  bankroll: number,
  events: SectorOracleEvent[],
  startIndex: number,
  targetIndex: number,
  choice: SectorChoice,
  previousChoice: SectorChoice,
  hasPriorTrade: boolean,
): SectorOracleOutcome {
  const returnPercent = getSectorReturnRange(events, startIndex, targetIndex, choice);
  const grossEndingBankroll = bankroll * (1 + returnPercent / 100);
  const grossProfit = grossEndingBankroll - bankroll;
  const switched = hasPriorTrade && previousChoice !== choice;
  const tax = switched && grossProfit > 0 ? grossProfit * sectorOracleTaxRate : 0;
  const endingBankroll = Math.max(0, grossEndingBankroll - tax);

  return {
    choice,
    startingBankroll: bankroll,
    grossEndingBankroll,
    endingBankroll,
    profit: endingBankroll - bankroll,
    tax,
    returnPercent,
    switched,
    previousChoice,
  };
}

function calculateBenchmark(value: number, events: SectorOracleEvent[], startIndex: number, targetIndex: number, choice: SectorChoice | "market") {
  return compoundValue(value, events.slice(startIndex, targetIndex).map((event) => getSectorIntervalReturn(event, choice)));
}

function calculatePerfectOracle(value: number, events: SectorOracleEvent[], startIndex: number, targetIndex: number) {
  return events.slice(startIndex, targetIndex).reduce((bankroll, event) => {
    const bestReturn = Math.max(...sectorChoiceOrder.map((choice) => getSectorIntervalReturn(event, choice)));
    return bankroll * (1 + bestReturn / 100);
  }, value);
}

export function getProjectedSectorOutcomes(state: SectorOracleState) {
  const previousChoice = state.results.at(-1)?.choice ?? "balanced";
  return sectorChoiceOrder.reduce<Record<SectorChoice, SectorOracleOutcome>>((outcomes, choice) => {
    outcomes[choice] = calculateSectorOutcome(
      state.bankroll,
      state.events,
      state.currentIndex,
      state.selectedTargetIndex,
      choice,
      previousChoice,
      state.results.length > 0,
    );
    return outcomes;
  }, {} as Record<SectorChoice, SectorOracleOutcome>);
}

export function playSectorOracleRound(state: SectorOracleState): SectorOracleState {
  if (state.phase !== "choose") {
    return state;
  }

  const event = getCurrentSectorEvent(state);
  const target = getSelectedSectorTarget(state);
  const previousChoice = state.results.at(-1)?.choice ?? "balanced";
  const outcome = calculateSectorOutcome(
    state.bankroll,
    state.events,
    state.currentIndex,
    state.selectedTargetIndex,
    state.choice,
    previousChoice,
    state.results.length > 0,
  );
  const result: SectorOracleResult = {
    ...outcome,
    event,
    target,
    targetIndex: state.selectedTargetIndex,
  };
  const nextIndex = target.index;
  const nextPhase = target.isFinal ? "complete" : "choose";

  return {
    ...state,
    phase: nextPhase,
    currentIndex: nextIndex,
    selectedTargetIndex: Math.min(nextIndex + 1, state.events.length),
    bankroll: outcome.endingBankroll,
    results: [...state.results, result],
    indexBenchmark: calculateBenchmark(state.indexBenchmark, state.events, state.currentIndex, state.selectedTargetIndex, "market"),
    balancedBenchmark: calculateBenchmark(state.balancedBenchmark, state.events, state.currentIndex, state.selectedTargetIndex, "balanced"),
    techBenchmark: calculateBenchmark(state.techBenchmark, state.events, state.currentIndex, state.selectedTargetIndex, "tech"),
    bondsBenchmark: calculateBenchmark(state.bondsBenchmark, state.events, state.currentIndex, state.selectedTargetIndex, "bonds"),
    perfectOracle: calculatePerfectOracle(state.perfectOracle, state.events, state.currentIndex, state.selectedTargetIndex),
  };
}

export function formatSectorMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export function formatSectorMoneyCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
    notation: "compact",
    style: "currency",
  }).format(value);
}

export function formatSectorPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(Math.abs(value) >= 10 ? 0 : 1)}%`;
}

export function formatSectorDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function formatSectorYear(date: string) {
  return date.slice(0, 4);
}

export function getSectorProgressPercent(state: Pick<SectorOracleState, "events" | "currentIndex">, targetIndex = state.currentIndex) {
  return (clampIndex(targetIndex, state.events) / Math.max(1, state.events.length)) * 100;
}

export { sectorOracleEndDate, sectorOracleStartDate };
