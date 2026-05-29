import type { CompanyCard } from "../simulation/types";

export const companies: CompanyCard[] = [
  {
    id: "nvra-cloud",
    name: "NVRA Cloud",
    ticker: "NVRA",
    description: "AI compute landlord with huge growth and a valuation that leaves no room for a soft guide.",
    tags: ["AI Stack", "Growth", "Momentum", "Expensive", "Rate Sensitive"],
    stats: { growth: 5, margin: 3, cashFlow: 2, debt: 2, valuation: 5, expectations: 5, volatility: 4 },
    hidden: { earningsSurprise: 2, guidance: -2, crowding: -2, accountingQuality: 1, macroSensitivity: -2 },
  },
  {
    id: "opticore",
    name: "OptiCore Systems",
    ticker: "OPTC",
    description: "Optical networking supplier riding data-center demand with improving margins.",
    tags: ["AI Stack", "Industrial", "Growth", "Momentum"],
    stats: { growth: 4, margin: 4, cashFlow: 3, debt: 2, valuation: 4, expectations: 4, volatility: 4 },
    hidden: { earningsSurprise: 3, guidance: 2, crowding: -1, accountingQuality: 1, macroSensitivity: 1 },
  },
  {
    id: "heliowatt",
    name: "HelioWatt Grid",
    ticker: "HWT",
    description: "Power infrastructure builder with demand tailwinds and rate sensitivity.",
    tags: ["Energy", "Industrial", "Growth", "Rate Sensitive", "Cyclicality"],
    stats: { growth: 4, margin: 3, cashFlow: 3, debt: 3, valuation: 3, expectations: 4, volatility: 3 },
    hidden: { earningsSurprise: 1, guidance: 3, crowding: 0, accountingQuality: 1, macroSensitivity: -2 },
  },
  {
    id: "ledgerwell",
    name: "LedgerWell",
    ticker: "LDGW",
    description: "Steady accounting platform with modest growth and excellent free cash flow.",
    tags: ["Software", "Quality", "Value"],
    stats: { growth: 3, margin: 5, cashFlow: 5, debt: 1, valuation: 3, expectations: 3, volatility: 2 },
    hidden: { earningsSurprise: 1, guidance: 2, crowding: 1, accountingQuality: 2, macroSensitivity: 1 },
  },
  {
    id: "grainpay",
    name: "GrainPay",
    ticker: "GRPY",
    description: "Fintech toll road with slower growth, clean cash flow, and durable margins.",
    tags: ["Fintech", "Quality", "Value"],
    stats: { growth: 3, margin: 4, cashFlow: 5, debt: 1, valuation: 2, expectations: 2, volatility: 2 },
    hidden: { earningsSurprise: 1, guidance: 3, crowding: 1, accountingQuality: 2, macroSensitivity: 1 },
  },
  {
    id: "northstar-med",
    name: "Northstar Med",
    ticker: "NMED",
    description: "Healthcare compounder with low drama, low debt, and dependable margins.",
    tags: ["Healthcare", "Quality", "Value"],
    stats: { growth: 2, margin: 5, cashFlow: 4, debt: 1, valuation: 3, expectations: 2, volatility: 2 },
    hidden: { earningsSurprise: 0, guidance: 1, crowding: 1, accountingQuality: 2, macroSensitivity: 2 },
  },
  {
    id: "retailforge",
    name: "RetailForge",
    ticker: "RFRG",
    description: "Discount retailer attempting a margin comeback after a rough reset.",
    tags: ["Consumer", "Turnaround", "Value"],
    stats: { growth: 2, margin: 2, cashFlow: 3, debt: 2, valuation: 1, expectations: 1, volatility: 3 },
    hidden: { earningsSurprise: 2, guidance: 1, crowding: 2, accountingQuality: 0, macroSensitivity: 1 },
  },
  {
    id: "foundrylane",
    name: "FoundryLane",
    ticker: "FDLN",
    description: "Cyclical industrial with cheap valuation and a messy order book.",
    tags: ["Industrial", "Turnaround", "Value", "Cyclicality"],
    stats: { growth: 2, margin: 2, cashFlow: 2, debt: 3, valuation: 1, expectations: 2, volatility: 3 },
    hidden: { earningsSurprise: -1, guidance: 2, crowding: 1, accountingQuality: -1, macroSensitivity: -1 },
  },
  {
    id: "copperpeak",
    name: "CopperPeak Energy",
    ticker: "CPK",
    description: "Commodity-linked cash machine when the cycle cooperates, fragile when it does not.",
    tags: ["Energy", "Value", "Cyclicality"],
    stats: { growth: 2, margin: 3, cashFlow: 4, debt: 2, valuation: 2, expectations: 3, volatility: 4 },
    hidden: { earningsSurprise: 2, guidance: -1, crowding: 0, accountingQuality: 1, macroSensitivity: -1 },
  },
  {
    id: "metrolev",
    name: "MetroLev Mobility",
    ticker: "MLEV",
    description: "Capital-hungry transit hardware story with big dreams and a heavy debt stack.",
    tags: ["Industrial", "Speculative", "High Debt", "Rate Sensitive", "Cyclicality"],
    stats: { growth: 4, margin: 1, cashFlow: 1, debt: 5, valuation: 4, expectations: 4, volatility: 5 },
    hidden: { earningsSurprise: -2, guidance: -1, crowding: -1, accountingQuality: -2, macroSensitivity: -3 },
  },
  {
    id: "pixelmint",
    name: "PixelMint",
    ticker: "PXMT",
    description: "Consumer app with viral user growth, thin margins, and momentum traders circling.",
    tags: ["Consumer", "Growth", "Momentum", "Speculative", "Crowded"],
    stats: { growth: 5, margin: 1, cashFlow: 1, debt: 2, valuation: 5, expectations: 5, volatility: 5 },
    hidden: { earningsSurprise: 3, guidance: -3, crowding: -3, accountingQuality: -1, macroSensitivity: -1 },
  },
  {
    id: "kinetic-bio",
    name: "Kinetic Bio",
    ticker: "KNBO",
    description: "Binary healthcare story that can rip on catalysts or collapse on weak evidence.",
    tags: ["Healthcare", "Speculative", "Growth"],
    stats: { growth: 5, margin: 1, cashFlow: 1, debt: 1, valuation: 4, expectations: 4, volatility: 5 },
    hidden: { earningsSurprise: -1, guidance: 2, crowding: 0, accountingQuality: -1, macroSensitivity: 0 },
  },
];

export function getCompany(companyId: string): CompanyCard {
  const company = companies.find((item) => item.id === companyId);
  if (!company) {
    throw new Error(`Unknown company: ${companyId}`);
  }
  return company;
}
