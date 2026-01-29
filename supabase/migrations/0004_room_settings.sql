alter table public.rooms
  add column if not exists host_nickname text,
  add column if not exists hors_theme_count int default 1,
  add column if not exists has_cameleon boolean default false;

alter table public.players
  add column if not exists is_host boolean default false;
