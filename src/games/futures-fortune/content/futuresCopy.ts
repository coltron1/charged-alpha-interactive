import type { DashboardGuideItem } from "../../../shared/game-ui/TargetGuideOverlay";

export const futuresChronicleName = "The Grain Dispatch";
export const futuresCharacterName = "Riley Bell";
export const futuresPrologueDate = "Friday, August 6, 2010";

export const futuresStory = {
  prologue:
    "Riley Bell inherits $100,000 and her granddad's locked grain ledger, the one he kept in the back office of Bell County Elevator. Inside are future front pages about droughts, floods, trade wars, crop reports, and one storm that has not happened yet.",
  hook:
    "Granddad's note is blunt: 'The fields tell one story. The futures board tells another. Use the pages, but respect the size of the promise.' Riley decides to test the inheritance one grain headline at a time.",
  howTo:
    "Pick a future headline date, choose Treasury Bills, Corn Futures, Soybean Futures, or Wheat Futures, then press Play. The position holds until that future date.",
  journal:
    "Riley keeps the grain ledger under the old scale desk and writes down what each clipping teaches her: weather can move first, government reports can move faster, and trade policy can turn a good crop into a bad price.",
  ending:
    "Ten years later, Riley understands the joke hidden in her granddad's ledger. Future headlines help, but futures trading is still a contest between timing, contract size, patience, and humility. Some years the smartest trade is a corn contract. Some years it is soybeans. Some years it is closing the ledger and letting the storm pass.",
};

export const futuresDashboardGuideItems: DashboardGuideItem[] = [
  {
    target: "timeline",
    arrowTargets: ["timeline", "headline-deck"],
    arrowTargetNudges: { timeline: { y: -2 }, "headline-deck": { x: 54, y: -10 } },
    title: "1. Pick Date",
    body: "Drag the timeline or scroll the headline stack. The clipping preview shows the future page Riley will trade toward.",
    placement: "bottom",
    nudge: { x: 0, y: -34 },
    mobilePlacement: "bottom",
    mobileNudge: { x: 0, y: -44 },
    widePlacement: "bottom",
    wideNudge: { x: 0, y: -42 },
    spotTargets: ["timeline", "headline-deck"],
  },
  {
    target: "allocation-buttons",
    title: "2. Choose Position",
    body: "Pick Treasury Bills or one grain future. Crop choices buy whole modeled contracts and leftover cash stays in bills.",
    placement: "top",
    nudge: { x: -12, y: -12 },
    mobilePlacement: "top",
    mobileNudge: { x: 0, y: -16 },
    widePlacement: "top",
    wideNudge: { x: -10, y: -12 },
    spotTargets: ["allocation-buttons"],
  },
  {
    target: "advance-game",
    title: "3. Hit Play",
    body: "Hold the selected position until the chosen future headline, then see how the account settles.",
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
    body: "Optional story notes from Riley's elevator office.",
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
    body: "Track grain positions, taxes, and benchmarks.",
    placement: "top",
    nudge: { x: 0, y: -8 },
    mobilePlacement: "top",
    mobileNudge: { x: 70, y: -16 },
    widePlacement: "top",
    wideNudge: { x: 24, y: -10 },
  },
];

export const futuresCompactDashboardGuideItems: DashboardGuideItem[] = [
  {
    ...futuresDashboardGuideItems[0],
    arrowTargets: ["timeline", "selected-front-page-article"],
    arrowTargetNudges: { timeline: { y: -2 }, "selected-front-page-article": { x: 24, y: -10 } },
    body: "Drag the timeline to choose a future grain headline. The larger clipping above shows the selected page.",
    spotTargets: ["timeline", "selected-front-page-article"],
  },
  ...futuresDashboardGuideItems.slice(1),
];
