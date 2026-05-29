import { describe, expect, it } from "vitest";
import {
  createHeadlineMarket,
  capitalGainsTaxRate,
  getCashBondReturn,
  nextHeadlineRound,
  resolveHeadlineRound,
  setAssetChoice,
  setDefaultPosition,
  setTargetIndex,
  startHeadlineMarket,
  startingBankroll,
} from "./headlineMarket";

describe("headline market simulation", () => {
  it("lets bonds earn Treasury-style yield when Jonah chooses bonds", () => {
    const game = startHeadlineMarket(createHeadlineMarket("zero-cash"));
    const result = resolveHeadlineRound(setAssetChoice(game, "cash"));
    const expectedReturn = getCashBondReturn(game.events[0]);

    expect(result.bankroll).toBeGreaterThan(startingBankroll);
    expect(result.results[0].assetReturn).toBeCloseTo(expectedReturn, 5);
    expect(result.results[0].taxPenalty).toBe(0);
  });

  it("applies capital gains tax to positive gains from Jonah's reallocations", () => {
    const game = startHeadlineMarket(createHeadlineMarket("all-in-check"));
    const firstResult = resolveHeadlineRound(setAssetChoice(game, "sp500"));
    const secondRound = nextHeadlineRound(firstResult);
    const result = resolveHeadlineRound(setAssetChoice(secondRound, "cash"));
    const grossProfit = firstResult.bankroll - startingBankroll;

    expect(result.results[1].isReallocation).toBe(true);
    expect(result.results[1].taxPenalty).toBeCloseTo(grossProfit * capitalGainsTaxRate, 5);
    expect(result.bankroll).toBeGreaterThan(firstResult.bankroll - grossProfit * capitalGainsTaxRate);
  });

  it("uses headline-date S&P pricing for each chapter", () => {
    const game = startHeadlineMarket(createHeadlineMarket("timing-check"));
    const headlineResult = resolveHeadlineRound(setAssetChoice(game, "sp500")).results[0];
    const event = game.events[0];
    const expectedHeadlineReturn = (event.endClose / event.startClose - 1) * 100;

    expect(headlineResult.assetReturn).toBeCloseTo(expectedHeadlineReturn, 5);
  });

  it("uses headline-date gold pricing for each chapter", () => {
    const game = startHeadlineMarket(createHeadlineMarket("gold-timing-check"));
    const headlineResult = resolveHeadlineRound(setAssetChoice(game, "gold")).results[0];
    const event = game.events[0];
    const expectedHeadlineReturn = (event.goldEnd / event.goldStart - 1) * 100;

    expect(headlineResult.assetReturn).toBeCloseTo(expectedHeadlineReturn, 5);
  });

  it("uses Jonah's default mix as a rebalance target", () => {
    const game = setDefaultPosition(startHeadlineMarket(createHeadlineMarket("default-mix-check")), {
      defaultSpPercent: 70,
      defaultGoldPercent: 20,
    });
    const result = resolveHeadlineRound(setAssetChoice(game, "default")).results[0];
    const event = game.events[0];
    const stockReturn = (event.endClose / event.startClose - 1) * 100;
    const goldReturn = (event.goldEnd / event.goldStart - 1) * 100;
    const cashReturn = getCashBondReturn(event);
    const expectedReturn = (stockReturn * 70 + goldReturn * 20 + cashReturn * 10) / 100;

    expect(result.assetChoice).toBe("default");
    expect(result.defaultCashPercent).toBe(10);
    expect(result.assetReturn).toBeCloseTo(expectedReturn, 5);
    expect(result.taxPenalty).toBe(0);
  });

  it("advances through reveal before the next decision", () => {
    const game = startHeadlineMarket(createHeadlineMarket("advance"));
    const revealed = resolveHeadlineRound(setAssetChoice(game, "gold"));
    const next = nextHeadlineRound(revealed);

    expect(revealed.phase).toBe("reveal");
    expect(next.phase).toBe("choose");
    expect(next.roundIndex).toBe(1);
    expect(next.assetChoice).toBe("gold");
  });

  it("lets Jonah skip to any confirmed future headline while holding the chosen allocation", () => {
    const game = startHeadlineMarket(createHeadlineMarket("skip-ahead"));
    const targetIndex = 4;
    const selected = setTargetIndex(setAssetChoice(game, "sp500"), targetIndex);
    const revealed = resolveHeadlineRound(selected);
    const next = nextHeadlineRound(revealed);
    const result = revealed.results[0];

    expect(result.targetIndex).toBe(targetIndex);
    expect(result.targetDate).toBe(game.events[targetIndex].date);
    expect(result.assetReturn).toBeCloseTo((game.events[targetIndex].startClose / game.events[0].startClose - 1) * 100, 5);
    expect(next.phase).toBe("choose");
    expect(next.roundIndex).toBe(targetIndex);
    expect(next.assetChoice).toBe("sp500");
  });

  it("keeps Jonah in the current selected strategy without triggering tax", () => {
    const game = startHeadlineMarket(createHeadlineMarket("hold-check"));
    const invested = resolveHeadlineRound(setAssetChoice(game, "sp500"));
    const next = nextHeadlineRound(invested);
    const held = resolveHeadlineRound(next);

    expect(held.results[1].assetChoice).toBe("sp500");
    expect(held.results[1].taxPenalty).toBe(0);
    expect(held.results[1].startingPositions.sp500).toBeGreaterThan(0);
  });

  it("treats the previous custom mix as no-trade when Jonah keeps it selected", () => {
    const game = setDefaultPosition(startHeadlineMarket(createHeadlineMarket("custom-hold-check")), {
      defaultSpPercent: 60,
      defaultGoldPercent: 10,
    });
    const invested = resolveHeadlineRound(setAssetChoice(game, "default"));
    const next = nextHeadlineRound(invested);
    const held = resolveHeadlineRound(next);

    expect(held.results[1].assetChoice).toBe("default");
    expect(held.results[1].isReallocation).toBe(false);
    expect(held.results[1].taxPenalty).toBe(0);
    expect(held.results[1].targetPositions).toEqual(held.results[1].decisionPositions);
  });
});
