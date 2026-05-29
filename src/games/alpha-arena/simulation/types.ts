export type StatRating = 1 | 2 | 3 | 4 | 5;

export type SlotType = "core" | "satellite" | "hedge";

export type RoundPhase =
  | "draft"
  | "research"
  | "allocate"
  | "resolve"
  | "debrief"
  | "complete";

export type HiddenMetric =
  | "earningsSurprise"
  | "guidance"
  | "crowding"
  | "accountingQuality"
  | "macroSensitivity";

export type CompanyTag =
  | "AI Stack"
  | "Software"
  | "Consumer"
  | "Energy"
  | "Fintech"
  | "Healthcare"
  | "Industrial"
  | "Growth"
  | "Quality"
  | "Value"
  | "Momentum"
  | "Turnaround"
  | "Speculative"
  | "High Debt"
  | "Dilution"
  | "Cyclicality"
  | "Rate Sensitive"
  | "Crowded"
  | "Expensive";

export type SupportCardKind = "thesis" | "risk";

export interface CompanyCard {
  id: string;
  name: string;
  ticker: string;
  description: string;
  tags: CompanyTag[];
  stats: {
    growth: StatRating;
    margin: StatRating;
    cashFlow: StatRating;
    debt: StatRating;
    valuation: StatRating;
    expectations: StatRating;
    volatility: StatRating;
  };
  hidden: Record<HiddenMetric, number>;
}

export interface SupportCard {
  id: string;
  name: string;
  kind: SupportCardKind;
  description: string;
  tags: CompanyTag[];
}

export type ThesisCard = SupportCard & { kind: "thesis" };
export type RiskCard = SupportCard & { kind: "risk" };

export interface Catalyst {
  id: string;
  name: string;
  description: string;
  focus: "earnings" | "guidance" | "macro" | "rotation" | "narrative";
}

export interface MarketRegime {
  id: string;
  name: string;
  description: string;
  boosts: CompanyTag[];
  pressures: CompanyTag[];
}

export interface GhostFund {
  id: string;
  name: string;
  description: string;
  preferredTags: CompanyTag[];
  avoidTags: CompanyTag[];
  convictionThreshold: number;
  retreatThreshold: number;
}

export interface PortfolioSlot {
  id: string;
  label: string;
  type: SlotType;
  allocation?: Allocation;
}

export interface Allocation {
  companyId: string;
  capital: number;
}

export interface ShopState {
  companyIds: string[];
  supportCardIds: string[];
  rerollsUsed: number;
}

export interface OpponentPlan {
  slotIdsRevealed: string[];
  supportCardIds: string[];
  slots: PortfolioSlot[];
  convictionCharged: boolean;
  retreated: boolean;
}

export interface RoundState {
  index: number;
  name: string;
  phase: RoundPhase;
  catalystId: string;
  regimeId: string;
  shop: ShopState;
  draftedCompanyIds: string[];
  draftedSupportCardIds: string[];
  activeSupportCardIds: string[];
  revealedMetrics: Record<string, HiddenMetric[]>;
  researchRemaining: number;
  capitalRemaining: number;
  slots: PortfolioSlot[];
  convictionCharged: boolean;
  retreated: boolean;
  opponent: OpponentPlan;
  result?: RoundResult;
}

export interface MatchState {
  seed: string;
  ghostFundId: string;
  roundIndex: number;
  phase: RoundPhase;
  alphaScore: number;
  opponentAlphaScore: number;
  risk: number;
  opponentRisk: number;
  drawdown: number;
  opponentDrawdown: number;
  maxDrawdown: number;
  opponentMaxDrawdown: number;
  rounds: RoundResult[];
  currentRound?: RoundState;
  winner?: "player" | "opponent" | "tie";
}

export interface PositionResult {
  slotId: string;
  slotLabel: string;
  slotType: SlotType;
  companyId?: string;
  companyName?: string;
  capital: number;
  reaction: number;
  score: number;
  riskAdded: number;
  drivers: string[];
}

export interface FundRoundResult {
  side: "player" | "opponent";
  roundAlpha: number;
  rawAlpha: number;
  riskAdded: number;
  drawdownDamage: number;
  cashStabilityBonus: number;
  convictionCharged: boolean;
  retreated: boolean;
  positions: PositionResult[];
  summary: string;
}

export interface RoundResult {
  roundIndex: number;
  roundName: string;
  catalystId: string;
  regimeId: string;
  player: FundRoundResult;
  opponent: FundRoundResult;
  winner: "player" | "opponent" | "tie";
  explanations: string[];
}
