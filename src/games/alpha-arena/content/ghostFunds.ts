import type { GhostFund } from "../simulation/types";

export const ghostFunds: GhostFund[] = [
  {
    id: "momentum-max",
    name: "Momentum Max",
    description: "Chases hot growth themes, overweights satellite slots, and hates retreating.",
    preferredTags: ["Growth", "Momentum", "AI Stack", "Speculative"],
    avoidTags: ["Value", "Quality"],
    convictionThreshold: 7,
    retreatThreshold: -9,
  },
  {
    id: "quality-turtle",
    name: "Quality Turtle",
    description: "Wins slowly with cash flow, lower risk, and fewer blowups.",
    preferredTags: ["Quality", "Value"],
    avoidTags: ["Speculative", "High Debt"],
    convictionThreshold: 10,
    retreatThreshold: -4,
  },
];

export function getGhostFund(ghostFundId: string): GhostFund {
  const fund = ghostFunds.find((item) => item.id === ghostFundId);
  if (!fund) {
    throw new Error(`Unknown ghost fund: ${ghostFundId}`);
  }
  return fund;
}
