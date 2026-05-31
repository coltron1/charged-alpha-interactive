import { Minimize2, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export type ResultsChartPoint = {
  date: string;
  label: string;
  values: Record<string, number>;
};

export type ResultsChartSeries = {
  key: string;
  label: string;
  className: string;
};

export type LeaderboardSubmittedEntry = {
  createdAt: string;
  detail: string;
  email: string;
  id: string;
  name: string;
  returnPercent: number;
  score: number;
};

export type LeaderboardBenchmarkRow = {
  detail: string;
  id: string;
  label: string;
  returnPercent: number;
  score: number;
};

type LeaderboardRow = LeaderboardBenchmarkRow & {
  highlighted?: boolean;
  kind: "benchmark" | "player" | "preview";
  submittedAt?: string;
};

type ChargedAlphaUser = {
  authenticated: boolean;
  email?: string;
  firstName?: string;
  loginUrl?: string;
  name?: string;
  registerUrl?: string;
};

function dateToUtcTime(date: string) {
  return new Date(`${date}T00:00:00Z`).getTime();
}

function getChartRange(points: ResultsChartPoint[], series: ResultsChartSeries[]) {
  const values = points.flatMap((point) => series.map((item) => point.values[item.key] ?? 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.08);
  return { min: Math.max(0, min - padding), max: max + padding };
}

function getChartX(startDate: string, endDate: string, date: string, width: number) {
  const start = dateToUtcTime(startDate);
  const end = dateToUtcTime(endDate);
  const current = dateToUtcTime(date);
  return ((current - start) / Math.max(1, end - start)) * width;
}

function getChartY(value: number, range: { min: number; max: number }, height: number) {
  return height - ((value - range.min) / Math.max(1, range.max - range.min)) * height;
}

function buildPerformancePath(
  points: ResultsChartPoint[],
  key: string,
  range: { min: number; max: number },
  startDate: string,
  endDate: string,
  width: number,
  height: number,
) {
  return points
    .map((point, index) => {
      const x = getChartX(startDate, endDate, point.date, width);
      const y = getChartY(point.values[key] ?? 0, range, height);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function ResultsPerformanceChart({
  ariaLabel,
  endDate,
  formatMoney,
  points,
  series,
  startDate,
  summary,
}: {
  ariaLabel: string;
  endDate: string;
  formatMoney: (value: number) => string;
  points: ResultsChartPoint[];
  series: ResultsChartSeries[];
  startDate: string;
  summary: string;
}) {
  const range = getChartRange(points, series);
  const width = 340;
  const height = 126;
  const latest = points.at(-1) ?? points[0];

  return (
    <section className="storybook-final-chart wealth" aria-label={ariaLabel}>
      <header>
        <span>Portfolio Path</span>
        <strong>{summary}</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.25} H ${width}`} />
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.5} H ${width}`} />
        <path className="storybook-final-chart-gridline" d={`M 0 ${height * 0.75} H ${width}`} />
        {series.map((item) => (
          <path
            key={item.key}
            className={`storybook-final-line ${item.className}`}
            d={buildPerformancePath(points, item.key, range, startDate, endDate, width, height)}
          />
        ))}
        {points.map((point) => {
          const x = getChartX(startDate, endDate, point.date, width);
          return (
            <g key={`${point.date}-${point.label}`}>
              {series.map((item) => (
                <circle
                  key={item.key}
                  className={`storybook-final-dot ${item.className}`}
                  cx={x.toFixed(2)}
                  cy={getChartY(point.values[item.key] ?? 0, range, height).toFixed(2)}
                  r={point === latest ? 3.4 : 2.2}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <footer>
        {series.map((item) => (
          <span key={item.key} className={item.className}>
            <i aria-hidden="true" />
            {item.label} {formatMoney(latest.values[item.key] ?? 0)}
          </span>
        ))}
      </footer>
    </section>
  );
}

export function ResultsMoveImpactChart({
  ariaLabel,
  formatMoneyDelta,
  impacts,
}: {
  ariaLabel: string;
  formatMoneyDelta: (value: number) => string;
  impacts: Array<{ date: string; profit: number }>;
}) {
  const width = 340;
  const height = 96;
  const zeroY = height / 2;
  const maxMove = Math.max(1, ...impacts.map((result) => Math.abs(result.profit)));
  const barGap = impacts.length > 90 ? 0.6 : 1.4;
  const barWidth = Math.max(1, width / Math.max(1, impacts.length) - barGap);
  const bestMove = impacts.reduce<(typeof impacts)[number] | null>(
    (best, result) => (!best || result.profit > best.profit ? result : best),
    null,
  );
  const worstMove = impacts.reduce<(typeof impacts)[number] | null>(
    (worst, result) => (!worst || result.profit < worst.profit ? result : worst),
    null,
  );
  const weakestMoveLabel = worstMove && worstMove.profit < 0 ? "Worst" : "Smallest";

  return (
    <section className="storybook-final-chart moves" aria-label={ariaLabel}>
      <header>
        <span>Move Impact</span>
        <strong>Gain/loss after each jump</strong>
      </header>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <path className="storybook-final-zero-line" d={`M 0 ${zeroY} H ${width}`} />
        {impacts.map((result, index) => {
          const magnitude = (Math.abs(result.profit) / maxMove) * (height * 0.44);
          const x = (index / Math.max(1, impacts.length - 1)) * (width - barWidth);
          const y = result.profit >= 0 ? zeroY - magnitude : zeroY;
          return (
            <rect
              key={`${result.date}-${index}`}
              className={`storybook-final-move-bar ${result.profit >= 0 ? "positive" : "negative"}`}
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              width={barWidth.toFixed(2)}
              height={Math.max(1, magnitude).toFixed(2)}
              rx="1.5"
            />
          );
        })}
      </svg>
      <footer>
        <span className={bestMove && bestMove.profit < 0 ? "negative" : "positive"}>Best {bestMove ? formatMoneyDelta(bestMove.profit) : "$0"}</span>
        <span className={worstMove && worstMove.profit < 0 ? "negative" : "positive"}>
          {weakestMoveLabel} {worstMove ? formatMoneyDelta(worstMove.profit) : "$0"}
        </span>
      </footer>
    </section>
  );
}

function isLeaderboardEntry(value: unknown): value is LeaderboardSubmittedEntry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.createdAt === "string" &&
    typeof entry.detail === "string" &&
    typeof entry.email === "string" &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    typeof entry.returnPercent === "number" &&
    typeof entry.score === "number"
  );
}

function loadLeaderboardEntries(storageKey: string): LeaderboardSubmittedEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isLeaderboardEntry) : [];
  } catch {
    return [];
  }
}

function saveLeaderboardEntries(storageKey: string, entries: LeaderboardSubmittedEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(entries.slice(0, 25)));
  } catch {
    // Local-only prototype storage can fail in private sessions; the UI stays usable.
  }
}

function sanitizeLeaderboardName(name: string) {
  return name.trim().replace(/\s+/g, " ").slice(0, 24);
}

function sanitizeLeaderboardEmail(email: string) {
  return email.trim().toLowerCase().slice(0, 80);
}

function isValidLeaderboardEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sortLeaderboardRows(rows: LeaderboardRow[]) {
  return rows.sort((a, b) => b.score - a.score);
}

function getGamePath(gameSlug?: string) {
  return gameSlug ? `/games/${gameSlug}` : "/games";
}

function getChargedAlphaFirstName(user: ChargedAlphaUser | null) {
  const candidates = [user?.firstName, user?.name, user?.email?.split("@")[0]];
  for (const candidate of candidates) {
    const cleaned = sanitizeLeaderboardName(candidate ?? "");
    if (cleaned) {
      return cleaned.split(/\s+/)[0];
    }
  }
  return "Player";
}

function getAccountUrl(kind: "login" | "register", user: ChargedAlphaUser | null, gameSlug?: string) {
  const provided = kind === "login" ? user?.loginUrl : user?.registerUrl;
  if (provided) {
    return provided;
  }
  return `/auth/${kind}?next=${encodeURIComponent(getGamePath(gameSlug))}`;
}

function normalizeServerScore(value: unknown, fallbackDetail: string): LeaderboardSubmittedEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string" || typeof row.score !== "number") {
    return null;
  }

  const moves = typeof row.moves === "number" ? row.moves : null;
  const reallocations = typeof row.reallocations === "number" ? row.reallocations : null;
  const taxPaid = typeof row.taxPaid === "number" ? row.taxPaid : null;
  const details = [
    moves !== null ? `${moves} ${moves === 1 ? "move" : "moves"}` : "",
    reallocations !== null ? `${reallocations} reallocations` : "",
    taxPaid !== null && taxPaid > 0 ? `$${Math.round(taxPaid).toLocaleString("en-US")} tax` : "",
  ].filter(Boolean);

  return {
    createdAt: typeof row.createdAt === "string" ? row.createdAt : "",
    detail: details.join(" · ") || fallbackDetail,
    email: "",
    id: row.id,
    name: row.name,
    returnPercent: typeof row.returnPercent === "number" ? row.returnPercent : 0,
    score: row.score,
  };
}

async function fetchChargedAlphaUser(gameSlug?: string): Promise<ChargedAlphaUser | null> {
  const response = await fetch(`/auth/api/me?next=${encodeURIComponent(getGamePath(gameSlug))}`, { credentials: "same-origin" });
  if (!response.ok) {
    return null;
  }
  return (await response.json()) as ChargedAlphaUser;
}

async function fetchPublicLeaderboardEntries(gameSlug: string, fallbackDetail: string) {
  const response = await fetch(`/games/api/leaderboard/${gameSlug}`, { credentials: "same-origin" });
  if (!response.ok) {
    return null;
  }
  const payload = (await response.json()) as { entries?: unknown };
  if (!Array.isArray(payload.entries)) {
    return null;
  }
  return payload.entries
    .map((entry) => normalizeServerScore(entry, fallbackDetail))
    .filter((entry): entry is LeaderboardSubmittedEntry => Boolean(entry));
}

async function postPublicLeaderboardEntry({
  currentRunDetail,
  gameSlug,
  moves,
  reallocations,
  returnPercent,
  score,
  taxPaid,
}: {
  currentRunDetail: string;
  gameSlug: string;
  moves: number;
  reallocations: number;
  returnPercent: number;
  score: number;
  taxPaid: number;
}) {
  const response = await fetch("/games/api/scores", {
    body: JSON.stringify({
      game_slug: gameSlug,
      metadata: {
        detail: currentRunDetail,
        source: gameSlug,
      },
      moves,
      reallocations,
      return_percent: returnPercent,
      score,
      tax_paid: taxPaid,
    }),
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json().catch(() => ({}))) as { entry?: unknown; error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Score was not accepted.");
  }

  const entry = normalizeServerScore(payload.entry, currentRunDetail);
  if (!entry) {
    throw new Error("Score response was incomplete.");
  }
  return entry;
}

export function InvestmentLeaderboardOverlay({
  benchmarkRows,
  currentRunDetail,
  formatDateLong,
  formatMoney,
  formatPercent,
  gameSlug,
  gameTitle,
  moves = 0,
  onClose,
  onSubmitted,
  periodLabel,
  reallocations = 0,
  returnPercent,
  score,
  storageKey,
  submittedEntry,
  taxPaid = 0,
}: {
  benchmarkRows: LeaderboardBenchmarkRow[];
  currentRunDetail: string;
  formatDateLong: (date: string) => string;
  formatMoney: (value: number) => string;
  formatPercent: (value: number) => string;
  gameSlug?: string;
  gameTitle: string;
  moves?: number;
  onClose: () => void;
  onSubmitted: (entry: LeaderboardSubmittedEntry) => void;
  periodLabel: string;
  reallocations?: number;
  returnPercent: number;
  score: number;
  storageKey: string;
  submittedEntry: LeaderboardSubmittedEntry | null;
  taxPaid?: number;
}) {
  const [entries, setEntries] = useState(() => loadLeaderboardEntries(storageKey));
  const [playerName, setPlayerName] = useState("");
  const [email, setEmail] = useState("");
  const [formMessage, setFormMessage] = useState(submittedEntry ? "Score posted to this device." : "");
  const [chargedAlphaUser, setChargedAlphaUser] = useState<ChargedAlphaUser | null>(null);
  const [serverLeaderboardAvailable, setServerLeaderboardAvailable] = useState(false);
  const [postingScore, setPostingScore] = useState(false);
  const previewEntry: LeaderboardSubmittedEntry = submittedEntry ?? {
    createdAt: "",
    detail: currentRunDetail,
    email: "",
    id: "current-run-preview",
    name: "Your run",
    returnPercent,
    score: Math.round(score),
  };
  const rows = sortLeaderboardRows([
    ...benchmarkRows.map((row) => ({ ...row, kind: "benchmark" as const })),
    ...entries.map((entry) => ({
      ...entry,
      kind: "player" as const,
      label: entry.name,
      highlighted: previewEntry.id === entry.id,
      submittedAt: entry.createdAt,
    })),
    ...(entries.some((entry) => entry.id === previewEntry.id)
      ? []
      : [{ ...previewEntry, kind: "preview" as const, label: "Your run", highlighted: true }]),
  ]);
  const previewRank = rows.findIndex((row) => row.id === previewEntry.id) + 1;
  const accountFirstName = getChargedAlphaFirstName(chargedAlphaUser);
  const mustSignInForPublicScore = Boolean(gameSlug && serverLeaderboardAvailable && !chargedAlphaUser?.authenticated);
  const loginUrl = getAccountUrl("login", chargedAlphaUser, gameSlug);
  const registerUrl = getAccountUrl("register", chargedAlphaUser, gameSlug);

  useEffect(() => {
    if (!gameSlug) {
      return;
    }

    let cancelled = false;
    fetchPublicLeaderboardEntries(gameSlug, currentRunDetail)
      .then((serverEntries) => {
        if (!cancelled && serverEntries) {
          setEntries(serverEntries);
          setServerLeaderboardAvailable(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setServerLeaderboardAvailable(false);
        }
      });

    fetchChargedAlphaUser(gameSlug)
      .then((user) => {
        if (!cancelled && user) {
          setChargedAlphaUser(user);
          if (user.authenticated) {
            const firstName = getChargedAlphaFirstName(user);
            setPlayerName((current) => current || firstName);
            setEmail((current) => current || user.email || "");
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChargedAlphaUser(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentRunDetail, gameSlug]);

  const submitScore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = sanitizeLeaderboardName(playerName);
    const cleanEmail = sanitizeLeaderboardEmail(email);

    if (submittedEntry) {
      setFormMessage("This run is already posted.");
      return;
    }
    if (mustSignInForPublicScore) {
      setFormMessage("Create or sign in to a free Charged Alpha account to post this public score.");
      return;
    }
    if (!chargedAlphaUser?.authenticated && cleanName.length < 2) {
      setFormMessage("Enter a display name.");
      return;
    }
    if (!serverLeaderboardAvailable && !isValidLeaderboardEmail(cleanEmail)) {
      setFormMessage("Enter a valid email address.");
      return;
    }

    const entry: LeaderboardSubmittedEntry = {
      createdAt: new Date().toISOString(),
      detail: currentRunDetail,
      email: chargedAlphaUser?.authenticated ? chargedAlphaUser.email || "" : cleanEmail,
      id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: chargedAlphaUser?.authenticated ? accountFirstName : cleanName,
      returnPercent,
      score: Math.round(score),
    };
    setPostingScore(true);
    try {
      if (gameSlug && serverLeaderboardAvailable && chargedAlphaUser?.authenticated) {
        const serverEntry = await postPublicLeaderboardEntry({
          currentRunDetail,
          gameSlug,
          moves,
          reallocations,
          returnPercent,
          score: entry.score,
          taxPaid,
        });
        const serverEntries = await fetchPublicLeaderboardEntries(gameSlug, currentRunDetail);
        setEntries(serverEntries ?? [serverEntry, ...entries]);
        onSubmitted(serverEntry);
        setFormMessage("Posted to your Charged Alpha account.");
      } else {
        const nextEntries = [entry, ...entries].sort((a, b) => b.score - a.score).slice(0, 25);
        saveLeaderboardEntries(storageKey, nextEntries);
        setEntries(nextEntries);
        onSubmitted(entry);
        setFormMessage("Posted on this device. Sign in on Charged Alpha for public scores.");
      }
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Score posting failed. Try again after signing in.");
    } finally {
      setPostingScore(false);
    }
  };

  return (
    <div className="storybook-overlay leaderboard-overlay" role="dialog" aria-modal="true" aria-label={`${gameTitle} high scores`}>
      <section className="storybook-leaderboard-page">
        <button className="storybook-minimize" type="button" onClick={onClose} aria-label="Close high scores">
          <Minimize2 size={16} />
          Close
        </button>
        <header className="storybook-leaderboard-head">
          <p className="eyebrow">{gameTitle}</p>
          <h2>High Scores</h2>
          <span>Your run ranks #{Math.max(1, previewRank)} against saved players and benchmarks.</span>
        </header>

        <section className="storybook-leaderboard-submit" aria-label="Post your score">
          <div>
            <span>Post your score</span>
            <strong>{formatMoney(score)}</strong>
            <em>{formatPercent(returnPercent)} over {periodLabel}</em>
          </div>
          <form
            className={`${chargedAlphaUser?.authenticated ? "account-ready" : ""} ${mustSignInForPublicScore ? "account-required" : ""}`}
            onSubmit={submitScore}
          >
            {chargedAlphaUser?.authenticated ? (
              <div className="storybook-leaderboard-account-card">
                <span>Posting as</span>
                <strong>{accountFirstName}</strong>
                <em>{chargedAlphaUser.email}</em>
              </div>
            ) : mustSignInForPublicScore ? (
              <div className="storybook-leaderboard-auth-card">
                <span>Free account required</span>
                <strong>Save this run publicly</strong>
                <em>Use your Charged Alpha account to post scores and keep game progress.</em>
                <div>
                  <a className="primary-action legacy-primary" href={registerUrl}>
                    Create Account
                  </a>
                  <a className="secondary-action compact" href={loginUrl}>
                    Sign In
                  </a>
                </div>
              </div>
            ) : (
              <>
                <label>
                  <span>Name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={playerName}
                    onChange={(event) => setPlayerName(event.target.value)}
                    placeholder="Your name"
                    disabled={Boolean(submittedEntry)}
                    maxLength={24}
                  />
                </label>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={Boolean(submittedEntry)}
                    maxLength={80}
                  />
                </label>
              </>
            )}
            {!mustSignInForPublicScore && (
              <button className="primary-action legacy-primary" type="submit" disabled={Boolean(submittedEntry) || postingScore}>
                <Send size={16} />
                {submittedEntry ? "Score Posted" : postingScore ? "Posting..." : "Post Score"}
              </button>
            )}
          </form>
          <p>
            {formMessage ||
              (serverLeaderboardAvailable
                ? chargedAlphaUser?.authenticated
                  ? "Public scores use your Charged Alpha first name."
                  : "Create or sign in to post this score publicly."
                : "Standalone scores are stored on this device.")}
          </p>
        </section>

        <section className="storybook-leaderboard-list" aria-label="Leaderboard rankings">
          {rows.map((row, index) => (
            <article key={row.id} className={`${row.kind} ${row.highlighted ? "highlighted" : ""}`}>
              <span>#{index + 1}</span>
              <div>
                <strong>{row.label}</strong>
                <em>{row.detail}</em>
              </div>
              <b>{formatMoney(row.score)}</b>
              <small>{formatPercent(row.returnPercent)}{row.submittedAt ? ` · ${formatDateLong(row.submittedAt.slice(0, 10))}` : ""}</small>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}
