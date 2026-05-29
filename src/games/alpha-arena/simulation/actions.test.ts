import { describe, expect, it } from "vitest";
import {
  advanceFromDebrief,
  advancePhase,
  allocateCapital,
  chargeConviction,
  createMatch,
  draftCard,
  revealHiddenMetric,
  resolveRound,
  retreatRound,
} from "./actions";
import { getCompany } from "../content/companies";
import { getRegime } from "../content/regimes";
import { scoreCompanyReaction } from "./scoring";

function draftFirstCompany(state = createMatch("test-seed")) {
  const companyId = state.currentRound?.shop.companyIds[0];
  if (!companyId) {
    throw new Error("No company in shop");
  }
  return draftCard(state, companyId);
}

function buildAllocatedRound(seed = "test-seed") {
  let state = draftFirstCompany(createMatch(seed));
  const companyId = state.currentRound?.draftedCompanyIds[0];
  if (!companyId) {
    throw new Error("No drafted company");
  }
  state = advancePhase(state, "research");
  state = advancePhase(state, "allocate");
  return allocateCapital(state, "core-1", companyId, 3);
}

describe("Alpha Arena simulation", () => {
  it("produces deterministic results from the same seed and actions", () => {
    const first = resolveRound(buildAllocatedRound("same-seed"));
    const second = resolveRound(buildAllocatedRound("same-seed"));

    expect(first.rounds[0].player.roundAlpha).toBe(second.rounds[0].player.roundAlpha);
    expect(first.rounds[0].opponent.roundAlpha).toBe(second.rounds[0].opponent.roundAlpha);
  });

  it("caps total capital at ten and company allocations at four", () => {
    let state = createMatch("capital-seed");
    const ids = state.currentRound?.shop.companyIds ?? [];
    ids.forEach((id) => {
      state = draftCard(state, id);
    });
    state = advancePhase(advancePhase(state, "research"), "allocate");
    state = allocateCapital(state, "core-1", ids[0], 9);
    state = allocateCapital(state, "core-2", ids[1], 4);
    state = allocateCapital(state, "satellite-1", ids[2], 4);

    const round = state.currentRound;
    expect(round?.slots[0].allocation?.capital).toBe(4);
    expect(round?.capitalRemaining).toBe(2);
  });

  it("spends research points when revealing a hidden metric", () => {
    let state = draftFirstCompany(createMatch("research-seed"));
    const companyId = state.currentRound?.draftedCompanyIds[0] ?? "";
    state = advancePhase(state, "research");
    state = revealHiddenMetric(state, companyId, "guidance");

    expect(state.currentRound?.researchRemaining).toBe(2);
    expect(state.currentRound?.revealedMetrics[companyId]).toContain("guidance");
  });

  it("allows conviction only once per round", () => {
    let state = buildAllocatedRound("conviction-seed");
    state = chargeConviction(state);
    state = chargeConviction(state);

    expect(state.currentRound?.convictionCharged).toBe(true);
  });

  it("conviction amplifies upside and downside", () => {
    const base = resolveRound(buildAllocatedRound("conviction-upside"));
    const charged = resolveRound(chargeConviction(buildAllocatedRound("conviction-upside")));

    expect(Math.abs(charged.rounds[0].player.roundAlpha)).toBeGreaterThan(Math.abs(base.rounds[0].player.roundAlpha));
  });

  it("retreat creates a fixed loss and adds no new risk", () => {
    const state = resolveRound(retreatRound(buildAllocatedRound("retreat-seed")));

    expect(state.rounds[0].player.roundAlpha).toBe(-3);
    expect(state.rounds[0].player.riskAdded).toBe(0);
  });

  it("can punish a small beat when expectations are high", () => {
    const company = getCompany("nvra-cloud");
    const regime = getRegime("rate-spike");
    const reaction = scoreCompanyReaction(company, regime, "earnings", []);

    expect(reaction).toBeLessThan(0);
  });

  it("rate spike pressures rate-sensitive and high-debt companies", () => {
    const company = getCompany("metrolev");
    const rateSpike = scoreCompanyReaction(company, getRegime("rate-spike"), "macro", []);
    const softLanding = scoreCompanyReaction(company, getRegime("soft-landing"), "macro", []);

    expect(rateSpike).toBeLessThan(softLanding);
  });

  it("cash reduces drawdown versus a fully allocated bad round", () => {
    let full = createMatch("cash-seed");
    const ids = full.currentRound?.shop.companyIds ?? [];
    ids.forEach((id) => {
      full = draftCard(full, id);
    });
    full = advancePhase(advancePhase(full, "research"), "allocate");
    full = allocateCapital(full, "core-1", ids[0], 4);
    full = allocateCapital(full, "core-2", ids[1], 3);
    full = allocateCapital(full, "satellite-1", ids[2], 3);

    let cash = draftCard(createMatch("cash-seed"), ids[0]);
    cash = advancePhase(advancePhase(cash, "research"), "allocate");
    cash = allocateCapital(cash, "core-1", ids[0], 1);

    expect(resolveRound(cash).rounds[0].player.cashStabilityBonus).toBeGreaterThan(
      resolveRound(full).rounds[0].player.cashStabilityBonus,
    );
  });

  it("ends after five rounds", () => {
    let state = buildAllocatedRound("five-rounds");
    for (let index = 0; index < 5; index += 1) {
      state = resolveRound(state);
      if (index < 4) {
        state = advanceFromDebrief(state);
        const companyId = state.currentRound?.shop.companyIds[0] ?? "";
        state = draftCard(state, companyId);
        state = advancePhase(advancePhase(state, "research"), "allocate");
        state = allocateCapital(state, "core-1", companyId, 2);
      }
    }

    expect(advanceFromDebrief(state).phase).toBe("complete");
  });

  it("blows up at risk 100", () => {
    const state = buildAllocatedRound("blowup");
    const risky = { ...state, risk: 99 };
    const resolved = resolveRound(risky);

    expect(resolved.phase).toBe("complete");
  });
});
