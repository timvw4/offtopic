-- Refonte du thème « Général ».
--
-- Problème : 39 paires étaient des concepts abstraits impossibles à dessiner
-- (amour/haine, succès/échec, instant/éternité…), plus 1 paire en doublon exact
-- avec « Objets du quotidien » (clé/serrure) et 1 paire dont le mot civil était
-- déjà utilisé ailleurs (porte, présent aussi dans « Objets du quotidien »).
--
-- Correction : 41 paires supprimées, 41 nouvelles paires ajoutées.
-- Les nouvelles paires respectent 3 règles :
--   • les deux mots sont concrets et dessinables ;
--   • ils sont visuellement proches pour que le Hors-Thème soit dur à démasquer ;
--   • aucun mot n'existe déjà dans un autre thème (pas de nouveau doublon).
--
-- Le thème conserve ses 9 paires déjà valides : soleil/lune, jour/nuit,
-- terre/ciel, mer/montagne, sourire/larme, reflet/miroir, route/chemin,
-- pont/tunnel, ville/village. Total après migration : 50 paires.

delete from public.word_pairs
where theme = 'general'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Concepts abstraits, non dessinables (39)
    ('ami', 'voisin'),
    ('amour', 'haine'),
    ('joie', 'tristesse'),
    ('calme', 'tempête'),
    ('force', 'faiblesse'),
    ('liberté', 'prison'),
    ('paix', 'guerre'),
    ('lumière', 'ombre'),
    ('espoir', 'peur'),
    ('rapidité', 'lenteur'),
    ('gain', 'perte'),
    ('succès', 'échec'),
    ('début', 'fin'),
    ('question', 'réponse'),
    ('secret', 'révélation'),
    ('mémoire', 'oubli'),
    ('courage', 'prudence'),
    ('vérité', 'mensonge'),
    ('ordre', 'chaos'),
    ('vie', 'mort'),
    ('futur', 'passé'),
    ('silence', 'bruit'),
    ('rêve', 'réalité'),
    ('fête', 'travail'),
    ('idée', 'projet'),
    ('regard', 'voix'),
    ('esprit', 'corps'),
    ('bonheur', 'malheur'),
    ('talent', 'effort'),
    ('nature', 'culture'),
    ('justice', 'injustice'),
    ('énergie', 'repos'),
    ('instant', 'éternité'),
    ('centre', 'périphérie'),
    ('leader', 'suiveur'),
    ('cause', 'effet'),
    ('problème', 'solution'),
    ('rumeur', 'preuve'),
    ('histoire', 'légende'),
    -- Paire strictement identique à celle du thème « Objets du quotidien » (1)
    ('clé', 'serrure'),
    -- Mot civil déjà utilisé dans « Objets du quotidien » (1)
    ('porte', 'fenêtre')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Véhicules et transports (8)
  ('voiture', 'camion', 'car', 'truck', 'general'),
  ('bus', 'tramway', 'bus', 'tram', 'general'),
  ('avion', 'hélicoptère', 'plane', 'helicopter', 'general'),
  ('train', 'métro', 'train', 'subway', 'general'),
  ('bateau', 'sous-marin', 'boat', 'submarine', 'general'),
  ('moto', 'scooter', 'motorcycle', 'scooter', 'general'),
  ('tracteur', 'bulldozer', 'tractor', 'bulldozer', 'general'),
  ('montgolfière', 'planeur', 'hot air balloon', 'glider', 'general'),

  -- Nourriture (8)
  ('pomme', 'poire', 'apple', 'pear', 'general'),
  ('fraise', 'cerise', 'strawberry', 'cherry', 'general'),
  ('citron', 'orange', 'lemon', 'orange', 'general'),
  ('carotte', 'tomate', 'carrot', 'tomato', 'general'),
  ('crêpe', 'gaufre', 'crepe', 'waffle', 'general'),
  ('sandwich', 'hamburger', 'sandwich', 'hamburger', 'general'),
  ('fromage', 'beurre', 'cheese', 'butter', 'general'),
  ('frites', 'spaghetti', 'fries', 'spaghetti', 'general'),

  -- Corps humain (4)
  ('main', 'pied', 'hand', 'foot', 'general'),
  ('oeil', 'oreille', 'eye', 'ear', 'general'),
  ('nez', 'bouche', 'nose', 'mouth', 'general'),
  ('barbe', 'moustache', 'beard', 'mustache', 'general'),

  -- Vêtements (6)
  ('chemise', 'pull', 'shirt', 'sweater', 'general'),
  ('pantalon', 'short', 'pants', 'shorts', 'general'),
  ('jupe', 'robe', 'skirt', 'dress', 'general'),
  ('casquette', 'bonnet', 'cap', 'beanie', 'general'),
  ('botte', 'sandale', 'boot', 'sandal', 'general'),
  ('cravate', 'noeud papillon', 'tie', 'bow tie', 'general'),

  -- Bâtiments et lieux (8)
  ('immeuble', 'gratte-ciel', 'apartment building', 'skyscraper', 'general'),
  ('église', 'temple', 'church', 'temple', 'general'),
  ('cabane', 'tente', 'hut', 'tent', 'general'),
  ('moulin', 'grange', 'windmill', 'barn', 'general'),
  ('igloo', 'pyramide', 'igloo', 'pyramid', 'general'),
  ('gare', 'usine', 'train station', 'factory', 'general'),
  ('hôpital', 'école', 'hospital', 'school', 'general'),
  ('stade', 'arène', 'stadium', 'arena', 'general'),

  -- Outils et bricolage (6)
  ('marteau', 'tournevis', 'hammer', 'screwdriver', 'general'),
  ('scie', 'pince', 'saw', 'pliers', 'general'),
  ('clou', 'vis', 'nail', 'screw', 'general'),
  ('pelle', 'râteau', 'shovel', 'rake', 'general'),
  ('arrosoir', 'seau', 'watering can', 'bucket', 'general'),
  ('échelle', 'escabeau', 'ladder', 'stepladder', 'general'),

  -- Instruments à vent (1)
  ('trompette', 'saxophone', 'trumpet', 'saxophone', 'general');
