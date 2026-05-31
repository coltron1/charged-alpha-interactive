import {
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Home,
  Landmark,
  Minimize2,
  Newspaper,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Trophy,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  InvestmentLeaderboardOverlay,
  ResultsMoveImpactChart,
  ResultsPerformanceChart,
  type LeaderboardSubmittedEntry,
  type ResultsChartPoint,
} from "../../shared/game-ui/InvestmentResults";
import { TargetGuideOverlay } from "../../shared/game-ui/TargetGuideOverlay";
import {
  buildInterpolatedTimeJumpPoints,
  TimeJumpTransitionOverlay,
  timeJumpTransitionDurationMs,
  type TimeJumpEntry,
  type TimeJumpTransitionModel,
} from "../../shared/game-ui/TimeJumpTransition";
import { HeadlineEventImage } from "../headline-market/components/HeadlineEventImage";
import type { HeadlineEvent } from "../headline-market/content/events";
import {
  calculateOptionOutcome,
  createOptionsFortune,
  formatOptionsMoney,
  formatOptionsPercent,
  formatOptionsSpan,
  getCurrentOptionsEvent,
  getProgressPercent,
  getProjectedOutcomes,
  getSelectedOptionsTarget,
  isVolatilityLensUnlocked,
  optionChoiceLabels,
  optionChoiceOrder,
  optionChoiceShortLabels,
  optionsEndDate,
  optionsStartDate,
  playOptionsRound,
  resetOptionsFortune,
  setOptionsChoice,
  setOptionsTargetIndex,
  startOptionsFortune,
  startingBankroll,
  type OptionChoice,
  type OptionOutcome,
  type OptionsFortuneState,
  type OptionsResult,
  type OptionsTarget,
} from "./simulation/optionsFortune";
import { optionsChronicleName, optionsDashboardGuideItems, optionsPrologueDate, optionsStory } from "./content/optionsCopy";

type IntroPage = "setup" | "rules";
type Overlay = "journal" | "ledger" | "article" | "index" | null;

const optionIcons: Record<OptionChoice, typeof Landmark> = {
  bills: Landmark,
  calls: TrendingUp,
  puts: TrendingDown,
  straddle: SlidersHorizontal,
};

const optionsFlowStops: Array<{ id: OptionChoice | "tax"; label: string; tone: string; icon?: typeof Landmark }> = [
  { id: "bills", label: "Bills", tone: "cash", icon: Landmark },
  { id: "calls", label: "Calls", tone: "sp500", icon: TrendingUp },
  { id: "puts", label: "Puts", tone: "gold", icon: TrendingDown },
  { id: "straddle", label: "Straddle", tone: "custom", icon: SlidersHorizontal },
  { id: "tax", label: "Tax", tone: "tax" },
];

const optionsContractRuleSummary =
  "Contract rule: each option trade is a modeled SPX-style, cash-settled, European-style at-the-money option. The strike is set to the S&P 500 close on the current headline date and expiration is the future headline date you choose.";

function formatDateLong(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function formatDateWithWeekday(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getRolodexDateParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));
  return {
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? "1997",
  };
}

function getPreviewParagraph(event: HeadlineEvent | undefined, isFinal = false) {
  if (isFinal) {
    return "The final expiration arrives. Mara closes the quote case and compares every option decision against the simple paths she could have taken instead.";
  }
  return event?.newspaperArticle?.lede ?? event?.summary ?? event?.setup ?? "A future headline reaches Mara's desk with just enough information to tempt a trade.";
}

function getTargetHeadline(target: OptionsTarget) {
  return target.isFinal ? "Final expiration: the option tape is settled" : target.event?.headline ?? target.label;
}

function getTargetDeck(target: OptionsTarget) {
  return target.isFinal ? "The decade closes and every premium, payoff, and tax bill comes due." : target.event?.deck ?? "Future headline";
}

function getTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function getOutcomeHeat(outcome: OptionOutcome, unlocked: boolean) {
  if (!unlocked) {
    return { className: "market-heat-neutral", alpha: 0 };
  }
  const returnPercent = (outcome.endingBankroll / outcome.startingBankroll - 1) * 100;
  if (Math.abs(returnPercent) < 0.75) {
    return { className: "market-heat-neutral", alpha: 0 };
  }
  return {
    className: returnPercent > 0 ? "market-heat-hot" : "market-heat-cold",
    alpha: Math.min(0.52, 0.1 + Math.min(Math.abs(returnPercent), 60) / 130),
  };
}

function getOptionsFlowPosition(choice: OptionChoice | "tax") {
  const index = optionsFlowStops.findIndex((stop) => stop.id === choice);
  if (index < 0 || optionsFlowStops.length === 0) {
    return 0;
  }
  return ((index + 0.5) / optionsFlowStops.length) * 100;
}

function getOptionsContractTermLabel(startDate: string, endDate: string) {
  return `Term ${formatOptionsSpan(startDate, endDate)} · expires ${formatDateLong(endDate)}`;
}

function getOptionsContractTermShortLabel(startDate: string, endDate: string) {
  return `Term: ${formatOptionsSpan(startDate, endDate)}`;
}

function getPreviousOptionChoice(game: OptionsFortuneState): OptionChoice {
  return game.results.at(-1)?.choice ?? "bills";
}

function chooseNearestTargetIndex(game: OptionsFortuneState, progressPercent: number) {
  const minimum = game.currentIndex + 1;
  const raw = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * game.events.length);
  return Math.max(minimum, Math.min(game.events.length, raw));
}

function findYearJumpIndex(game: OptionsFortuneState, direction: -1 | 1) {
  const selected = getSelectedOptionsTarget(game);
  const selectedYear = Number(selected.date.slice(0, 4));
  const targetYear = selectedYear + direction;
  const minimum = game.currentIndex + 1;
  const candidates = game.events
    .map((event, index) => ({ event, index }))
    .filter(({ index }) => index >= minimum)
    .filter(({ event }) => (direction > 0 ? Number(event.date.slice(0, 4)) >= targetYear : Number(event.date.slice(0, 4)) <= targetYear));

  if (direction > 0) {
    return candidates[0]?.index ?? game.events.length;
  }
  return candidates.at(-1)?.index ?? minimum;
}

function buildOptionSparkline(results: OptionsResult[], currentValue: number) {
  const values = [startingBankroll, ...results.map((result) => result.endingBankroll), currentValue];
  const uniqueValues = values.filter((_, index) => index === 0 || index === values.length - 1 || index < values.length - 1);
  const min = Math.min(...uniqueValues);
  const max = Math.max(...uniqueValues);
  const width = 240;
  const height = 72;
  const range = Math.max(1, max - min);
  return uniqueValues
    .map((value, index) => {
      const x = uniqueValues.length <= 1 ? 0 : (index / (uniqueValues.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatOptionsMoneyDelta(value: number) {
  const absolute = formatOptionsMoney(Math.abs(value));
  if (value > 0) {
    return `+${absolute}`;
  }
  if (value < 0) {
    return `-${absolute}`;
  }
  return "$0";
}

function getOptionsStartingGain(value: number) {
  return (value / startingBankroll - 1) * 100;
}

function getStrategyGap(playerValue: number, benchmarkValue: number, benchmarkName: string) {
  const gap = playerValue - benchmarkValue;
  if (gap >= 0) {
    return `${formatOptionsMoney(gap)} ahead of ${benchmarkName}`;
  }
  return `${formatOptionsMoney(Math.abs(gap))} behind ${benchmarkName}`;
}

function formatCountNoun(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getOptionsFinalRank(game: OptionsFortuneState) {
  if (game.bankroll >= game.perfectTape * 0.96) {
    return "Tape Reader";
  }
  if (game.bankroll >= game.indexBenchmark && game.bankroll >= game.billsBenchmark) {
    return "Market Beater";
  }
  if (game.bankroll >= startingBankroll) {
    return "Capital Preserved";
  }
  return "Premium Lesson";
}

function getOptionsBestHindsightChoice(result: OptionsResult): OptionChoice {
  return optionChoiceOrder
    .map((choice) => calculateOptionOutcome(result.startingBankroll, result.event, result.target, choice))
    .sort((a, b) => b.endingBankroll - a.endingBankroll)[0]?.choice ?? "bills";
}

function getOptionsChoiceCountSummary(results: OptionsResult[]) {
  const counts = optionChoiceOrder
    .map((choice) => ({
      choice,
      count: results.filter((result) => result.choice === choice).length,
    }))
    .filter(({ count }) => count > 0);

  if (counts.length === 0) {
    return "No trades were placed.";
  }

  return counts.map(({ choice, count }) => `${optionChoiceShortLabels[choice]} ${count}`).join(" / ");
}

function getOptionsRecommendedStrategy(game: OptionsFortuneState) {
  const hindsightCounts = optionChoiceOrder.map((choice) => ({
    choice,
    count: game.results.filter((result) => getOptionsBestHindsightChoice(result) === choice).length,
  }));
  const bestPattern = hindsightCounts.sort((a, b) => b.count - a.count)[0] ?? { choice: "bills" as OptionChoice, count: 0 };
  const total = Math.max(1, game.results.length);

  if (bestPattern.choice === "bills") {
    return {
      title: "Recommended strategy: let premium earn its keep",
      text: `Treasury bills were the best hindsight choice in ${bestPattern.count} of ${total} expirations. A practical options lesson is to stay in bills unless the future headline implies a move large enough to clear the modeled premium. This may work because long options lose the premium if the move is too small or arrives too late.`,
    };
  }

  return {
    title: `Recommended strategy: selective ${optionChoiceShortLabels[bestPattern.choice]}`,
    text: `${optionChoiceLabels[bestPattern.choice]} was the best hindsight choice in ${bestPattern.count} of ${total} expirations. The teachable strategy is to use the option only when the headline suggests direction and magnitude, then let bills carry the unused cash. This may work because options reward convexity, but only after the underlying move beats the cost of the premium.`,
  };
}

function getOptionsFinalRecap(game: OptionsFortuneState) {
  const results = game.results;
  const gain = game.bankroll - startingBankroll;
  const gainPercent = getOptionsStartingGain(game.bankroll);
  const totalTaxPaid = results.reduce((total, result) => total + result.tax, 0);
  const totalPremiumPaid = results.reduce((total, result) => total + result.optionBudget, 0);
  const winners = results.filter((result) => result.profit >= 0).length;
  const choiceSummary = getOptionsChoiceCountSummary(results);
  const sortedByProfit = [...results].sort((a, b) => b.profit - a.profit);
  const best = sortedByProfit[0];
  const worst = sortedByProfit.at(-1);
  const recommendation = getOptionsRecommendedStrategy(game);

  return {
    bestMove: best
      ? `Best expiration: ${optionChoiceLabels[best.choice]} from ${formatDateLong(best.event.date)} to ${formatDateLong(best.target.date)} added ${formatOptionsMoneyDelta(best.profit)}.`
      : "Best expiration: none yet.",
    choiceSummary: `Mara made ${formatCountNoun(results.length, "time jump")} with this mix: ${choiceSummary}.`,
    impactSummary: `Net result: ${formatOptionsMoneyDelta(gain)} (${formatOptionsPercent(gainPercent)}) after ${formatOptionsMoney(totalPremiumPaid)} in option premium and ${formatOptionsMoney(totalTaxPaid)} in capital gains tax; ${winners} of ${results.length} expirations finished positive.`,
    recommendation,
    rulesSummary: "Contract terms used: SPX-style cash-settled European options, struck at-the-money on the current headline date and expiring on the future headline selected by the player. Premiums are Black-Scholes-style modeled premiums using historical S&P 500 prices, trailing realized volatility, and Treasury bill yields; they are not historical option-chain quotes.",
    worstMove: worst
      ? `${worst.profit < 0 ? "Costliest" : "Smallest"} expiration: ${optionChoiceLabels[worst.choice]} from ${formatDateLong(worst.event.date)} to ${formatDateLong(worst.target.date)} moved the account ${formatOptionsMoneyDelta(worst.profit)}.`
      : "Smallest expiration: none yet.",
  };
}

function getOptionsPerformancePoints(game: OptionsFortuneState): ResultsChartPoint[] {
  const points: ResultsChartPoint[] = [
    {
      date: optionsStartDate,
      label: "Start",
      values: {
        mara: startingBankroll,
        index: startingBankroll,
        bills: startingBankroll,
      },
    },
  ];
  let indexBenchmark = startingBankroll;
  let billsBenchmark = startingBankroll;

  game.results.forEach((result) => {
    indexBenchmark *= 1 + result.underlyingReturn / 100;
    billsBenchmark *= 1 + result.billReturn / 100;
    points.push({
      date: result.target.date,
      label: result.target.label,
      values: {
        mara: result.endingBankroll,
        index: indexBenchmark,
        bills: billsBenchmark,
      },
    });
  });

  return points;
}

function getOptionsTimeJumpEntries(game: OptionsFortuneState, result: OptionsResult): TimeJumpEntry[] {
  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  const startIndex = Math.min(fromIndex + 1, game.events.length);
  const endIndex = Math.max(startIndex, Math.min(result.targetIndex, game.events.length));
  const entries: TimeJumpEntry[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (index >= game.events.length) {
      entries.push({
        date: optionsEndDate,
        headline: "Final expiration: the option tape is settled",
        isFinal: true,
        isMajor: true,
        status: "Final page",
      });
      continue;
    }

    const event = game.events[index];
    entries.push({
      date: event.date,
      headline: event.headline,
      isMajor: event.major,
      isMarketMover: event.major,
      status: event.major ? "Major headline" : "Future page",
    });
  }

  return entries.length > 0
    ? entries
    : [
        {
          date: result.target.date,
          headline: getTargetHeadline(result.target),
          isFinal: result.target.isFinal,
          isMajor: result.target.event?.major ?? result.target.isFinal,
          isMarketMover: result.target.event?.major ?? false,
        },
      ];
}

function createOptionsTimeJumpTransition(game: OptionsFortuneState, result: OptionsResult): TimeJumpTransitionModel {
  const fromIndex = Math.max(0, game.events.findIndex((event) => event.id === result.event.id));
  return {
    chartPoints: buildInterpolatedTimeJumpPoints({
      endDate: result.target.date,
      endValue: result.endingBankroll,
      startDate: result.event.date,
      startValue: result.startingBankroll,
    }),
    entries: getOptionsTimeJumpEntries(game, result),
    fromBalance: result.startingBankroll,
    fromDate: result.event.date,
    fromHeadline: result.event.headline,
    fromProgress: getProgressPercent(game, fromIndex),
    strategyLabel: optionChoiceLabels[result.choice],
    targetBalance: result.endingBankroll,
    targetDate: result.target.date,
    targetHeadline: getTargetHeadline(result.target),
    targetProgress: getProgressPercent(game, result.targetIndex),
    title: "Expiration settled",
    travelerLabel: "Mara",
  };
}

function OptionsFinalJournalOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const totalPremium = game.results.reduce((total, result) => total + result.optionBudget, 0);
  const totalPayoff = game.results.reduce((total, result) => total + result.payoff, 0);
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Final options journal">
      <article className="storybook-journal-page options-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close final journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Mara's final journal</p>
        <h2>The Last Expiration</h2>
        <div className="storybook-journal-entry">
          <p>{optionsStory.ending}</p>
          <p>
            Mara paid {formatOptionsMoney(totalPremium)} in option premium across {formatCountNoun(game.results.length, "trade")} and collected {formatOptionsMoney(totalPayoff)} in payoff before taxes and bills interest.
          </p>
          <p>
            Aunt June's lesson finally lands: a future headline is an edge, but options ask a sharper question. Was the move large enough, soon enough, and cheap enough to own?
          </p>
        </div>
      </article>
    </div>
  );
}

function OptionsIntro({
  game,
  introPage,
  onBegin,
  onTurnPage,
}: {
  game: OptionsFortuneState;
  introPage: IntroPage;
  onBegin: () => void;
  onTurnPage: () => void;
}) {
  return (
    <main className="app-shell legacy-shell storybook-shell storybook-intro-shell options-fortune-shell">
      <section className={`storybook-book intro ${introPage} options-intro-book`}>
        {introPage === "setup" ? (
          <article className="storybook-intro-page prologue options-prologue">
            <figure className="options-prologue-art" aria-label="Chicago options desk with future headline sheets">
              <div className="options-floor-board">
                <span>OEX</span>
                <strong>EXPIRATION</strong>
                <em>VOL TAPE</em>
              </div>
              <div className="options-case">
                <i />
                <b>JUNE VALE</b>
              </div>
            </figure>
            <div className="storybook-prologue-copy-panel">
              <p className="storybook-game-title">Expiration Date</p>
              <p className="eyebrow">Options desk prologue</p>
              <h1>The Quote Case</h1>
              <p className="storybook-prologue-date">{optionsPrologueDate}</p>
              <p className="storybook-copy">{optionsStory.prologue}</p>
            </div>
            <div className="storybook-chapter-one-cards">
              <span>{optionsStory.hook}</span>
              <span>Same rules: pick a future headline, choose one of four positions, and let time run.</span>
            </div>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play" type="button" onClick={onTurnPage}>
              <Play size={18} />
              <span>Start Game</span>
              <small>{formatDateLong(getCurrentOptionsEvent(game).date)}</small>
            </button>
          </article>
        ) : (
          <article className="storybook-intro-page rules options-rules">
            <h1>How To Play</h1>
            <p className="storybook-howto-goal">Goal: Use future headlines to learn how options react to direction, timing, volatility, and premium.</p>
            <div className="storybook-howto-shots" aria-label="How to play Expiration Date">
              <section className="storybook-howto-shot dashboard">
                <span className="storybook-howto-number">1</span>
                <div className="storybook-howto-screen" aria-hidden="true">
                  <div className="storybook-howto-date">Oct 27, 1997</div>
                  <div className="storybook-howto-rail">
                    <span />
                    <i />
                  </div>
                  <div className="storybook-howto-headlines">
                    <b>Future headline</b>
                    <b>Expiration page</b>
                    <b>Final page</b>
                  </div>
                </div>
                <strong>Set the date</strong>
                <p>Use the quote-wheel, headline stack, chapter index, or timeline to pick a future headline.</p>
              </section>
              <section className="storybook-howto-shot decision">
                <span className="storybook-howto-number">2</span>
                <div className="storybook-howto-screen" aria-hidden="true">
                  <span className="storybook-howto-label">Make Selection</span>
                  <div className="storybook-howto-choice neutral">Bills</div>
                  <div className="storybook-howto-choice green">Calls</div>
                  <div className="storybook-howto-choice red">Puts</div>
                </div>
                <strong>Choose strategy</strong>
                <p>Bills, Calls, Puts, or Straddle. Each holds until the selected date.</p>
              </section>
              <section className="storybook-howto-shot heat">
                <span className="storybook-howto-number">3</span>
                <div className="storybook-howto-screen" aria-hidden="true">
                  <div className="storybook-howto-heat green">Gain signal</div>
                  <div className="storybook-howto-heat red">Loss signal</div>
                  <div className="storybook-howto-play">Play</div>
                </div>
                <strong>Press Play</strong>
                <p>Advance through time. Volatility Lens unlocks halfway through the decade.</p>
              </section>
            </div>
            <section className="options-contract-rule-card" aria-label="Options contract terms">
              <strong>Contract Terms</strong>
              <p>{optionsContractRuleSummary}</p>
              <p>Premiums are model prices using historical S&P 500 levels, trailing volatility, and Treasury bill yields. The option can expire worthless.</p>
            </section>
            <button className="primary-action legacy-primary storybook-page-turn storybook-prologue-play storybook-briefcase-play" type="button" onClick={onBegin}>
              <Play size={18} />
              Play
            </button>
          </article>
        )}
      </section>
    </main>
  );
}

function OptionsTimeline({
  game,
  onSelectTarget,
}: {
  game: OptionsFortuneState;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const activePointerRef = useRef<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const currentProgress = getProgressPercent(game);
  const targetProgress = getProgressPercent(game, game.selectedTargetIndex);
  const currentEvent = getCurrentOptionsEvent(game);
  const target = getSelectedOptionsTarget(game);
  const lensUnlocked = isVolatilityLensUnlocked(game);
  const style = {
    "--story-progress": `${currentProgress}%`,
    "--story-projected-progress": `${targetProgress}%`,
    "--story-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
    "--jonah-progress": `${currentProgress}%`,
    "--jonah-target-progress": `${targetProgress}%`,
    "--jonah-journey-progress": `${Math.max(0, targetProgress - currentProgress)}%`,
  } as CSSProperties;

  const selectFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100;
    onSelectTarget(chooseNearestTargetIndex(game, progress));
  };

  const finish = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      activePointerRef.current = null;
      setScrubbing(false);
    }
  };

  return (
    <section className="storybook-progress-rail embedded" aria-label="Options timeline" style={style}>
      <div className="storybook-progress-context">
        <strong>
          Desk: {currentEvent.era} · {formatDateLong(currentEvent.date)}
          <em>Selected expiration: {formatDateLong(target.date)}</em>
        </strong>
      </div>
      <div className="storybook-progress-body">
        <div
          className={`storybook-progress-track interactive ${scrubbing ? "scrubbing" : ""}`}
          role="slider"
          aria-label="Choose Mara's next future headline on the options timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(targetProgress)}
          tabIndex={0}
          title="Click or drag to select the nearest future headline."
          data-guide-target="timeline"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
              event.preventDefault();
              onSelectTarget(Math.max(game.currentIndex + 1, game.selectedTargetIndex - 1));
            } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
              event.preventDefault();
              onSelectTarget(Math.min(game.events.length, game.selectedTargetIndex + 1));
            } else if (event.key === "End") {
              event.preventDefault();
              onSelectTarget(game.events.length);
            }
          }}
          onPointerDown={(event) => {
            activePointerRef.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            setScrubbing(true);
            selectFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (activePointerRef.current === event.pointerId) {
              selectFromPointer(event);
            }
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
        >
          <span className="storybook-progress-endcap start">1997</span>
          <span className="storybook-progress-endcap end">2007</span>
          <span className={`storybook-progress-heat-unlock ${lensUnlocked ? "active" : ""}`}>
            <b>Volatility Lens</b>
            <em>{lensUnlocked ? "Unlocked" : "Locked"}</em>
          </span>
          <div className="storybook-progress-fill" />
          <div className="storybook-progress-projection" />
          <div className="storybook-progress-target-pin">
            <ChevronRight size={13} />
            <span>Expiry</span>
          </div>
          <div className="storybook-progress-pin">
            <BriefcaseBusiness size={15} />
            <span>Mara</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function OptionsChoiceStrip({
  game,
  onChoose,
}: {
  game: OptionsFortuneState;
  onChoose: (choice: OptionChoice) => void;
}) {
  const outcomes = getProjectedOutcomes(game);
  const unlocked = isVolatilityLensUnlocked(game);

  return (
    <div className={`storybook-dashboard-allocation options-choice-strip ${unlocked ? "heat-unlocked" : "heat-locked"}`} data-guide-target="allocation-buttons">
      {optionChoiceOrder.map((choice) => {
        const Icon = optionIcons[choice];
        const outcome = outcomes[choice];
        const heat = getOutcomeHeat(outcome, unlocked);
        const active = game.choice === choice;
        return (
          <button
            key={choice}
            className={`storybook-dashboard-allocation-choice ${choice} ${heat.className} ${active ? "active" : ""}`}
            style={{ "--market-heat-alpha": heat.alpha } as CSSProperties}
            type="button"
            onClick={() => onChoose(choice)}
          >
            <Icon size={15} aria-hidden="true" />
            <strong>{optionChoiceShortLabels[choice]}</strong>
            <span>{choice === "bills" ? "100% bills" : `${Math.round(outcome.optionBudgetRate * 100)}% premium`}</span>
            <em aria-hidden="true">{active ? "Selected" : ""}</em>
          </button>
        );
      })}
    </div>
  );
}

function OptionsSelectedStrategyBanner({
  game,
  outcome,
  pulseKey,
}: {
  game: OptionsFortuneState;
  outcome: OptionOutcome;
  pulseKey: number;
}) {
  const previousChoice = getPreviousOptionChoice(game);
  const currentEvent = getCurrentOptionsEvent(game);
  const selectedTarget = getSelectedOptionsTarget(game);
  const billFrom = getOptionsFlowPosition(previousChoice);
  const billTo = getOptionsFlowPosition(game.choice);
  const taxTo = getOptionsFlowPosition("tax");
  const visibleTax = outcome.tax > 0.5;
  const isHolding = previousChoice === game.choice;
  const mainAmount = game.choice === "bills" ? outcome.startingBankroll : outcome.optionBudget;
  const secondaryAmount = game.choice === "bills" ? 0 : outcome.collateral;

  return (
    <aside
      className={`storybook-selected-allocation-banner options-selected-strategy-banner ${visibleTax ? "has-tax" : "no-tax"} ${
        pulseKey > 0 ? "is-pulsing" : ""
      } ${isHolding ? "is-holding" : "is-moving"}`}
      aria-label={`Selected strategy ${optionChoiceLabels[game.choice]}. ${formatOptionsMoney(mainAmount)} moves to ${optionChoiceLabels[game.choice]}. Capital gains tax estimate ${formatOptionsMoney(outcome.tax)}.`}
      style={
        {
          "--bill-from": `${billFrom}%`,
          "--bill-to": `${billTo}%`,
          "--tax-to": `${taxTo}%`,
        } as CSSProperties
      }
    >
      <div className="allocation-flow-stops" aria-hidden="true">
        {optionsFlowStops.map((stop) => {
          const Icon = stop.icon;
          const isSource = stop.id === previousChoice;
          const isDestination = stop.id === game.choice;
          const isTaxStop = stop.id === "tax";

          return (
            <span
              key={stop.id}
              className={`allocation-flow-stop ${stop.tone} ${isSource ? "source" : ""} ${isDestination ? "destination" : ""} ${
                isTaxStop && visibleTax ? "tax-active" : ""
              }`}
            >
              <i>{isTaxStop ? <b>US</b> : Icon ? <Icon size={15} aria-hidden="true" /> : null}</i>
              <em>{stop.label}</em>
            </span>
          );
        })}
        <b className="allocation-dollar-bill main-bill">
          <span>$</span>
          <strong>{formatOptionsMoney(mainAmount)}</strong>
        </b>
        {visibleTax && (
          <b className="allocation-dollar-bill tax-bill">
            <span>$</span>
            <strong>{formatOptionsMoney(outcome.tax)}</strong>
          </b>
        )}
      </div>
      <div className="allocation-banner-copy">
        <span>
          {isHolding ? "No trade" : "Selected"} · {optionChoiceLabels[game.choice]}
        </span>
        <strong>
          {game.choice === "bills"
            ? `In ${formatOptionsMoney(mainAmount)} · Tax ${formatOptionsMoney(outcome.tax)}`
            : `Premium ${formatOptionsMoney(mainAmount)} · Bills ${formatOptionsMoney(secondaryAmount)} · Tax ${formatOptionsMoney(outcome.tax)}`}
        </strong>
        <small className="allocation-contract-term">{getOptionsContractTermLabel(currentEvent.date, selectedTarget.date)}</small>
      </div>
    </aside>
  );
}

function OptionsDateConsole({
  game,
  onChoose,
  onOpenIndex,
  onPlay,
  onSelectTarget,
}: {
  game: OptionsFortuneState;
  onChoose: (choice: OptionChoice) => void;
  onOpenIndex: () => void;
  onPlay: () => void;
  onSelectTarget: (targetIndex: number) => void;
}) {
  const dragStartRef = useRef<{ moved: boolean; selectedIndex: number; targetIndex: number | null; y: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const selectedTarget = getSelectedOptionsTarget(game);
  const dateParts = getRolodexDateParts(selectedTarget.date);
  const outcomes = getProjectedOutcomes(game);
  const projected = outcomes[game.choice];
  const minimum = game.currentIndex + 1;
  const headlineWindowStart = Math.max(game.currentIndex, game.selectedTargetIndex - 2);
  const headlineWindowEnd = Math.min(game.events.length, headlineWindowStart + 5);
  const entries = Array.from({ length: headlineWindowEnd - headlineWindowStart + 1 }, (_, offset) => headlineWindowStart + offset);
  const canMoveEarlier = game.selectedTargetIndex > minimum;
  const canMoveLater = game.selectedTargetIndex < game.events.length;
  const [selectionPulseKey, setSelectionPulseKey] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    setSelectionPulseKey((key) => key + 1);
  }, [game.choice, game.selectedTargetIndex]);

  const moveSelection = (delta: number) => {
    onSelectTarget(Math.max(minimum, Math.min(game.events.length, game.selectedTargetIndex + delta)));
  };
  const clampTargetIndex = (index: number) => Math.max(minimum, Math.min(game.events.length, index));

  const handleWheel = (event: ReactWheelEvent) => {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onPlay();
    }
  };
  const startSpin = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    const headlineCard =
      event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".storybook-headline-card") : null;
    const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
    dragStartRef.current = {
      moved: false,
      selectedIndex: game.selectedTargetIndex,
      targetIndex: Number.isFinite(headlineIndex) ? clampTargetIndex(headlineIndex) : null,
      y: event.clientY,
    };
    setIsSpinning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveSpin = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) {
      return;
    }
    const deltaY = dragStart.y - event.clientY;
    if (Math.abs(deltaY) > 6) {
      dragStart.moved = true;
    }
    const nextIndex = clampTargetIndex(dragStart.selectedIndex + Math.round(deltaY / 42));
    if (nextIndex !== game.selectedTargetIndex) {
      onSelectTarget(nextIndex);
    }
  };
  const stopSpin = (event: ReactPointerEvent<HTMLElement>) => {
    const dragStart = dragStartRef.current;
    if (dragStart?.moved) {
      ignoreClickRef.current = true;
      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
    } else if (dragStart?.targetIndex !== null && dragStart?.targetIndex !== undefined && dragStart.targetIndex > game.currentIndex) {
      onSelectTarget(dragStart.targetIndex);
    }
    dragStartRef.current = null;
    setIsSpinning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const spinHandlers = {
    onPointerCancel: stopSpin,
    onPointerDown: startSpin,
    onPointerMove: moveSpin,
    onPointerUp: stopSpin,
  };

  return (
    <section className="storybook-date-console rolodex-watch-skin options-date-console" aria-label="Expiration date selector" data-guide-target="date-console">
      <OptionsTimeline game={game} onSelectTarget={onSelectTarget} />
      <article className="storybook-date-headline" aria-label="Rolling headline preview">
        <div className="storybook-deck-kicker">
          <span>{selectedTarget.isFinal ? "Final expiration" : `Future page ${selectedTarget.index + 1} of ${game.events.length}`}</span>
          <em>
            {formatOptionsSpan(getCurrentOptionsEvent(game).date, selectedTarget.date)} pass · {formatOptionsSpan(selectedTarget.date, "2007-10-26")} remain
          </em>
        </div>
        <div className="options-term-chip" aria-label="Selected options contract term">
          {getOptionsContractTermShortLabel(getCurrentOptionsEvent(game).date, selectedTarget.date)}
        </div>
        <div
          className={`storybook-headline-deck options-headline-deck ${isSpinning ? "spinning" : ""}`}
          tabIndex={0}
          data-guide-target="headline-deck"
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          {...spinHandlers}
        >
          <div className="storybook-headline-track">
            {entries.map((index) => {
              const event = game.events[index];
              const isFinal = index >= game.events.length;
              const headline = isFinal ? "Final expiration: close the quote case" : event.headline;
              const isCurrent = index === game.currentIndex;
              const selected = index === game.selectedTargetIndex;
              return (
                <button
                  key={`${index}-${headline}`}
                  className={`storybook-headline-card ${isCurrent ? "current" : ""} ${selected ? "selected" : ""} ${event?.major ? "major" : ""}`}
                  type="button"
                  data-headline-index={index}
                  disabled={isCurrent}
                  onClick={() => {
                    if (ignoreClickRef.current) return;
                    if (!isCurrent) onSelectTarget(index);
                  }}
                >
                  <strong className={selected ? "marquee" : ""}>
                    {selected ? (
                      <span className="storybook-headline-marquee-track" aria-hidden="true">
                        <span>{headline}</span>
                        <span>{headline}</span>
                      </span>
                    ) : (
                      <span className="storybook-headline-text">{headline}</span>
                    )}
                  </strong>
                  <em aria-hidden="true">{isCurrent ? "Now" : selected ? "Selected" : ""}</em>
                </button>
              );
            })}
          </div>
        </div>
      </article>

      <div className="storybook-date-controls options-controls">
        <div className="storybook-date-picker-row">
          <div
            className={`storybook-rolodex-date options-quote-wheel ${isSpinning ? "spinning" : ""}`}
            aria-label="Selected expiration date"
            data-guide-target="date-rolodex"
            onWheel={handleWheel}
            {...spinHandlers}
          >
            <div className="storybook-date-window month">
              <strong>{dateParts.month}</strong>
            </div>
            <div className="storybook-date-window day">
              <strong>{dateParts.day}</strong>
            </div>
            <div className="storybook-date-window storybook-year-card">
              <button className="storybook-year-jump up" type="button" onClick={() => onSelectTarget(findYearJumpIndex(game, -1))} disabled={!canMoveEarlier} aria-label="Skip back one year">
                <ChevronUp size={20} />
              </button>
              <strong>{dateParts.year}</strong>
              <button className="storybook-year-jump down" type="button" onClick={() => onSelectTarget(findYearJumpIndex(game, 1))} disabled={!canMoveLater} aria-label="Skip ahead one year">
                <ChevronDown size={20} />
              </button>
            </div>
          </div>
          <button className="storybook-chapter-wheel-button" type="button" onClick={onOpenIndex} aria-label="Open expiration index" data-guide-target="chapter-index">
            <Newspaper size={15} />
          </button>
        </div>
        <OptionsChoiceStrip game={game} onChoose={onChoose} />
        <button className="primary-action legacy-primary storybook-play-button" type="button" onClick={onPlay} data-guide-target="advance-game">
          <span>Play</span>
          <small>
            {optionChoiceShortLabels[game.choice]} · {formatOptionsMoney(projected.optionBudget || projected.collateral)}
          </small>
          <ChevronRight size={18} />
        </button>
      </div>
      <OptionsSelectedStrategyBanner game={game} outcome={projected} pulseKey={selectionPulseKey} />
    </section>
  );
}

function OptionsPreviewCard({
  target,
  onOpen,
  lastResult,
}: {
  target: OptionsTarget;
  onOpen: () => void;
  lastResult?: OptionsResult;
}) {
  const event = target.event;
  return (
    <article className="storybook-current-page with-headline-image options-preview-card" data-guide-target="selected-front-page-article">
      <div className="storybook-current-copy">
        <div className="storybook-masthead mini">
          <span>{target.label}</span>
          <b>{target.isFinal ? "Final Expiration" : event?.major ? "Major Headline" : "Selected Expiration"}</b>
        </div>
        <h1>
          <button className="storybook-front-page-link" type="button" onClick={onOpen} data-guide-target="front-page">
            {getTargetHeadline(target)}
          </button>
        </h1>
        <div className="storybook-front-page-date-line">{formatDateWithWeekday(target.date)}</div>
        <HeadlineEventImage event={event ?? null} variant="preview" />
        {lastResult && (
          <div className={`storybook-arrival-summary ${getTone(lastResult.profit)}`}>
            <span>Previous trade</span>
            <strong>
              {optionChoiceShortLabels[lastResult.choice]} · {formatOptionsPercent((lastResult.endingBankroll / lastResult.startingBankroll - 1) * 100)} · {formatOptionsMoney(lastResult.endingBankroll)}
            </strong>
          </div>
        )}
        <p>{getPreviewParagraph(event, target.isFinal)}</p>
        <div className="options-preview-contract-note">
          <strong>Contract terms</strong>
          <span>{optionsContractRuleSummary}</span>
        </div>
      </div>
    </article>
  );
}

function OptionsDashboardGuide({ onStart }: { onStart: () => void }) {
  return (
    <TargetGuideOverlay
      buttonLabel="Start"
      className="dashboard-guide-live options-guide"
      guideItems={optionsDashboardGuideItems}
      label="Options dashboard guide"
      onStart={onStart}
      showStartButton={false}
      subtitle="Click anywhere to start"
      title="Mara's Dashboard"
    />
  );
}

function OptionsArticleOverlay({ target, onClose }: { target: OptionsTarget; onClose: () => void }) {
  const event = target.event;
  const facts = event?.newspaperArticle?.facts ?? [];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Expiration front page">
      <article className="storybook-newspaper-max options-newspaper">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close front page">
          <Minimize2 size={17} />
        </button>
        <section className="storybook-newspaper-clipping">
          <div className="storybook-masthead">
            <span>{optionsChronicleName}</span>
            <em>{formatDateWithWeekday(target.date)}</em>
          </div>
          <h2>{getTargetHeadline(target)}</h2>
          <p>{getTargetDeck(target)}</p>
          <HeadlineEventImage event={event ?? null} variant="newspaper" />
          <div className="storybook-article-columns">
            {(event?.newspaperArticle?.lede ?? getPreviewParagraph(event, target.isFinal))
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
          </div>
        </section>
        <aside className="storybook-front-page-notes">
          <span>Desk Notes</span>
          {facts.slice(0, 4).map((fact) => (
            <p key={fact}>{fact}</p>
          ))}
          <p>Gameplay uses real historical S&P 500 headline-date levels, historical Treasury bill yields, and a Black-Scholes-style modeled premium. These are not historical option-chain quotes.</p>
          <p>{optionsContractRuleSummary}</p>
        </aside>
      </article>
    </div>
  );
}

function OptionsJournalOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const currentEvent = getCurrentOptionsEvent(game);
  const paragraphs = [
    optionsStory.journal,
    currentEvent.lifeNote,
    `Current desk page: ${currentEvent.headline}`,
    `Mara has made ${game.results.length} ${game.results.length === 1 ? "trade" : "trades"} and is sitting at ${formatOptionsMoney(game.bankroll)}.`,
  ];
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Mara's journal">
      <article className="storybook-journal-page options-journal-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close journal">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Mara's desk journal</p>
        <h2>{formatDateLong(currentEvent.date)}</h2>
        <div className="storybook-journal-entry">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}

function OptionsLedgerOverlay({ game, onClose }: { game: OptionsFortuneState; onClose: () => void }) {
  const lastResult = game.results.at(-1);
  const path = buildOptionSparkline(game.results, game.bankroll);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Options ledger">
      <article className="storybook-ledger-page options-ledger-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close ledger">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Options ledger</p>
        <h2>{formatOptionsMoney(game.bankroll)}</h2>
        <section className="storybook-ledger-comparison">
          <article className="player">
            <span>Mara</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em>{formatOptionsPercent(gainPercent)}</em>
          </article>
          <article>
            <span>S&P 500</span>
            <strong>{formatOptionsMoney(game.indexBenchmark)}</strong>
            <em>{formatOptionsPercent((game.indexBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
          <article>
            <span>Bills</span>
            <strong>{formatOptionsMoney(game.billsBenchmark)}</strong>
            <em>{formatOptionsPercent((game.billsBenchmark / startingBankroll - 1) * 100)}</em>
          </article>
        </section>
        <section className="storybook-market-chart sp500 options-ledger-chart" aria-label="Options account chart">
          <div>
            <span>Account path</span>
            <strong>{formatOptionsMoney(gain)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatOptionsPercent(gainPercent)}</em>
          </div>
          <svg viewBox="0 0 240 72" role="img" aria-label="Mara account value by trade">
            <path className="storybook-chart-gridline top" d="M 0 12 H 240" />
            <path className="storybook-chart-gridline mid" d="M 0 36 H 240" />
            <path className="storybook-chart-gridline bottom" d="M 0 60 H 240" />
            {path && <path className="storybook-chart-line" d={path} />}
          </svg>
        </section>
        {lastResult && (
          <section className="storybook-ledger-market-context">
            <div className="storybook-ledger-section-head">
              <span>Last trade</span>
              <strong>{optionChoiceLabels[lastResult.choice]}</strong>
            </div>
            <div className="storybook-market-row">
              <span>Premium spent</span>
              <strong>{formatOptionsMoney(lastResult.optionBudget)}</strong>
              <em>Payoff {formatOptionsMoney(lastResult.payoff)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Capital gains tax</span>
              <strong>{formatOptionsMoney(lastResult.tax)}</strong>
              <em>S&P move {formatOptionsPercent(lastResult.underlyingReturn)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Contract term</span>
              <strong>{formatOptionsSpan(lastResult.event.date, lastResult.target.date)}</strong>
              <em>Expires {formatDateLong(lastResult.target.date)}</em>
            </div>
            <div className="storybook-market-row">
              <span>Pricing model</span>
              <strong>{formatOptionsPercent(lastResult.volatility * 100).replace("+", "")} vol</strong>
              <em>{formatOptionsPercent(lastResult.riskFreeRate * 100).replace("+", "")} T-bill rate</em>
            </div>
          </section>
        )}
      </article>
    </div>
  );
}

function OptionsIndexOverlay({
  game,
  onClose,
  onSelect,
}: {
  game: OptionsFortuneState;
  onClose: () => void;
  onSelect: (targetIndex: number) => void;
}) {
  const futureEntries = game.events
    .map((event, index) => ({ event, index }))
    .filter(({ index }) => index > game.currentIndex);
  const grouped = futureEntries.reduce<Record<string, Array<{ event: HeadlineEvent; index: number }>>>((acc, entry) => {
    const year = entry.event.date.slice(0, 4);
    acc[year] = [...(acc[year] ?? []), entry];
    return acc;
  }, {});
  const years = Object.keys(grouped).sort();
  const [openYear, setOpenYear] = useState(years[0] ?? "");

  return (
    <div className="storybook-overlay" role="dialog" aria-modal="true" aria-label="Expiration index">
      <article className="storybook-chapter-page options-index-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close expiration index">
          <Minimize2 size={17} />
        </button>
        <p className="eyebrow">Expiration Index</p>
        <h2>Pick any future page</h2>
        <p>Choose a future headline. You cannot move backward once time advances.</p>
        <div className="storybook-year-book">
          {years.map((year) => (
            <section key={year} className={`storybook-year-chapter ${openYear === year ? "open" : ""}`}>
              <button type="button" onClick={() => setOpenYear(openYear === year ? "" : year)}>
                <strong>{year}</strong>
                <span>{grouped[year].length} expirations</span>
                <ChevronDown size={16} />
              </button>
              {openYear === year && (
                <div>
                  {grouped[year].slice(0, 14).map(({ event, index }) => (
                    <article key={event.id} className={`storybook-chapter-entry ${event.major ? "major" : ""}`}>
                      <div>
                        <span>{formatDateLong(event.date)}</span>
                        <strong>{event.headline}</strong>
                        <em>{event.deck}</em>
                      </div>
                      <button className="primary-action legacy-primary compact storybook-chapter-play-button" type="button" onClick={() => onSelect(index)}>
                        Play
                        <ChevronRight size={14} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
          <button className="primary-action legacy-primary options-final-expiry" type="button" onClick={() => onSelect(game.events.length)}>
            Skip to final expiration
            <ChevronRight size={16} />
          </button>
        </div>
      </article>
    </div>
  );
}

function OptionsTransitionOverlay({ game, result }: { game: OptionsFortuneState; result: OptionsResult }) {
  return (
    <TimeJumpTransitionOverlay
      formatDateLong={formatDateLong}
      formatDateWithWeekday={formatDateWithWeekday}
      formatMoney={formatOptionsMoney}
      formatMoneyDelta={formatOptionsMoneyDelta}
      formatPercent={formatOptionsPercent}
      transition={createOptionsTimeJumpTransition(game, result)}
    />
  );
}

function OptionsFinalScreen({ game, onRestart }: { game: OptionsFortuneState; onRestart: () => void }) {
  const [finalJournalOpen, setFinalJournalOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [submittedScore, setSubmittedScore] = useState<LeaderboardSubmittedEntry | null>(null);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;
  const totalTaxPaid = game.results.reduce((total, result) => total + result.tax, 0);
  const totalPremiumPaid = game.results.reduce((total, result) => total + result.optionBudget, 0);
  const profitableTrades = game.results.filter((result) => result.profit >= 0).length;
  const performancePoints = getOptionsPerformancePoints(game);
  const finalRecap = getOptionsFinalRecap(game);
  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell complete options-fortune-shell">
      <section className="storybook-final-book last-edition options-final-book">
        <header className="storybook-final-head">
          <p className="storybook-game-title">Expiration Date</p>
          <p className="eyebrow">Ten Years Later · {formatDateLong(optionsEndDate)}</p>
          <h1>Final Expiration</h1>
          <span>{getOptionsFinalRank(game)}</span>
        </header>
        <section className="storybook-final-scoreboard" aria-label="Options strategy comparison">
          <article className="storybook-final-player-score">
            <span>Mara's account</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em className={gain >= 0 ? "positive" : "negative"}>{formatOptionsPercent(gainPercent)} after {formatOptionsMoney(totalTaxPaid)} in capital gains tax</em>
          </article>
          <div className="storybook-final-rivals">
            <article>
              <span>S&P 500</span>
              <strong>{formatOptionsMoney(game.indexBenchmark)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.indexBenchmark))} buy-and-hold index</em>
              <small className={game.bankroll >= game.indexBenchmark ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.indexBenchmark, "S&P 500")}
              </small>
            </article>
            <article>
              <span>Treasury bills</span>
              <strong>{formatOptionsMoney(game.billsBenchmark)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.billsBenchmark))} bills benchmark</em>
              <small className={game.bankroll >= game.billsBenchmark ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.billsBenchmark, "Bills")}
              </small>
            </article>
            <article>
              <span>Perfect tape</span>
              <strong>{formatOptionsMoney(game.perfectTape)}</strong>
              <em>{formatOptionsPercent(getOptionsStartingGain(game.perfectTape))} best choice each window</em>
              <small className={game.bankroll >= game.perfectTape ? "positive" : "negative"}>
                {getStrategyGap(game.bankroll, game.perfectTape, "Perfect tape")}
              </small>
            </article>
          </div>
        </section>

        <section className="storybook-final-analytics" aria-label="Final options performance charts">
          <ResultsPerformanceChart
            ariaLabel="Line chart comparing Mara, the S&P 500, and Treasury bills by option trade"
            endDate={optionsEndDate}
            formatMoney={formatOptionsMoney}
            points={performancePoints}
            series={[
              { key: "mara", label: "Mara", className: "jonah" },
              { key: "index", label: "S&P", className: "eli" },
              { key: "bills", label: "Bills", className: "ruth" },
            ]}
            startDate={optionsStartDate}
            summary={formatCountNoun(Math.max(0, performancePoints.length - 1), "settled trade")}
          />
          <ResultsMoveImpactChart
            ariaLabel="Bar chart showing Mara's gain or loss after each option trade"
            formatMoneyDelta={formatOptionsMoneyDelta}
            impacts={game.results.map((result) => ({ date: result.target.date, profit: result.profit }))}
          />
        </section>

        <section className="storybook-final-metrics" aria-label="Options performance metrics">
          <article>
            <span>Trades made</span>
            <strong>{game.results.length}</strong>
            <em>{formatCountNoun(profitableTrades, "winner")}</em>
          </article>
          <article>
            <span>Premium paid</span>
            <strong>{formatOptionsMoney(totalPremiumPaid)}</strong>
            <em>{formatOptionsPercent(totalPremiumPaid > 0 ? (totalPremiumPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
          <article>
            <span>Capital gains tax</span>
            <strong>{formatOptionsMoney(totalTaxPaid)}</strong>
            <em>{formatOptionsPercent(totalTaxPaid > 0 ? (totalTaxPaid / startingBankroll) * 100 : 0).replace("+", "")} of start</em>
          </article>
        </section>

        <section className="storybook-final-overview storybook-final-trade-recap" aria-label="Trade recap and recommended strategy">
          <div>
            <WalletCards size={18} />
            <span>Trade recap</span>
          </div>
          <p>{finalRecap.choiceSummary}</p>
          <p>{finalRecap.impactSummary}</p>
          <p>{finalRecap.bestMove}</p>
          <p>{finalRecap.worstMove}</p>
          <p>{finalRecap.rulesSummary}</p>
          <article className="storybook-final-strategy-note">
            <span>{finalRecap.recommendation.title}</span>
            <p>{finalRecap.recommendation.text}</p>
          </article>
        </section>

        <div className="storybook-final-actions">
          <button className="primary-action legacy-primary" type="button" onClick={() => setFinalJournalOpen(true)}>
            <BookOpen size={18} />
            Read Final Journal Entry
          </button>
          <button className="secondary-action" type="button" onClick={() => setLeaderboardOpen(true)}>
            <Trophy size={18} />
            High Scores
          </button>
          <button className="secondary-action" type="button" onClick={onRestart}>
            <RotateCcw size={18} />
            Play It Again
          </button>
          <a className="secondary-action" href="/games">
            <Home size={18} />
            Back to Games
          </a>
        </div>

        <section className="storybook-final-overview">
          <div>
            <BookOpen size={18} />
            <span>Story recap</span>
          </div>
          <p>{optionsStory.ending}</p>
          <p>
            Mara started with {formatOptionsMoney(startingBankroll)} and a quote case full of future market pages. Each jump forced her to decide whether the headline deserved calls, puts, a straddle, or the patience of Treasury bills.
          </p>
        </section>
      </section>
      {finalJournalOpen && <OptionsFinalJournalOverlay game={game} onClose={() => setFinalJournalOpen(false)} />}
      {leaderboardOpen && (
        <InvestmentLeaderboardOverlay
          benchmarkRows={[
            {
              detail: "S&P 500 buy-and-hold",
              id: "options-index-benchmark",
              label: "S&P 500",
              returnPercent: getOptionsStartingGain(game.indexBenchmark),
              score: game.indexBenchmark,
            },
            {
              detail: "Treasury bills",
              id: "options-bills-benchmark",
              label: "Bills",
              returnPercent: getOptionsStartingGain(game.billsBenchmark),
              score: game.billsBenchmark,
            },
            {
              detail: "Best option choice each window",
              id: "options-perfect-benchmark",
              label: "Perfect tape",
              returnPercent: getOptionsStartingGain(game.perfectTape),
              score: game.perfectTape,
            },
          ]}
          currentRunDetail={`${formatCountNoun(game.results.length, "trade")} · ${formatOptionsMoney(totalTaxPaid)} tax`}
          formatDateLong={formatDateLong}
          formatMoney={formatOptionsMoney}
          formatPercent={formatOptionsPercent}
          gameTitle="Expiration Date"
          onClose={() => setLeaderboardOpen(false)}
          onSubmitted={setSubmittedScore}
          periodLabel="10 years"
          returnPercent={gainPercent}
          score={game.bankroll}
          storageKey="charged-alpha-options-fortune-leaderboard"
          submittedEntry={submittedScore}
        />
      )}
    </main>
  );
}

export function OptionsFortuneGame() {
  const [game, setGame] = useState(createOptionsFortune);
  const [introPage, setIntroPage] = useState<IntroPage>("setup");
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [transitionResult, setTransitionResult] = useState<OptionsResult | null>(null);
  const transitionTimerRef = useRef<number | null>(null);
  const currentEvent = getCurrentOptionsEvent(game);
  const selectedTarget = getSelectedOptionsTarget(game);
  const lastResult = game.results.at(-1);
  const gain = game.bankroll - startingBankroll;
  const gainPercent = (game.bankroll / startingBankroll - 1) * 100;

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const begin = () => {
    const next = startOptionsFortune(game);
    setGame(next);
    setGuideOpen(true);
  };

  const restart = () => {
    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setGame(resetOptionsFortune());
    setIntroPage("setup");
    setOverlay(null);
    setGuideOpen(false);
    setTransitionResult(null);
  };

  const play = () => {
    setGame((current) => {
      const next = playOptionsRound(current);
      const result = next.results.at(-1);
      if (result && result !== current.results.at(-1)) {
        setTransitionResult(result);
        if (transitionTimerRef.current) {
          window.clearTimeout(transitionTimerRef.current);
        }
        transitionTimerRef.current = window.setTimeout(() => {
          setTransitionResult(null);
          transitionTimerRef.current = null;
        }, timeJumpTransitionDurationMs);
      }
      return next;
    });
  };

  if (game.phase === "intro") {
    return <OptionsIntro game={game} introPage={introPage} onBegin={begin} onTurnPage={() => setIntroPage("rules")} />;
  }

  if (game.phase === "complete") {
    return (
      <>
        <OptionsFinalScreen game={game} onRestart={restart} />
        {transitionResult && <OptionsTransitionOverlay game={game} result={transitionResult} />}
      </>
    );
  }

  return (
    <main className="app-shell legacy-shell storybook-shell storybook-play-shell choose options-fortune-shell">
      <section className="storybook-play-book dashboard-book options-dashboard-book">
        <header className="storybook-play-head">
          <div className="storybook-top-portfolio" data-guide-target="portfolio-status">
            <span>Page {game.currentIndex + 1} / {game.events.length} · {formatDateLong(currentEvent.date)}</span>
            <strong>{formatOptionsMoney(game.bankroll)}</strong>
            <em className={`storybook-top-performance ${getTone(gain)}`}>{formatOptionsMoney(gain)} / {formatOptionsPercent(gainPercent)}</em>
            <small>{optionChoiceLabels[game.choice]}</small>
          </div>
          <button className="icon-reset secondary-action compact" type="button" onClick={restart} aria-label="Reset Expiration Date">
            <RotateCcw size={15} />
          </button>
        </header>

        <div className="storybook-one-screen dashboard-clean options-one-screen">
          <OptionsDateConsole
            game={game}
            onChoose={(choice) => setGame((current) => setOptionsChoice(current, choice))}
            onOpenIndex={() => setOverlay("index")}
            onPlay={play}
            onSelectTarget={(targetIndex) => setGame((current) => setOptionsTargetIndex(current, targetIndex))}
          />
          <OptionsPreviewCard target={selectedTarget} lastResult={lastResult} onOpen={() => setOverlay("article")} />
        </div>

        <nav className="storybook-bottom-tabs" aria-label="Game and story pages">
          <button type="button" onClick={() => setOverlay("journal")} data-guide-target="journal">
            <BookOpen size={15} />
            Journal
          </button>
          <button type="button" onClick={() => setOverlay("ledger")} data-guide-target="ledger-button">
            <WalletCards size={15} />
            Ledger
          </button>
          <button type="button" onClick={() => setOverlay("article")} data-guide-target="current-page-button">
            <Newspaper size={15} />
            Front Page
          </button>
        </nav>
      </section>

      {transitionResult && <OptionsTransitionOverlay game={game} result={transitionResult} />}
      {guideOpen && <OptionsDashboardGuide onStart={() => setGuideOpen(false)} />}
      {overlay === "article" && <OptionsArticleOverlay target={selectedTarget} onClose={() => setOverlay(null)} />}
      {overlay === "journal" && <OptionsJournalOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "ledger" && <OptionsLedgerOverlay game={game} onClose={() => setOverlay(null)} />}
      {overlay === "index" && (
        <OptionsIndexOverlay
          game={game}
          onClose={() => setOverlay(null)}
          onSelect={(targetIndex) => {
            setGame((current) => setOptionsTargetIndex(current, targetIndex));
            setOverlay(null);
          }}
        />
      )}
      <p className="compliance-disclaimer">Educational simulation. Options involve risk and can expire worthless.</p>
    </main>
  );
}
