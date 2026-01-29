import { GamePhase } from "./types";

type Transition = {
  from: GamePhase;
  to: GamePhase;
  guard?: () => boolean;
};

// Table de transitions alignée sur le flux réellement implémenté.
const transitions: Transition[] = [
  { from: "LOBBY", to: "WORD" },
  // Le passage à DRAW est déclenché par l'horodatage commun `draw_starts_at`.
  { from: "WORD", to: "DRAW" },
  // Dans le flux actuel, la phase DB peut rester à WORD jusqu'au passage au vote.
  { from: "WORD", to: "VOTE" },
  { from: "DRAW", to: "REVEAL" },
  { from: "REVEAL", to: "VOTE" },
  { from: "VOTE", to: "RESULTS" },
  // Revote en cas d'égalité
  { from: "RESULTS", to: "VOTE" },
  // Nouveau tour depuis les résultats
  { from: "RESULTS", to: "WORD" },
  // Retour lobby (reset manuel)
  { from: "RESULTS", to: "LOBBY" },
];

export function canTransition(current: GamePhase, next: GamePhase): boolean {
  return transitions.some((t) => t.from === current && t.to === next && (!t.guard || t.guard()));
}

export function assertTransition(current: GamePhase, next: GamePhase) {
  if (!canTransition(current, next)) {
    throw new Error(`Transition refusée: ${current} → ${next}`);
  }
}
