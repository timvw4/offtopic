-- Supprime automatiquement les rooms inactives depuis plus de 10 minutes.
-- On ajoute un timestamp d'activité, on le met à jour via des triggers,
-- puis un job cron supprime les rooms trop anciennes.

set search_path = public;

-- 1) Colonne d'activité
alter table public.rooms
  add column if not exists last_active_at timestamptz not null default now();

-- 2) Fonction générique pour marquer une room comme active
create or replace function public.touch_room_last_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_code text;
begin
  v_room_code := coalesce(new.room_code, old.room_code);
  if v_room_code is null then
    return null;
  end if;

  update public.rooms
    set last_active_at = now()
    where code = v_room_code;

  return null;
end;
$$;

-- 3) Mise à jour automatique quand une room est modifiée directement
create or replace function public.bump_room_last_active()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.last_active_at := now();
  return new;
end;
$$;

drop trigger if exists trg_rooms_bump_last_active on public.rooms;
create trigger trg_rooms_bump_last_active
before update on public.rooms
for each row
execute function public.bump_room_last_active();

-- 4) Triggers sur les tables qui indiquent de l'activité
drop trigger if exists trg_touch_room_from_players on public.players;
create trigger trg_touch_room_from_players
after insert or update or delete on public.players
for each row
execute function public.touch_room_last_active();

drop trigger if exists trg_touch_room_from_rounds on public.rounds;
create trigger trg_touch_room_from_rounds
after insert or update or delete on public.rounds
for each row
execute function public.touch_room_last_active();

drop trigger if exists trg_touch_room_from_drawings on public.drawings;
create trigger trg_touch_room_from_drawings
after insert or update or delete on public.drawings
for each row
execute function public.touch_room_last_active();

drop trigger if exists trg_touch_room_from_votes on public.votes;
create trigger trg_touch_room_from_votes
after insert or update or delete on public.votes
for each row
execute function public.touch_room_last_active();

drop trigger if exists trg_touch_room_from_accusations on public.chameleon_accusations;
create trigger trg_touch_room_from_accusations
after insert or update or delete on public.chameleon_accusations
for each row
execute function public.touch_room_last_active();

-- 5) Fonction de purge des rooms inactives
create or replace function public.delete_inactive_rooms()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.rooms
  where last_active_at < now() - interval '10 minutes';
end;
$$;

-- 6) Tâche cron : exécution toutes les minutes
create extension if not exists pg_cron with schema extensions;

-- Évite les doublons si la migration est rejouée
select cron.unschedule(jobid) from cron.job where jobname = 'cleanup_inactive_rooms';

select cron.schedule(
  'cleanup_inactive_rooms',       -- nom du job
  '*/1 * * * *',                  -- toutes les minutes
  $$select public.delete_inactive_rooms();$$
);
