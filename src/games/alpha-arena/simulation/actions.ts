import { catalysts } from "../content/catalysts";
import { companies, getCompany } from "../content/companies";
import { getGhostFund, ghostFunds } from "../content/ghostFunds";
import { regimes } from "../content/regimes";
import { supportCards } from "../content/thesisCards";
import { buildRoundResult, scoreFundRound } from "./scoring";
import { seededPick, seededShuffle } from "./seed";
import type {
  Allocation,
  CompanyCard,
  HiddenMetric,
  MatchState,
  OpponentPlan,
  PortfolioSlot,
  RoundPhase,
  RoundState,
  SupportCard,
} from "./types";

const roundNames = ["Opening Bell", "First Reports", "Macro Shock", "Guidance Season", "Final Rebalance"];

const baseSlots: PortfolioSlot[] = [
  { id: "core-1", label: "Core 1", type: "core" },
  { id: "core-2", label: "Core 2", type: "core" },
  { id: "satellite-1", label: "Satellite 1", type: "satellite" },
  { id: "satellite-2", label: "Satellite 2", type: "satellite" },
  { id: "hedge", label: "Hedge/Cash", type: "hedge" },
];

function cloneState<T>(state: T): T {
  return structuredClone(state);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCurrentRound(state: MatchState): RoundState {
  if (!state.currentRound) {
    throw new Error("No active round.");
  }
  return state.currentRound;
}

function createShop(seed: string, roundIndex: number, rerollsUsed: number, draftedCompanyIds: string[]) {
  const availableCompanies = companies
    .filter((company) => !draftedCompanyIds.includes(company.id))
    .map((company) => company.id);

  return {
    companyIds: seededShuffle(availableCompanies, `${seed}:round:${roundIndex}:companies:${rerollsUsed}`).slice(0, 3),
    supportCardIds: seededShuffle(
      supportCards.map((card) => card.id),
      `${seed}:round:${roundIndex}:support:${rerollsUsed}`,
    ).slice(0, 2),
    rerollsUsed,
  };
}

function companyPreferenceScore(company: CompanyCard, preferredTags: string[], avoidTags: string[]) {
  const preferred = company.tags.filter((tag) => preferredTags.includes(tag)).length;
  const avoided = company.tags.filter((tag) => avoidTags.includes(tag)).length;
  return preferred * 3 - avoided * 2 + company.stats.growth + company.stats.volatility - company.stats.debt;
}

function supportPreferenceScore(card: SupportCard, preferredTags: string[]) {
  return card.tags.filter((tag) => preferredTags.includes(tag)).length * 2 + (card.kind === "thesis" ? 1 : 0);
}

function createOpponentPlan(seed: string, roundIndex: number, regimeId: string): OpponentPlan {
  const fund = getGhostFund("momentum-max");
  const companyPool = seededShuffle(companies, `${seed}:opponent:companies:${roundIndex}`)
    .sort(
      (first, second) =>
        companyPreferenceScore(second, fund.preferredTags, fund.avoidTags) -
        companyPreferenceScore(first, fund.preferredTags, fund.avoidTags),
    )
    .slice(0, 4);
  const supportPool = seededShuffle(supportCards, `${seed}:opponent:support:${roundIndex}`)
    .sort(
      (first, second) =>
        supportPreferenceScore(second, fund.preferredTags) - supportPreferenceScore(first, fund.preferredTags),
    )
    .slice(0, 2);
  const satelliteFirst = [...baseSlots].sort((first, second) => {
    const firstValue = first.type === "satellite" ? 0 : first.type === "core" ? 1 : 2;
    const secondValue = second.type === "satellite" ? 0 : second.type === "core" ? 1 : 2;
    return firstValue - secondValue;
  });

  let capitalRemaining = 10;
  const slots = satelliteFirst.map((slot, index) => {
    const company = companyPool[index];
    if (!company || capitalRemaining <= 0) {
      return slot;
    }
    const desiredCapital = slot.type === "satellite" ? 3 : slot.type === "core" ? 2 : 1;
    const capital = Math.min(desiredCapital, capitalRemaining);
    capitalRemaining -= capital;
    return { ...slot, allocation: { companyId: company.id, capital } };
  });

  const provisionalRound: RoundState = {
    index: roundIndex,
    name: roundNames[roundIndex],
    phase: "resolve",
    catalystId: catalysts[roundIndex % catalysts.length].id,
    regimeId,
    shop: createShop(seed, roundIndex, 0, []),
    draftedCompanyIds: [],
    draftedSupportCardIds: [],
    activeSupportCardIds: [],
    revealedMetrics: {},
    researchRemaining: 0,
    capitalRemaining: 0,
    slots: baseSlots,
    convictionCharged: false,
    retreated: false,
    opponent: {
      slotIdsRevealed: [],
      supportCardIds: supportPool.map((card) => card.id),
      slots,
      convictionCharged: false,
      retreated: false,
    },
  };
  const preview = scoreFundRound("opponent", provisionalRound, slots, supportPool.map((card) => card.id), false, false);
  const convictionCharged = preview.rawAlpha > fund.convictionThreshold;
  const retreated = preview.rawAlpha < fund.retreatThreshold && seededPick([true, false, false], `${seed}:retreat:${roundIndex}`);

  return {
    slotIdsRevealed: [],
    supportCardIds: supportPool.map((card) => card.id),
    slots,
    convictionCharged,
    retreated,
  };
}

function createRound(state: MatchState, roundIndex: number): RoundState {
  const regime = regimes[roundIndex % regimes.length];

  return {
    index: roundIndex,
    name: roundNames[roundIndex],
    phase: "draft",
    catalystId: catalysts[roundIndex % catalysts.length].id,
    regimeId: regime.id,
    shop: createShop(state.seed, roundIndex, 0, []),
    draftedCompanyIds: [],
    draftedSupportCardIds: [],
    activeSupportCardIds: [],
    revealedMetrics: {},
    researchRemaining: 3,
    capitalRemaining: 10,
    slots: baseSlots.map((slot) => ({ ...slot })),
    convictionCharged: false,
    retreated: false,
    opponent: createOpponentPlan(state.seed, roundIndex, regime.id),
  };
}

function completeMatch(state: MatchState): MatchState {
  const winner =
    Math.abs(state.alphaScore - state.opponentAlphaScore) < 0.01
      ? "tie"
      : state.alphaScore > state.opponentAlphaScore
        ? "player"
        : "opponent";

  return {
    ...state,
    phase: "complete",
    currentRound: undefined,
    winner,
  };
}

export function createMatch(seed = `alpha-${Date.now()}`): MatchState {
  const initial: MatchState = {
    seed,
    ghostFundId: ghostFunds[0].id,
    roundIndex: 0,
    phase: "draft",
    alphaScore: 0,
    opponentAlphaScore: 0,
    risk: 0,
    opponentRisk: 0,
    drawdown: 0,
    opponentDrawdown: 0,
    maxDrawdown: 0,
    opponentMaxDrawdown: 0,
    rounds: [],
  };

  return {
    ...initial,
    currentRound: createRound(initial, 0),
  };
}

export function startRound(state: MatchState): MatchState {
  const next = cloneState(state);
  next.phase = "draft";
  next.currentRound = createRound(next, next.roundIndex);
  return next;
}

export function advancePhase(state: MatchState, phase?: RoundPhase): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  const targetPhase =
    phase ??
    (round.phase === "draft"
      ? "research"
      : round.phase === "research"
        ? "allocate"
        : round.phase === "allocate"
          ? "resolve"
          : round.phase);
  round.phase = targetPhase;
  next.phase = targetPhase;
  return next;
}

export function draftCard(state: MatchState, cardId: string): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "draft") {
    return next;
  }

  if (round.shop.companyIds.includes(cardId) && !round.draftedCompanyIds.includes(cardId)) {
    round.draftedCompanyIds.push(cardId);
    round.shop.companyIds = round.shop.companyIds.filter((id) => id !== cardId);
  }

  if (round.shop.supportCardIds.includes(cardId) && !round.draftedSupportCardIds.includes(cardId)) {
    round.draftedSupportCardIds.push(cardId);
    round.activeSupportCardIds.push(cardId);
    round.shop.supportCardIds = round.shop.supportCardIds.filter((id) => id !== cardId);
  }

  return next;
}

export function rerollShop(state: MatchState): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "draft" || round.shop.rerollsUsed >= 1) {
    return next;
  }
  round.shop = createShop(next.seed, round.index, round.shop.rerollsUsed + 1, round.draftedCompanyIds);
  return next;
}

export function revealHiddenMetric(state: MatchState, companyId: string, metric: HiddenMetric): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "research" || round.researchRemaining <= 0) {
    return next;
  }
  const company = getCompany(companyId);
  if (!company.hidden[metric] && company.hidden[metric] !== 0) {
    return next;
  }
  const revealed = round.revealedMetrics[companyId] ?? [];
  if (revealed.includes(metric)) {
    return next;
  }
  round.revealedMetrics[companyId] = [...revealed, metric];
  round.researchRemaining -= 1;
  return next;
}

export function scoutOpponentSlot(state: MatchState, slotId: string): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "research" || round.researchRemaining <= 0) {
    return next;
  }
  if (!round.opponent.slots.some((slot) => slot.id === slotId)) {
    return next;
  }
  if (!round.opponent.slotIdsRevealed.includes(slotId)) {
    round.opponent.slotIdsRevealed.push(slotId);
    round.researchRemaining -= 1;
  }
  return next;
}

export function allocateCapital(
  state: MatchState,
  slotId: string,
  companyId: string | undefined,
  capital: number,
): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "allocate") {
    return next;
  }
  const slot = round.slots.find((item) => item.id === slotId);
  if (!slot) {
    return next;
  }

  const currentCapital = slot.allocation?.capital ?? 0;
  if (!companyId || capital <= 0) {
    slot.allocation = undefined;
  } else if (round.draftedCompanyIds.includes(companyId)) {
    const boundedCapital = clamp(Math.round(capital), 1, 4);
    const usedCapital = round.slots.reduce((total, item) => total + (item.id === slotId ? 0 : (item.allocation?.capital ?? 0)), 0);
    if (usedCapital + boundedCapital <= 10) {
      slot.allocation = { companyId, capital: boundedCapital };
    }
  }

  const used = round.slots.reduce((total, item) => total + (item.allocation?.capital ?? 0), 0);
  round.capitalRemaining = clamp(10 - used, 0, 10);
  if (currentCapital !== (slot.allocation?.capital ?? 0)) {
    round.retreated = false;
  }
  return next;
}

export function assignThesisCard(state: MatchState, cardId: string): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (!round.draftedSupportCardIds.includes(cardId)) {
    return next;
  }
  if (round.activeSupportCardIds.includes(cardId)) {
    round.activeSupportCardIds = round.activeSupportCardIds.filter((id) => id !== cardId);
  } else {
    round.activeSupportCardIds.push(cardId);
  }
  return next;
}

export function chargeConviction(state: MatchState): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase === "allocate" && !round.convictionCharged && !round.retreated) {
    round.convictionCharged = true;
  }
  return next;
}

export function retreatRound(state: MatchState): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "allocate") {
    return next;
  }
  round.retreated = true;
  round.convictionCharged = false;
  round.phase = "resolve";
  next.phase = "resolve";
  return next;
}

export function resolveRound(state: MatchState): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.result) {
    return next;
  }
  round.phase = "resolve";
  next.phase = "resolve";

  const result = buildRoundResult(round);
  round.result = result;
  round.phase = "debrief";
  next.phase = "debrief";
  next.alphaScore += result.player.roundAlpha;
  next.opponentAlphaScore += result.opponent.roundAlpha;
  next.risk = clamp(next.risk + result.player.riskAdded, 0, 130);
  next.opponentRisk = clamp(next.opponentRisk + result.opponent.riskAdded, 0, 130);
  next.drawdown = Math.min(0, next.drawdown + result.player.drawdownDamage);
  next.opponentDrawdown = Math.min(0, next.opponentDrawdown + result.opponent.drawdownDamage);
  next.maxDrawdown = Math.min(next.maxDrawdown, next.drawdown);
  next.opponentMaxDrawdown = Math.min(next.opponentMaxDrawdown, next.opponentDrawdown);
  next.rounds.push(result);

  if (next.risk >= 100 || next.drawdown <= -50) {
    return completeMatch(next);
  }

  return next;
}

export function advanceFromDebrief(state: MatchState): MatchState {
  const next = cloneState(state);
  const round = getCurrentRound(next);
  if (round.phase !== "debrief") {
    return next;
  }

  const nextRoundIndex = round.index + 1;
  if (nextRoundIndex >= roundNames.length) {
    return completeMatch(next);
  }

  next.roundIndex = nextRoundIndex;
  next.phase = "draft";
  next.currentRound = createRound(next, nextRoundIndex);
  return next;
}

export function getAllocatedCapital(round: RoundState) {
  return round.slots.reduce((total, slot) => total + (slot.allocation?.capital ?? 0), 0);
}

export function getAllocation(round: RoundState, slotId: string): Allocation | undefined {
  return round.slots.find((slot) => slot.id === slotId)?.allocation;
}

export function getNextHiddenMetric(round: RoundState, companyId: string): HiddenMetric | undefined {
  const metricOrder: HiddenMetric[] = [
    "guidance",
    "earningsSurprise",
    "crowding",
    "macroSensitivity",
    "accountingQuality",
  ];
  const revealed = round.revealedMetrics[companyId] ?? [];
  return metricOrder.find((metric) => !revealed.includes(metric));
}
