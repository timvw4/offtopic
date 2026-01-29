-- Ajoute une colonne pour stocker les égalités et forcer un revote ciblé.
alter table public.rounds
add column if not exists tie_player_ids text[];
