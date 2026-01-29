alter table public.rooms
  add column if not exists drawing_timer_seconds int default 60;
