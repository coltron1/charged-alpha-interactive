import type { DashboardGuideItem } from "../../../shared/game-ui/TargetGuideOverlay";

export const optionsChronicleName = "The Expiration Tape";
export const optionsCharacterName = "Mara Vale";
export const optionsPrologueDate = "Monday, October 27, 1997";

export const optionsStory = {
  prologue:
    "Mara Vale is a junior clerk on a Chicago options desk when her late Aunt June leaves her a locked quote case, $100,000, and a stack of headline sheets dated through the next decade. Every page is stamped with an expiration code instead of a page number.",
  hook:
    "Aunt June's note is simple: 'Headlines tell you direction. Options ask how far, how fast, and what the market already charged for fear.' Mara decides to test the tape one future page at a time.",
  howTo:
    "Pick a future headline date, choose one of four option positions, then press Play. The position holds until that future date.",
  journal:
    "Mara keeps the quote case under her desk and writes down what the headlines taught her: calls can make a small account feel huge, puts are only cheap until everyone wants them, and straddles turn uncertainty into a price tag.",
  ending:
    "Seven years later, Mara has learned the uncomfortable lesson Aunt June buried inside the tape: knowing the future headline is not the same as knowing the trade. The best options traders were not just right about the news. They were right about the move, the timing, and the premium the options market had already priced in.",
};

export const optionsDashboardGuideItems: DashboardGuideItem[] = [
  {
    target: "timeline",
    arrowTargets: ["timeline", "headline-deck"],
    arrowTargetNudges: { timeline: { y: -2 }, "headline-deck": { x: 54, y: -10 } },
    title: "1. Pick Date",
    body: "Drag the timeline or scroll the headline display. Click the headline to read the full article.",
    placement: "bottom",
    nudge: { x: 0, y: -34 },
    mobilePlacement: "top",
    mobileNudge: { x: 0, y: 38 },
    widePlacement: "bottom",
    wideNudge: { x: 0, y: -42 },
    spotTargets: ["timeline", "headline-deck"],
  },
  {
    target: "allocation-buttons",
    title: "2. Read Option",
    body: "Pick an option below. The payoff graphic shows where it wins after premium is paid.",
    placement: "top",
    nudge: { x: 0, y: 16 },
    mobilePlacement: "top",
    mobileNudge: { x: 0, y: 40 },
    widePlacement: "top",
    wideNudge: { x: 0, y: 18 },
    variant: "primary",
  },
  {
    target: "advance-game",
    arrowTargetNudges: { "advance-game": { x: 96, y: -14 } },
    title: "3. Hit Play",
    body: "Advance time with the selected option strategy to the future headline.",
    placement: "top",
    nudge: { x: 84, y: 2 },
    mobilePlacement: "top",
    mobileNudge: { x: 80, y: 4 },
    widePlacement: "top",
    wideNudge: { x: 86, y: 4 },
    variant: "primary",
  },
  {
    target: "journal",
    title: "Journal",
    body: "Optional story notes from Mara's desk.",
    placement: "top",
    nudge: { x: 0, y: -8 },
    mobilePlacement: "top",
    mobileNudge: { x: -22, y: 35 },
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
    mobileNudge: { x: 70, y: 35 },
    widePlacement: "top",
    wideNudge: { x: 24, y: -10 },
  },
];

export const optionsCompactDashboardGuideItems: DashboardGuideItem[] = [
  {
    ...optionsDashboardGuideItems[0],
    arrowTargets: ["timeline", "selected-front-page-article"],
    arrowTargetNudges: { timeline: { y: -2 }, "selected-front-page-article": { x: 24, y: -10 } },
    body: "Drag the timeline to choose a future expiration. Click the headline to read the full article.",
    spotTargets: ["timeline", "selected-front-page-article"],
  },
  ...optionsDashboardGuideItems.slice(1),
];
