# Charged Alpha Interactive

Charged Alpha Interactive is a Vite, TypeScript, and React playground for fast finance games.

## Run

```bash
npm install
npm run dev
```

Local URL:

```text
http://127.0.0.1:5173/
```

Game routes can be selected by hash or clean path:

```text
http://127.0.0.1:5173/#headline-market
http://127.0.0.1:5173/games/front-page-fortune
```

When another site embeds a single game from the shared bundle, set this before the Vite script:

```html
<script>
  window.CHARGED_ALPHA_GAME_SLUG = "front-page-fortune";
</script>
```

## Portable Builds

Use `VITE_BASE_PATH` when the built app is served from a subdirectory:

```bash
VITE_BASE_PATH=/static/games/interactive/ npm run build
```

The Charged Alpha website can serve the generated `dist` folder from `static/games/interactive/`. Public images are resolved from Vite's base path, so the same bundle can move between localhost, Charged Alpha, or a standalone GitHub app without rewriting asset URLs.

Front Page Fortune supports an optional Charged Alpha score API:

```text
GET  /auth/api/me
GET  /games/api/progress
GET  /games/api/leaderboard/front-page-fortune
POST /games/api/scores
```

If those endpoints are missing, the game falls back to local device scores.

Keep unlock sequencing in the host website catalog, not inside the individual game code. A game should be able to run standalone, while Charged Alpha decides whether the account has unlocked it.

## Checks

```bash
npm test
npm run lint
npm run build
npm run smoke
```

`npm run smoke` expects the dev server to be running. Use `npm run smoke:alpha` or `npm run smoke:headline` to run one browser path.

## Current Slice

- Headline Market: start with `$100,000`, turn through Jonah's storybook of historical newspaper headlines, hold current positions or rebalance between cash, the S&P 500, and gold, then reveal the next chapter return.
- Headline Market benchmarks Jonah against all-cash, his brother Eli's S&P 500 index-fund plan, his sister Ruth's gold plan, a pre-crash buy-and-hold ghost, and a hindsight oracle.
- Headline Market lets Jonah set a standing default mix, trade on the headline day or the following day, and applies a simplified 15% capital gains tax drag to positive gains realized by reallocating.
- Headline Market uses deterministic seeded historical newspaper pages with S&P 500 closes and gold PM fixes around each headline date.
- Five 15-30 second stock cards.
- Alpha Pit board layout with stock cards, thesis/action cards, alpha chips, tape die, Heat track, and round ledger.
- Sequential move prompts for thesis, tools, action, and tape settlement.
- Per-round thesis choice: `Momentum`, `Quality`, or `Contrarian`.
- Three actions: `Back It`, `Hedge`, or `Pass`.
- Two scarce strategy tools: `Scout` and `Charge`.
- Seeded market-tape surprises that can help or hurt any read.
- `Pass` earns 10% carry on current alpha with no Heat and ignores market-tape scoring.
- Faster-compounding `Heat` meter replaces the old flat risk meter.
- Hover tooltips expose the scoring formulas and value ranges.
- Final score with benchmark leaderboard comparison.
- Fictional companies, catalysts, market regimes, and thesis/Heat cards.
- Deterministic seeded runs.
- Local analytics stubs.

Educational only. Not financial advice.
