import {
  ChartCandlestick,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FastForward,
  Flame,
  Gauge,
  HandCoins,
  Landmark,
  Play,
  RotateCcw,
  Search,
  Shield,
  Target,
  XCircle,
  Zap,
} from "lucide-react";
import {
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  Fragment,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  chooseSprintAction,
  chargeSprintRound,
  buildLeaderboard,
  calculateFinalScore,
  createSprint,
  getLeaderboardRank,
  getSprintRank,
  heatLimit,
  expectationBarLabels,
  getSetBarScore,
  marketTapeBuckets,
  nextSprintRound,
  reportReadLabels,
  scoutSprintRound,
  selectSprintBar,
  startSprint,
  type ExpectationBar,
  type ReportRead,
  type SetBarCall,
  type SprintChoice,
  type SprintState,
} from "../games/alpha-arena/simulation/sprint";
import { trackGameEvent } from "../shared/analytics/events";
import { educationalDisclaimer, modelDisclaimer } from "../shared/compliance/copy";

const defaultSeed = "charged-alpha-sprint";
const tapeScramble =
  "ZXQ7 ALPHA FLOW BID ASK IVOL EPS TAPE PRINT FLOW VXQ9 CASH GUIDE HEAT QQQ2 ORDER BOOK ";

interface TooltipState {
  text: string;
  left: number;
  top: number;
  placement: "above" | "below";
  maxHeight: number;
}

const choiceMeta: Record<SprintChoice, { label: string; icon: typeof Zap; hint: string; score: string; heat: string }> = {
  back: {
    label: "Back It",
    icon: Zap,
    hint: "Full conviction",
    score: "Score: full + tape",
    heat: "Higher Heat",
  },
  hedge: {
    label: "Hedge",
    icon: Shield,
    hint: "Defined risk",
    score: "Score: reduced + tape",
    heat: "Lower Heat",
  },
  pass: {
    label: "Pass",
    icon: FastForward,
    hint: "Stay in cash",
    score: "Score: carry, no tape",
    heat: "0 Heat",
  },
};

const reportRows: ReportRead[] = ["strong", "mixed", "weak"];
const barColumns: ExpectationBar[] = ["low", "fair", "skyHigh"];

const reportReadHints: Record<ReportRead, string> = {
  strong: "EPS, revenue, margins, cash flow, and guidance mostly point up.",
  mixed: "The print has trade-offs. Some numbers work, others raise questions.",
  weak: "The report has enough cracks that buyers may not defend it.",
};

const expectationBarHints: Record<ExpectationBar, string> = {
  low: "Investors expected little. A decent report can surprise positively.",
  fair: "The stock needs a clean quarter, but not perfection.",
  skyHigh: "The whisper, valuation, or crowding means even a beat may not be enough.",
};

function currentScenario(state: SprintState) {
  return state.scenarios[state.roundIndex];
}

function signedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function signedPercent(value: number) {
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(1))}%`;
}

function setupScore(state: SprintState) {
  const activeScenario = currentScenario(state);
  return (
    activeScenario.report.earnings +
    activeScenario.report.guidance +
    activeScenario.report.quality +
    activeScenario.report.expectations
  );
}

function metricTooltip(metric: ReturnType<typeof currentScenario>["metrics"][number]) {
  return `${metric.label}: ${metric.value}\nTopic: ${metric.topic}.\n${metric.hint}`;
}

function barCallLabel(barCall: SetBarCall) {
  return `${reportReadLabels[barCall.report]} / ${expectationBarLabels[barCall.bar]}`;
}

function setupTooltip(state: SprintState) {
  const activeScenario = currentScenario(state);
  const actualScore = getSetBarScore(activeScenario.actualReport, activeScenario.actualBar);
  return `${activeScenario.company} historical case: ${activeScenario.caseLabel}. Source: ${activeScenario.sourceLabel}.\nActual Set The Bar cell = ${barCallLabel({ report: activeScenario.actualReport, bar: activeScenario.actualBar })}, worth ${signedNumber(actualScore)} before your accuracy bonus.\nBackground setup score = earnings ${signedNumber(activeScenario.report.earnings)} + guidance ${signedNumber(activeScenario.report.guidance)} + quality ${signedNumber(activeScenario.report.quality)} + expectations ${signedNumber(activeScenario.report.expectations)} = ${signedNumber(setupScore(state))}.`;
}

function setBarTooltip(state: SprintState, barCall: SetBarCall) {
  const activeScenario = currentScenario(state);
  const selectedScore = getSetBarScore(barCall.report, barCall.bar);
  const actualScore = getSetBarScore(activeScenario.actualReport, activeScenario.actualBar);
  const distance =
    Math.abs(reportRows.indexOf(barCall.report) - reportRows.indexOf(activeScenario.actualReport)) +
    Math.abs(barColumns.indexOf(barCall.bar) - barColumns.indexOf(activeScenario.actualBar));
  const accuracy = distance === 0 ? 3 : distance === 1 ? 1 : distance === 2 ? -1 : -3;
  return `${barCallLabel(barCall)}.\nCell score shown on board: ${signedNumber(selectedScore)}.\nAfter reveal, actual cell is scored against your call. This call's current accuracy bonus would be ${signedNumber(accuracy)} versus actual ${signedNumber(actualScore)}.\nBack It uses actual cell + accuracy, Hedge uses a smaller version, Pass rewards avoiding weak/high-bar setups plus carry.`;
}

function marketTapeTooltip(choice?: SprintChoice) {
  const chargedText = choice === "pass" ? "Charge does not apply to Pass." : "Charge adds 1 to any nonzero tape move for Back It or Hedge.";
  return `Market tape reveals the real post-earnings stock reaction for this historical case.\nBands: ${marketTapeBuckets}.\nScout subtracts 1 from the scoring impact of any nonzero tape move.\n${chargedText}\nPass shows market tape for context but applies 0 tape to alpha.`;
}

function heatTooltip(state: SprintState) {
  return `Heat limit: ${heatLimit}.\nBack It base Heat: 2 on a positive expected read, 4 on a negative expected read, +2 if Charged, +1 if tape is negative.\nHedge base Heat: 1 on a positive expected read, 2 on a negative expected read, +1 if Charged, +1 if negative tape leaves a loss.\nFinal Heat added = ceil(base Heat x (1 + current Heat / 10)). Current multiplier: x${(1 + state.risk / 10).toFixed(1)}.\nPass adds 0 Heat.`;
}

function actionTooltip(state: SprintState, choice: SprintChoice) {
  const activeScenario = currentScenario(state);
  const actualBarScore = getSetBarScore(activeScenario.actualReport, activeScenario.actualBar);
  const barLine = state.selectedBar
    ? `Current bar call: ${barCallLabel(state.selectedBar)}. Its visible cell score is ${signedNumber(getSetBarScore(state.selectedBar.report, state.selectedBar.bar))}.`
    : "Set The Bar first to lock the report row and expectation column.";

  if (choice === "back") {
    return `Back It expected read = actual cell score + bar accuracy bonus.\nActual cell score: ${signedNumber(actualBarScore)}.\n${barLine}\nCharge doubles this expected read.\nThen market tape applies unless you Pass.\n${heatTooltip(state)}`;
  }

  if (choice === "hedge") {
    return `Hedge expected read = round(actual cell x 0.45) + round(bar accuracy x 0.6).\nActual cell score: ${signedNumber(actualBarScore)}.\n${barLine}\nCharge doubles this expected read.\nThen market tape applies unless you Pass.\n${heatTooltip(state)}`;
  }

  return `Pass expected read = pass base + bar accuracy slice + carry.\nPass base: +2 if actual cell <= -2, -2 if actual cell >= +3, otherwise 0. Actual cell: ${signedNumber(actualBarScore)}.\nCarry = round(current alpha x 10%) = ${Math.max(0, Math.round(state.alpha * 0.1))}.\nMarket tape is shown but applies 0 because your alpha is out of market.\nPass adds 0 Heat.`;
}

function finalScoreTooltip(state: SprintState) {
  return `Final score = max(0, round(alpha x 12 - Heat x 10 + unused Scouts x 5 + unused Charges x 6)).\nCurrent: max(0, round(${state.alpha} x 12 - ${state.risk} x 10 + ${state.scoutsRemaining} x 5 + ${state.chargesRemaining} x 6)) = ${calculateFinalScore(state)}.`;
}

function resultTooltip(state: SprintState) {
  const result = state.currentResult;
  if (!result) {
    return "";
  }

  return `Round alpha = expected read ${signedNumber(result.expectedAlphaDelta)} + applied tape ${signedNumber(result.marketAppliedDelta)} = ${signedNumber(result.alphaDelta)}.\nBar call: ${barCallLabel(result.barCall)}. Selected cell ${signedNumber(result.selectedBarScore)}, actual cell ${signedNumber(result.actualBarScore)}, accuracy bonus ${signedNumber(result.barDelta)}.\nHistorical move was ${signedPercent(result.marketMovePercent)}; base tape ${signedNumber(result.baseMarketDelta)}, scoring tape ${signedNumber(result.marketDelta)}.\nMarket reason: ${result.marketReason}\nPass applies 0 market tape because alpha is not in market.\nHeat added: ${result.riskDelta}. Heat multiplier: x${result.riskMultiplier}.`;
}

function getRecommendedStrategy(scenario: ReturnType<typeof currentScenario>) {
  const metricText = scenario.metrics.map((metric) => `${metric.label} ${metric.value}`).join(" ");

  if (metricText.includes("Perfection") || metricText.includes("Extreme") || metricText.includes("Capex")) {
    return "Recommended read: high bar. Scout the hidden risk before backing a headline beat.";
  }
  if (metricText.includes("Data Center") || metricText.includes("AI Orders")) {
    return "Recommended read: forward AI demand is the key. Charge only if the guide also clears.";
  }
  if (metricText.includes("Mounjaro") || metricText.includes("Zepbound")) {
    return "Recommended read: product breadth matters. Scout to confirm the growth is not one-note.";
  }
  if (metricText.includes("Op. loss") || metricText.includes("Spend Risk")) {
    return "Recommended read: messy report, low bar. Scout whether the forward metric can outweigh losses.";
  }
  return "Recommended read: decide whether the quarter beat the stock's expectation bar, not just analyst EPS.";
}

function getPitMove(
  state: SprintState,
  pendingChoice: SprintChoice | undefined,
  isTapeRolling: boolean,
) {
  if (state.phase === "reveal") {
    return {
      label: "Move 5",
      title: "Settle the round",
      body: "Move the alpha chips, mark Heat, read why the tape moved, then draw the next stock card.",
    };
  }

  if (isTapeRolling) {
    return {
      label: "Move 4",
      title: "Tape is printing",
      body: "The ribbon is scrambling the market reaction. The result will settle in a moment.",
    };
  }

  if (pendingChoice) {
    return {
      label: "Move 4",
      title: "Click the market tape",
      body: `${choiceMeta[pendingChoice].label} is centered on the table. Click the glowing LED ribbon to end the round.`,
    };
  }

  if (!state.selectedBar) {
    return {
      label: "Move 1",
      title: "Set the bar",
      body: "Optional: play Scout and/or Charge first. Then click one grid cell where report quality meets the market bar.",
    };
  }

  return {
    label: "Move 2",
    title: "Play an action card",
    body: "Back It uses the full read, Hedge uses a smaller read, and Pass stays out of market. Tape is added only to Back It or Hedge.",
  };
}

function getPitSteps(state: SprintState, toolStageDone: boolean, pendingChoice: SprintChoice | undefined, isTapeRolling: boolean) {
  const hasBar = Boolean(state.selectedBar);
  const hasTool = state.scoutedRoundIds.includes(currentScenario(state).id) || state.chargedThisRound || toolStageDone;
  const hasAction = Boolean(pendingChoice) || state.phase === "reveal";
  const tapeStarted = isTapeRolling || state.phase === "reveal";

  return [
    { label: "Tools", status: hasBar || hasTool ? "complete" : "active" },
    { label: "Bar", status: hasBar ? "complete" : "active" },
    { label: "Action", status: !hasBar ? "locked" : hasAction ? "complete" : "active" },
    { label: "Tape", status: !pendingChoice && state.phase !== "reveal" ? "locked" : tapeStarted ? "complete" : "active" },
    { label: "Settle", status: state.phase === "reveal" ? "active" : "locked" },
  ];
}

function heatTone(risk: number) {
  if (risk >= heatLimit) {
    return "danger";
  }
  if (risk >= 8) {
    return "hot";
  }
  if (risk >= 4) {
    return "warm";
  }
  return "cool";
}

export function GameShell() {
  const [seed, setSeed] = useState(defaultSeed);
  const [game, setGame] = useState<SprintState>(() => createSprint(defaultSeed));
  const [activeTooltip, setActiveTooltip] = useState<TooltipState>();
  const [toolStageDone, setToolStageDone] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<SprintChoice>();
  const [isTapeRolling, setIsTapeRolling] = useState(false);
  const [tooltipSilencedUntil, setTooltipSilencedUntil] = useState(0);
  const tapeTimerRef = useRef<number | undefined>(undefined);

  const scenario = currentScenario(game);
  const roundLabel = `${game.roundIndex + 1}/${game.scenarios.length}`;
  const isScouted = game.scoutedRoundIds.includes(scenario.id);
  const finalScore = calculateFinalScore(game);
  const leaderboard = buildLeaderboard(game);
  const leaderboardRank = getLeaderboardRank(game);
  const recommendedStrategy = getRecommendedStrategy(scenario);
  const pitMove = getPitMove(game, pendingChoice, isTapeRolling);
  const pitSteps = getPitSteps(game, toolStageDone, pendingChoice, isTapeRolling);
  const selectedBarLabel = game.selectedBar ? barCallLabel(game.selectedBar) : "Place the chip";
  const tapeValue = game.currentResult ? signedNumber(game.currentResult.marketDelta) : "?";
  const tapeLabel = game.currentResult ? game.currentResult.marketLabel : pendingChoice ? "Click to print" : "Locked";
  const settledTapeText = game.currentResult
    ? `TAPE PRINT ${game.currentResult.marketLabel} ${signedNumber(game.currentResult.marketDelta)} / REAL MOVE ${signedPercent(game.currentResult.marketMovePercent)} / WHY ${game.currentResult.marketReason}`
    : "";
  const playedTools = [
    isScouted ? "Scout" : undefined,
    game.chargedThisRound ? "Charge" : undefined,
  ].filter(Boolean) as Array<"Scout" | "Charge">;
  const pitStage =
    game.phase === "reveal"
      ? "settle"
      : isTapeRolling
        ? "rolling"
        : pendingChoice
          ? "tape"
          : game.selectedBar
            ? "action"
            : "bar";
  const heatFillPercent = Math.min(100, Math.round((game.risk / heatLimit) * 100));

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [game.phase, game.roundIndex]);

  useEffect(() => {
    return () => {
      if (tapeTimerRef.current) {
        window.clearTimeout(tapeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeTooltip) {
      return;
    }

    const clearTooltip = () => setActiveTooltip(undefined);
    window.addEventListener("resize", clearTooltip);
    window.addEventListener("scroll", clearTooltip, true);

    return () => {
      window.removeEventListener("resize", clearTooltip);
      window.removeEventListener("scroll", clearTooltip, true);
    };
  }, [activeTooltip]);

  const suppressTooltips = (duration = 900) => {
    setTooltipSilencedUntil(window.performance.now() + duration);
  };

  const showTooltip = (target: HTMLElement, text: string) => {
    if (window.performance.now() < tooltipSilencedUntil) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 14;
    const tooltipWidth = Math.min(420, viewportWidth - margin * 2);
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, margin + tooltipWidth / 2),
      viewportWidth - margin - tooltipWidth / 2,
    );
    const placement = rect.top > viewportHeight * 0.48 ? "above" : "below";
    const top = placement === "above" ? Math.max(margin, rect.top - 10) : Math.min(viewportHeight - margin, rect.bottom + 10);
    const maxHeight =
      placement === "above"
        ? Math.max(120, rect.top - margin * 2)
        : Math.max(120, viewportHeight - rect.bottom - margin * 2);

    setActiveTooltip({ text, left, top, placement, maxHeight: Math.min(maxHeight, 340) });
  };

  const hideTooltip = () => setActiveTooltip(undefined);

  const tooltipProps = (text: string) => ({
    "data-tooltip": text,
    tabIndex: 0,
    onPointerEnter: (event: ReactPointerEvent<HTMLElement>) => showTooltip(event.currentTarget, text),
    onPointerLeave: hideTooltip,
    onPointerDown: () => {
      suppressTooltips();
      hideTooltip();
    },
    onFocus: (event: ReactFocusEvent<HTMLElement>) => {
      if (event.currentTarget.tagName.toLowerCase() !== "button") {
        showTooltip(event.currentTarget, text);
      }
    },
    onBlur: hideTooltip,
    onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        hideTooltip();
      }
    },
  });

  const tooltipStyle: CSSProperties | undefined = activeTooltip
    ? {
        left: activeTooltip.left,
        top: activeTooltip.top,
        maxHeight: activeTooltip.maxHeight,
        transform: activeTooltip.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      }
    : undefined;

  const tooltipLayer = activeTooltip ? (
    <div className="game-tooltip" role="tooltip" style={tooltipStyle}>
      {activeTooltip.text}
    </div>
  ) : null;

  const clearTapeTimer = () => {
    if (tapeTimerRef.current) {
      window.clearTimeout(tapeTimerRef.current);
      tapeTimerRef.current = undefined;
    }
    setIsTapeRolling(false);
  };

  const restart = (nextSeed = seed) => {
    hideTooltip();
    suppressTooltips();
    clearTapeTimer();
    setToolStageDone(false);
    setPendingChoice(undefined);
    const fresh = createSprint(nextSeed.trim() || defaultSeed);
    trackGameEvent("alpha_sprint_start", { seed: fresh.seed });
    setGame(fresh);
  };

  const begin = () => {
    hideTooltip();
    suppressTooltips();
    clearTapeTimer();
    setToolStageDone(false);
    setPendingChoice(undefined);
    const fresh = createSprint(seed.trim() || defaultSeed);
    trackGameEvent("alpha_sprint_round_start", { seed: fresh.seed, round: 1 });
    setGame(startSprint(fresh));
  };

  const playAction = (choice: SprintChoice) => {
    if (!game.selectedBar || isTapeRolling) {
      return;
    }
    hideTooltip();
    suppressTooltips();
    setPendingChoice(choice);
    trackGameEvent("alpha_sprint_action_card", {
      seed: game.seed,
      round: game.roundIndex + 1,
      choice,
    });
  };

  const revealTape = () => {
    if (!pendingChoice || isTapeRolling || game.phase !== "choose") {
      return;
    }

    hideTooltip();
    suppressTooltips();
    setIsTapeRolling(true);
    tapeTimerRef.current = window.setTimeout(() => {
      const next = chooseSprintAction(game, pendingChoice);
      hideTooltip();
      suppressTooltips(1400);
      trackGameEvent("alpha_sprint_choice", {
        seed: next.seed,
        round: next.roundIndex + 1,
        choice: pendingChoice,
        alpha: next.alpha,
        risk: next.risk,
      });
      setIsTapeRolling(false);
      tapeTimerRef.current = undefined;
      setGame(next);
    }, 1800);
  };

  const chooseBar = (barCall: SetBarCall) => {
    if (isTapeRolling) {
      return;
    }
    hideTooltip();
    suppressTooltips();
    setToolStageDone(true);
    setPendingChoice(undefined);
    const next = selectSprintBar(game, barCall);
    trackGameEvent("alpha_sprint_set_bar", {
      seed: next.seed,
      round: next.roundIndex + 1,
      report: barCall.report,
      bar: barCall.bar,
    });
    setGame(next);
  };

  const scout = () => {
    if (isTapeRolling) {
      return;
    }
    hideTooltip();
    suppressTooltips();
    const next = scoutSprintRound(game);
    trackGameEvent("alpha_sprint_scout", {
      seed: next.seed,
      round: next.roundIndex + 1,
      scoutsRemaining: next.scoutsRemaining,
    });
    setGame(next);
  };

  const charge = () => {
    if (isTapeRolling) {
      return;
    }
    hideTooltip();
    suppressTooltips();
    const next = chargeSprintRound(game);
    trackGameEvent("alpha_sprint_charge", {
      seed: next.seed,
      round: next.roundIndex + 1,
      chargesRemaining: next.chargesRemaining,
    });
    setGame(next);
  };

  const advance = () => {
    hideTooltip();
    suppressTooltips();
    clearTapeTimer();
    setToolStageDone(false);
    setPendingChoice(undefined);
    const next = nextSprintRound(game);
    trackGameEvent(next.phase === "complete" ? "alpha_sprint_complete" : "alpha_sprint_round_start", {
      seed: next.seed,
      round: next.roundIndex + 1,
      alpha: next.alpha,
      risk: next.risk,
    });
    setGame(next);
  };

  if (game.phase === "start") {
    return (
      <>
        <main className="app-shell sprint-shell">
          <section className="sprint-start">
            <div className="start-copy">
              <p className="eyebrow">Charged Alpha Interactive</p>
              <h1>Alpha Pit</h1>
              <p className="lede">A 30-second trading-pit board game using real recent earnings reactions from large-cap stocks.</p>
              <ol className="quick-rules">
                <li>Draw a real earnings case card and read the report, bar, and risk metrics.</li>
                <li>Optionally Scout for a hidden metric and/or Charge to press conviction.</li>
                <li><strong>Set The Bar.</strong> Place one chip on the report-quality row and expectation-bar column.</li>
                <li>Play Back It, Hedge, or Pass, then click the tape to reveal the actual historical reaction.</li>
                <li>Move alpha chips, mark Heat, and learn why the stock really went up or down.</li>
              </ol>
              <div className="thesis-primer set-bar-primer has-tooltip" aria-label="Set The Bar guide" {...tooltipProps("Set The Bar scores the real earnings report against the stock's expectation bar. Strong report / low bar is bullish; strong report / sky-high bar can still fade.")}>
                <span>Set The Bar</span>
                <div className="has-tooltip" {...tooltipProps("Report Quality is judged from EPS, revenue, guidance, margins, free cash flow, and operating metrics.")}>
                  <strong>Report Quality</strong>
                  <p>Use EPS, revenue, guidance, margins, and cash flow to pick Weak, Mixed, or Strong.</p>
                </div>
                <div className="has-tooltip" {...tooltipProps("Market Bar is judged from valuation, whisper expectations, crowding, short interest, and sector mood.")}>
                  <strong>Market Bar</strong>
                  <p>Use valuation, whisper, crowding, and mood to pick Low, Fair, or Sky-High.</p>
                </div>
                <div className="has-tooltip" {...tooltipProps("Your bar accuracy adds or subtracts from the read. Exact calls earn +3, near calls +1, wrong calls lose points.")}>
                  <strong>Accuracy</strong>
                  <p>Exact calls add edge. Wrong cells can turn a decent report into a bad trade.</p>
                </div>
              </div>
              <div className="strategy-guide has-tooltip" {...tooltipProps("Recommended strategy is a rules-based hint from visible clues. It looks for Cash Flow 5/5, Expectations 5/5, Debt 5/5, or AI Bid mood. It is guidance, not guaranteed scoring.")}>
                <span>Recommended strategy</span>
                <p><strong>Scout</strong> when expectations, debt, or crowding make the bar hard to read.</p>
                <p><strong>Charge</strong> only when the metrics and hidden clue point to the same grid cell. It also makes tape shocks bigger.</p>
                <p><strong>Pass</strong> is not quitting. It banks carry while avoiding Heat.</p>
              </div>
              <div className="start-actions">
                <label className="seed-field">
                  <span>Seed</span>
                  <input value={seed} onChange={(event) => setSeed(event.target.value)} />
                </label>
                <button className="primary-action" type="button" onClick={begin}>
                  <Play size={18} />
                  Start
                </button>
              </div>
            </div>

            <aside className="start-panel compact-panel">
              <div className="metric-tile accent-mint has-tooltip" {...tooltipProps("Goal: maximize final score before Heat reaches 12. Final score uses alpha, Heat, and unused tools.")}>
                <Target size={20} />
                <span>Goal</span>
                <strong>Move chips without overheating the book</strong>
              </div>
              <div className="metric-tile accent-amber has-tooltip" {...tooltipProps("Expectations affect hidden setup score. High expectations can make a good real earnings headline fail if guidance, capex, or valuation disappoints.")}>
                <Zap size={20} />
                <span>Concept 1</span>
                <strong>Expectations set the bar</strong>
              </div>
              <div className="metric-tile accent-blue has-tooltip" {...tooltipProps(`Market tape reveals the historical post-earnings move. Bands: ${marketTapeBuckets}. Pass shows tape but applies 0.`)}>
                <Shield size={20} />
                <span>Concept 2</span>
                <strong>Real tape can surprise</strong>
              </div>
              <div className="metric-tile accent-red has-tooltip" {...tooltipProps("Scout reveals a hidden clue and trims nonzero market tape by 1. Charge doubles the expected read and adds to Heat on Back It or Hedge.")}>
                <Flame size={20} />
                <span>Strategy</span>
                <strong>Scout scarce info, charge strong reads</strong>
              </div>
            </aside>
          </section>
          <footer className="disclaimer">
            {educationalDisclaimer} {modelDisclaimer}
          </footer>
        </main>
        {tooltipLayer}
      </>
    );
  }

  if (game.phase === "complete") {
    return (
      <>
        <main className="app-shell sprint-shell">
          <section className="sprint-card final-card">
            <p className="eyebrow">Sprint Complete</p>
            <h1>{getSprintRank(game)}</h1>
            <p className="final-score-note">
              Final score rewards alpha, unused tools, and low Heat. Charged mistakes and late Heat spikes drag you down fast.
            </p>
            <div className="sprint-scoreboard">
              <div className="has-tooltip" {...tooltipProps(finalScoreTooltip(game))}>
                <span>Final Score</span>
                <strong>{finalScore}</strong>
              </div>
              <div className="has-tooltip" {...tooltipProps("Alpha is the total of each round's alpha delta. Round alpha = expected read + applied tape. Pass applies 0 tape and can earn carry.")}>
                <span>Alpha</span>
                <strong>{game.alpha}</strong>
              </div>
              <div className="has-tooltip" {...tooltipProps(heatTooltip(game))}>
                <span>Heat</span>
                <strong>{game.risk}/{heatLimit}</strong>
              </div>
              <div className="has-tooltip" {...tooltipProps("Leaderboard rank sorts your final score against fixed benchmark scores. It does not affect gameplay scoring.")}>
                <span>Leaderboard</span>
                <strong>#{leaderboardRank}</strong>
              </div>
            </div>
            <div className="leaderboard-panel has-tooltip" {...tooltipProps(finalScoreTooltip(game))}>
              <div className="leaderboard-title">
                <span>Benchmark leaderboard</span>
                <strong>Your score ranks #{leaderboardRank} of {leaderboard.length}</strong>
              </div>
              {leaderboard.map((entry, index) => (
                <div
                  key={`${entry.name}-${entry.score}`}
                  className={entry.isPlayer ? "leaderboard-row player has-tooltip" : "leaderboard-row has-tooltip"}
                  {...tooltipProps(entry.isPlayer ? finalScoreTooltip(game) : `${entry.name} benchmark score: ${entry.score}. ${entry.note}`)}
                >
                  <span>#{index + 1}</span>
                  <strong>{entry.name}</strong>
                  <em>{entry.note}</em>
                  <b>{entry.score}</b>
                </div>
              ))}
            </div>
            <div className="mini-recap-list">
              {game.results.map((result, index) => {
                const playedScenario = game.scenarios[index];
                return (
                  <article key={result.scenarioId} className="mini-recap has-tooltip" {...tooltipProps(`Round ${index + 1} recap.\nAlpha = expected read ${signedNumber(result.expectedAlphaDelta)} + applied tape ${signedNumber(result.marketAppliedDelta)} = ${signedNumber(result.alphaDelta)}.\nBar call: ${barCallLabel(result.barCall)}. Accuracy bonus: ${signedNumber(result.barDelta)}.\nHistorical move: ${signedPercent(result.marketMovePercent)}. Scoring tape shown: ${signedNumber(result.marketDelta)}. Heat: +${result.riskDelta}.\nWhy tape moved: ${result.marketReason}`)}>
                    <span>Round {index + 1}</span>
                    <strong>
                      {playedScenario.ticker}: {result.verdict}
                    </strong>
                    <div className="mini-tags">
                      <span className="has-tooltip" {...tooltipProps(`Set The Bar call: ${barCallLabel(result.barCall)}.\nSelected cell: ${signedNumber(result.selectedBarScore)}. Actual cell: ${signedNumber(result.actualBarScore)}. Accuracy bonus: ${signedNumber(result.barDelta)}.`)}>Bar {signedNumber(result.selectedBarScore)}</span>
                      <span className="has-tooltip" {...tooltipProps(`Historical move: ${signedPercent(result.marketMovePercent)}. Scoring tape shown: ${signedNumber(result.marketDelta)}. Applied to alpha: ${signedNumber(result.marketAppliedDelta)}.\n${result.marketReason}`)}>Tape {signedNumber(result.marketDelta)}</span>
                      {result.carryAlpha > 0 && <span className="has-tooltip" {...tooltipProps(`Pass carry = round(alpha before pass x 10%). Carry earned: +${result.carryAlpha}.`)}>Carry +{result.carryAlpha}</span>}
                      {result.scouted && <span className="has-tooltip" {...tooltipProps("Scout was used: hidden clue revealed, and any nonzero tape move was reduced by 1.")}>Scouted</span>}
                      {result.charged && <span className="has-tooltip" {...tooltipProps("Charge was used: expected read was doubled, nonzero tape moved 1 more point, and Heat increased.")}>Charged</span>}
                    </div>
                    <p>{result.explanation}</p>
                  </article>
                );
              })}
            </div>
            <div className="panel-actions">
              <button className="primary-action" type="button" onClick={() => restart(game.seed)}>
                <RotateCcw size={18} />
                Replay
              </button>
              <button className="secondary-action" type="button" onClick={() => restart(`${defaultSeed}-${Date.now()}`)}>
                <Play size={18} />
                New Seed
              </button>
            </div>
          </section>
          <footer className="disclaimer">
            {educationalDisclaimer} {modelDisclaimer}
          </footer>
        </main>
        {tooltipLayer}
      </>
    );
  }

  return (
    <>
      <main className={`app-shell pit-shell pit-one-screen stage-${pitStage}`}>
        <section className="pit-game-screen">
          <header className="pit-hud">
            <div className="pit-brand">
              <span>Round {roundLabel}</span>
              <strong>Alpha Pit</strong>
            </div>
            <div className="pit-hud-metrics">
              <div className="hud-chip has-tooltip" {...tooltipProps("Current alpha. Round alpha is added after the LED tape resolves. Pass can earn carry equal to round(current alpha x 10%).")}>
                <CircleDollarSign size={17} />
                <span>Alpha</span>
                <strong>{game.alpha}</strong>
              </div>
              <div className={`hud-chip heat ${heatTone(game.risk)} has-tooltip`} {...tooltipProps(heatTooltip(game))}>
                <Gauge size={17} />
                <span>Heat</span>
                <strong>{game.risk}/{heatLimit}</strong>
                <i style={{ width: `${heatFillPercent}%` }} />
              </div>
              <div className="hud-chip has-tooltip" {...tooltipProps("Scout reveals the hidden metric and reduces nonzero tape by 1. Charge can also be played in the same round; it doubles Back/Hedge read and increases Heat.")}>
                <Search size={17} />
                <span>Tools</span>
                <strong>{game.scoutsRemaining}/{game.chargesRemaining}</strong>
              </div>
            </div>
            <div className="pit-round-pips" aria-label="Round progress">
              {game.scenarios.map((roundScenario, index) => {
                const result = game.results[index];
                const isCurrentRound = index === game.roundIndex && game.phase !== "complete";
                return (
                  <span
                    key={roundScenario.id}
                    className={result ? "done" : isCurrentRound ? "current" : ""}
                    title={result ? `${roundScenario.ticker} ${signedNumber(result.alphaDelta)} alpha` : roundScenario.ticker}
                  >
                    {index + 1}
                  </span>
                );
              })}
            </div>
            <button className="icon-reset secondary-action compact" type="button" onClick={() => restart(game.seed)} aria-label="Reset game">
              <RotateCcw size={16} />
            </button>
          </header>

          <section className="pit-playfield">
            <div
              key={`move-${game.phase}-${game.roundIndex}-${game.selectedBar ? barCallLabel(game.selectedBar) : "none"}-${toolStageDone}-${pendingChoice ?? "none"}-${isTapeRolling}`}
              className="pit-prompt"
            >
              <span>{pitMove.label}</span>
              <strong>{pitMove.title}</strong>
              <p>{pitMove.body}</p>
            </div>

            <div className="pit-step-dots" aria-label="Move order">
              {pitSteps.map((step, index) => (
                <span key={step.label} className={step.status}>
                  <b>{index + 1}</b>
                  {step.label}
                </span>
              ))}
            </div>

            <div className="pit-tabletop">
              <article className="stock-card playing-card stock-playing-card has-tooltip" {...tooltipProps(setupTooltip(game))}>
                <div className="card-corner top-left">{scenario.ticker}</div>
                <div className="card-corner bottom-right">{scenario.ticker}</div>
                <div className="stock-card-top">
                  <div>
                    <span>Stock</span>
                    <strong>{scenario.ticker}</strong>
                  </div>
                  <em className="market-mood has-tooltip" {...tooltipProps("Mood is contextual. Some recommendation logic reacts to mood, especially AI Bid. Mood does not directly add points by itself.")}>
                    {scenario.mood}
                  </em>
                </div>
                <h2>{scenario.headline}</h2>
                <p>{scenario.company}</p>
                <div className="clue-row" aria-label="Case clues">
                  {scenario.visibleClues.map((clue) => (
                    <span key={clue}>{clue}</span>
                  ))}
                </div>
                <div className="stock-metrics-grid" aria-label="Stock metrics">
                  {scenario.metrics.map((metric) => (
                    <span key={`${metric.label}-${metric.value}`} className={`stock-metric ${metric.topic.toLowerCase()} ${metric.tone} has-tooltip`} {...tooltipProps(metricTooltip(metric))}>
                      <b>{metric.topic}</b>
                      <strong>{metric.label}</strong>
                      <em>{metric.value}</em>
                    </span>
                  ))}
                </div>
                {isScouted && (
                  <p className="hidden-clue has-tooltip" {...tooltipProps(`${metricTooltip(scenario.hiddenMetric)}\nScout also trims any nonzero market tape move by 1 point.`)}>
                    <strong>Scout:</strong> {scenario.hiddenMetric.label} {scenario.hiddenMetric.value}
                  </p>
                )}
              </article>

              <div className={pendingChoice || game.phase === "reveal" ? "played-zone action-ready" : "played-zone"} aria-label="Played cards">
                <section className={game.selectedBar ? "played-lane active-lane thesis-lane" : "played-lane thesis-lane"}>
                  <span className="played-lane-label">Bar Call</span>
                  {game.selectedBar ? (
                    <article
                      className={`played-card bar-played ${game.selectedBar.report} ${game.selectedBar.bar} has-tooltip`}
                      {...tooltipProps(setBarTooltip(game, game.selectedBar))}
                    >
                      <span className="card-corner top-left">B</span>
                      <span className="card-corner bottom-right">B</span>
                      <Target size={18} />
                      <strong>{barCallLabel(game.selectedBar)}</strong>
                      <em>Cell {signedNumber(getSetBarScore(game.selectedBar.report, game.selectedBar.bar))}</em>
                    </article>
                  ) : (
                    <div className="played-slot compact-slot">Set The Bar</div>
                  )}
                </section>

                <section className={playedTools.length > 0 ? "played-lane active-lane tool-lane" : "played-lane tool-lane"}>
                  <span className="played-lane-label">Tools Played</span>
                  {playedTools.length > 0 ? (
                    <div className="tool-card-stack">
                      {playedTools.map((tool) => (
                        <article
                          key={tool}
                          className={`played-card tool-played ${tool.toLowerCase()} has-tooltip`}
                          {...tooltipProps(
                            tool === "Scout"
                              ? "Scout played: hidden metric revealed and any nonzero tape move is reduced by 1."
                              : "Charge played: Back/Hedge expected read doubles, tape moves harder, and Heat increases.",
                          )}
                        >
                          <span className="card-corner top-left">U</span>
                          <span className="card-corner bottom-right">U</span>
                          {tool === "Scout" ? <Search size={18} /> : <Flame size={18} />}
                          <strong>{tool}</strong>
                          <em>{tool === "Scout" ? "Info edge" : "Pressed read"}</em>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="played-slot compact-slot">Scout / Charge</div>
                  )}
                </section>

                <section className={pendingChoice ? "played-lane active-lane action-lane" : "played-lane action-lane"}>
                  <span className="played-lane-label">Action Played</span>
                  {pendingChoice ? (
                    <article
                      className={`played-card action-played ${pendingChoice} has-tooltip`}
                      {...tooltipProps(actionTooltip(game, pendingChoice))}
                    >
                      <span className="card-corner top-left">A</span>
                      <span className="card-corner bottom-right">A</span>
                      {(() => {
                        const Icon = choiceMeta[pendingChoice].icon;
                        return <Icon size={19} />;
                      })()}
                      <strong>{choiceMeta[pendingChoice].label}</strong>
                      <em>{choiceMeta[pendingChoice].score.replace("Score: ", "")}</em>
                    </article>
                  ) : (
                    <div className="played-slot compact-slot">Action Card</div>
                  )}
                </section>
              </div>

              <button
                className={
                  game.phase === "reveal"
                    ? "led-tape-board settled"
                    : isTapeRolling
                      ? "led-tape-board rolling"
                      : pendingChoice
                        ? "led-tape-board ready"
                        : "led-tape-board locked"
                }
                type="button"
                disabled={!pendingChoice || isTapeRolling || game.phase !== "choose"}
                aria-label={pendingChoice ? "Click market tape to end round and reveal result" : "Market tape locked until an action card is played"}
                onClick={revealTape}
                {...tooltipProps(`${marketTapeTooltip(pendingChoice)}\nCurrent tape display: ${tapeLabel} ${tapeValue}.${game.currentResult ? `\nWhy it moved: ${game.currentResult.marketReason}` : ""}`)}
              >
                <span className="led-label">
                  <ChartCandlestick size={18} />
                  Market Tape
                </span>
                <span className="led-window" aria-live="polite">
                  {isTapeRolling ? (
                    <>
                      <span className="led-stream">{tapeScramble}</span>
                      <span className="led-stream delay">{tapeScramble}</span>
                    </>
                  ) : game.phase === "reveal" && game.currentResult ? (
                    <span className="led-marquee" aria-label={settledTapeText}>
                      <span className="led-marquee-track" aria-hidden="true">
                        <span>{settledTapeText}</span>
                        <span>{settledTapeText}</span>
                      </span>
                    </span>
                  ) : pendingChoice ? (
                    <span className="led-settled">CLICK MARKET TAPE TO PRINT {choiceMeta[pendingChoice].label.toUpperCase()} RESULT</span>
                  ) : (
                    <span className="led-settled">TAPE LOCKED UNTIL ACTION CARD IS PLAYED</span>
                  )}
                </span>
              </button>
            </div>

            {game.phase === "choose" && !game.selectedBar && (
              <section className="pit-card-hand set-bar-hand active-hand" aria-label="Set The Bar board">
                <div className="hand-header has-tooltip" {...tooltipProps(`${recommendedStrategy}\nScout and Charge can both be played before you place the bar chip.\n${marketTapeTooltip()}`)}>
                  <Landmark size={18} />
                  <span>Tools + Set The Bar</span>
                  <strong>{selectedBarLabel}</strong>
                  <b className="hand-click-chip">Click a grid cell</b>
                </div>

                <div className="set-bar-hand-body">
                  <div className="strategy-row compact-tools" aria-label="Strategy tools">
                    <button
                      className="tool-button playing-card selectable-card scout-card-choice has-tooltip"
                      type="button"
                      disabled={isScouted || game.scoutsRemaining <= 0}
                      onClick={scout}
                      {...tooltipProps("Scout reveals the hidden metric before you place the bar chip. It also reduces any nonzero market tape move by 1 point. Uses per sprint: 2.")}
                    >
                      <span className="card-corner top-left">S</span>
                      <span className="card-corner bottom-right">S</span>
                      <Search size={18} />
                      <strong>{isScouted ? "Scouted" : `Scout (${game.scoutsRemaining})`}</strong>
                      <span>Reveal hidden metric.</span>
                    </button>
                    <button
                      className="tool-button charged playing-card selectable-card charge-card-choice has-tooltip"
                      type="button"
                      disabled={game.chargedThisRound || game.chargesRemaining <= 0}
                      onClick={charge}
                      {...tooltipProps("Charge can be played after Scout in the same round. It applies to Back It or Hedge: expected read x 2, nonzero tape moves 1 point further, and Heat increases. Uses per sprint: 2.")}
                    >
                      <span className="card-corner top-left">C</span>
                      <span className="card-corner bottom-right">C</span>
                      <Flame size={18} />
                      <strong>{game.chargedThisRound ? "Charged" : `Charge (${game.chargesRemaining})`}</strong>
                      <span>Press conviction.</span>
                    </button>
                  </div>

                  <div className="set-bar-board" aria-label="Set The Bar choices">
                    <div className="bar-axis corner">Report x Bar</div>
                    {barColumns.map((bar) => (
                      <div key={bar} className="bar-axis column has-tooltip" {...tooltipProps(expectationBarHints[bar])}>
                        {expectationBarLabels[bar]}
                      </div>
                    ))}
                    {reportRows.map((report) => (
                      <Fragment key={report}>
                        <div className="bar-axis row has-tooltip" {...tooltipProps(reportReadHints[report])}>
                          {reportReadLabels[report]}
                        </div>
                        {barColumns.map((bar) => {
                          const score = getSetBarScore(report, bar);
                          return (
                            <button
                              key={`${report}-${bar}`}
                              className={score > 0 ? "set-bar-cell positive has-tooltip" : score < 0 ? "set-bar-cell negative has-tooltip" : "set-bar-cell neutral has-tooltip"}
                              type="button"
                              data-report={report}
                              data-bar={bar}
                              onClick={() => chooseBar({ report, bar })}
                              {...tooltipProps(setBarTooltip(game, { report, bar }))}
                            >
                              <span>{signedNumber(score)}</span>
                              <strong>{reportReadLabels[report].replace(" Report", "")}</strong>
                              <em>{expectationBarLabels[bar].replace(" Bar", "")}</em>
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {game.phase === "choose" && game.selectedBar && !pendingChoice && (
              <section className="pit-card-hand action-hand active-hand" aria-label="Choose action card">
                <div className="hand-header">
                  <HandCoins size={18} />
                  <span>Action cards</span>
                  <strong>Choose score style</strong>
                  <b className="hand-click-chip">Click one card</b>
                </div>
                <div className="choice-grid" aria-label="Sprint choices">
                  {(Object.keys(choiceMeta) as SprintChoice[]).map((choice) => {
                    const Icon = choiceMeta[choice].icon;
                    return (
                      <button
                        key={choice}
                        className={`choice-button ${choice} playing-card selectable-card has-tooltip`}
                        type="button"
                        onClick={() => playAction(choice)}
                        {...tooltipProps(actionTooltip(game, choice))}
                      >
                        <span className="card-corner top-left">A</span>
                        <span className="card-corner bottom-right">A</span>
                        <Icon size={22} />
                        <strong>{choiceMeta[choice].label}</strong>
                        <small className="choice-mode">{choiceMeta[choice].hint}</small>
                        <span className="choice-score">{choiceMeta[choice].score}</span>
                        <em className="choice-risk">{choiceMeta[choice].heat}</em>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {game.phase === "choose" && pendingChoice && (
              <section className="tape-wait-panel">
                <strong>Action locked.</strong>
                <span>Click the glowing Market Tape to end the round and reveal why the stock moved.</span>
              </section>
            )}

            {game.phase === "reveal" && game.currentResult && (
              <section className="pit-reveal-surface">
                <div
                  className={game.currentResult.alphaDelta >= 0 ? "result-ticket positive has-tooltip" : "result-ticket negative has-tooltip"}
                  {...tooltipProps(resultTooltip(game))}
                >
                  {game.currentResult.alphaDelta >= 0 ? <CheckCircle2 size={26} /> : <XCircle size={26} />}
                  <div>
                    <span>{game.currentResult.verdict}</span>
                    <strong>
                      {game.currentResult.alphaDelta > 0 ? "+" : ""}
                      {game.currentResult.alphaDelta} alpha / +{game.currentResult.riskDelta} Heat
                    </strong>
                  </div>
                </div>

                <div className="settle-grid">
                  <div className="settle-card has-tooltip" {...tooltipProps(`Expected read before tape: ${signedNumber(game.currentResult.expectedAlphaDelta)}.\nActual Set The Bar cell: ${signedNumber(game.currentResult.actualBarScore)}. Your selected cell: ${signedNumber(game.currentResult.selectedBarScore)}. Bar accuracy bonus: ${signedNumber(game.currentResult.barDelta)}. Charge and Pass carry apply when relevant.`)}>
                    <span>Read</span>
                    <strong>{signedNumber(game.currentResult.expectedAlphaDelta)}</strong>
                    <em>{choiceMeta[game.currentResult.choice].label}</em>
                  </div>
                  <div className="settle-card tape-settle has-tooltip" {...tooltipProps(`${marketTapeTooltip(game.currentResult.choice)}\nThis round: ${game.currentResult.marketLabel}. Historical move ${signedPercent(game.currentResult.marketMovePercent)}, base tape ${signedNumber(game.currentResult.baseMarketDelta)}, scoring tape ${signedNumber(game.currentResult.marketDelta)}, applied ${signedNumber(game.currentResult.marketAppliedDelta)}.\nWhy it moved: ${game.currentResult.marketReason}`)}>
                    <span>Tape</span>
                    <strong>{signedNumber(game.currentResult.marketDelta)}</strong>
                    <em>{game.currentResult.choice === "pass" ? "Shown only" : signedPercent(game.currentResult.marketMovePercent)}</em>
                  </div>
                  <div className="settle-card has-tooltip" {...tooltipProps(setBarTooltip(game, game.currentResult.barCall))}>
                    <span>Bar Call</span>
                    <strong>{signedNumber(game.currentResult.barDelta)}</strong>
                    <em>{barCallLabel(game.currentResult.barCall)}</em>
                  </div>
                </div>

                <p className="market-lesson has-tooltip" {...tooltipProps("Market lesson is educational copy tied to the scenario. It explains the finance concept but does not add or subtract points.")}>
                  <strong>Lesson:</strong> {scenario.lesson}
                </p>
                <p className="market-tape-reason has-tooltip" {...tooltipProps(`${marketTapeTooltip(game.currentResult.choice)}\n${game.currentResult.marketReason}`)}>
                  <strong>Why real tape moved:</strong> {game.currentResult.marketReason}
                </p>
                <button className="primary-action pit-next" type="button" onClick={advance}>
                  {game.roundIndex + 1 >= game.scenarios.length || game.risk >= heatLimit ? "Finish Pit" : "Next Card"}
                  <ChevronRight size={18} />
                </button>
              </section>
            )}
          </section>

          <p className="pit-disclaimer">{educationalDisclaimer} {modelDisclaimer}</p>
        </section>
      </main>
      {tooltipLayer}
    </>
  );
}
