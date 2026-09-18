-- Refonte du thème « Divertissement ».
--
-- Même défaut de construction que Nature, poussé à l'extrême : le hors-thème
-- était systématiquement un accessoire ou un détail du mot civil, jamais une
-- alternative confondable. film/popcorn, pêche/canne, bowling/quille,
-- karaoké/micro, cocktail… le Hors-Thème dessinait forcément autre chose.
--
-- S'ajoutaient :
--   • 20 mots abstraits impossibles à dessiner : épisode, voix, symphonie,
--     aria, illusion, immersion, niveau, virage, énigme, exposition…
--   • 2 paires indissociables : livre/roman (c'est le même objet) et
--     lego/brique (le lego EST une brique).
--   • 6 mots réutilisés dans d'autres thèmes : film, musique, musée, billet,
--     camping, randonnée, sac, colle, planche, queue, caméra, micro.
--   • 1 faute de frappe : « feu camp » au lieu de « feu de camp ».
--
-- Correction : 45 paires supprimées, 45 nouvelles paires ajoutées.
-- Le thème devient « objets de loisir » : instruments de musique, jeux, jouets,
-- loisirs créatifs, matériel de plein air, cirque et fête. Tout est un objet
-- physique, et chaque paire réunit deux objets réellement confondables
-- (violon/violoncelle, banjo/ukulélé, toupie/yoyo, jumelles/longue-vue).
--
-- Le thème conserve 5 paires valides : guitare/piano, batterie/basse,
-- échecs/dames, roller/skate, console/manette. Total : 50 paires.

delete from public.word_pairs
where theme = 'divertissement'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Mot abstrait ou indessinable (20)
    ('série', 'épisode'),
    ('dessin animé', 'voix'),
    ('théâtre', 'scène'),
    ('comédie', 'stand-up'),
    ('musique', 'concert'),
    ('orchestre', 'symphonie'),
    ('opéra', 'aria'),
    ('magie', 'illusion'),
    ('spectacle', 'lumière'),
    ('musée', 'exposition'),
    ('escape game', 'énigme'),
    ('quiz', 'buzzer'),
    ('danse', 'salsa'),
    ('parc attraction', 'looping'),
    ('montagne russe', 'virage'),
    ('jeu vidéo', 'niveau'),
    ('réalité virtuelle', 'immersion'),
    ('cuisine', 'pâtisserie'),
    ('dégustation', 'vin'),
    ('podcast', 'casque'),
    -- Le hors-thème est un accessoire du mot civil (16)
    ('film', 'popcorn'),
    ('documentaire', 'caméra'),
    ('ballet', 'tutu'),
    ('cirque', 'acrobate'),
    ('festival', 'billet'),
    ('galerie', 'peinture'),
    ('bande dessinée', 'planche'),
    ('jeu de plateau', 'dé'),
    ('carte', 'poker'),
    ('puzzle', 'pièce'),
    ('karaoké', 'micro'),
    ('bowling', 'quille'),
    ('billard', 'queue'),
    ('fléchette', 'cible'),
    ('arcade', 'joystick'),
    ('maquette', 'colle'),
    -- Paire indissociable, le hors-thème est le même objet (2)
    ('livre', 'roman'),
    ('lego', 'brique'),
    -- Le hors-thème est l'outil du mot civil, et souvent le mot civil est
    -- déjà utilisé dans un autre thème (7)
    ('jardinage', 'potager'),
    ('cocktail', 'shaker'),
    ('camping', 'feu camp'),
    ('pêche', 'canne'),
    ('randonnée', 'sac'),
    ('photographie', 'objectif'),
    ('tournage', 'clap')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Instruments de musique (9)
  ('violon', 'violoncelle', 'violin', 'cello', 'divertissement'),
  ('flûte', 'clarinette', 'flute', 'clarinet', 'divertissement'),
  ('banjo', 'ukulélé', 'banjo', 'ukulele', 'divertissement'),
  ('cymbale', 'gong', 'cymbal', 'gong', 'divertissement'),
  ('accordéon', 'orgue', 'accordion', 'organ', 'divertissement'),
  ('harmonica', 'flûte de pan', 'harmonica', 'pan flute', 'divertissement'),
  ('tambour', 'maracas', 'drum', 'maracas', 'divertissement'),
  ('triangle', 'xylophone', 'triangle', 'xylophone', 'divertissement'),
  ('métronome', 'diapason', 'metronome', 'tuning fork', 'divertissement'),

  -- Jeux (9)
  ('domino', 'mikado', 'dominoes', 'pick-up sticks', 'divertissement'),
  ('scrabble', 'mots croisés', 'scrabble', 'crossword', 'divertissement'),
  ('sudoku', 'labyrinthe', 'sudoku', 'maze', 'divertissement'),
  ('flipper', 'billard', 'pinball', 'pool table', 'divertissement'),
  ('baby-foot', 'air hockey', 'foosball', 'air hockey', 'divertissement'),
  ('jenga', 'château de cartes', 'jenga', 'house of cards', 'divertissement'),
  ('toupie', 'yoyo', 'spinning top', 'yoyo', 'divertissement'),
  ('dé à jouer', 'jeton de casino', 'die', 'casino chip', 'divertissement'),
  ('machine à sous', 'roue de loterie', 'slot machine', 'lottery wheel', 'divertissement'),

  -- Jouets et jeux de plein air (6)
  ('poupée', 'peluche', 'doll', 'plush toy', 'divertissement'),
  ('cerf-volant', 'boomerang', 'kite', 'boomerang', 'divertissement'),
  ('cerceau', 'corde à sauter', 'hula hoop', 'jump rope', 'divertissement'),
  ('toboggan', 'balançoire', 'slide', 'swing', 'divertissement'),
  ('trampoline', 'bac à sable', 'trampoline', 'sandbox', 'divertissement'),
  ('pistolet à eau', 'bulles de savon', 'water gun', 'soap bubbles', 'divertissement'),

  -- Loisirs créatifs (6)
  ('pelote de laine', 'bobine de fil', 'ball of yarn', 'spool of thread', 'divertissement'),
  ('pinceau', 'rouleau', 'paintbrush', 'paint roller', 'divertissement'),
  ('palette', 'chevalet', 'palette', 'easel', 'divertissement'),
  ('argile', 'pâte à modeler', 'clay', 'play dough', 'divertissement'),
  ('perles', 'paillettes', 'beads', 'glitter', 'divertissement'),
  ('carnet de croquis', 'album photo', 'sketchbook', 'photo album', 'divertissement'),

  -- Matériel de plein air (7)
  ('hamac', 'chaise longue', 'hammock', 'deckchair', 'divertissement'),
  ('bouée', 'matelas gonflable', 'float ring', 'air mattress', 'divertissement'),
  ('canne à pêche', 'épuisette', 'fishing rod', 'landing net', 'divertissement'),
  ('jumelles', 'longue-vue', 'binoculars', 'spyglass', 'divertissement'),
  ('glacière', 'panier de pique-nique', 'cooler', 'picnic basket', 'divertissement'),
  ('parasol', 'paravent', 'beach umbrella', 'folding screen', 'divertissement'),
  ('barbecue', 'réchaud', 'barbecue', 'camping stove', 'divertissement'),

  -- Cirque et fête (8)
  ('feu d''artifice', 'cierge magique', 'fireworks', 'sparkler', 'divertissement'),
  ('guirlande', 'lampion', 'garland', 'paper lantern', 'divertissement'),
  ('échasses', 'monocycle', 'stilts', 'unicycle', 'divertissement'),
  ('trapèze', 'corde raide', 'trapeze', 'tightrope', 'divertissement'),
  ('chapiteau', 'manège', 'big top', 'carousel', 'divertissement'),
  ('masque de théâtre', 'marionnette', 'theater mask', 'puppet', 'divertissement'),
  ('ballon de baudruche', 'confettis', 'balloon', 'confetti', 'divertissement'),
  ('piñata', 'boule à facettes', 'pinata', 'disco ball', 'divertissement');
