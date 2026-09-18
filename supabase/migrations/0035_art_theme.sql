-- Nouveau thème « Art » : 50 paires d'œuvres célèbres.
--
-- Principe : chaque paire réunit deux œuvres qui se ressemblent visuellement,
-- pour que le dessin du Hors-Thème passe inaperçu. C'est ce qui rend le thème
-- jouable : la Joconde et la Jeune fille à la perle sont deux bustes de femme,
-- La Grande Vague et Le Radeau de la Méduse sont deux bateaux dans une vague
-- géante, Le Penseur et le David sont deux statues d'homme nu assis ou debout.
--
-- Les œuvres retenues sont volontairement les plus connues du grand public, et
-- toutes ont une composition simple à esquisser en une minute. Pas d'œuvre
-- abstraite difficile à identifier, sauf quand l'abstraction est justement le
-- sujet reconnaissable de la paire (Malevitch/Mondrian).
--
-- Peinture, sculpture, photographie et street art sont mélangés : cela permet
-- des paires comme Le Baiser de Klimt et Le Baiser de Rodin, où le même sujet
-- est traité dans deux médiums.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Portraits de femme (5)
  ('la joconde', 'la jeune fille à la perle', 'mona lisa', 'girl with a pearl earring', 'art'),
  ('la dame à l''hermine', 'la belle ferronnière', 'lady with an ermine', 'la belle ferronniere', 'art'),
  ('la laitière', 'la dentellière', 'the milkmaid', 'the lacemaker', 'art'),
  ('la grande odalisque', 'la maja nue', 'the grand odalisque', 'the nude maja', 'art'),
  ('la naissance de vénus', 'le printemps de botticelli', 'the birth of venus', 'primavera', 'art'),

  -- Autoportraits (1)
  ('autoportrait de van gogh', 'autoportrait de frida kahlo', 'van gogh self-portrait', 'frida kahlo self-portrait', 'art'),

  -- Ciels, mers et paysages (5)
  ('la nuit étoilée', 'impression soleil levant', 'the starry night', 'impression sunrise', 'art'),
  ('les nymphéas', 'le pont japonais', 'water lilies', 'the japanese bridge', 'art'),
  ('la montagne sainte-victoire', 'le mont fuji', 'mont sainte-victoire', 'mount fuji', 'art'),
  ('la grande vague de kanagawa', 'le radeau de la méduse', 'the great wave', 'the raft of the medusa', 'art'),
  ('les tournesols', 'les iris', 'sunflowers', 'irises', 'art'),

  -- Repas et tablées (4)
  ('le déjeuner sur l''herbe', 'le déjeuner des canotiers', 'the luncheon on the grass', 'luncheon of the boating party', 'art'),
  ('la cène', 'les noces de cana', 'the last supper', 'the wedding at cana', 'art'),
  ('les tricheurs', 'les joueurs de cartes', 'the cardsharps', 'the card players', 'art'),
  ('nighthawks', 'le café de nuit', 'nighthawks', 'the night cafe', 'art'),

  -- Foules et scènes historiques (4)
  ('la liberté guidant le peuple', 'le sacre de napoléon', 'liberty leading the people', 'the coronation of napoleon', 'art'),
  ('la ronde de nuit', 'les ménines', 'the night watch', 'las meninas', 'art'),
  ('la mort de marat', 'le serment des horaces', 'the death of marat', 'the oath of the horatii', 'art'),
  ('guernica', 'les demoiselles d''avignon', 'guernica', 'the young ladies of avignon', 'art'),

  -- Cauchemars et scènes fantastiques (3)
  ('saturne dévorant son fils', 'le cauchemar', 'saturn devouring his son', 'the nightmare', 'art'),
  ('le jardin des délices', 'la tour de babel', 'the garden of earthly delights', 'the tower of babel', 'art'),
  ('le cri', 'le fils de l''homme', 'the scream', 'the son of man', 'art'),

  -- Baisers et couples (2)
  ('le baiser de klimt', 'le baiser de rodin', 'the kiss by klimt', 'the kiss by rodin', 'art'),
  ('american gothic', 'les époux arnolfini', 'american gothic', 'the arnolfini portrait', 'art'),

  -- Surréalisme (1)
  ('la persistance de la mémoire', 'la trahison des images', 'the persistence of memory', 'the treachery of images', 'art'),

  -- Sculptures classiques (5)
  ('le penseur', 'le david', 'the thinker', 'david', 'art'),
  ('la pietà', 'la vierge à l''enfant', 'the pieta', 'madonna and child', 'art'),
  ('la vénus de milo', 'la victoire de samothrace', 'venus de milo', 'winged victory of samothrace', 'art'),
  ('le colosse de rhodes', 'la statue de la liberté', 'the colossus of rhodes', 'the statue of liberty', 'art'),
  ('le christ rédempteur', 'le grand bouddha', 'christ the redeemer', 'the great buddha', 'art'),

  -- Monuments sculptés (3)
  ('le moaï', 'le sphinx de gizeh', 'moai', 'great sphinx of giza', 'art'),
  ('le manneken pis', 'la petite sirène de copenhague', 'manneken pis', 'the little mermaid statue', 'art'),
  ('les colonnes de buren', 'la pyramide du louvre', 'buren columns', 'the louvre pyramid', 'art'),

  -- Art moderne et abstrait (2)
  ('le carré noir de malevitch', 'la composition de mondrian', 'black square', 'mondrian composition', 'art'),
  ('la fontaine de duchamp', 'la banane de cattelan', 'duchamp fountain', 'cattelan banana', 'art'),

  -- Pop art et street art (4)
  ('la soupe campbell', 'les marilyn de warhol', 'campbell soup cans', 'warhol marilyns', 'art'),
  ('la femme qui pleure de lichtenstein', 'whaam', 'crying girl', 'whaam', 'art'),
  ('la fille au ballon de banksy', 'le lanceur de fleurs de banksy', 'girl with balloon', 'flower thrower', 'art'),
  ('les personnages de keith haring', 'les graffitis de basquiat', 'keith haring figures', 'basquiat graffiti', 'art'),

  -- Van Gogh, intérieurs et objets (1)
  ('la chambre à arles', 'la chaise de van gogh', 'bedroom in arles', 'van gogh chair', 'art'),

  -- Danse et fêtes (2)
  ('la classe de danse', 'la petite danseuse', 'the dance class', 'little dancer', 'art'),
  ('le bal du moulin rouge', 'le moulin de la galette', 'at the moulin rouge', 'bal du moulin de la galette', 'art'),

  -- Travail et campagne (1)
  ('les glaneuses', 'l''angélus', 'the gleaners', 'the angelus', 'art'),

  -- Art ancien et fresques (2)
  ('les peintures de lascaux', 'les hiéroglyphes égyptiens', 'lascaux cave paintings', 'egyptian hieroglyphs', 'art'),
  ('la mosaïque romaine', 'la fresque de pompéi', 'roman mosaic', 'pompeii fresco', 'art'),

  -- Anatomie et science (1)
  ('l''homme de vitruve', 'la leçon d''anatomie', 'vitruvian man', 'the anatomy lesson', 'art'),

  -- Portraits d'homme (1)
  ('le joueur de fifre', 'le garçon au gilet rouge', 'the fifer', 'boy in a red vest', 'art'),

  -- Rues et parapluies (1)
  ('les parapluies de renoir', 'la rue de paris temps de pluie', 'the umbrellas', 'paris street rainy day', 'art'),

  -- Photographies célèbres (1)
  ('le baiser de l''hôtel de ville', 'le baiser de times square', 'kiss by the hotel de ville', 'v-j day kiss', 'art'),

  -- Plafond de la chapelle Sixtine (1)
  ('la création d''adam', 'le jugement dernier', 'the creation of adam', 'the last judgment', 'art');
