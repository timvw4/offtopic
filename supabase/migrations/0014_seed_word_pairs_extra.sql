-- 100 nouvelles paires de mots réparties sur tous les thèmes
insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Général (7)
  ('grenier', 'cave', 'attic', 'cellar', 'general'),
  ('balcon', 'terrasse', 'balcony', 'terrace', 'general'),
  ('escalier', 'ascenseur', 'stairs', 'elevator', 'general'),
  ('parquet', 'carrelage', 'wood floor', 'tile floor', 'general'),
  ('cheminée', 'radiateur', 'fireplace', 'radiator', 'general'),
  ('interphone', 'sonnette', 'intercom', 'doorbell', 'general'),
  ('bonsaï', 'cactus', 'bonsai', 'cactus', 'general'),

  -- Animaux (7)
  ('faucon', 'lynx', 'falcon', 'lynx', 'animaux'),
  ('paresseux', 'panda', 'sloth', 'coyote', 'animaux'),
  ('hérisson', 'taupe', 'hedgehog', 'mole', 'animaux'),
  ('chèvre', 'bêlier', 'sheep', 'belier', 'animaux'),
  ('renard', 'raton laveur', 'fox', 'raccoon', 'animaux'),
  ('guépard', 'lion', 'cheetah', 'lion', 'animaux'),
  ('hippocampe', 'cheval', 'seahorse', 'manta ray', 'animaux'),

  -- Voyage (8)
  ('navire de croisière', 'ferry', 'cruise ship', 'ferry', 'voyage'),
  ('gare', 'aeroport', 'trainstation', 'airport', 'voyage'),
  ('hôtel', 'auberge', 'hotel', 'guesthouse', 'voyage'),
  ('hôtel', 'camping', 'bivouac', 'camp', 'voyage'),
  ('passeport', 'carte d''identié', 'passport', 'ID card', 'voyage'),
  ('hélicoptère', 'montgolfière', 'helicoter', 'hot-air ballon', 'voyage'),
  ('forêt', 'jungle', 'forest', 'jungle', 'voyage'),
  ('masque de plongée', 'tuba', 'diving mask', 'snorkel', 'objets'),

  -- Objets (7)
  ('agrafeuse', 'punaise', 'stapler', 'push pin', 'objets'),
  ('masque de plongée', 'tuba', 'diving mask', 'snorkel', 'objets'),
  ('bague', 'bracelet', 'ring', 'band', 'objets'),
  ('tire-bouchon', 'décapsuleur', 'cork screw', 'bottle opener', 'objets'),
  ('verre', 'bol', 'glass', 'bowl', 'objets'),
  ('loupe', 'jumelles', 'magnifier', 'binoculars', 'objets'),
  ('ceinture', 'lacets', 'belt', 'laces', 'objets'),

  -- Sport (12)
  ('paddle', 'kayak', 'stand-up paddle', 'kayak', 'sport'),
  ('raquette de badbinton', 'raquette de tennis', 'badbinton racket', 'tennis racket', 'sport'),
  ('ceinture de judo', 'kimono', 'judo belt', 'gi', 'sport'),
  ('poteau de but', 'filet', 'goal post', 'net', 'sport'),
  ('corde à sauter', 'barre de traction', 'jump rope', 'pull-up bar', 'sport'),
  ('gant de boxe', 'protège-dents', 'boxing glove', 'mouthguard', 'sport'),
  ('luge', 'ski', 'luge', 'ski', 'sport'),

  -- Technologie (4)
  ('iPad', 'iPhone', 'iPad', 'iPhone', 'technologie'),
  ('Apple', 'Samsung', 'Apple', 'Samsung', 'technologie'),
  ('Apple', 'Google', 'Apple', 'Google', 'technologie'),
  ('mode avion', 'réseau 5G', 'plane mode', '5G network', 'technologie');
