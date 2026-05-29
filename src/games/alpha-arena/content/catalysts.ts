import type { Catalyst } from "../simulation/types";

export const catalysts: Catalyst[] = [
  {
    id: "earnings-report",
    name: "Earnings Report",
    description: "Revenue, margins, and cash flow hit the tape.",
    focus: "earnings",
  },
  {
    id: "guidance-update",
    name: "Guidance Update",
    description: "The next quarter matters more than the quarter just reported.",
    focus: "guidance",
  },
  {
    id: "sector-rotation",
    name: "Sector Rotation",
    description: "Factor money moves quickly from crowded winners to fresher setups.",
    focus: "rotation",
  },
  {
    id: "rate-decision",
    name: "Rate Decision",
    description: "Balance sheets and valuation multiples are suddenly under the microscope.",
    focus: "macro",
  },
  {
    id: "narrative-breakout",
    name: "Narrative Breakout",
    description: "Story, momentum, and positioning decide who gets chased.",
    focus: "narrative",
  },
];

export function getCatalyst(catalystId: string): Catalyst {
  const catalyst = catalysts.find((item) => item.id === catalystId);
  if (!catalyst) {
    throw new Error(`Unknown catalyst: ${catalystId}`);
  }
  return catalyst;
}
