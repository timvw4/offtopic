-- Ajout de 3 nouveaux thèmes : sports, fantastique, metiers
-- Chaque thème contient 20 paires (mot civil / mot hors-thème) proches mais différents.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values

  -- Sports (20 paires)
  -- Les deux mots de chaque paire sont des sports visuellement similaires
  ('football', 'rugby', 'soccer', 'rugby', 'sports'),
  ('natation', 'plongée', 'swimming', 'diving', 'sports'),
  ('tennis', 'badminton', 'tennis', 'badminton', 'sports'),
  ('ski', 'snowboard', 'ski', 'snowboard', 'sports'),
  ('boxe', 'karaté', 'boxing', 'karate', 'sports'),
  ('basket', 'volley', 'basketball', 'volleyball', 'sports'),
  ('golf', 'cricket', 'golf', 'cricket', 'sports'),
  ('escalade', 'spéléologie', 'climbing', 'caving', 'sports'),
  ('judo', 'lutte', 'judo', 'wrestling', 'sports'),
  ('tir à l''arc', 'fronde', 'archery', 'slingshot', 'sports'),
  ('équitation', 'polo', 'horse riding', 'polo', 'sports'),
  ('kayak', 'canoë', 'kayak', 'canoe', 'sports'),
  ('patinage', 'luge', 'ice skating', 'luge', 'sports'),
  ('handball', 'water-polo', 'handball', 'water polo', 'sports'),
  ('escrime', 'sabre', 'fencing', 'saber', 'sports'),
  ('yoga', 'pilates', 'yoga', 'pilates', 'sports'),
  ('surf', 'kitesurf', 'surfing', 'kitesurfing', 'sports'),
  ('cyclisme', 'triathlon', 'cycling', 'triathlon', 'sports'),
  ('haltérophilie', 'musculation', 'weightlifting', 'bodybuilding', 'sports'),
  ('marathon', 'course d''obstacles', 'marathon', 'obstacle race', 'sports'),

  -- Fantastique (20 paires)
  -- Créatures et éléments de fantasy, proches mais distincts
  ('vampire', 'loup-garou', 'vampire', 'werewolf', 'fantastique'),
  ('dragon', 'wyverne', 'dragon', 'wyvern', 'fantastique'),
  ('sorcier', 'magicien', 'wizard', 'magician', 'fantastique'),
  ('fantôme', 'spectre', 'ghost', 'specter', 'fantastique'),
  ('zombie', 'momie', 'zombie', 'mummy', 'fantastique'),
  ('elfe', 'fée', 'elf', 'fairy', 'fantastique'),
  ('nain', 'hobbit', 'dwarf', 'hobbit', 'fantastique'),
  ('ogre', 'troll', 'ogre', 'troll', 'fantastique'),
  ('licorne', 'pégase', 'unicorn', 'pegasus', 'fantastique'),
  ('sirène', 'triton', 'mermaid', 'triton', 'fantastique'),
  ('phénix', 'griffon', 'phoenix', 'griffin', 'fantastique'),
  ('golem', 'frankenstein', 'golem', 'frankenstein', 'fantastique'),
  ('centaure', 'minotaure', 'centaur', 'minotaur', 'fantastique'),
  ('ange', 'démon', 'angel', 'demon', 'fantastique'),
  ('sorcière', 'enchanteresse', 'witch', 'sorceress', 'fantastique'),
  ('château hanté', 'manoir', 'haunted castle', 'manor', 'fantastique'),
  ('potion', 'parchemin', 'potion', 'scroll', 'fantastique'),
  ('épée magique', 'baguette', 'magic sword', 'wand', 'fantastique'),
  ('chauve-souris', 'chouette', 'bat', 'owl', 'fantastique'),
  ('loup', 'renard magique', 'wolf', 'magic fox', 'fantastique'),

  -- Métiers (20 paires)
  -- Professions visuellement proches, faciles à dessiner
  ('pompier', 'policier', 'firefighter', 'police officer', 'metiers'),
  ('médecin', 'infirmier', 'doctor', 'nurse', 'metiers'),
  ('chef cuisinier', 'pâtissier', 'chef', 'pastry chef', 'metiers'),
  ('pilote', 'astronaute', 'pilot', 'astronaut', 'metiers'),
  ('architecte', 'ingénieur', 'architect', 'engineer', 'metiers'),
  ('professeur', 'formateur', 'teacher', 'trainer', 'metiers'),
  ('journaliste', 'présentateur', 'journalist', 'host', 'metiers'),
  ('acteur', 'chanteur', 'actor', 'singer', 'metiers'),
  ('peintre', 'sculpteur', 'painter', 'sculptor', 'metiers'),
  ('plombier', 'électricien', 'plumber', 'electrician', 'metiers'),
  ('jardinier', 'agriculteur', 'gardener', 'farmer', 'metiers'),
  ('vétérinaire', 'zoologiste', 'vet', 'zoologist', 'metiers'),
  ('dentiste', 'chirurgien', 'dentist', 'surgeon', 'metiers'),
  ('avocat', 'juge', 'lawyer', 'judge', 'metiers'),
  ('boulanger', 'boucher', 'baker', 'butcher', 'metiers'),
  ('postier', 'livreur', 'postman', 'delivery driver', 'metiers'),
  ('marin', 'pêcheur', 'sailor', 'fisherman', 'metiers'),
  ('coiffeur', 'maquilleur', 'hairdresser', 'makeup artist', 'metiers'),
  ('guide', 'explorateur', 'guide', 'explorer', 'metiers'),
  ('bibliothécaire', 'libraire', 'librarian', 'bookseller', 'metiers');
