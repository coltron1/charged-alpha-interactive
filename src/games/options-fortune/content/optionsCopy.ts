import type { DashboardGuideItem } from "../../../shared/game-ui/TargetGuideOverlay";

export const optionsChronicleName = "The Expiration Tape";
export const optionsCharacterName = "Mara Vale";
export const optionsPrologueDate = "Monday, October 27, 1997";

export const optionsStory = {
  prologue:
    "Mara Vale is a junior clerk on a Chicago options desk when her late Aunt June leaves her a locked quote case, $100,000, and a stack of headline sheets dated through the next decade. Every page is stamped with an expiration code instead of a page number.",
  hook:
    "Aunt June's note is simple: 'Headlines tell you direction. Options ask how far, how fast, and what it cost to be wrong.' Mara decides to test the tape one future page at a time.",
  howTo:
    "Pick a future headline date, choose one of four option positions, then press Play. The position holds until that future date.",
  journal:
    "Mara keeps the quote case under her desk and writes down what the headlines taught her: calls can make a small account feel huge, puts are only cheap until everyone wants them, and straddles turn uncertainty into a price tag.",
  ending:
    "Ten years later, Mara has learned the uncomfortable lesson Aunt June buried inside the tape: knowing the future headline is not the same as knowing the trade. The best options traders were not just right about the news. They were right about the move, the timing, and the price of being early.",
};

export const optionsDashboardGuideItems: DashboardGuideItem[] = [
  {
    target: "timeline",
    arrowTargets: ["timeline", "headline-deck", "date-rolodex"],
    arrowTargetNudges: { timeline: { y: -2 }, "headline-deck": { x: 54, y: -10 }, "date-rolodex": { y: -6 } },
    title: "1. Pick Date",
    body: "Date: drag the timeline, scroll headlines, or use the quote-wheel date to choose a future expiration.",
    placement: "bottom",
    nudge: { x: 0, y: -34 },
    mobilePlacement: "bottom",
    mobileNudge: { x: 0, y: -44 },
    widePlacement: "bottom",
    wideNudge: { x: 0, y: -42 },
    spotTargets: ["timeline", "headline-deck", "date-rolodex"],
  },
  {
    target: "advance-game",
    title: "2. Hit Play",
    body: "Advance time with the selected option strategy to the future headline.",
    placement: "right",
    nudge: { x: -18, y: 2 },
    mobilePlacement: "bottom",
    mobileNudge: { x: 58, y: -66 },
    widePlacement: "bottom",
    wideNudge: { x: 0, y: -32 },
    variant: "primary",
  },
  {
    target: "journal",
    title: "Journal",
    body: "Optional story notes from Mara's desk.",
    placement: "top",
    nudge: { x: 0, y: -8 },
    mobilePlacement: "top",
    mobileNudge: { x: -22, y: -16 },
    widePlacement: "top",
    wideNudge: { x: 16, y: -10 },
  },
  {
    target: "ledger-button",
    title: "Ledger",
    body: "Track premiums, payoff, taxes, and benchmarks.",
    placement: "top",
    nudge: { x: 0, y: -8 },
    mobilePlacement: "top",
    mobileNudge: { x: 70, y: -16 },
    widePlacement: "top",
    wideNudge: { x: 24, y: -10 },
  },
];
