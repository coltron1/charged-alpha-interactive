# Harvest Ledger Dedicated Chat Prompt

I want this chat to be dedicated only to **Harvest Ledger**, the grain futures headline game at `#futures-fortune`.

Core concept:
Riley Bell inherits `$100,000`, her granddad's locked grain ledger, and future front-page clippings about droughts, floods, crop reports, trade wars, storms, and commodity shocks. The player knows the future agricultural headlines, but must decide which grain futures contract deserves the risk until the next clipping.

Core fantasy:
**You know the crop headline. Can you choose the right futures contract before the board reprices it?**

Current route:
`http://127.0.0.1:5173/#futures-fortune`

Core loop:
1. Player starts with `$100,000`.
2. Dashboard shows Riley's current clipping, account value, selected future clipping, and futures choice tools.
3. Player can jump to any future headline date, but cannot go backward after committing.
4. Player chooses one position:
   - Treasury Bills
   - Corn Futures
   - Soybean Futures
   - Wheat Futures
5. The chosen position holds through the skipped period.
6. Crop trades buy as many whole modeled grain contracts as Riley can afford.
7. Leftover cash stays in Treasury bills.
8. Contracts are modeled as rolling, cash-settled futures, not physical delivery.
9. Profitable reallocations can trigger a 15% capital gains tax.
10. Final results compare Riley against simple benchmark paths.

Contract rule:
Each real grain futures contract represents `5,000` bushels. In the game, each crop trade buys whole simulated CBOT-style contracts based on the current headline date price. If a jump crosses expiration, the position rolls into the next listed contract month and uses continuous futures prices as the proxy.

Benchmark strategies:
- Riley: player controlled
- Always Corn
- Always Soybeans
- Always Wheat
- Treasury Bills
- Perfect hindsight tape

Design language:
- Rural grain elevator office
- Locked ledger
- Crop report clippings
- Weathered paper, elevator scale, bushel math, field notes
- Distinct from Front Page Fortune's newspaper/watch skin and Sector Oracle's brass ticker skin

Learning goals:
- Futures contracts are leveraged promises tied to standardized commodities
- Contract size matters
- Weather, supply reports, exports, and policy can move different crops differently
- Correct headline direction can still lose if the wrong crop is chosen
- Treasury bills teach opportunity cost
- Tax friction and over-trading matter
- Futures can gain or lose through cash settlement without physical delivery

Story tone:
- Heartwarming rural family story
- Riley is practical, funny, and curious
- Granddad's ledger is mysterious but grounded in farm life
- Journal notes should be optional and not block gameplay

Implementation notes:
- Keep explanations concrete and visual.
- Avoid overwhelming players with real futures jargon on the main dashboard.
- Put deeper contract explanations in article, ledger, or journal overlays.
- Keep route independent; do not add a shared game switch nav.
