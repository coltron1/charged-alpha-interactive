# Sector Oracle Dedicated Chat Prompt

I want this chat to be dedicated only to **Sector Oracle**, a standalone Charged Alpha investing game at `#sector-oracle`.

Core concept:
The player inherits a brass oracle ticker that prints future market headlines. The ticker reveals what happens next, but not which sector benefits. The player jumps forward through a historical timeline, chooses one sector allocation that holds until the selected future headline, and compares results against simple benchmark strategies.

Core fantasy:
**You know the future headline. Do you know who actually wins from it?**

Current route:
`http://127.0.0.1:5173/#sector-oracle`

Gameplay loop:
1. Player starts with `$100,000`.
2. Player sees the current market headline and selects a future headline date.
3. Player chooses one allocation:
   - Balanced
   - Technology
   - Energy
   - Banks
   - Healthcare
   - Staples
   - Bonds
4. The allocation holds through every skipped headline.
5. Switching after the first move can trigger a 15% tax on profitable reallocations.
6. The game reveals the portfolio result, updates benchmarks, and moves the current date forward.
7. Player wins by reaching the final tape with the highest possible bankroll.

Benchmarks:
- Index benchmark
- Balanced benchmark
- Always Tech benchmark
- Always Bonds benchmark
- Perfect Oracle hindsight benchmark

Design language:
- Antique brass market ticker
- Observatory/oracle desk
- Dark green enamel, brass, cream paper, and electric signal glow
- Distinct from Front Page Fortune's newspaper Rolex skin
- Mobile-first, one-screen decision loop

Learning goals:
- Sector rotation
- Second-order thinking
- Not all true headlines are profitable trades
- Defensive assets have opportunity cost
- Tax friction punishes excessive switching
- The market may have already priced in the obvious story

Implementation notes:
- Current prototype uses a historically inspired return table, not final audited ETF data.
- Later data upgrade can wire in real sector ETF/index returns.
- Keep the result explanations short and concrete.
- Do not add a shared game switch nav; this should behave like its own app.
