/**
 * Thèmes de mots proposés à l'hôte dans les paramètres du salon.
 *
 * Cette liste est la source unique : l'écran du salon et la route qui tire le mot
 * l'utilisent tous les deux. Elle doit rester alignée sur les valeurs de la
 * colonne `theme` de la table `word_pairs` (voir les migrations 0026 à 0039).
 * Un thème listé ici mais absent en base donnerait une manche sans mot.
 *
 * Le thème "duel" n'y figure pas : il est réservé au mode Duel et n'est jamais
 * proposé dans les paramètres.
 */
export const THEMES: { value: string; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "objets_quotidien", label: "Objets du quotidien" },
  { value: "nature", label: "Nature" },
  { value: "technologie", label: "Technologie" },
  { value: "divertissement", label: "Divertissement" },
  { value: "sports", label: "Sports" },
  { value: "fantastique", label: "Fantastique" },
  { value: "metiers", label: "Métiers" },
  { value: "pop_culture", label: "Pop-Culture" },
  { value: "art", label: "Art" },
  { value: "personnalites", label: "Personnalités connues" },
];

export const ALL_THEME_IDS = THEMES.map((t) => t.value);

/**
 * L'hôte peut cocher plusieurs thèmes. On les enregistre dans la colonne texte
 * `rooms.word_theme` sous forme de liste séparée par des virgules, ce qui évite
 * d'avoir à changer le type de la colonne.
 */
export function serializeThemes(ids: string[]): string {
  return ids.join(",");
}

/**
 * Relit la liste enregistrée en base.
 *
 * Les identifiants inconnus sont ignorés et une liste vide retombe sur tous les
 * thèmes. C'est ce qui rend les anciens salons compatibles : avant la sélection
 * multiple, la valeur "general" signifiait « pioche dans tous les thèmes », et la
 * migration 0040 la remplace par `null`, qui donne ici le même résultat.
 */
export function parseThemes(raw: string | null | undefined): string[] {
  const known = new Set(ALL_THEME_IDS);
  const ids = Array.from(
    new Set(
      (raw ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter((part) => known.has(part)),
    ),
  );
  return ids.length > 0 ? ids : [...ALL_THEME_IDS];
}

/** Résumé court affiché dans le récapitulatif du salon. */
export function themesLabel(ids: string[]): string {
  if (ids.length >= ALL_THEME_IDS.length) return "Tous les thèmes";
  const labels = ids.map((id) => THEMES.find((t) => t.value === id)?.label ?? id);
  if (labels.length <= 3) return labels.join(" · ");
  return `${labels.slice(0, 3).join(" · ")} +${labels.length - 3}`;
}
