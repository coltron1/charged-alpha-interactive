import { GameShell } from "./GameShell";
import { BeforeSiegeGame } from "../games/before-siege/BeforeSiegeGame";
import { HeadlineMarketGame } from "../games/headline-market/HeadlineMarketGame";
import { OptionsFortuneGame } from "../games/options-fortune/OptionsFortuneGame";
import { FuturesFortuneGame } from "../games/futures-fortune/FuturesFortuneGame";
import { SectorOracleGame } from "../games/sector-oracle/SectorOracleGame";
import { useEffect, useState } from "react";

type ActiveGame = "headline-market" | "options-fortune" | "futures-fortune" | "sector-oracle" | "alpha-pit" | "before-siege";

declare global {
  interface Window {
    CHARGED_ALPHA_GAME_SLUG?: string;
  }
}

const gameRouteMap: Record<string, ActiveGame> = {
  "alpha-pit": "alpha-pit",
  "before-siege": "before-siege",
  "expiration-date": "options-fortune",
  "front-page-fortune": "headline-market",
  "futures-fortune": "futures-fortune",
  "harvest-ledger": "futures-fortune",
  "headline-market": "headline-market",
  "options-fortune": "options-fortune",
  "sector-oracle": "sector-oracle",
};

function normalizeRouteSlug(value?: string | null) {
  return value?.replace(/^#/, "").replace(/^\/+|\/+$/g, "").toLowerCase() ?? "";
}

function gameFromLocation(): ActiveGame {
  const configuredGame = gameRouteMap[normalizeRouteSlug(window.CHARGED_ALPHA_GAME_SLUG)];
  if (configuredGame) {
    return configuredGame;
  }

  const hashGame = gameRouteMap[normalizeRouteSlug(window.location.hash)];
  if (hashGame) {
    return hashGame;
  }

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  const pathGame = gameRouteMap[normalizeRouteSlug(pathSegments.at(-1))];
  return pathGame ?? "headline-market";
}

export function App() {
  const [activeGame, setActiveGame] = useState<ActiveGame>(() => gameFromLocation());

  useEffect(() => {
    const syncHash = () => setActiveGame(gameFromLocation());
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  return activeGame === "alpha-pit" ? (
    <GameShell />
  ) : activeGame === "before-siege" ? (
    <BeforeSiegeGame />
  ) : activeGame === "options-fortune" ? (
    <OptionsFortuneGame />
  ) : activeGame === "futures-fortune" ? (
    <FuturesFortuneGame />
  ) : activeGame === "sector-oracle" ? (
    <SectorOracleGame />
  ) : (
    <HeadlineMarketGame />
  );
}
