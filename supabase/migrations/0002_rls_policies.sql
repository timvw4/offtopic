-- Active les RLS sur les tables du jeu
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.rounds enable row level security;
alter table public.drawings enable row level security;
alter table public.votes enable row level security;
alter table public.chameleon_accusations enable row level security;
alter table public.word_pairs enable row level security;

-- Policies simples pour autoriser les clients anon à lire/écrire selon la salle.
-- Attention : ces règles sont permissives (pas d’auth) et visent un usage party-game.

-- ROOMS
create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);

-- PLAYERS
create policy "players_select" on public.players for select using (true);
create policy "players_insert" on public.players for insert with check (true);
create policy "players_update" on public.players for update using (true) with check (true);

-- ROUNDS (écriture surtout via service role, mais on autorise pour simplicité)
create policy "rounds_select" on public.rounds for select using (true);
create policy "rounds_insert" on public.rounds for insert with check (true);
create policy "rounds_update" on public.rounds for update using (true) with check (true);

-- DRAWINGS
create policy "drawings_select" on public.drawings for select using (true);
create policy "drawings_insert" on public.drawings for insert with check (true);
create policy "drawings_update" on public.drawings for update using (true) with check (true);

-- VOTES
create policy "votes_select" on public.votes for select using (true);
create policy "votes_insert" on public.votes for insert with check (true);

-- CHAMELEON ACCUSATIONS
create policy "accusations_select" on public.chameleon_accusations for select using (true);
create policy "accusations_insert" on public.chameleon_accusations for insert with check (true);

-- WORD PAIRS (lecture seule côté client)
create policy "word_pairs_select" on public.word_pairs for select using (true);
