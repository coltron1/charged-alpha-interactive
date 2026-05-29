import Phaser from "phaser";
import { getCatalyst } from "../content/catalysts";
import { getCompany } from "../content/companies";
import { getRegime } from "../content/regimes";
import type { MatchState, PortfolioSlot } from "../simulation/types";
import { alphaArenaBridge, getLatestAlphaArenaState } from "./sceneBridge";

export class AlphaArenaScene extends Phaser.Scene {
  private graphics?: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private state?: MatchState;

  constructor() {
    super("AlphaArenaScene");
  }

  create() {
    this.graphics = this.add.graphics();
    alphaArenaBridge.addEventListener("alpha-arena-state", this.handleState as EventListener);
    this.events.once("shutdown", this.removeBridgeListener);
    this.events.once("destroy", this.removeBridgeListener);
    this.state = getLatestAlphaArenaState();
    if (this.state) {
      this.renderState();
    }
  }

  private removeBridgeListener = () => {
    alphaArenaBridge.removeEventListener("alpha-arena-state", this.handleState as EventListener);
    this.clearLabels();
    this.graphics = undefined;
  };

  private handleState = (event: Event) => {
    this.state = (event as CustomEvent<MatchState>).detail;
    this.renderState();
  };

  private clearLabels() {
    this.labels.forEach((label) => label.destroy());
    this.labels = [];
  }

  private write(x: number, y: number, text: string, size = 18, color = "#f8fafc") {
    const label = this.add.text(x, y, text, {
      color,
      fontFamily: "Inter, ui-sans-serif, system-ui",
      fontSize: `${size}px`,
      lineSpacing: 4,
    });
    this.labels.push(label);
    return label;
  }

  private drawSlot(slot: PortfolioSlot, index: number, isOpponent = false) {
    if (!this.graphics) {
      return;
    }
    const x = 42 + index * 176;
    const y = isOpponent ? 98 : 318;
    const width = 146;
    const height = 132;
    const fill = slot.type === "satellite" ? 0x203348 : slot.type === "hedge" ? 0x283323 : 0x242a35;
    const stroke = slot.type === "satellite" ? 0x57a8ff : slot.type === "hedge" ? 0x92d76d : 0xf4b860;
    this.graphics.fillStyle(fill, 0.9);
    this.graphics.fillRoundedRect(x, y, width, height, 8);
    this.graphics.lineStyle(2, stroke, 0.75);
    this.graphics.strokeRoundedRect(x, y, width, height, 8);

    this.write(x + 12, y + 12, slot.label.toUpperCase(), 12, "#a8b3c7");
    if (slot.allocation) {
      const company = getCompany(slot.allocation.companyId);
      this.write(x + 12, y + 40, company.ticker, 24, "#ffffff");
      this.write(x + 12, y + 76, `${slot.allocation.capital} capital`, 15, "#d6e1f5");
    } else {
      this.write(x + 12, y + 48, isOpponent ? "Hidden" : "Cash", 22, "#d6e1f5");
      this.write(x + 12, y + 80, isOpponent ? "Scout to reveal" : "Stability bonus", 14, "#a8b3c7");
    }
  }

  private renderState() {
    if (!this.graphics || !this.state?.currentRound || !this.scene.isActive()) {
      return;
    }
    const round = this.state.currentRound;
    const catalyst = getCatalyst(round.catalystId);
    const regime = getRegime(round.regimeId);

    this.graphics.clear();
    this.clearLabels();

    this.graphics.fillStyle(0x10131a, 1);
    this.graphics.fillRoundedRect(18, 18, 924, 484, 8);
    this.graphics.lineStyle(1, 0x334155, 1);
    this.graphics.strokeRoundedRect(18, 18, 924, 484, 8);

    this.write(42, 38, `${round.name} / ${round.phase.toUpperCase()}`, 20, "#ffffff");
    this.write(42, 68, `${catalyst.name}: ${catalyst.description}`, 15, "#d6e1f5");
    this.write(590, 38, regime.name, 20, "#ffffff");
    this.write(590, 68, regime.description, 15, "#d6e1f5");

    this.write(42, 132, "MOMENTUM MAX", 13, "#90a4c2");
    round.opponent.slots.forEach((slot, index) => {
      const visible = round.opponent.slotIdsRevealed.includes(slot.id);
      this.drawSlot(visible ? slot : { ...slot, allocation: undefined }, index, true);
    });

    this.graphics.lineStyle(3, 0x2dd4bf, 0.9);
    const playerScoreWidth = Phaser.Math.Clamp(this.state.alphaScore * 5 + 120, 18, 260);
    const opponentScoreWidth = Phaser.Math.Clamp(this.state.opponentAlphaScore * 5 + 120, 18, 260);
    this.graphics.fillStyle(0x2dd4bf, 0.8);
    this.graphics.fillRoundedRect(326, 256, playerScoreWidth, 14, 7);
    this.graphics.fillStyle(0xf4b860, 0.8);
    this.graphics.fillRoundedRect(326, 276, opponentScoreWidth, 14, 7);
    this.write(42, 250, `Your Alpha ${this.state.alphaScore.toFixed(1)}`, 18, "#f8fafc");
    this.write(42, 276, `Opponent ${this.state.opponentAlphaScore.toFixed(1)}`, 16, "#f4b860");
    this.write(720, 250, `Risk ${this.state.risk.toFixed(1)} / 100`, 17, this.state.risk > 70 ? "#fb7185" : "#d6e1f5");
    this.write(720, 276, `Drawdown ${this.state.maxDrawdown.toFixed(1)}`, 17, "#d6e1f5");

    this.write(42, 352, "YOUR FUND", 13, "#90a4c2");
    round.slots.forEach((slot, index) => this.drawSlot(slot, index, false));

    if (round.result) {
      this.graphics.fillStyle(round.result.winner === "player" ? 0x0f766e : 0x7f1d1d, 0.9);
      this.graphics.fillRoundedRect(662, 192, 240, 52, 8);
      this.write(
        682,
        207,
        round.result.winner === "player" ? "Round Won" : round.result.winner === "tie" ? "Round Tied" : "Round Lost",
        22,
        "#ffffff",
      );
    }
  }
}
