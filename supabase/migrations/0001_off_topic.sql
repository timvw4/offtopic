create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  current_phase text default 'LOBBY',
  created_at timestamptz default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code) on delete cascade,
  nickname text not null,
  role text default 'CIVIL',
  has_used_chameleon_accusation boolean default false,
  is_eliminated boolean default false,
  unique (room_code, nickname)
);

create table public.word_pairs (
  id serial primary key,
  word_fr_civil text not null,
  word_fr_hors_theme text not null,
  word_en_civil text not null,
  word_en_hors_theme text not null
);

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme)
values ('chat', 'chien', 'cat', 'dog'), ('plage', 'montagne', 'beach', 'mountain'), ('pizza', 'burger', 'pizza', 'burger');

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code) on delete cascade,
  phase text default 'WORD',
  word_civil text not null,
  word_hors_theme text not null,
  timer_seconds int default 60,
  last_eliminated_player_id uuid,
  last_eliminated_is_chameleon boolean,
  created_at timestamptz default now()
);

create table public.drawings (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code) on delete cascade,
  nickname text not null,
  data_url text not null,
  created_at timestamptz default now(),
  unique (room_code, nickname)
);

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code) on delete cascade,
  round_id uuid references public.rounds(id) on delete cascade,
  voter_nickname text not null,
  target_player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz default now(),
  unique (round_id, voter_nickname)
);

create table public.chameleon_accusations (
  id uuid primary key default gen_random_uuid(),
  room_code text references public.rooms(code) on delete cascade,
  accuser_nickname text not null,
  target_player_id uuid not null references public.players(id),
  created_at timestamptz default now(),
  unique (room_code, accuser_nickname)
);
