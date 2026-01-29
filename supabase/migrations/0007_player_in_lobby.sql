alter table public.players
  add column if not exists is_in_lobby boolean default false;
