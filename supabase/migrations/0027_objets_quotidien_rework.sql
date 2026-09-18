-- Refonte du thème « Objets du quotidien ».
--
-- Contrairement au thème Général, les mots étaient presque tous dessinables.
-- Les problèmes étaient ailleurs :
--
--   • 2 paires réutilisaient un mot civil déjà présent dans « Technologie »
--     (ordinateur, écran) : la même image pouvait tomber deux fois.
--   • 12 paires étaient indissociables une fois dessinées, souvent parce que le
--     mot hors-thème désigne une partie du mot civil (lampe/abat-jour,
--     ceinture/boucle, rideau/tringle) ou le même objet (prise/multiprise,
--     chargeur/câble, poubelle/sac poubelle). Le Hors-Thème devenait alors
--     impossible à démasquer, ce qui casse la manche.
--   • 3 paires avaient une traduction anglaise fausse : « gant » était traduit
--     par washcloth (c'est un gant de toilette, pas un gant), « tapis » par
--     mousepad et « ruban » par tape. Les joueurs en anglais voyaient un mot
--     sans rapport avec le mot français.
--   • 1 paire était redondante : cahier/crayon reprenait exactement le principe
--     de agenda/stylo (support + outil d'écriture).
--
-- Correction : 18 paires supprimées, 18 nouvelles paires ajoutées.
-- Les nouvelles paires gardent la règle du thème Général : les deux objets se
-- ressemblent assez pour semer le doute, mais restent distinguables au dessin,
-- et aucun mot n'existe déjà dans un autre thème.
--
-- Le thème conserve ses 32 paires valides. Total après migration : 50 paires.

delete from public.word_pairs
where theme = 'objets_quotidien'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Mot civil déjà utilisé dans « Technologie » (2)
    ('ordinateur', 'clavier'),
    ('écran', 'webcam'),
    -- Paires indissociables au dessin (12)
    ('torchon', 'essuie-mains'),
    ('rideau', 'tringle'),
    ('lampe', 'abat-jour'),
    ('téléphone', 'coque'),
    ('enceinte', 'ampli'),
    ('ceinture', 'boucle'),
    ('penderie', 'cintre'),
    ('poubelle', 'sac poubelle'),
    ('chargeur', 'câble'),
    ('prise', 'multiprise'),
    ('drap', 'couette'),
    ('frigo', 'congélateur'),
    -- Traduction anglaise incohérente (3)
    ('serviette', 'gant'),
    ('souris', 'tapis'),
    ('ruban', 'agrafeuse'),
    -- Doublon de principe avec agenda/stylo (1)
    ('cahier', 'crayon')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Gros électroménager (4)
  ('machine à laver', 'lave-vaisselle', 'washing machine', 'dishwasher', 'objets_quotidien'),
  ('aspirateur', 'ventilateur', 'vacuum cleaner', 'fan', 'objets_quotidien'),
  ('radiateur', 'climatiseur', 'radiator', 'air conditioner', 'objets_quotidien'),
  ('fer à repasser', 'sèche-cheveux', 'iron', 'hair dryer', 'objets_quotidien'),

  -- Cuisine (6)
  ('théière', 'cafetière', 'teapot', 'coffee maker', 'objets_quotidien'),
  ('mixeur', 'presse-agrumes', 'blender', 'juicer', 'objets_quotidien'),
  ('louche', 'spatule', 'ladle', 'spatula', 'objets_quotidien'),
  ('verre', 'carafe', 'glass', 'pitcher', 'objets_quotidien'),
  ('boîte', 'bocal', 'box', 'jar', 'objets_quotidien'),
  ('tire-bouchon', 'décapsuleur', 'corkscrew', 'bottle opener', 'objets_quotidien'),

  -- Ménage (1)
  ('balai', 'serpillière', 'broom', 'mop', 'objets_quotidien'),

  -- Salle de bain (1)
  ('peigne', 'barrette', 'comb', 'hair clip', 'objets_quotidien'),

  -- Éclairage (2)
  ('bougie', 'lanterne', 'candle', 'lantern', 'objets_quotidien'),
  ('allumette', 'briquet', 'match', 'lighter', 'objets_quotidien'),

  -- Mobilier (3)
  ('lit', 'matelas', 'bed', 'mattress', 'objets_quotidien'),
  ('tabouret', 'banc', 'stool', 'bench', 'objets_quotidien'),
  ('étagère', 'bibliothèque', 'shelf', 'bookcase', 'objets_quotidien'),

  -- Accessoires (1)
  ('montre', 'bracelet', 'watch', 'bracelet', 'objets_quotidien');
