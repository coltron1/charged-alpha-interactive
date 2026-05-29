import type { DashboardGuideItem } from "../../../shared/game-ui/TargetGuideOverlay";

export const defaultSeed = "mercer-future-papers";
export const chronicleName = "The Sentinel";

export const finalChapterHeadline = "Twenty years later, Grandpa's last edition arrives";
export const finalChapterDeck =
  "The Sentinel archive calls for help during a sudden storm, and the old front pages finally become ordinary paper everybody can read.";
export const finalChapterSummary =
  "On October 26, 2007, the Sentinel calls about water in the basement, archive boxes at risk, and a violent storm moving in fast. In the Front Page Hall, Jonah sees empty display frames whose brass-corner marks match every impossible page from Grandpa's briefcase. Grandpa's gold Rolex and the Sentinel clock both hit 3:17, the west window gives way, and Grandpa appears long enough to shove Jonah out of the falling tree's path.";
export const finalChapterJournal =
  "The last day did not feel like a finish line. It felt like the Sentinel had sprung a leak in every century at once. Mara was already in the basement with volunteers, passing archive boxes up the stairs while I did the heroic work of slipping on the same wet step twice.\n\nThe Front Page Hall finally gave up the trick. This was the same wall that had been feeding the town its big stories for twenty years, one clipping at a time. Every empty frame matched the brass-corner rubbings from the pages in the briefcase. Grandpa had not collected old newspapers at all. He had taken tomorrow's lobby pages during one borrowed minute and carried them back into yesterday.\n\nThe gold Rolex warmed on my wrist. The Sentinel clock clicked to 3:17, and the watch clicked with it. Then the west window bowed inward like the storm had put a shoulder to it. I saw Grandpa by the display rail, soaked coat, press badge cracked, eyes wide with the same surprise I felt. He shoved me sideways just as a tree came through the glass. I hit the floor hard. The trunk caught him across the head, and for one instant he looked both twenty years dead and right there in front of me.\n\nThen he was gone. No speech, no tidy answer, no lesson wrapped in a bow. Just rain, broken glass, Mara yelling my name, and the horrible understanding that the accident in 1987 had been caused by him saving me in 2007.\n\nAt Ruth's kitchen table later, Eli, Ruth, Nora, Max, Mara, and I could all read the pages the same way. Not magic anymore. History. We passed the briefcase around like a family photo album with worse filing standards, and nobody knew whether to laugh, cry, or invoice the universe for emotional damages.";

export const landmarkEventIds = new Set([
  "berlin-wall-opens-as-cold-war-assumptions-",
  "south-africa-holds-its-first-all-race-democratic",
  "hong-kong-returns-to-chinese-sovereignty-after-1",
  "nyse-reopens-after-september-11-attacks",
  "indian-ocean-tsunami-devastates-coastlines-acros",
  "subprime-losses-freeze-credit-markets-and-",
]);

export const dashboardGuideItems: DashboardGuideItem[] = [
  {
    target: "timeline",
    arrowTargets: ["timeline", "headline-deck", "date-rolodex"],
    arrowTargetNudges: { timeline: { y: -2 }, "headline-deck": { x: 54, y: -10 }, "date-rolodex": { y: -6 } },
    title: "1. Pick Date",
    body: "Date: drag along the timeline or scroll through the headline stack to choose the future headline article.",
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
    body: "Advance time with the selected allocation to the future headline article.",
    placement: "right",
    nudge: { x: -18, y: 2 },
    mobilePlacement: "bottom",
    mobileNudge: { x: 58, y: -66 },
    widePlacement: "bottom",
    wideNudge: { x: 0, y: -32 },
    variant: "primary",
  },
  {
    target: "chapter-index",
    title: "Chapter Index",
    body: "Open the wheel to browse future front pages by year, expand a year, read a page, or play that date.",
    placement: "top",
    nudge: { x: 32, y: -10 },
    mobilePlacement: "top",
    mobileNudge: { x: 48, y: -12 },
    widePlacement: "left",
    wideNudge: { x: 8, y: -4 },
  },
  {
    target: "journal",
    title: "Journal",
    body: "Optional story context. Read Jonah's life between the front pages.",
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
    body: "Track Jonah's balance, allocation, taxes, and family comparisons.",
    placement: "top",
    nudge: { x: 0, y: -8 },
    mobilePlacement: "top",
    mobileNudge: { x: 70, y: -16 },
    widePlacement: "top",
    wideNudge: { x: 24, y: -10 },
  },
];
