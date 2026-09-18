-- Retouches du thème « Pop-Culture ».
--
-- Le thème est bon dans l'ensemble : les personnages ont des silhouettes très
-- reconnaissables et les paires sont bien choisies (batman/superman,
-- yoda/darth vader, mario/luigi, coca-cola/pepsi).
--
-- Trois problèmes seulement :
--   • « mario » sortait deux fois, dans mario/luigi et dans sonic/mario.
--   • « the joker » sortait deux fois, dans walter white/the joker et dans
--     the joker/harley quinn.
--   • kim kardashian/kylie jenner est indissociable : ce sont deux sœurs au
--     même style, on dessine la même personne dans les deux cas.
--
-- Correction : 3 paires supprimées, 3 nouvelles paires ajoutées.
-- Le thème garde ses 30 paires.

delete from public.word_pairs
where theme = 'pop_culture'
  and (word_fr_civil, word_fr_hors_theme) in (
    ('sonic', 'mario'),
    ('the joker', 'harley quinn'),
    ('kim kardashian', 'kylie jenner')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  ('sonic', 'crash bandicoot', 'sonic', 'crash bandicoot', 'pop_culture'),
  ('harley quinn', 'catwoman', 'harley quinn', 'catwoman', 'pop_culture'),
  ('bob l''éponge', 'patrick', 'spongebob', 'patrick', 'pop_culture');
