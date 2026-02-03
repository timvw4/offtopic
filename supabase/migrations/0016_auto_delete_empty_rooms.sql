-- Supprime automatiquement une salle dès que son dernier joueur est retiré.
-- Cela garantit le nettoyage même si le frontend n'appelle pas explicitement /api/player/leave ou /api/room/cleanup.

set search_path = public;

create or replace function public.delete_room_when_empty()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Si aucun joueur n'est encore associé à la salle, on supprime la salle.
  if not exists (select 1 from public.players where room_code = old.room_code) then
    delete from public.rooms where code = old.room_code;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_delete_room_when_empty on public.players;

create trigger trg_delete_room_when_empty
after delete on public.players
for each row
execute function public.delete_room_when_empty();
