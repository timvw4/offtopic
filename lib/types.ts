export type Role = "CIVIL" | "HORS_THEME" | "CAMELEON" | "DICTATOR";

// Phases réellement utilisées dans le flux actuel
export type GamePhase = "LOBBY" | "WORD" | "DRAW" | "REVEAL" | "VOTE" | "RESULTS";

export interface Player {
  id: string;
  nickname: string;
  role: Role;
  hasUsedChameleonAccusation: boolean;
  isEliminated: boolean;
  isHost?: boolean;
  isReady?: boolean;
  isInLobby?: boolean;
  dictatorImmunityUsed?: boolean;
  dictatorDoubleVoteActive?: boolean;
}

export interface RoundState {
  id: string;
  phase: GamePhase;
  timerSeconds: number;
  wordCivil: string;
  wordHorsTheme: string;
  roundNumber: number;
}
