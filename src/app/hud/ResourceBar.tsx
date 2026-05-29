import { Activity, Banknote, ChartNoAxesColumnIncreasing, Crosshair, Search } from "lucide-react";
import type { MatchState } from "../../games/alpha-arena/simulation/types";

interface ResourceBarProps {
  match: MatchState;
}

function numberLabel(value: number) {
  return value.toFixed(1);
}

export function ResourceBar({ match }: ResourceBarProps) {
  const round = match.currentRound;

  return (
    <section className="resource-bar" aria-label="Resources">
      <div className="resource-item">
        <ChartNoAxesColumnIncreasing size={18} />
        <span>Alpha</span>
        <strong>{numberLabel(match.alphaScore)}</strong>
      </div>
      <div className="resource-item">
        <Activity size={18} />
        <span>Risk</span>
        <strong>{numberLabel(match.risk)}</strong>
      </div>
      <div className="resource-item">
        <Crosshair size={18} />
        <span>Drawdown</span>
        <strong>{numberLabel(match.maxDrawdown)}</strong>
      </div>
      <div className="resource-item">
        <Search size={18} />
        <span>Research</span>
        <strong>{round?.researchRemaining ?? 0}</strong>
      </div>
      <div className="resource-item">
        <Banknote size={18} />
        <span>Capital</span>
        <strong>{round?.capitalRemaining ?? 0}</strong>
      </div>
    </section>
  );
}
