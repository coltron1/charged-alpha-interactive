import { getCatalyst } from "../content/catalysts";
import { getCompany } from "../content/companies";
import { getRegime } from "../content/regimes";
import { getSupportCard } from "../content/thesisCards";
import type {
  CompanyCard,
  CompanyTag,
  FundRoundResult,
  HiddenMetric,
  MarketRegime,
  PortfolioSlot,
  PositionResult,
  RoundResult,
  RoundState,
  SlotType,
  SupportCard,
} from "./types";

const slotMultipliers: Record<SlotType, number> = {
  core: 0.85,
  satellite: 1.25,
  hedge: 0.35,
};

const hiddenLabels: Record<HiddenMetric, string> = {
  earningsSurprise: "earnings surprise",
  guidance: "guidance",
  crowding: "crowding",
  accountingQuality: "accounting quality",
  macroSensitivity: "macro sensitivity",
};

function tagScore(tags: CompanyTag[], targets: CompanyTag[], value: number) {
  return tags.filter((tag) => targets.includes(tag)).length * value;
}

function hasCard(cards: SupportCard[], cardId: string) {
  return cards.some((card) => card.id === cardId);
}

function formatSigned(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

function catalystScore(company: CompanyCard, focus: string) {
  if (focus === "earnings") {
    return company.hidden.earningsSurprise * 1.4;
  }
  if (focus === "guidance") {
    return company.hidden.guidance * 1.6;
  }
  if (focus === "macro") {
    return company.hidden.macroSensitivity * 1.6;
  }
  if (focus === "rotation") {
    return company.hidden.crowding * 1.2;
  }
  return company.stats.growth - company.stats.expectations + company.hidden.crowding;
}

function regimeScore(company: CompanyCard, regime: MarketRegime) {
  return tagScore(company.tags, regime.boosts, 1.35) - tagScore(company.tags, regime.pressures, 1.45);
}

function supportScore(company: CompanyCard, cards: SupportCard[]) {
  let score = 0;

  if (hasCard(cards, "margin-expansion")) {
    score += (company.stats.margin - 3) * 0.9;
  }
  if (hasCard(cards, "quality-wins")) {
    score += (company.stats.cashFlow - company.stats.debt) * 0.8;
  }
  if (hasCard(cards, "narrative-heat")) {
    score += tagScore(company.tags, ["Growth", "Momentum", "AI Stack"], 0.9);
    score -= Math.max(0, -company.hidden.crowding) * 0.6;
  }
  if (hasCard(cards, "valuation-reset")) {
    score -= company.stats.valuation >= 4 ? 1.6 : -0.5;
  }
  if (hasCard(cards, "turnaround-tape")) {
    score += tagScore(company.tags, ["Turnaround", "Value"], 0.85) + Math.max(0, company.hidden.guidance) * 0.45;
  }
  if (hasCard(cards, "crowded-exit")) {
    score -= company.tags.includes("Crowded") || company.hidden.crowding < -1 ? 1.4 : 0;
  }

  return score;
}

function riskControlMultiplier(cards: SupportCard[]) {
  let multiplier = 1;
  if (hasCard(cards, "position-cap")) {
    multiplier -= 0.18;
  }
  if (hasCard(cards, "hedge-basket")) {
    multiplier -= 0.14;
  }
  if (hasCard(cards, "diversification-mandate")) {
    multiplier -= 0.1;
  }
  return Math.max(0.55, multiplier);
}

function buildDrivers(company: CompanyCard, regime: MarketRegime, cards: SupportCard[], reaction: number) {
  const drivers: string[] = [];

  if (company.hidden.earningsSurprise > 1) {
    drivers.push(`Earnings surprise added ${formatSigned(company.hidden.earningsSurprise)}.`);
  } else if (company.hidden.earningsSurprise < 0) {
    drivers.push(`Earnings missed by ${formatSigned(company.hidden.earningsSurprise)}.`);
  }

  if (company.hidden.guidance > 1) {
    drivers.push(`Guidance improved the setup.`);
  } else if (company.hidden.guidance < 0) {
    drivers.push(`Weak guidance broke part of the thesis.`);
  }

  if (company.stats.expectations >= 4) {
    drivers.push(`High expectations raised the bar.`);
  }

  if (company.stats.valuation >= 4) {
    drivers.push(`A rich valuation made mixed news more painful.`);
  }

  const boosted = company.tags.filter((tag) => regime.boosts.includes(tag));
  const pressured = company.tags.filter((tag) => regime.pressures.includes(tag));
  if (boosted.length > 0) {
    drivers.push(`${regime.name} favored ${boosted.slice(0, 2).join(" and ")} exposure.`);
  }
  if (pressured.length > 0) {
    drivers.push(`${regime.name} pressured ${pressured.slice(0, 2).join(" and ")} exposure.`);
  }

  if (cards.length > 0) {
    drivers.push(`Active thesis: ${cards.map((card) => card.name).slice(0, 2).join(", ")}.`);
  }

  if (reaction >= 5) {
    drivers.unshift("Strong reaction: the report cleared the market's bar.");
  } else if (reaction <= -3) {
    drivers.unshift("Thesis broke: the setup could not absorb the bad details.");
  }

  return drivers.slice(0, 4);
}

export function scoreCompanyReaction(
  company: CompanyCard,
  regime: MarketRegime,
  catalystFocus: string,
  supportCards: SupportCard[],
) {
  const earningsSurprise = catalystScore(company, catalystFocus);
  const guidance = company.hidden.guidance * 0.9;
  const marginSignal = (company.stats.margin - 3) * 0.9;
  const cashFlowSignal = (company.stats.cashFlow - 3) * 0.85;
  const expectationsPenalty = Math.max(0, company.stats.expectations - 2) * 0.95;
  const valuationPressure = Math.max(0, company.stats.valuation - 3) * 0.85;
  const debtPenalty = Math.max(0, company.stats.debt - 2) * 0.75;
  const crowdingPenalty = Math.max(0, -company.hidden.crowding) * 0.85;

  return (
    earningsSurprise +
    guidance +
    marginSignal +
    cashFlowSignal +
    regimeScore(company, regime) +
    supportScore(company, supportCards) -
    expectationsPenalty -
    valuationPressure -
    debtPenalty -
    crowdingPenalty
  );
}

export function getVisibleHiddenMetrics(round: RoundState, companyId: string) {
  const revealed = round.revealedMetrics[companyId] ?? [];
  return revealed.map((metric) => `${hiddenLabels[metric]}: ${getCompany(companyId).hidden[metric]}`);
}

export function scoreFundRound(
  side: "player" | "opponent",
  round: RoundState,
  slots: PortfolioSlot[],
  supportCardIds: string[],
  convictionCharged: boolean,
  retreated: boolean,
): FundRoundResult {
  const regime = getRegime(round.regimeId);
  const catalyst = getCatalyst(round.catalystId);
  const supportCards = supportCardIds.map(getSupportCard);

  if (retreated) {
    return {
      side,
      roundAlpha: -3,
      rawAlpha: -3,
      riskAdded: 0,
      drawdownDamage: -0.6,
      cashStabilityBonus: 2,
      convictionCharged,
      retreated: true,
      positions: [],
      summary: "Retreated: conceded the round and protected the fund from fresh risk.",
    };
  }

  const positions: PositionResult[] = slots.map((slot) => {
    if (!slot.allocation) {
      return {
        slotId: slot.id,
        slotLabel: slot.label,
        slotType: slot.type,
        capital: 0,
        reaction: 0,
        score: 0,
        riskAdded: 0,
        drivers: ["Cash held back risk and preserved optionality."],
      };
    }

    const company = getCompany(slot.allocation.companyId);
    const reaction = scoreCompanyReaction(company, regime, catalyst.focus, supportCards);
    const slotMultiplier = slotMultipliers[slot.type];
    const riskAdded =
      company.stats.volatility *
      slot.allocation.capital *
      (slot.type === "satellite" ? 1.2 : slot.type === "hedge" ? 0.55 : 0.8) *
      riskControlMultiplier(supportCards);

    return {
      slotId: slot.id,
      slotLabel: slot.label,
      slotType: slot.type,
      companyId: company.id,
      companyName: company.name,
      capital: slot.allocation.capital,
      reaction,
      score: reaction * slot.allocation.capital * slotMultiplier,
      riskAdded,
      drivers: buildDrivers(company, regime, supportCards, reaction),
    };
  });

  const usedCapital = slots.reduce((total, slot) => total + (slot.allocation?.capital ?? 0), 0);
  const cash = Math.max(0, 10 - usedCapital);
  const rawAlpha = positions.reduce((total, position) => total + position.score, 0);
  const rawRisk = positions.reduce((total, position) => total + position.riskAdded, 0);
  const cashStabilityBonus = cash * (hasCard(supportCards, "cash-buffer") ? 0.8 : 0.45);
  const excessRiskPenalty = Math.max(0, rawRisk - 35) * 0.16;
  const drawdownPenalty = rawAlpha < 0 ? Math.abs(rawAlpha) * 0.18 : 0;
  const hedgeDrag = hasCard(supportCards, "hedge-basket") && rawAlpha > 0 ? rawAlpha * 0.08 : 0;
  let roundAlpha = rawAlpha - excessRiskPenalty - drawdownPenalty - hedgeDrag + cashStabilityBonus;

  if (convictionCharged) {
    roundAlpha = roundAlpha >= 0 ? roundAlpha * 1.5 : roundAlpha * 1.75;
  }

  return {
    side,
    roundAlpha,
    rawAlpha,
    riskAdded: Math.max(0, rawRisk - cashStabilityBonus),
    drawdownDamage: roundAlpha < 0 ? roundAlpha * 0.8 : 0,
    cashStabilityBonus,
    convictionCharged,
    retreated: false,
    positions,
    summary:
      roundAlpha >= 0
        ? "Round won on thesis fit, sizing, and risk control."
        : "Round lost because the setup could not absorb expectations, valuation, or regime pressure.",
  };
}

export function buildRoundResult(round: RoundState): RoundResult {
  const player = scoreFundRound(
    "player",
    round,
    round.slots,
    round.activeSupportCardIds,
    round.convictionCharged,
    round.retreated,
  );
  const opponent = scoreFundRound(
    "opponent",
    round,
    round.opponent.slots,
    round.opponent.supportCardIds,
    round.opponent.convictionCharged,
    round.opponent.retreated,
  );
  const winner =
    Math.abs(player.roundAlpha - opponent.roundAlpha) < 0.01
      ? "tie"
      : player.roundAlpha > opponent.roundAlpha
        ? "player"
        : "opponent";

  const topPlayerDrivers = player.positions
    .filter((position) => position.companyName)
    .sort((first, second) => Math.abs(second.score) - Math.abs(first.score))
    .slice(0, 2)
    .flatMap((position) => [
      `${position.companyName}: ${position.score >= 0 ? "worked" : "hurt"} for ${formatSigned(position.score)} Alpha.`,
      ...position.drivers.slice(0, 2),
    ]);

  return {
    roundIndex: round.index,
    roundName: round.name,
    catalystId: round.catalystId,
    regimeId: round.regimeId,
    player,
    opponent,
    winner,
    explanations:
      topPlayerDrivers.length > 0
        ? topPlayerDrivers
        : ["Retreat protected the fund. Sometimes no setup is better than forcing a bad one."],
  };
}
