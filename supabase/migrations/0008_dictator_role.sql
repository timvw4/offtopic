alter table public.rooms
  add column if not exists has_dictator boolean default false;

alter table public.players
  add column if not exists dictator_immunity_used boolean default false,
  add column if not exists dictator_double_vote_active boolean default false;

alter table public.votes
  add column if not exists weight int default 1;
