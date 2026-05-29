import { useEffect, useRef } from "react";
import type { MatchState } from "./simulation/types";
import { createPhaserGame } from "./phaser/createPhaserGame";
import { publishAlphaArenaState } from "./phaser/sceneBridge";

interface AlphaArenaGameProps {
  match: MatchState;
}

export function AlphaArenaGame({ match }: AlphaArenaGameProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const game = createPhaserGame(containerRef.current);
    return () => {
      game.destroy(true);
    };
  }, []);

  useEffect(() => {
    publishAlphaArenaState(match);
  }, [match]);

  return <div className="phaser-shell" ref={containerRef} aria-label="Alpha Arena board" />;
}
