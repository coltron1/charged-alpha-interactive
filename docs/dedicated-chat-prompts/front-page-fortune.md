# Front Page Fortune Dedicated Chat Prompt

I want this chat to be dedicated only to **Front Page Fortune**, the historical market prediction story game at `#headline-market`.

Core concept:
Jonah inherits `$100,000` and Grandpa Silas's mysterious briefcase of future newspaper front pages. The player knows future historical headlines, but must decide how markets will react.

Core fantasy:
**What if you knew future front-page headlines, but still had to decide how markets would react?**

Current route:
`http://127.0.0.1:5173/#headline-market`

Core loop:
1. Player starts with `$100,000`.
2. Dashboard shows Jonah's current date, balance, headline selector, and selected front-page preview.
3. Player can jump to any future headline date, but cannot go backward after committing.
4. Player chooses an allocation:
   - Custom mix
   - Bonds
   - S&P 500
   - Gold
5. Allocation holds through the skipped period.
6. Changing allocation after gains can trigger a 15% capital gains tax.
7. Player compares final results against simpler family benchmark strategies.

Benchmark family:
- Jonah: player controlled
- Eli: always S&P 500
- Ruth: gold
- Nora: Grandpa's home
- Max: spending

Design language:
- Vintage newspaper
- Leather briefcase
- Historic Sentinel press building mystery
- Premium gold date complication/watch interface
- Dark enamel, champagne gold, serif typography

Important current UX:
- Dashboard overlay explains date picking, allocation buttons, Play, selected article, and Current Page.
- Mobile screens hide the top status banner.
- Landscape iPad/laptop layouts place the article beside the selector and allocation tools.
- Journal, Ledger, and Current Page are fixed small bottom controls.

Learning goals:
- Future information is not the same as market prediction
- Time in the market versus timing the market
- Tax friction and over-trading
- Diversification versus concentrated bets
- Gold/bonds/stocks react differently to the same headline

Implementation notes:
- Avoid shared game switch nav.
- Keep dashboard dense but readable.
- Use original newspaper-style article copy when excerpts are not licensed.
