-- Personnalités connues : retrait des paires les moins connues, ajout de
-- 20 paires de personnages de film, série et jeu vidéo.
--
-- Comme pour Art, une paire ne tient que si les DEUX personnes sont
-- reconnaissables. Carl Sagan, Rosalind Franklin, Jensen Huang, Bernard Arnault,
-- Carl Lewis, Sam Altman et David Attenborough ne le sont pas assez pour un
-- public français, et entraînent la disparition de leur binôme.
--
-- C'est pourquoi des personnes très connues partent quand même : Marie Curie
-- s'en va avec Rosalind Franklin, Elizabeth II avec Margaret Thatcher, Usain Bolt
-- avec Carl Lewis. Le nom connu ne suffit pas si son binôme ne l'est pas.
--
-- 16 paires sont supprimées ici, et 4 paires d'artistes sont parties vers le
-- thème Art dans la migration 0038, soit 20 retraits au total.
--
-- Le thème accueille maintenant des personnages de fiction en plus des personnes
-- réelles : il devient « les figures que tout le monde reconnaît », réelles ou
-- non. Les personnages retenus n'existent pas déjà dans Pop-Culture, pour éviter
-- qu'un même nom apparaisse dans deux thèmes. Chaque paire réunit deux
-- personnages du même registre, pour que le dessin du Hors-Thème reste crédible :
-- Freddy et Jason sont deux tueurs masqués, Chucky et Annabelle deux poupées
-- maléfiques, Kratos et Master Chief deux guerriers de jeu vidéo.
--
-- Total après migration : 30 personnes réelles + 20 personnages = 50 paires.

delete from public.word_pairs
where theme = 'personnalites'
  and (word_fr_civil, word_fr_hors_theme) in (
    -- Le binôme n'est pas assez connu du public français
    ('stephen hawking', 'carl sagan'),
    ('marie curie', 'rosalind franklin'),
    ('warren buffett', 'bernard arnault'),
    ('jensen huang', 'tim cook'),
    ('mark zuckerberg', 'sam altman'),
    ('usain bolt', 'carl lewis'),
    ('steve irwin', 'david attenborough'),
    ('oprah winfrey', 'ellen degeneres'),
    ('margaret thatcher', 'elizabeth ii'),
    ('joe biden', 'bernie sanders'),
    -- Notoriété trop faible ou trop datée pour les deux noms
    ('angela merkel', 'hillary clinton'),
    ('angelina jolie', 'megan fox'),
    ('rihanna', 'nicki minaj'),
    ('nikola tesla', 'thomas edison'),
    ('serena williams', 'venus williams'),
    ('will smith', 'denzel washington')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Héros d'action (3)
  ('rocky', 'rambo', 'rocky', 'rambo', 'personnalites'),
  ('indiana jones', 'lara croft', 'indiana jones', 'lara croft', 'personnalites'),
  ('neo', 'john wick', 'neo', 'john wick', 'personnalites'),

  -- Détectives (1)
  ('sherlock holmes', 'hercule poirot', 'sherlock holmes', 'hercule poirot', 'personnalites'),

  -- Comédie (1)
  ('forrest gump', 'mr bean', 'forrest gump', 'mr bean', 'personnalites'),

  -- Mafia (1)
  ('don corleone', 'tony soprano', 'don corleone', 'tony soprano', 'personnalites'),

  -- Horreur (4)
  ('hannibal lecter', 'norman bates', 'hannibal lecter', 'norman bates', 'personnalites'),
  ('freddy krueger', 'jason voorhees', 'freddy krueger', 'jason voorhees', 'personnalites'),
  ('chucky', 'annabelle', 'chucky', 'annabelle', 'personnalites'),
  ('pennywise', 'beetlejuice', 'pennywise', 'beetlejuice', 'personnalites'),

  -- Enfance et aventure (2)
  ('tarzan', 'mowgli', 'tarzan', 'mowgli', 'personnalites'),
  ('peter pan', 'pinocchio', 'peter pan', 'pinocchio', 'personnalites'),

  -- Disney (2)
  ('mulan', 'pocahontas', 'mulan', 'pocahontas', 'personnalites'),
  ('maléfique', 'ursula', 'maleficent', 'ursula', 'personnalites'),

  -- Star Wars (2)
  ('dark maul', 'kylo ren', 'darth maul', 'kylo ren', 'personnalites'),
  ('princesse leia', 'rey', 'princess leia', 'rey', 'personnalites'),

  -- Séries (2)
  ('daenerys', 'jon snow', 'daenerys', 'jon snow', 'personnalites'),
  ('eleven', 'wednesday addams', 'eleven', 'wednesday addams', 'personnalites'),

  -- Jeux vidéo (2)
  ('kratos', 'master chief', 'kratos', 'master chief', 'personnalites'),
  ('donkey kong', 'bowser', 'donkey kong', 'bowser', 'personnalites');
