import { describe, expect, it } from "vitest";
import { commitJump, createBeforeSiege, finalYear, getAvailableTargets, resourceIds } from "./beforeSiege";

describe("Before the Siege simulation", () => {
  it("creates a 20-year chronicle with the Great Siege as the final event", () => {
    const state = createBeforeSiege("chronicle");
    const targets = getAvailableTargets(state);

    expect(targets).toHaveLength(finalYear);
    expect(targets[targets.length - 1].year).toBe(finalYear);
    expect(targets[targets.length - 1].title).toContain("Army of Darkness");
  });

  it("keeps resource pips bounded after a long jump", () => {
    const state = commitJump(createBeforeSiege("bounded"), finalYear, "stockpile", "northwatch");

    for (const id of resourceIds) {
      expect(state.resources[id]).toBeGreaterThanOrEqual(0);
      expect(state.resources[id]).toBeLessThanOrEqual(3);
    }
  });

  it("makes frequent meddling strain fate more than sealing the watch", () => {
    const sealed = commitJump(createBeforeSiege("strain-check"), finalYear, "stockpile", "northwatch");
    let meddled = createBeforeSiege("strain-check");

    for (let year = 1; year <= 5 && meddled.phase === "playing"; year += 1) {
      meddled = commitJump(meddled, year, year % 2 === 0 ? "fortify" : "stockpile", "northwatch");
    }

    expect(meddled.fateStrain).toBeGreaterThan(sealed.fateStrain);
  });

  it("records board changes when the player forges an allegiance", () => {
    const state = createBeforeSiege("ally");
    const allied = commitJump(state, 3, "ally", "ironhall");

    expect(allied.board.ironhall).toBeGreaterThanOrEqual(state.board.ironhall);
    expect(allied.lastReport?.orderBoardDeltas.ironhall).toBe(1);
  });
});
