export type SectorChoice = "balanced" | "tech" | "energy" | "financials" | "healthcare" | "staples" | "bonds";

export type SectorReturnChoice = Exclude<SectorChoice, "balanced">;

export interface SectorOracleEvent {
  id: string;
  date: string;
  era: string;
  headline: string;
  deck: string;
  lesson: string;
  sourceLabel: string;
  article: {
    source: string;
    title: string;
    url: string;
    lede: string;
  };
  marketReturn: number;
  returnsToNext: Record<SectorReturnChoice, number>;
  major?: boolean;
}

export const sectorOracleTitle = "Sector Oracle";
export const sectorOracleStartDate = "1999-12-31";
export const sectorOracleEndDate = "2024-12-31";

export const sectorChoiceOrder: SectorChoice[] = ["balanced", "tech", "energy", "financials", "healthcare", "staples", "bonds"];

export const sectorChoiceLabels: Record<SectorChoice, string> = {
  balanced: "Balanced",
  tech: "Technology",
  energy: "Energy",
  financials: "Banks",
  healthcare: "Healthcare",
  staples: "Staples",
  bonds: "Bonds",
};

export const sectorChoiceShortLabels: Record<SectorChoice, string> = {
  balanced: "Mix",
  tech: "Tech",
  energy: "Energy",
  financials: "Banks",
  healthcare: "Health",
  staples: "Staples",
  bonds: "Bonds",
};

export const sectorChoiceDescriptions: Record<SectorChoice, string> = {
  balanced: "A diversified sector basket with a bond sleeve.",
  tech: "Growth companies, software, chips, and internet platforms.",
  energy: "Oil, gas, refiners, and commodity-linked producers.",
  financials: "Banks, brokers, insurers, and credit-sensitive firms.",
  healthcare: "Drugmakers, devices, insurers, and care providers.",
  staples: "Food, household products, and defensive consumer demand.",
  bonds: "Treasury-style ballast when the tape gets hostile.",
};

export const sectorChoiceLessons: Record<SectorChoice, string> = {
  balanced: "Diversification reduces regret, but it rarely captures the full upside of being right.",
  tech: "Innovation headlines can create huge winners, but high expectations make drawdowns brutal.",
  energy: "Supply shocks and inflation can help energy even when the rest of the market is worried.",
  financials: "Banks love credit growth and rising confidence, but crises hit them first.",
  healthcare: "Healthcare can be defensive, but breakthroughs and policy risk still matter.",
  staples: "Staples teach resilience: slow growth can shine when panic reduces risk appetite.",
  bonds: "Bonds teach opportunity cost: protection helps in crashes but can lag in recoveries.",
};

export const sectorOracleEvents: SectorOracleEvent[] = [
  {
    id: "dot-com-euphoria",
    date: "1999-12-31",
    era: "Dot-Com Euphoria",
    headline: "New York ends millennium with record-breaking figures",
    deck: "U.S. shares close the century at records, with Nasdaq's historic run making the technology story feel unavoidable.",
    lesson: "A correct technology story can still be a bad trade if expectations are already extreme.",
    marketReturn: -18,
    returnsToNext: { tech: -42, energy: 4, financials: -10, healthcare: 18, staples: 11, bonds: 12 },
    major: true,
    sourceLabel: "The Guardian, December 31, 1999; prototype sector-return model",
    article: {
      source: "The Guardian",
      title: "New York ends millennium with record-breaking figures",
      url: "https://www.theguardian.com/business/2000/jan/01/dowjones.nasdaq",
      lede: "The report describes Wall Street ending 1999 with record figures as the Dow and Nasdaq closed the millennium on a celebratory note. For Sector Oracle, the important clue is that the tech story was already obvious, which is exactly when expectations can become dangerous.",
    },
  },
  {
    id: "markets-reopen-2001",
    date: "2001-09-17",
    era: "Markets Reopen",
    headline: "New York Stock Exchange reopens to sharp losses",
    deck: "Trading resumes after the September attacks, and the first move is a flight from risk rather than a normal sector rotation.",
    lesson: "In crisis windows, the first question is often survival before upside.",
    marketReturn: -7,
    returnsToNext: { tech: -5, energy: 8, financials: -8, healthcare: -2, staples: 3, bonds: 9 },
    major: true,
    sourceLabel: "PBS NewsHour, September 17, 2001; prototype sector-return model",
    article: {
      source: "PBS NewsHour",
      title: "New York Stock Exchange Reopens to Sharp Losses",
      url: "https://www.pbs.org/newshour/economy/business-july-dec01-stock_exchange_09-17",
      lede: "PBS framed the NYSE reopening as an effort to restore normal market function after the September 11 attacks. The opening selloff was not a tidy sector story; it was investors testing liquidity, confidence, and the price of risk all at once.",
    },
  },
  {
    id: "war-rates-rebound",
    date: "2003-03-13",
    era: "Recovery Ignition",
    headline: "Wall Street rallies on hopes war will be delayed",
    deck: "The Iraq-war tape shows how relief, positioning, and beaten-down valuations can matter more than the headline mood.",
    lesson: "The best trade after panic can be the sector everyone abandoned too aggressively.",
    marketReturn: 28,
    returnsToNext: { tech: 39, energy: 30, financials: 26, healthcare: 8, staples: 10, bonds: 2 },
    major: true,
    sourceLabel: "CNN Money, March 14, 2003; prototype sector-return model",
    article: {
      source: "CNN Money",
      title: "Wall Street rallies on hopes war will be delayed",
      url: "https://money.cnn.com/2003/03/13/markets/markets_newyork/index.htm",
      lede: "CNN Money reported stocks rallying as investors hoped the Iraq war timetable might be delayed and oil pressure could ease. The paragraph points to the market's second-order logic: a frightening headline can still trigger a relief move if traders already priced in worse.",
    },
  },
  {
    id: "google-ipo",
    date: "2004-08-19",
    era: "Search Goes Public",
    headline: "Google shares jump 18% in debut, hold gains",
    deck: "The internet returns to the market through a profitable search company, but not every tech headline becomes the top sector trade.",
    lesson: "A great tech headline can be beaten by a stronger macro force in another sector.",
    marketReturn: 12,
    returnsToNext: { tech: 6, energy: 38, financials: 7, healthcare: 5, staples: 4, bonds: 2 },
    sourceLabel: "CNN Money, August 19, 2004; prototype sector-return model",
    article: {
      source: "CNN Money",
      title: "Google shares jump 18% in debut, hold gains",
      url: "https://money.cnn.com/2004/08/19/technology/goog/index.htm",
      lede: "CNN Money covered Google's first public session as shares rose sharply after a messy auction process. The trade was bigger than one IPO: investors were deciding whether internet growth had become investable again after the dot-com crash.",
    },
  },
  {
    id: "katrina-oil-shock",
    date: "2005-08-29",
    era: "Energy Shock",
    headline: "Hurricane Katrina pushes up oil prices",
    deck: "A Gulf disaster becomes a market puzzle: higher fuel prices can hurt consumers while lifting producers.",
    lesson: "Energy shocks can make producers look strong while raising costs elsewhere.",
    marketReturn: 17,
    returnsToNext: { tech: 20, energy: 32, financials: 18, healthcare: 13, staples: 10, bonds: 7 },
    major: true,
    sourceLabel: "Forbes, August 29, 2005; prototype sector-return model",
    article: {
      source: "Forbes",
      title: "Hurricane Katrina Pushes Up Oil Prices",
      url: "https://www.forbes.com/2005/08/29/hurricane-boeing-intelsat-cx_tm_0829video1.html",
      lede: "Forbes tied Katrina's landfall to a crude-price jump as Gulf production, refineries, and energy logistics came under threat. The market puzzle is that the same disaster can hurt consumers and still lift energy producers.",
    },
  },
  {
    id: "subprime-cracks",
    date: "2007-06-23",
    era: "Credit Cracks",
    headline: "Bear Stearns pledges $3.2 billion to rescue fund",
    deck: "Subprime losses move from mortgage borrowers into leveraged finance, where bank balance sheets become the main question.",
    lesson: "Sector selection matters most when one industry's balance sheet is the headline.",
    marketReturn: -13,
    returnsToNext: { tech: -18, energy: 8, financials: -45, healthcare: -6, staples: -2, bonds: 12 },
    major: true,
    sourceLabel: "The New York Times, June 23, 2007; prototype sector-return model",
    article: {
      source: "The New York Times",
      title: "$3.2 Billion Move by Bear Stearns to Rescue Fund",
      url: "https://www.bu.edu/econ/files/2011/01/Rescue.pdf",
      lede: "The New York Times described Bear Stearns committing billions to support a mortgage-hit hedge fund. The opening signal is that subprime losses were escaping housing and moving into leveraged financial balance sheets.",
    },
  },
  {
    id: "lehman-falls",
    date: "2008-09-15",
    era: "Lehman Weekend",
    headline: "Lehman files for bankruptcy",
    deck: "The credit crisis turns into a full financial-system emergency after one of Wall Street's oldest investment banks fails.",
    lesson: "When liquidity disappears, defense can beat bravery by simply losing less.",
    marketReturn: -39,
    returnsToNext: { tech: -38, energy: -48, financials: -55, healthcare: -20, staples: -13, bonds: 4 },
    major: true,
    sourceLabel: "CNN Money, September 15, 2008; prototype sector-return model",
    article: {
      source: "CNN Money",
      title: "Lehman files for bankruptcy",
      url: "https://money.cnn.com/2008/09/15/news/companies/lehman_brothers/index.htm",
      lede: "CNN Money reported Lehman Brothers filing for bankruptcy after rescue talks failed. The story marked the shift from credit stress to a financial-system emergency where balance sheet exposure mattered more than headline bravery.",
    },
  },
  {
    id: "march-2009-low",
    date: "2009-03-05",
    era: "Policy Floor",
    headline: "S&P 500 hits lowest level since Sept. 1996",
    deck: "The tape still looks awful near the crisis low, which is exactly why forward returns start to change.",
    lesson: "Big rebounds often begin when the headline still feels terrible.",
    marketReturn: 55,
    returnsToNext: { tech: 68, energy: 42, financials: 80, healthcare: 28, staples: 24, bonds: 2 },
    major: true,
    sourceLabel: "CNBC, March 5, 2009; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "S&P 500 Hits Lowest Level Since Sept. 1996",
      url: "https://www.cnbc.com/2009/03/05/sp-500-hits-lowest-level-since-sept-1996.html",
      lede: "CNBC reported the Dow and S&P 500 at 12-year lows while financial shares remained under severe pressure. The article read like capitulation, but that is the point of the trade: the best forward returns can begin when the newspaper still looks awful.",
    },
  },
  {
    id: "flash-crash-euro-debt",
    date: "2010-05-06",
    era: "Fragile Recovery",
    headline: "Anatomy of the Flash Crash: 15 minutes of market madness",
    deck: "A trillion-dollar air pocket and European debt fears test whether volatility is a broken trend or a brutal interruption.",
    lesson: "Volatility is not the same as a broken trend.",
    marketReturn: 11,
    returnsToNext: { tech: 16, energy: 20, financials: -8, healthcare: 14, staples: 13, bonds: 9 },
    sourceLabel: "CNBC, May 6, 2011; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Anatomy of the Flash Crash: 15 Minutes of Market Madness",
      url: "https://www.cnbc.com/2011/05/06/anatomy-of-the-flash-crash-15-minutes-of-market-madness.html",
      lede: "CNBC reconstructed the flash crash as a short, violent market failure driven by machine-speed volatility. The story was not just a bad tape; it was a reminder that liquidity and market structure can create a shock without ending the cycle.",
    },
  },
  {
    id: "debt-downgrade",
    date: "2011-08-05",
    era: "Downgrade Shock",
    headline: "S&P downgrades U.S. credit rating for first time",
    deck: "A sovereign-credit shock rattles markets, but the long expansion rewards sectors with durable earnings.",
    lesson: "A macro scare can become a buying window if earnings keep growing underneath it.",
    marketReturn: 58,
    returnsToNext: { tech: 66, energy: 28, financials: 72, healthcare: 82, staples: 44, bonds: 4 },
    major: true,
    sourceLabel: "The Washington Post, August 6, 2011; prototype sector-return model",
    article: {
      source: "The Washington Post",
      title: "S&P downgrades U.S. credit rating for first time",
      url: "https://www.washingtonpost.com/business/economy/sandp-considering-first-downgrade-of-us-credit-rating/2011/08/05/gIQAqKeIxI_story.html",
      lede: "The Washington Post reported S&P's first cut to the U.S. credit rating after the debt-ceiling fight. The opening read like a sovereign-confidence shock, but sector winners still depended on earnings durability and rates.",
    },
  },
  {
    id: "oil-slide",
    date: "2014-10-15",
    era: "Oil Breaks",
    headline: "Oil dips below $84, near four-year low, on oversupply",
    deck: "Supply overwhelms demand expectations. Consumers get relief, but energy producers face the full hit.",
    lesson: "The same headline can be good for the economy and bad for a specific sector.",
    marketReturn: 8,
    returnsToNext: { tech: 18, energy: -28, financials: 3, healthcare: 11, staples: 22, bonds: 8 },
    major: true,
    sourceLabel: "Reuters via Business Standard, October 15, 2014; prototype sector-return model",
    article: {
      source: "Reuters",
      title: "Oil dips below $84, near four-year low, on oversupply",
      url: "https://www.business-standard.com/amp/article/reuters/oil-dips-below-84-near-four-year-low-on-oversupply-114101500450_1.html",
      lede: "Reuters described crude sliding toward multi-year lows as supply overwhelmed demand expectations. That setup helped consumers but hit energy producers, making the obvious 'cheap oil is good' story too simple.",
    },
  },
  {
    id: "brexit",
    date: "2016-06-24",
    era: "Global Vote Shock",
    headline: "Brexit vote to slam Wall Street, as global markets quake",
    deck: "The first reaction is fear, but rate expectations and earnings soon reshape which sectors own the next chapter.",
    lesson: "Political shocks can fade quickly when cash flows and policy dominate the next chapter.",
    marketReturn: 31,
    returnsToNext: { tech: 48, energy: 14, financials: 42, healthcare: 20, staples: 8, bonds: -2 },
    sourceLabel: "CNBC, June 24, 2016; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Brexit vote to slam Wall Street, as global markets quake",
      url: "https://www.cnbc.com/2016/06/24/brexit-vote-to-slam-wall-street-as-global-markets-quake.html",
      lede: "CNBC framed Brexit as a global-market shock before the U.S. open, with Wall Street bracing for a sharp reaction. The preview matters because currency turmoil and rate expectations can redirect the winners after the initial panic.",
    },
  },
  {
    id: "volatility-trade-war",
    date: "2018-02-05",
    era: "Volatility Returns",
    headline: "Dow plunges 1,175 points in wild trading session",
    deck: "A volatility shock ends the calm regime and turns rising rates into a fresh sector-rotation problem.",
    lesson: "When uncertainty rises, quality growth and ballast can matter more than cheap valuation.",
    marketReturn: -2,
    returnsToNext: { tech: 18, energy: -50, financials: -20, healthcare: 8, staples: 7, bonds: 16 },
    major: true,
    sourceLabel: "CNBC, February 5, 2018; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Dow plunges 1,175 points in wild trading session",
      url: "https://www.cnbc.com/2018/02/04/us-stocks-interest-rates-futures.html",
      lede: "CNBC reported the Dow's largest point drop at the time as rate worries ruptured a calm market. The first paragraph was about panic, but the sector question was whether higher volatility changed leadership or only interrupted it.",
    },
  },
  {
    id: "pandemic-shutdown",
    date: "2020-03-16",
    era: "Shutdown Tape",
    headline: "Dow drops nearly 3,000 points as coronavirus collapse continues",
    deck: "Emergency selling hits the whole market, but remote work, stimulus, and medical responses quickly split the tape.",
    lesson: "The market often trades the next solution before the current problem is over.",
    marketReturn: 32,
    returnsToNext: { tech: 54, energy: -8, financials: 6, healthcare: 28, staples: 12, bonds: 5 },
    major: true,
    sourceLabel: "CNBC, March 16, 2020; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Dow drops nearly 3,000 points, as coronavirus collapse continues; worst day since '87",
      url: "https://www.cnbc.com/2020/03/15/traders-await-futures-open-after-fed-cuts-rates-launches-easing-program.html",
      lede: "CNBC covered a historic COVID selloff after emergency Fed action failed to calm investors. The headline was shutdown panic, but the forward market soon started separating remote-work, stimulus, healthcare, and reopening exposures.",
    },
  },
  {
    id: "vaccine-reopening",
    date: "2020-11-09",
    era: "Reopening Rotation",
    headline: "Vaccine news unleashes new momentum in stock market",
    deck: "A vaccine breakthrough sends investors toward reopening winners while stay-at-home leaders lose their monopoly on attention.",
    lesson: "Leadership changes when the market starts discounting a different world.",
    marketReturn: 18,
    returnsToNext: { tech: -5, energy: 75, financials: 22, healthcare: 18, staples: 20, bonds: -12 },
    major: true,
    sourceLabel: "CNBC, November 9, 2020; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Vaccine news unleashes new momentum in stock market as hunkered-down investors flee cash",
      url: "https://www.cnbc.com/2020/11/09/vaccine-news-unleashes-new-momentum-in-stock-market-as-hunkered-down-investors-flee-cash.html",
      lede: "CNBC described Pfizer vaccine news pulling investors out of cash and into reopening trades. The article's signal was a leadership change: the market started pricing a different world before the pandemic was over.",
    },
  },
  {
    id: "inflation-bear",
    date: "2022-06-13",
    era: "Inflation Bear",
    headline: "S&P 500 tumbles nearly 4%, closes in bear market territory",
    deck: "Inflation and expected rate hikes punish long-duration growth while investors reprice the value of present cash flow.",
    lesson: "Rate sensitivity can matter as much as the headline's topic.",
    marketReturn: 9,
    returnsToNext: { tech: 22, energy: 10, financials: -3, healthcare: 7, staples: 2, bonds: -1 },
    major: true,
    sourceLabel: "CNBC, June 13, 2022; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "S&P 500 tumbles nearly 4% to new low for the year, closes in bear market territory",
      url: "https://www.cnbc.com/2022/06/12/stock-market-news-open-to-close.html",
      lede: "CNBC reported hot inflation and rate-hike fears pushing the S&P 500 into bear-market territory. The article preview is about duration risk, where growth cash flows far in the future suddenly became more expensive.",
    },
  },
  {
    id: "ai-boom",
    date: "2023-05-25",
    era: "AI Breakout",
    headline: "Nvidia shares surge to record close with 24% rally",
    deck: "The AI trade concentrates around the scarce bottleneck: chips powerful enough to train and run the new models.",
    lesson: "Some breakthroughs reward the suppliers of the scarce ingredient more than the users.",
    marketReturn: 31,
    returnsToNext: { tech: 62, energy: 10, financials: 30, healthcare: 8, staples: 9, bonds: 5 },
    major: true,
    sourceLabel: "CNBC, May 25, 2023; prototype sector-return model",
    article: {
      source: "CNBC",
      title: "Nvidia shares surge to record close with 24% rally",
      url: "https://www.cnbc.com/2023/05/25/nvidia-on-track-for-record-high-driven-by-ai-chip-demand.html",
      lede: "CNBC tied Nvidia's record jump to AI-chip demand and the infrastructure race behind generative AI. The sector clue is scarcity: the biggest winners were the suppliers of the bottleneck, not simply every company saying AI.",
    },
  },
  {
    id: "late-cycle-election",
    date: "2024-11-06",
    era: "Late-Cycle Tape",
    headline: "From banks to small-caps, Trump victory drives rally in stocks",
    deck: "The election result reprices taxes, rates, regulation, and tariffs, pushing money toward expected policy winners.",
    lesson: "Short windows can reward conviction, but they leave less time for a bad thesis to recover.",
    marketReturn: 4,
    returnsToNext: { tech: 5, energy: 1, financials: 7, healthcare: -2, staples: 2, bonds: 1 },
    sourceLabel: "Reuters via Investing.com, November 6, 2024; prototype sector-return model",
    article: {
      source: "Reuters",
      title: "From banks to small-caps, Trump victory drives rally in stocks",
      url: "https://www.investing.com/news/stock-market-news/trumps-media-business-tesla-surge-as-former-president-nears-second-term-3704325",
      lede: "Reuters reported Trump's win sparked rallies in banks, small caps, and policy-sensitive trades. The article framed a fast repricing of taxes, regulation, tariffs, and rates, so the question becomes which sector actually captures the policy bet.",
    },
  },
];
