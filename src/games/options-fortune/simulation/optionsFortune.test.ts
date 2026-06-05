import { describe, expect, it } from "vitest";
import {
  calculateEarlyCloseOptionOutcome,
  calculateOptionOutcome,
  closeLatestOptionsResult,
  createOptionsFortune,
  getCurrentOptionsEvent,
  getHistoricalVixClose,
  getOptionVolatilitySnapshot,
  getOptionsTarget,
  getProgressPercent,
  getVolatilityLensUnlockDate,
  getVolatilityLensUnlockProgress,
  isVolatilityLensUnlocked,
  isVolatilityLensUnlockedForDate,
  optionTaxRate,
  playOptionsRound,
  setOptionsChoice,
  startOptionsFortune,
} from "./optionsFortune";

describe("options fortune simulation", () => {
  it("starts new games with a call option selected", () => {
    const game = createOptionsFortune();
    const started = startOptionsFortune(game);

    expect(game.choice).toBe("calls");
    expect(started.choice).toBe("calls");
  });

  it("keeps Market Vision locked until five years into the historical timeline", () => {
    const game = createOptionsFortune();
    const firstUnlockedIndex = game.events.findIndex((event) => isVolatilityLensUnlockedForDate(event.date));

    expect(getVolatilityLensUnlockDate()).toBe("2002-10-27");
    expect(getVolatilityLensUnlockProgress()).toBeCloseTo(71.43, 1);
    expect(getProgressPercent(game, 0)).toBe(0);
    expect(getProgressPercent(game, game.events.length)).toBe(100);
    expect(isVolatilityLensUnlocked(game)).toBe(false);
    expect(isVolatilityLensUnlockedForDate("2002-10-26")).toBe(false);
    expect(isVolatilityLensUnlockedForDate("2002-10-27")).toBe(true);
    expect(firstUnlockedIndex).toBeGreaterThan(0);
    expect(isVolatilityLensUnlocked({ ...game, currentIndex: firstUnlockedIndex })).toBe(true);
    expect(isVolatilityLensUnlocked({ ...game, currentIndex: game.events.length })).toBe(true);
  });

  it("uses historical CBOE VIX closes for option volatility input", () => {
    expect(getHistoricalVixClose("1997-10-27")).toBeCloseTo(31.12, 2);
    const snapshot = getOptionVolatilitySnapshot("1997-10-27");

    expect(snapshot.source).toBe("cboe-vix-close");
    expect(snapshot.vixClose).toBeCloseTo(31.12, 2);
    expect(snapshot.volatility).toBeCloseTo(0.3112, 4);
  });

  it("prices SPX-style calls with VIX input, break-even, and priced-in move", () => {
    const game = createOptionsFortune();
    const event = getCurrentOptionsEvent(game);
    const target = getOptionsTarget(game, 1);
    const outcome = calculateOptionOutcome(100_000, event, target, "calls");

    expect(outcome.volatilitySource).toBe("cboe-vix-close");
    expect(outcome.vixClose).toBeCloseTo(31.12, 2);
    expect(outcome.volatility).toBeCloseTo(0.3112, 4);
    expect(outcome.breakEvenMove).toBeCloseTo(outcome.premiumRate * 100, 5);
    expect(outcome.pricedInMove).toBeGreaterThan(0);
  });

  it("buys the maximum number of whole option contracts and leaves the rest in bills", () => {
    const game = createOptionsFortune();
    const event = getCurrentOptionsEvent(game);
    const target = getOptionsTarget(game, 1);
    const outcome = calculateOptionOutcome(10_000, event, target, "calls");

    expect(outcome.premiumPerContract).toBeGreaterThan(0);
    expect(outcome.contractCount).toBe(Math.floor(10_000 / outcome.premiumPerContract));
    expect(outcome.optionBudget).toBeCloseTo(outcome.contractCount * outcome.premiumPerContract, 2);
    expect(outcome.collateral).toBeCloseTo(10_000 - outcome.optionBudget, 2);
    expect(outcome.collateral).toBeLessThan(outcome.premiumPerContract);
  });

  it("uses a 22% short-term tax rate on profitable option closes", () => {
    const game = createOptionsFortune();
    const event = getCurrentOptionsEvent(game);
    const target = getOptionsTarget(game, 1);
    const earlyOutcome = calculateEarlyCloseOptionOutcome({
      bankroll: 100_000,
      choice: "calls",
      closeDate: "1997-12-15",
      closeProgress: 0.35,
      closeSp500: event.startClose * 1.4,
      event,
      target,
    });
    const grossProfitAtClose =
      (earlyOutcome.earlyClose?.accountAfterClose ?? 0) + (earlyOutcome.earlyClose?.closeTax ?? 0) - earlyOutcome.startingBankroll;

    expect(optionTaxRate).toBe(0.22);
    expect(earlyOutcome.earlyClose?.closeTax ?? 0).toBeCloseTo(grossProfitAtClose * optionTaxRate, 2);
  });

  it("charges more premium for a straddle than a one-sided option", () => {
    const game = createOptionsFortune();
    const event = getCurrentOptionsEvent(game);
    const target = getOptionsTarget(game, 1);
    const call = calculateOptionOutcome(100_000, event, target, "calls");
    const put = calculateOptionOutcome(100_000, event, target, "puts");
    const straddle = calculateOptionOutcome(100_000, event, target, "straddle");

    expect(straddle.premiumRate).toBeGreaterThan(call.premiumRate);
    expect(straddle.premiumRate).toBeGreaterThan(put.premiumRate);
  });

  it("can close an option early and move the taxed result into bills until the headline date", () => {
    const game = setOptionsChoice({ ...createOptionsFortune(), phase: "choose" }, "calls");
    const event = getCurrentOptionsEvent(game);
    const target = getOptionsTarget(game, 1);
    const closeSp500 = event.startClose * 1.09;
    const earlyOutcome = calculateEarlyCloseOptionOutcome({
      bankroll: 100_000,
      choice: "calls",
      closeDate: "1997-12-15",
      closeProgress: 0.35,
      closeSp500,
      event,
      target,
    });

    expect(earlyOutcome.earlyClose?.date).toBe("1997-12-15");
    expect(earlyOutcome.earlyClose?.sp500).toBeCloseTo(closeSp500, 2);
    expect(earlyOutcome.tax).toBeGreaterThanOrEqual(0);
    expect(earlyOutcome.endingBankroll).toBeGreaterThan(earlyOutcome.earlyClose?.accountAfterClose ?? 0);

    const played = playOptionsRound(game);
    const closed = closeLatestOptionsResult(played, "1997-12-15", closeSp500, 0.35);
    expect(closed.results.at(-1)?.earlyClose?.date).toBe("1997-12-15");
    expect(closed.bankroll).toBeCloseTo(closed.results.at(-1)?.endingBankroll ?? 0, 2);
    expect(closed.perfectTape).toBeGreaterThanOrEqual(closed.bankroll);
  });

  it("keeps the perfect tape benchmark above a strong timed close", () => {
    const game = setOptionsChoice({ ...createOptionsFortune(), phase: "choose" }, "calls");
    const event = getCurrentOptionsEvent(game);
    const played = playOptionsRound(game);
    const closed = closeLatestOptionsResult(played, "1997-12-18", event.startClose * 1.14, 0.55);

    expect(closed.results.at(-1)?.earlyClose).toBeDefined();
    expect(closed.perfectTape).toBeGreaterThanOrEqual(closed.bankroll);
  });
});
