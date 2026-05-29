import { describe, expect, it } from "vitest";
import {
  chargeSprintRound,
  chooseSprintAction,
  calculateFinalScore,
  createSprint,
  getLeaderboardRank,
  nextSprintRound,
  scoutSprintRound,
  scoreChoice,
  selectSprintBar,
  sprintScenarios,
  startSprint,
} from "./sprint";

describe("Alpha Sprint", () => {
  const strongFair = { report: "strong" as const, bar: "fair" as const };
  const weakSkyHigh = { report: "weak" as const, bar: "skyHigh" as const };

  it("plays one choice and reveals a result", () => {
    const state = chooseSprintAction(selectSprintBar(startSprint(createSprint("quick")), weakSkyHigh), "back");

    expect(state.phase).toBe("reveal");
    expect(state.results).toHaveLength(1);
  });

  it("rewards passing on an obvious trap", () => {
    const trap = sprintScenarios.find((scenario) => scenario.id === "meta-capex-shock");

    expect(trap && scoreChoice(trap, "pass", weakSkyHigh).expectedAlphaDelta).toBeGreaterThan(0);
  });

  it("rewards backing a clean quality setup", () => {
    const quality = sprintScenarios.find((scenario) => scenario.id === "csco-ai-orders");

    expect(quality && scoreChoice(quality, "back", strongFair).expectedAlphaDelta).toBeGreaterThan(0);
  });

  it("finishes after five quick rounds", () => {
    let state = startSprint(createSprint("finish"));

    for (let index = 0; index < 5; index += 1) {
      state = selectSprintBar(state, strongFair);
      state = chooseSprintAction(state, "hedge");
      state = nextSprintRound(state);
    }

    expect(state.phase).toBe("complete");
  });

  it("uses limited scouts to reveal strategic information", () => {
    let state = startSprint(createSprint("scout"));
    state = scoutSprintRound(state);

    expect(state.scoutsRemaining).toBe(1);
    expect(state.scoutedRoundIds).toContain(state.scenarios[0].id);
  });

  it("charges a round once and amplifies the choice", () => {
    let state = startSprint(createSprint("charge"));
    state = selectSprintBar(state, strongFair);
    state = chargeSprintRound(state);
    state = chargeSprintRound(state);
    state = chooseSprintAction(state, "back");

    expect(state.chargesRemaining).toBe(1);
    expect(state.currentResult?.charged).toBe(true);
    expect(Math.abs(state.currentResult?.expectedAlphaDelta ?? 0)).toBeGreaterThanOrEqual(6);
  });

  it("requires a bar call before resolving a choice", () => {
    const state = chooseSprintAction(startSprint(createSprint("needs-bar")), "back");

    expect(state.phase).toBe("choose");
  });

  it("calculates a final score and leaderboard rank", () => {
    let state = startSprint(createSprint("score"));
    state = selectSprintBar(state, strongFair);
    state = chooseSprintAction(state, "hedge");

    expect(calculateFinalScore(state)).toBeGreaterThanOrEqual(0);
    expect(getLeaderboardRank(state)).toBeGreaterThan(0);
  });

  it("uses historical market moves in both directions", () => {
    const moves = sprintScenarios.map((scenario) =>
      scoreChoice(scenario, "back", { report: scenario.actualReport, bar: scenario.actualBar }).marketDelta,
    );

    expect(moves.some((move) => move > 0)).toBe(true);
    expect(moves.some((move) => move < 0)).toBe(true);
  });

  it("lets pass earn carry from existing alpha with no heat", () => {
    const trap = sprintScenarios.find((scenario) => scenario.id === "meta-capex-shock");
    const result = trap && scoreChoice(trap, "pass", weakSkyHigh, { currentAlpha: 28, seed: "carry-alpha" });

    expect(result && result.carryAlpha).toBe(3);
    expect(result && result.riskDelta).toBe(0);
  });

  it("shows market tape on pass without applying it to alpha", () => {
    const trap = sprintScenarios.find((scenario) => scenario.id === "meta-capex-shock");
    const result = trap ? scoreChoice(trap, "pass", weakSkyHigh, { currentAlpha: 28, seed: "pass-tape" }) : undefined;

    expect(result?.marketDelta).not.toBe(0);
    expect(result?.marketAppliedDelta).toBe(0);
    expect(result?.alphaDelta).toBe(result?.expectedAlphaDelta);
  });

  it("compounds heat faster when the meter is already elevated", () => {
    const quality = sprintScenarios.find((scenario) => scenario.id === "csco-ai-orders");
    const cool = quality && scoreChoice(quality, "back", strongFair, { seed: "heat", currentRisk: 0 });
    const hot = quality && scoreChoice(quality, "back", strongFair, { seed: "heat", currentRisk: 8 });

    expect(hot && cool && hot.riskDelta).toBeGreaterThan(cool ? cool.riskDelta : 0);
    expect(hot && hot.riskMultiplier).toBeGreaterThan(1);
  });

  it("allows scout and charge before setting the bar", () => {
    let state = startSprint(createSprint("stack-tools"));
    state = scoutSprintRound(state);
    state = chargeSprintRound(state);
    state = selectSprintBar(state, strongFair);
    state = chooseSprintAction(state, "back");

    expect(state.currentResult?.scouted).toBe(true);
    expect(state.currentResult?.charged).toBe(true);
  });
});
