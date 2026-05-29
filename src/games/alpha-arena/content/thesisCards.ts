import type { SupportCard } from "../simulation/types";

export const supportCards: SupportCard[] = [
  {
    id: "margin-expansion",
    name: "Margin Expansion",
    kind: "thesis",
    description: "Margin beats matter more this round.",
    tags: ["Quality", "Software", "Industrial"],
  },
  {
    id: "quality-wins",
    name: "Quality Wins",
    kind: "thesis",
    description: "Cash flow and low debt reduce drawdown.",
    tags: ["Quality", "Value"],
  },
  {
    id: "narrative-heat",
    name: "Narrative Heat",
    kind: "thesis",
    description: "Growth and momentum score harder, but crowding hurts more.",
    tags: ["Growth", "Momentum", "AI Stack"],
  },
  {
    id: "valuation-reset",
    name: "Valuation Reset",
    kind: "thesis",
    description: "Expensive companies face more pressure on mixed results.",
    tags: ["Expensive", "Rate Sensitive"],
  },
  {
    id: "cash-buffer",
    name: "Cash Buffer",
    kind: "risk",
    description: "Unused capital absorbs more drawdown.",
    tags: ["Quality"],
  },
  {
    id: "position-cap",
    name: "Position Cap",
    kind: "risk",
    description: "Large positions add less risk.",
    tags: ["Quality"],
  },
  {
    id: "hedge-basket",
    name: "Hedge Basket",
    kind: "risk",
    description: "Macro shock damage falls, but upside is muted.",
    tags: ["Value", "Quality"],
  },
  {
    id: "diversification-mandate",
    name: "Diversification Mandate",
    kind: "risk",
    description: "Spreading across tags earns stability.",
    tags: ["Quality", "Value"],
  },
  {
    id: "turnaround-tape",
    name: "Turnaround Tape",
    kind: "thesis",
    description: "Low expectations get rewarded when guidance improves.",
    tags: ["Turnaround", "Value"],
  },
  {
    id: "crowded-exit",
    name: "Crowded Exit",
    kind: "thesis",
    description: "Crowded momentum trades get punished on weak details.",
    tags: ["Crowded", "Momentum"],
  },
];

export function getSupportCard(cardId: string): SupportCard {
  const card = supportCards.find((item) => item.id === cardId);
  if (!card) {
    throw new Error(`Unknown support card: ${cardId}`);
  }
  return card;
}
