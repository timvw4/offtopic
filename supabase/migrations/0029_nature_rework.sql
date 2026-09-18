-- Refonte du thème « Nature ».
--
-- Le défaut principal n'était pas l'abstraction mais la construction des paires.
-- Le mot hors-thème n'était pas une alternative confondable, c'était un
-- accessoire du mot civil : oiseau/nid, requin/aileron, écureuil/gland,
-- hérisson/piquants, abeille/fleur. Le Hors-Thème dessinait donc quelque chose
-- de complètement différent et se faisait démasquer immédiatement.
--
-- Autres problèmes :
--   • 2 paires utilisaient un adjectif comme mot : marée/haute et marée/basse.
--     On ne peut pas dessiner « haute », et « marée » sortait deux fois.
--   • 4 mots étaient indessinables : matin, alizé, brise, spore.
--   • lune/croissant était ambigu (croissant de lune ou viennoiserie ?) et
--     réutilisait « lune », déjà dans le thème Général.
--   • mangrove/racines faisait doublon avec racine/tronc.
--   • montagne/vallée réutilisait « montagne », déjà dans le thème Général.
--
-- Correction : 32 paires supprimées, 32 nouvelles paires ajoutées.
-- Les nouvelles paires suivent la règle du jeu : deux animaux réellement
-- confondables au dessin (chameau/dromadaire, grenouille/crapaud,
-- léopard/guépard, hérisson/porc-épic). Les animaux supprimés sont réutilisés,
-- mais correctement appariés cette fois.
--
-- Le thème conserve ses 18 paires de paysages valides. Total : 50 paires.

delete from public.word_pairs
where theme = 'nature'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Le hors-thème est un accessoire du mot civil, pas une alternative (21)
    ('loup', 'meute'),
    ('renard', 'terrier'),
    ('ours', 'tanière'),
    ('cerf', 'bois'),
    ('oiseau', 'nid'),
    ('poisson', 'récif'),
    ('dauphin', 'vague'),
    ('baleine', 'océan'),
    ('requin', 'aileron'),
    ('abeille', 'fleur'),
    ('papillon', 'pollen'),
    ('colibri', 'nectar'),
    ('hérisson', 'piquants'),
    ('écureuil', 'gland'),
    ('grenouille', 'nénuphar'),
    ('branche', 'fruit'),
    ('prairie', 'herbe'),
    ('champ', 'blé'),
    ('savane', 'acacia'),
    ('toundra', 'mousse'),
    ('neige', 'flocon'),
    -- Mot indessinable ou adjectif (6)
    ('rosée', 'matin'),
    ('marée', 'haute'),
    ('marée', 'basse'),
    ('brise', 'alizé'),
    ('champignon', 'spore'),
    ('grotte', 'stalactite'),
    -- Ambigu, doublon interne, ou mot déjà utilisé dans un autre thème (5)
    ('lune', 'croissant'),
    ('comète', 'queue'),
    ('mangrove', 'racines'),
    ('tempête', 'éclair'),
    ('montagne', 'vallée')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Mammifères terrestres (9)
  ('loup', 'renard', 'wolf', 'fox', 'nature'),
  ('ours', 'sanglier', 'bear', 'boar', 'nature'),
  ('cerf', 'élan', 'deer', 'moose', 'nature'),
  ('lion', 'tigre', 'lion', 'tiger', 'nature'),
  ('léopard', 'guépard', 'leopard', 'cheetah', 'nature'),
  ('éléphant', 'rhinocéros', 'elephant', 'rhino', 'nature'),
  ('girafe', 'zèbre', 'giraffe', 'zebra', 'nature'),
  ('singe', 'gorille', 'monkey', 'gorilla', 'nature'),
  ('chameau', 'dromadaire', 'camel', 'dromedary', 'nature'),

  -- Petits mammifères (3)
  ('hérisson', 'porc-épic', 'hedgehog', 'porcupine', 'nature'),
  ('écureuil', 'marmotte', 'squirrel', 'marmot', 'nature'),
  ('lapin', 'lièvre', 'rabbit', 'hare', 'nature'),

  -- Vie marine (6)
  ('dauphin', 'orque', 'dolphin', 'orca', 'nature'),
  ('baleine', 'cachalot', 'whale', 'sperm whale', 'nature'),
  ('requin', 'raie', 'shark', 'ray', 'nature'),
  ('méduse', 'pieuvre', 'jellyfish', 'octopus', 'nature'),
  ('crabe', 'homard', 'crab', 'lobster', 'nature'),
  ('pingouin', 'phoque', 'penguin', 'seal', 'nature'),

  -- Oiseaux (4)
  ('aigle', 'faucon', 'eagle', 'falcon', 'nature'),
  ('corbeau', 'pie', 'crow', 'magpie', 'nature'),
  ('cygne', 'oie', 'swan', 'goose', 'nature'),
  ('flamant rose', 'héron', 'flamingo', 'heron', 'nature'),

  -- Reptiles et amphibiens (3)
  ('grenouille', 'crapaud', 'frog', 'toad', 'nature'),
  ('serpent', 'anguille', 'snake', 'eel', 'nature'),
  ('lézard', 'salamandre', 'lizard', 'salamander', 'nature'),

  -- Insectes et invertébrés (6)
  ('abeille', 'guêpe', 'bee', 'wasp', 'nature'),
  ('papillon', 'libellule', 'butterfly', 'dragonfly', 'nature'),
  ('araignée', 'scorpion', 'spider', 'scorpion', 'nature'),
  ('fourmi', 'termite', 'ant', 'termite', 'nature'),
  ('mille-pattes', 'ver de terre', 'centipede', 'earthworm', 'nature'),
  ('tortue', 'escargot', 'turtle', 'snail', 'nature'),

  -- Paysage humide, en remplacement de montagne/vallée (1)
  ('marais', 'étang', 'marsh', 'pond', 'nature');
