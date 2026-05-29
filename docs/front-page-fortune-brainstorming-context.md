# Front Page Fortune Brainstorming Context

Use this as context for a new brainstorming chat about additional games built around the same idea, mechanics, and design language.

## Core Game We Built

**Front Page Fortune** is a historical market prediction story game.

The player controls Jonah, who inherits $100,000 from Grandpa Silas. Grandpa was a successful investor who mysteriously died inside the town's historic newspaper press building, The Sentinel. Jonah receives Grandpa's old briefcase containing future newspaper front pages: real historical headline events from the next 20 years.

The central fantasy is:

> What if you knew future front-page headlines, but still had to decide how markets would react?

The player uses headline knowledge to choose how Jonah invests over a 20-year period. Jonah can move money between:

- S&P 500 stocks
- Bonds
- Gold
- Custom mix

When Jonah changes allocations, gains can trigger a 10% capital gains tax penalty. If he keeps the prior choice, it is treated as **No Trade**.

## Family Benchmark Story

The inheritance is shared among five grandchildren:

- **Jonah**: player-controlled, tries to use the briefcase headlines as an edge.
- **Eli**: invests fully in the S&P 500 and never sells.
- **Ruth**: buys gold jewelry because she loves gold and considers it an investment she can use.
- **Nora**: buys Grandpa's home.
- **Max**: spends his inheritance on gadgets and expensive vacations.

The sibling/cousin comparison is friendly, not antagonistic. Eli and Ruth are mostly benchmark strategies shown in the final results and ledger, not constant story conflict.

## Gameplay Loop

The player starts with $100,000 and a default classic 60/40 stock/bond custom mix.

Each round works like this:

1. The player sees Jonah's current place in the 20-year timeline.
2. The player selects any future headline date using the dashboard controls.
3. The player can skip one headline, many years, or all the way to the end.
4. Once the desired date is selected, the player hits **Play**.
5. The next screen asks the player to choose Jonah's allocation.
6. Jonah moves to the selected date, holding that allocation during the skipped time.
7. The game reveals performance and continues from that point.

Important rules:

- The player can jump forward to any future headline date.
- The player cannot go backward after committing.
- Investments hold their selected allocation until the next played date.
- Capital gains tax applies when Jonah switches investments and has gains.
- Bonds use historical annualized Treasury bill yield proxy.
- Gold uses historical gold price data.
- S&P 500 uses historical index price data.

## Dashboard Design

The current dashboard is designed around a premium vintage watch/newspaper aesthetic.

Key elements:

- A top timeline showing Jonah's progress from 1987 to 2007.
- Current balance and allocation.
- A headline selector styled like a luxury watch/date complication.
- A rolling headline stack showing previous/current/future headline cards.
- A gold date selector with month, day, and year windows.
- Up/down controls for moving through future headline dates.
- Center wheel button opens the Chapter Index.
- Green **Play** button advances to the allocation screen.
- Lower selected front-page preview with headline, weekday date, and article paragraph.
- Bottom buttons for Journal, Ledger, and Current Page.

Recent dashboard decisions:

- Headline cards no longer show duplicate dates on the left.
- The date is shown in the gold date complication instead.
- The selected front-page preview shows the date as: `Friday, November 6, 1987`.
- Selected headline card is green with gold edging.
- Market-moving shock headlines use a fixed red card treatment with red text outline.
- The text itself scrolls cleanly without a colored band moving behind it.
- The center wheel between up/down arrows opens the Chapter Index.

## Allocation Screen Design

The allocation screen is the main decision screen after hitting Play.

It shows:

- The selected future date.
- The selected headline preview.
- A timeline representation of where Jonah is and where he is moving.
- Four allocation choices:
  - Custom Mix
  - Bonds
  - S&P 500
  - Gold
- A selected-position panel with a compact bar graph showing allocation percentages and dollar amounts.
- Market Vision indicators showing whether each option gained or lost over the selected span.
- A **Play with...** button to commit.
- A **Back** button to return to the dashboard.

Important UX refinements:

- Allocation labels and descriptions must be visually separated.
- The previous allocation option is marked as **No Trade**.
- Market Vision color should be comparative:
  - Green = gain
  - Red = loss
  - Stronger intensity = larger move

## Chapter Index

The Chapter Index is an alternate navigation method.

It shows years as expandable chapters. Each year contains headline dates. The player can select a future date from the index and play to it. Past dates are hidden or unavailable after Jonah moves forward.

Chapter Index rules:

- Years default collapsed.
- Future-only dates are available.
- Green Play buttons advance to that date.
- Important/market-moving dates can be highlighted.
- The user can also skip to the 20-year end.

## Onboarding

There are two onboarding surfaces:

### How To Play Page

Concise, mobile-first, one-screen instructional page.

It includes four compact visual strips:

1. Grow the inheritance.
2. Pick a future date.
3. Choose allocation.
4. Read Market Vision.

No long advice examples. It should be glanceable.

### Dashboard Overlay

An instructional overlay appears the first time the player reaches the dashboard.

Current overlay title:

**Jonah's Dashboard**

It has a small number of callouts:

- **1. Pick Date**
- **Status**
- **2. Hit Play**
- **Journal**
- **Ledger**

Overlay can be dismissed by:

- Clicking anywhere
- Pressing Enter
- Clicking Start

It should stay sparse and not overcrowd the screen.

## Story / Journal Layer

The story is optional. The game should be playable without reading it, but richer if the player does.

Tone:

- Heartwarming
- Lighthearted
- Family-focused
- Occasionally mysterious
- Jonah should not be too serious
- Investing should be mentioned sparingly in journal entries

Story themes:

- Grandpa's mysterious time-travel connection to The Sentinel press building.
- Jonah growing up over 20 years.
- Family, work, love, marriage, children, vacations, grief, surprises.
- Fun slice-of-life events, such as trips, mishaps, odd sky events, family jokes.
- The secret to investing is ultimately connected to time, patience, and perspective.

Journal entries are optional buttons/pages, not forced gameplay.

## News / Data Layer

The game uses real historical headline events and historical market data.

Current period:

- Starts around October 26, 1987.
- Ends around October 26, 2007.
- Includes at least monthly historical headlines.
- Contains financial events and major global/cultural events.

Data sources in spirit:

- Historical S&P 500 daily prices.
- Historical gold prices.
- Historical bond/T-bill yield proxy.
- Real historical headline events.
- Images are sourced/queried as licensed/public images where possible.

Important note:

When real article excerpts are not licensed, write original newspaper-style paragraphs based on verified facts rather than copying copyrighted text.

## Visual Direction

The current visual direction blends:

- Vintage newspaper
- Old-town Sentinel press building mystery
- Leather briefcase
- Premium vintage watch / gold complication
- Dark enamel
- Champagne gold date windows
- Serif newspaper/watch typography
- Subtle metal textures and fluted gold accents

Avoid:

- Circus-like striping
- Overly loud red/green bands
- Too many instructional boxes
- Crowding mobile screens
- Excessive text on the dashboard

## Game Mechanics Worth Reusing

These mechanics are the reusable core for future game ideas:

- Player receives future information, but must interpret consequences.
- Player can jump forward in time but cannot go backward.
- Decisions hold until the next chosen time point.
- Every jump has opportunity cost.
- Benchmarks compare player strategy to simpler fixed strategies.
- Tax/friction penalizes over-trading.
- Optional story layer adds emotional stakes but does not block gameplay.
- Timeline navigation doubles as both story structure and strategy tool.
- Market Vision previews outcome magnitude visually.
- The player can play casually by skipping ahead or deeply by optimizing every event.

## Brainstorming Goal For New Chat

Brainstorm new game concepts using the same design DNA:

- Historical or future information advantage.
- Time jumps.
- Player decisions that hold across skipped time.
- Benchmark rivals or alternate strategies.
- A story wrapper that makes the mechanics emotionally meaningful.
- Real-world data or historically inspired data where possible.
- Mobile-first, one-screen decision loops.
- Optional deep lore/journal/ledger layer.

Prompt to start the new chat:

> I want to brainstorm new games built from the same mechanics as Front Page Fortune. The core idea is that the player has privileged future information, can jump forward through a timeline, chooses a strategy that holds during skipped time, and compares their results to simpler benchmark strategies. The game should be story-driven but playable even if the story is skipped. Use the context below to brainstorm several fresh game concepts, mechanics, themes, and story wrappers that could work as separate games for Charged Alpha.

## Possible Directions To Explore

- Weather futures: player has future storm/climate headlines and allocates resources, insurance, crops, energy, or commodities.
- Sports dynasty: player has future headlines about drafts, injuries, scandals, and championships, then manages a team or bets strategically.
- Startup investing: player sees future tech headlines and chooses between private companies, cash, public indexes, or patents.
- Real estate cycles: player sees future city headlines and chooses rentals, flips, home purchases, or cash.
- Geopolitical trade routes: player has future world-event newspapers and allocates shipping, commodities, currencies, or factories.
- Music/movie career: player sees future cultural headlines and chooses projects, tours, contracts, rights, or investments.
- Medical research race: player sees future scientific breakthroughs and allocates grants, trials, patents, or public health responses.
- Family business saga: player sees future town news and decides how to grow a local business across decades.

## Questions For Brainstorming

- What is the player's secret edge?
- What are the investable/choosable options?
- What is the cost of changing strategy?
- What are the benchmark characters doing?
- What real data could power the outcomes?
- What makes the story emotionally sticky?
- What makes the decision loop easy on mobile?
- What can be read deeply or skipped entirely?
- What is the final reveal or lesson?
