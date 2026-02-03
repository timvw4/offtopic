-- Autorise la mise à jour des salles (nécessaire pour propager les réglages de l'hôte).
-- Certaines versions de Postgres ne supportent pas "if not exists" pour les policies.
-- On supprime d'abord la policy si elle existe, puis on la recrée.
drop policy if exists "rooms_update" on public.rooms;

create policy "rooms_update" on public.rooms
  for update
  using (true)
  with check (true);
