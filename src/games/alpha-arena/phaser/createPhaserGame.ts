import Phaser from "phaser";
import { AlphaArenaScene } from "./AlphaArenaScene";

export function createPhaserGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 520,
    backgroundColor: "rgba(0,0,0,0)",
    scene: [AlphaArenaScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });
}
