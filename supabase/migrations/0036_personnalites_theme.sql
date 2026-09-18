-- Nouveau thème « Personnalités connues » : 50 paires.
--
-- Principe : deux personnes réelles qui se ressemblent physiquement ou qui
-- exercent dans le même domaine, pour que le dessin du Hors-Thème reste
-- crédible. Scarlett Johansson et Natalie Portman sont régulièrement confondues,
-- Joe Biden et Bernie Sanders sont deux hommes âgés aux cheveux blancs, De Niro
-- et Al Pacino sont indissociables dans l'imaginaire du film de gangsters.
--
-- Au passage, ce thème règle un mélange qui existait dans Pop-Culture : ce
-- dernier contenait 4 paires de personnes réelles (Trump/Musk, Ronaldo/Mbappé,
-- Taylor Swift/Beyoncé, Bezos/Gates) au milieu de personnages de fiction et de
-- marques. Ces 4 paires sont supprimées de Pop-Culture, qui redevient un thème
-- purement fictionnel, et leurs personnalités sont reprises ici correctement
-- appariées. Pop-Culture est ramené à 50 paires par la migration 0037.
--
-- Le choix des personnes reste volontairement grand public et sans jugement :
-- ce sont des figures que tout le monde reconnaît de vue.

delete from public.word_pairs
where theme = 'pop_culture'
  and (word_fr_civil, word_fr_hors_theme) in (
    ('donald trump', 'elon musk'),
    ('ronaldo', 'mbappe'),
    ('taylor swift', 'beyoncé'),
    ('jeff bezos', 'bill gates')
  );

insert into public.word_pairs (word_fr_civil, word_fr_hors_theme, word_en_civil, word_en_hors_theme, theme)
values
  -- Politique (10)
  ('donald trump', 'vladimir poutine', 'donald trump', 'vladimir putin', 'personnalites'),
  ('emmanuel macron', 'justin trudeau', 'emmanuel macron', 'justin trudeau', 'personnalites'),
  ('barack obama', 'nelson mandela', 'barack obama', 'nelson mandela', 'personnalites'),
  ('angela merkel', 'hillary clinton', 'angela merkel', 'hillary clinton', 'personnalites'),
  ('winston churchill', 'charles de gaulle', 'winston churchill', 'charles de gaulle', 'personnalites'),
  ('joe biden', 'bernie sanders', 'joe biden', 'bernie sanders', 'personnalites'),
  ('xi jinping', 'kim jong-un', 'xi jinping', 'kim jong-un', 'personnalites'),
  ('gandhi', 'dalaï-lama', 'gandhi', 'dalai lama', 'personnalites'),
  ('john kennedy', 'martin luther king', 'john kennedy', 'martin luther king', 'personnalites'),
  ('margaret thatcher', 'elizabeth ii', 'margaret thatcher', 'elizabeth ii', 'personnalites'),

  -- Science (5)
  ('albert einstein', 'isaac newton', 'albert einstein', 'isaac newton', 'personnalites'),
  ('stephen hawking', 'carl sagan', 'stephen hawking', 'carl sagan', 'personnalites'),
  ('marie curie', 'rosalind franklin', 'marie curie', 'rosalind franklin', 'personnalites'),
  ('charles darwin', 'sigmund freud', 'charles darwin', 'sigmund freud', 'personnalites'),
  ('nikola tesla', 'thomas edison', 'nikola tesla', 'thomas edison', 'personnalites'),

  -- Technologie et affaires (5)
  ('elon musk', 'jeff bezos', 'elon musk', 'jeff bezos', 'personnalites'),
  ('steve jobs', 'bill gates', 'steve jobs', 'bill gates', 'personnalites'),
  ('mark zuckerberg', 'sam altman', 'mark zuckerberg', 'sam altman', 'personnalites'),
  ('warren buffett', 'bernard arnault', 'warren buffett', 'bernard arnault', 'personnalites'),
  ('jensen huang', 'tim cook', 'jensen huang', 'tim cook', 'personnalites'),

  -- Musique (7)
  ('taylor swift', 'beyoncé', 'taylor swift', 'beyonce', 'personnalites'),
  ('michael jackson', 'prince', 'michael jackson', 'prince', 'personnalites'),
  ('elvis presley', 'johnny hallyday', 'elvis presley', 'johnny hallyday', 'personnalites'),
  ('madonna', 'lady gaga', 'madonna', 'lady gaga', 'personnalites'),
  ('bob marley', 'jimi hendrix', 'bob marley', 'jimi hendrix', 'personnalites'),
  ('freddie mercury', 'david bowie', 'freddie mercury', 'david bowie', 'personnalites'),
  ('rihanna', 'nicki minaj', 'rihanna', 'nicki minaj', 'personnalites'),

  -- Cinéma (7)
  ('leonardo dicaprio', 'brad pitt', 'leonardo dicaprio', 'brad pitt', 'personnalites'),
  ('tom cruise', 'tom hanks', 'tom cruise', 'tom hanks', 'personnalites'),
  ('robert de niro', 'al pacino', 'robert de niro', 'al pacino', 'personnalites'),
  ('scarlett johansson', 'natalie portman', 'scarlett johansson', 'natalie portman', 'personnalites'),
  ('will smith', 'denzel washington', 'will smith', 'denzel washington', 'personnalites'),
  ('angelina jolie', 'megan fox', 'angelina jolie', 'megan fox', 'personnalites'),
  ('jean dujardin', 'omar sy', 'jean dujardin', 'omar sy', 'personnalites'),

  -- Sport (7)
  ('cristiano ronaldo', 'lionel messi', 'cristiano ronaldo', 'lionel messi', 'personnalites'),
  ('kylian mbappé', 'neymar', 'kylian mbappe', 'neymar', 'personnalites'),
  ('michael jordan', 'lebron james', 'michael jordan', 'lebron james', 'personnalites'),
  ('serena williams', 'venus williams', 'serena williams', 'venus williams', 'personnalites'),
  ('roger federer', 'rafael nadal', 'roger federer', 'rafael nadal', 'personnalites'),
  ('usain bolt', 'carl lewis', 'usain bolt', 'carl lewis', 'personnalites'),
  ('zinedine zidane', 'david beckham', 'zinedine zidane', 'david beckham', 'personnalites'),

  -- Art et littérature (4)
  ('pablo picasso', 'salvador dali', 'pablo picasso', 'salvador dali', 'personnalites'),
  ('vincent van gogh', 'claude monet', 'vincent van gogh', 'claude monet', 'personnalites'),
  ('william shakespeare', 'victor hugo', 'william shakespeare', 'victor hugo', 'personnalites'),
  ('frida kahlo', 'andy warhol', 'frida kahlo', 'andy warhol', 'personnalites'),

  -- Télévision et internet (5)
  ('oprah winfrey', 'ellen degeneres', 'oprah winfrey', 'ellen degeneres', 'personnalites'),
  ('kim kardashian', 'paris hilton', 'kim kardashian', 'paris hilton', 'personnalites'),
  ('mrbeast', 'squeezie', 'mrbeast', 'squeezie', 'personnalites'),
  ('gordon ramsay', 'cyril lignac', 'gordon ramsay', 'cyril lignac', 'personnalites'),
  ('steve irwin', 'david attenborough', 'steve irwin', 'david attenborough', 'personnalites');
