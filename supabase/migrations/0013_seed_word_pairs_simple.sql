-- Ajoute 30 paires simples (débutants) réparties sur les thèmes existants.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Général
  ('porte', 'fenêtre', 'door', 'window', 'general'),
  ('chaussure', 'chaussette', 'shoe', 'sock', 'general'),
  ('lit', 'canapé', 'bed', 'sofa', 'general'),
  ('route', 'chemin', 'road', 'path', 'general'),
  ('guitare', 'piano', 'guitar', 'piano', 'general'),

  -- Animaux
  ('lapin', 'hamster', 'rabbit', 'hamster', 'animaux'),
  ('vache', 'cheval', 'cow', 'horse', 'animaux'),
  ('oiseau', 'canari', 'bird', 'canary', 'animaux'),
  ('chien', 'chat', 'dog', 'cat', 'animaux'),
  ('poisson rouge', 'tortue', 'goldfish', 'turtle', 'animaux'),

  -- Nourriture
  ('tarte', 'crêpe', 'pie', 'crepe', 'nourriture'),
  ('baguette', 'biscuit', 'baguette', 'biscuit', 'nourriture'),
  ('fraise', 'raisin', 'strawberry', 'grape', 'nourriture'),
  ('œuf', 'bacon', 'egg', 'bacon', 'nourriture'),
  ('jus', 'soda', 'juice', 'soda', 'nourriture'),

  -- Voyage
  ('taxi', 'bus', 'taxi', 'bus', 'voyage'),
  ('gare', 'aéroport', 'train station', 'airport', 'voyage'),
  ('carte', 'boussole', 'map', 'compass', 'voyage'),
  ('plage', 'île', 'beach', 'island', 'voyage'),
  ('phare', 'port', 'lighthouse', 'harbor', 'voyage'),

  -- Objets
  ('brosse à dents', 'dentifrice', 'toothbrush', 'toothpaste', 'objets'),
  ('lampe', 'prise', 'lamp', 'socket', 'objets'),
  ('stylo', 'marqueur', 'pen', 'marker', 'objets'),
  ('ciseaux', 'colle', 'scissors', 'glue', 'objets'),
  ('clé', 'serrure', 'key', 'lock', 'objets'),

  -- Sport
  ('ballon', 'but', 'ball', 'goal', 'sport'),
  ('raquette', 'filet', 'racket', 'net', 'sport'),
  ('médailles', 'trophée', 'medal', 'trophy', 'sport'),
  ('piscine', 'bonnet', 'pool', 'swim cap', 'sport'),
  ('sifflet', 'carton', 'whistle', 'card', 'sport'),

  -- Technologie
  ('souris', 'clavier', 'mouse', 'keyboard', 'technologie'),
  ('écran', 'webcam', 'monitor', 'webcam', 'technologie'),
  ('wifi', 'bluetooth', 'wifi', 'bluetooth', 'technologie'),
  ('batterie', 'chargeur', 'battery', 'charger', 'technologie'),
  ('écouteurs', 'micro', 'earbuds', 'microphone', 'technologie');
