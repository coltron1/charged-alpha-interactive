# Before The Siege Dedicated Chat Prompt

I want this chat to be dedicated only to **Before The Siege**, the medieval future-omen survival game at `#before-siege`.

Core concept:
The player leads a northern medieval city through 20 harsh years before a final siege by an army of darkness. The ruler has a magical future-telling watch that shows omens of attacks, famine, sickness, unrest, opportunity, and darkness.

Core fantasy:
**You can see the dangers coming. Can you prepare the city without making the future worse?**

Current route:
`http://127.0.0.1:5173/#before-siege`

Core loop:
1. Player views future omens on a winter watch/timeline interface.
2. Player can jump ahead to a selected future year.
3. The selected omen projects danger onto a living kingdom board.
4. Player toggles built-in board defenses and preparations directly on the board.
5. Preparations cancel threats when matched.
6. Surplus preparation can carry forward.
7. More frequent meddling should make later timelines harder, but can create a higher score if handled well.
8. Survival is required before wealth, happiness, population, or greatness matter.
9. Final event is the Great Siege by the army of darkness.

Design language:
- Cold northern medieval city
- Winter watch interface around the board
- Living grid-like kingdom board
- Castle, walls, roads, farms, granaries, healers, cavalry, markets, rival cities
- Clear path lighting/circuit-style danger indicators
- Cartoon omen imagery should be clear and obvious, not text-heavy

Threat categories:
- Attack / raids
- Famine / crop failure
- Sickness / plague
- Unrest / rebellion
- Opportunity / treaty / trade
- Darkness / final siege preparation

Scoring priorities:
1. Survival
2. City wealth
3. Population
4. Happiness / morality
5. Greatest city aggregate score

Implementation notes:
- Keep resource numbers tiny, preferably `0-3`.
- No drag-and-drop.
- Choices should be direct toggles already built into the board.
- Board clarity matters more than decorative complexity.
- Avoid shared game switch nav.
