-- Passage de Sports, Fantastique et Métiers de 20 à 50 paires.
--
-- Ces trois thèmes n'avaient que 20 paires, contre 50 pour les autres. En
-- soirée, un thème à 20 paires se répète très vite : au bout de quelques
-- manches, les joueurs reconnaissent les mots et le bluff ne fonctionne plus.
--
-- Ajout de 30 paires par thème, en gardant la règle du jeu : les deux mots
-- doivent produire des dessins proches mais distinguables.
--   • Sports : disciplines dont le geste ou le matériel se dessine
--     (bobsleigh/skeleton, tir à la corde/bras de fer, saut en hauteur/saut en
--     longueur).
--   • Fantastique : créatures et objets magiques identifiables
--     (chaudron/alambic, balai volant/tapis volant, paladin/barbare).
--   • Métiers : professions avec un accessoire ou un décor reconnaissable
--     (couvreur/ramoneur, horloger/bijoutier, apiculteur/scaphandrier).
--
-- Aucune suppression ici, uniquement des ajouts. Total après migration :
-- 50 paires pour chacun des trois thèmes.

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- ── SPORTS (+30) ────────────────────────────────────────────────────────
  -- Sports collectifs et de raquette
  ('baseball', 'hockey sur gazon', 'baseball', 'field hockey', 'sports'),
  ('football américain', 'lacrosse', 'american football', 'lacrosse', 'sports'),
  ('hockey sur glace', 'roller derby', 'ice hockey', 'roller derby', 'sports'),
  ('padel', 'pickleball', 'padel', 'pickleball', 'sports'),
  -- Athlétisme
  ('saut en hauteur', 'saut en longueur', 'high jump', 'long jump', 'sports'),
  ('saut à la perche', 'lancer de javelot', 'pole vault', 'javelin throw', 'sports'),
  ('lancer de poids', 'lancer de disque', 'shot put', 'discus throw', 'sports'),
  ('course de haies', 'sprint', 'hurdles', 'sprint', 'sports'),
  ('course de relais', 'cross', 'relay race', 'cross country', 'sports'),
  -- Sports d'hiver
  ('biathlon', 'ski de fond', 'biathlon', 'cross-country skiing', 'sports'),
  ('bobsleigh', 'skeleton', 'bobsleigh', 'skeleton', 'sports'),
  ('saut à ski', 'slalom', 'ski jumping', 'slalom', 'sports'),
  -- Sports nautiques
  ('aviron', 'voile', 'rowing', 'sailing', 'sports'),
  ('jet-ski', 'wakeboard', 'jet ski', 'wakeboarding', 'sports'),
  ('planche à voile', 'paddle', 'windsurfing', 'paddleboarding', 'sports'),
  ('rafting', 'canyoning', 'rafting', 'canyoning', 'sports'),
  -- Sports mécaniques
  ('formule 1', 'rallye', 'formula 1', 'rally', 'sports'),
  ('motocross', 'bmx', 'motocross', 'bmx', 'sports'),
  ('cyclisme', 'vtt', 'road cycling', 'mountain biking', 'sports'),
  -- Combat et force
  ('sumo', 'catch', 'sumo', 'pro wrestling', 'sports'),
  ('taekwondo', 'kung-fu', 'taekwondo', 'kung fu', 'sports'),
  ('tir à la corde', 'bras de fer', 'tug of war', 'arm wrestling', 'sports'),
  ('haltères', 'kettlebell', 'dumbbell', 'kettlebell', 'sports'),
  -- Gymnastique et acrobatie
  ('gymnastique', 'acrobatie', 'gymnastics', 'acrobatics', 'sports'),
  ('capoeira', 'breakdance', 'capoeira', 'breakdancing', 'sports'),
  ('parkour', 'slackline', 'parkour', 'slacklining', 'sports'),
  ('cheerleading', 'majorettes', 'cheerleading', 'baton twirling', 'sports'),
  -- Montagne et équitation
  ('alpinisme', 'trekking', 'mountaineering', 'trekking', 'sports'),
  ('saut d''obstacles', 'dressage', 'show jumping', 'dressage', 'sports'),
  ('paintball', 'airsoft', 'paintball', 'airsoft', 'sports'),

  -- ── FANTASTIQUE (+30) ───────────────────────────────────────────────────
  -- Créatures humanoïdes
  ('orc', 'gobelin', 'orc', 'goblin', 'fantastique'),
  ('lutin', 'korrigan', 'imp', 'korrigan', 'fantastique'),
  ('farfadet', 'gnome', 'leprechaun', 'gnome', 'fantastique'),
  ('yéti', 'homme des cavernes', 'yeti', 'caveman', 'fantastique'),
  ('sphinx', 'colosse', 'sphinx', 'colossus', 'fantastique'),
  ('gargouille', 'statue vivante', 'gargoyle', 'living statue', 'fantastique'),
  -- Créatures monstrueuses
  ('gorgone', 'harpie', 'gorgon', 'harpy', 'fantastique'),
  ('chimère', 'manticore', 'chimera', 'manticore', 'fantastique'),
  ('hippogriffe', 'basilic', 'hippogriff', 'basilisk', 'fantastique'),
  ('banshee', 'goule', 'banshee', 'ghoul', 'fantastique'),
  ('squelette', 'revenant', 'skeleton', 'revenant', 'fantastique'),
  ('croque-mitaine', 'épouvantail', 'bogeyman', 'scarecrow', 'fantastique'),
  ('clown maléfique', 'pantin maudit', 'evil clown', 'cursed puppet', 'fantastique'),
  -- Esprits de la nature
  ('dryade', 'nymphe', 'dryad', 'nymph', 'fantastique'),
  -- Personnages de légende
  ('nécromancien', 'alchimiste', 'necromancer', 'alchemist', 'fantastique'),
  ('paladin', 'barbare', 'paladin', 'barbarian', 'fantastique'),
  ('druide', 'chaman', 'druid', 'shaman', 'fantastique'),
  ('chevalier noir', 'croisé', 'black knight', 'crusader', 'fantastique'),
  -- Objets magiques
  ('bâton de mage', 'sceptre', 'wizard staff', 'scepter', 'fantastique'),
  ('cape d''invisibilité', 'armure enchantée', 'invisibility cloak', 'enchanted armor', 'fantastique'),
  ('boule de cristal', 'tarot', 'crystal ball', 'tarot cards', 'fantastique'),
  ('anneau magique', 'couronne enchantée', 'magic ring', 'enchanted crown', 'fantastique'),
  ('chaudron', 'alambic', 'cauldron', 'alembic', 'fantastique'),
  ('balai volant', 'tapis volant', 'flying broom', 'flying carpet', 'fantastique'),
  ('épée enchantée', 'bouclier runique', 'enchanted sword', 'runic shield', 'fantastique'),
  ('arc elfique', 'dague empoisonnée', 'elven bow', 'poisoned dagger', 'fantastique'),
  ('orbe magique', 'sablier ensorcelé', 'magic orb', 'enchanted hourglass', 'fantastique'),
  -- Lieux
  ('portail magique', 'cercle d''invocation', 'magic portal', 'summoning circle', 'fantastique'),
  ('donjon', 'crypte', 'dungeon', 'crypt', 'fantastique'),
  ('cimetière hanté', 'catacombes', 'haunted graveyard', 'catacombs', 'fantastique'),

  -- ── MÉTIERS (+30) ───────────────────────────────────────────────────────
  -- Artisanat et bâtiment
  ('mécanicien', 'soudeur', 'mechanic', 'welder', 'metiers'),
  ('serrurier', 'vitrier', 'locksmith', 'glazier', 'metiers'),
  ('peintre en bâtiment', 'carreleur', 'house painter', 'tiler', 'metiers'),
  ('couvreur', 'ramoneur', 'roofer', 'chimney sweep', 'metiers'),
  ('forgeron', 'armurier', 'blacksmith', 'armorer', 'metiers'),
  ('potier', 'verrier', 'potter', 'glassblower', 'metiers'),
  ('couturier', 'cordonnier', 'tailor', 'shoemaker', 'metiers'),
  ('horloger', 'bijoutier', 'watchmaker', 'jeweler', 'metiers'),
  -- Commerce et bouche
  ('caissier', 'vendeur', 'cashier', 'shop assistant', 'metiers'),
  ('fromager', 'poissonnier', 'cheesemonger', 'fishmonger', 'metiers'),
  ('fleuriste', 'primeur', 'florist', 'greengrocer', 'metiers'),
  ('barista', 'sommelier', 'barista', 'sommelier', 'metiers'),
  -- Santé et soin
  ('pharmacien', 'opticien', 'pharmacist', 'optician', 'metiers'),
  ('sage-femme', 'pédiatre', 'midwife', 'pediatrician', 'metiers'),
  ('vétérinaire', 'toiletteur', 'vet', 'pet groomer', 'metiers'),
  ('tatoueur', 'barbier', 'tattoo artist', 'barber', 'metiers'),
  -- Sécurité et uniforme
  ('militaire', 'garde du corps', 'soldier', 'bodyguard', 'metiers'),
  ('douanier', 'agent de sécurité', 'customs officer', 'security guard', 'metiers'),
  -- Transport
  ('chauffeur de bus', 'conducteur de train', 'bus driver', 'train driver', 'metiers'),
  ('chauffeur de taxi', 'ambulancier', 'taxi driver', 'paramedic', 'metiers'),
  ('hôtesse de l''air', 'réceptionniste', 'flight attendant', 'receptionist', 'metiers'),
  -- Science et terrain
  ('chimiste', 'biologiste', 'chemist', 'biologist', 'metiers'),
  ('archéologue', 'géologue', 'archaeologist', 'geologist', 'metiers'),
  ('météorologue', 'astronome', 'meteorologist', 'astronomer', 'metiers'),
  ('apiculteur', 'scaphandrier', 'beekeeper', 'deep-sea diver', 'metiers'),
  -- Ville et services
  ('éboueur', 'balayeur', 'garbage collector', 'street sweeper', 'metiers'),
  -- Médias et spectacle
  ('photographe', 'cameraman', 'photographer', 'cameraman', 'metiers'),
  ('dj', 'animateur radio', 'dj', 'radio host', 'metiers'),
  ('moniteur de ski', 'maître-nageur', 'ski instructor', 'lifeguard', 'metiers'),
  ('clown', 'mime', 'clown', 'mime', 'metiers');
