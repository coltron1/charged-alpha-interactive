import type { HeadlineEvent } from "../../headline-market/content/events";

export type FuturesContractChoice = "corn" | "soybeans" | "wheat";

export interface FuturesHeadlineEvent extends HeadlineEvent {
  futuresPrices: Record<FuturesContractChoice, number>;
  futuresMarketDate: string;
}

type FuturesHeadlineSeed = {
  id: string;
  date: string;
  era: string;
  headline: string;
  deck: string;
  lede: string;
  facts: string[];
  lifeNote: string;
  lesson: string;
  prices: Record<FuturesContractChoice, number>;
  major?: boolean;
  sourceLabel: string;
};

const finalFuturesPrices: Record<FuturesContractChoice, number> = {
  corn: 348.5,
  soybeans: 951.25,
  wheat: 544.25,
};

const seeds: FuturesHeadlineSeed[] = [
  {
    id: "grain-2010-russia-export-ban",
    date: "2010-08-06",
    era: "Black Sea Shock",
    headline: "Russia bans grain exports after drought and wildfires scorch wheat crop",
    deck: "Chicago wheat holds near two-year highs as the Black Sea supply shock jolts food markets.",
    lede:
      "Wheat traders opened Friday with Russia's drought no longer a regional weather story but a global grain-market emergency. Moscow's export ban, announced after wildfires and crop losses swept through producing regions, sent buyers scrambling to judge how much world supply would have to be repriced before harvest pressure eased.\n\nCorn and soybean pits caught the shock through substitution math, feed demand, and the old rule that one grain panic rarely stays in one grain. On the farm desks, the question was no longer whether weather mattered, but which contract would absorb the fear first.",
    facts: [
      "Russia announced a temporary grain export ban in August 2010 after severe drought and wildfires.",
      "PBS NewsHour reported wheat prices were near two-year highs after the decision.",
      "Prices shown in game use Yahoo Finance continuous futures chart data for CBOT corn, soybeans, and wheat.",
    ],
    lifeNote:
      "Riley Bell finds the first future clipping in a weathered grain scale drawer behind her granddad's old elevator office. Her first note says, 'Apparently the family inheritance came with homework and a dust allergy.'",
    lesson: "A supply shock in one crop can ripple across the whole grain complex.",
    prices: { corn: 405, soybeans: 1059, wheat: 725.75 },
    major: true,
    sourceLabel: "PBS NewsHour, USDA/FAO drought reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2010-usda-corn-cut",
    date: "2010-10-08",
    era: "Crop Report Jolt",
    headline: "USDA slashes corn crop estimate and grain boards light up before the open",
    deck: "A smaller U.S. crop forces traders to rework feed, ethanol, and export balances.",
    lede:
      "The government's October crop report landed like a hammer Friday, cutting the U.S. corn estimate and tightening a balance sheet already nervous after a volatile summer. Futures traders treated the report as a new starting line for the marketing year, not a small adjustment to an old forecast.\n\nSoybeans and wheat moved with the same urgency because acreage, feed use, and global buyers were suddenly part of one crowded puzzle. Every grain desk had the same problem by midday: the easy bushels had disappeared from the spreadsheet.",
    facts: [
      "USDA crop reports often reset supply estimates and futures prices in seconds.",
      "The October 2010 report sharply reduced U.S. corn production expectations.",
      "CBOT corn futures closed near 528.25 cents per bushel on the game date in Yahoo Finance chart data.",
    ],
    lifeNote:
      "Riley's cousin Wes insists crop reports are boring until the family dog knocks over a jar of corn kernels and everyone starts counting them like USDA enumerators.",
    lesson: "Government supply reports can move futures as sharply as weather headlines.",
    prices: { corn: 528.25, soybeans: 1135, wheat: 719.25 },
    sourceLabel: "USDA crop production reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2011-japan-quake",
    date: "2011-03-11",
    era: "Pacific Shock",
    headline: "Japan earthquake shakes commodity demand outlook as ports and feed buyers assess damage",
    deck: "The disaster sends traders weighing human loss, logistics damage, and grain import needs.",
    lede:
      "A massive earthquake and tsunami struck Japan on Friday, leaving grain traders to weigh a market question no one wanted to ask too quickly: how would one of the world's major food importers recover its ports, feed demand, and buying rhythm? The first reaction was uncertainty, and uncertainty is its own kind of bid in futures markets.\n\nThe human scale dwarfed the trading screens, but the screens still moved. Wheat, corn, and soybean contracts reflected fears about logistics disruptions, livestock demand, currency moves, and the possibility that buying patterns could change for months.",
    facts: [
      "Japan was and remains a major importer of feed grains and food commodities.",
      "The March 11, 2011 earthquake and tsunami disrupted ports, energy, and supply chains.",
      "Commodity moves around disaster headlines can mix demand destruction with restocking demand.",
    ],
    lifeNote:
      "Riley stops writing market notes for a few days and helps organize a benefit pancake breakfast. She burns the first batch badly enough that the fire alarm gets its own donation jar.",
    lesson: "Disaster headlines can create crosscurrents instead of one clean trade.",
    prices: { corn: 659.25, soybeans: 1326.5, wheat: 695 },
    sourceLabel: "Japan disaster reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2011-midwest-floods",
    date: "2011-05-31",
    era: "River Markets",
    headline: "Flooded river system slows grain traffic as Midwest planting worries build",
    deck: "High water turns logistics, planting delays, and basis risk into the same story.",
    lede:
      "Rivers that normally carry grain toward export channels became the market's central map Tuesday, as flooding complicated movement and kept planting anxiety alive across the Midwest. Futures traders had to price both what farmers could plant and whether grain could move once it was harvested.\n\nCorn led the conversation because late planting threatens yield potential, but soybeans and wheat were not bystanders. When water sits where equipment should be running, every contract on the board starts listening to the forecast.",
    facts: [
      "Spring flooding in 2011 affected parts of the Mississippi and Missouri River systems.",
      "Delayed planting can raise yield risk for corn and soybeans.",
      "Futures markets respond to both crop size and transportation bottlenecks.",
    ],
    lifeNote:
      "Riley drives to sandbag with neighbors and learns two things: river mud ignores laundry detergent, and farmers tell better one-liners when everyone is tired.",
    lesson: "Logistics can matter as much as production when grain has to move through a flooded system.",
    prices: { corn: 747.5, soybeans: 1376, wheat: 782.25 },
    major: true,
    sourceLabel: "NOAA flood records, river-system reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2011-october-stocks",
    date: "2011-10-12",
    era: "Inventory Reset",
    headline: "Corn and soybean traders digest new inventory math after volatile harvest reports",
    deck: "Stocks, yields, and demand estimates reshape the board after a weather-whipsawed year.",
    lede:
      "Harvest pressure met fresh inventory math Wednesday, forcing traders to decide whether high prices had rationed enough demand or merely exposed how tight supplies remained. Grain markets were no longer trading one headline; they were trading the accumulated damage of weather, acreage, and usage surprises.\n\nThe result was a board that could reverse hard on a single number. Farmers saw cash bids, exporters saw margins, and speculators saw a market where being late by one report could feel like being late by a season.",
    facts: [
      "USDA supply-and-demand and grain-stocks reports can change carryout expectations.",
      "Tight stocks make futures more sensitive to small estimate revisions.",
      "The game holds the selected commodity from one clipping date to the next.",
    ],
    lifeNote:
      "Riley's uncle bets her five dollars that no one can explain carryout at Thanksgiving. Grandma does it with mashed potatoes, gravy, and frightening accuracy.",
    lesson: "Inventory surprises often decide whether a rally keeps breathing or finally runs out of oxygen.",
    prices: { corn: 640.75, soybeans: 1239.5, wheat: 626.75 },
    sourceLabel: "USDA WASDE and grain-stocks reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2012-drought-expands",
    date: "2012-06-29",
    era: "Drought Watch",
    headline: "U.S. drought spreads through Corn Belt as traders mark up weather risk",
    deck: "Heat, shallow soil moisture, and fading crop ratings turn summer weather into the main market.",
    lede:
      "The Corn Belt entered the final trading day of June with heat maps doing more work than balance sheets. Dryness that began as a regional worry had spread across enough growing territory to make every forecast model feel like a market-moving document.\n\nCorn and soybeans rose as traders tried to price pollination risk before the damage could be counted. Wheat joined the move because weather markets rarely respect clean boundaries between crops, especially when feed buyers start comparing every bushel available.",
    facts: [
      "The 2012 U.S. drought became one of the most damaging agricultural weather events in decades.",
      "Corn pollination weather in late June and July is especially important for yield expectations.",
      "BLS later reported drought-related corn export prices surged far above historical averages.",
    ],
    lifeNote:
      "Riley tries to water a tiny garden behind the elevator and produces three heroic tomatoes and one cucumber shaped like a question mark.",
    lesson: "Weather risk can build before the final crop loss is visible.",
    prices: { corn: 672.5, soybeans: 1512.75, wheat: 739 },
    major: true,
    sourceLabel: "BLS drought impact analysis, NOAA drought records, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2012-corn-record",
    date: "2012-07-30",
    era: "Drought Peak",
    headline: "Corn futures reach record territory as relentless drought bakes U.S. crops",
    deck: "Food inflation fears rise as corn and soybean prices race higher through midsummer.",
    lede:
      "Corn prices pushed into record territory Monday as the Midwest drought kept burning through yield hopes and pushed food-cost worries onto front pages. Traders were not debating whether the crop had been hurt; they were debating how much demand would have to be destroyed to make the numbers balance.\n\nSoybeans surged alongside corn while wheat followed the feed-grain panic. By the close, the grain board looked less like a seasonal rally and more like a national weather ledger written in cents per bushel.",
    facts: [
      "Los Angeles Times reported corn prices reached record levels on July 30, 2012.",
      "The drought also lifted soybean prices sharply.",
      "The 2012 drought remains a classic case study in weather-driven futures rallies.",
    ],
    lifeNote:
      "Riley's brother builds a kiddie pool 'for the dog' and is caught sitting in it at midnight with a lemonade and a radio full of crop reports.",
    lesson: "The strongest futures rallies often happen when the market must ration real demand.",
    prices: { corn: 820, soybeans: 1725.75, wheat: 914.5 },
    major: true,
    sourceLabel: "Los Angeles Times drought-price reporting, BLS drought analysis, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2012-wasde-slashes-yields",
    date: "2012-08-10",
    era: "Yield Cut",
    headline: "USDA cuts corn and soybean yield outlook as drought losses become official",
    deck: "The report confirms what fields had already been saying, but futures still have to price the damage.",
    lede:
      "USDA's August estimates put official numbers behind a summer of crop stress, slashing yield expectations for corn and soybeans after weeks of extreme heat and drought. The report gave traders a harder frame for rationing demand, export availability, and feed costs.\n\nThe market had already rallied into the news, which made the reaction more complicated than the headline. Grain futures had to answer a classic question: when the bad news is finally confirmed, how much of it has already been bought?",
    facts: [
      "USDA's August 2012 crop report cut yield expectations during the drought.",
      "Markets often move before official numbers confirm field damage.",
      "High prices can begin rationing demand before supply estimates stop falling.",
    ],
    lifeNote:
      "Riley learns that everyone in town claims they 'knew the yield number' after the report. She writes down every prediction next year and becomes extremely unpopular.",
    lesson: "Confirmed bad news can still be dangerous if the market already priced it.",
    prices: { corn: 800, soybeans: 1709.5, wheat: 885.25 },
    sourceLabel: "USDA August 2012 crop report coverage, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2013-stocks-surprise",
    date: "2013-03-28",
    era: "Stocks Shock",
    headline: "USDA grain stocks surprise sends corn lower and shakes old-crop demand assumptions",
    deck: "Traders discover more corn on hand than expected, turning scarcity math upside down.",
    lede:
      "A grain-stocks surprise hit the market before the holiday weekend, undercutting the story that corn supplies were as tight as the board had feared. Futures prices fell as traders rewrote demand assumptions that had been shaped by the prior year's drought.\n\nThe shock mattered because old-crop stocks are not theory. They are the bridge between one harvest disaster and the next planting season, and on Thursday that bridge looked wider than many traders had priced.",
    facts: [
      "USDA quarterly grain stocks reports can trigger sharp old-crop futures moves.",
      "The March 2013 grain-stocks report surprised corn traders after the 2012 drought year.",
      "Higher-than-expected stocks can pressure futures even when recent weather damage was real.",
    ],
    lifeNote:
      "Riley hides plastic Easter eggs full of crop-report trivia for the kids. One nephew finds 'basis risk' and demands candy damages.",
    lesson: "A scarcity story can break when inventory data says demand has already rationed.",
    prices: { corn: 695.25, soybeans: 1404.75, wheat: 687.75 },
    major: true,
    sourceLabel: "USDA grain-stocks reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2013-big-crop",
    date: "2013-09-12",
    era: "Big Crop Looms",
    headline: "Large U.S. harvest outlook pressures corn as drought premium fades from the board",
    deck: "Improved production prospects shift traders from shortage math to storage math.",
    lede:
      "The market that spent 2012 rationing bushels entered September 2013 wrestling with the opposite problem: a much larger crop coming toward bins, elevators, and export channels. Corn prices slid as traders removed drought premium and began asking how much supply the system could carry.\n\nSoybeans held a different weather story in places, but the broader grain mood had changed. A year after scarcity dominated every conversation, the board was relearning what abundance does to price.",
    facts: [
      "The 2013 growing season rebuilt U.S. grain supplies after the 2012 drought.",
      "Big crops can pressure futures as storage and carryout expectations rise.",
      "Corn was especially sensitive as drought premium faded.",
    ],
    lifeNote:
      "Riley's dad calls the harvest 'a good problem with bad parking.' Every truck in three counties appears to prove him right.",
    lesson: "The same market that rewards shortage can punish abundance just as hard.",
    prices: { corn: 479, soybeans: 1442, wheat: 641.75 },
    sourceLabel: "USDA crop estimates and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2014-acreage-stocks",
    date: "2014-06-30",
    era: "Acreage Check",
    headline: "USDA acreage and stocks reports point to heavy supplies for corn and soybeans",
    deck: "Summer weather still matters, but traders see more acres and a larger cushion.",
    lede:
      "USDA's acreage and stocks reports gave grain traders a fresh look at the supply cushion heading into the heart of summer. More comfortable inventories and large planted-area expectations pressured the board, especially in corn, where weather needed to turn threatening to rebuild a bull case.\n\nThe market's tone was not panic, but gravity. Every quiet forecast and every good crop rating made it harder for futures to hold above levels built during tighter years.",
    facts: [
      "USDA acreage reports update planted-area estimates near the end of June.",
      "Large acreage and stocks can pressure new-crop futures.",
      "Price response depends on both report surprises and weather after the report.",
    ],
    lifeNote:
      "Riley takes her first real vacation, a lake cabin where she vows not to check crop ratings. She lasts nineteen minutes.",
    lesson: "A bearish supply report can keep weighing on futures if weather stays cooperative.",
    prices: { corn: 424.25, soybeans: 1400.5, wheat: 564.75 },
    sourceLabel: "USDA acreage and grain-stocks reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2014-record-harvest",
    date: "2014-10-10",
    era: "Bin Buster",
    headline: "Record harvest pressure deepens as grain elevators brace for storage crunch",
    deck: "Corn futures grind lower under the weight of yield, carryout, and full bins.",
    lede:
      "The U.S. harvest advanced with a problem farmers prefer to have but futures rarely reward: too many bushels trying to fit into too little storage. Corn prices remained under pressure as traders priced record production, weaker basis, and the cost of carrying grain forward.\n\nSoybeans were also caught in the supply wave, while wheat watched feed competition and global inventories. The headline was simple enough for every elevator office: abundance had become the market's weather.",
    facts: [
      "The 2014 U.S. corn harvest was historically large.",
      "Large crops can create storage pressure and weaker local cash basis.",
      "Futures prices often fall until demand, exports, or acreage shifts absorb the surplus.",
    ],
    lifeNote:
      "Riley helps paint a new bin and accidentally leaves a perfect green handprint on the ladder. The family leaves it there and calls it quality control.",
    lesson: "Record production can turn a good farm year into a bearish futures year.",
    prices: { corn: 334, soybeans: 922.5, wheat: 498.5 },
    major: true,
    sourceLabel: "USDA harvest records, elevator-market reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2015-wet-june",
    date: "2015-06-30",
    era: "Wet Fields",
    headline: "Wet Midwest weather revives crop-risk premium before key summer stretch",
    deck: "Flooded fields and disease worries push traders to reassess a comfortable supply picture.",
    lede:
      "A wet June complicated the grain board's easy-supply story Tuesday as traders weighed flooded fields, shallow roots, and disease risk against the large-crop assumptions built into prices. The market did not need a drought to rally; it only needed proof that perfect yields were no longer guaranteed.\n\nCorn caught the first wave of concern, but soybeans followed because late planting and saturated fields can reshape acreage and yield. In weather markets, too much rain can sound a lot like not enough.",
    facts: [
      "Excessive rainfall can reduce crop condition and delay fieldwork.",
      "June 30 reports often combine acreage, stocks, and live weather risk.",
      "Futures can rally when comfortable supply assumptions are challenged.",
    ],
    lifeNote:
      "Riley's niece names every puddle in the driveway. The biggest is 'Lake Margin Call.' Riley denies involvement but writes it down.",
    lesson: "Weather risk is two-sided: flooding can matter as much as drought.",
    prices: { corn: 414, soybeans: 1056.25, wheat: 614.75 },
    sourceLabel: "USDA June 2015 reports, Midwest weather reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2015-august-wasde",
    date: "2015-08-12",
    era: "Yield Surprise",
    headline: "USDA crop outlook surprises traders and knocks grain futures lower",
    deck: "Better-than-feared production estimates drain risk premium from corn and soybeans.",
    lede:
      "The August crop outlook surprised traders who had carried wet-weather fears into the report, showing production prospects strong enough to take premium out of the market. Futures prices fell as the board moved from worry back toward supply.\n\nThe reaction was a reminder that weather stories must eventually survive measured estimates. Traders can bid uncertainty for weeks, but one report with bigger yields can pull the floorboards out from under a rally.",
    facts: [
      "August USDA reports are closely watched because they include survey-based yield estimates.",
      "Better-than-feared yields can pressure futures even after a weather scare.",
      "The game prices each move from the headline date to the next selected date.",
    ],
    lifeNote:
      "Riley buys a rain gauge shaped like a rooster. It leaks from the beak, making it both useless and beloved.",
    lesson: "Report confirmation matters because futures often price fear before facts arrive.",
    prices: { corn: 357.25, soybeans: 951, wheat: 492.25 },
    sourceLabel: "USDA August 2015 WASDE reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2016-soybean-rally",
    date: "2016-06-10",
    era: "Bean Weather",
    headline: "Soybeans rally as South American crop losses and demand tighten oilseed outlook",
    deck: "Meal demand, export buying, and weather losses put soybeans at the center of the board.",
    lede:
      "Soybean futures carried the grain complex higher as traders focused on South American crop problems and strong demand for U.S. oilseeds. The move gave the market a different leader after years in which corn had often dominated the weather conversation.\n\nThe rally reached beyond beans because feed, meal, currency, and export demand link the contracts. When one crop becomes the scarce ingredient, the rest of the board has to decide whether to follow or fade.",
    facts: [
      "South American weather problems and export demand supported soybean futures in 2016.",
      "Soybean meal and oil demand can affect the broader soybean complex.",
      "Cross-commodity leadership can change from season to season.",
    ],
    lifeNote:
      "Riley joins a summer softball team called The Bean Counters. They lose every game but have elite snacks.",
    lesson: "Leadership can rotate; the best futures trade may not be the crop everyone watched last year.",
    prices: { corn: 423, soybeans: 1178.25, wheat: 495 },
    sourceLabel: "USDA and Reuters oilseed-market reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2016-big-yields",
    date: "2016-09-12",
    era: "Yield Weight",
    headline: "USDA points to big corn and soybean yields as harvest pressure returns",
    deck: "High production estimates push traders back into surplus and carryout math.",
    lede:
      "USDA's September numbers put big yields back at the center of the grain market, weighing on corn and soybeans as harvest approached. Traders who had paid for summer uncertainty now had to face a familiar autumn question: where do all the bushels go?\n\nWheat remained under its own global-supply pressure, making the entire grain board feel heavy. The market was not short of headlines; it was short of reasons to ignore production.",
    facts: [
      "Large U.S. yields in 2016 pressured grain futures into harvest.",
      "Global wheat supplies also remained burdensome.",
      "Harvest pressure can persist until demand surprises or acreage expectations shift.",
    ],
    lifeNote:
      "Riley gets stuck behind three combines on the highway and arrives late to a wedding rehearsal. The bride says it counts as rural traffic.",
    lesson: "Big yield years can grind futures lower even without a dramatic single-day shock.",
    prices: { corn: 329.25, soybeans: 984.5, wheat: 383.25 },
    sourceLabel: "USDA September 2016 crop reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2017-weather-premium",
    date: "2017-07-12",
    era: "Prairie Heat",
    headline: "Hot, dry Plains weather lifts wheat and adds stress premium to summer grain trade",
    deck: "Spring wheat concerns and Corn Belt forecasts put weather back in command.",
    lede:
      "The grain board turned back to weather as heat and dryness across the Plains lifted wheat and forced traders to reassess crop stress in the broader complex. Even contracts with different growing regions began moving to the same drumbeat: forecast runs, rainfall maps, and crop ratings.\n\nCorn and soybeans were not in full panic, but the market no longer treated trend yields as automatic. Every midday model update had the potential to move money from one grain to another.",
    facts: [
      "The Northern Plains saw drought stress in 2017, especially affecting spring wheat areas.",
      "Weather premium can spill from wheat into corn and soybean futures.",
      "Forecast volatility can matter even before final yields change.",
    ],
    lifeNote:
      "Riley and friends camp under a sky so clear they see a meteor streak low over the horizon. Everyone agrees it was either magical or a very committed bottle rocket.",
    lesson: "Forecast-driven rallies can be fast, reversible, and cross-commodity.",
    prices: { corn: 376.25, soybeans: 1016.75, wheat: 522.5 },
    sourceLabel: "USDA crop-weather reporting, NOAA drought records, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2018-china-tariffs-proposed",
    date: "2018-04-04",
    era: "Tariff Threat",
    headline: "China targets U.S. soybeans in tariff plan, putting farm trade on front page",
    deck: "The world's biggest soybean buyer turns trade policy into a grain-market weapon.",
    lede:
      "China's proposed tariffs on U.S. soybeans put the farm economy into the center of a widening trade fight Wednesday. Soybean futures immediately had to price more than weather and yield; they had to price whether the largest buyer would deliberately turn away from U.S. origin.\n\nCorn and wheat watched the shock through acreage and feed-demand channels, but beans carried the headline. The market had seen droughts and floods. Now it had to trade politics by the cargo.",
    facts: [
      "China announced proposed tariffs on U.S. soybeans in April 2018.",
      "China was the largest buyer of U.S. soybeans before the trade dispute escalated.",
      "Trade policy can redirect global flows even when crop size is unchanged.",
    ],
    lifeNote:
      "Riley's neighbor says he understands trade wars because his twins once negotiated Halloween candy tariffs. The twins won.",
    lesson: "Demand shocks can be political, not just weather-driven.",
    prices: { corn: 381, soybeans: 1015.25, wheat: 455.75 },
    major: true,
    sourceLabel: "Reuters/CNBC trade-war reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2018-soybean-plunge",
    date: "2018-06-19",
    era: "Bean Break",
    headline: "Soybean futures plunge to multi-year lows as U.S.-China trade fight escalates",
    deck: "Tariff fears hit the crop most exposed to Chinese demand.",
    lede:
      "Soybean futures dropped sharply Tuesday as the trade fight between Washington and Beijing threatened the export channel most important to U.S. growers. Traders marked prices down not because fields had changed overnight, but because the destination for the crop had become uncertain.\n\nThe selloff showed how quickly a demand headline can do what weather usually does: force a futures contract to find a new level. Corn and wheat moved around the blast radius, but soybeans were the headline crop.",
    facts: [
      "CNBC reported July soybean futures fell more than 7% and touched lows not seen since 2009.",
      "China's retaliatory tariff threats focused directly on U.S. soybeans.",
      "Demand risk can create sustained price pressure if buyers switch origins.",
    ],
    lifeNote:
      "Riley loses a ping-pong match to her aunt, who celebrates by declaring herself 'Queen of Volatility.' Nobody contests it.",
    lesson: "Futures prices can fall on lost demand even when supply is unchanged.",
    prices: { corn: 353.75, soybeans: 889, wheat: 477.75 },
    major: true,
    sourceLabel: "CNBC and Reuters trade-war reporting, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2018-trade-truce",
    date: "2018-12-03",
    era: "Truce Bounce",
    headline: "Soybeans jump after U.S. and China agree to pause new tariffs",
    deck: "A trade truce offers battered bean prices a relief rally.",
    lede:
      "Soybean futures rose Monday after the United States and China agreed to pause new tariff escalation, giving traders a reason to price at least a partial return of export demand. The rally did not solve the entire trade dispute, but it changed the next headline traders had to fear.\n\nFor grain desks, the move was a lesson in political optionality. A market crushed by policy can bounce on policy too, especially when short positions have grown comfortable.",
    facts: [
      "CNBC reported soybean futures rose after a U.S.-China trade truce announcement in early December 2018.",
      "The original soybean tariffs still mattered, but traders priced improved odds of purchases.",
      "Relief rallies can be sharp after long demand-driven declines.",
    ],
    lifeNote:
      "Riley hosts a holiday cookie exchange and accidentally labels gingerbread men 'new crop.' They sell out first.",
    lesson: "Policy relief can move futures even before physical trade fully normalizes.",
    prices: { corn: 371.25, soybeans: 905.75, wheat: 515.75 },
    sourceLabel: "CNBC trade-truce reporting and Yahoo Finance futures chart data",
  },
  {
    id: "grain-2019-flood-planting",
    date: "2019-05-29",
    era: "Prevent Plant",
    headline: "Corn futures surge as historic Midwest flooding delays spring planting",
    deck: "Wet fields threaten acreage, yield potential, and the planting calendar.",
    lede:
      "Corn futures surged Wednesday as heavy rains and flooded fields delayed planting across key Midwest areas, raising the risk that acres would be planted late, switched, or left unplanted. The market began to price not a single storm, but a calendar that was running out of usable days.\n\nSoybeans and wheat moved in the same conversation because planting decisions do not happen crop by crop in isolation. When farmers cannot get into fields, every acreage estimate becomes a moving target.",
    facts: [
      "CNBC reported corn futures gained sharply in May 2019 as Midwest flooding delayed planting.",
      "Prevented planting can reduce acreage and alter crop mix.",
      "Late corn planting can lower yield potential.",
    ],
    lifeNote:
      "Riley rides in a tow truck after her pickup sinks to the axles near a field entrance. She gives the mud a one-star review.",
    lesson: "Acreage risk can rally futures before the final planted-acre number is known.",
    prices: { corn: 418.75, soybeans: 872, wheat: 490.5 },
    major: true,
    sourceLabel: "CNBC, Reuters flood/planting reports, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2019-august-acreage",
    date: "2019-08-12",
    era: "Acreage Reversal",
    headline: "USDA acreage estimate surprises corn market after flood-plagued planting season",
    deck: "Traders expecting fewer acres face a report that rewrites the flood narrative.",
    lede:
      "USDA's August report surprised grain traders by showing more corn acreage than many expected after a spring of record planting delays. Futures prices dropped as the market reworked assumptions that had been built during the flood rally.\n\nThe report did not erase the hardship in farm country, but it changed the tradable number. In futures, sympathy and acreage estimates do not always point in the same direction.",
    facts: [
      "The August 2019 USDA report surprised corn traders after the wet spring.",
      "Markets can reverse when official acreage differs from private expectations.",
      "Weather damage and report risk can push in different directions.",
    ],
    lifeNote:
      "Riley's county fair pie loses to a thirteen-year-old's peach crumble. She demands a recount and then asks for the recipe.",
    lesson: "The market trades expectations versus reports, not just the visible hardship.",
    prices: { corn: 385.25, soybeans: 861.5, wheat: 471.75 },
    sourceLabel: "USDA August 2019 crop report coverage, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2020-covid-shock",
    date: "2020-03-16",
    era: "Pandemic Break",
    headline: "Pandemic shutdowns hit grain demand as ethanol, livestock, and exports face uncertainty",
    deck: "COVID-19 turns food supply chains and fuel demand into one market shock.",
    lede:
      "The pandemic selloff reached grain markets Monday as traders marked down demand tied to fuel, livestock, restaurants, and global logistics. Corn faced particular pressure because ethanol demand depended on drivers who were suddenly staying home.\n\nSoybeans and wheat had different demand profiles, but the same uncertainty. The grain board was trying to price a public-health crisis, a recession shock, and a supply-chain test all at once.",
    facts: [
      "COVID-19 shutdowns sharply reduced travel and fuel demand in March 2020.",
      "Corn demand is linked to ethanol production in the United States.",
      "Food and feed commodities can move differently during broad economic shocks.",
    ],
    lifeNote:
      "Riley turns the elevator office into a hand-sanitizer fortress and learns video meetings make every dog in town a market commentator.",
    lesson: "Macro demand shocks can overwhelm normal crop-season logic.",
    prices: { corn: 354.75, soybeans: 821.75, wheat: 498 },
    major: true,
    sourceLabel: "COVID-19 commodity-market reporting, EIA ethanol context, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2020-negative-oil",
    date: "2020-04-20",
    era: "Ethanol Squeeze",
    headline: "Oil crash deepens corn-demand worries as ethanol margins buckle",
    deck: "Energy-market chaos spills into the corn pit through fuel demand.",
    lede:
      "The historic collapse in crude oil prices intensified pressure on corn Monday as ethanol demand and production margins came under severe stress. Grain traders watched an energy-market shock move directly into the feedstock that supplies U.S. fuel plants.\n\nWheat and soybeans had their own pandemic narratives, but corn was tied closest to the gasoline pump. A futures market built around acres and yield suddenly had to understand empty roads and idled plants.",
    facts: [
      "U.S. crude oil futures famously traded negative on April 20, 2020.",
      "Ethanol is a major source of U.S. corn demand.",
      "Energy shocks can affect agricultural futures through biofuel demand.",
    ],
    lifeNote:
      "Riley tries making sourdough like everyone else and creates something dense enough to use as a doorstop. Her dad calls it 'hard red winter bread.'",
    lesson: "A linked market can become the main driver even when crop fundamentals look unchanged.",
    prices: { corn: 314.25, soybeans: 826.5, wheat: 548.75 },
    sourceLabel: "Energy-market reporting, EIA ethanol context, Yahoo Finance futures chart data",
  },
  {
    id: "grain-2020-iowa-derecho",
    date: "2020-08-12",
    era: "Derecho Damage",
    headline: "Iowa derecho flattens crops and grain bins, adding late-season shock to corn belt",
    deck: "Wind damage turns August yield estimates and storage capacity into urgent questions.",
    lede:
      "A powerful derecho tore across Iowa and neighboring states, flattening corn, damaging grain bins, and forcing traders to reassess late-season production risk. The storm arrived after a year already warped by pandemic demand shocks, giving the grain board one more headline to absorb before harvest.\n\nThe damage was uneven but visually dramatic, and futures had to decide how much yield, storage, and quality risk belonged in prices. For farm families, the market reaction was secondary to the sight of fields lying flat.",
    facts: [
      "The August 2020 Midwest derecho caused major crop and infrastructure damage, especially in Iowa.",
      "Wind damage can affect both yield and harvestability.",
      "Storage damage can matter when harvest logistics are already tight.",
    ],
    lifeNote:
      "Riley spends a week clearing branches and finds her old weather vane two fields away, still pointing west with ridiculous confidence.",
    lesson: "Late-season damage can still matter when the market thought the crop was nearly made.",
    prices: { corn: 314.5, soybeans: 890.5, wheat: 491.25 },
    major: true,
    sourceLabel: "NOAA derecho reports, USDA crop-condition context, Yahoo Finance futures chart data",
  },
];

function getReturn(start: number, end: number) {
  return Number((((end / start) - 1) * 100).toFixed(2));
}

export const futuresHeadlineEvents: FuturesHeadlineEvent[] = seeds.map((seed, index) => {
  const nextPrices = seeds[index + 1]?.prices ?? finalFuturesPrices;
  const endDate = seeds[index + 1]?.date ?? "2020-08-31";
  const cornReturn = getReturn(seed.prices.corn, nextPrices.corn);
  const soybeanReturn = getReturn(seed.prices.soybeans, nextPrices.soybeans);

  return {
    id: seed.id,
    date: seed.date,
    endDate,
    era: seed.era,
    headline: seed.headline,
    deck: seed.deck,
    setup: seed.lede,
    marketQuestion: "Which grain futures sleeve should Riley hold until the next clipping?",
    lifeNote: seed.lifeNote,
    startClose: seed.prices.corn,
    endClose: nextPrices.corn,
    periodReturn: cornReturn,
    beforeStartClose: seed.prices.corn,
    beforeEndClose: nextPrices.corn,
    beforePeriodReturn: cornReturn,
    afterStartClose: seed.prices.corn,
    afterEndClose: nextPrices.corn,
    afterPeriodReturn: cornReturn,
    goldStart: seed.prices.soybeans,
    goldEnd: nextPrices.soybeans,
    goldReturn: soybeanReturn,
    beforeGoldStart: seed.prices.soybeans,
    beforeGoldEnd: nextPrices.soybeans,
    beforeGoldReturn: soybeanReturn,
    afterGoldStart: seed.prices.soybeans,
    afterGoldEnd: nextPrices.soybeans,
    afterGoldReturn: soybeanReturn,
    lesson: seed.lesson,
    sourceLabel: seed.sourceLabel,
    summary: seed.deck,
    major: seed.major,
    marketDate: seed.date,
    goldMarketDate: seed.date,
    futuresMarketDate: seed.date,
    futuresPrices: seed.prices,
    newspaperArticle: {
      dateline: "Chicago",
      lede: seed.lede,
      facts: seed.facts,
    },
  };
});
