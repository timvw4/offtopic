-- Passage de Pop-Culture à 50 paires.
--
-- Le thème n'avait que 30 paires, et il en a perdu 4 dans la migration 0036,
-- où les personnes réelles ont été transférées vers le nouveau thème
-- « Personnalités connues ». Il en reste donc 26.
--
-- Ajout de 24 paires pour atteindre 50. Le thème est désormais entièrement
-- fictionnel : personnages de dessin animé, de bande dessinée, de cinéma, jeux,
-- jouets et marques. Chaque paire réunit deux personnages du même univers ou de
-- la même silhouette, pour que le Hors-Thème reste crédible : Dingo et Pluto
-- sont deux chiens Disney, R2-D2 et BB-8 deux droïdes ronds, Elsa et Raiponce
-- deux princesses blondes, la Batmobile et la DeLorean deux voitures cultes.
--
-- Total après migration : 50 paires.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Dessins animés classiques (4)
  ('mickey', 'bugs bunny', 'mickey mouse', 'bugs bunny', 'pop_culture'),
  ('dingo', 'pluto', 'goofy', 'pluto', 'pop_culture'),
  ('tom', 'jerry', 'tom', 'jerry', 'pop_culture'),
  ('scooby-doo', 'snoopy', 'scooby-doo', 'snoopy', 'pop_culture'),

  -- Bande dessinée franco-belge (3)
  ('astérix', 'obélix', 'asterix', 'obelix', 'pop_culture'),
  ('tintin', 'spirou', 'tintin', 'spirou', 'pop_culture'),
  ('lucky luke', 'zorro', 'lucky luke', 'zorro', 'pop_culture'),

  -- Super-héros et vilains (2)
  ('hulk', 'thanos', 'hulk', 'thanos', 'pop_culture'),
  ('captain america', 'thor', 'captain america', 'thor', 'pop_culture'),

  -- Science-fiction (5)
  ('stormtrooper', 'chevalier jedi', 'stormtrooper', 'jedi knight', 'pop_culture'),
  ('r2-d2', 'bb-8', 'r2-d2', 'bb-8', 'pop_culture'),
  ('terminator', 'robocop', 'terminator', 'robocop', 'pop_culture'),
  ('e.t.', 'gollum', 'e.t.', 'gollum', 'pop_culture'),
  ('batmobile', 'delorean', 'batmobile', 'delorean', 'pop_culture'),

  -- Princesses et contes (3)
  ('elsa', 'raiponce', 'elsa', 'rapunzel', 'pop_culture'),
  ('cendrillon', 'blanche-neige', 'cinderella', 'snow white', 'pop_culture'),
  ('buzz l''éclair', 'woody', 'buzz lightyear', 'woody', 'pop_culture'),

  -- Jouets et marques (3)
  ('lego', 'playmobil', 'lego', 'playmobil', 'pop_culture'),
  ('barbie', 'ken', 'barbie', 'ken', 'pop_culture'),
  ('nike', 'adidas', 'nike', 'adidas', 'pop_culture'),

  -- Séries et mangas (2)
  ('one piece', 'dragon ball', 'one piece', 'dragon ball', 'pop_culture'),
  ('squid game', 'stranger things', 'squid game', 'stranger things', 'pop_culture'),

  -- Applications (2)
  ('whatsapp', 'snapchat', 'whatsapp', 'snapchat', 'pop_culture'),
  ('spotify', 'deezer', 'spotify', 'deezer', 'pop_culture');
