import type { MatchState } from "../simulation/types";

export const alphaArenaBridge = new EventTarget();

let latestAlphaArenaState: MatchState | undefined;

export function publishAlphaArenaState(state: MatchState) {
  latestAlphaArenaState = state;
  alphaArenaBridge.dispatchEvent(new CustomEvent<MatchState>("alpha-arena-state", { detail: state }));
}

export function getLatestAlphaArenaState() {
  return latestAlphaArenaState;
}
