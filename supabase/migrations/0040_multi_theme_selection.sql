-- L'hôte peut désormais cocher plusieurs thèmes de mots.
--
-- La colonne `rooms.word_theme` contenait un seul identifiant de thème. Elle
-- contient maintenant une liste séparée par des virgules, par exemple
-- « art,nature,sports ». Le type texte suffit, il n'y a donc rien à changer sur
-- la colonne elle-même.
--
-- Reste le cas de la valeur « general ». Elle ne désignait pas le thème Général :
-- le code la traitait comme « pioche dans tous les thèmes », si bien que les
-- 50 paires étiquetées `general` ne sortaient jamais spécifiquement. Cette
-- astuce disparaît, car cocher tous les thèmes fait maintenant la même chose de
-- façon explicite, et Général redevient un thème comme les autres.
--
-- On remplace donc « general » par NULL, que l'application interprète comme
-- « tous les thèmes ». Les salons existants gardent ainsi exactement le
-- comportement qu'ils avaient. La valeur par défaut de la colonne est retirée
-- pour la même raison : un salon créé sans thème doit tous les proposer, pas
-- seulement Général.

alter table public.rooms
  alter column word_theme drop default;

update public.rooms
  set word_theme = null
  where word_theme = 'general';
