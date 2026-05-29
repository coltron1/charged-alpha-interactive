import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { getCatalyst } from "../../games/alpha-arena/content/catalysts";
import { getRegime } from "../../games/alpha-arena/content/regimes";
import type { RoundResult } from "../../games/alpha-arena/simulation/types";

interface DebriefPanelProps {
  result: RoundResult;
  onContinue: () => void;
}

function signed(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}

export function DebriefPanel({ result, onContinue }: DebriefPanelProps) {
  const catalyst = getCatalyst(result.catalystId);
  const regime = getRegime(result.regimeId);

  return (
    <section className="panel-stack" aria-label="Round debrief">
      <div className="panel-heading">
        <span>Debrief</span>
        <strong>{result.winner === "player" ? "Round won" : result.winner === "tie" ? "Round tied" : "Round lost"}</strong>
        <p>{catalyst.name} inside {regime.name}.</p>
      </div>

      <div className="score-compare">
        <div className={result.player.roundAlpha >= 0 ? "score-card positive" : "score-card negative"}>
          {result.player.roundAlpha >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span>Your Alpha</span>
          <strong>{signed(result.player.roundAlpha)}</strong>
        </div>
        <div className={result.opponent.roundAlpha >= 0 ? "score-card positive" : "score-card negative"}>
          {result.opponent.roundAlpha >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          <span>Momentum Max</span>
          <strong>{signed(result.opponent.roundAlpha)}</strong>
        </div>
      </div>

      <div className="explanation-list">
        {result.explanations.map((explanation) => (
          <p key={explanation}>{explanation}</p>
        ))}
      </div>

      <div className="position-results">
        {result.player.positions
          .filter((position) => position.companyName)
          .map((position) => (
            <article key={position.slotId} className="position-result-card">
              <span>{position.slotLabel}</span>
              <strong>{position.companyName}</strong>
              <p>{signed(position.score)} Alpha from {position.capital} capital.</p>
            </article>
          ))}
      </div>

      <div className="panel-actions">
        <button className="primary-action" type="button" onClick={onContinue}>
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
