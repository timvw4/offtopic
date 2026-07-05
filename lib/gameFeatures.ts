/**
 * Feature flags du jeu.
 * Passe un flag à `true` pour réactiver un mode ou un rôle spécial.
 * Civil et Hors-Thème restent toujours actifs (rôles de base).
 */
export const GAME_FEATURES = {
  duelMode: false,
  cameleon: false,
  dictator: false,
  fantome: false,
} as const;

export type GameFeatureKey = keyof typeof GAME_FEATURES;

/** True si au moins un rôle spécial (hors Civil / Hors-Thème) est activé. */
export function hasAnySpecialRole(): boolean {
  return GAME_FEATURES.cameleon || GAME_FEATURES.dictator || GAME_FEATURES.fantome;
}

type RoomFeatureSettings = {
  has_cameleon?: boolean;
  has_dictator?: boolean;
  has_fantome?: boolean;
  is_duel_mode?: boolean;
};

/** Force à false les options désactivées par les feature flags. */
export function stripDisabledFeatures<T extends RoomFeatureSettings>(settings: T): T {
  return {
    ...settings,
    has_cameleon: GAME_FEATURES.cameleon ? !!settings.has_cameleon : false,
    has_dictator: GAME_FEATURES.dictator ? !!settings.has_dictator : false,
    has_fantome: GAME_FEATURES.fantome ? !!settings.has_fantome : false,
    is_duel_mode: GAME_FEATURES.duelMode ? !!settings.is_duel_mode : false,
  };
}

/** Indique si un rôle spécial est actif côté gameplay (ex. vote Fantôme après mort). */
export function isFantomeRole(role: string | null | undefined): boolean {
  return GAME_FEATURES.fantome && (role === "FANTOME" || role === "FANTOME_HT");
}
