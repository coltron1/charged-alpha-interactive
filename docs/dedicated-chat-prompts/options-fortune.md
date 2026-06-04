# Expiration Date Handoff

Use this markdown to start a dedicated new chat for the historical options game. Paste the **New Chat Starter Prompt** section into the new chat, then keep this file nearby as working context.

## New Chat Starter Prompt

I want this chat to be dedicated only to **Expiration Date**, the historical SPX options headline game at `#options-fortune`.

The game is already implemented in the local React/Vite app under `/Users/colton/Documents/New project/charged-alpha-interactive`. Please work only on this game unless I explicitly ask otherwise. Do not mix this with Front Page Fortune, Before the Siege, Harvest Ledger, or Sector Oracle.

Current local preview:
`http://127.0.0.1:5174/#options-fortune`

Core fantasy:
**You know a future market headline, but can you tell whether an option will actually pay after premium, time, volatility, taxes, and timing?**

The player controls Mara Vale, a junior clerk on a Chicago options desk. Mara inherits `$100,000`, Aunt June's locked quote case, and future headline sheets dated through a 7-year real historical market period. The player can jump forward through future headline dates, choose an options position, and either let it expire or try to time an early close during the animated chart.

## Current Game Loop

1. Player starts with `$100,000`.
2. Dashboard shows current account, performance, current headline date, selected future expiration, timeline, headline preview, and option strategy area.
3. Player can choose a future headline expiration date.
4. Player picks one position:
   - T-Bills
   - Call Option
   - Put Option
   - Straddle
5. Player hits Play.
6. The animated S&P 500 chart appears with clear profit bands.
7. If the player clicks/taps/presses Enter while the chart animates, the option closes early at the current chart point.
8. If the player does nothing, the option runs to expiration and closes at the selected headline date.
9. A recap overlay explains the result.
10. Player dismisses the recap and continues to the next headline date.

## Core Teaching Goals

- An option is a paid ticket, not the stock itself.
- Premium is paid upfront.
- Direction alone is not enough.
- The move must beat the premium/break-even line.
- Calls need a big enough move up.
- Puts need a big enough move down.
- Straddles need a large move either way because both sides cost premium.
- Options can expire worthless.
- T-Bills are the safe baseline and opportunity-cost comparison.
- Implied volatility/VIX affects how expensive the ticket is.
- A headline can be correct and still be a bad option trade.
- Timing can matter: closing early can beat waiting for expiration.
- Account result can differ from premium loss because payoff, T-bill interest, and taxes are separate.

## Data And Contract Model

- Underlying uses real historical S&P 500 prices from the project market data.
- Option periods are selected headline-to-headline windows.
- The option model is SPX-style, cash-settled, European-style, at-the-money.
- Strike is the S&P 500 close on the current headline date.
- Expiration is the future headline date selected by the player.
- Premium is modeled with historical CBOE VIX closes as the options-market volatility input plus historical Treasury bill yields.
- This is not using historical individual option-chain bid/ask data.
- Capital gains tax is currently `15%`.

## Current UI State

The game title is **Expiration Date**.

Design language:
- Chicago options desk
- Locked quote case
- Expiration stamps
- Vol tape
- Premium slips
- Strike tickets
- Green/red profit bands
- Distinct from Front Page Fortune's newspaper/watch skin

Current dashboard:
- Mobile-first.
- Timeline is a primary control at the top.
- Headline preview is below the timeline.
- The larger headline selector/rolodex controls should stay hidden below iPad-size layouts.
- Ticket dashboard/strategy banner remains active.
- Allocation/strategy choices are visual and explain option type.

Current chart animation:
- Option chart duration is `2880ms`, 20% faster than the previous `3600ms`.
- T-Bills transition remains `2000ms`.
- During animation, click/tap/Enter closes the position early.
- If not clicked, the chart reaches expiration and then shows a recap.
- Profit band appears immediately when the chart appears.
- The moving chart line is green/in target and red/out of target.
- The gold marker/runner is the timing target.

Current recap overlay:
- Appears for early closes and normal expiration.
- Stays visible until click/tap/Enter.
- Shows:
  - Final money result.
  - Needed S&P target.
  - Stopped or expired S&P level.
  - Premium P/L: option ticket result only.
  - Premium paid.
  - Option payoff.
  - T-bill interest when relevant.
  - Tax paid when relevant.
  - Best stop example, if a better in-the-money exit existed.
  - "None" if no profitable stop appeared.
- Short-landscape layouts use a split chart/recap layout so the recap is not clipped.

## Important Implementation Files

Main game:
- `src/games/options-fortune/OptionsFortuneGame.tsx`

Simulation/model:
- `src/games/options-fortune/simulation/optionsFortune.ts`
- `src/games/options-fortune/simulation/optionsFortune.test.ts`

Copy/headlines:
- `src/games/options-fortune/content/optionsCopy.ts`
- `src/games/options-fortune/content/optionsHeadlines.ts`

Shared animation/chart overlay:
- `src/shared/game-ui/TimeJumpTransition.tsx`

Styles:
- `src/App.css`

Smoke test:
- `scripts/smoke-options-fortune.mjs`

Dedicated chat prompt:
- `docs/dedicated-chat-prompts/options-fortune.md`

## Recent Work Completed

- Added the options game at `#options-fortune`.
- Changed it to a 7-year historical timeline.
- Built the ticket dashboard and option strategy visuals.
- Added chart animation for the option position.
- Added timing interaction: click/tap/Enter closes early.
- Made the animated chart show profit zones clearly.
- Added real-time money and payoff feedback during the animation.
- Rebuilt the recap overlay from scratch.
- Added best-stop markers and player stop/expiration markers.
- Added recap for normal expiration if the player does not close early.
- Added Premium P/L so the player understands premium loss separately from account result.
- Added T-bill interest and tax as separate recap lines.
- Sped option chart animation to `2880ms`.
- Added responsive layout fixes for mobile and short landscape screens.

## Verification Commands

Run from `/Users/colton/Documents/New project/charged-alpha-interactive`:

```bash
npm run build
npm test
npm run smoke:options
```

Current known passing state:
- `npm run build` passes.
- `npm test` passes.
- `npm run smoke:options` passes.
- Browser checked both:
  - letting an option run to expiration,
  - closing an option early.

## Product Direction

Keep the game very simple and visual. A 6-year-old should be able to understand:
- You paid for a ticket.
- The market line needed to reach the green zone.
- If it did not, the ticket lost money.
- If it did, the ticket paid.
- Timing can help.

Use bigger visual explanations over dense financial text. Put deeper details into Journal, Ledger, or Front Page overlays.

## Likely Next Improvements

- Make the recap even more child-readable with a simple "Ticket Math" equation:
  `Payoff - Premium + T-Bill Interest - Tax = Final Result`
- Add a small animated ticket graphic that tears/burns/stamps "paid" or "expired" after the chart.
- Make the best-stop marker more obvious when it exists.
- Improve option-choice visuals for calls/puts/straddles so each feels like a distinct toy-like mechanic.
- Add a replay/slow-motion option for the chart animation.
- Add a glossary drawer for:
  - premium,
  - strike,
  - break-even,
  - expiration,
  - in the money,
  - out of the money.
- Continue checking all layouts after every UI change, especially:
  - small phones,
  - iPad/tablet,
  - short landscape laptop windows.

## Guardrails

- Keep Expiration Date independent from the other games.
- Do not add a shared game switch nav.
- Keep the first screen as the playable dashboard/prologue flow, not a marketing landing page.
- Avoid making the player read long text to understand the result.
- Do not imply these are exact historical option-chain trades; keep the contract model explanation clear.
- Keep the educational disclaimer visible somewhere appropriate.
