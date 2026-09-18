-- Art : retrait des 30 paires les moins connues, ajout de 20 paires d'artistes.
--
-- Une paire ne tient que si les DEUX œuvres sont reconnaissables. Beaucoup de
-- paires étaient bien construites visuellement mais reposaient sur une œuvre que
-- le grand public ne sait pas nommer : La Belle Ferronnière, La Dentellière, Les
-- Ménines, Le Serment des Horaces, Le Garçon au gilet rouge, Les Colonnes de
-- Buren. Le joueur restait bloqué sur le mot, ce qui casse la manche.
--
-- C'est pour cette raison que des œuvres très célèbres partent quand même : La
-- Pietà s'en va avec La Vierge à l'enfant, L'Homme de Vitruve avec La Leçon
-- d'anatomie, La Naissance de Vénus avec Le Printemps. Le mot connu ne suffit
-- pas si son binôme ne l'est pas.
--
-- L'autoportrait de Van Gogh part pour une autre raison : les paires d'artistes
-- ajoutées ci-dessous contiennent Van Gogh et Frida Kahlo en tant que personnes.
-- Garder les deux aurait fait apparaître les mêmes noms sous deux formes.
--
-- Les 4 paires d'artistes rangées à tort dans « Personnalités connues » sont
-- déplacées ici : Picasso, Van Gogh, Frida Kahlo et Shakespeare relèvent du
-- thème Art. Elles comptent dans les 20 paires d'artistes ajoutées, et libèrent
-- 4 places dans Personnalités connues (voir migration 0039).
--
-- Les artistes couvrent volontairement tous les genres : peintres, sculpteurs,
-- compositeurs, photographes de cinéma, architectes et art contemporain. Chaque
-- paire réunit deux artistes de la même époque ou du même courant, pour que le
-- dessin du Hors-Thème reste crédible.
--
-- Total après migration : 20 paires d'œuvres + 20 paires d'artistes = 40 paires.

delete from public.word_pairs
where (theme, word_fr_civil, word_fr_hors_theme) in (
  -- Art : œuvres trop peu connues (30)
  ('art', 'la dame à l''hermine', 'la belle ferronnière'),
  ('art', 'la laitière', 'la dentellière'),
  ('art', 'la grande odalisque', 'la maja nue'),
  ('art', 'la naissance de vénus', 'le printemps de botticelli'),
  ('art', 'autoportrait de van gogh', 'autoportrait de frida kahlo'),
  ('art', 'les nymphéas', 'le pont japonais'),
  ('art', 'la montagne sainte-victoire', 'le mont fuji'),
  ('art', 'le déjeuner sur l''herbe', 'le déjeuner des canotiers'),
  ('art', 'les tricheurs', 'les joueurs de cartes'),
  ('art', 'nighthawks', 'le café de nuit'),
  ('art', 'la ronde de nuit', 'les ménines'),
  ('art', 'la mort de marat', 'le serment des horaces'),
  ('art', 'saturne dévorant son fils', 'le cauchemar'),
  ('art', 'le jardin des délices', 'la tour de babel'),
  ('art', 'american gothic', 'les époux arnolfini'),
  ('art', 'la pietà', 'la vierge à l''enfant'),
  ('art', 'le colosse de rhodes', 'la statue de la liberté'),
  ('art', 'le manneken pis', 'la petite sirène de copenhague'),
  ('art', 'les colonnes de buren', 'la pyramide du louvre'),
  ('art', 'le carré noir de malevitch', 'la composition de mondrian'),
  ('art', 'la femme qui pleure de lichtenstein', 'whaam'),
  ('art', 'les personnages de keith haring', 'les graffitis de basquiat'),
  ('art', 'la chambre à arles', 'la chaise de van gogh'),
  ('art', 'la classe de danse', 'la petite danseuse'),
  ('art', 'le bal du moulin rouge', 'le moulin de la galette'),
  ('art', 'les glaneuses', 'l''angélus'),
  ('art', 'la mosaïque romaine', 'la fresque de pompéi'),
  ('art', 'l''homme de vitruve', 'la leçon d''anatomie'),
  ('art', 'le joueur de fifre', 'le garçon au gilet rouge'),
  ('art', 'les parapluies de renoir', 'la rue de paris temps de pluie'),
  -- Personnalités connues : paires d'artistes déplacées vers Art (4)
  ('personnalites', 'pablo picasso', 'salvador dali'),
  ('personnalites', 'vincent van gogh', 'claude monet'),
  ('personnalites', 'william shakespeare', 'victor hugo'),
  ('personnalites', 'frida kahlo', 'andy warhol')
);

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Paires reprises de « Personnalités connues » (4)
  ('pablo picasso', 'salvador dali', 'pablo picasso', 'salvador dali', 'art'),
  ('vincent van gogh', 'claude monet', 'vincent van gogh', 'claude monet', 'art'),
  ('william shakespeare', 'victor hugo', 'william shakespeare', 'victor hugo', 'art'),
  ('frida kahlo', 'andy warhol', 'frida kahlo', 'andy warhol', 'art'),

  -- Maîtres anciens (2)
  ('léonard de vinci', 'michel-ange', 'leonardo da vinci', 'michelangelo', 'art'),
  ('rembrandt', 'vermeer', 'rembrandt', 'vermeer', 'art'),

  -- Sculpture (1)
  ('auguste rodin', 'camille claudel', 'auguste rodin', 'camille claudel', 'art'),

  -- Musique classique (2)
  ('mozart', 'beethoven', 'mozart', 'beethoven', 'art'),
  ('bach', 'vivaldi', 'bach', 'vivaldi', 'art'),

  -- Impressionnisme et post-impressionnisme (3)
  ('renoir', 'degas', 'renoir', 'degas', 'art'),
  ('cézanne', 'gauguin', 'cezanne', 'gauguin', 'art'),
  ('delacroix', 'géricault', 'delacroix', 'gericault', 'art'),

  -- Modernité (2)
  ('matisse', 'kandinsky', 'matisse', 'kandinsky', 'art'),
  ('gustav klimt', 'egon schiele', 'gustav klimt', 'egon schiele', 'art'),

  -- Art contemporain et street art (3)
  ('keith haring', 'basquiat', 'keith haring', 'basquiat', 'art'),
  ('jeff koons', 'damien hirst', 'jeff koons', 'damien hirst', 'art'),
  ('yayoi kusama', 'niki de saint phalle', 'yayoi kusama', 'niki de saint phalle', 'art'),

  -- Cinéma (2)
  ('steven spielberg', 'quentin tarantino', 'steven spielberg', 'quentin tarantino', 'art'),
  ('charlie chaplin', 'buster keaton', 'charlie chaplin', 'buster keaton', 'art'),

  -- Architecture (1)
  ('antoni gaudi', 'le corbusier', 'antoni gaudi', 'le corbusier', 'art');
