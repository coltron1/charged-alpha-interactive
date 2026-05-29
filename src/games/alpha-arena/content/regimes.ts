import type { MarketRegime } from "../simulation/types";

export const regimes: MarketRegime[] = [
  {
    id: "rate-spike",
    name: "Rate Spike",
    description: "The market punishes expensive growth, debt, and rate-sensitive stories.",
    boosts: ["Quality", "Value"],
    pressures: ["Rate Sensitive", "High Debt", "Expensive", "Speculative"],
  },
  {
    id: "soft-landing",
    name: "Soft Landing",
    description: "Cyclicals and balanced growth get room to breathe.",
    boosts: ["Consumer", "Industrial", "Cyclicality", "Growth"],
    pressures: ["High Debt"],
  },
  {
    id: "ai-narrative-surge",
    name: "AI Narrative Surge",
    description: "AI infrastructure and momentum trades get a narrative bid.",
    boosts: ["AI Stack", "Growth", "Momentum"],
    pressures: ["Value", "Turnaround"],
  },
];

export function getRegime(regimeId: string): MarketRegime {
  const regime = regimes.find((item) => item.id === regimeId);
  if (!regime) {
    throw new Error(`Unknown regime: ${regimeId}`);
  }
  return regime;
}
