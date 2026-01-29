alter table public.rounds
  add column if not exists dictator_survived boolean default false;
