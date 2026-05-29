import {
  Castle,
  Play,
  RotateCcw,
  ScrollText,
  Shield,
  Skull,
} from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  boardEntities,
  boardIds,
  commitBoardPlan,
  createBeforeSiege,
  finalYear,
  getBoardEntity,
  getHeadlineByYear,
  getNextTargetYear,
  omenLabels,
  resourceIds,
  resourceLabels,
  scoreSnapshot,
  type BeforeSiegeState,
  type BoardId,
  type BoardPlanAction,
  type EventReport,
  type OmenKind,
  type OrderId,
  type ResourceId,
  type ResourceStock,
  type SiegeEvent,
} from "./simulation/beforeSiege";
import { assetUrl } from "../../shared/assets";

const defaultSeed = "northwatch-winter-01";

const omenImagePath = assetUrl("games/before-siege/omens/");

const eventOmenImages = [
  ["blackwinter-storm", "famine-field"],
  ["dry-summer", "famine-field"],
  ["elk-guides-vanish", "famine-family"],
  ["branch-grain-hoard", "famine-soup"],
  ["branch-refugee-fires", "famine-family"],
  ["wolf-road-raid", "attack-caravan"],
  ["ironhall-border", "attack-army"],
  ["blackpine-ambush", "attack-caravan"],
  ["ice-fever", "sickness-healer"],
  ["whiteford-healers", "sickness-infirmary"],
  ["branch-wall-labor", "sickness-infirmary"],
  ["granary-fire", "unrest-granary"],
  ["whiteford-sermon", "unrest-council"],
  ["lost-heir", "unrest-council"],
  ["market-riot", "unrest-market"],
  ["silvermere-embargo", "unrest-market"],
  ["branch-coin-lords", "unrest-council"],
  ["branch-pact-rumors", "unrest-council"],
  ["southern-caravan", "opportunity-caravan"],
  ["mild-winters", "opportunity-fair"],
  ["iron-vein", "opportunity-mine"],
  ["marriage-pact", "opportunity-treaty"],
  ["salt-road-fair", "opportunity-fair"],
  ["tribe-peace", "opportunity-treaty"],
  ["frozen-pass-beacon", "opportunity-mine"],
  ["great-siege", "darkness-army"],
] as const;

const omenFallbackImages: Record<OmenKind, string[]> = {
  famine: ["famine-field", "famine-family", "famine-orchard", "famine-soup"],
  attack: ["attack-pass", "attack-gate", "attack-caravan", "attack-army"],
  sickness: ["sickness-healer", "sickness-ward", "sickness-infirmary"],
  unrest: ["unrest-market", "unrest-council", "unrest-granary"],
  opportunity: ["opportunity-caravan", "opportunity-mine", "opportunity-treaty", "opportunity-fair"],
  darkness: ["darkness-army", "darkness-watch"],
};

type SiegeVisionMode = "watch" | "screen" | "panel";
type FeedbackTone = "good" | "warning" | "bad";

function getSiegeVisionMode(): SiegeVisionMode {
  if (typeof window === "undefined") {
    return "watch";
  }

  const mode = new URLSearchParams(window.location.search).get("siegeVision");

  if (mode === "screen" || mode === "panel") {
    return mode;
  }

  return "watch";
}

function getOmenImageName(event: SiegeEvent) {
  const matchedImage = eventOmenImages.find(([eventId]) => event.id.includes(eventId))?.[1];

  if (matchedImage) {
    return matchedImage;
  }

  const fallback = omenFallbackImages[event.omen];
  return fallback[event.year % fallback.length];
}

function getOmenImageUrl(event: SiegeEvent) {
  return `${omenImagePath}${getOmenImageName(event)}.webp`;
}

const wheelYears = Array.from({ length: finalYear + 1 }, (_, year) => year);
const wheelStep = 360 / (finalYear + 1);
const minSpinVelocity = 0.012;
const spinFriction = 0.93;

function closestRotationForYear(year: number, currentRotation: number) {
  const baseRotation = year * wheelStep;
  const turns = Math.round((currentRotation - baseRotation) / 360);
  return baseRotation + turns * 360;
}

function yearFromRotation(rotation: number, currentYear: number) {
  const normalized = ((rotation % 360) + 360) % 360;
  const rawYear = Math.round(normalized / wheelStep) % (finalYear + 1);

  if (rawYear <= currentYear) {
    return Math.min(finalYear, currentYear + 1);
  }

  return Math.min(finalYear, rawYear);
}

function clampYearForState(state: BeforeSiegeState, year: number) {
  if (state.currentYear >= finalYear) {
    return finalYear;
  }

  return Math.max(state.currentYear + 1, Math.min(finalYear, year));
}

function resourceDeltaLines(deltas: Partial<ResourceStock>) {
  return resourceIds
    .filter((id) => deltas[id])
    .map((id) => `${deltas[id]! > 0 ? "+" : ""}${deltas[id]} ${resourceLabels[id].label}`);
}

function boardDeltaLines(deltas: Partial<Record<BoardId, number>>) {
  return boardIds
    .filter((id) => deltas[id])
    .map((id) => `${deltas[id]! > 0 ? "+" : ""}${deltas[id]} ${getBoardEntity(id).name}`);
}

function formatDeltas(resourceDeltas: Partial<ResourceStock>, boardDeltas: Partial<Record<BoardId, number>> = {}) {
  const lines = [...resourceDeltaLines(resourceDeltas), ...boardDeltaLines(boardDeltas)];
  return lines.length ? lines.join(" / ") : "No visible change";
}

function compactHeadline(headline: string) {
  const words = headline.replace(/^Bent: /, "").split(" ");
  return words.slice(0, 2).join(" ");
}

function signedNumber(value: number) {
  return value > 0 ? `+${value}` : `${value}`;
}

function getTimelinePercent(year: number) {
  return Math.max(0, Math.min(100, (year / finalYear) * 100));
}

function getPrimaryReport(state: BeforeSiegeState) {
  const reports = state.lastReport?.reports ?? [];
  return reports.find((report) => report.event.year === state.lastReport?.toYear) ?? reports[reports.length - 1];
}

function getFeedbackTone(state: BeforeSiegeState): FeedbackTone {
  if (state.phase === "complete" || state.finalReport?.survived) {
    return "good";
  }

  if (state.phase === "lost") {
    return "bad";
  }

  const result = getPrimaryReport(state)?.result;

  if (result === "prepared" || result === "capitalized") {
    return "good";
  }

  if (result === "unprepared") {
    return "bad";
  }

  return "warning";
}

function getFeedbackTitle(state: BeforeSiegeState) {
  if (state.finalReport) {
    return state.finalReport.survived ? "Survived the Siege" : "Northwatch Fell";
  }

  const result = getPrimaryReport(state)?.result;

  if (result === "prepared") {
    return "Prepared";
  }

  if (result === "capitalized") {
    return "Opportunity Seized";
  }

  if (result === "narrow") {
    return "Narrow Survival";
  }

  if (result === "unprepared") {
    return "Unprepared";
  }

  if (result === "missed") {
    return "Opportunity Missed";
  }

  return "Jump Resolved";
}

function getRiskStatus(state: BeforeSiegeState) {
  const emptyCount = resourceIds.filter((id) => state.resources[id] <= 0).length;
  const lowCount = resourceIds.filter((id) => state.resources[id] <= 1).length;
  const riskScore = Math.min(3, emptyCount * 2 + Math.max(0, lowCount - 1) + (state.fateStrain >= 2 ? 1 : 0));

  if (state.phase === "lost" || emptyCount > 0) {
    return { level: "critical", label: "Critical", detail: `${emptyCount || 1} collapse point` };
  }

  if (riskScore >= 3) {
    return { level: "danger", label: "Danger", detail: `${lowCount} weak stores` };
  }

  if (riskScore >= 1) {
    return { level: "watch", label: "Watch", detail: lowCount > 0 ? `${lowCount} low stores` : "fate strain" };
  }

  return { level: "safe", label: "Stable", detail: "No weak stores" };
}

function getScoreTotal(state: BeforeSiegeState) {
  return state.finalReport?.score ?? scoreSnapshot(state).total;
}

function nearestFutureYearFromPercent(state: BeforeSiegeState, percent: number) {
  const availableYears = state.events
    .map((event) => event.year)
    .filter((year) => year > state.currentYear)
    .sort((a, b) => a - b);
  const targetYear = (Math.max(0, Math.min(100, percent)) / 100) * finalYear;

  return availableYears.reduce((nearestYear, year) =>
    Math.abs(year - targetYear) < Math.abs(nearestYear - targetYear) ? year : nearestYear,
  availableYears[0] ?? finalYear);
}

function Pips({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="siege-pips" aria-label={`${value} of ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span className={index < value ? "filled" : ""} key={index} />
      ))}
    </span>
  );
}

type KingdomPart = {
  id: string;
  label: string;
  value: number;
  full: string;
  weak: string;
  empty: string;
};

type BoardActionId = "fieldGranary" | "gateWall" | "passGuard" | "wardHealers" | "marketCarts" | "ironBanner" | "elkScouts";

interface BoardAction {
  id: BoardActionId;
  label: string;
  shortLabel: string;
  boardId: BoardId;
  orderId: OrderId;
  omens: OmenKind[];
  resources: ResourceId[];
}

const boardActionLimit = 3;

const boardActions: BoardAction[] = [
  {
    id: "fieldGranary",
    label: "Raise Granary",
    shortLabel: "Granary",
    boardId: "outerFarms",
    orderId: "stockpile",
    omens: ["famine", "darkness"],
    resources: ["food", "people"],
  },
  {
    id: "gateWall",
    label: "Raise Gate Wall",
    shortLabel: "Wall",
    boardId: "northwatch",
    orderId: "fortify",
    omens: ["attack", "unrest", "darkness"],
    resources: ["defense", "control"],
  },
  {
    id: "passGuard",
    label: "Muster Pass Guard",
    shortLabel: "Guard",
    boardId: "frozenPass",
    orderId: "fortify",
    omens: ["attack", "darkness"],
    resources: ["defense", "people"],
  },
  {
    id: "wardHealers",
    label: "Light Healer Ward",
    shortLabel: "Healers",
    boardId: "whiteford",
    orderId: "shelter",
    omens: ["sickness", "unrest"],
    resources: ["people", "hope"],
  },
  {
    id: "marketCarts",
    label: "Ready Market Carts",
    shortLabel: "Carts",
    boardId: "saltRoad",
    orderId: "prosper",
    omens: ["opportunity", "famine"],
    resources: ["wealth", "food"],
  },
  {
    id: "ironBanner",
    label: "Signal Ironhall",
    shortLabel: "Banner",
    boardId: "ironhall",
    orderId: "ally",
    omens: ["attack", "darkness", "opportunity"],
    resources: ["defense", "control"],
  },
  {
    id: "elkScouts",
    label: "Call Elk Scouts",
    shortLabel: "Scouts",
    boardId: "elkClan",
    orderId: "ally",
    omens: ["famine", "attack", "opportunity"],
    resources: ["food", "hope"],
  },
];

function getKingdomCondition(state: BeforeSiegeState) {
  const values = resourceIds.map((id) => state.resources[id]);
  const empty = values.filter((value) => value <= 0).length;
  const low = values.filter((value) => value <= 1).length;

  if (state.phase === "lost" || empty >= 2) {
    return { level: "critical", label: "Breaking", detail: "Northwatch is close to collapse" };
  }

  if (empty >= 1 || low >= 4) {
    return { level: "danger", label: "Strained", detail: "Too many parts of the city are failing" };
  }

  if (low >= 2 || state.fateStrain >= 2) {
    return { level: "watch", label: "Uneasy", detail: "The city still stands, but fate is pushing back" };
  }

  return { level: "safe", label: "Holding", detail: "The city has breathing room" };
}

function getKingdomParts(state: BeforeSiegeState): KingdomPart[] {
  return [
    {
      id: "farms",
      label: "Farms",
      value: state.resources.food,
      full: "full fields",
      weak: "thin stores",
      empty: "famine",
    },
    {
      id: "walls",
      label: "Walls",
      value: state.resources.defense,
      full: "towers manned",
      weak: "cracked gates",
      empty: "open breach",
    },
    {
      id: "homes",
      label: "Homes",
      value: state.resources.people,
      full: "lanterns lit",
      weak: "empty streets",
      empty: "abandoned",
    },
    {
      id: "market",
      label: "Market",
      value: state.resources.wealth,
      full: "busy road",
      weak: "quiet stalls",
      empty: "no trade",
    },
    {
      id: "hearth",
      label: "Hearth",
      value: state.resources.hope,
      full: "songs rising",
      weak: "fearful",
      empty: "despair",
    },
    {
      id: "keep",
      label: "Keep",
      value: state.resources.control,
      full: "banner high",
      weak: "court whispers",
      empty: "crown broken",
    },
  ];
}

function partPhrase(part: KingdomPart) {
  if (part.value <= 0) {
    return part.empty;
  }

  if (part.value <= 1) {
    return part.weak;
  }

  return part.full;
}

function getBoardAction(actionId: BoardActionId) {
  return boardActions.find((action) => action.id === actionId) ?? boardActions[0];
}

function getBoardActionHeat(event: SiegeEvent, action: BoardAction) {
  const targetHit = event.boardId === action.boardId ? 2 : 0;
  const omenHit = action.omens.includes(event.omen) ? 1 : 0;
  const pressureHit = action.resources.some((id) => event.pressure.includes(id)) ? 1 : 0;
  const orderHit = event.goodOrders.includes(action.orderId) ? 1 : 0;

  return targetHit + omenHit + pressureHit + orderHit;
}

function getBoardActionPlan(actionIds: BoardActionId[]): BoardPlanAction[] {
  return actionIds.slice(0, boardActionLimit).map((actionId) => {
    const action = getBoardAction(actionId);
    return { orderId: action.orderId, targetId: action.boardId };
  });
}

function getBoardPlanReadiness(event: SiegeEvent, actionIds: BoardActionId[]) {
  const heat = actionIds.reduce((total, actionId) => total + getBoardActionHeat(event, getBoardAction(actionId)), 0);

  if (heat >= 8) {
    return { level: "strong", label: "Strong Answer" };
  }

  if (heat >= 5) {
    return { level: "ready", label: "Covered" };
  }

  if (heat >= 2) {
    return { level: "thin", label: "Thin" };
  }

  return { level: "blind", label: "Open" };
}

function squareMarkerPosition(year: number) {
  const sideProgress = year / (finalYear + 1);
  const position = sideProgress * 4;
  const side = Math.floor(position);
  const offset = position - side;

  if (side === 0) {
    return { left: `${8 + offset * 84}%`, top: "0%" };
  }

  if (side === 1) {
    return { left: "100%", top: `${8 + offset * 84}%` };
  }

  if (side === 2) {
    return { left: `${92 - offset * 84}%`, top: "100%" };
  }

  return { left: "0%", top: `${92 - offset * 84}%` };
}

type BoardGraphicKind =
  | "banner"
  | "cart"
  | "castle"
  | "cavalry"
  | "farm"
  | "forest"
  | "granary"
  | "healer"
  | "hearth"
  | "homes"
  | "market"
  | "pass"
  | "scout"
  | "wall";

const boardActionGraphics: Record<BoardActionId, BoardGraphicKind> = {
  fieldGranary: "granary",
  gateWall: "wall",
  passGuard: "cavalry",
  wardHealers: "healer",
  marketCarts: "cart",
  ironBanner: "banner",
  elkScouts: "scout",
};

type BoardRouteId =
  | "darkness"
  | "famine"
  | "ironhallAttack"
  | "opportunity"
  | "passAttack"
  | "plague"
  | "raid"
  | "unrest";

type BoardTileId = "farms" | "forest" | "gate" | "hearth" | "homes" | "ironhall" | "keep" | "market" | "pass" | "ward";

interface BoardCircuitRoute {
  id: BoardRouteId;
  label: string;
  points: number[][];
  sourceTile: BoardTileId;
  source: string;
  targetTile: BoardTileId;
  target: string;
}

const boardCircuitRoutes: BoardCircuitRoute[] = [
  {
    id: "ironhallAttack",
    label: "Ironhall attack line",
    points: [
      [70, 10],
      [70, 20],
      [50, 20],
      [50, 30],
    ],
    sourceTile: "ironhall",
    source: "Ironhall",
    targetTile: "gate",
    target: "Gate",
  },
  {
    id: "passAttack",
    label: "Pass attack line",
    points: [
      [90, 10],
      [90, 20],
      [50, 20],
      [50, 30],
    ],
    sourceTile: "pass",
    source: "Pass",
    targetTile: "gate",
    target: "Gate",
  },
  {
    id: "darkness",
    label: "Dark army road",
    points: [
      [90, 10],
      [90, 20],
      [50, 20],
      [50, 50],
    ],
    sourceTile: "pass",
    source: "Pass",
    targetTile: "keep",
    target: "Northwatch",
  },
  {
    id: "plague",
    label: "Sickness line",
    points: [
      [10, 70],
      [10, 50],
      [10, 30],
    ],
    sourceTile: "homes",
    source: "Homes",
    targetTile: "ward",
    target: "Ward",
  },
  {
    id: "famine",
    label: "Grain line",
    points: [
      [20, 90],
      [20, 82],
    ],
    sourceTile: "farms",
    source: "Farms",
    targetTile: "farms",
    target: "Granary",
  },
  {
    id: "unrest",
    label: "Market unrest line",
    points: [
      [90, 70],
      [70, 70],
      [70, 50],
      [50, 50],
    ],
    sourceTile: "market",
    source: "Market",
    targetTile: "keep",
    target: "Keep",
  },
  {
    id: "opportunity",
    label: "Trade road",
    points: [
      [8, 70],
      [30, 70],
      [60, 70],
      [90, 70],
    ],
    sourceTile: "homes",
    source: "Road",
    targetTile: "market",
    target: "Market",
  },
  {
    id: "raid",
    label: "Raid road",
    points: [
      [92, 70],
      [70, 70],
      [40, 70],
      [10, 70],
    ],
    sourceTile: "market",
    source: "Road",
    targetTile: "homes",
    target: "Homes",
  },
];

function routePoints(points: number[][]) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function BoardGraphic({ kind }: { kind: BoardGraphicKind }) {
  if (kind === "castle") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M18 82V36h12V22h12v14h16V22h12v14h12v46z" />
        <path d="M38 82V58c0-9 24-9 24 0v24z" />
        <path d="M18 36h64M30 36h40M42 22h16" />
      </svg>
    );
  }

  if (kind === "cavalry") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M17 66c9-23 30-25 48-19l13-10 5 8-9 10c3 8 0 16-8 23" />
        <path d="M28 72l-4 14M45 72l-2 14M63 70l8 14" />
        <circle cx="34" cy="33" r="7" />
        <path d="M36 40l12 18 14-1M45 28l13 8M58 21l3 18" />
      </svg>
    );
  }

  if (kind === "granary") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M18 84V34l32-18 32 18v50z" />
        <path d="M30 84V45h40v39M30 45h40M38 84V45M50 84V45M62 84V45" />
        <path d="M22 34h56M39 27h22" />
      </svg>
    );
  }

  if (kind === "wall") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M14 80V38h12V26h12v12h24V26h12v12h12v42z" />
        <path d="M14 52h72M26 38v42M50 38v42M74 38v42" />
        <path d="M39 80V64c0-8 22-8 22 0v16z" />
      </svg>
    );
  }

  if (kind === "healer") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M20 76h60V34H20z" />
        <path d="M38 34V24h24v10M50 43v24M38 55h24" />
        <circle cx="72" cy="24" r="9" />
      </svg>
    );
  }

  if (kind === "cart") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M17 56h54l11-18h8" />
        <path d="M25 56V35h40v21M31 35v21M45 35v21M59 35v21" />
        <circle cx="31" cy="70" r="9" />
        <circle cx="67" cy="70" r="9" />
      </svg>
    );
  }

  if (kind === "scout") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M19 69c12-20 29-22 45-14l12-9 6 8-9 10c2 7-1 13-8 18" />
        <path d="M31 74l-5 12M48 73l-3 13M63 72l7 14" />
        <circle cx="42" cy="34" r="7" />
        <path d="M44 41l10 18M30 31l27 2" />
      </svg>
    );
  }

  if (kind === "farm") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M16 80c12-23 25-34 34-48 9 14 22 25 34 48z" />
        <path d="M28 80c6-16 13-25 22-39 9 14 16 23 22 39M50 41v39M35 61h30" />
      </svg>
    );
  }

  if (kind === "forest") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M24 78l16-52 16 52zM50 78l17-58 17 58z" />
        <path d="M40 78v12M67 78v12" />
      </svg>
    );
  }

  if (kind === "homes") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M14 80V45l18-15 18 15v35zM50 80V42l21-17 21 17v38z" />
        <path d="M27 80V61h12v19M65 80V61h14v19" />
      </svg>
    );
  }

  if (kind === "market") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M18 38h64l-7-16H25z" />
        <path d="M22 38v42h56V38M22 54h56M36 38v42M50 38v42M64 38v42" />
      </svg>
    );
  }

  if (kind === "pass") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M13 81l20-54 17 32 17-38 20 60z" />
        <path d="M40 81c8-15 13-18 21-30M31 43l9 16M60 39l9 20" />
      </svg>
    );
  }

  if (kind === "hearth") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M29 78c-12-22 8-36 18-54 1 16 19 21 20 38 6-5 9-12 8-20 16 17 10 40-8 46" />
        <path d="M43 82c-5-12 5-20 10-31 2 11 12 13 11 24" />
      </svg>
    );
  }

  if (kind === "banner") {
    return (
      <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M31 88V16" />
        <path d="M31 18h44l-10 15 10 15H31z" />
        <path d="M20 88h28" />
      </svg>
    );
  }

  return (
    <svg className="board-graphic" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 14l10 24 26 2-20 17 7 27-23-15-23 15 7-27-20-17 26-2z" />
    </svg>
  );
}

function getBoardRoute(event: SiegeEvent) {
  let routeId: BoardRouteId;

  if (event.omen === "sickness") {
    routeId = "plague";
  } else if (event.omen === "famine") {
    routeId = "famine";
  } else if (event.omen === "unrest") {
    routeId = "unrest";
  } else if (event.omen === "opportunity") {
    routeId = "opportunity";
  } else if (event.omen === "darkness") {
    routeId = "darkness";
  } else if (event.boardId === "wolfBanner" || event.boardId === "saltRoad") {
    routeId = "raid";
  } else if (event.boardId === "ironhall") {
    routeId = "ironhallAttack";
  } else {
    routeId = "passAttack";
  }

  return boardCircuitRoutes.find((route) => route.id === routeId) ?? boardCircuitRoutes[0];
}

function getActionCue(selected: boolean, isAnswer: boolean, heat: number) {
  if (selected) {
    return "Lit";
  }

  if (isAnswer) {
    return "Hit";
  }

  if (heat === 1) {
    return "Helps";
  }

  return "Wait";
}

function KingdomBoard({
  event,
  onToggleAction,
  scoreDelta,
  selectedActions,
  state,
}: {
  event: SiegeEvent;
  onToggleAction: (actionId: BoardActionId) => void;
  scoreDelta: number;
  selectedActions: BoardActionId[];
  state: BeforeSiegeState;
}) {
  const condition = getKingdomCondition(state);
  const parts = getKingdomParts(state);
  const allies = boardEntities.filter((entity) => ["rival", "tribe"].includes(entity.group) && state.board[entity.id] >= 3);
  const brokenRoutes = boardEntities.filter((entity) => ["route", "frontier"].includes(entity.group) && state.board[entity.id] <= 0);
  const readiness = getBoardPlanReadiness(event, selectedActions);
  const primaryReport = getPrimaryReport(state);
  const resultSummary = state.finalReport?.story ?? primaryReport?.summary;
  const route = getBoardRoute(event);
  const inactiveRoutes = boardCircuitRoutes.filter((circuit) => circuit.id !== route.id);
  const answerActions = boardActions
    .map((action) => ({ action, heat: getBoardActionHeat(event, action) }))
    .filter(({ heat }) => heat >= 2)
    .sort((left, right) => right.heat - left.heat)
    .slice(0, boardActionLimit);
  const answerActionIds = new Set(answerActions.map(({ action }) => action.id));
  const answerLabels = answerActions.map(({ action }) => action.shortLabel).join(" + ");
  const objectiveTone = event.omen === "opportunity" ? "chance" : "danger";
  const objectiveVerb = event.omen === "opportunity" ? "Use" : "Hit";
  const tileClass = (tileId: BoardTileId, level: number) => [
    "map-tile",
    `tile-${tileId}`,
    `level-${level}`,
    route.sourceTile === tileId ? "route-source" : "",
    route.targetTile === tileId ? "route-target" : "",
  ].filter(Boolean).join(" ");

  return (
    <section className={`kingdom-board-panel condition-${condition.level}`} aria-label="Living kingdom board">
      <div className="kingdom-board-heading">
        <span>{condition.label}</span>
        <strong>{event.title}</strong>
        <em>{readiness.label} · {selectedActions.length}/{boardActionLimit} lit</em>
        <div className={`board-objective-row objective-${objectiveTone}`}>
          <b>{objectiveTone === "chance" ? "Gain" : "Danger"}: {route.target}</b>
          <i>{objectiveVerb}: {answerLabels || "Any light"}</i>
        </div>
      </div>
      <div className={`kingdom-stage fate-${state.fateStrain} omen-${event.omen} event-${event.boardId ?? "northwatch"}`} aria-label={condition.detail}>
        <svg className="kingdom-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {inactiveRoutes.map((circuit) => (
            <g className={`board-circuit route-${circuit.id}`} key={circuit.id}>
              <polyline className="circuit-track" points={routePoints(circuit.points)} />
              {circuit.points.map(([x, y], pointIndex) => (
                <circle className="circuit-node" cx={x} cy={y} key={`${circuit.id}-${pointIndex}`} r="1.15" />
              ))}
            </g>
          ))}
          <g className={`board-circuit route-${route.id} active`}>
            <polyline className="circuit-halo" points={routePoints(route.points)} />
            <polyline className="circuit-track" points={routePoints(route.points)} />
            <polyline className="circuit-pulse" points={routePoints(route.points)} />
            {route.points.map(([x, y], pointIndex) => (
              <circle className="circuit-node" cx={x} cy={y} key={`${route.id}-${pointIndex}`} r="1.45" />
            ))}
            <circle className="circuit-source" cx={route.points[0][0]} cy={route.points[0][1]} r="2.1" />
            <circle
              className="circuit-target"
              cx={route.points[route.points.length - 1][0]}
              cy={route.points[route.points.length - 1][1]}
              r="3.25"
            />
          </g>
        </svg>
        <div className="route-chip-layer" aria-hidden="true">
          <span className="route-chip route-chip-label">{route.label}</span>
        </div>
        {state.lastReport || state.finalReport ? (
          <div className={`board-result-toast ${getFeedbackTone(state)}`} key={`${state.jumps}-${state.phase}-${scoreDelta}`}>
            <span>{getFeedbackTitle(state)}</span>
            <strong>{signedNumber(scoreDelta)}</strong>
            {resultSummary ? <p>{resultSummary}</p> : null}
          </div>
        ) : null}
        <div className="kingdom-grid-map" aria-label="Northwatch tactical map">
          <div className={tileClass("ironhall", state.board.ironhall)}>
            <BoardGraphic kind="cavalry" />
            <span>Ironhall</span>
          </div>
          <div className={tileClass("pass", state.board.frozenPass)}>
            <BoardGraphic kind="pass" />
            <span>Frozen Pass</span>
          </div>
          <div className={tileClass("ward", state.resources.people)}>
            <BoardGraphic kind="healer" />
            <span>Ward</span>
          </div>
          <div className={tileClass("gate", state.resources.defense)}>
            <BoardGraphic kind="wall" />
            <span>Gate</span>
          </div>
          <div className={tileClass("keep", state.resources.control)}>
            <BoardGraphic kind="castle" />
            <span>Northwatch</span>
          </div>
          <div className={tileClass("homes", state.resources.people)}>
            <BoardGraphic kind="homes" />
            <span>Homes</span>
          </div>
          <div className={tileClass("market", state.resources.wealth)}>
            <BoardGraphic kind="market" />
            <span>Market</span>
          </div>
          <div className={tileClass("farms", state.resources.food)}>
            <BoardGraphic kind="farm" />
            <span>Farms</span>
          </div>
          <div className={tileClass("forest", state.board.blackpine)}>
            <BoardGraphic kind="forest" />
            <span>Blackpine</span>
          </div>
          <div className={tileClass("hearth", state.resources.hope)}>
            <BoardGraphic kind="hearth" />
            <span>Hearth</span>
          </div>
        </div>
        <div className="kingdom-banners" aria-label={`${allies.length} allies`}>
          {allies.slice(0, 5).map((entity) => (
            <span key={entity.id}>{entity.name}</span>
          ))}
          {allies.length === 0 ? <span>No allied banners</span> : null}
        </div>
        {brokenRoutes.length ? (
          <div className="kingdom-warning">
            {brokenRoutes.length} road{brokenRoutes.length === 1 ? "" : "s"} broken
          </div>
        ) : null}
        <div className="board-action-layer" aria-label="Board preparations">
          {boardActions.map((action) => {
            const selected = selectedActions.includes(action.id);
            const heat = getBoardActionHeat(event, action);
            const isAnswer = answerActionIds.has(action.id);
            const blocked = selected && isAnswer;
            const cue = getActionCue(selected, isAnswer, heat);

            return (
              <button
                className={`board-action action-${action.id} ${selected ? "selected" : ""} ${heat > 0 ? `hot heat-${Math.min(3, heat)}` : "quiet"} ${isAnswer ? "answer-needed" : ""} ${blocked ? "blocking" : ""}`}
                key={action.id}
                onClick={() => onToggleAction(action.id)}
                onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                type="button"
              >
                <BoardGraphic kind={boardActionGraphics[action.id]} />
                <span>{action.shortLabel}</span>
                <strong>{cue}</strong>
              </button>
            );
          })}
        </div>
      </div>
      <div className="kingdom-vital-row" aria-label="Visible kingdom condition">
        {parts.map((part) => (
          <div className={`kingdom-vital level-${part.value}`} key={part.id}>
            <span>{part.label}</span>
            <strong>{partPhrase(part)}</strong>
            <Pips value={part.value} />
          </div>
        ))}
      </div>
      <div className="kingdom-score-strip">
        <span>Legacy {scoreSnapshot(state).greatness}</span>
        <span>Fate cracks {state.fateStrain}/3</span>
        {state.lastReport ? <strong className={scoreDelta >= 0 ? "score-up" : "score-down"}>{signedNumber(scoreDelta)} last jump</strong> : null}
      </div>
    </section>
  );
}

function BoardClock({
  onSelectYear,
  onToggleAction,
  onWheelRotationChange,
  scoreDelta,
  selectedActions,
  selectedYear,
  state,
  wheelRotation,
}: {
  onSelectYear: (year: number, basisRotation?: number) => void;
  onToggleAction: (actionId: BoardActionId) => void;
  onWheelRotationChange: (rotation: number) => void;
  scoreDelta: number;
  selectedActions: BoardActionId[];
  selectedYear: number;
  state: BeforeSiegeState;
  wheelRotation: number;
}) {
  const selectedEvent = getHeadlineByYear(state, selectedYear);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const spinRef = useRef({
    active: false,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    animationFrame: 0,
    rotation: wheelRotation,
  });

  const stopInertia = () => {
    if (spinRef.current.animationFrame) {
      cancelAnimationFrame(spinRef.current.animationFrame);
      spinRef.current.animationFrame = 0;
    }
  };

  const snapToNearestYear = (rotation: number) => {
    onSelectYear(yearFromRotation(rotation, state.currentYear), rotation);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (state.phase !== "playing") {
      return;
    }

    stopInertia();
    event.currentTarget.setPointerCapture(event.pointerId);
    spinRef.current.active = true;
    spinRef.current.lastX = event.clientX;
    spinRef.current.lastY = event.clientY;
    spinRef.current.lastTime = performance.now();
    spinRef.current.velocity = 0;
    spinRef.current.rotation = wheelRotation;
    wheelRef.current?.classList.add("dragging");
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!spinRef.current.active) {
      return;
    }

    const now = performance.now();
    const dx = event.clientX - spinRef.current.lastX;
    const dy = event.clientY - spinRef.current.lastY;
    const dt = Math.max(16, now - spinRef.current.lastTime);
    const deltaRotation = dx * 0.24 - dy * 0.24;
    const nextRotation = spinRef.current.rotation + deltaRotation;

    spinRef.current.velocity = deltaRotation / dt;
    spinRef.current.rotation = nextRotation;
    spinRef.current.lastX = event.clientX;
    spinRef.current.lastY = event.clientY;
    spinRef.current.lastTime = now;
    onWheelRotationChange(nextRotation);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!spinRef.current.active) {
      return;
    }

    spinRef.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    wheelRef.current?.classList.remove("dragging");

    let velocity = spinRef.current.velocity;
    let rotation = spinRef.current.rotation;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const dt = Math.max(16, now - lastTime);
      lastTime = now;
      rotation += velocity * dt;
      velocity *= spinFriction;
      spinRef.current.rotation = rotation;
      onWheelRotationChange(rotation);

      if (Math.abs(velocity) > minSpinVelocity) {
        spinRef.current.animationFrame = requestAnimationFrame(animate);
      } else {
        spinRef.current.animationFrame = 0;
        snapToNearestYear(rotation);
      }
    };

    if (Math.abs(velocity) > minSpinVelocity) {
      spinRef.current.animationFrame = requestAnimationFrame(animate);
    } else {
      snapToNearestYear(rotation);
    }
  };

  return (
    <section className="siege-panel board-clock-panel" aria-label="Northwatch board clock">
      <WinterTimeline state={state} selectedYear={selectedYear} onSelectYear={onSelectYear} />
      <div
        className={`board-clock-face omen-${selectedEvent.omen}`}
        onPointerCancel={handlePointerUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={wheelRef}
      >
        <div className="board-clock-dashes" aria-hidden="true" />
        <div className="board-clock-years">
          {wheelYears.map((year) => {
            const event = year === 0 ? undefined : getHeadlineByYear(state, year);
            const isPast = year <= state.currentYear;
            const isSelected = year === selectedYear;

            return (
              <button
                aria-label={year === 0 ? "Year 0, Northwatch begins" : `Year ${year}, ${event?.title}`}
                className={`board-clock-year ${isSelected ? "selected" : ""} ${isPast ? "past" : ""} ${event?.tone ?? "home"} ${event?.omen ?? "home"}`}
                disabled={year === 0 || isPast || state.phase !== "playing"}
                key={year}
                onClick={(eventClick) => {
                  eventClick.stopPropagation();
                  onSelectYear(year, wheelRotation);
                }}
                onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
                style={squareMarkerPosition(year)}
                type="button"
              >
                {year}
              </button>
            );
          })}
        </div>
        <div className="board-clock-selected" aria-label={`Selected year ${selectedYear}`}>
          <span>Year</span>
          <strong>{selectedYear}</strong>
          <em>{compactHeadline(selectedEvent.title)}</em>
        </div>
        <KingdomBoard
          event={selectedEvent}
          onToggleAction={onToggleAction}
          scoreDelta={scoreDelta}
          selectedActions={selectedActions}
          state={state}
        />
      </div>
    </section>
  );
}

function WinterTimeline({
  state,
  selectedYear,
  onSelectYear,
}: {
  state: BeforeSiegeState;
  selectedYear: number;
  onSelectYear: (year: number, basisRotation?: number) => void;
}) {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const currentProgress = getTimelinePercent(state.currentYear);
  const targetProgress = getTimelinePercent(selectedYear);
  const availableEvents = state.events.filter((event) => event.year > state.currentYear);
  const style = {
    "--siege-current-progress": `${currentProgress}%`,
    "--siege-target-progress": `${targetProgress}%`,
    "--siege-jump-left": `${Math.min(currentProgress, targetProgress)}%`,
    "--siege-jump-width": `${Math.abs(targetProgress - currentProgress)}%`,
  } as CSSProperties;

  useEffect(() => {
    selectedButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedYear]);

  const chooseFromClientX = (clientX: number, track: HTMLElement) => {
    const rect = track.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    onSelectYear(nearestFutureYearFromPercent(state, percent));
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (state.phase !== "playing" || event.button !== 0) {
      return;
    }

    activePointerRef.current = event.pointerId;
    setIsScrubbing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    chooseFromClientX(event.clientX, event.currentTarget);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    chooseFromClientX(event.clientX, event.currentTarget);
  };

  const finishScrub = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== event.pointerId) {
      return;
    }

    activePointerRef.current = null;
    setIsScrubbing(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (state.phase !== "playing") {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onSelectYear(Math.max(state.currentYear + 1, selectedYear - 1));
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onSelectYear(Math.min(finalYear, selectedYear + 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onSelectYear(state.currentYear + 1);
    } else if (event.key === "End") {
      event.preventDefault();
      onSelectYear(finalYear);
    }
  };

  return (
    <div className="siege-dynamic-timeline" aria-label="Winterwatch headline timeline">
      <div className="siege-timeline-track-wrap">
        <div
          className={`siege-timeline-track ${isScrubbing ? "scrubbing" : ""}`}
          onKeyDown={handleKeyDown}
          onLostPointerCapture={() => {
            activePointerRef.current = null;
            setIsScrubbing(false);
          }}
          onPointerCancel={finishScrub}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishScrub}
          ref={timelineRef}
          role="slider"
          aria-label="Choose a future headline year"
          aria-valuemin={state.currentYear + 1}
          aria-valuemax={finalYear}
          aria-valuenow={selectedYear}
          aria-valuetext={`Jump to year ${selectedYear}`}
          tabIndex={0}
          style={style}
        >
          <span className="siege-timeline-endcap start">0</span>
          <span className="siege-timeline-endcap end">{finalYear}</span>
          <div className="siege-timeline-fill" />
          <div className="siege-timeline-projection" />
          <div className="siege-timeline-current-pin">
            <Castle size={12} />
          </div>
          <div className="siege-timeline-target-pin">
            <ScrollText size={12} />
          </div>
          {state.events.map((event) => (
            <button
              aria-label={`Year ${event.year}, ${event.title}`}
              className={`siege-timeline-dot ${event.tone} ${event.omen} ${event.year === selectedYear ? "selected" : ""} ${event.year <= state.currentYear ? "past" : ""}`}
              disabled={event.year <= state.currentYear || state.phase !== "playing"}
              key={event.id}
              onPointerDown={(pointerEvent) => pointerEvent.stopPropagation()}
              onClick={() => onSelectYear(event.year)}
              ref={event.year === selectedYear ? selectedButtonRef : undefined}
              style={{ "--event-progress": `${getTimelinePercent(event.year)}%` } as CSSProperties}
              type="button"
            >
              <b>{event.year}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="siege-timeline-chip-row" aria-label="Future headline shortcuts">
        {availableEvents.map((event) => (
          <button
            className={`siege-timeline-chip ${event.tone} ${event.omen} ${event.year === selectedYear ? "selected" : ""}`}
            key={event.id}
            onClick={() => onSelectYear(event.year)}
            ref={event.year === selectedYear ? selectedButtonRef : undefined}
            type="button"
          >
            <span>{event.year}</span>
            <strong>{omenLabels[event.omen].label}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportRow({ report }: { report: EventReport }) {
  return (
    <article className={`siege-report-row ${report.result} ${report.skipped ? "skipped" : ""}`}>
      <span>
        Year {report.event.year} {report.skipped ? "passed" : "chosen"}
      </span>
      <strong>{report.event.title}</strong>
      <p>{report.summary}</p>
      <small>
        {formatDeltas(report.deltas, report.boardDeltas)}
        {report.luck !== 0 ? ` / ${report.luck > 0 ? "good" : "hard"} luck` : ""}
      </small>
    </article>
  );
}

function CommandPanel({
  state,
  selectedYear,
  scoreDelta,
  selectedActions,
  onCommitPlan,
  onClearActions,
  onRestart,
}: {
  state: BeforeSiegeState;
  selectedYear: number;
  scoreDelta: number;
  selectedActions: BoardActionId[];
  onCommitPlan: () => void;
  onClearActions: () => void;
  onRestart: () => void;
}) {
  const selectedEvent = getHeadlineByYear(state, selectedYear);
  const scores = scoreSnapshot(state);
  const lastEventReport = state.lastReport?.reports[state.lastReport.reports.length - 1];
  const risk = getRiskStatus(state);
  const readiness = getBoardPlanReadiness(selectedEvent, selectedActions);

  return (
    <aside className="siege-panel siege-command-panel" aria-label="Orders">
      <div className="siege-panel-heading">
        <span>Next Move</span>
        <strong>{state.phase === "playing" ? "Light board defenses" : "Chronicle closed"}</strong>
      </div>

      {state.phase === "playing" ? (
        <>
          <div className="siege-omen-brief">
            <span>{omenLabels[selectedEvent.omen].label} omen</span>
            <strong>{selectedEvent.title}</strong>
            <p>{selectedEvent.body}</p>
          </div>

          <div className="siege-commit-card siege-prep-entry">
            <span>Jump</span>
            <strong>Year {selectedYear}: {selectedEvent.title}</strong>
            <p className={`board-plan-readiness ${readiness.level}`}>
              {readiness.label}: {selectedActions.length}/{boardActionLimit} preparations lit
            </p>
            <button className="siege-primary-button" type="button" onClick={onCommitPlan}>
              <Play size={17} />
              Let Fate Arrive
            </button>
            <button className="siege-ghost-button" type="button" onClick={onClearActions}>
              Clear Lights
            </button>
          </div>
        </>
      ) : (
        <div className={`siege-ending-card ${state.finalReport?.survived ? "survived" : "lost"}`}>
          {state.finalReport?.survived ? <Shield size={24} /> : <Skull size={24} />}
          <span>{state.finalReport?.survived ? "Survived" : "Fallen"}</span>
          <strong>{state.finalReport?.title ?? "Northwatch Falls"}</strong>
          <p>{state.finalReport?.story ?? state.lossReason}</p>
          {state.finalReport ? (
            <div className="siege-power-grid">
              <div>
                <span>City</span>
                <strong>{state.finalReport.cityPower}</strong>
              </div>
              <div>
                <span>Siege</span>
                <strong>{state.finalReport.siegePower}</strong>
              </div>
              <div>
                <span>Legacy</span>
                <strong>{state.finalReport.score}</strong>
              </div>
            </div>
          ) : null}
          <button className="siege-primary-button" type="button" onClick={onRestart}>
            <RotateCcw size={17} />
            New Chronicle
          </button>
        </div>
      )}

      <div className="siege-status-grid">
        <div className={`siege-risk-cell ${risk.level}`}>
          <span>City</span>
          <strong>{risk.label}</strong>
          <em>{risk.detail}</em>
        </div>
        <div className={`siege-fate-cell ${state.fateStrain >= 2 ? "danger" : ""}`}>
          <span>Fate</span>
          <strong>{state.fateStrain}/3</strong>
          <Pips value={state.fateStrain} />
        </div>
        <div>
          <span>Legacy</span>
          <strong>{scores.greatness}</strong>
        </div>
        <div>
          <span>Last Jump</span>
          <strong>
            {state.lastReport ? <em className={scoreDelta >= 0 ? "score-up" : "score-down"}>{signedNumber(scoreDelta)}</em> : "None"}
          </strong>
        </div>
      </div>

      {state.lastReport ? (
        <div className="siege-last-report">
          <span>
            Year {state.lastReport.fromYear} to {state.lastReport.toYear}
          </span>
          <strong>{state.lastReport.orderSummary}</strong>
          <p>
            Fate {state.lastReport.fateDelta > 0 ? "bent" : "held"} · {state.lastReport.timelineChanged} future headline
            {state.lastReport.timelineChanged === 1 ? "" : "s"} rewritten
          </p>
          {lastEventReport ? <ReportRow report={lastEventReport} /> : null}
        </div>
      ) : null}
    </aside>
  );
}

export function BeforeSiegeGame() {
  const [runSeed, setRunSeed] = useState(defaultSeed);
  const [state, setState] = useState(() => createBeforeSiege(defaultSeed));
  const [selectedYear, setSelectedYear] = useState(() => getNextTargetYear(state));
  const [wheelRotation, setWheelRotation] = useState(() => getNextTargetYear(state) * wheelStep);
  const [lastScoreDelta, setLastScoreDelta] = useState(0);
  const [selectedBoardActions, setSelectedBoardActions] = useState<BoardActionId[]>([]);
  const [visionMode] = useState<SiegeVisionMode>(() => getSiegeVisionMode());
  const effectiveSelectedYear =
    state.phase === "playing" && selectedYear <= state.currentYear ? getNextTargetYear(state) : clampYearForState(state, selectedYear);
  const selectedEvent = useMemo(() => getHeadlineByYear(state, effectiveSelectedYear), [effectiveSelectedYear, state]);
  const shellStyle = { "--siege-omen-image": `url(${getOmenImageUrl(selectedEvent)})` } as CSSProperties;

  const chooseYear = (year: number, basisRotation = wheelRotation) => {
    const boundedYear = clampYearForState(state, year);
    setSelectedYear(boundedYear);
    setWheelRotation(closestRotationForYear(boundedYear, basisRotation));
  };

  const previewWheelRotation = (rotation: number) => {
    const boundedYear = clampYearForState(state, yearFromRotation(rotation, state.currentYear));

    setWheelRotation(rotation);
    setSelectedYear(boundedYear);
  };

  const toggleBoardAction = (actionId: BoardActionId) => {
    setSelectedBoardActions((current) => {
      if (current.includes(actionId)) {
        return current.filter((id) => id !== actionId);
      }

      if (current.length >= boardActionLimit) {
        return [...current.slice(1), actionId];
      }

      return [...current, actionId];
    });
  };

  const commit = (actions = getBoardActionPlan(selectedBoardActions)) => {
    const previousScore = getScoreTotal(state);
    const nextState = commitBoardPlan(state, clampYearForState(state, effectiveSelectedYear), actions);
    const nextYear = nextState.phase === "playing" ? getNextTargetYear(nextState) : finalYear;

    setState(nextState);
    setLastScoreDelta(getScoreTotal(nextState) - previousScore);
    setSelectedYear(nextYear);
    setWheelRotation(closestRotationForYear(nextYear, wheelRotation));
    setSelectedBoardActions([]);
  };

  const restart = () => {
    const nextSeed = `${defaultSeed}-${Date.now().toString(36)}`;
    setRunSeed(nextSeed);
    const nextState = createBeforeSiege(nextSeed);
    const nextYear = getNextTargetYear(nextState);
    setState(nextState);
    setSelectedYear(nextYear);
    setWheelRotation(nextYear * wheelStep);
    setLastScoreDelta(0);
    setSelectedBoardActions([]);
  };

  return (
    <div className={`siege-shell siege-vision-${visionMode} phase-${state.phase}`} style={shellStyle}>
      {state.lastReport ? <div className={`siege-jump-flash ${getFeedbackTone(state)}`} key={`flash-${state.jumps}-${state.phase}`} /> : null}
      <header className="siege-hero">
        <div className="siege-brand">
          <span>Before the Siege</span>
          <h1>Northwatch</h1>
          <p>
            Twenty winters. One dial. Touch fate lightly, or chase a better city.
          </p>
        </div>
        <div className="siege-run-card">
          <span>Chronicle</span>
          <strong>Year {state.currentYear}/{finalYear}</strong>
          <p>{runSeed}</p>
          <button className="siege-ghost-button" type="button" onClick={restart}>
            <RotateCcw size={16} />
            New
          </button>
        </div>
      </header>

      <main className="siege-layout">
        <BoardClock
          onSelectYear={chooseYear}
          onToggleAction={toggleBoardAction}
          onWheelRotationChange={previewWheelRotation}
          scoreDelta={lastScoreDelta}
          selectedActions={selectedBoardActions}
          selectedYear={effectiveSelectedYear}
          state={state}
          wheelRotation={wheelRotation}
        />
        <CommandPanel
          onClearActions={() => setSelectedBoardActions([])}
          onCommitPlan={() => commit()}
          onRestart={restart}
          scoreDelta={lastScoreDelta}
          selectedActions={selectedBoardActions}
          selectedYear={effectiveSelectedYear}
          state={state}
        />
      </main>
    </div>
  );
}
