-- Ajoute le support du rôle Fantôme.
-- Le Fantôme joue comme un Civil mais peut continuer à voter même après élimination.

alter table public.rooms
  add column if not exists has_fantome boolean default false;
