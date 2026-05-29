import { RefreshCw } from "lucide-react";
import { getCompany } from "../../games/alpha-arena/content/companies";
import { getCatalyst } from "../../games/alpha-arena/content/catalysts";
import { getRegime } from "../../games/alpha-arena/content/regimes";
import { getSupportCard } from "../../games/alpha-arena/content/thesisCards";
import type { RoundState } from "../../games/alpha-arena/simulation/types";

interface DraftPanelProps {
  round: RoundState;
  onDraft: (cardId: string) => void;
  onReroll: () => void;
  onContinue: () => void;
}

export function DraftPanel({ round, onDraft, onReroll, onContinue }: DraftPanelProps) {
  const regime = getRegime(round.regimeId);
  const catalyst = getCatalyst(round.catalystId);

  return (
    <section className="panel-stack" aria-label="Draft panel">
      <div className="panel-heading">
        <span>Draft</span>
        <strong>{catalyst.name}</strong>
        <p>{regime.name}: {regime.description}</p>
      </div>

      <div className="card-grid">
        {round.shop.companyIds.map((companyId) => {
          const company = getCompany(companyId);
          return (
            <button key={company.id} className="game-card company-card" type="button" onClick={() => onDraft(company.id)}>
              <span>{company.ticker}</span>
              <strong>{company.name}</strong>
              <p>{company.description}</p>
              <div className="stat-line">
                <span>G {company.stats.growth}</span>
                <span>CF {company.stats.cashFlow}</span>
                <span>Val {company.stats.valuation}</span>
                <span>Exp {company.stats.expectations}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="support-row">
        {round.shop.supportCardIds.map((cardId) => {
          const card = getSupportCard(cardId);
          return (
            <button key={card.id} className={`support-card ${card.kind}`} type="button" onClick={() => onDraft(card.id)}>
              <span>{card.kind}</span>
              <strong>{card.name}</strong>
              <p>{card.description}</p>
            </button>
          );
        })}
      </div>

      <div className="drafted-row">
        <div>
          <span>Companies</span>
          <strong>{round.draftedCompanyIds.length}</strong>
        </div>
        <div>
          <span>Thesis/Risk</span>
          <strong>{round.draftedSupportCardIds.length}</strong>
        </div>
      </div>

      <div className="panel-actions">
        <button className="secondary-action" type="button" onClick={onReroll} disabled={round.shop.rerollsUsed >= 1}>
          <RefreshCw size={16} />
          Reroll
        </button>
        <button className="primary-action" type="button" onClick={onContinue} disabled={round.draftedCompanyIds.length === 0}>
          Research
        </button>
      </div>
    </section>
  );
}
