import type { HeadlineEvent } from "./events";

export interface HeadlineImageAsset {
  url: string;
  alt: string;
  title: string;
  pageUrl: string;
  license: string;
  credit: string;
  query: string;
}

interface CommonsImageInfo {
  thumburl?: string;
  url?: string;
  mime?: string;
  extmetadata?: Record<string, { value?: string }>;
}

interface CommonsImagePage {
  index?: number;
  title: string;
  imageinfo?: CommonsImageInfo[];
}

const commonsApiEndpoint = "https://commons.wikimedia.org/w/api.php";

const imageSearchOverrides: Record<string, string> = {
  "wall-street-still-shaken-one-week-after-bl": "Black Monday 1987 stock market crash Dow Jones",
  "reagan-and-gorbachev-sign-the-inf-treaty-i": "Reagan Gorbachev signing INF Treaty 1987",
  "poison-gas-attack-at-halabja-shocks-the-world": "Halabja chemical attack 1988",
  "last-soviet-troops-leave-afghanistan": "Soviet withdrawal from Afghanistan 1989",
  "berlin-wall-opens-as-cold-war-assumptions-": "fall of the Berlin Wall 1989",
  "south-africa-holds-its-first-all-race-democratic": "Nelson Mandela voting 1994 election South Africa",
  "hong-kong-returns-to-chinese-sovereignty-after-1": "Hong Kong handover 1997",
  "nyse-reopens-after-september-11-attacks": "New York Stock Exchange September 17 2001",
  "indian-ocean-tsunami-devastates-coastlines-acros": "2004 Indian Ocean tsunami aftermath",
  "subprime-losses-freeze-credit-markets-and-": "subprime mortgage crisis 2007",
  "dot-com-euphoria": "Nasdaq MarketSite Times Square 1999",
  "markets-reopen-2001": "New York Stock Exchange September 17 2001",
  "war-rates-rebound": "Iraq War 2003 Wall Street",
  "google-ipo": "Google IPO Nasdaq 2004",
  "katrina-oil-shock": "Hurricane Katrina Gulf of Mexico oil platform",
  "subprime-cracks": "Bear Stearns headquarters 2007",
  "lehman-falls": "Lehman Brothers headquarters September 2008",
  "march-2009-low": "New York Stock Exchange March 2009",
  "flash-crash-euro-debt": "New York Stock Exchange trading floor 2010",
  "debt-downgrade": "United States Treasury building",
  "oil-slide": "oil pumpjack crude oil",
  "brexit": "Brexit referendum results 2016",
  "volatility-trade-war": "New York Stock Exchange February 2018",
  "pandemic-shutdown": "New York Stock Exchange COVID March 2020",
  "vaccine-reopening": "Pfizer BioNTech COVID vaccine vial",
  "inflation-bear": "Federal Reserve building 2022",
  "ai-boom": "Nvidia GPU AI chip",
  "late-cycle-election": "New York Stock Exchange November 2024 election",
};

const directImageOverrides: Record<string, Omit<HeadlineImageAsset, "alt">> = {
  "dot-com-euphoria": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:NASDAQ_Market_Site_201506.jpg",
    query: "direct sector oracle Nasdaq MarketSite",
    title: "NASDAQ Market Site 201506",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/NASDAQ_Market_Site_201506.jpg/960px-NASDAQ_Market_Site_201506.jpg",
  },
  "markets-reopen-2001": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_(6279266131).jpg",
    query: "direct sector oracle New York Stock Exchange",
    title: "New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/New_York_Stock_Exchange_%286279266131%29.jpg/960px-New_York_Stock_Exchange_%286279266131%29.jpg",
  },
  "war-rates-rebound": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Iraq_invasion_Baghdad_2003_(3).jpg",
    query: "direct sector oracle Iraq invasion Baghdad 2003",
    title: "Iraq invasion Baghdad 2003",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Iraq_invasion_Baghdad_2003_%283%29.jpg",
  },
  "google-ipo": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Googleplex-Patio-Aug-2014.JPG",
    query: "direct sector oracle Google campus",
    title: "Googleplex Patio",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Googleplex-Patio-Aug-2014.JPG/960px-Googleplex-Patio-Aug-2014.JPG",
  },
  "katrina-oil-shock": {
    credit: "Wikimedia Commons",
    license: "Public domain",
    pageUrl: "https://commons.wikimedia.org/wiki/File:US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg",
    query: "direct sector oracle Hurricane Katrina satellite",
    title: "GOES-12 satellite image of Hurricane Katrina",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg/960px-US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg",
  },
  "subprime-cracks": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:383_Madison_Ave_New_York.jpg",
    query: "direct sector oracle Bear Stearns headquarters",
    title: "383 Madison Ave New York",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/383_Madison_Ave_New_York.jpg/960px-383_Madison_Ave_New_York.jpg",
  },
  "lehman-falls": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Lehman_Brothers-20080915.jpg",
    query: "direct sector oracle Lehman Brothers headquarters",
    title: "Lehman Brothers 20080915",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Lehman_Brothers-20080915.jpg/960px-Lehman_Brothers-20080915.jpg",
  },
  "march-2009-low": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_(6279266131).jpg",
    query: "direct sector oracle New York Stock Exchange 2009",
    title: "New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/New_York_Stock_Exchange_%286279266131%29.jpg/960px-New_York_Stock_Exchange_%286279266131%29.jpg",
  },
  "flash-crash-euro-debt": {
    credit: "Wikimedia Commons",
    license: "Public domain",
    pageUrl: "https://commons.wikimedia.org/wiki/File:No_Known_Restrictions_Trading_Floor,_New_York_Stock_Exchange_(Highsmith_LOC)_(6718386525).jpg",
    query: "direct sector oracle New York Stock Exchange trading floor",
    title: "Trading Floor, New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/No_Known_Restrictions_Trading_Floor%2C_New_York_Stock_Exchange_%28Highsmith_LOC%29_%286718386525%29.jpg/960px-No_Known_Restrictions_Trading_Floor%2C_New_York_Stock_Exchange_%28Highsmith_LOC%29_%286718386525%29.jpg",
  },
  "debt-downgrade": {
    credit: "Wikimedia Commons",
    license: "Public domain",
    pageUrl: "https://commons.wikimedia.org/wiki/File:United_States_Treasury_Building.JPG",
    query: "direct sector oracle United States Treasury Building",
    title: "United States Treasury Building",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/United_States_Treasury_Building.JPG/960px-United_States_Treasury_Building.JPG",
  },
  "oil-slide": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:LostHillsPumpjacksSunset.JPG",
    query: "direct sector oracle oil pumpjacks",
    title: "Lost Hills Pumpjacks Sunset",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/LostHillsPumpjacksSunset.JPG/960px-LostHillsPumpjacksSunset.JPG",
  },
  "brexit": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:2016_United_Kingdom_European_Union_membership_referendum_by_constituency.svg",
    query: "direct sector oracle Brexit referendum results",
    title: "2016 United Kingdom European Union membership referendum by constituency",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/2016_United_Kingdom_European_Union_membership_referendum_by_constituency.svg/960px-2016_United_Kingdom_European_Union_membership_referendum_by_constituency.svg.png",
  },
  "volatility-trade-war": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_(6279266131).jpg",
    query: "direct sector oracle New York Stock Exchange",
    title: "New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/New_York_Stock_Exchange_%286279266131%29.jpg/960px-New_York_Stock_Exchange_%286279266131%29.jpg",
  },
  "pandemic-shutdown": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Subdued_FiDi_(50063555551).jpg",
    query: "direct sector oracle Financial District COVID",
    title: "Subdued FiDi",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Subdued_FiDi_%2850063555551%29.jpg/960px-Subdued_FiDi_%2850063555551%29.jpg",
  },
  "vaccine-reopening": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Pfizer-BioNTech_COVID-19_vaccine_(2020)_C.jpg",
    query: "direct sector oracle Pfizer BioNTech vaccine vial",
    title: "Pfizer-BioNTech COVID-19 vaccine",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Pfizer-BioNTech_COVID-19_vaccine_%282020%29_C.jpg/960px-Pfizer-BioNTech_COVID-19_vaccine_%282020%29_C.jpg",
  },
  "inflation-bear": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Federal_Reserve_Bank_of_Chicago_(51574643886).jpg",
    query: "direct sector oracle Federal Reserve inflation",
    title: "Federal Reserve Bank of Chicago",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Federal_Reserve_Bank_of_Chicago_%2851574643886%29.jpg/960px-Federal_Reserve_Bank_of_Chicago_%2851574643886%29.jpg",
  },
  "ai-boom": {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:NVIDIA_Headquarters.jpg",
    query: "direct sector oracle NVIDIA headquarters AI",
    title: "NVIDIA Headquarters",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/NVIDIA_Headquarters.jpg/960px-NVIDIA_Headquarters.jpg",
  },
  "late-cycle-election": {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_(6279266131).jpg",
    query: "direct sector oracle election rally New York Stock Exchange",
    title: "New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/New_York_Stock_Exchange_%286279266131%29.jpg/960px-New_York_Stock_Exchange_%286279266131%29.jpg",
  },
};

type DirectHeadlineImage = Omit<HeadlineImageAsset, "alt">;
type DirectHeadlineImageBase = Omit<DirectHeadlineImage, "query">;

const optionsImageLibrary = {
  bearStearns: {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:383_Madison_Ave_New_York.jpg",
    title: "383 Madison Ave New York",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/383_Madison_Ave_New_York.jpg/960px-383_Madison_Ave_New_York.jpg",
  },
  fedChicago: {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 4.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Federal_Reserve_Bank_of_Chicago_(51574643886).jpg",
    title: "Federal Reserve Bank of Chicago",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Federal_Reserve_Bank_of_Chicago_%2851574643886%29.jpg/960px-Federal_Reserve_Bank_of_Chicago_%2851574643886%29.jpg",
  },
  hurricaneKatrina: {
    credit: "Wikimedia Commons",
    license: "Public domain",
    pageUrl: "https://commons.wikimedia.org/wiki/File:US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg",
    title: "GOES-12 satellite image of Hurricane Katrina",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg/960px-US_Navy_050829-N-0000W-001_GOES-12_Satellite_image_of_Hurricane_Katrina.jpg",
  },
  iraqBaghdad: {
    credit: "Wikimedia Commons",
    license: "CC BY-SA 3.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:Iraq_invasion_Baghdad_2003_(3).jpg",
    title: "Iraq invasion Baghdad 2003",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Iraq_invasion_Baghdad_2003_%283%29.jpg",
  },
  nasdaqMarketSite: {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:NASDAQ_Market_Site_201506.jpg",
    title: "NASDAQ Market Site 201506",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/NASDAQ_Market_Site_201506.jpg/960px-NASDAQ_Market_Site_201506.jpg",
  },
  nyseExterior: {
    credit: "Wikimedia Commons",
    license: "CC BY 2.0",
    pageUrl: "https://commons.wikimedia.org/wiki/File:New_York_Stock_Exchange_(6279266131).jpg",
    title: "New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/New_York_Stock_Exchange_%286279266131%29.jpg/960px-New_York_Stock_Exchange_%286279266131%29.jpg",
  },
  nyseTradingFloor: {
    credit: "Wikimedia Commons",
    license: "Public domain",
    pageUrl: "https://commons.wikimedia.org/wiki/File:No_Known_Restrictions_Trading_Floor,_New_York_Stock_Exchange_(Highsmith_LOC)_(6718386525).jpg",
    title: "Trading Floor, New York Stock Exchange",
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/No_Known_Restrictions_Trading_Floor%2C_New_York_Stock_Exchange_%28Highsmith_LOC%29_%286718386525%29.jpg/960px-No_Known_Restrictions_Trading_Floor%2C_New_York_Stock_Exchange_%28Highsmith_LOC%29_%286718386525%29.jpg",
  },
} satisfies Record<string, DirectHeadlineImageBase>;

function makeOptionsDirectImage(key: keyof typeof optionsImageLibrary, query: string): DirectHeadlineImage {
  return {
    ...optionsImageLibrary[key],
    query,
  };
}

const optionsDirectImageOverrides: Record<string, DirectHeadlineImage> = {
  "spx-1997-trading-curbs": makeOptionsDirectImage("nyseTradingFloor", "direct options trading curbs NYSE floor"),
  "spx-1998-crosses-1000": makeOptionsDirectImage("nyseExterior", "direct options S&P 500 1000 NYSE"),
  "spx-1998-russia-ltcm": makeOptionsDirectImage("nyseTradingFloor", "direct options Russia LTCM crisis trading floor"),
  "spx-1998-fed-cuts": makeOptionsDirectImage("fedChicago", "direct options Federal Reserve rate cuts"),
  "spx-1999-dow-10000": makeOptionsDirectImage("nyseExterior", "direct options Dow 10000 market milestone"),
  "spx-2000-peak": makeOptionsDirectImage("nasdaqMarketSite", "direct options dot-com peak Nasdaq"),
  "spx-2000-nasdaq-break": makeOptionsDirectImage("nasdaqMarketSite", "direct options Nasdaq dot-com break"),
  "spx-2001-fed-surprise": makeOptionsDirectImage("fedChicago", "direct options Fed surprise cut"),
  "spx-2001-nyse-reopens": makeOptionsDirectImage("nyseExterior", "direct options NYSE reopens September 2001"),
  "spx-2001-enron": makeOptionsDirectImage("nyseTradingFloor", "direct options Enron market trust shock"),
  "spx-2002-worldcom": makeOptionsDirectImage("nyseTradingFloor", "direct options WorldCom accounting shock"),
  "spx-2002-reform-rally": makeOptionsDirectImage("nyseTradingFloor", "direct options corporate reform rally"),
  "spx-2002-bear-low": makeOptionsDirectImage("nyseExterior", "direct options dot-com bear market low"),
  "spx-2003-war-low": makeOptionsDirectImage("iraqBaghdad", "direct options Iraq war premium"),
  "spx-2003-recovery-rally": makeOptionsDirectImage("nyseExterior", "direct options recovery rally"),
  "spx-2004-fed-hike-cycle": makeOptionsDirectImage("fedChicago", "direct options Federal Reserve hike cycle"),
  "spx-2005-katrina-oil": makeOptionsDirectImage("hurricaneKatrina", "direct options Hurricane Katrina oil shock"),
  "spx-2006-inflation-selloff": makeOptionsDirectImage("fedChicago", "direct options inflation selloff"),
  "spx-2007-china-subprime": makeOptionsDirectImage("bearStearns", "direct options China subprime global selloff"),
  "spx-2007-credit-crunch": makeOptionsDirectImage("bearStearns", "direct options credit crunch"),
  "spx-2007-bnp-freeze": makeOptionsDirectImage("bearStearns", "direct options BNP Paribas liquidity freeze"),
  "spx-2007-fed-cut": makeOptionsDirectImage("fedChicago", "direct options Fed cut credit relief"),
  "spx-2007-record-high": makeOptionsDirectImage("nyseExterior", "direct options 2007 S&P 500 record high"),
};

const stopWords = new Set([
  "about",
  "after",
  "again",
  "against",
  "amid",
  "before",
  "begin",
  "begins",
  "between",
  "from",
  "have",
  "into",
  "market",
  "markets",
  "over",
  "still",
  "that",
  "their",
  "this",
  "through",
  "under",
  "while",
  "with",
  "world",
]);

const thematicQueries = [
  {
    test: /black monday|stock|stocks|dow|nasdaq|market|markets|federal reserve|subprime|credit|financial|currency|dollar|yen|euro/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} financial markets ${year}`,
  },
  {
    test: /olympic|olympics|games|world cup|seoul|calgary|atlanta|sydney|salt lake/i,
    query: (event: HeadlineEvent, year: string) => `${event.era} Olympics ${year}`,
  },
  {
    test: /nasa|space|shuttle|hubble|mars|comet|asteroid|mir|station|columbia/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} NASA space ${year}`,
  },
  {
    test: /war|troops|attack|bomb|bombing|missile|iraq|iran|afghanistan|kosovo|gulf|terror|terrorist|al qaeda/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} ${year}`,
  },
  {
    test: /election|votes|president|mandela|pinochet|bush|clinton|gorbachev|yeltsin|soviet|russia|treaty|cold war|berlin/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} politics ${year}`,
  },
  {
    test: /earthquake|tsunami|hurricane|fire|flood|disaster|crash|explosion|valdez|chernobyl|ferry/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} disaster ${year}`,
  },
  {
    test: /internet|web|microsoft|apple|google|computer|technology|iphone|dot-com|aol|netscape/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} technology ${year}`,
  },
  {
    test: /climate|warming|kyoto|environment|ozone|oil|energy/i,
    query: (event: HeadlineEvent, year: string) => `${event.headline} environment ${year}`,
  },
];

const fallbackImages: Array<{
  test: RegExp;
  query: string;
  asset: Omit<HeadlineImageAsset, "alt" | "query">;
}> = [
  {
    test: /stock|stocks|dow|nasdaq|market|markets|financial|currency|dollar|yen|euro|credit|subprime|fed|inflation|recession/i,
    query: "financial markets fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 3.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Black_Monday_Dow_Jones.svg",
      title: "Black Monday Dow Jones",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Black_Monday_Dow_Jones.svg/960px-Black_Monday_Dow_Jones.svg.png",
    },
  },
  {
    test: /terror|september 11|world trade center|al qaeda|lockerbie|pan am|embassy bombing|bombing/i,
    query: "terror attack fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "Public domain",
      pageUrl: "https://commons.wikimedia.org/wiki/File:September_14_2001.jpg",
      title: "September 14 2001",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/September_14_2001.jpg/960px-September_14_2001.jpg",
    },
  },
  {
    test: /olympic|olympics|games|world cup|seoul|calgary|atlanta|sydney|salt lake/i,
    query: "olympics fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:1988_Winter_Olympics_torch.jpg",
      title: "1988 Winter Olympics torch",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/1988_Winter_Olympics_torch.jpg/960px-1988_Winter_Olympics_torch.jpg",
    },
  },
  {
    test: /nasa|space|shuttle|hubble|mars|comet|asteroid|mir|station|columbia/i,
    query: "space exploration fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "Public domain",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Space_Shuttle_Columbia_launching.jpg",
      title: "Space Shuttle Columbia launching",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Space_Shuttle_Columbia_launching.jpg/960px-Space_Shuttle_Columbia_launching.jpg",
    },
  },
  {
    test: /internet|web|microsoft|apple|google|computer|technology|iphone|dot-com|aol|netscape/i,
    query: "technology fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 2.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Where_the_WEB_was_born.jpg",
      title: "Where the WEB was born",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Where_the_WEB_was_born.jpg/960px-Where_the_WEB_was_born.jpg",
    },
  },
  {
    test: /climate|warming|kyoto|environment|ozone|carbon/i,
    query: "environment fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 4.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:20181204_Warming_stripes_(global,_WMO,_1850-2018)_-_Climate_Lab_Book_(Ed_Hawkins).png",
      title: "Global warming stripes",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/20181204_Warming_stripes_%28global%2C_WMO%2C_1850-2018%29_-_Climate_Lab_Book_%28Ed_Hawkins%29.png/960px-20181204_Warming_stripes_%28global%2C_WMO%2C_1850-2018%29_-_Climate_Lab_Book_%28Ed_Hawkins%29.png",
    },
  },
  {
    test: /oil spill|valdez|earthquake|tsunami|hurricane|fire|flood|disaster|crash|explosion|ferry/i,
    query: "disaster fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 2.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Exxon_Valdez_Oil_Spill.jpg",
      title: "Exxon Valdez Oil Spill",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Exxon_Valdez_Oil_Spill.jpg/960px-Exxon_Valdez_Oil_Spill.jpg",
    },
  },
  {
    test: /war|troops|missile|iraq|iran|afghanistan|kosovo|gulf|ceasefire|soviet|military|chemical/i,
    query: "war and security fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "CC BY-SA 3.0",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Family_Graves_for_Victims_of_1988_Chemical_Attack_-_Halabja_-_Kurdistan_-_Iraq.jpg",
      title: "Family Graves for Victims of 1988 Chemical Attack",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Family_Graves_for_Victims_of_1988_Chemical_Attack_-_Halabja_-_Kurdistan_-_Iraq.jpg/960px-Family_Graves_for_Victims_of_1988_Chemical_Attack_-_Halabja_-_Kurdistan_-_Iraq.jpg",
    },
  },
  {
    test: /election|votes|president|mandela|pinochet|bush|clinton|gorbachev|yeltsin|russia|treaty|cold war|berlin|parliament|union/i,
    query: "politics fallback",
    asset: {
      credit: "Wikimedia Commons",
      license: "Public domain",
      pageUrl: "https://commons.wikimedia.org/wiki/File:Reagan_and_Gorbachev_signing.jpg",
      title: "Reagan and Gorbachev signing",
      url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Reagan_and_Gorbachev_signing.jpg/960px-Reagan_and_Gorbachev_signing.jpg",
    },
  },
];

const defaultFallbackImage: Omit<HeadlineImageAsset, "alt" | "query"> = {
  credit: "Wikimedia Commons",
  license: "Public domain",
  pageUrl: "https://commons.wikimedia.org/wiki/File:Western_Daily_Press_printing_press_1908.jpg",
  title: "Western Daily Press printing press 1908",
  url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Western_Daily_Press_printing_press_1908.jpg/960px-Western_Daily_Press_printing_press_1908.jpg",
};

function cleanMetadata(value?: string) {
  return (value ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function getImportantWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]+/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !stopWords.has(word));
}

function unique(values: Array<string | undefined>) {
  const seen = new Set<string>();
  return values
    .map((value) => value?.replace(/\s+/g, " ").trim())
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    });
}

function getThematicQuery(event: HeadlineEvent, year: string) {
  return thematicQueries.find(({ test }) => test.test(`${event.headline} ${event.deck} ${event.era}`))?.query(event, year);
}

export function getHeadlineImageQueries(event: HeadlineEvent) {
  const year = event.date.slice(0, 4);
  const keywords = getImportantWords(`${event.headline} ${event.era}`).slice(0, 8).join(" ");
  return unique([
    imageSearchOverrides[event.id],
    `${event.headline} ${year}`,
    `${keywords} ${year}`,
    getThematicQuery(event, year),
    `${event.era} ${year}`,
  ]);
}

function getCommonsPageUrl(title: string) {
  return `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_")).replace(/%3A/g, ":")}`;
}

function getPageScore(page: CommonsImagePage, event: HeadlineEvent, query: string) {
  const title = page.title.toLowerCase();
  const year = event.date.slice(0, 4);
  const words = new Set([...getImportantWords(query), ...getImportantWords(event.headline)]);
  let score = 0;

  words.forEach((word) => {
    if (title.includes(word)) {
      score += 2;
    }
  });

  if (title.includes(year)) score += 5;
  if (title.includes("stamp")) score -= 2;
  if (title.includes("logo") || title.includes("seal")) score -= 4;
  if (title.includes("map")) score -= 1;
  if (page.imageinfo?.[0]?.mime === "image/svg+xml") score -= 1;
  score -= page.index ?? 0;
  return score;
}

function toHeadlineImageAsset(page: CommonsImagePage, event: HeadlineEvent, query: string): HeadlineImageAsset | null {
  const info = page.imageinfo?.[0];
  if (!info || (info.mime && !info.mime.startsWith("image/"))) {
    return null;
  }

  if (/\.(pdf|djvu|webm|ogv|mp4)$/i.test(page.title)) {
    return null;
  }

  const url = info.thumburl ?? info.url;
  if (!url) {
    return null;
  }

  const metadata = info.extmetadata ?? {};
  const title = cleanMetadata(metadata.ObjectName?.value) || page.title.replace(/^File:/, "").replace(/_/g, " ");
  const license = cleanMetadata(metadata.LicenseShortName?.value) || cleanMetadata(metadata.UsageTerms?.value) || "Wikimedia Commons";
  const credit =
    cleanMetadata(metadata.Artist?.value) ||
    cleanMetadata(metadata.Credit?.value) ||
    cleanMetadata(metadata.Attribution?.value) ||
    "Wikimedia Commons";

  return {
    alt: `${event.headline} archive image`,
    credit,
    license,
    pageUrl: getCommonsPageUrl(page.title),
    query,
    title,
    url,
  };
}

async function searchCommons(query: string, event: HeadlineEvent, signal?: AbortSignal) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "8",
    gsrsearch: query,
    iiextmetadatafilter: "ObjectName|Artist|Credit|Attribution|LicenseShortName|UsageTerms",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "960",
    origin: "*",
    prop: "imageinfo",
  });
  const response = await fetch(`${commonsApiEndpoint}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Wikimedia Commons image search failed with ${response.status}`);
  }

  const data = (await response.json()) as { query?: { pages?: Record<string, CommonsImagePage> } };
  const candidates = Object.values(data.query?.pages ?? {})
    .map((page) => ({ asset: toHeadlineImageAsset(page, event, query), page }))
    .filter((entry): entry is { asset: HeadlineImageAsset; page: CommonsImagePage } => Boolean(entry.asset));

  return candidates
    .map((entry) => ({
      asset: entry.asset,
      score: getPageScore(entry.page, event, query),
    }))
    .sort((a, b) => b.score - a.score)
    .at(0)?.asset ?? null;
}

function getFallbackImage(event: HeadlineEvent): HeadlineImageAsset {
  const match = fallbackImages.find(({ test }) => test.test(`${event.headline} ${event.deck} ${event.era}`));
  const fallback = match?.asset ?? defaultFallbackImage;
  return {
    ...fallback,
    alt: `${event.headline} archive image`,
    query: match?.query ?? "newspaper archive fallback",
  };
}

export async function fetchHeadlineImage(event: HeadlineEvent, signal?: AbortSignal) {
  const directImage = directImageOverrides[event.id] ?? optionsDirectImageOverrides[event.id];

  if (directImage) {
    return {
      ...directImage,
      alt: `${event.headline} archive image`,
    };
  }

  const queries = getHeadlineImageQueries(event);

  for (const query of queries) {
    try {
      const image = await searchCommons(query, event, signal);
      if (image) {
        return image;
      }
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
    }
  }

  return getFallbackImage(event);
}
