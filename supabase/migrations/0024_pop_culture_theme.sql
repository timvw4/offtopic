-- Thème Pop Culture pour le mode classique
-- Chaque paire : mot_civil (ce que les civils dessinent) / mot_hors_theme (ce que le HT dessine)
-- Les deux mots sont proches visuellement pour rendre le jeu difficile.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values

  -- Duos de personnages animés proches
  ('homer simpson',  'bart simpson',   'homer simpson',  'bart simpson',   'pop_culture'),
  ('mario',          'luigi',          'mario',          'luigi',          'pop_culture'),
  ('batman',         'superman',       'batman',         'superman',       'pop_culture'),
  ('spiderman',      'ironman',        'spiderman',      'ironman',        'pop_culture'),
  ('pikachu',        'rondoudou',      'pikachu',        'jigglypuff',     'pop_culture'),
  ('goku',           'naruto',         'goku',           'naruto',         'pop_culture'),
  ('minion',         'stitch',         'minion',         'stitch',         'pop_culture'),
  ('shrek',          'donkey',         'shrek',          'donkey',         'pop_culture'),
  ('yoda',           'darth vader',    'yoda',           'darth vader',    'pop_culture'),
  ('harry potter',   'hermione',       'harry potter',   'hermione',       'pop_culture'),

  -- Duos de célébrités proches visuellement
  ('donald trump',   'elon musk',      'donald trump',   'elon musk',      'pop_culture'),
  ('ronaldo',        'mbappe',         'ronaldo',        'mbappe',         'pop_culture'),
  ('taylor swift',   'beyoncé',        'taylor swift',   'beyonce',        'pop_culture'),
  ('kim kardashian', 'kylie jenner',   'kim kardashian', 'kylie jenner',   'pop_culture'),
  ('jeff bezos',     'bill gates',     'jeff bezos',     'bill gates',     'pop_culture'),

  -- Duos de personnages de séries / films proches
  ('james bond',     'jack sparrow',   'james bond',     'jack sparrow',   'pop_culture'),
  ('walter white',   'the joker',      'walter white',   'the joker',      'pop_culture'),
  ('gandalf',        'dumbledore',     'gandalf',        'dumbledore',     'pop_culture'),
  ('the joker',      'harley quinn',   'the joker',      'harley quinn',   'pop_culture'),
  ('deadpool',       'wolverine',      'deadpool',       'wolverine',      'pop_culture'),

  -- Duos de jeux vidéo / pop
  ('among us',       'minecraft',      'among us',       'minecraft',      'pop_culture'),
  ('fortnite',       'roblox',         'fortnite',       'roblox',         'pop_culture'),
  ('pac-man',        'tetris',         'pac-man',        'tetris',         'pop_culture'),
  ('sonic',          'mario',          'sonic',          'mario',          'pop_culture'),
  ('zelda',          'link',           'zelda',          'link',           'pop_culture'),

  -- Duos de logos / marques iconiques
  ('tiktok',         'instagram',      'tiktok',         'instagram',      'pop_culture'),
  ('netflix',        'youtube',        'netflix',        'youtube',        'pop_culture'),
  ('apple',          'android',        'apple',          'android',        'pop_culture'),
  ('mcdonalds',      'burger king',    'mcdonalds',      'burger king',    'pop_culture'),
  ('coca-cola',      'pepsi',          'coca-cola',      'pepsi',          'pop_culture');
