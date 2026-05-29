import { Eye, Search } from "lucide-react";
import { getCompany } from "../../games/alpha-arena/content/companies";
import { getNextHiddenMetric } from "../../games/alpha-arena/simulation/actions";
import type { HiddenMetric, RoundState } from "../../games/alpha-arena/simulation/types";

interface ResearchPanelProps {
  round: RoundState;
  onReveal: (companyId: string, metric: HiddenMetric) => void;
  onScout: (slotId: string) => void;
  onContinue: () => void;
}

const hiddenMetricLabels: Record<HiddenMetric, string> = {
  earningsSurprise: "Earnings",
  guidance: "Guidance",
  crowding: "Crowding",
  accountingQuality: "Quality",
  macroSensitivity: "Macro",
};

export function ResearchPanel({ round, onReveal, onScout, onContinue }: ResearchPanelProps) {
  return (
    <section className="panel-stack" aria-label="Research panel">
      <div className="panel-heading">
        <span>Research</span>
        <strong>{round.researchRemaining} points left</strong>
        <p>Reveal hidden setup risk before sizing the round.</p>
      </div>

      <div className="research-list">
        {round.draftedCompanyIds.map((companyId) => {
          const company = getCompany(companyId);
          const nextMetric = getNextHiddenMetric(round, companyId);
          const revealed = round.revealedMetrics[companyId] ?? [];

          return (
            <article key={companyId} className="research-card">
              <div>
                <span>{company.ticker}</span>
                <strong>{company.name}</strong>
              </div>
              <div className="revealed-row">
                {revealed.length === 0 ? (
                  <span className="muted">No hidden metrics revealed</span>
                ) : (
                  revealed.map((metric) => (
                    <span key={metric} className="chip">
                      {hiddenMetricLabels[metric]} {company.hidden[metric]}
                    </span>
                  ))
                )}
              </div>
              <button
                className="secondary-action compact"
                type="button"
                disabled={!nextMetric || round.researchRemaining <= 0}
                onClick={() => nextMetric && onReveal(companyId, nextMetric)}
              >
                <Search size={15} />
                Reveal
              </button>
            </article>
          );
        })}
      </div>

      <div className="scout-grid">
        {round.opponent.slots.map((slot) => (
          <button
            key={slot.id}
            className="scout-card"
            type="button"
            disabled={round.researchRemaining <= 0 || round.opponent.slotIdsRevealed.includes(slot.id)}
            onClick={() => onScout(slot.id)}
          >
            <Eye size={15} />
            <span>{slot.label}</span>
            <strong>
              {round.opponent.slotIdsRevealed.includes(slot.id) && slot.allocation
                ? getCompany(slot.allocation.companyId).ticker
                : "Hidden"}
            </strong>
          </button>
        ))}
      </div>

      <div className="panel-actions">
        <button className="primary-action" type="button" onClick={onContinue}>
          Allocate
        </button>
      </div>
    </section>
  );
}
