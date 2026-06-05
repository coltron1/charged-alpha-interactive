import type { HeadlineEvent } from "../../headline-market/content/events";
import { sp500DailySeries } from "../../headline-market/content/marketHistory";

type OptionsHeadlineSeed = {
  id: string;
  date: string;
  era: string;
  headline: string;
  deck: string;
  lede: string;
  facts: string[];
  lifeNote: string;
  lesson: string;
  major?: boolean;
  sourceLabel: string;
};

const seeds: OptionsHeadlineSeed[] = [
  {
    id: "spx-1997-trading-curbs",
    date: "1997-10-27",
    era: "Circuit Breaker",
    headline: "S&P 500 futures freeze as Asia crisis triggers historic U.S. trading curbs",
    deck: "The Dow's 554-point slide spills through index futures and shuts the NYSE early.",
    lede:
      "Stocks were stopped before the closing bell Monday after a selloff that began in Asian markets rolled into Wall Street and triggered post-1987 trading curbs. Index desks watched S&P 500 futures seize up as traders tried to decide whether the break was panic, repricing, or both.",
    facts: ["Dow industrials fell 554.26 points on October 27, 1997.", "The SEC later reviewed trading and index reporting problems around the event.", "For option traders, the session is a clean lesson in gap risk and liquidity risk."],
    lifeNote: "Mara's first future sheet is not subtle. She tapes it inside the quote case and writes, 'Options are only liquid until everybody needs the exit.'",
    lesson: "When volatility arrives all at once, options can be powerful, but fills and timing matter.",
    major: true,
    sourceLabel: "CNN Money and SEC review of the October 1997 trading curbs",
  },
  {
    id: "spx-1998-crosses-1000",
    date: "1998-02-02",
    era: "Four Digits",
    headline: "S&P 500 closes above 1,000 for the first time as bull market presses on",
    deck: "The broad index moves into four digits while technology and large-cap momentum keep bids firm.",
    lede:
      "The S&P 500 pushed through another psychological marker Monday, closing above 1,000 for the first time. The milestone gave call buyers another reason to believe momentum could outrun valuation worries, at least for one more expiration cycle.",
    facts: ["The S&P 500 first closed above 1,000 on February 2, 1998.", "Milestone closes often draw new attention even when they do not change earnings or rates.", "Calls can profit from momentum, but premium rises when everybody sees the same breakout."],
    lifeNote: "Mara buys a paper coffee cup for every trader who said 'round numbers don't matter' before lunch and then quoted the round number all afternoon.",
    lesson: "Breakouts can reward calls, but visible momentum usually makes calls more expensive.",
    sourceLabel: "S&P 500 closing milestone records",
  },
  {
    id: "spx-1998-russia-ltcm",
    date: "1998-08-31",
    era: "Credit Shock",
    headline: "S&P 500 tumbles as Russia default and hedge-fund losses hit risk appetite",
    deck: "Credit fear replaces summer complacency, sending volatility through index desks.",
    lede:
      "U.S. equities sank Monday as Russia's debt crisis and losses tied to highly leveraged hedge-fund trades forced investors to cut risk. The S&P 500 fell hard enough to make downside protection the center of the options pit.",
    facts: ["Academic studies identify August 31, 1998 as a crash day for the S&P 500 during the Russia/LTCM crisis.", "The episode made counterparty and leverage risk front-page market concerns.", "Puts can pay quickly when forced selling overwhelms normal price discovery."],
    lifeNote: "A trader named Vince calls volatility 'weather with margin calls.' Mara writes it down even though Vince also eats mustard packets for lunch.",
    lesson: "Puts are insurance before the fire. Once the alarm rings, protection gets expensive.",
    major: true,
    sourceLabel: "Market-history research on the August 1998 S&P 500 crisis",
  },
  {
    id: "spx-1998-fed-cuts",
    date: "1998-10-15",
    era: "Fed Backstop",
    headline: "Stocks jump as Fed cuts rates again to steady crisis-hit markets",
    deck: "Policy support turns a credit scare into a relief rally.",
    lede:
      "The Federal Reserve delivered another rate cut Thursday as officials worked to restore confidence after weeks of credit-market stress. Index traders marked up equities quickly, leaving put holders staring at evaporating fear premium.",
    facts: ["The Fed cut rates in autumn 1998 as global-market stress and LTCM worries spread.", "Relief rallies can punish stale puts even when the original danger was real.", "Calls can work after policy surprises if the market believes the backstop is credible."],
    lifeNote: "Mara learns that traders can complain about the Fed all morning and cheer the Fed by lunch.",
    lesson: "Policy surprise can flip the option board faster than a headline alone.",
    sourceLabel: "Federal Reserve 1998 crisis-response chronology",
  },
  {
    id: "spx-1999-dow-10000",
    date: "1999-03-29",
    era: "Milestone Fever",
    headline: "Blue-chip milestone lifts market mood as index traders chase upside",
    deck: "The Dow crosses 10,000 and the S&P 500 rides the same late-cycle optimism.",
    lede:
      "Wall Street celebrated a headline number Monday as the Dow pushed through 10,000 and bullish sentiment spilled into broad-index trading. The S&P 500 options crowd treated the milestone less as math and more as momentum.",
    facts: ["The Dow Jones Industrial Average first closed above 10,000 in March 1999.", "Broad market sentiment often bleeds across indexes even when the headline index differs.", "Momentum headlines can make call spreads tempting but crowded."],
    lifeNote: "Mara's uncle leaves a voicemail saying he is 'basically a genius now' because his mutual fund statement arrived green.",
    lesson: "Index euphoria can lift calls, but crowded optimism can turn premium into a trap.",
    sourceLabel: "Dow and S&P 500 milestone reporting",
  },
  {
    id: "spx-2000-peak",
    date: "2000-03-24",
    era: "Bubble Peak",
    headline: "S&P 500 reaches dot-com era peak as tech valuations dominate the tape",
    deck: "The broad index prints a record close while Nasdaq fever still controls risk appetite.",
    lede:
      "The S&P 500 closed at a dot-com-era high Friday, capping a run in which internet and technology enthusiasm pulled the broad market into record territory. Calls looked obvious in the rearview mirror, which is usually when the option board starts getting dangerous.",
    facts: ["The S&P 500's dot-com peak close came in March 2000.", "The Nasdaq Composite had peaked earlier in March 2000.", "At market peaks, calls can be expensive because recent realized gains are fresh in every trader's mind."],
    lifeNote: "Mara celebrates by buying a used office chair that immediately sinks to its lowest setting. She calls it 'portfolio foreshadowing.'",
    lesson: "The right direction yesterday can become the wrong premium today.",
    major: true,
    sourceLabel: "S&P 500 closing milestone records and dot-com market history",
  },
  {
    id: "spx-2000-nasdaq-break",
    date: "2000-04-14",
    era: "Tech Break",
    headline: "Nasdaq rout drags S&P 500 lower as dot-com selling turns violent",
    deck: "A week of technology liquidation pushes option desks from greed to damage control.",
    lede:
      "Technology shares broke sharply Friday, dragging the broader market lower and shaking the belief that dips in internet stocks would always be bought. Index puts suddenly had the kind of move they need, but only traders already holding them got the cleanest payoff.",
    facts: ["On April 14, 2000, the Nasdaq fell sharply, ending a week in which it lost about a quarter of its value.", "The S&P 500 was pulled into the repricing as technology weight grew.", "Puts need the move to arrive before expiration and before premium reprices."],
    lifeNote: "Mara tapes a Pets.com ad to the case and writes, 'Mascots are not cash flow.'",
    lesson: "Puts can teach speed: being right after the crash is different from being long protection before it.",
    major: true,
    sourceLabel: "Dot-com crash market reporting",
  },
  {
    id: "spx-2001-fed-surprise",
    date: "2001-01-03",
    era: "Surprise Cut",
    headline: "Fed surprise rate cut sparks S&P 500 relief rally after tech wreck",
    deck: "A sudden policy move forces traders to reprice recession risk and short exposure.",
    lede:
      "The Federal Reserve surprised markets with an intermeeting rate cut Wednesday, igniting a rally in equities that had been beaten down by months of technology losses. Calls finally had a friend in policy, while defensive trades had to survive a violent bounce.",
    facts: ["The Fed made an intermeeting rate cut on January 3, 2001.", "Policy shocks can create sudden upside moves inside broader downtrends.", "Short-dated puts can lose money even when the larger market trend remains weak."],
    lifeNote: "Mara learns the office has two moods: 'The Fed is behind the curve' and 'The Fed saved us,' sometimes in the same hour.",
    lesson: "A market can rally hard inside a bear trend, which is why option timing is its own skill.",
    sourceLabel: "Federal Reserve rate-cut chronology and market reporting",
  },
  {
    id: "spx-2001-nyse-reopens",
    date: "2001-09-17",
    era: "Market Reopens",
    headline: "S&P 500 drops as U.S. markets reopen after September 11 attacks",
    deck: "The first trading day after the closure brings heavy selling and historic emotion.",
    lede:
      "U.S. markets reopened Monday after the September 11 attacks and stocks fell sharply as investors assessed the human, economic, and security shock. The S&P 500's decline turned protective options into a case study in disaster risk and market closure risk.",
    facts: ["U.S. exchanges were closed after September 11 and reopened on September 17, 2001.", "Forbes reported the S&P 500 declined 5% on the reopening day.", "Options cannot always be adjusted while markets are closed."],
    lifeNote: "Mara does not write jokes that week. She writes names, phone numbers, and the word 'perspective' three times.",
    lesson: "Some risks are larger than trading. Options can hedge price, not the fact that markets may close.",
    major: true,
    sourceLabel: "Forbes and NYSE reopening market reports",
  },
  {
    id: "spx-2001-enron",
    date: "2001-12-03",
    era: "Trust Break",
    headline: "Enron bankruptcy deepens market distrust after dot-com losses",
    deck: "Accounting fear joins recession fear, changing what investors demand from earnings.",
    lede:
      "Enron's bankruptcy filing hit a market already wounded by recession and the technology crash. Index traders had to decide whether the scandal was isolated or a warning that reported earnings across corporate America deserved a larger discount.",
    facts: ["Enron filed for bankruptcy in early December 2001.", "It was one of the largest bankruptcies in U.S. history at the time.", "Index options react not only to earnings but to confidence in the earnings themselves."],
    lifeNote: "Mara starts calling footnotes 'where the bodies might be buried,' then regrets saying it near compliance.",
    lesson: "Trust shocks can keep volatility elevated even after prices already fell.",
    sourceLabel: "Enron bankruptcy history and market commentary",
  },
  {
    id: "spx-2002-worldcom",
    date: "2002-06-26",
    era: "Fraud Wave",
    headline: "WorldCom accounting fraud sends another shock through battered equity market",
    deck: "Corporate credibility cracks again, keeping S&P 500 traders focused on downside tails.",
    lede:
      "WorldCom's accounting scandal rattled investors Wednesday and added a fresh credibility crisis to the bear market. The S&P 500 tape was no longer just debating growth; it was repricing whether the numbers behind growth could be trusted.",
    facts: ["WorldCom disclosed a multibillion-dollar accounting fraud in June 2002.", "The company filed for bankruptcy in July 2002.", "Scandal clusters can make volatility persistent rather than momentary."],
    lifeNote: "Mara's desk makes a new rule: if somebody says 'pro forma' twice before breakfast, everyone gets to leave early.",
    lesson: "Repeated credibility shocks can favor volatility trades, not just directional trades.",
    major: true,
    sourceLabel: "Guardian, CNN Money, and WorldCom scandal records",
  },
  {
    id: "spx-2002-reform-rally",
    date: "2002-07-24",
    era: "Bear Rally",
    headline: "S&P 500 jumps as corporate reform hopes spark a violent bear-market rally",
    deck: "After months of fraud headlines, buyers finally force shorts to cover.",
    lede:
      "Stocks staged a sharp about-face Wednesday as investors reacted to corporate reform progress and high-profile arrests tied to accounting scandals. The rally did not erase the bear market, but it reminded option traders that downside trends can still produce vicious upside moves.",
    facts: ["Major indexes rallied sharply on July 24, 2002 amid corporate reform hopes.", "Bear-market rallies can be large enough to punish outright puts.", "Straddles can help when direction is uncertain but realized movement is large."],
    lifeNote: "Mara writes, 'Bear markets do not move in straight lines,' then underlines it after losing a sandwich bet.",
    lesson: "Puts are not free money in a bear market; path matters.",
    sourceLabel: "Los Angeles Times market report, July 24, 2002",
  },
  {
    id: "spx-2002-bear-low",
    date: "2002-10-09",
    era: "Bear Low",
    headline: "S&P 500 sinks to dot-com bear-market low after two years of selling",
    deck: "The broad index reaches the trough of a 49% decline from its 2000 peak.",
    lede:
      "The S&P 500 touched the low of the dot-com bear market Wednesday, capping a long decline that began with internet excess and ended in recession, fraud scandals, and exhausted confidence. For options traders, the lesson was brutal: the biggest move was not one day, but a long sequence of expirations.",
    facts: ["The S&P 500 fell roughly 49% from its 2000 peak to its October 2002 low.", "Long declines can reward repeated downside positioning but punish traders who run out of premium too early.", "Expiration selection matters as much as direction."],
    lifeNote: "Mara realizes the future sheets are not a cheat code. They are more like a weather report for a boat she still has to sail.",
    lesson: "Knowing a bear market is coming is not enough; options require choosing the right expiration and premium.",
    major: true,
    sourceLabel: "Dot-com crash and S&P 500 trough records",
  },
  {
    id: "spx-2003-war-low",
    date: "2003-03-12",
    era: "War Premium",
    headline: "S&P 500 wavers near lows as Iraq war risk keeps volatility bid",
    deck: "Geopolitical uncertainty sits on top of a tired bear market.",
    lede:
      "Stocks remained under pressure as traders priced the possibility of war in Iraq and wondered whether the bear market had one more leg lower. Option premiums stayed firm because the next headline could plausibly break either way.",
    facts: ["March 2003 marked a major turning area for U.S. equities after the dot-com bear market.", "Geopolitical uncertainty can lift both calls and puts through volatility premium.", "Straddles need movement large enough to overcome that elevated premium."],
    lifeNote: "Mara's desk starts a pool on which phrase appears more often: 'priced in' or 'nobody knows.' Nobody wins.",
    lesson: "High uncertainty helps option sellers charge more; buyers still need a move big enough to matter.",
    sourceLabel: "Market-history records around the March 2003 equity turning point",
  },
  {
    id: "spx-2003-recovery-rally",
    date: "2003-05-27",
    era: "Recovery Bid",
    headline: "S&P 500 climbs as tax-cut hopes and recovery trades revive risk appetite",
    deck: "After years of bear-market damage, policy and earnings hopes pull buyers back.",
    lede:
      "The broad market continued to recover as investors looked toward tax cuts, easier policy, and the possibility that earnings had finally troughed. Calls that had looked reckless during the bear market started behaving like recovery tickets.",
    facts: ["U.S. stocks rallied in 2003 as recession fears faded and policy support remained strong.", "Early recoveries can be powerful because positioning is still defensive.", "Calls work best when price moves before premium catches up."],
    lifeNote: "Mara buys a green marker and immediately misplaces it, which feels rude given the tape.",
    lesson: "Call options can benefit when the market turns before the crowd believes it.",
    sourceLabel: "2003 equity recovery market history",
  },
  {
    id: "spx-2004-fed-hike-cycle",
    date: "2004-06-30",
    era: "Hike Cycle",
    headline: "Fed begins rate-hike cycle as S&P 500 weighs growth against tighter money",
    deck: "The first hike in years changes the discount-rate conversation.",
    lede:
      "The Federal Reserve raised rates Wednesday, beginning a tightening cycle after years of post-bubble accommodation. Index traders had to decide whether the move confirmed a healthier economy or threatened valuations that had recovered from bear-market lows.",
    facts: ["The Fed began raising rates on June 30, 2004.", "Rate cycles can create chop instead of clean direction.", "Options buyers can be right on the macro story and still lose if the index goes nowhere."],
    lifeNote: "Mara writes 'measured pace' on a sticky note and watches it become the office's least exciting catchphrase.",
    lesson: "Macro events often create range trading; premium can decay while traders wait for clarity.",
    sourceLabel: "Federal Reserve 2004 rate-hike records",
  },
  {
    id: "spx-2005-katrina-oil",
    date: "2005-08-29",
    era: "Oil Shock",
    headline: "S&P 500 traders brace for energy shock as Hurricane Katrina hits Gulf Coast",
    deck: "Oil, insurers, transports, and consumer risk all move onto the same screen.",
    lede:
      "Hurricane Katrina struck the Gulf Coast Monday, forcing markets to reprice energy disruption, insurance losses, and the human cost of the disaster. For index option traders, the headline created cross-currents rather than a single clean direction.",
    facts: ["Hurricane Katrina made landfall on August 29, 2005.", "Energy shocks can help some sectors while hurting others.", "Index options compress many sector stories into one net move."],
    lifeNote: "Mara stops complaining about the office air conditioner for a full week, which her coworkers treat as growth.",
    lesson: "Broad-index options can mute single-sector shocks when winners and losers offset inside the index.",
    sourceLabel: "Hurricane Katrina and market-impact reporting",
  },
  {
    id: "spx-2006-inflation-selloff",
    date: "2006-06-13",
    era: "Inflation Scare",
    headline: "S&P 500 slides as inflation fears and global selling hit risk assets",
    deck: "Rate worries turn a calm market into a correction test.",
    lede:
      "Stocks fell Tuesday as inflation anxiety and global selling pressured equities after a long advance. The move reminded traders that quiet tapes can still hide crowded positioning, especially when rates become the headline.",
    facts: ["Global equities sold off in mid-2006 amid inflation and rate concerns.", "Rate-driven selloffs can raise put values even without a recession headline.", "Calls can struggle when higher discount rates challenge multiples."],
    lifeNote: "Mara's cousin asks if inflation means his sandwich is an investment. Mara says only if he can sell it before lunch.",
    lesson: "Inflation scares can turn low-volatility markets into sudden put markets.",
    sourceLabel: "Mid-2006 global-market selloff reporting",
  },
  {
    id: "spx-2007-china-subprime",
    date: "2007-02-27",
    era: "Global Selloff",
    headline: "S&P 500 suffers worst drop in years as China selloff and subprime worries collide",
    deck: "A global risk break snaps a long calm stretch in U.S. equities.",
    lede:
      "Stocks tumbled Tuesday after a sharp Chinese-market selloff, weak U.S. durable-goods data, and growing subprime concerns hit Wall Street at once. The S&P 500 drop made volatility feel awake again after months of steady gains.",
    facts: ["CNNMoney reported broad selling on February 27, 2007 after China and Europe fell.", "UPI reported the S&P 500 fell 50.33 points, or 3.47%, that day.", "This is the kind of headline that teaches why puts can suddenly reprice."],
    lifeNote: "Mara writes 'the world is one trade' on the case and then checks whether that sounds too dramatic. It does. She keeps it.",
    lesson: "Correlation can jump in a selloff, making index puts more powerful than single-stock guesses.",
    major: true,
    sourceLabel: "CNNMoney, CNBC, PBS, and UPI market reports",
  },
  {
    id: "spx-2007-credit-crunch",
    date: "2007-07-26",
    era: "Credit Crunch",
    headline: "S&P 500 drops as credit-crunch fears spread across global markets",
    deck: "Treasuries rally while stocks sell off on mortgage and financing stress.",
    lede:
      "U.S. and European stocks fell sharply Thursday as investors fled to safety on fears that mortgage losses and tighter credit would spread through the financial system. Index option traders began treating subprime not as a housing niche, but as a market-wide volatility problem.",
    facts: ["Reports from July 2007 describe global stock-market selling on credit-crunch fears.", "The S&P 500 fell 2.3% to 1,482.66 in the cited market report.", "Credit events often create volatility before the final economic damage is known."],
    lifeNote: "Mara learns that 'contained' is a dangerous word when everyone keeps repeating it.",
    lesson: "A credit headline can turn slow balance-sheet fear into fast index movement.",
    major: true,
    sourceLabel: "MercoPress market report on July 2007 credit-crunch selling",
  },
  {
    id: "spx-2007-bnp-freeze",
    date: "2007-08-09",
    era: "Liquidity Freeze",
    headline: "S&P 500 futures sink as BNP Paribas freezes funds tied to subprime debt",
    deck: "A European fund freeze tells U.S. traders that mortgage risk has gone global.",
    lede:
      "Markets were rattled Thursday after BNP Paribas froze funds exposed to U.S. subprime mortgages, forcing traders to confront the possibility that liquidity itself was disappearing. The headline moved from credit desks to the S&P 500 options pit before breakfast.",
    facts: ["BNP Paribas froze subprime-exposed funds on August 9, 2007.", "Forbes and CNBC reported broad market concern as the subprime crisis spread to Europe.", "Liquidity shocks can make puts and straddles valuable because gaps widen quickly."],
    lifeNote: "Mara circles the word 'freeze' so hard the pen tears the page.",
    lesson: "Liquidity risk is an option lesson: when exits disappear, convexity becomes expensive fast.",
    major: true,
    sourceLabel: "Forbes, CNBC, Irish Times, and Bloomberg crisis retrospectives",
  },
  {
    id: "spx-2007-fed-cut",
    date: "2007-09-18",
    era: "Rescue Rally",
    headline: "Fed rate cut sends S&P 500 higher as credit fears meet policy relief",
    deck: "Traders get the first big easing answer to the summer liquidity scare.",
    lede:
      "The Federal Reserve cut rates Tuesday and equity traders responded with a rally, betting that policy support could slow the credit-market damage. The move created the classic options problem: the bad news was real, but the immediate trade went the other way.",
    facts: ["The Fed cut rates in September 2007 as credit-market stress intensified.", "Policy rallies can arrive in the middle of deteriorating fundamentals.", "Puts can lose value on relief even when the larger danger is not gone."],
    lifeNote: "Mara writes, 'A rescue rally is still a rally,' then puts the note where her stubborn side can see it.",
    lesson: "Options mark to the path, not the thesis.",
    sourceLabel: "Federal Reserve and September 2007 market reporting",
  },
  {
    id: "spx-2007-record-high",
    date: "2007-10-09",
    era: "Last High",
    headline: "S&P 500 closes at record high even as credit cracks widen beneath the tape",
    deck: "The index finishes at 1,565.15, a peak that will not be reclaimed for years.",
    lede:
      "The S&P 500 closed at a record Tuesday, helped by confidence that the Federal Reserve would manage the credit storm. The high looked triumphant on the tape, but it would later become the pre-crisis summit options traders wished they had respected.",
    facts: ["UPI reported the S&P 500 closed at 1,565.15 on October 9, 2007.", "The level was the pre-financial-crisis peak for the index.", "Market peaks are hard because bullish price action and growing risk can coexist."],
    lifeNote: "Mara locks the quote case and finally understands why Aunt June never wrote 'easy money' in the margins.",
    lesson: "A record high can be either confirmation or warning. Options demand knowing which before expiration.",
    major: true,
    sourceLabel: "UPI and S&P 500 closing-high records",
  },
];

function getSpCloseOnOrAfter(date: string) {
  const point = sp500DailySeries.find((entry) => entry.date >= date) ?? sp500DailySeries.at(-1);
  if (!point) {
    return { date, value: 0 };
  }
  return point;
}

function calculateReturn(start: number, end: number) {
  return start > 0 ? (end / start - 1) * 100 : 0;
}

export function buildOptionsHeadlineEvents(): HeadlineEvent[] {
  return seeds.map((seed, index) => {
    const nextSeed = seeds[index + 1];
    const endDate = nextSeed?.date ?? "2007-10-26";
    const startPrice = getSpCloseOnOrAfter(seed.date);
    const endPrice = getSpCloseOnOrAfter(endDate);
    const periodReturn = calculateReturn(startPrice.value, endPrice.value);

    return {
      id: seed.id,
      date: seed.date,
      endDate,
      era: seed.era,
      headline: seed.headline,
      deck: seed.deck,
      setup: seed.lede,
      marketQuestion: "Does Mara choose a Call Option, Put Option, Straddle, or T-Bills until the selected expiration?",
      lifeNote: seed.lifeNote,
      startClose: startPrice.value,
      endClose: endPrice.value,
      periodReturn,
      beforeStartClose: startPrice.value,
      beforeEndClose: endPrice.value,
      beforePeriodReturn: periodReturn,
      afterStartClose: startPrice.value,
      afterEndClose: endPrice.value,
      afterPeriodReturn: periodReturn,
      goldStart: 1,
      goldEnd: 1,
      goldReturn: 0,
      beforeGoldStart: 1,
      beforeGoldEnd: 1,
      beforeGoldReturn: 0,
      afterGoldStart: 1,
      afterGoldEnd: 1,
      afterGoldReturn: 0,
      lesson: seed.lesson,
      sourceLabel: seed.sourceLabel,
      summary: seed.lede,
      journalEntry: seed.lifeNote,
      major: seed.major,
      marketDate: startPrice.date,
      newspaperArticle: {
        dateline: "NEW YORK",
        lede: seed.lede,
        facts: seed.facts,
      },
    };
  });
}

export const optionsHeadlineEvents = buildOptionsHeadlineEvents();
