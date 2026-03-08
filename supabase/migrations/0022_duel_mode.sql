-- Mode Duel : ajout de la colonne is_duel_mode sur la table rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_duel_mode BOOLEAN NOT NULL DEFAULT false;

-- Table pour stocker les devinettes du mode duel
-- Chaque joueur soumet un mot qu'il pense être celui dessiné par l'autre
CREATE TABLE IF NOT EXISTS duel_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
  round_id UUID NOT NULL,
  player_nickname TEXT NOT NULL,
  guessed_word TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Un joueur ne peut soumettre qu'une seule devinette par round
  UNIQUE(round_id, player_nickname)
);

-- Sécurité : on active RLS mais on autorise tout le monde (pas de comptes utilisateurs)
ALTER TABLE duel_guesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duel_guesses_all" ON duel_guesses FOR ALL USING (true) WITH CHECK (true);
