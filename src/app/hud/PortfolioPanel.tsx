import { Flame, ShieldAlert, Zap } from "lucide-react";
import { getCompany } from "../../games/alpha-arena/content/companies";
import { getSupportCard } from "../../games/alpha-arena/content/thesisCards";
import type { RoundState } from "../../games/alpha-arena/simulation/types";

interface PortfolioPanelProps {
  round: RoundState;
  onAllocate: (slotId: string, companyId: string | undefined, capital: number) => void;
  onConviction: () => void;
  onRetreat: () => void;
  onResolve: () => void;
}

export function PortfolioPanel({ round, onAllocate, onConviction, onRetreat, onResolve }: PortfolioPanelProps) {
  const hasAllocation = round.slots.some((slot) => slot.allocation);

  return (
    <section className="panel-stack" aria-label="Portfolio panel">
      <div className="panel-heading">
        <span>Allocate</span>
        <strong>{round.capitalRemaining} capital left</strong>
        <p>Core slots dampen swings. Satellite slots amplify the thesis.</p>
      </div>

      <div className="active-support">
        {round.activeSupportCardIds.length === 0 ? (
          <span className="muted">No active thesis cards</span>
        ) : (
          round.activeSupportCardIds.map((cardId) => {
            const card = getSupportCard(cardId);
            return (
              <span key={card.id} className={`chip ${card.kind}`}>
                {card.name}
              </span>
            );
          })
        )}
      </div>

      <div className="slot-list">
        {round.slots.map((slot) => {
          const allocation = slot.allocation;
          return (
            <article key={slot.id} className={`slot-control ${slot.type}`}>
              <div className="slot-title">
                <span>{slot.type}</span>
                <strong>{slot.label}</strong>
              </div>
              <select
                value={allocation?.companyId ?? ""}
                onChange={(event) => onAllocate(slot.id, event.target.value || undefined, allocation?.capital ?? 1)}
              >
                <option value="">Cash</option>
                {round.draftedCompanyIds.map((companyId) => {
                  const company = getCompany(companyId);
                  return (
                    <option key={companyId} value={companyId}>
                      {company.ticker} - {company.name}
                    </option>
                  );
                })}
              </select>
              <div className="capital-stepper">
                {[1, 2, 3, 4].map((capital) => (
                  <button
                    key={capital}
                    className={allocation?.capital === capital ? "step active" : "step"}
                    type="button"
                    disabled={!allocation}
                    onClick={() => allocation && onAllocate(slot.id, allocation.companyId, capital)}
                  >
                    {capital}
                  </button>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <div className="panel-actions split">
        <button className="secondary-action danger" type="button" onClick={onRetreat}>
          <ShieldAlert size={16} />
          Retreat
        </button>
        <button className="secondary-action" type="button" disabled={round.convictionCharged} onClick={onConviction}>
          <Flame size={16} />
          {round.convictionCharged ? "Charged" : "Conviction"}
        </button>
        <button className="primary-action" type="button" disabled={!hasAllocation} onClick={onResolve}>
          <Zap size={16} />
          Resolve
        </button>
      </div>
    </section>
  );
}
