-- Mots spéciaux pour le mode Duel
-- Ces mots sont choisis pour être :
--   • Visuels et concrets (faciles à dessiner)
--   • Reconnaissables au premier coup d'œil
--   • Variés (animaux, objets, nature, nourriture...)
--   • word_fr_hors_theme = même valeur (inutilisé en mode duel)

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Animaux
  ('chat',        'chat',        'cat',          'cat',          'duel'),
  ('chien',       'chien',       'dog',          'dog',          'duel'),
  ('lapin',       'lapin',       'rabbit',       'rabbit',       'duel'),
  ('éléphant',    'éléphant',    'elephant',     'elephant',     'duel'),
  ('pingouin',    'pingouin',    'penguin',       'penguin',      'duel'),
  ('requin',      'requin',      'shark',        'shark',        'duel'),
  ('grenouille',  'grenouille',  'frog',         'frog',         'duel'),
  ('pieuvre',     'pieuvre',     'octopus',      'octopus',      'duel'),
  ('girafe',      'girafe',      'giraffe',      'giraffe',      'duel'),
  ('dinosaure',   'dinosaure',   'dinosaur',     'dinosaur',     'duel'),

  -- Nature
  ('soleil',      'soleil',      'sun',          'sun',          'duel'),
  ('arc-en-ciel', 'arc-en-ciel', 'rainbow',      'rainbow',      'duel'),
  ('montagne',    'montagne',    'mountain',     'mountain',     'duel'),
  ('vague',       'vague',       'wave',         'wave',         'duel'),
  ('volcan',      'volcan',      'volcano',      'volcano',      'duel'),
  ('arbre',       'arbre',       'tree',         'tree',         'duel'),
  ('fleur',       'fleur',       'flower',       'flower',       'duel'),
  ('nuage',       'nuage',       'cloud',        'cloud',        'duel'),

  -- Objets du quotidien
  ('vélo',        'vélo',        'bicycle',      'bicycle',      'duel'),
  ('parapluie',   'parapluie',   'umbrella',     'umbrella',     'duel'),
  ('fusée',       'fusée',       'rocket',       'rocket',       'duel'),
  ('maison',      'maison',      'house',        'house',        'duel'),
  ('château',     'château',     'castle',       'castle',       'duel'),
  ('phare',       'phare',       'lighthouse',   'lighthouse',   'duel'),
  ('guitare',     'guitare',     'guitar',       'guitar',       'duel'),
  ('téléphone',   'téléphone',   'phone',        'phone',        'duel'),
  ('lunettes',    'lunettes',    'glasses',      'glasses',      'duel'),
  ('couronne',    'couronne',    'crown',        'crown',        'duel'),
  ('ballon',      'ballon',      'balloon',      'balloon',      'duel'),
  ('robot',       'robot',       'robot',        'robot',        'duel'),

  -- Nourriture
  ('pizza',       'pizza',       'pizza',        'pizza',        'duel'),
  ('glace',       'glace',       'ice cream',    'ice cream',    'duel'),
  ('gâteau',      'gâteau',      'cake',         'cake',         'duel'),
  ('pastèque',    'pastèque',    'watermelon',   'watermelon',   'duel'),
  ('ananas',      'ananas',      'pineapple',    'pineapple',    'duel'),
  ('sushi',       'sushi',       'sushi',        'sushi',        'duel'),
  ('burger',      'burger',      'burger',       'burger',       'duel'),
  ('croissant',   'croissant',   'croissant',    'croissant',    'duel'),
  ('kebab',       'kebab',       'kebab',        'kebab',        'duel'),
  ('taco',        'taco',        'taco',         'taco',         'duel'),

  -- Personnages / créatures
  ('licorne',          'licorne',          'unicorn',           'unicorn',           'duel'),
  ('fantôme',          'fantôme',          'ghost',             'ghost',             'duel'),
  ('baleine',          'baleine',          'whale',             'whale',             'duel'),
  ('dragon',           'dragon',           'dragon',            'dragon',            'duel'),
  ('astronaute',       'astronaute',       'astronaut',         'astronaut',         'duel'),
  ('stitch',           'stitch',           'stitch',            'stitch',            'duel'),
  ('grinch',           'grinch',           'grinch',            'grinch',            'duel'),
  ('deadpool',         'deadpool',         'deadpool',          'deadpool',          'duel'),
  ('thanos',           'thanos',           'thanos',            'thanos',            'duel'),
  ('yoda',             'yoda',             'yoda',              'yoda',              'duel'),
  ('darth vader',      'darth vader',      'darth vader',       'darth vader',       'duel'),
  ('goku',             'goku',             'goku',              'goku',              'duel'),
  ('naruto',           'naruto',           'naruto',            'naruto',            'duel'),
  ('hello kitty',      'hello kitty',      'hello kitty',       'hello kitty',       'duel'),
  ('among us',         'among us',         'among us',          'among us',          'duel'),

  -- Personnalités & pop culture 😂
  ('donald trump',     'donald trump',     'donald trump',      'donald trump',      'duel'),
  ('elon musk',        'elon musk',        'elon musk',         'elon musk',         'duel'),
  ('ronaldo',          'ronaldo',          'ronaldo',           'ronaldo',           'duel'),
  ('pikachu',          'pikachu',          'pikachu',           'pikachu',           'duel'),
  ('mario',            'mario',            'mario',             'mario',             'duel'),
  ('minion',           'minion',           'minion',            'minion',            'duel'),
  ('spiderman',        'spiderman',        'spiderman',         'spiderman',         'duel'),
  ('shrek',            'shrek',            'shrek',             'shrek',             'duel'),
  ('bob l''éponge',    'bob l''éponge',    'spongebob',         'spongebob',         'duel'),
  ('batman',           'batman',           'batman',            'batman',            'duel'),
  ('taylor swift',     'taylor swift',     'taylor swift',      'taylor swift',      'duel'),
  ('beyoncé',          'beyoncé',          'beyonce',           'beyonce',           'duel'),
  ('kim kardashian',   'kim kardashian',   'kim kardashian',    'kim kardashian',    'duel'),
  ('jeff bezos',       'jeff bezos',       'jeff bezos',        'jeff bezos',        'duel'),
  ('mbappe',           'mbappe',           'mbappe',            'mbappe',            'duel'),
  ('homer simpson',    'homer simpson',    'homer simpson',     'homer simpson',     'duel'),
  ('bart simpson',     'bart simpson',     'bart simpson',      'bart simpson',      'duel'),
  ('walter white',     'walter white',     'walter white',      'walter white',      'duel'),
  ('the joker',        'the joker',        'the joker',         'the joker',         'duel'),
  ('harry potter',     'harry potter',     'harry potter',      'harry potter',      'duel'),
  ('gandalf',          'gandalf',          'gandalf',           'gandalf',           'duel'),
  ('jack sparrow',     'jack sparrow',     'jack sparrow',      'jack sparrow',      'duel'),
  ('ironman',          'ironman',          'ironman',           'ironman',           'duel'),
  ('james bond',       'james bond',       'james bond',        'james bond',        'duel'),


  -- Drôles & insolites 😆
  ('selfie',           'selfie',           'selfie',            'selfie',            'duel'),
  ('tiktok',           'tiktok',           'tiktok',            'tiktok',            'duel'),
  ('onlyfans',         'onlyfans',         'onlyfans',          'onlyfans',          'duel'),
  ('toilettes',        'toilettes',        'toilet',            'toilet',            'duel'),
  ('culotte',          'culotte',          'underwear',         'underwear',         'duel'),
  ('sextoy',           'sextoy',           'sextoy',            'sextoy',            'duel'),
  ('pet',              'pet',              'fart',              'fart',              'duel'),
  ('jack daniel''s',   'jack daniel''s',   'jack daniel''s',    'jack daniel''s',    'duel'),
  ('brosse à dent',    'brosse à dent',    'teethbrush',        'teethbrush',        'duel'),
  ('feu de camp',      'feu de camp',      'fire camp',         'fire camp',         'duel'),
  ('embouteillage',    'embouteillage',    'traffic jam',       'traffic jam',       'duel'),
  ('lundi matin',      'lundi matin',      'monday morning',    'monday morning',    'duel'),
  ('réunion zoom',     'réunion zoom',     'zoom meeting',      'zoom meeting',      'duel'),
  ('kamasurta',        'kamasutra',        'kamasutra',         'kamasutra',         'duel'),
  ('wifi',             'wifi',             'wifi',              'wifi',              'duel'),
  ('recharge téléphone','recharge téléphone','phone charging',  'phone charging',    'duel'),
  ('queue au supermarché','queue au supermarché','supermarket queue','supermarket queue','duel');
