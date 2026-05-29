import {
  BadgeDollarSign,
  BarChart3,
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  Fuel,
  HeartPulse,
  Landmark,
  Newspaper,
  Play,
  RotateCcw,
  Scale,
  Shield,
  ShoppingBasket,
  Sparkles,
  Telescope,
  Trophy,
  WalletCards,
} from "lucide-react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  sectorChoiceDescriptions,
  sectorChoiceLabels,
  sectorChoiceLessons,
  sectorChoiceOrder,
  sectorChoiceShortLabels,
  sectorOracleEndDate,
  sectorOracleStartDate,
  sectorOracleTitle,
  type SectorChoice,
  type SectorOracleEvent,
} from "./content/sectorOracleEvents";
import { fetchHeadlineImage, type HeadlineImageAsset } from "../headline-market/content/headlineImages";
import {
  createSectorOracle,
  formatSectorDate,
  formatSectorMoney,
  formatSectorMoneyCompact,
  formatSectorPercent,
  formatSectorYear,
  getCurrentSectorEvent,
  getProjectedSectorOutcomes,
  getSectorIntervalReturn,
  getSectorProgressPercent,
  getSelectedSectorTarget,
  getSectorTarget,
  playSectorOracleRound,
  resetSectorOracle,
  sectorOracleStartingBankroll,
  setSectorChoice,
  setSectorTargetIndex,
  startSectorOracle,
  type SectorOracleOutcome,
  type SectorOracleResult,
  type SectorOracleState,
  type SectorOracleTarget,
} from "./simulation/sectorOracle";

type Overlay = "ledger" | "lesson" | null;
type SectorFlowStop = SectorChoice | "tax";
type SectorReelEntry = {
  date: string;
  headline: string;
  isCurrent: boolean;
  isFinal: boolean;
  isMajor: boolean;
};
type SectorReelChartPoint = {
  date: string;
  value: number;
};
type SectorBenchmarkRaceRow = {
  id: string;
  label: string;
  value: number;
  note: string;
};
type SectorReelTransition = {
  balanceDelta: number;
  balanceReturnPercent: number;
  benchmarkRows: SectorBenchmarkRaceRow[];
  chartPoints: SectorReelChartPoint[];
  choice: SectorChoice;
  choiceLabel: string;
  entries: SectorReelEntry[];
  fromBalance: number;
  fromDate: string;
  fromHeadline: string;
  fromProgress: number;
  targetBalance: number;
  targetDate: string;
  targetHeadline: string;
  targetProgress: number;
  tax: number;
};

const sectorReelDurationMs = 3600;
const sectorHeadlineImageCache = new Map<string, HeadlineImageAsset | null>();

const sectorIcons: Record<SectorChoice, typeof Landmark> = {
  balanced: Scale,
  tech: Cpu,
  energy: Fuel,
  financials: Landmark,
  healthcare: HeartPulse,
  staples: ShoppingBasket,
  bonds: Shield,
};

const sectorFlowStops: Array<{ id: SectorFlowStop; label: string; tone: string }> = [
  { id: "balanced", label: "Mix", tone: "balanced" },
  { id: "tech", label: "Tech", tone: "tech" },
  { id: "energy", label: "Energy", tone: "energy" },
  { id: "financials", label: "Banks", tone: "financials" },
  { id: "healthcare", label: "Health", tone: "healthcare" },
  { id: "staples", label: "Staples", tone: "staples" },
  { id: "bonds", label: "Bonds", tone: "bonds" },
  { id: "tax", label: "Tax", tone: "tax" },
];

function formatMoneyDelta(value: number) {
  const absolute = formatSectorMoney(Math.abs(value));
  if (value > 0) return `+${absolute}`;
  if (value < 0) return `-${absolute}`;
  return "$0";
}

function getOutcomeTone(value: number) {
  if (value > 0.25) return "positive";
  if (value < -0.25) return "negative";
  return "neutral";
}

function getTargetHeadline(target: SectorOracleTarget) {
  return target.isFinal ? "Final tape: compare every rotation against the simple benchmarks" : target.event?.headline ?? target.label;
}

function getTargetDeck(target: SectorOracleTarget) {
  return target.isFinal
    ? "The oracle ticker goes quiet. The fund has to live with every jump, every sector call, and every tax bill."
    : target.event?.deck ?? "A future headline clicks across the brass ticker.";
}

function getLearningLine(choice: SectorChoice, target: SectorOracleTarget, outcome: SectorOracleOutcome) {
  if (target.isFinal) {
    return "The final score rewards survival, patience, and knowing when the obvious headline was already priced in.";
  }
  const tone = getOutcomeTone(outcome.returnPercent);
  if (tone === "positive") {
    return sectorChoiceLessons[choice];
  }
  if (choice === "bonds") {
    return "Protection can still disappoint when inflation or recoveries make safety expensive.";
  }
  return "The headline may have been real, but this sector was not the cleanest beneficiary.";
}

function getBestChoice(outcomes: Record<SectorChoice, SectorOracleOutcome>) {
  return sectorChoiceOrder.reduce((best, choice) => (outcomes[choice].endingBankroll > outcomes[best].endingBankroll ? choice : best), sectorChoiceOrder[0]);
}

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function formatSectorDateWithWeekday(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function getSectorDateParts(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(new Date(`${date}T00:00:00Z`));
  return {
    month: parts.find((part) => part.type === "month")?.value ?? "Jan",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
    year: parts.find((part) => part.type === "year")?.value ?? date.slice(0, 4),
  };
}

function clampSectorTargetIndex(game: SectorOracleState, index: number) {
  return Math.max(Math.min(game.currentIndex + 1, game.events.length), Math.min(index, game.events.length));
}

function getSectorFlowPosition(stop: SectorFlowStop) {
  const index = sectorFlowStops.findIndex((candidate) => candidate.id === stop);
  const safeIndex = Math.max(0, index);
  return ((safeIndex + 0.5) / sectorFlowStops.length) * 100;
}

function getSectorSpanLabel(game: SectorOracleState, target: SectorOracleTarget) {
  const passes = Math.max(1, target.index - game.currentIndex);
  const remains = Math.max(0, game.events.length - target.index);
  return `${passes} tape${passes === 1 ? "" : "s"} pass · ${remains} remain`;
}

function getSectorActionLabel(game: SectorOracleState, outcome: SectorOracleOutcome) {
  if (game.results.length === 0) {
    return "First allocation";
  }
  return outcome.switched ? "Rotate fund" : "No trade";
}

function getNearestSectorTargetIndex(game: SectorOracleState, progressPercent: number) {
  const minimumTargetIndex = Math.min(game.currentIndex + 1, game.events.length);
  const start = dateToUtcTime(sectorOracleStartDate);
  const end = dateToUtcTime(sectorOracleEndDate);
  const targetTime = start + ((end - start) * Math.max(0, Math.min(100, progressPercent))) / 100;
  let nearestIndex = minimumTargetIndex;
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (let index = minimumTargetIndex; index <= game.events.length; index += 1) {
    const distance = Math.abs(dateToUtcTime(getSectorTarget(game, index).date) - targetTime);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return nearestIndex;
}

function getSectorDateProgressPercent(date: string) {
  const start = dateToUtcTime(sectorOracleStartDate);
  const end = dateToUtcTime(sectorOracleEndDate);
  const current = dateToUtcTime(date);
  return ((current - start) / Math.max(1, end - start)) * 100;
}

function getSectorYearTicks() {
  const startYear = Number(sectorOracleStartDate.slice(0, 4));
  const endYear = Number(sectorOracleEndDate.slice(0, 4));
  const ticks: Array<{ label: string; progress: number }> = [];

  for (let year = startYear; year <= endYear; year += 5) {
    const tickDate = year === startYear ? sectorOracleStartDate : `${year}-01-01`;
    ticks.push({ label: String(year), progress: getSectorDateProgressPercent(tickDate) });
  }

  if (ticks.at(-1)?.label !== String(endYear)) {
    ticks.push({ label: String(endYear), progress: 100 });
  }

  return ticks;
}

function useSectorHeadlineImage(event: SectorOracleEvent | undefined) {
  const [imageState, setImageState] = useState<{
    eventId: string | null;
    image: HeadlineImageAsset | null;
    status: "empty" | "loading" | "ready";
  }>({ eventId: null, image: null, status: "empty" });

  const cached = event && sectorHeadlineImageCache.has(event.id) ? (sectorHeadlineImageCache.get(event.id) ?? null) : undefined;
  const visibleState = !event
    ? { image: null, status: "empty" as const }
    : cached !== undefined
      ? { image: cached, status: cached ? ("ready" as const) : ("empty" as const) }
      : imageState.eventId === event.id
        ? imageState
        : { image: null, status: "loading" as const };

  useEffect(() => {
    if (!event || sectorHeadlineImageCache.has(event.id)) {
      return;
    }

    const controller = new AbortController();
    const lookupEvent = {
      deck: event.deck,
      era: event.era,
      headline: event.headline,
      id: event.id,
      date: event.date,
    } as Parameters<typeof fetchHeadlineImage>[0];

    fetchHeadlineImage(lookupEvent, controller.signal)
      .then((image) => {
        sectorHeadlineImageCache.set(event.id, image);
        setImageState({ eventId: event.id, image, status: image ? "ready" : "empty" });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          sectorHeadlineImageCache.set(event.id, null);
          setImageState({ eventId: event.id, image: null, status: "empty" });
        }
      });

    return () => controller.abort();
  }, [event]);

  return visibleState;
}

function getSectorBenchmarkRows(game: SectorOracleState): SectorBenchmarkRaceRow[] {
  return [
    { id: "player", label: "You", value: game.bankroll, note: "Your sector calls after tax" },
    { id: "index", label: "Index", value: game.indexBenchmark, note: "Broad market benchmark" },
    { id: "balanced", label: "Balanced", value: game.balancedBenchmark, note: "Always diversified" },
    { id: "tech", label: "Always Tech", value: game.techBenchmark, note: "Never leaves technology" },
    { id: "bonds", label: "Always Bonds", value: game.bondsBenchmark, note: "Always defensive" },
    { id: "oracle", label: "Perfect Oracle", value: game.perfectOracle, note: "Best sector each tape" },
  ];
}

function getSectorReelEntries(game: SectorOracleState, result: SectorOracleResult): SectorReelEntry[] {
  const entries: SectorReelEntry[] = [];
  for (let index = game.currentIndex + 1; index <= result.targetIndex; index += 1) {
    const target = getSectorTarget(game, index);
    entries.push({
      date: target.date,
      headline: getTargetHeadline(target),
      isCurrent: false,
      isFinal: target.isFinal,
      isMajor: target.event?.major ?? false,
    });
  }
  return entries;
}

function buildSectorReelChartPoints(game: SectorOracleState, result: SectorOracleResult): SectorReelChartPoint[] {
  const points: SectorReelChartPoint[] = [{ date: result.event.date, value: result.startingBankroll }];
  let value = result.startingBankroll;
  const endIndex = Math.min(result.targetIndex, game.events.length);

  for (let index = game.currentIndex; index < endIndex; index += 1) {
    const event = game.events[index];
    value *= 1 + getSectorIntervalReturn(event, result.choice) / 100;
    const nextDate = index + 1 < game.events.length ? game.events[index + 1].date : sectorOracleEndDate;
    points.push({ date: nextDate, value });
  }

  if (points.length > 0) {
    points[points.length - 1] = { date: result.target.date, value: result.endingBankroll };
  }

  return points;
}

function createSectorReelTransition(game: SectorOracleState, advanced: SectorOracleState, result: SectorOracleResult): SectorReelTransition {
  const balanceDelta = result.endingBankroll - result.startingBankroll;
  const balanceReturnPercent = result.startingBankroll > 0 ? (balanceDelta / result.startingBankroll) * 100 : 0;
  return {
    balanceDelta,
    balanceReturnPercent,
    benchmarkRows: getSectorBenchmarkRows(advanced),
    chartPoints: buildSectorReelChartPoints(game, result),
    choice: result.choice,
    choiceLabel: sectorChoiceLabels[result.choice],
    entries: getSectorReelEntries(game, result),
    fromBalance: result.startingBankroll,
    fromDate: result.event.date,
    fromHeadline: result.event.headline,
    fromProgress: getSectorProgressPercent(game, game.currentIndex),
    targetBalance: result.endingBankroll,
    targetDate: result.target.date,
    targetHeadline: getTargetHeadline(result.target),
    targetProgress: getSectorProgressPercent(game, result.targetIndex),
    tax: result.tax,
  };
}

function SectorOracleIntro({ onBegin }: { onBegin: () => void }) {
  return (
    <main className="sector-oracle-shell intro">
      <section className="sector-oracle-intro-panel">
        <div className="sector-oracle-device" aria-hidden="true">
          <Telescope size={54} />
          <span>ORACLE TAPE</span>
          <i />
        </div>
        <div className="sector-oracle-intro-copy">
          <p className="sector-oracle-kicker">Charged Alpha sector game</p>
          <h1>{sectorOracleTitle}</h1>
          <p>
            You inherit a brass ticker that prints future market headlines. It never names the winning sector. Your job is to decide who benefits before the next headline arrives.
          </p>
          <div className="sector-oracle-rules">
            <span><Newspaper size={15} /> Pick a future headline</span>
            <span><WalletCards size={15} /> Choose one sector</span>
            <span><BadgeDollarSign size={15} /> Switching can trigger 15% tax</span>
            <span><Trophy size={15} /> Beat simple benchmarks</span>
          </div>
          <button className="sector-oracle-primary" type="button" onClick={onBegin}>
            Open the ticker
            <ChevronRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}

function SectorTimelineRail({ game, onSelectTarget }: { game: SectorOracleState; onSelectTarget: (index: number) => void }) {
  const activeTimelinePointerRef = useRef<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const target = getSelectedSectorTarget(game);
  const currentEvent = getCurrentSectorEvent(game);
  const currentProgress = getSectorProgressPercent(game);
  const targetProgress = getSectorProgressPercent(game, target.index);
  const jumpWidth = Math.max(0, targetProgress - currentProgress);
  const ticks = useMemo(() => getSectorYearTicks(), []);
  const style = {
    "--oracle-current-progress": `${currentProgress}%`,
    "--oracle-target-progress": `${targetProgress}%`,
    "--oracle-jump-width": `${jumpWidth}%`,
  } as CSSProperties;
  const selectFromClientX = (clientX: number, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const clickedProgress = ((clientX - rect.left) / rect.width) * 100;
    onSelectTarget(getNearestSectorTargetIndex(game, clickedProgress));
  };
  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    activeTimelinePointerRef.current = event.pointerId;
    setIsScrubbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    selectFromClientX(event.clientX, event.currentTarget);
  };
  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTimelinePointerRef.current !== event.pointerId) {
      return;
    }
    event.preventDefault();
    selectFromClientX(event.clientX, event.currentTarget);
  };
  const finishPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activeTimelinePointerRef.current !== event.pointerId) {
      return;
    }
    activeTimelinePointerRef.current = null;
    setIsScrubbing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onSelectTarget(clampSectorTargetIndex(game, game.selectedTargetIndex - 1));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onSelectTarget(clampSectorTargetIndex(game, game.selectedTargetIndex + 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelectTarget(clampSectorTargetIndex(game, game.currentIndex + 1));
    } else if (event.key === "End") {
      event.preventDefault();
      onSelectTarget(game.events.length);
    }
  };

  return (
    <section className="sector-oracle-timeline-rail" aria-label="Sector Oracle timeline" style={style} data-guide-target="sector-timeline">
      <div className="sector-oracle-timeline-context">
        <strong>{currentEvent.era}</strong>
        <span>{formatSectorDate(currentEvent.date)} to {formatSectorDate(target.date)}</span>
      </div>
      <div
        className={`sector-oracle-timeline-track ${isScrubbing ? "scrubbing" : ""}`}
        role="slider"
        tabIndex={0}
        aria-label="Choose the next future headline"
        aria-valuemin={Math.round(currentProgress)}
        aria-valuemax={100}
        aria-valuenow={Math.round(targetProgress)}
        aria-valuetext={getSectorSpanLabel(game, target)}
        onKeyDown={handleKeyDown}
        onLostPointerCapture={() => {
          activeTimelinePointerRef.current = null;
          setIsScrubbing(false);
        }}
        onPointerCancel={finishPointer}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
      >
        <span className="sector-oracle-progress-endcap start">{sectorOracleStartDate.slice(0, 4)}</span>
        <span className="sector-oracle-progress-endcap end">{sectorOracleEndDate.slice(0, 4)}</span>
        <i className="sector-oracle-timeline-base" />
        <i className="sector-oracle-timeline-jump" />
        {ticks.map((tick) => (
          <b key={tick.label} className="sector-oracle-year-tick" style={{ "--tick-progress": `${tick.progress}%` } as CSSProperties}>
            {tick.label}
          </b>
        ))}
        <span className="sector-oracle-current-pin"><Sparkles size={13} /></span>
        <span className="sector-oracle-target-pin"><ChevronRight size={13} /></span>
      </div>
    </section>
  );
}

function SectorAllocationStrip({
  game,
  onChoose,
  outcomes,
}: {
  game: SectorOracleState;
  onChoose: (choice: SectorChoice) => void;
  outcomes: Record<SectorChoice, SectorOracleOutcome>;
}) {
  const previousChoice = game.results.at(-1)?.choice ?? "balanced";
  const bestChoice = getBestChoice(outcomes);

  return (
    <div className="sector-oracle-allocation-strip" aria-label="Choose sector allocation" data-guide-target="sector-allocation">
      {sectorChoiceOrder.map((choice) => {
        const Icon = sectorIcons[choice];
        const outcome = outcomes[choice];
        const tone = getOutcomeTone(outcome.returnPercent);
        const alpha = Math.min(0.72, 0.12 + Math.abs(outcome.returnPercent) / 95);
        const active = game.choice === choice;
        const previous = game.results.length > 0 && previousChoice === choice;
        return (
          <button
            key={choice}
            className={`sector-oracle-allocation-choice ${choice} ${tone} ${active ? "active" : ""} ${previous ? "previous-choice" : ""} ${choice === bestChoice ? "best" : ""} ${outcome.tax > 0 ? "has-tax" : ""}`}
            style={{ "--sector-heat": alpha } as CSSProperties}
            type="button"
            aria-pressed={active}
            aria-label={`${sectorChoiceLabels[choice]} projects ${formatSectorMoney(outcome.endingBankroll)} with ${formatSectorMoney(outcome.tax)} tax`}
            title={sectorChoiceDescriptions[choice]}
            onClick={() => onChoose(choice)}
          >
            <Icon size={16} aria-hidden="true" />
            <strong>{sectorChoiceShortLabels[choice]}</strong>
            <span>{formatSectorMoneyCompact(outcome.endingBankroll)}</span>
            <em>{outcome.tax > 0 ? `Tax ${formatSectorMoneyCompact(outcome.tax)}` : previous ? "No trade" : "No tax"}</em>
          </button>
        );
      })}
    </div>
  );
}

function SectorSelectedAllocationBanner({
  game,
  outcome,
  pulseKey,
}: {
  game: SectorOracleState;
  outcome: SectorOracleOutcome;
  pulseKey: number;
}) {
  const previousChoice = game.results.at(-1)?.choice ?? "balanced";
  const sourceChoice = game.results.length === 0 ? game.choice : previousChoice;
  const destinationChoice = game.choice;
  const isHolding = !outcome.switched || sourceChoice === destinationChoice;
  const visibleTax = outcome.tax > 0.5;
  const selectedTone = getOutcomeTone(outcome.returnPercent);
  const actionLabel = getSectorActionLabel(game, outcome);
  const style = {
    "--bill-from": `${getSectorFlowPosition(sourceChoice)}%`,
    "--bill-to": `${getSectorFlowPosition(destinationChoice)}%`,
    "--tax-to": `${getSectorFlowPosition("tax")}%`,
  } as CSSProperties;

  return (
    <aside
      key={`sector-selected-allocation-${pulseKey}`}
      className={`sector-oracle-selected-allocation ${selectedTone} ${visibleTax ? "has-tax" : "no-tax"} ${pulseKey > 0 ? "is-pulsing" : ""} ${isHolding ? "is-holding" : "is-moving"}`}
      aria-label={`${actionLabel}: ${sectorChoiceLabels[destinationChoice]}, ${formatSectorMoney(outcome.startingBankroll)} invested, ${formatSectorMoney(outcome.tax)} tax, projected ${formatSectorMoney(outcome.endingBankroll)}.`}
      style={style}
    >
      <div className="sector-oracle-flow-stops" aria-hidden="true">
        {sectorFlowStops.map((stop) => {
          const Icon = stop.id === "tax" ? BadgeDollarSign : sectorIcons[stop.id];
          const isSource = stop.id === sourceChoice;
          const isDestination = stop.id === destinationChoice;
          const isTaxStop = stop.id === "tax";
          return (
            <span
              key={stop.id}
              className={`sector-oracle-flow-stop ${stop.tone} ${isSource ? "source" : ""} ${isDestination ? "destination" : ""} ${isTaxStop && visibleTax ? "tax-active" : ""}`}
            >
              <i>{isTaxStop ? <b>IRS</b> : <Icon size={14} />}</i>
              <em>{stop.label}</em>
            </span>
          );
        })}
        <b className="sector-oracle-dollar-bill main-bill">
          <span>$</span>
          <strong>{formatSectorMoneyCompact(outcome.startingBankroll)}</strong>
        </b>
        {visibleTax && (
          <b className="sector-oracle-dollar-bill tax-bill">
            <span>$</span>
            <strong>{formatSectorMoneyCompact(outcome.tax)}</strong>
          </b>
        )}
      </div>
      <div className="sector-oracle-allocation-copy">
        <span>{actionLabel} · {sectorChoiceLabels[destinationChoice]}</span>
        <strong>
          In {formatSectorMoneyCompact(outcome.startingBankroll)} · End {formatSectorMoneyCompact(outcome.endingBankroll)} · Tax {formatSectorMoneyCompact(outcome.tax)}
        </strong>
      </div>
    </aside>
  );
}

function SectorHeadlineSelector({
  game,
  onChoose,
  onPlay,
  onSelectTarget,
}: {
  game: SectorOracleState;
  onChoose: (choice: SectorChoice) => void;
  onPlay: () => void;
  onSelectTarget: (index: number) => void;
}) {
  const dragStartRef = useRef<{ moved: boolean; selectedIndex: number; targetIndex: number | null; y: number } | null>(null);
  const ignoreClickRef = useRef(false);
  const previousSelectionRef = useRef(`${game.selectedTargetIndex}-${game.choice}`);
  const [isSpinning, setIsSpinning] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const selectedIndex = clampSectorTargetIndex(game, game.selectedTargetIndex);
  const target = getSectorTarget(game, selectedIndex);
  const outcomes = getProjectedSectorOutcomes(game);
  const selectedOutcome = outcomes[game.choice];
  const selectedTone = getOutcomeTone(selectedOutcome.returnPercent);
  const canMoveEarlier = selectedIndex > Math.min(game.currentIndex + 1, game.events.length);
  const canMoveLater = selectedIndex < game.events.length;
  const firstVisibleDeckIndex = game.currentIndex + Math.max(0, selectedIndex - game.currentIndex - 1);
  const lastVisibleDeckIndex = firstVisibleDeckIndex + 3;
  const headlineDeck = Array.from({ length: game.events.length - game.currentIndex + 1 }, (_, offset) => {
    const index = game.currentIndex + offset;
    const deckTarget = getSectorTarget(game, index);
    const isCurrent = index === game.currentIndex;
    const isSelected = index === selectedIndex;
    const statusParts = [isCurrent ? "Current tape" : isSelected ? "Selected jump" : deckTarget.isFinal ? "Final tape" : "Future tape"];
    if (deckTarget.event?.major) {
      statusParts.push("major sector shock");
    }
    return {
      date: deckTarget.date,
      headline: getTargetHeadline(deckTarget),
      index,
      isCurrent,
      isFinal: deckTarget.isFinal,
      isMajor: deckTarget.event?.major ?? false,
      isSelected,
      status: statusParts.join(" · "),
    };
  });
  const headlineShift = Math.max(0, selectedIndex - game.currentIndex - 1) * -1;

  useEffect(() => {
    const signature = `${game.selectedTargetIndex}-${game.choice}`;
    if (previousSelectionRef.current !== signature) {
      previousSelectionRef.current = signature;
      const frame = window.requestAnimationFrame(() => {
        setPulseKey((current) => current + 1);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [game.choice, game.selectedTargetIndex]);

  const selectRelativeTarget = (direction: -1 | 1) => {
    const nextIndex = clampSectorTargetIndex(game, selectedIndex + direction);
    if (nextIndex !== selectedIndex) {
      onSelectTarget(nextIndex);
    }
  };
  const startSpin = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.focus({ preventScroll: true });
    const headlineCard = event.target instanceof HTMLElement ? event.target.closest<HTMLButtonElement>(".sector-oracle-headline-card-button") : null;
    const headlineIndex = Number(headlineCard?.dataset.headlineIndex);
    const targetIndex = Number.isFinite(headlineIndex) ? clampSectorTargetIndex(game, headlineIndex) : null;
    dragStartRef.current = { moved: false, selectedIndex, targetIndex, y: event.clientY };
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
    const nextIndex = clampSectorTargetIndex(game, dragStart.selectedIndex + Math.round(deltaY / 42));
    if (nextIndex !== selectedIndex) {
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
    } else if (dragStart && dragStart.targetIndex !== null && dragStart.targetIndex > game.currentIndex) {
      onSelectTarget(dragStart.targetIndex);
    }
    dragStartRef.current = null;
    setIsSpinning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };
  const handleWheel = (event: ReactWheelEvent<HTMLElement>) => {
    if (Math.abs(event.deltaY) < 6) {
      return;
    }
    event.preventDefault();
    selectRelativeTarget(event.deltaY > 0 ? 1 : -1);
  };
  const handleDeckKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      selectRelativeTarget(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      selectRelativeTarget(1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      onPlay();
    }
  };
  const spinHandlers = {
    onPointerCancel: stopSpin,
    onPointerDown: startSpin,
    onPointerMove: moveSpin,
    onPointerUp: stopSpin,
    onWheel: handleWheel,
  };

  return (
    <section className="sector-oracle-decision-console" aria-label="Sector Oracle decision console">
      <SectorTimelineRail game={game} onSelectTarget={onSelectTarget} />
      <div className="sector-oracle-console-controls">
        <div className="sector-oracle-selected-date-chip" aria-live="polite">
          <span>{target.isFinal ? "Final tape selected" : "Selected future headline"}</span>
          <strong>{formatSectorDateWithWeekday(target.date)}</strong>
          <em>{getSectorSpanLabel(game, target)}</em>
        </div>

        <div className="sector-oracle-headline-stepper" aria-label="Cycle future headlines">
          <button type="button" onClick={() => selectRelativeTarget(-1)} disabled={!canMoveEarlier} aria-label="Previous future headline">
            <ChevronUp size={18} />
          </button>
          <span aria-hidden="true" />
          <button type="button" onClick={() => selectRelativeTarget(1)} disabled={!canMoveLater} aria-label="Next future headline">
            <ChevronDown size={18} />
          </button>
        </div>

        <div className="sector-oracle-play-stack">
          <button
            key={`sector-play-${pulseKey}`}
            className={`sector-oracle-primary sector-oracle-date-advance ${pulseKey > 0 ? "is-pulsing" : ""}`}
            type="button"
            onClick={onPlay}
            data-guide-target="sector-play"
          >
            <Play size={18} />
            <span>Play</span>
            <small>{sectorChoiceShortLabels[game.choice]} · {formatSectorMoneyCompact(selectedOutcome.startingBankroll)}</small>
          </button>
          <em className={selectedTone}>{formatSectorPercent(selectedOutcome.returnPercent)}</em>
        </div>
      </div>

      <SectorAllocationStrip game={game} onChoose={onChoose} outcomes={outcomes} />
      <SectorSelectedAllocationBanner game={game} outcome={selectedOutcome} pulseKey={pulseKey} />

      <article className="sector-oracle-headline-pop" aria-label="Scrollable future headline selector" data-guide-target="sector-headline">
        <div className="sector-oracle-deck-kicker">
          <span>{target.isFinal ? "Final tape" : `Future tape ${selectedIndex + 1} of ${game.events.length}`}</span>
          <em>{getSectorSpanLabel(game, target)}</em>
        </div>
        <div
          className={`sector-oracle-headline-deck ${isSpinning ? "spinning" : ""}`}
          style={{ "--headline-shift": headlineShift } as CSSProperties}
          aria-keyshortcuts="ArrowUp ArrowDown Enter"
          tabIndex={0}
          onKeyDown={handleDeckKeyDown}
          {...spinHandlers}
        >
          <div className="sector-oracle-headline-track">
            {headlineDeck.map((entry) => (
              <button
                key={`${entry.index}-${entry.date}`}
                className={`sector-oracle-headline-card-button ${entry.isCurrent ? "current" : ""} ${entry.isSelected ? "selected" : ""} ${entry.isMajor ? "major" : ""} ${entry.isFinal ? "final" : ""}`}
                type="button"
                aria-label={`${formatSectorDateWithWeekday(entry.date)} ${entry.headline}`}
                data-headline-index={entry.index}
                disabled={entry.isCurrent}
                tabIndex={entry.index >= firstVisibleDeckIndex && entry.index <= lastVisibleDeckIndex ? undefined : -1}
                aria-hidden={entry.index < firstVisibleDeckIndex || entry.index > lastVisibleDeckIndex}
                onClick={() => {
                  if (ignoreClickRef.current || entry.isCurrent) {
                    return;
                  }
                  onSelectTarget(entry.index);
                }}
              >
                <strong className={entry.isSelected ? "marquee" : ""}>
                  {entry.isSelected ? (
                    <span className="sector-oracle-headline-marquee-track" aria-hidden="true">
                      <span>{entry.headline}</span>
                      <span>{entry.headline}</span>
                    </span>
                  ) : (
                    <span className="sector-oracle-headline-text">{entry.headline}</span>
                  )}
                </strong>
                <em aria-hidden="true">{entry.status}</em>
              </button>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}

function getSectorArticlePreviewParagraphs(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+(?:["']|$)?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];

  if (sentences.length >= 2) {
    return [sentences[0], sentences.slice(1).join(" ")];
  }

  const [lead, followup] = text.split(/;\s+|:\s+/);

  if (lead && followup) {
    return [`${lead.trim()}.`, followup.trim()];
  }

  return [text.trim()];
}

function SectorHeadlinePreview({ game }: { game: SectorOracleState }) {
  const currentEvent = getCurrentSectorEvent(game);
  const target = getSelectedSectorTarget(game);
  const outcomes = getProjectedSectorOutcomes(game);
  const selected = outcomes[game.choice];
  const lastResult = game.results.at(-1);
  const selectedTone = getOutcomeTone(selected.returnPercent);
  const { image, status: imageStatus } = useSectorHeadlineImage(target.event);
  const article = target.event?.article;
  const imageStyle = image ? ({ "--sector-headline-image": `url("${image.url}")` } as CSSProperties) : undefined;
  const articleParagraphs = getSectorArticlePreviewParagraphs(article?.lede ?? getTargetDeck(target));

  return (
    <article className={`sector-oracle-selected-page ${image ? "has-image" : `image-${imageStatus}`}`} style={imageStyle}>
      <div className="sector-oracle-masthead mini">
        <span>{target.isFinal ? "Final tape" : target.label}</span>
        {article ? (
          <a className="sector-oracle-source-chip" href={article.url} target="_blank" rel="noreferrer" title={article.title}>
            {article.source}
          </a>
        ) : (
          <b>{target.event?.major ? "Major Sector Shock" : target.isFinal ? "Final Tape" : "Selected Headline"}</b>
        )}
      </div>
      <h1>{getTargetHeadline(target)}</h1>
      <div className="sector-oracle-front-date">{formatSectorDateWithWeekday(target.date)}</div>
      <div className="sector-oracle-article-lede">
        {articleParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="sector-oracle-current-tape">
        <span>Current tape · {formatSectorDate(currentEvent.date)}</span>
        <strong>{currentEvent.headline}</strong>
      </div>
      {lastResult && (
        <div className={`sector-oracle-arrival-summary ${getOutcomeTone(lastResult.profit)}`}>
          <span>Previous jump</span>
          <strong>{sectorChoiceLabels[lastResult.choice]} {formatMoneyDelta(lastResult.profit)}</strong>
        </div>
      )}
      <div className={`sector-oracle-preview-ticket ${selectedTone}`}>
        <span>{sectorChoiceLabels[game.choice]}</span>
        <strong>{formatSectorMoneyCompact(selected.endingBankroll)}</strong>
        <em>{selected.tax > 0 ? `${formatSectorMoneyCompact(selected.tax)} tax` : "No tax drag"}</em>
      </div>
      {image && (
        <a className="sector-oracle-image-credit" href={image.pageUrl} target="_blank" rel="noreferrer">
          Image: {image.title}
        </a>
      )}
    </article>
  );
}

function SectorLedgerBenchmarks({ game }: { game: SectorOracleState }) {
  const rows = getSectorBenchmarkRows(game);
  const max = Math.max(...rows.map((row) => row.value), sectorOracleStartingBankroll);
  const iconMap: Record<string, typeof Sparkles> = {
    player: Sparkles,
    index: ChartNoAxesCombined,
    balanced: Scale,
    tech: Cpu,
    bonds: Shield,
    oracle: Trophy,
  };

  return (
    <section className="sector-oracle-ledger-benchmarks" aria-label="Benchmark scoreboard">
      <header>
        <span>Benchmark Desk</span>
        <strong>{game.results.length} jump{game.results.length === 1 ? "" : "s"} played</strong>
      </header>
      <div className="sector-oracle-ledger-benchmark-grid">
        {rows.map((row) => {
          const Icon = iconMap[row.id] ?? BarChart3;
          return (
            <article key={row.id} className={row.id}>
              <span><Icon size={13} /> {row.label}</span>
              <strong>{formatSectorMoneyCompact(row.value)}</strong>
              <em>{row.note}</em>
              <i style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getSectorReelChartRange(points: SectorReelChartPoint[]) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getSectorReelChartCoordinate(
  point: SectorReelChartPoint,
  points: SectorReelChartPoint[],
  range: { min: number; max: number },
  width: number,
  height: number,
) {
  const start = dateToUtcTime(points[0]?.date ?? point.date);
  const end = dateToUtcTime(points.at(-1)?.date ?? point.date);
  const current = dateToUtcTime(point.date);
  const x = end > start ? ((current - start) / (end - start)) * width : 0;
  const y = height - ((point.value - range.min) / Math.max(1, range.max - range.min)) * height;
  return { x, y };
}

function buildSectorReelValuePath(points: SectorReelChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  return points
    .map((point, index) => {
      const { x, y } = getSectorReelChartCoordinate(point, points, range, width, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildSectorReelAreaPath(points: SectorReelChartPoint[], range: { min: number; max: number }, width: number, height: number) {
  const line = buildSectorReelValuePath(points, range, width, height);
  if (!line) {
    return "";
  }
  const first = getSectorReelChartCoordinate(points[0], points, range, width, height);
  const last = getSectorReelChartCoordinate(points.at(-1) ?? points[0], points, range, width, height);
  return `${line} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

function getSectorReelChartTicks(points: SectorReelChartPoint[], maximumTicks = 5) {
  if (points.length <= maximumTicks) {
    return points;
  }
  return Array.from({ length: maximumTicks }, (_, index) => points[Math.round((index / (maximumTicks - 1)) * (points.length - 1))]);
}

function SectorReelValueChart({ transition }: { transition: SectorReelTransition }) {
  const points = transition.chartPoints.length > 0 ? transition.chartPoints : [{ date: transition.fromDate, value: transition.fromBalance }];
  const width = 420;
  const height = 148;
  const range = getSectorReelChartRange(points);
  const path = buildSectorReelValuePath(points, range, width, height);
  const areaPath = buildSectorReelAreaPath(points, range, width, height);
  const ticks = getSectorReelChartTicks(points);
  const tone = transition.balanceDelta > 0 ? "gain" : transition.balanceDelta < 0 ? "loss" : "flat";

  return (
    <section className={`sector-oracle-reel-chart ${tone}`} aria-label={`Portfolio chart from ${formatSectorDateWithWeekday(transition.fromDate)} to ${formatSectorDateWithWeekday(transition.targetDate)}`}>
      <header>
        <span>Portfolio jump</span>
        <strong>{formatMoneyDelta(transition.balanceDelta)}</strong>
        <em>{formatSectorPercent(transition.balanceReturnPercent)}</em>
        <small>
          {formatSectorMoney(transition.fromBalance)} to {formatSectorMoney(transition.targetBalance)}
        </small>
      </header>
      <div className="sector-oracle-reel-chart-plot">
        <div className="sector-oracle-reel-y-axis" aria-hidden="true">
          <span>{formatSectorMoneyCompact(range.max)}</span>
          <span>{formatSectorMoneyCompact((range.max + range.min) / 2)}</span>
          <span>{formatSectorMoneyCompact(range.min)}</span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Animated portfolio value line chart for this sector jump">
          <path className="sector-oracle-reel-chart-gridline" d={`M 0 ${height * 0.2} H ${width}`} />
          <path className="sector-oracle-reel-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
          <path className="sector-oracle-reel-chart-gridline" d={`M 0 ${height * 0.8} H ${width}`} />
          {areaPath && <path className="sector-oracle-reel-chart-area" d={areaPath} />}
          {path && <path className="sector-oracle-reel-chart-line" d={path} pathLength={1} />}
          {points.map((point, index) => {
            const { x, y } = getSectorReelChartCoordinate(point, points, range, width, height);
            const progress = points.length > 1 ? index / (points.length - 1) : 1;
            return (
              <circle
                key={`${point.date}-${index}`}
                className="sector-oracle-reel-chart-dot"
                cx={x.toFixed(2)}
                cy={y.toFixed(2)}
                r={index === 0 || index === points.length - 1 ? 3 : 1.8}
                style={{ "--dot-delay": `${Math.round(220 + progress * 2600)}ms` } as CSSProperties}
              />
            );
          })}
        </svg>
        <span className="sector-oracle-reel-chart-scan" aria-hidden="true" />
      </div>
      <footer>
        {ticks.map((point) => (
          <span key={point.date}>{formatSectorYear(point.date)}</span>
        ))}
      </footer>
    </section>
  );
}

function SectorReelBenchmarkRace({ transition }: { transition: SectorReelTransition }) {
  const max = Math.max(...transition.benchmarkRows.map((row) => row.value), sectorOracleStartingBankroll);
  const player = transition.benchmarkRows.find((row) => row.id === "player")?.value ?? transition.targetBalance;
  const index = transition.benchmarkRows.find((row) => row.id === "index")?.value ?? sectorOracleStartingBankroll;
  const vsIndex = player - index;

  return (
    <aside className="sector-oracle-reel-metrics" aria-label="Benchmark comparison after this jump">
      <header>
        <span>Split Screen</span>
        <strong>{transition.choiceLabel}</strong>
      </header>
      <div className="sector-oracle-reel-stat-grid">
        <span>
          <em>Tax paid</em>
          <strong>{formatSectorMoneyCompact(transition.tax)}</strong>
        </span>
        <span>
          <em>Vs index</em>
          <strong className={vsIndex >= 0 ? "positive" : "negative"}>{formatMoneyDelta(vsIndex)}</strong>
        </span>
      </div>
      <div className="sector-oracle-reel-race">
        {transition.benchmarkRows.map((row) => (
          <article key={row.id} className={row.id}>
            <div>
              <span>{row.label}</span>
              <small>{row.note}</small>
            </div>
            <strong>{formatSectorMoneyCompact(row.value)}</strong>
            <i style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
          </article>
        ))}
      </div>
    </aside>
  );
}

function SectorOracleReelOverlay({ transition }: { transition: SectorReelTransition }) {
  const currentParts = getSectorDateParts(transition.fromDate);
  const landingParts = getSectorDateParts(transition.targetDate);
  const jumpWidth = Math.max(0, transition.targetProgress - transition.fromProgress);
  const tone = transition.balanceDelta > 0 ? "gain" : transition.balanceDelta < 0 ? "loss" : "flat";
  const frames = [
    {
      date: transition.fromDate,
      headline: transition.fromHeadline,
      isCurrent: true,
      isFinal: false,
      isMajor: false,
    },
    ...transition.entries,
  ];
  const style = {
    "--oracle-reel-start-progress": `${transition.fromProgress}%`,
    "--oracle-reel-target-progress": `${transition.targetProgress}%`,
    "--oracle-reel-jump-progress": `${jumpWidth}%`,
  } as CSSProperties;

  return (
    <div className="sector-oracle-reel-overlay" aria-live="polite" aria-label="Advancing Sector Oracle through time">
      <section className={`sector-oracle-reel-card ${tone}`} style={style}>
        <div className="sector-oracle-reel-head">
          <span>Oracle jump</span>
          <strong>{transition.choiceLabel}</strong>
        </div>
        <div className="sector-oracle-reel-split">
          <SectorReelValueChart transition={transition} />
          <SectorReelBenchmarkRace transition={transition} />
        </div>
        <div className="sector-oracle-reel-date" aria-label={`Ticker date spinning from ${formatSectorDateWithWeekday(transition.fromDate)} to ${formatSectorDateWithWeekday(transition.targetDate)}`}>
          {(["month", "day", "year"] as const).map((part) => (
            <div key={part} className={`sector-oracle-reel-date-window ${part}`}>
              <span>{part}</span>
              <strong className="sector-oracle-reel-date-current">{currentParts[part]}</strong>
              <i className="sector-oracle-reel-date-spin" aria-hidden="true" />
              <strong className="sector-oracle-reel-date-landing">{landingParts[part]}</strong>
            </div>
          ))}
        </div>
        <div className="sector-oracle-reel-headline-window" aria-hidden="true">
          <div className="sector-oracle-reel-headline-track">
            {frames.map((entry, index) => (
              <article key={`${entry.date}-${index}`} className={`sector-oracle-reel-headline ${entry.isCurrent ? "current" : ""} ${entry.isMajor ? "major" : ""} ${entry.isFinal ? "final" : ""}`}>
                <span>{formatSectorDate(entry.date)}</span>
                <strong>{entry.headline}</strong>
                <em>{entry.isCurrent ? "Current tape" : entry.isFinal ? "Final tape" : entry.isMajor ? "Major shock" : "Future tape"}</em>
              </article>
            ))}
          </div>
          <article className="sector-oracle-reel-landing">
            <span>{formatSectorDateWithWeekday(transition.targetDate)}</span>
            <strong>{transition.targetHeadline}</strong>
          </article>
        </div>
        <div className="sector-oracle-reel-timeline" aria-label={`Timeline advancing from ${formatSectorDate(transition.fromDate)} to ${formatSectorDate(transition.targetDate)}`}>
          <span>{formatSectorDate(transition.fromDate)}</span>
          <span>{formatSectorDate(transition.targetDate)}</span>
          <div className="sector-oracle-reel-track" aria-hidden="true">
            <i className="sector-oracle-reel-track-base" />
            <i className="sector-oracle-reel-track-jump" />
            <b className="sector-oracle-reel-pin"><Sparkles size={14} /></b>
          </div>
        </div>
      </section>
    </div>
  );
}

function LastMoveFlash({ result }: { result?: SectorOracleResult }) {
  if (!result) {
    return null;
  }
  const tone = getOutcomeTone(result.profit);
  return (
    <aside className={`sector-oracle-flash ${tone}`} aria-live="polite">
      <span>{sectorChoiceLabels[result.choice]} through {formatSectorDate(result.target.date)}</span>
      <strong>{formatMoneyDelta(result.profit)}</strong>
      <small>{result.tax > 0 ? `${formatSectorMoneyCompact(result.tax)} tax paid` : "No tax drag"}</small>
    </aside>
  );
}

function SectorOverlay({ game, overlay, onClose }: { game: SectorOracleState; overlay: Overlay; onClose: () => void }) {
  if (!overlay) {
    return null;
  }
  const last = game.results.at(-1);
  return (
    <div className="sector-oracle-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="sector-oracle-modal" role="dialog" aria-modal="true" aria-label={overlay === "ledger" ? "Sector ledger" : "Sector lesson"} onClick={(event) => event.stopPropagation()}>
        <header>
          <span>{overlay === "ledger" ? "Ledger" : "Lesson"}</span>
          <button type="button" onClick={onClose} aria-label="Close panel">Close</button>
        </header>
        {overlay === "ledger" ? (
          <div className="sector-oracle-ledger-list">
            <SectorLedgerBenchmarks game={game} />
            <section className="sector-oracle-ledger-history" aria-label="Played jumps">
              <header>
                <span>Played jumps</span>
                <strong>{game.results.length === 0 ? "No jumps yet" : `${game.results.length} recorded`}</strong>
              </header>
              {game.results.length === 0 ? <p>No jumps played yet.</p> : null}
              {game.results.map((result, index) => (
                <article key={`${result.event.id}-${index}`}>
                  <span>{formatSectorDate(result.event.date)} to {formatSectorDate(result.target.date)}</span>
                  <strong>{sectorChoiceLabels[result.choice]} {formatMoneyDelta(result.profit)}</strong>
                  <small>{result.event.headline} · {result.event.article.source}</small>
                </article>
              ))}
            </section>
          </div>
        ) : (
          <div className="sector-oracle-lesson-panel">
            <strong>{last ? sectorChoiceLabels[last.choice] : "Sector rotation"}</strong>
            <p>{last ? getLearningLine(last.choice, last.target, last) : "The game is about second-order thinking: a headline can be true while the best beneficiary is somewhere else."}</p>
            <small>Prototype return table is historically inspired and educational only. Not financial advice.</small>
          </div>
        )}
      </section>
    </div>
  );
}

function SectorOracleDashboard({
  game,
  onChoose,
  onOpenOverlay,
  onPlay,
  onReset,
  onSelectTarget,
}: {
  game: SectorOracleState;
  onChoose: (choice: SectorChoice) => void;
  onOpenOverlay: (overlay: Overlay) => void;
  onPlay: () => void;
  onReset: () => void;
  onSelectTarget: (index: number) => void;
}) {
  const lastResult = game.results.at(-1);
  const target = getSelectedSectorTarget(game);

  return (
    <main className="sector-oracle-shell choose">
      <LastMoveFlash result={lastResult} />
      <section className="sector-oracle-app">
        <header className="sector-oracle-topbar">
          <div>
            <span>{sectorOracleTitle}</span>
            <strong>{formatSectorMoney(game.bankroll)}</strong>
            <small>Page {Math.min(game.currentIndex + 1, game.events.length)} / {game.events.length} · target {formatSectorDate(target.date)}</small>
          </div>
          <button type="button" onClick={onReset} aria-label="Reset Sector Oracle">
            <RotateCcw size={16} />
          </button>
        </header>
        <div className="sector-oracle-one-screen">
          <SectorHeadlinePreview game={game} />
          <SectorHeadlineSelector game={game} onChoose={onChoose} onPlay={onPlay} onSelectTarget={onSelectTarget} />
        </div>
        <footer className="sector-oracle-bottom">
          <button type="button" onClick={() => onOpenOverlay("lesson")}>
            <BookOpen size={15} />
            Lesson
          </button>
          <button type="button" onClick={() => onOpenOverlay("ledger")}>
            <Newspaper size={15} />
            Ledger
          </button>
          <span>{sectorOracleStartDate.slice(0, 4)}-{sectorOracleEndDate.slice(0, 4)} sector prophecy</span>
        </footer>
      </section>
    </main>
  );
}

function SectorFinalScreen({ game, onReset }: { game: SectorOracleState; onReset: () => void }) {
  const gain = game.bankroll - sectorOracleStartingBankroll;
  const bestBenchmark = Math.max(game.indexBenchmark, game.balancedBenchmark, game.techBenchmark, game.bondsBenchmark);
  const verdict = game.bankroll >= bestBenchmark ? "Oracle Fund Champion" : game.bankroll >= game.indexBenchmark ? "Sector Rotation Winner" : "Headline Apprentice";
  const rows = [
    { label: "You", value: game.bankroll },
    { label: "Index", value: game.indexBenchmark },
    { label: "Balanced", value: game.balancedBenchmark },
    { label: "Always Tech", value: game.techBenchmark },
    { label: "Always Bonds", value: game.bondsBenchmark },
    { label: "Perfect Oracle", value: game.perfectOracle },
  ];

  return (
    <main className="sector-oracle-shell complete">
      <section className="sector-oracle-final">
        <p className="sector-oracle-kicker">{sectorOracleTitle}</p>
        <h1>{verdict}</h1>
        <div className="sector-oracle-final-score">
          <span>Final fund</span>
          <strong>{formatSectorMoney(game.bankroll)}</strong>
          <em className={gain >= 0 ? "positive" : "negative"}>{formatMoneyDelta(gain)}</em>
        </div>
        <div className="sector-oracle-final-grid">
          {rows.map((row) => (
            <article key={row.label} className={row.label === "You" ? "player" : ""}>
              <span>{row.label}</span>
              <strong>{formatSectorMoney(row.value)}</strong>
            </article>
          ))}
        </div>
        <p>
          The lesson: future headlines are not enough. Sector winners come from second-order effects, starting valuations, and whether the market already believed the story.
        </p>
        <button className="sector-oracle-primary" type="button" onClick={onReset}>
          Play again
          <RotateCcw size={18} />
        </button>
      </section>
    </main>
  );
}

export function SectorOracleGame() {
  const [game, setGame] = useState(createSectorOracle);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [reelTransition, setReelTransition] = useState<SectorReelTransition | null>(null);
  const reelTimerRef = useRef<number | null>(null);
  const pulseKey = useMemo(() => game.results.length, [game.results.length]);

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [game.phase]);

  useEffect(() => {
    return () => {
      if (reelTimerRef.current !== null) {
        window.clearTimeout(reelTimerRef.current);
      }
    };
  }, []);

  const clearReelTimer = () => {
    if (reelTimerRef.current !== null) {
      window.clearTimeout(reelTimerRef.current);
      reelTimerRef.current = null;
    }
  };
  const begin = () => setGame((current) => startSectorOracle(current));
  const reset = () => {
    clearReelTimer();
    setOverlay(null);
    setReelTransition(null);
    setGame(resetSectorOracle());
  };
  const choose = (choice: SectorChoice) => setGame((current) => setSectorChoice(current, choice));
  const selectTarget = (index: number) => setGame((current) => setSectorTargetIndex(current, index));
  const play = () => {
    if (reelTransition || game.phase !== "choose") {
      return;
    }

    const advanced = playSectorOracleRound(game);
    const result = advanced.results.at(-1);
    if (!result || advanced === game) {
      return;
    }

    clearReelTimer();
    setReelTransition(createSectorReelTransition(game, advanced, result));
    reelTimerRef.current = window.setTimeout(() => {
      setGame(advanced);
      setReelTransition(null);
      reelTimerRef.current = null;
    }, sectorReelDurationMs);
  };

  if (game.phase === "intro") {
    return <SectorOracleIntro onBegin={begin} />;
  }

  if (game.phase === "complete") {
    return <SectorFinalScreen game={game} onReset={reset} />;
  }

  return (
    <div className={`sector-oracle-run run-${pulseKey}`}>
      <SectorOracleDashboard
        game={game}
        onChoose={choose}
        onOpenOverlay={setOverlay}
        onPlay={play}
        onReset={reset}
        onSelectTarget={selectTarget}
      />
      {reelTransition && <SectorOracleReelOverlay transition={reelTransition} />}
      <SectorOverlay game={game} overlay={overlay} onClose={() => setOverlay(null)} />
    </div>
  );
}
