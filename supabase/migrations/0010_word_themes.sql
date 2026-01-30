-- Ajoute un thème aux paires de mots et aux rooms pour filtrer par thème.

alter table public.word_pairs
  add column if not exists theme text default 'general';

update public.word_pairs
  set theme = coalesce(theme, 'general');

alter table public.rooms
  add column if not exists word_theme text default 'general';
