export const finalYear = 20;
export const resourceIds = ["food", "defense", "wealth", "people", "hope", "control"] as const;
export const boardIds = [
  "northwatch",
  "ironhall",
  "silvermere",
  "whiteford",
  "wolfBanner",
  "elkClan",
  "saltRoad",
  "outerFarms",
  "blackpine",
  "frozenPass",
] as const;
export const orderIds = ["stockpile", "fortify", "prosper", "shelter", "ally"] as const;
export const omenKinds = ["famine", "attack", "sickness", "unrest", "opportunity", "darkness"] as const;

export type ResourceId = (typeof resourceIds)[number];
export type BoardId = (typeof boardIds)[number];
export type OrderId = (typeof orderIds)[number];
export type EventTone = "threat" | "boon";
export type OmenKind = (typeof omenKinds)[number];
export type EventType =
  | "winter"
  | "raid"
  | "attack"
  | "drought"
  | "disease"
  | "treaty"
  | "trade"
  | "harvest"
  | "betrayal"
  | "discovery"
  | "unrest"
  | "storm"
  | "siege";
export type BoardGroup = "home" | "rival" | "tribe" | "route" | "frontier";
export type GamePhase = "playing" | "complete" | "lost";

export type ResourceStock = Record<ResourceId, number>;
export type BoardState = Record<BoardId, number>;

export interface BoardEntity {
  id: BoardId;
  name: string;
  group: BoardGroup;
  role: string;
  benefit: string;
  danger: string;
}

export interface RulingOrder {
  id: OrderId;
  label: string;
  shortLabel: string;
  description: string;
  cost: Partial<ResourceStock>;
  gain: Partial<ResourceStock>;
  goodAgainst: EventType[];
  targetMode: "none" | "site" | "faction" | "board";
}

export interface SiegeEvent {
  id: string;
  year: number;
  type: EventType;
  omen: OmenKind;
  tone: EventTone;
  title: string;
  body: string;
  severity: number;
  boardId?: BoardId;
  pressure: ResourceId[];
  goodOrders: OrderId[];
  reward?: Partial<ResourceStock>;
  branchTag?: string;
}

export interface EventReport {
  event: SiegeEvent;
  skipped: boolean;
  result: "prepared" | "narrow" | "unprepared" | "capitalized" | "missed";
  summary: string;
  deltas: Partial<ResourceStock>;
  boardDeltas: Partial<BoardState>;
  luck: number;
}

export interface JumpReport {
  fromYear: number;
  toYear: number;
  order: OrderId;
  targetId: BoardId;
  orderSummary: string;
  orderDeltas: Partial<ResourceStock>;
  orderBoardDeltas: Partial<BoardState>;
  reports: EventReport[];
  fateDelta: number;
  timelineChanged: number;
}

export interface BoardPlanAction {
  orderId: OrderId;
  targetId: BoardId;
}

export interface FinalSiegeReport {
  survived: boolean;
  cityPower: number;
  siegePower: number;
  alliedBonus: number;
  securedBonus: number;
  hostilePenalty: number;
  score: number;
  title: string;
  story: string;
}

export interface BeforeSiegeState {
  phase: GamePhase;
  seed: string;
  currentYear: number;
  resources: ResourceStock;
  board: BoardState;
  events: SiegeEvent[];
  lastOrder: OrderId;
  jumps: number;
  fateStrain: number;
  cityGreatness: number;
  lastReport?: JumpReport;
  finalReport?: FinalSiegeReport;
  lossReason?: string;
}

interface EventTemplate {
  id: string;
  type: EventType;
  omen: OmenKind;
  tone: EventTone;
  title: string;
  body: string;
  severity: number;
  boardId?: BoardId;
  pressure: ResourceId[];
  goodOrders: OrderId[];
  reward?: Partial<ResourceStock>;
}

const startingResources: ResourceStock = {
  food: 2,
  defense: 2,
  wealth: 2,
  people: 2,
  hope: 2,
  control: 2,
};

const startingBoard: BoardState = {
  northwatch: 3,
  ironhall: 1,
  silvermere: 2,
  whiteford: 2,
  wolfBanner: 1,
  elkClan: 2,
  saltRoad: 2,
  outerFarms: 2,
  blackpine: 1,
  frozenPass: 1,
};

export const resourceLabels: Record<ResourceId, { label: string; short: string }> = {
  food: { label: "Food", short: "grain and winter stores" },
  defense: { label: "Defense", short: "walls, patrols, and arms" },
  wealth: { label: "Wealth", short: "coin, trade, and repair money" },
  people: { label: "People", short: "families, workers, and soldiers" },
  hope: { label: "Hope", short: "happiness, mercy, and morale" },
  control: { label: "Control", short: "dynasty grip and lawful obedience" },
};

export const omenLabels: Record<OmenKind, { label: string; signal: string }> = {
  famine: { label: "Famine", signal: "Food warning" },
  attack: { label: "Attack", signal: "Wall warning" },
  sickness: { label: "Sickness", signal: "People warning" },
  unrest: { label: "Unrest", signal: "Hope warning" },
  opportunity: { label: "Opening", signal: "Gain chance" },
  darkness: { label: "Darkness", signal: "Final siege" },
};

export const boardEntities: BoardEntity[] = [
  {
    id: "northwatch",
    name: "Northwatch",
    group: "home",
    role: "Your frozen city",
    benefit: "The last hearth before the northern pass.",
    danger: "If this falls, the chronicle ends.",
  },
  {
    id: "ironhall",
    name: "Ironhall",
    group: "rival",
    role: "Militarized rival city",
    benefit: "An ally sends shield companies to the Great Siege.",
    danger: "As an enemy, Ironhall raids borders and backs pretenders.",
  },
  {
    id: "silvermere",
    name: "Silvermere",
    group: "rival",
    role: "Merchant lake city",
    benefit: "An ally keeps coin and caravans moving.",
    danger: "As an enemy, Silvermere funds unrest and embargoes roads.",
  },
  {
    id: "whiteford",
    name: "Whiteford",
    group: "rival",
    role: "Holy river city",
    benefit: "An ally sends healers and keeps hope alive.",
    danger: "As an enemy, Whiteford questions your family's right to rule.",
  },
  {
    id: "wolfBanner",
    name: "Wolf Banner",
    group: "tribe",
    role: "Raiding highland tribe",
    benefit: "If pacified, they scout the dark army's roads.",
    danger: "If hostile, they burn farms and terrorize merchants.",
  },
  {
    id: "elkClan",
    name: "Elk Clan",
    group: "tribe",
    role: "Nomads of the snow plain",
    benefit: "An ally guides hunters through lean winters.",
    danger: "If slighted, they vanish with food routes and guides.",
  },
  {
    id: "saltRoad",
    name: "Salt Road",
    group: "route",
    role: "Trade route",
    benefit: "Secure roads raise wealth and feed the markets.",
    danger: "Raiders strike it first when patrols thin.",
  },
  {
    id: "outerFarms",
    name: "Outer Farms",
    group: "frontier",
    role: "Frozen fields",
    benefit: "Strong farms keep the city fed.",
    danger: "Storms, drought, and raiders punish exposed fields.",
  },
  {
    id: "blackpine",
    name: "Blackpine Forest",
    group: "frontier",
    role: "Timber and watchtowers",
    benefit: "Wood strengthens walls and winter shelter.",
    danger: "Patrols disappear when the woods turn hostile.",
  },
  {
    id: "frozenPass",
    name: "Frozen Pass",
    group: "route",
    role: "Invasion road",
    benefit: "A secured pass slows the final darkness.",
    danger: "An open pass becomes the enemy's highway.",
  },
];

export const rulingOrders: RulingOrder[] = [
  {
    id: "stockpile",
    label: "Stockpile Food",
    shortLabel: "Stockpile",
    description: "Fill granaries and ration early. The city eats, but coin leaves the treasury.",
    cost: { wealth: -1 },
    gain: { food: 1 },
    goodAgainst: ["winter", "drought", "storm", "siege"],
    targetMode: "none",
  },
  {
    id: "fortify",
    label: "Raise Walls",
    shortLabel: "Fortify",
    description: "Repair gates, towers, and murder holes. Stonework is expensive.",
    cost: { wealth: -1 },
    gain: { defense: 1 },
    goodAgainst: ["raid", "attack", "betrayal", "siege"],
    targetMode: "none",
  },
  {
    id: "prosper",
    label: "Open Markets",
    shortLabel: "Prosper",
    description: "Let merchants run hot. Coin rises while resentment follows the rich.",
    cost: { hope: -1 },
    gain: { wealth: 1 },
    goodAgainst: ["trade", "discovery", "treaty"],
    targetMode: "none",
  },
  {
    id: "shelter",
    label: "Shelter the City",
    shortLabel: "Shelter",
    description: "Protect families, refugees, and the sick. Mercy spends the pantry.",
    cost: { food: -1 },
    gain: { hope: 1, people: 1 },
    goodAgainst: ["disease", "unrest", "winter", "storm"],
    targetMode: "none",
  },
  {
    id: "ally",
    label: "Forge Allegiance",
    shortLabel: "Ally",
    description: "Buy peace with a rival city or tribe. Useful friends weaken your grip at court.",
    cost: { wealth: -1 },
    gain: {},
    goodAgainst: ["treaty", "attack", "raid", "siege"],
    targetMode: "faction",
  },
];

const eventTemplates: EventTemplate[] = [
  {
    id: "blackwinter-storm",
    type: "storm",
    omen: "famine",
    tone: "threat",
    title: "Blackwinter Storm Buries the Outer Farms",
    body: "Snow walls off the lower fields, and lanterns vanish beyond the sheep track.",
    severity: 2,
    boardId: "outerFarms",
    pressure: ["food", "people", "hope"],
    goodOrders: ["stockpile", "shelter"],
  },
  {
    id: "wolf-road-raid",
    type: "raid",
    omen: "attack",
    tone: "threat",
    title: "Wolf Banner Raiders Terrorize the Salt Road",
    body: "Merchants arrive without wagons, naming wolf-painted shields in the pines.",
    severity: 2,
    boardId: "wolfBanner",
    pressure: ["defense", "wealth", "food"],
    goodOrders: ["fortify", "ally"],
  },
  {
    id: "ironhall-border",
    type: "attack",
    omen: "attack",
    tone: "threat",
    title: "Ironhall Soldiers Seize the Frozen Pass",
    body: "The rival city tests your claim where the old watchfires have gone cold.",
    severity: 2,
    boardId: "ironhall",
    pressure: ["defense", "control", "people"],
    goodOrders: ["fortify", "ally"],
  },
  {
    id: "ice-fever",
    type: "disease",
    omen: "sickness",
    tone: "threat",
    title: "Ice Fever Spreads Through the Lower Ward",
    body: "Blue-lipped coughing starts near the tanneries and reaches the chapel steps.",
    severity: 2,
    boardId: "whiteford",
    pressure: ["people", "hope", "wealth"],
    goodOrders: ["shelter", "ally"],
  },
  {
    id: "dry-summer",
    type: "drought",
    omen: "famine",
    tone: "threat",
    title: "Dry Summer Leaves Wells Ringing Hollow",
    body: "The snowmelt fails, the barley thins, and the city argues over every bucket.",
    severity: 2,
    boardId: "outerFarms",
    pressure: ["food", "hope", "control"],
    goodOrders: ["stockpile", "shelter"],
  },
  {
    id: "granary-fire",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "Granaries Burn During Midwinter Festival",
    body: "A spark becomes accusation, and accusation becomes a crowd with torches.",
    severity: 3,
    boardId: "northwatch",
    pressure: ["food", "hope", "control"],
    goodOrders: ["shelter", "stockpile"],
  },
  {
    id: "silvermere-embargo",
    type: "trade",
    omen: "unrest",
    tone: "threat",
    title: "Silvermere Closes the Lake Barges",
    body: "The merchant city freezes your credit and turns caravans toward its own gates.",
    severity: 2,
    boardId: "silvermere",
    pressure: ["wealth", "food", "control"],
    goodOrders: ["ally", "prosper"],
  },
  {
    id: "whiteford-sermon",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "Whiteford Priests Question the Crownwatch",
    body: "A sermon names your rule unnatural, and nervous nobles repeat the line.",
    severity: 2,
    boardId: "whiteford",
    pressure: ["hope", "control", "wealth"],
    goodOrders: ["ally", "shelter"],
  },
  {
    id: "elk-guides-vanish",
    type: "winter",
    omen: "famine",
    tone: "threat",
    title: "Elk Clan Guides Vanish Before the Long Snow",
    body: "Hunting parties lose the white roads, and the meat hooks stay empty.",
    severity: 1,
    boardId: "elkClan",
    pressure: ["food", "people", "hope"],
    goodOrders: ["ally", "stockpile", "shelter"],
  },
  {
    id: "blackpine-ambush",
    type: "betrayal",
    omen: "attack",
    tone: "threat",
    title: "Road Patrols Vanish Near Blackpine",
    body: "Only one horse returns, wearing a saddle full of black arrows.",
    severity: 2,
    boardId: "blackpine",
    pressure: ["defense", "people", "control"],
    goodOrders: ["fortify", "ally"],
  },
  {
    id: "southern-caravan",
    type: "trade",
    omen: "opportunity",
    tone: "boon",
    title: "Southern Grain Caravan Reaches Northwatch",
    body: "Against the odds, bells ring for wagons heavy with flour and salt pork.",
    severity: 1,
    boardId: "saltRoad",
    pressure: ["wealth", "food"],
    goodOrders: ["prosper", "ally"],
    reward: { food: 1, wealth: 1 },
  },
  {
    id: "mild-winters",
    type: "harvest",
    omen: "opportunity",
    tone: "boon",
    title: "Three Mild Winters Fill the Market Square",
    body: "Children grow rosy-cheeked, and the old complain that the snow has lost discipline.",
    severity: 1,
    boardId: "outerFarms",
    pressure: ["food", "hope"],
    goodOrders: ["stockpile", "prosper"],
    reward: { food: 1, hope: 1 },
  },
  {
    id: "iron-vein",
    type: "discovery",
    omen: "opportunity",
    tone: "boon",
    title: "Iron Found Beneath the Eastern Ridge",
    body: "Miners strike a dark seam that could arm the wall or make a dozen lords jealous.",
    severity: 1,
    boardId: "blackpine",
    pressure: ["wealth", "defense"],
    goodOrders: ["prosper", "fortify"],
    reward: { wealth: 1, defense: 1 },
  },
  {
    id: "marriage-pact",
    type: "treaty",
    omen: "opportunity",
    tone: "boon",
    title: "Rival Duke Offers a Marriage Pact",
    body: "A silver ring arrives in a fur-lined box, and every councilor hears a different promise.",
    severity: 1,
    boardId: "ironhall",
    pressure: ["control", "defense"],
    goodOrders: ["ally", "prosper"],
    reward: { control: 1, defense: 1 },
  },
  {
    id: "whiteford-healers",
    type: "treaty",
    omen: "opportunity",
    tone: "boon",
    title: "Whiteford Healers Cross the Frozen River",
    body: "They bring clean linen, bitter herbs, and songs the lower ward remembers for years.",
    severity: 1,
    boardId: "whiteford",
    pressure: ["hope", "people"],
    goodOrders: ["ally", "shelter"],
    reward: { hope: 1, people: 1 },
  },
  {
    id: "salt-road-fair",
    type: "trade",
    omen: "opportunity",
    tone: "boon",
    title: "Salt Road Fair Draws Every Banner North",
    body: "Coins, rumors, and old enemies crowd the same bright tents outside the gate.",
    severity: 1,
    boardId: "saltRoad",
    pressure: ["wealth", "hope"],
    goodOrders: ["prosper", "ally"],
    reward: { wealth: 1, hope: 1 },
  },
  {
    id: "tribe-peace",
    type: "treaty",
    omen: "opportunity",
    tone: "boon",
    title: "Elk Clan Seeks Winter Peace",
    body: "Their speaker asks for bread, iron, and a place beside your fire before the dark years.",
    severity: 1,
    boardId: "elkClan",
    pressure: ["hope", "food"],
    goodOrders: ["ally", "shelter", "stockpile"],
    reward: { hope: 1, food: 1 },
  },
  {
    id: "lost-heir",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "A Lost Heir Returns Under Ironhall Guard",
    body: "The stranger has your grandfather's eyes and your rival's soldiers.",
    severity: 3,
    boardId: "ironhall",
    pressure: ["control", "hope", "defense"],
    goodOrders: ["ally", "fortify", "shelter"],
  },
  {
    id: "market-riot",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "Bread Riot Splits the Old Market",
    body: "A hungry crowd overturns tax wagons while nobles demand harder punishments.",
    severity: 2,
    boardId: "northwatch",
    pressure: ["hope", "control", "food"],
    goodOrders: ["shelter", "stockpile"],
  },
  {
    id: "frozen-pass-beacon",
    type: "discovery",
    omen: "opportunity",
    tone: "boon",
    title: "Ancient Beacon Found Above the Frozen Pass",
    body: "Its black iron bowl could warn the world if anyone can keep it burning.",
    severity: 1,
    boardId: "frozenPass",
    pressure: ["defense", "hope"],
    goodOrders: ["ally", "fortify"],
    reward: { defense: 1, hope: 1 },
  },
];

const branchTemplates: Record<OrderId, EventTemplate> = {
  stockpile: {
    id: "branch-grain-hoard",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "Grain Hoard Draws Hungry Villages",
    body: "The watch rewrites the margin: survival has made Northwatch look rich to the starving.",
    severity: 2,
    boardId: "outerFarms",
    pressure: ["food", "hope", "control"],
    goodOrders: ["shelter", "stockpile"],
  },
  fortify: {
    id: "branch-wall-labor",
    type: "unrest",
    omen: "unrest",
    tone: "threat",
    title: "Wall Laborers Collapse in the Frost",
    body: "Higher walls save tomorrow, but the families carrying stone are tired today.",
    severity: 2,
    boardId: "northwatch",
    pressure: ["people", "hope", "wealth"],
    goodOrders: ["shelter", "prosper"],
  },
  prosper: {
    id: "branch-coin-lords",
    type: "betrayal",
    omen: "unrest",
    tone: "threat",
    title: "Coin Lords Demand a Council Seat",
    body: "Trade has made new powers bold enough to count the crown's teeth.",
    severity: 2,
    boardId: "silvermere",
    pressure: ["control", "wealth", "hope"],
    goodOrders: ["ally", "shelter"],
  },
  shelter: {
    id: "branch-refugee-fires",
    type: "winter",
    omen: "famine",
    tone: "threat",
    title: "Refugee Fires Fill the Lower Ward",
    body: "Mercy has a sound: ten thousand strangers coughing around borrowed hearths.",
    severity: 2,
    boardId: "northwatch",
    pressure: ["food", "people", "hope"],
    goodOrders: ["stockpile", "shelter"],
  },
  ally: {
    id: "branch-pact-rumors",
    type: "betrayal",
    omen: "unrest",
    tone: "threat",
    title: "Pact Rumors Split the Old Families",
    body: "A helpful alliance looks, to old blood, like an open door for outsiders.",
    severity: 2,
    boardId: "northwatch",
    pressure: ["control", "hope", "wealth"],
    goodOrders: ["shelter", "fortify"],
  },
};

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function rngFrom(seed: string) {
  let value = hashSeed(seed) || 1;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function clampPip(value: number) {
  return Math.max(0, Math.min(3, value));
}

function clampSeverity(value: number) {
  return Math.max(1, Math.min(3, value));
}

function applyResourceDeltas(resources: ResourceStock, deltas: Partial<ResourceStock>) {
  const next = { ...resources };
  for (const id of resourceIds) {
    next[id] = clampPip(next[id] + (deltas[id] ?? 0));
  }
  return next;
}

function applyBoardDeltas(board: BoardState, deltas: Partial<BoardState>) {
  const next = { ...board };
  for (const id of boardIds) {
    next[id] = clampPip(next[id] + (deltas[id] ?? 0));
  }
  return next;
}

function mergeDeltas(first: Partial<ResourceStock>, second: Partial<ResourceStock>) {
  const merged: Partial<ResourceStock> = { ...first };
  for (const id of resourceIds) {
    const value = (first[id] ?? 0) + (second[id] ?? 0);
    if (value !== 0) {
      merged[id] = value;
    } else {
      delete merged[id];
    }
  }
  return merged;
}

function mergeBoardDeltas(first: Partial<BoardState>, second: Partial<BoardState>) {
  const merged: Partial<BoardState> = { ...first };
  for (const id of boardIds) {
    const value = (first[id] ?? 0) + (second[id] ?? 0);
    if (value !== 0) {
      merged[id] = value;
    } else {
      delete merged[id];
    }
  }
  return merged;
}

function eventFromTemplate(template: EventTemplate, year: number, seed: string, fateStrain: number, branchTag?: string): SiegeEvent {
  const rng = rngFrom(`${seed}:${template.id}:${year}:${branchTag ?? "base"}`);
  const latePressure = year > 14 && rng() > 0.62 ? 1 : 0;
  const fatePressure = fateStrain >= 2 && template.tone === "threat" && rng() > 0.72 ? 1 : 0;

  return {
    id: `${year}-${template.id}-${branchTag ?? "base"}`,
    year,
    type: template.type,
    omen: template.omen,
    tone: template.tone,
    title: template.title,
    body: template.body,
    severity: clampSeverity(template.severity + latePressure + fatePressure),
    boardId: template.boardId,
    pressure: template.pressure,
    goodOrders: template.goodOrders,
    reward: template.reward,
    branchTag,
  };
}

function chooseTemplate(seed: string, year: number, usedIds: Set<string>) {
  const rng = rngFrom(`${seed}:year:${year}`);
  const offset = Math.floor(rng() * eventTemplates.length);

  for (let step = 0; step < eventTemplates.length; step += 1) {
    const template = eventTemplates[(offset + year * 5 + step * 3) % eventTemplates.length];
    if (!usedIds.has(template.id)) {
      usedIds.add(template.id);
      return template;
    }
  }

  return eventTemplates[offset % eventTemplates.length];
}

function createTimeline(seed: string, fateStrain = 0) {
  const usedIds = new Set<string>();
  const events: SiegeEvent[] = [];

  for (let year = 1; year < finalYear; year += 1) {
    events.push(eventFromTemplate(chooseTemplate(seed, year, usedIds), year, seed, fateStrain));
  }

  events.push({
    id: "20-great-siege",
    year: finalYear,
    type: "siege",
    omen: "darkness",
    tone: "threat",
    title: "The Army of Darkness Lays Siege to the World",
    body: "The sun rises gray. Every road burns behind the last army, and Northwatch becomes a wall for everyone left alive.",
    severity: 3,
    boardId: "frozenPass",
    pressure: ["defense", "food", "people", "hope", "control", "wealth"],
    goodOrders: ["fortify", "stockpile", "ally"],
  });

  return events;
}

export function createBeforeSiege(seed = "winterwatch-northwatch"): BeforeSiegeState {
  return {
    phase: "playing",
    seed,
    currentYear: 0,
    resources: { ...startingResources },
    board: { ...startingBoard },
    events: createTimeline(seed),
    lastOrder: "stockpile",
    jumps: 0,
    fateStrain: 0,
    cityGreatness: 0,
  };
}

export function getRulingOrder(orderId: OrderId) {
  return rulingOrders.find((order) => order.id === orderId) ?? rulingOrders[0];
}

export function getBoardEntity(boardId: BoardId) {
  return boardEntities.find((entity) => entity.id === boardId) ?? boardEntities[0];
}

export function isValidTargetForOrder(orderId: OrderId, boardId: BoardId) {
  const entity = getBoardEntity(boardId);
  const order = getRulingOrder(orderId);

  if (order.targetMode === "none") {
    return true;
  }

  if (order.targetMode === "site") {
    return entity.group === "route" || entity.group === "frontier";
  }

  if (order.targetMode === "faction") {
    return entity.group === "rival" || entity.group === "tribe";
  }

  return entity.group !== "home";
}

export function getDefaultTargetForOrder(orderId: OrderId, event?: SiegeEvent): BoardId {
  if (event?.boardId && isValidTargetForOrder(orderId, event.boardId)) {
    return event.boardId;
  }

  if (orderId === "ally") {
    return "ironhall";
  }

  return "northwatch";
}

export function getAvailableTargets(state: Pick<BeforeSiegeState, "events" | "currentYear">) {
  return state.events.filter((event) => event.year > state.currentYear);
}

export function getNextTargetYear(state: Pick<BeforeSiegeState, "events" | "currentYear">) {
  return getAvailableTargets(state)[0]?.year ?? finalYear;
}

export function getRulerReputation(state: Pick<BeforeSiegeState, "jumps" | "fateStrain">) {
  if (state.jumps <= 1 && state.fateStrain === 0) {
    return {
      label: "Hands-Off Ruler",
      description: "The watch stays mostly sealed. Survival is steadier, but greatness is harder to reach.",
    };
  }

  if (state.jumps <= 4) {
    return {
      label: "Watchful Ruler",
      description: "You intervene when the omens truly matter.",
    };
  }

  if (state.jumps <= 9) {
    return {
      label: "Restless Ruler",
      description: "The city feels your hand in every season, and fate has started pushing back.",
    };
  }

  return {
    label: "Fatebreaker",
    description: "The future buckles under constant corrections. High glory, high danger.",
  };
}

function describeDeltas(deltas: Partial<ResourceStock>, boardDeltas: Partial<BoardState>) {
  const resourceText = resourceIds
    .filter((id) => deltas[id])
    .map((id) => `${deltas[id]! > 0 ? "+" : ""}${deltas[id]} ${resourceLabels[id].label}`);
  const boardText = boardIds
    .filter((id) => boardDeltas[id])
    .map((id) => `${boardDeltas[id]! > 0 ? "+" : ""}${boardDeltas[id]} ${getBoardEntity(id).name}`);

  return [...resourceText, ...boardText].join(", ") || "No visible change";
}

function choosePrimaryPlanAction(event: SiegeEvent, actions: BoardPlanAction[], fallbackOrderId: OrderId, fallbackTargetId: BoardId) {
  if (!actions.length) {
    return { orderId: fallbackOrderId, targetId: fallbackTargetId };
  }

  return actions
    .map((action, index) => {
      const directTarget = event.boardId === action.targetId ? 2 : 0;
      const orderFit = event.goodOrders.includes(action.orderId) ? 3 : 0;
      return {
        action,
        score: directTarget + orderFit + (actions.length - index) * 0.01,
      };
    })
    .sort((a, b) => b.score - a.score)[0].action;
}

function applyBoardPlan(resources: ResourceStock, board: BoardState, actions: BoardPlanAction[]) {
  if (!actions.length) {
    return {
      resources,
      board,
      resourceDeltas: {},
      boardDeltas: {},
      summary: "Hands Off: no preparations raised",
    };
  }

  let nextResources = resources;
  let nextBoard = board;
  let resourceDeltas: Partial<ResourceStock> = {};
  let boardDeltas: Partial<BoardState> = {};
  const summaries: string[] = [];

  actions.slice(0, 3).forEach((action) => {
    const actionResourceDeltas: Partial<ResourceStock> = {};
    const actionBoardDeltas: Partial<BoardState> = {};

    if (action.orderId === "stockpile") {
      actionResourceDeltas.food = 1;
    } else if (action.orderId === "fortify") {
      actionResourceDeltas.defense = 1;
    } else if (action.orderId === "prosper") {
      actionResourceDeltas.wealth = 1;
    } else if (action.orderId === "shelter") {
      actionResourceDeltas.people = 1;
      actionResourceDeltas.hope = 1;
    } else if (action.orderId === "ally") {
      actionBoardDeltas[action.targetId] = 1;
      if (action.targetId === "ironhall") {
        actionResourceDeltas.defense = 1;
      } else if (action.targetId === "whiteford") {
        actionResourceDeltas.hope = 1;
      } else if (action.targetId === "silvermere") {
        actionResourceDeltas.wealth = 1;
      } else if (action.targetId === "elkClan" || action.targetId === "wolfBanner") {
        actionResourceDeltas.food = 1;
      }
    }

    nextResources = applyResourceDeltas(nextResources, actionResourceDeltas);
    nextBoard = applyBoardDeltas(nextBoard, actionBoardDeltas);
    resourceDeltas = mergeDeltas(resourceDeltas, actionResourceDeltas);
    boardDeltas = mergeBoardDeltas(boardDeltas, actionBoardDeltas);
    summaries.push(`${getRulingOrder(action.orderId).shortLabel}: ${describeDeltas(actionResourceDeltas, actionBoardDeltas)}`);
  });

  return {
    resources: nextResources,
    board: nextBoard,
    resourceDeltas,
    boardDeltas,
    summary: summaries.join(" / "),
  };
}

function getRelationSupport(board: BoardState, event: SiegeEvent) {
  if (!event.boardId) {
    return 0;
  }

  const entity = getBoardEntity(event.boardId);
  const value = board[event.boardId];

  if (entity.group === "rival" || entity.group === "tribe") {
    if (value >= 3) {
      return 1;
    }
    if (value <= 0) {
      return -1;
    }
  }

  if (entity.group === "route" || entity.group === "frontier") {
    if (value >= 3) {
      return 1;
    }
    if (value <= 0) {
      return -1;
    }
  }

  return 0;
}

function getAllySupport(board: BoardState, event: SiegeEvent) {
  let support = 0;

  if ((event.type === "attack" || event.type === "raid" || event.type === "siege") && board.ironhall >= 3) {
    support += 1;
  }

  if ((event.type === "trade" || event.type === "drought") && board.silvermere >= 3) {
    support += 1;
  }

  if ((event.type === "disease" || event.type === "unrest") && board.whiteford >= 3) {
    support += 1;
  }

  if ((event.type === "winter" || event.type === "storm" || event.type === "raid") && board.elkClan >= 3) {
    support += 1;
  }

  if ((event.type === "raid" || event.type === "siege") && board.wolfBanner >= 3) {
    support += 1;
  }

  return Math.min(2, support);
}

function rollLuck(seed: string, event: SiegeEvent, jumps: number, skipped: boolean) {
  if (skipped) {
    return 0;
  }

  const roll = rngFrom(`${seed}:luck:${event.id}:${jumps}`)();

  if (roll < 0.16) {
    return -1;
  }

  if (roll > 0.86) {
    return 1;
  }

  return 0;
}

function adjustBoardForEvent(event: SiegeEvent, result: EventReport["result"]) {
  const boardDeltas: Partial<BoardState> = {};

  if (!event.boardId) {
    return boardDeltas;
  }

  const entity = getBoardEntity(event.boardId);

  if (event.tone === "boon") {
    boardDeltas[event.boardId] = result === "capitalized" ? 1 : 0;
    return boardDeltas;
  }

  if (entity.group === "route" || entity.group === "frontier") {
    boardDeltas[event.boardId] = result === "unprepared" ? -1 : result === "prepared" ? 1 : 0;
    return boardDeltas;
  }

  if (entity.group === "rival" || entity.group === "tribe") {
    boardDeltas[event.boardId] = result === "prepared" ? 0 : -1;
  }

  return boardDeltas;
}

function resolveBoonEvent(
  resources: ResourceStock,
  board: BoardState,
  event: SiegeEvent,
  orderId: OrderId,
  targetId: BoardId,
  skipped: boolean,
) {
  const aligned = event.goodOrders.includes(orderId) || event.boardId === targetId;
  const result: EventReport["result"] = aligned ? "capitalized" : "missed";
  const deltas: Partial<ResourceStock> = skipped && !aligned ? {} : { ...(event.reward ?? {}) };
  const boardDeltas = adjustBoardForEvent(event, result);
  const summary =
    result === "capitalized"
      ? `${event.title}: your preparation turns the omen into an advantage.`
      : `${event.title}: the good fortune passes, but you capture only a little of it.`;

  return {
    resources: applyResourceDeltas(resources, deltas),
    board: applyBoardDeltas(board, boardDeltas),
    report: { event, skipped, result, summary, deltas, boardDeltas, luck: 0 },
    greatnessDelta: result === "capitalized" && !skipped ? 1 : 0,
  };
}

function resolveThreatEvent(
  resources: ResourceStock,
  board: BoardState,
  event: SiegeEvent,
  orderId: OrderId,
  targetId: BoardId,
  skipped: boolean,
  seed: string,
  jumps: number,
) {
  const severity = skipped ? Math.max(1, event.severity - 1) : event.severity;
  const bestResource = Math.max(...event.pressure.map((id) => resources[id]));
  const orderBonus = event.goodOrders.includes(orderId) ? 1 : 0;
  const targetBonus = event.boardId === targetId && isValidTargetForOrder(orderId, targetId) ? 1 : 0;
  const boardSupport = getRelationSupport(board, event);
  const allySupport = getAllySupport(board, event);
  const luck = rollLuck(seed, event, jumps, skipped);
  const preparedScore = bestResource + orderBonus + targetBonus + boardSupport + allySupport + luck - severity;
  const result: EventReport["result"] = preparedScore >= 1 ? "prepared" : preparedScore >= 0 ? "narrow" : "unprepared";
  const deltas: Partial<ResourceStock> = {};

  if (skipped) {
    if (result === "unprepared") {
      deltas[event.pressure[0]] = -1;
    }
  } else if (result === "prepared") {
    if (event.severity >= 3) {
      deltas[event.pressure[0]] = -1;
    }
    if (event.type === "raid" || event.type === "attack" || event.type === "betrayal") {
      deltas.control = (deltas.control ?? 0) + 1;
    } else if (event.type === "winter" || event.type === "disease" || event.type === "storm") {
      deltas.hope = (deltas.hope ?? 0) + 1;
    }
  } else if (result === "narrow") {
    deltas[event.pressure[0]] = -1;
  } else {
    deltas[event.pressure[0]] = -1;
    deltas[event.pressure[1] ?? event.pressure[0]] = (deltas[event.pressure[1] ?? event.pressure[0]] ?? 0) - 1;
    if (event.severity >= 3 && event.pressure[2]) {
      deltas[event.pressure[2]] = (deltas[event.pressure[2]] ?? 0) - 1;
    }
  }

  const boardDeltas = adjustBoardForEvent(event, result);
  const summary =
    result === "prepared"
      ? `${event.title}: the city meets the omen ready.`
      : result === "narrow"
        ? `${event.title}: Northwatch endures, but pays for the warning.`
        : `${event.title}: the watch was right, and the city was not ready enough.`;

  return {
    resources: applyResourceDeltas(resources, deltas),
    board: applyBoardDeltas(board, boardDeltas),
    report: { event, skipped, result, summary, deltas, boardDeltas, luck },
    greatnessDelta: result === "prepared" && !skipped ? 1 : 0,
  };
}

function getLossReason(resources: ResourceStock, event?: SiegeEvent) {
  if (resources.people <= 0) {
    return "Northwatch empties out. There are too few people left to man walls, fields, or hearths.";
  }

  if (resources.control <= 0) {
    return "The ruling family is overthrown before the dark army ever arrives.";
  }

  if ((event?.type === "winter" || event?.type === "storm" || event?.type === "drought") && resources.food <= 0) {
    return "The winter stores fail, and famine breaks the city.";
  }

  if ((event?.type === "raid" || event?.type === "attack" || event?.type === "betrayal") && resources.defense <= 0) {
    return "The gates cannot hold. Northwatch falls before the final siege.";
  }

  if ((event?.type === "disease" || event?.type === "unrest") && resources.hope <= 0) {
    return "The people no longer believe survival is worth obedience.";
  }

  return undefined;
}

function resolveEvent(
  resources: ResourceStock,
  board: BoardState,
  event: SiegeEvent,
  orderId: OrderId,
  targetId: BoardId,
  skipped: boolean,
  seed: string,
  jumps: number,
) {
  if (event.tone === "boon") {
    return resolveBoonEvent(resources, board, event, orderId, targetId, skipped);
  }

  return resolveThreatEvent(resources, board, event, orderId, targetId, skipped, seed, jumps);
}

function getFateDelta(span: number, orderChanged: boolean) {
  if (span <= 1) {
    return 1;
  }

  if (span <= 3 && orderChanged) {
    return 1;
  }

  return 0;
}

function mutateFutureEvents(
  events: SiegeEvent[],
  state: BeforeSiegeState,
  targetYear: number,
  orderId: OrderId,
  targetId: BoardId,
  nextFateStrain: number,
) {
  let changed = 0;

  const nextEvents = events.map((event) => {
    if (event.year <= targetYear || event.year >= finalYear) {
      return event;
    }

    const distance = event.year - targetYear;
    const roll = rngFrom(`${state.seed}:mutate:${event.id}:${state.jumps}:${orderId}:${targetId}`)();
    const chance = Math.min(0.72, nextFateStrain * 0.14 + Math.min(0.18, distance * 0.018) + state.jumps * 0.012);

    if (roll > chance) {
      return event;
    }

    changed += 1;

    if (roll < chance * 0.45) {
      const branch = eventFromTemplate(branchTemplates[orderId], event.year, state.seed, nextFateStrain, `${orderId}-${state.jumps}`);
      return {
        ...branch,
        boardId: branch.boardId === "northwatch" && targetId !== "northwatch" ? targetId : branch.boardId,
      };
    }

    const severityShift = roll < chance * 0.72 ? 1 : -1;
    return {
      ...event,
      id: `${event.id}-bent-${state.jumps}`,
      title: event.title.replace(/^(Bent: )?/, "Bent: "),
      severity: clampSeverity(event.severity + severityShift),
      branchTag: "bent",
    };
  });

  return { events: nextEvents, changed };
}

function getAlliedBonus(board: BoardState) {
  return ["ironhall", "silvermere", "whiteford", "wolfBanner", "elkClan"].reduce(
    (total, id) => total + (board[id as BoardId] >= 3 ? 1 : 0),
    0,
  );
}

function getHostilePenalty(board: BoardState) {
  return ["ironhall", "silvermere", "whiteford", "wolfBanner", "elkClan"].reduce(
    (total, id) => total + (board[id as BoardId] <= 0 ? 1 : 0),
    0,
  );
}

function getSecuredBonus(board: BoardState) {
  return ["saltRoad", "outerFarms", "blackpine", "frozenPass"].reduce(
    (total, id) => total + (board[id as BoardId] >= 3 ? 1 : 0),
    0,
  );
}

function resolveFinalSiege(state: BeforeSiegeState): FinalSiegeReport {
  const alliedBonus = getAlliedBonus(state.board);
  const securedBonus = getSecuredBonus(state.board);
  const hostilePenalty = getHostilePenalty(state.board);
  const resources = state.resources;
  const criticalCollapse =
    resources.food <= 0 || resources.defense <= 0 || resources.people <= 0 || resources.hope <= 0 || resources.control <= 0;
  const cityPower =
    resources.food +
    resources.defense * 1.35 +
    resources.people +
    resources.hope +
    resources.control +
    resources.wealth * 0.55 +
    alliedBonus +
    securedBonus +
    state.cityGreatness * 0.35 -
    (criticalCollapse ? 3 : 0);
  const siegePower = 10 + state.fateStrain + hostilePenalty + Math.max(0, state.jumps - 6) * 0.25;
  const survived = cityPower >= siegePower && !criticalCollapse;
  const resourceScore = resourceIds.reduce((total, id) => total + resources[id], 0);
  const score = survived
    ? Math.max(0, Math.round(resourceScore + alliedBonus * 2 + securedBonus + state.cityGreatness + (3 - state.fateStrain) * 2))
    : 0;
  const title = survived
    ? resources.hope >= 3 && resources.people >= 2
      ? "The Hearth Kingdom"
      : resources.defense >= 3
        ? "The Iron Refuge"
        : resources.wealth >= 3
          ? "The Last Market"
          : "The City That Endured"
    : "The Last Watch Goes Dark";
  const story = survived
    ? "The Army of Darkness breaks against Northwatch's walls. What remains of food, coin, people, and hope becomes the seed of a new civilization."
    : "The Army of Darkness reaches Northwatch and finds a city too spent to answer. The watch ticks once, then stops under the snow.";

  return {
    survived,
    cityPower: Number(cityPower.toFixed(1)),
    siegePower: Number(siegePower.toFixed(1)),
    alliedBonus,
    securedBonus,
    hostilePenalty,
    score,
    title,
    story,
  };
}

function commitPreparedActions(
  state: BeforeSiegeState,
  targetYear: number,
  actions: BoardPlanAction[],
  fallbackOrderId: OrderId,
  fallbackTargetId: BoardId,
): BeforeSiegeState {
  if (state.phase !== "playing") {
    return state;
  }

  const boundedTargetYear = Math.max(state.currentYear + 1, Math.min(finalYear, targetYear));
  const targetEvent = state.events.find((event) => event.year === boundedTargetYear) ?? state.events[state.events.length - 1];
  const primaryAction = choosePrimaryPlanAction(targetEvent, actions, fallbackOrderId, fallbackTargetId);
  const span = boundedTargetYear - state.currentYear;
  const orderChanged = actions.length > 0 && primaryAction.orderId !== state.lastOrder;
  const fateLoad = actions.length >= 3 && span <= 1 ? 1 : 0;
  const fateDelta = clampPip(getFateDelta(span, orderChanged) + fateLoad);
  const nextFateStrain = clampPip(state.fateStrain + fateDelta);
  const orderResult = applyBoardPlan(state.resources, state.board, actions);
  const reports: EventReport[] = [];
  let resources = orderResult.resources;
  let board = orderResult.board;
  let cityGreatness = state.cityGreatness;
  let phase: GamePhase = "playing";
  let lossReason: string | undefined;

  const dueEvents = state.events.filter((event) => event.year > state.currentYear && event.year <= boundedTargetYear);

  for (const event of dueEvents) {
    if (event.type === "siege") {
      continue;
    }

    const skipped = event.year !== targetEvent.year;
    const result = resolveEvent(resources, board, event, primaryAction.orderId, primaryAction.targetId, skipped, state.seed, state.jumps + 1);
    resources = result.resources;
    board = result.board;
    cityGreatness += result.greatnessDelta;
    reports.push(result.report);
    lossReason = getLossReason(resources, event);

    if (lossReason) {
      phase = "lost";
      break;
    }
  }

  const interimState: BeforeSiegeState = {
    ...state,
    phase,
    currentYear: phase === "lost" ? reports[reports.length - 1]?.event.year ?? boundedTargetYear : boundedTargetYear,
    resources,
    board,
    lastOrder: primaryAction.orderId,
    jumps: state.jumps + 1,
    fateStrain: nextFateStrain,
    cityGreatness,
    lossReason,
  };

  const mutation = phase === "playing"
    ? mutateFutureEvents(state.events, state, boundedTargetYear, primaryAction.orderId, primaryAction.targetId, nextFateStrain)
    : { events: state.events, changed: 0 };
  const lastReport: JumpReport = {
    fromYear: state.currentYear,
    toYear: interimState.currentYear,
    order: primaryAction.orderId,
    targetId: primaryAction.targetId,
    orderSummary: orderResult.summary,
    orderDeltas: orderResult.resourceDeltas,
    orderBoardDeltas: orderResult.boardDeltas,
    reports,
    fateDelta,
    timelineChanged: mutation.changed,
  };

  if (phase === "lost") {
    return {
      ...interimState,
      events: mutation.events,
      lastReport,
    };
  }

  if (boundedTargetYear >= finalYear) {
    const finalState = {
      ...interimState,
      events: mutation.events,
      lastReport,
    };
    const finalReport = resolveFinalSiege(finalState);

    return {
      ...finalState,
      phase: finalReport.survived ? "complete" : "lost",
      finalReport,
      lossReason: finalReport.survived ? undefined : finalReport.story,
    };
  }

  return {
    ...interimState,
    events: mutation.events,
    lastReport,
  };
}

export function commitJump(state: BeforeSiegeState, targetYear: number, orderId: OrderId, targetId: BoardId): BeforeSiegeState {
  const safeTargetId = isValidTargetForOrder(orderId, targetId) ? targetId : getDefaultTargetForOrder(orderId);
  return commitPreparedActions(state, targetYear, [{ orderId, targetId: safeTargetId }], orderId, safeTargetId);
}

export function commitBoardPlan(state: BeforeSiegeState, targetYear: number, actions: BoardPlanAction[]): BeforeSiegeState {
  const targetEvent = state.events.find((event) => event.year === targetYear) ?? state.events[state.events.length - 1];
  const safeActions = actions
    .slice(0, 3)
    .map((action) => ({
      orderId: action.orderId,
      targetId: isValidTargetForOrder(action.orderId, action.targetId)
        ? action.targetId
        : getDefaultTargetForOrder(action.orderId, targetEvent),
    }));

  return commitPreparedActions(state, targetYear, safeActions, state.lastOrder, getDefaultTargetForOrder(state.lastOrder, targetEvent));
}

export function getHeadlineByYear(state: Pick<BeforeSiegeState, "events">, year: number) {
  return state.events.find((event) => event.year === year) ?? state.events[state.events.length - 1];
}

export function scoreSnapshot(state: Pick<BeforeSiegeState, "resources" | "board" | "cityGreatness" | "fateStrain">) {
  const resourceScore = resourceIds.reduce((total, id) => total + state.resources[id], 0);
  const alliedBonus = getAlliedBonus(state.board);
  const securedBonus = getSecuredBonus(state.board);

  return {
    wealth: state.resources.wealth,
    happiness: state.resources.hope,
    greatness: state.cityGreatness + alliedBonus + securedBonus,
    total: resourceScore + state.cityGreatness + alliedBonus + securedBonus + (3 - state.fateStrain),
  };
}
