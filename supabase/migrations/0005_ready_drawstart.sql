alter table public.players
  add column if not exists is_ready boolean default false;

alter table public.rounds
  add column if not exists draw_starts_at timestamptz;
