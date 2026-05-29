import { describe, expect, it } from "vitest";
import {
  calculateSectorOutcome,
  createSectorOracle,
  getProjectedSectorOutcomes,
  getSectorReturnRange,
  playSectorOracleRound,
  sectorOracleTaxRate,
  setSectorChoice,
  setSectorTargetIndex,
  startSectorOracle,
} from "./sectorOracle";

describe("sector oracle simulation", () => {
  it("starts with the first future headline selected", () => {
    const game = startSectorOracle(createSectorOracle());

    expect(game.phase).toBe("choose");
    expect(game.currentIndex).toBe(0);
    expect(game.selectedTargetIndex).toBe(1);
    expect(game.choice).toBe("balanced");
  });

  it("does not allow selecting a past or current target", () => {
    let game = startSectorOracle(createSectorOracle());
    game = playSectorOracleRound(setSectorChoice(setSectorTargetIndex(game, 3), "tech"));

    const moved = setSectorTargetIndex(game, 1);

    expect(moved.currentIndex).toBe(3);
    expect(moved.selectedTargetIndex).toBe(4);
  });

  it("compounds returns across skipped headlines", () => {
    const game = startSectorOracle(createSectorOracle());
    const directRange = getSectorReturnRange(game.events, 0, 3, "tech");
    const outcome = calculateSectorOutcome(100_000, game.events, 0, 3, "tech", "balanced", false);

    expect(outcome.returnPercent).toBeCloseTo(directRange, 5);
    expect(outcome.endingBankroll).toBeCloseTo(100_000 * (1 + directRange / 100), 2);
  });

  it("taxes profitable reallocations after the first move", () => {
    const game = startSectorOracle(createSectorOracle());
    const outcome = calculateSectorOutcome(100_000, game.events, 7, 8, "financials", "bonds", true);
    const untaxedEnding = 100_000 * (1 + outcome.returnPercent / 100);
    const expectedTax = Math.max(0, untaxedEnding - 100_000) * sectorOracleTaxRate;

    expect(outcome.switched).toBe(true);
    expect(outcome.tax).toBeCloseTo(expectedTax, 2);
    expect(outcome.endingBankroll).toBeCloseTo(untaxedEnding - expectedTax, 2);
  });

  it("projects all sector choices for the selected headline window", () => {
    const game = setSectorTargetIndex(startSectorOracle(createSectorOracle()), 5);
    const outcomes = getProjectedSectorOutcomes(game);

    expect(Object.keys(outcomes).sort()).toEqual(["balanced", "bonds", "energy", "financials", "healthcare", "staples", "tech"].sort());
    expect(outcomes.energy.returnPercent).not.toBe(outcomes.tech.returnPercent);
  });

  it("completes when playing to the final tape", () => {
    let game = startSectorOracle(createSectorOracle());
    game = setSectorTargetIndex(game, game.events.length);
    game = playSectorOracleRound(setSectorChoice(game, "bonds"));

    expect(game.phase).toBe("complete");
    expect(game.currentIndex).toBe(game.events.length);
    expect(game.results).toHaveLength(1);
  });
});
