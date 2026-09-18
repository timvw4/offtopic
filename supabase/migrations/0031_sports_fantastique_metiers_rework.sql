-- Retouches des thèmes « Sports », « Fantastique » et « Métiers ».
--
-- Ces trois thèmes étaient globalement sains : les paires réunissent bien deux
-- choses confondables (football/rugby, vampire/loup-garou, pompier/policier).
-- Seules 3 paires par thème posaient problème, d'où une correction légère.
--
-- Sports : 3 paires étaient strictement indissociables au dessin. On dessine
-- exactement la même image pour cyclisme et triathlon (un vélo), pour
-- haltérophilie et musculation (quelqu'un qui soulève une barre), et pour yoga
-- et pilates (quelqu'un sur un tapis). Le Hors-Thème ne pouvait jamais être
-- démasqué.
--
-- Fantastique : loup/renard magique réutilisait « loup » et « renard », déjà
-- dans le thème Nature, et « renard magique » n'est pas une créature connue.
-- sorcière/enchanteresse faisait doublon avec sorcier/magicien. épée
-- magique/baguette était ambigu : « baguette » se dessine aussi bien en pain.
--
-- Métiers : 3 paires n'avaient aucun accessoire distinctif à dessiner.
-- professeur et formateur, vétérinaire et zoologiste, guide et explorateur
-- donnent la même silhouette.
--
-- Correction : 9 paires supprimées, 9 nouvelles paires ajoutées.
-- Chaque thème garde ses 20 paires.

delete from public.word_pairs
where (theme, word_fr_civil, word_fr_hors_theme) in (
    -- Sports : indissociables au dessin (3)
    ('sports', 'cyclisme', 'triathlon'),
    ('sports', 'haltérophilie', 'musculation'),
    ('sports', 'yoga', 'pilates'),
    -- Fantastique : mot déjà utilisé, doublon interne, mot ambigu (3)
    ('fantastique', 'loup', 'renard magique'),
    ('fantastique', 'sorcière', 'enchanteresse'),
    ('fantastique', 'épée magique', 'baguette'),
    -- Métiers : aucun accessoire distinctif à dessiner (3)
    ('metiers', 'professeur', 'formateur'),
    ('metiers', 'vétérinaire', 'zoologiste'),
    ('metiers', 'guide', 'explorateur')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Sports : gestes nettement différents à dessiner (3)
  ('ping-pong', 'squash', 'table tennis', 'squash', 'sports'),
  ('pétanque', 'curling', 'petanque', 'curling', 'sports'),
  ('parachutisme', 'parapente', 'skydiving', 'paragliding', 'sports'),

  -- Fantastique : créatures et objets identifiables (3)
  ('kraken', 'hydre', 'kraken', 'hydra', 'fantastique'),
  ('cyclope', 'géant', 'cyclops', 'giant', 'fantastique'),
  ('grimoire', 'talisman', 'spellbook', 'talisman', 'fantastique'),

  -- Métiers : accessoire ou décor reconnaissable (3)
  ('serveur', 'barman', 'waiter', 'bartender', 'metiers'),
  ('menuisier', 'maçon', 'carpenter', 'mason', 'metiers'),
  ('arbitre', 'entraîneur', 'referee', 'coach', 'metiers');
