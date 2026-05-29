export type SprintChoice = "back" | "hedge" | "pass";

export type ReportRead = "weak" | "mixed" | "strong";

export type ExpectationBar = "low" | "fair" | "skyHigh";

export interface SetBarCall {
  report: ReportRead;
  bar: ExpectationBar;
}

export type SprintPhase = "start" | "choose" | "reveal" | "complete";

export type MarketTapeLabel = "Air pocket" | "Tape fade" | "Orderly tape" | "Relief bid" | "Squeeze bid";

export const heatLimit = 12;
export const marketTapeBuckets = "Historical reaction bands: -8% or worse = Air pocket, -3% to -8% = Tape fade, -3% to +3% = Orderly tape, +3% to +8% = Relief bid, +8% or better = Squeeze bid";

export interface SprintScenario {
  id: string;
  company: string;
  ticker: string;
  headline: string;
  mood: string;
  caseLabel: string;
  marketCapTier: string;
  historicalMovePercent: number;
  historicalReason: string;
  sourceLabel: string;
  sourceUrl: string;
  visibleClues: string[];
  metrics: StockMetric[];
  hiddenMetric: StockMetric;
  hiddenClue: string;
  lesson: string;
  actualReport: ReportRead;
  actualBar: ExpectationBar;
  report: {
    earnings: number;
    guidance: number;
    quality: number;
    expectations: number;
  };
}

export interface SprintRoundResult {
  scenarioId: string;
  choice: SprintChoice;
  barCall: SetBarCall;
  charged: boolean;
  scouted: boolean;
  setupScore: number;
  selectedBarScore: number;
  actualBarScore: number;
  barDelta: number;
  barDistance: number;
  expectedAlphaDelta: number;
  baseMarketDelta: number;
  marketDelta: number;
  marketAppliedDelta: number;
  marketLabel: MarketTapeLabel;
  marketMovePercent: number;
  marketReason: string;
  carryAlpha: number;
  alphaDelta: number;
  riskDelta: number;
  riskMultiplier: number;
  verdict: string;
  explanation: string;
}

export interface SprintState {
  seed: string;
  phase: SprintPhase;
  roundIndex: number;
  alpha: number;
  risk: number;
  timer: number;
  scoutsRemaining: number;
  chargesRemaining: number;
  chargedThisRound: boolean;
  selectedBar?: SetBarCall;
  scoutedRoundIds: string[];
  scenarios: SprintScenario[];
  results: SprintRoundResult[];
  currentResult?: SprintRoundResult;
}

export interface StockMetric {
  label: string;
  value: string;
  topic: "Report" | "Bar" | "Risk";
  tone: "positive" | "neutral" | "negative";
  hint: string;
}

export const sprintScenarios: SprintScenario[] = [
  {
    id: "amd-ai-reprice",
    company: "Advanced Micro Devices",
    ticker: "AMD",
    headline: "AI infrastructure demand turned a clean beat into a full rerating.",
    mood: "AI Bid",
    caseLabel: "Q1 2026 earnings, reported May 5",
    marketCapTier: "Mega-cap semis",
    historicalMovePercent: 18.6,
    historicalReason:
      "AMD beat revenue and EPS, Data Center revenue jumped 57% year over year, and Q2 revenue guidance came in above Street estimates. The market repriced AMD as a more credible AI infrastructure winner instead of just a CPU share-gain story.",
    sourceLabel: "AMD release; Motley Fool market recap",
    sourceUrl: "https://www.fool.com/coverage/stock-market-today/2026/05/06/stock-market-today-may-6-amd-surges-after-q1-beat-and-strong-q2-data-center-outlook/",
    visibleClues: ["Reported May 2026", "Mega-cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "$10.3B, +38%", topic: "Report", tone: "positive", hint: "Large-cap stocks often need forward growth acceleration, not only an EPS beat." },
      { label: "Adj EPS", value: "$1.37", topic: "Report", tone: "positive", hint: "Adjusted EPS topped expectations and helps the report-quality row." },
      { label: "Data Center", value: "+57% YoY", topic: "Report", tone: "positive", hint: "Data Center acceleration was the core clue that the market could pay up." },
      { label: "Q2 Guide", value: "$11.2B", topic: "Report", tone: "positive", hint: "Forward guidance above consensus usually matters more than the quarter that just ended." },
      { label: "AI Bar", value: "High", topic: "Bar", tone: "neutral", hint: "AI expectations were already elevated, so the question is whether the forward story got even better." },
      { label: "Run-In", value: "+66% YTD", topic: "Risk", tone: "negative", hint: "A big pre-earnings run raises the chance of a sell-the-news reaction." },
    ],
    hiddenMetric: { label: "Pipeline", value: "MI450/Helios", topic: "Report", tone: "positive", hint: "Scout reveals that investors were also reacting to future AI rack-scale platform demand, not only the quarter." },
    hiddenClue: "Scout: the forward AI pipeline made the guide feel underpriced.",
    lesson: "The biggest earnings moves often come when guidance changes the market's view of the next year, not just the last quarter.",
    actualReport: "strong",
    actualBar: "fair",
    report: { earnings: 2, guidance: 3, quality: 2, expectations: -1 },
  },
  {
    id: "csco-ai-orders",
    company: "Cisco Systems",
    ticker: "CSCO",
    headline: "A legacy networking name suddenly printed like an AI infrastructure card.",
    mood: "Re-rating",
    caseLabel: "Fiscal Q3 2026, reported May 13",
    marketCapTier: "Large-cap tech",
    historicalMovePercent: 13.4,
    historicalReason:
      "Cisco beat revenue and EPS, showed record product-order momentum, and raised expected fiscal 2026 AI infrastructure orders to $9 billion from $5 billion. The tape treated the quarter as a structural re-rating.",
    sourceLabel: "Cisco release; Kiplinger market recap",
    sourceUrl: "https://www.kiplinger.com/investing/stocks/cisco-sends-nasdaq-sp-500-to-new-highs-stock-market-today",
    visibleClues: ["Reported May 2026", "Large cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "$15.8B, +12%", topic: "Report", tone: "positive", hint: "Revenue above expectations supports a stronger report row." },
      { label: "Adj EPS", value: "$1.06", topic: "Report", tone: "positive", hint: "Cisco beat profit expectations and showed operating execution." },
      { label: "Orders", value: "+35%", topic: "Report", tone: "positive", hint: "Orders are a forward demand clue, especially in hardware and infrastructure." },
      { label: "AI Orders", value: "$9B guide", topic: "Report", tone: "positive", hint: "A raised AI order target can change how investors categorize the company." },
      { label: "Whisper Bar", value: "Fair", topic: "Bar", tone: "neutral", hint: "The bar was not perfection because Cisco had not been treated like the hottest AI trade." },
      { label: "Legacy Tag", value: "Discounted", topic: "Bar", tone: "positive", hint: "A stale narrative can lower the hurdle and make a clean beat more powerful." },
    ],
    hiddenMetric: { label: "Switching", value: "+40% orders", topic: "Report", tone: "positive", hint: "Scout reveals data center switching demand, a more direct AI infrastructure clue." },
    hiddenClue: "Scout: AI and data-center order strength was broader than the headline EPS beat.",
    lesson: "A low-excitement stock can move like a growth stock when the market discovers a new demand engine.",
    actualReport: "strong",
    actualBar: "fair",
    report: { earnings: 2, guidance: 3, quality: 2, expectations: 1 },
  },
  {
    id: "lly-glp1-raise",
    company: "Eli Lilly",
    ticker: "LLY",
    headline: "The GLP-1 engine cleared a high bar with growth and a raised guide.",
    mood: "Quality Growth",
    caseLabel: "Q1 2026 earnings, reported Apr. 30",
    marketCapTier: "Mega-cap pharma",
    historicalMovePercent: 9.8,
    historicalReason:
      "Lilly posted 56% revenue growth, Mounjaro and Zepbound drove the quarter, and management raised full-year revenue and EPS guidance. The tape rewarded operating leverage and the durability of GLP-1 demand.",
    sourceLabel: "Lilly release; TIKR recap",
    sourceUrl: "https://www.tikr.com/blog/eli-lilly-reports-19-8b-q1-revenue-as-glp-1-sales-surge-56-year-over-year",
    visibleClues: ["Reported Apr 2026", "Mega cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "$19.8B, +56%", topic: "Report", tone: "positive", hint: "Very fast revenue growth in a mega-cap can still surprise when product demand is durable." },
      { label: "Adj EPS", value: "$8.55", topic: "Report", tone: "positive", hint: "Large EPS growth supports a strong report-quality read." },
      { label: "Mounjaro", value: "+125%", topic: "Report", tone: "positive", hint: "Product-level acceleration helps identify the real growth driver." },
      { label: "FY Guide", value: "+$2B", topic: "Report", tone: "positive", hint: "Raised full-year guidance is a strong forward clue." },
      { label: "GLP-1 Bar", value: "High", topic: "Bar", tone: "neutral", hint: "Investors already expected GLP-1 strength, so the hurdle was not low." },
      { label: "Pricing", value: "-7% U.S.", topic: "Risk", tone: "negative", hint: "Lower realized prices are a quality risk even in a high-growth report." },
    ],
    hiddenMetric: { label: "Zepbound", value: "$4.16B", topic: "Report", tone: "positive", hint: "Scout reveals a second GLP-1 pillar, reducing single-product risk." },
    hiddenClue: "Scout: the demand story was broad across Mounjaro and Zepbound, not one product doing all the work.",
    lesson: "When a company already has a high bar, the guide and product mix decide whether the beat is enough.",
    actualReport: "strong",
    actualBar: "fair",
    report: { earnings: 3, guidance: 3, quality: 2, expectations: -2 },
  },
  {
    id: "baba-ai-lookthrough",
    company: "Alibaba Group",
    ticker: "BABA",
    headline: "Investors looked through a messy quarter because cloud AI accelerated.",
    mood: "China AI",
    caseLabel: "March quarter 2026, reported May 13",
    marketCapTier: "Large-cap internet",
    historicalMovePercent: 8.2,
    historicalReason:
      "Alibaba missed overall revenue expectations and reported weak profitability, but cloud and AI growth accelerated. Investors focused on AI product traction and future model/service revenue instead of the messy income statement.",
    sourceLabel: "Alibaba release; Bloomberg recap",
    sourceUrl: "https://www.bloomberg.com/news/articles/2026-05-13/alibaba-revenue-misses-estimates-despite-ai-monetization-efforts",
    visibleClues: ["Reported May 2026", "Large cap ADR", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "+3% YoY", topic: "Report", tone: "neutral", hint: "Slow total revenue makes report quality mixed unless a segment changes the story." },
      { label: "Cloud", value: "+38% YoY", topic: "Report", tone: "positive", hint: "Accelerating cloud growth can dominate a weak headline." },
      { label: "AI Products", value: "Triple-digit", topic: "Report", tone: "positive", hint: "AI-related product growth is the forward story investors were watching." },
      { label: "Profit", value: "Op. loss", topic: "Report", tone: "negative", hint: "Heavy AI and quick-commerce investment hurt current profitability." },
      { label: "China Bar", value: "Low", topic: "Bar", tone: "positive", hint: "Depressed sentiment can make investors more willing to look through messy earnings." },
      { label: "Spend Risk", value: "High", topic: "Risk", tone: "negative", hint: "Aggressive investment raises the risk that growth will not convert to margins soon." },
    ],
    hiddenMetric: { label: "AI ARR", value: "10B yuan run-rate", topic: "Report", tone: "positive", hint: "Scout reveals that model and service recurring revenue was becoming easier for investors to underwrite." },
    hiddenClue: "Scout: the tape cared about AI cloud acceleration more than the reported operating loss.",
    lesson: "A weak headline can rally when the market finds a more important forward metric underneath it.",
    actualReport: "mixed",
    actualBar: "low",
    report: { earnings: -1, guidance: 2, quality: -1, expectations: 3 },
  },
  {
    id: "meta-capex-shock",
    company: "Meta Platforms",
    ticker: "META",
    headline: "Ad strength was real, but the AI capex bill stole the quarter.",
    mood: "Capex Shock",
    caseLabel: "Q1 2026 earnings, reported Apr. 29",
    marketCapTier: "Mega-cap tech",
    historicalMovePercent: -6,
    historicalReason:
      "Meta delivered strong ad-driven revenue growth, but investors focused on a higher 2026 capital-expenditure outlook for AI infrastructure. The beat was overshadowed by fears that spending would pressure future profitability.",
    sourceLabel: "Meta release; Android Central recap",
    sourceUrl: "https://www.androidcentral.com/apps-software/meta/meta-q1-2026-earnings",
    visibleClues: ["Reported Apr 2026", "Mega cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "$56.3B, +33%", topic: "Report", tone: "positive", hint: "The core ad business was strong, so this is not a simple miss." },
      { label: "FoA Rev", value: "$55.9B", topic: "Report", tone: "positive", hint: "Family of Apps remains the profit engine." },
      { label: "Q2 Guide", value: "Above Street", topic: "Report", tone: "positive", hint: "A clean forward revenue guide normally supports a strong row." },
      { label: "Capex", value: "$125-145B", topic: "Risk", tone: "negative", hint: "A capex raise can overwhelm an earnings beat if investors doubt the return." },
      { label: "AI Bar", value: "Sky-high", topic: "Bar", tone: "negative", hint: "Mega-cap AI stocks need proof that spending will convert to durable profits." },
      { label: "Reality Labs", value: "-2% rev", topic: "Risk", tone: "negative", hint: "Slow growth in emerging products makes AI and hardware spend easier to question." },
    ],
    hiddenMetric: { label: "Cost Shock", value: "Memory/components", topic: "Risk", tone: "negative", hint: "Scout reveals that component inflation made the capex raise feel less controllable." },
    hiddenClue: "Scout: investors punished the spending surprise more than they rewarded the ad beat.",
    lesson: "Great revenue can still sell off when the next-dollar cost of growth resets higher.",
    actualReport: "mixed",
    actualBar: "skyHigh",
    report: { earnings: 3, guidance: 1, quality: -3, expectations: -3 },
  },
  {
    id: "nvda-perfection-fade",
    company: "Nvidia",
    ticker: "NVDA",
    headline: "Another monster quarter still failed to clear perfection expectations.",
    mood: "Crowded AI",
    caseLabel: "Fiscal Q4 2026, reported Feb. 25",
    marketCapTier: "Mega-cap semis",
    historicalMovePercent: -5.5,
    historicalReason:
      "Nvidia delivered record revenue, huge Data Center growth, and strong guidance, but shares still fell as investors rotated out of semis and questioned how much AI upside was already priced in.",
    sourceLabel: "Nvidia release; Motley Fool recap",
    sourceUrl: "https://www.fool.com/investing/2026/02/26/is-this-the-reason-nvidia-lost-5-today/",
    visibleClues: ["Reported Feb 2026", "Mega cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "$68.1B, +73%", topic: "Report", tone: "positive", hint: "A blowout revenue print supports report strength." },
      { label: "Data Center", value: "$62.3B, +75%", topic: "Report", tone: "positive", hint: "The core AI engine was still growing extremely fast." },
      { label: "Q1 Guide", value: "$78B", topic: "Report", tone: "positive", hint: "Strong forward guidance reduces the chance of a simple miss." },
      { label: "Gross Margin", value: "75%", topic: "Report", tone: "positive", hint: "High margins support earnings quality." },
      { label: "AI Bar", value: "Perfection", topic: "Bar", tone: "negative", hint: "When a company always beats, investors may demand an even bigger upside surprise." },
      { label: "Sector Tape", value: "Semis faded", topic: "Risk", tone: "negative", hint: "Group rotation can overpower a strong individual report." },
    ],
    hiddenMetric: { label: "Capex Debate", value: "Post-buildout?", topic: "Bar", tone: "negative", hint: "Scout reveals the market was debating what happens after the huge data-center buildout." },
    hiddenClue: "Scout: this was a classic high-quality report versus impossibly high expectations setup.",
    lesson: "The right question is not only 'did they beat?' but 'did they beat what the stock already priced?'",
    actualReport: "strong",
    actualBar: "skyHigh",
    report: { earnings: 3, guidance: 3, quality: 2, expectations: -5 },
  },
  {
    id: "pltr-valuation-trap",
    company: "Palantir Technologies",
    ticker: "PLTR",
    headline: "Explosive AI growth was not enough for a stock priced for heroic durability.",
    mood: "Valuation Trap",
    caseLabel: "Q1 2026 earnings, reported May 4",
    marketCapTier: "Large-cap software",
    historicalMovePercent: -6.9,
    historicalReason:
      "Palantir beat revenue and earnings, grew revenue 85% year over year, and raised guidance, but the stock fell as investors focused on valuation, profit-taking, and slight deceleration in U.S. commercial growth.",
    sourceLabel: "Palantir release; Kiplinger recap",
    sourceUrl: "https://www.kiplinger.com/investing/stocks/nasdaq-sp-500-at-new-highs-on-intel-rally-stock-market-today",
    visibleClues: ["Reported May 2026", "Large cap", "Actual tape hidden"],
    metrics: [
      { label: "Revenue", value: "+85% YoY", topic: "Report", tone: "positive", hint: "This is a very strong headline growth number." },
      { label: "U.S. Rev", value: "+104%", topic: "Report", tone: "positive", hint: "U.S. business momentum was still exceptional." },
      { label: "FY Guide", value: "+71%", topic: "Report", tone: "positive", hint: "Raised guidance supports the report row." },
      { label: "Commercial", value: "Decel q/q", topic: "Risk", tone: "negative", hint: "A small deceleration can matter when the valuation leaves no slack." },
      { label: "Valuation", value: "Extreme", topic: "Bar", tone: "negative", hint: "Expensive stocks need near-perfect execution and upside surprise." },
      { label: "Run-In", value: "Crowded", topic: "Risk", tone: "negative", hint: "Profit-taking risk rises when a stock has already had a huge multi-year run." },
    ],
    hiddenMetric: { label: "Risk/Reward", value: "Heroic assumptions", topic: "Bar", tone: "negative", hint: "Scout reveals that the market cared less about the beat than whether the multiple was still defensible." },
    hiddenClue: "Scout: the report was strong, but the bar was stronger.",
    lesson: "The market can punish great numbers when the stock needs flawless acceleration to justify its price.",
    actualReport: "strong",
    actualBar: "skyHigh",
    report: { earnings: 3, guidance: 2, quality: 1, expectations: -5 },
  },
];

function hashSeed(seed: string) {
  return [...seed].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function rotateScenarios(seed: string) {
  const offset = hashSeed(seed) % sprintScenarios.length;
  return [...sprintScenarios.slice(offset), ...sprintScenarios.slice(0, offset)].slice(0, 5);
}

export interface ScoreChoiceOptions {
  charged?: boolean;
  scouted?: boolean;
  seed?: string;
  roundIndex?: number;
  currentAlpha?: number;
  currentRisk?: number;
}

const reportRank: Record<ReportRead, number> = {
  weak: 0,
  mixed: 1,
  strong: 2,
};

const barRank: Record<ExpectationBar, number> = {
  low: 0,
  fair: 1,
  skyHigh: 2,
};

export const reportReadLabels: Record<ReportRead, string> = {
  weak: "Weak Report",
  mixed: "Mixed Report",
  strong: "Strong Report",
};

export const expectationBarLabels: Record<ExpectationBar, string> = {
  low: "Low Bar",
  fair: "Fair Bar",
  skyHigh: "Sky-High Bar",
};

export function getSetBarScore(report: ReportRead, bar: ExpectationBar) {
  const matrix: Record<ReportRead, Record<ExpectationBar, number>> = {
    strong: { low: 6, fair: 3, skyHigh: -1 },
    mixed: { low: 2, fair: 0, skyHigh: -3 },
    weak: { low: -1, fair: -4, skyHigh: -7 },
  };

  return matrix[report][bar];
}

function getBarDistance(scenario: SprintScenario, barCall: SetBarCall) {
  return Math.abs(reportRank[scenario.actualReport] - reportRank[barCall.report]) +
    Math.abs(barRank[scenario.actualBar] - barRank[barCall.bar]);
}

function getBarAccuracyDelta(distance: number) {
  if (distance === 0) {
    return 3;
  }
  if (distance === 1) {
    return 1;
  }
  if (distance === 2) {
    return -1;
  }
  return -3;
}

function getMarketMove(
  scenario: SprintScenario,
  choice: SprintChoice,
  options: Required<Pick<ScoreChoiceOptions, "charged" | "scouted">>,
) {
  const chargeApplies = options.charged && choice !== "pass";
  const move = scenario.historicalMovePercent;
  const magnitude = Math.abs(move);
  const sign = Math.sign(move);

  let baseMarketDelta = 0;
  let marketLabel: MarketTapeLabel = "Orderly tape";

  if (magnitude >= 8) {
    baseMarketDelta = sign * 7;
    marketLabel = sign > 0 ? "Squeeze bid" : "Air pocket";
  } else if (magnitude >= 5) {
    baseMarketDelta = sign * 5;
    marketLabel = sign > 0 ? "Relief bid" : "Tape fade";
  } else if (magnitude >= 3) {
    baseMarketDelta = sign * 3;
    marketLabel = sign > 0 ? "Relief bid" : "Tape fade";
  }

  let marketDelta = baseMarketDelta;
  if (marketDelta !== 0 && options.scouted) {
    marketDelta -= Math.sign(marketDelta);
  }

  if (marketDelta !== 0 && chargeApplies) {
    marketDelta += Math.sign(marketDelta);
  }

  return {
    baseMarketDelta,
    marketDelta,
    marketLabel,
    marketMovePercent: Number(move.toFixed(1)),
  };
}

function formatDelta(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${Number(value.toFixed(1))}%`;
}

function getMarketReason(
  scenario: SprintScenario,
  marketLabel: MarketTapeLabel,
  marketDelta: number,
  marketApplied = true,
  baseMarketDelta = marketDelta,
) {
  const toolAdjustment =
    baseMarketDelta !== marketDelta
      ? ` Tool effects changed the scoring impact from ${formatDelta(baseMarketDelta)} to ${formatDelta(marketDelta)}.`
      : "";
  const reason = `${scenario.ticker} historical tape: ${formatPercent(scenario.historicalMovePercent)} after ${scenario.caseLabel}. ${scenario.historicalReason} In-game tape prints ${marketLabel} ${formatDelta(marketDelta)}.${toolAdjustment}`;

  if (!marketApplied) {
    return `${reason} Because you passed, that tape stayed off-book and did not affect alpha.`;
  }

  return reason;
}

function heatMultiplier(currentRisk: number) {
  return 1 + Math.max(0, currentRisk) / 10;
}

function applyHeat(baseHeat: number, currentRisk: number) {
  if (baseHeat <= 0) {
    return { riskDelta: 0, riskMultiplier: 1 };
  }

  const multiplier = heatMultiplier(currentRisk);
  return {
    riskDelta: Math.max(1, Math.ceil(baseHeat * multiplier)),
    riskMultiplier: Number(multiplier.toFixed(1)),
  };
}

function buildExplanation(base: string, marketReason: string, carryAlpha: number) {
  const carryText = carryAlpha > 0 ? ` Passing earned ${carryAlpha} carry from your existing alpha.` : "";
  return `${base}${carryText} ${marketReason}`;
}

function getVerdict(
  expectedAlphaDelta: number,
  alphaDelta: number,
  fallbackPositive: string,
  fallbackNegative: string,
  fallbackNeutral: string,
) {
  if (expectedAlphaDelta > 0 && alphaDelta <= 0) {
    return "Right read, bad tape";
  }
  if (expectedAlphaDelta < 0 && alphaDelta > 0) {
    return "Lucky market save";
  }
  if (alphaDelta > 0) {
    return fallbackPositive;
  }
  if (alphaDelta < 0) {
    return fallbackNegative;
  }
  return fallbackNeutral;
}

export function createSprint(seed = "charged-alpha-sprint"): SprintState {
  return {
    seed,
    phase: "start",
    roundIndex: 0,
    alpha: 0,
    risk: 0,
    timer: 30,
    scoutsRemaining: 2,
    chargesRemaining: 2,
    chargedThisRound: false,
    selectedBar: undefined,
    scoutedRoundIds: [],
    scenarios: rotateScenarios(seed),
    results: [],
  };
}

export function startSprint(state: SprintState): SprintState {
  return {
    ...state,
    phase: "choose",
    currentResult: undefined,
  };
}

export function scoreChoice(
  scenario: SprintScenario,
  choice: SprintChoice,
  barCall: SetBarCall,
  options: ScoreChoiceOptions = {},
): SprintRoundResult {
  const charged = options.charged ?? false;
  const scouted = options.scouted ?? false;
  const currentAlpha = options.currentAlpha ?? 0;
  const currentRisk = options.currentRisk ?? 0;
  const setupScore =
    scenario.report.earnings +
    scenario.report.guidance +
    scenario.report.quality +
    scenario.report.expectations;
  const selectedBarScore = getSetBarScore(barCall.report, barCall.bar);
  const actualBarScore = getSetBarScore(scenario.actualReport, scenario.actualBar);
  const barDistance = getBarDistance(scenario, barCall);
  const barDelta = getBarAccuracyDelta(barDistance);
  const market = getMarketMove(scenario, choice, { charged, scouted });

  if (choice === "back") {
    const baseAlpha = actualBarScore + barDelta;
    const expectedAlphaDelta = charged ? baseAlpha * 2 : baseAlpha;
    const marketAppliedDelta = market.marketDelta;
    const alphaDelta = expectedAlphaDelta + marketAppliedDelta;
    const baseRisk = (expectedAlphaDelta > 0 ? 2 : 4) + (charged ? 2 : 0) + (market.marketDelta < 0 ? 1 : 0);
    const heat = applyHeat(baseRisk, currentRisk);
    const marketReason = getMarketReason(scenario, market.marketLabel, market.marketDelta, true, market.baseMarketDelta);
    return {
      scenarioId: scenario.id,
      choice,
      barCall,
      charged,
      scouted,
      setupScore,
      selectedBarScore,
      actualBarScore,
      barDelta,
      barDistance,
      expectedAlphaDelta,
      baseMarketDelta: market.baseMarketDelta,
      marketDelta: market.marketDelta,
      marketAppliedDelta,
      marketLabel: market.marketLabel,
      marketMovePercent: market.marketMovePercent,
      marketReason,
      carryAlpha: 0,
      alphaDelta,
      riskDelta: heat.riskDelta,
      riskMultiplier: heat.riskMultiplier,
      verdict: getVerdict(expectedAlphaDelta, alphaDelta, "Back worked", "Back got punished", "Flat read"),
      explanation: buildExplanation(
        expectedAlphaDelta > 0
          ? "Your bar call lined up with a setup that cleared expectations before tape."
          : "The actual report and expectation bar did not support taking risk before tape.",
        marketReason,
        0,
      ),
    };
  }

  if (choice === "hedge") {
    const baseAlpha = Math.round(actualBarScore * 0.45) + Math.round(barDelta * 0.6);
    const expectedAlphaDelta = charged ? baseAlpha * 2 : baseAlpha;
    const marketAppliedDelta = market.marketDelta;
    const alphaDelta = expectedAlphaDelta + marketAppliedDelta;
    const baseRisk = (expectedAlphaDelta < 0 ? 2 : 1) + (charged ? 1 : 0) + (market.marketDelta < 0 && alphaDelta < 0 ? 1 : 0);
    const heat = applyHeat(baseRisk, currentRisk);
    const marketReason = getMarketReason(scenario, market.marketLabel, market.marketDelta, true, market.baseMarketDelta);
    return {
      scenarioId: scenario.id,
      choice,
      barCall,
      charged,
      scouted,
      setupScore,
      selectedBarScore,
      actualBarScore,
      barDelta,
      barDistance,
      expectedAlphaDelta,
      baseMarketDelta: market.baseMarketDelta,
      marketDelta: market.marketDelta,
      marketAppliedDelta,
      marketLabel: market.marketLabel,
      marketMovePercent: market.marketMovePercent,
      marketReason,
      carryAlpha: 0,
      alphaDelta,
      riskDelta: heat.riskDelta,
      riskMultiplier: heat.riskMultiplier,
      verdict: getVerdict(expectedAlphaDelta, alphaDelta, "Hedge survived", "Hedge leaked", "Flat hedge"),
      explanation: buildExplanation(
        expectedAlphaDelta >= 0
          ? "You gave up upside, but your bar call kept the defined-risk read controlled."
          : "Even the safer structure had a weak read once the report and bar were scored.",
        marketReason,
        0,
      ),
    };
  }

  const passBase = actualBarScore <= -2 ? 2 : actualBarScore >= 3 ? -2 : 0;
  const baseAlpha = passBase + Math.round(barDelta * 0.4);
  const carryAlpha = Math.max(0, Math.round(currentAlpha * 0.1));
  const expectedAlphaDelta = baseAlpha + carryAlpha;
  const marketAppliedDelta = 0;
  const alphaDelta = expectedAlphaDelta;
  const marketReason = getMarketReason(scenario, market.marketLabel, market.marketDelta, false, market.baseMarketDelta);
  return {
    scenarioId: scenario.id,
    choice,
    barCall,
    charged: false,
    scouted,
    setupScore,
    selectedBarScore,
    actualBarScore,
    barDelta,
    barDistance,
    expectedAlphaDelta,
    baseMarketDelta: market.baseMarketDelta,
    marketDelta: market.marketDelta,
    marketAppliedDelta,
    marketLabel: market.marketLabel,
    marketMovePercent: market.marketMovePercent,
    marketReason,
    carryAlpha,
    alphaDelta,
    riskDelta: 0,
    riskMultiplier: 1,
    verdict: getVerdict(expectedAlphaDelta, alphaDelta, carryAlpha > 0 ? "Carry paid" : "Great pass", "Missed upside", "Clean skip"),
    explanation: buildExplanation(
      expectedAlphaDelta > 0
        ? "Passing protected you from a report/bar setup that did not deserve market exposure."
        : expectedAlphaDelta < 0
          ? "The report/bar setup cleared enough of the market's hurdle that cash missed upside."
          : "The setup was mixed. Passing kept the fund clean before tape.",
      marketReason,
      carryAlpha,
    ),
  };
}

export function chooseSprintAction(state: SprintState, choice: SprintChoice): SprintState {
  if (state.phase !== "choose" || !state.selectedBar) {
    return state;
  }

  const scenario = state.scenarios[state.roundIndex];
  const result = scoreChoice(
    scenario,
    choice,
    state.selectedBar,
    {
      charged: state.chargedThisRound,
      scouted: state.scoutedRoundIds.includes(scenario.id),
      seed: state.seed,
      roundIndex: state.roundIndex,
      currentAlpha: state.alpha,
      currentRisk: state.risk,
    },
  );

  return {
    ...state,
    phase: "reveal",
    alpha: state.alpha + result.alphaDelta,
    risk: state.risk + result.riskDelta,
    currentResult: result,
    results: [...state.results, result],
  };
}

export function nextSprintRound(state: SprintState): SprintState {
  if (state.phase !== "reveal") {
    return state;
  }

  const nextRound = state.roundIndex + 1;
  const isComplete = nextRound >= state.scenarios.length || state.risk >= heatLimit;

  return {
    ...state,
    phase: isComplete ? "complete" : "choose",
    roundIndex: isComplete ? state.roundIndex : nextRound,
    chargedThisRound: false,
    selectedBar: undefined,
    currentResult: undefined,
  };
}

export function selectSprintBar(state: SprintState, barCall: SetBarCall): SprintState {
  if (state.phase !== "choose") {
    return state;
  }

  return {
    ...state,
    selectedBar: barCall,
  };
}

export function scoutSprintRound(state: SprintState): SprintState {
  if (state.phase !== "choose" || state.scoutsRemaining <= 0) {
    return state;
  }

  const scenario = state.scenarios[state.roundIndex];
  if (state.scoutedRoundIds.includes(scenario.id)) {
    return state;
  }

  return {
    ...state,
    scoutsRemaining: state.scoutsRemaining - 1,
    scoutedRoundIds: [...state.scoutedRoundIds, scenario.id],
  };
}

export function chargeSprintRound(state: SprintState): SprintState {
  if (state.phase !== "choose" || state.chargesRemaining <= 0 || state.chargedThisRound) {
    return state;
  }

  return {
    ...state,
    chargesRemaining: state.chargesRemaining - 1,
    chargedThisRound: true,
  };
}

export function getSprintRank(state: SprintState) {
  if (state.risk >= heatLimit) {
    return "Heat desk shut you down";
  }
  if (state.alpha >= 14) {
    return "Market wizard";
  }
  if (state.alpha >= 8) {
    return "Sharp analyst";
  }
  if (state.alpha >= 3) {
    return "Still in the game";
  }
  return "Needs a cleaner read";
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  note: string;
  isPlayer?: boolean;
}

export const benchmarkLeaderboard: LeaderboardEntry[] = [
  { name: "Lana", score: 228, note: "Scouted traps, charged quality." },
  { name: "Hudson", score: 190, note: "Strong reads, one bad tape shock." },
  { name: "Quant Desk", score: 154, note: "Safe hedges, low heat." },
  { name: "Momentum Max", score: 118, note: "Big swings, messy heat." },
  { name: "Rookie Tape", score: 72, note: "Survived the sprint." },
];

export function calculateFinalScore(state: SprintState) {
  return Math.max(
    0,
    Math.round(state.alpha * 12 - state.risk * 10 + state.scoutsRemaining * 5 + state.chargesRemaining * 6),
  );
}

export function buildLeaderboard(state: SprintState): LeaderboardEntry[] {
  const playerEntry: LeaderboardEntry = {
    name: "You",
    score: calculateFinalScore(state),
    note: `${state.alpha} alpha / ${state.risk} heat`,
    isPlayer: true,
  };

  return [...benchmarkLeaderboard, playerEntry].sort((first, second) => second.score - first.score);
}

export function getLeaderboardRank(state: SprintState) {
  return buildLeaderboard(state).findIndex((entry) => entry.isPlayer) + 1;
}
